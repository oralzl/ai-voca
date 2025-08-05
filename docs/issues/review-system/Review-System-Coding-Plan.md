

# Review System (LLM-Generated Sentences) — Coding Plan

## 0. TL;DR（给 Agent 的待办清单）

* [ ] 执行数据库迁移：`user_word_state`、`review_events`、`user_review_prefs`
* [ ] 实现调度内核接口 `fsrsUpdate(prev, rating, now)`（先用 FSRS-lite）
* [ ] REST API：`GET /review/candidates`、`POST /review/submit`
* [ ] LLM 工具：`generate_items`（简化版，无 revise）
* [ ] 基础校验器：目标词覆盖 / 基础句长检查
* [ ] 反馈闭环：更新 `difficulty_bias` 与 `unknown_budget`（EWMA）
* [ ] 事件埋点与幂等（`delivery_id`）+ 速率限制 + RLS

---

## 1. 架构与数据流

```
[DB:user_favorites] ─┐
                     ├─(调度)─> targets[] ───────┐
[DB:user_word_state] ┘                           │
                                                  v
                                     [Difficulty Controller]
                                     (level_cefr + budget 调节)
                                                  │
                                                  v
                                [LLM.generate_items -> 自评]
                                                  │
                                                  v
                                       [基础校验/兜底处理]
                                                  │
                                                  v
                                       [前端呈现 + 快速难度反馈]
                                                  │
                                                  v
                             POST /review/submit -> 写 review_events
                                      │              + 调 fsrsUpdate
                                      v
                          更新 user_word_state + user_review_prefs
```

---

## 2. 目录结构（建议）

```
/packages/review-engine/
  /db/
    migrations/
      001_user_word_state.sql
      002_review_events.sql
      003_user_review_prefs.sql
  /core/
    fsrs.ts                 # fsrsUpdate 接口 + FSRS-lite 默认实现
    difficulty.ts           # 难度控制/EWMA 调节
    validator.ts            # 基础规则校验
    types.ts                # 公共类型定义
  /llm/
    tools.ts                # generate_items 调用封装
    prompts/
      generate_items.md     # 提示词模板（简化版）
    schemas.ts              # LLM 输入输出的 Zod/JSON Schema
  /api/
    candidates.get.ts       # GET /review/candidates
    submit.post.ts          # POST /review/submit
  /constants/
    cefr.ts                 # 等级映射、长度范围默认
    filters.ts              # 主题黑名单/正则
  /tests/
    fsrs.test.ts
    difficulty.test.ts
    e2e.review.flow.test.ts
```

---

## 3. 数据库（Postgres / Supabase）

**（已存在）**`public.user_favorites`：保持不变。

**新增：词状态台账（调度依据）**

```sql
CREATE TABLE public.user_word_state (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word VARCHAR(100) NOT NULL,
  familiarity SMALLINT NOT NULL DEFAULT 0,  -- 0..5
  difficulty REAL NOT NULL DEFAULT 2.5,     -- DSR 预留
  stability REAL,                           -- DSR 预留（天）
  recall_p REAL,                            -- 预留
  successes INT NOT NULL DEFAULT 0,
  lapses INT NOT NULL DEFAULT 0,
  last_seen_at TIMESTAMPTZ,
  next_due_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, word),
  FOREIGN KEY (user_id, word)
    REFERENCES public.user_favorites(user_id, word) ON DELETE CASCADE
);
CREATE INDEX idx_user_word_state_due ON public.user_word_state (user_id, next_due_at);
```

**新增：复习事件日记**

```sql
CREATE TYPE review_event_type AS ENUM ('read', 'quiz', 'mark_unknown');
CREATE TYPE review_result     AS ENUM ('again', 'hard', 'good', 'easy', 'unknown');

CREATE TABLE public.review_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word VARCHAR(100) NOT NULL,
  event_type review_event_type NOT NULL,
  result review_result,
  latency_ms INT,
  meta JSONB,                           -- {delivery_id, predicted_cefr, est_new_terms, variant}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (user_id, word)
    REFERENCES public.user_favorites(user_id, word) ON DELETE CASCADE
);
CREATE INDEX idx_review_events_user_time ON public.review_events (user_id, created_at DESC);
```

**新增：用户难度偏好**

```sql
CREATE TABLE public.user_review_prefs (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  level_cefr TEXT DEFAULT 'B1',
  allow_incidental BOOLEAN DEFAULT TRUE,
  unknown_budget SMALLINT DEFAULT 2,       -- 每句允许新词数
  style TEXT DEFAULT 'neutral',
  difficulty_bias REAL DEFAULT 0.0,        -- EWMA 偏置
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. 类型与接口（TypeScript 摘要）

```ts
// types.ts
export type Rating = 'again'|'hard'|'good'|'easy'|'unknown';

export interface WordState {
  familiarity: number; difficulty: number;
  stability?: number; recall_p?: number;
  successes: number; lapses: number;
  last_seen_at?: string; next_due_at?: string;
}

export interface UserPrefs {
  level_cefr: 'A1'|'A2'|'B1'|'B2'|'C1'|'C2';
  allow_incidental: boolean;
  unknown_budget: number;     // 0..4
  style: 'neutral'|'news'|'dialog'|'academic';
  difficulty_bias: number;    // -1.5..+1.5
}

export interface GenerateItemsInput {
  targets: string[];
  profile: UserPrefs;
  constraints: {
    sentence_length_range: [number, number];
    max_targets_per_sentence: number;
  };
}

export interface GeneratedItem {
  sid: string;
  text: string;
  targets: {word: string; begin: number; end: number;}[];
  self_eval: {
    predicted_cefr: UserPrefs['level_cefr'];
    estimated_new_terms_count: number;
    new_terms?: {surface: string; cefr: UserPrefs['level_cefr']; gloss: string;}[];
    reason?: string;
  };
}
```

---

## 5. 调度与难度控制

### 5.1 FSRS 接口（可替换内核）

```ts
// fsrs.ts
export function fsrsUpdate(prev: WordState, rating: Rating, now: Date): { next: WordState } {
  // FSRS-lite：MVP 间隔映射（天）：[1,3,7,14,30,60]
  const intervals = [1,3,7,14,30,60];
  const f = prev.familiarity ?? 0;
  let nf = f;
  if (rating === 'again' || rating === 'unknown') nf = Math.max(0, f-1);
  else if (rating === 'good' || rating === 'easy') nf = Math.min(5, f+1);
  // hard: nf = f
  const days = intervals[nf];
  const next_due_at = new Date(now.getTime() + days*86400000).toISOString();
  return {
    next: {
      ...prev,
      familiarity: nf,
      last_seen_at: now.toISOString(),
      next_due_at,
      successes: (prev.successes||0) + (rating==='good'||rating==='easy'?1:0),
      lapses: (prev.lapses||0) + (rating==='again'||rating==='unknown'?1:0),
    }
  };
}
```

### 5.2 难度自适应（无词表）

```ts
// difficulty.ts
export function adjustLevelAndBudget(p: UserPrefs, feedback: 'too_easy'|'ok'|'too_hard'|null) {
  const map = {too_easy:-1, ok:0, too_hard:+1} as const;
  const delta = feedback ? map[feedback] : 0;
  const bias = Math.max(-1.5, Math.min(1.5, 0.7*p.difficulty_bias + 0.3*delta));
  const levelShift = Math.round(bias);              // -1/0/+1 档
  const budget = Math.max(0, Math.min(4, p.unknown_budget + levelShift));
  return { difficulty_bias: bias, target_level_shift: levelShift, budget };
}
```

---

## 6. LLM 工具与提示词

### 6.1 `generate_items`（简化版）

* **输入**：`GenerateItemsInput`
* **输出**：`{ items: GeneratedItem[] }`
* **提示词要点**：

  * 覆盖所有 `targets`；总句长在范围内；风格 = `profile.style`
  * 整体难度约等于 `profile.level_cefr`（可有少量更高阶词，新词数 ≤ `profile.unknown_budget`）
  * 返回 **Self-Eval**：`predicted_cefr`、`estimated_new_terms_count`、`new_terms[]`（词面/估计级别/简释）

> **实现**：封装到 `llm/tools.ts`，对接你使用的 LLM（OpenAI/本地模型均可）。
> **Schema**：用 Zod 校验 LLM 返回，失败直接返回兜底模板。

---

## 7. 基础校验器（简化版）

* **目标词覆盖**：所有 `targets` 必须出现一次
* **句长范围**：`constraints.sentence_length_range`
* **失败处理**：直接返回兜底模板句子

```ts
// validator.ts
export function validateBasicRequirements(
  output: GenerateItemsOutput, 
  input: GenerateItemsInput
): { isValid: boolean; reason?: string } {
  // 1. 目标词必须覆盖
  const missingTargets = checkTargetCoverage(output, input.targets);
  if (missingTargets.length > 0) {
    return { isValid: false, reason: `missing_targets: ${missingTargets.join(',')}` };
  }
  
  // 2. 基础长度检查
  const lengthOk = checkBasicLength(output, input.constraints);
  if (!lengthOk) {
    return { isValid: false, reason: 'length_out_of_range' };
  }
  
  return { isValid: true };
}

// 简化的生成流程
export async function generateWithFallback(input: GenerateItemsInput): Promise<GenerateItemsOutput> {
  try {
    const result = await generateItems(input);
    const validation = validateBasicRequirements(result, input);
    
    if (validation.isValid) {
      return result;
    }
    
    // 直接返回兜底方案
    return getFallbackTemplates(input.targets);
    
  } catch (error) {
    // LLM 服务异常，直接返回兜底
    return getFallbackTemplates(input.targets);
  }
}
```

---

## 8. REST API

### 8.1 `GET /review/candidates`

* **query**：`n=15`（默认）
* **逻辑**：

  1. 从 `user_word_state` 选 `next_due_at<=now` 的词，不足则补 `next_due_at IS NULL` 的收藏词
  2. 读取 `user_review_prefs`，产出 `profile`；根据近期反馈微调（`difficulty_bias`）
  3. 返回 `targets[]` + `profile` + `constraints` + `delivery_id`
* **响应**：

```json
{
  "targets":["offset","staggering","adequate"],
  "profile":{"level_cefr":"B1","allow_incidental":true,"unknown_budget":2,"style":"neutral","difficulty_bias":0.0},
  "constraints":{"sentence_length_range":[12,22],"max_targets_per_sentence":2},
  "delivery_id":"uuid-xxxx"
}
```

### 8.2 `POST /review/submit`

* **body**：

```json
{
  "delivery_id":"uuid-xxxx",
  "events":[
    {"word":"offset","event_type":"read","result":"good","latency_ms":3200},
    {"word":"staggering","event_type":"read","result":"unknown"}
  ],
  "reading_feedback":"too_hard"  // 可空
}
```

* **处理**：

  * 插入 `review_events`（把自评元数据也写到 `meta`）
  * 调 `fsrsUpdate` 更新 `user_word_state`
  * 若 `reading_feedback` 存在：用 `adjustLevelAndBudget` 更新 `user_review_prefs`
* **响应**：

```json
{"updates":[
  {"word":"offset","familiarity":3,"next_due_at":"2025-08-05T10:00:00Z"},
  {"word":"staggering","familiarity":0,"next_due_at":"2025-08-03T10:00:00Z"}
]}
```

> **幂等**：服务端可按 `delivery_id` + `(word,event_type)` 去重。
> **权限**：所有查询按 `user_id`（RLS/中间件）收敛。

---

## 9. 前端/交互要点（接口依赖）

* 展示 `items[0]` 的 `text`
* 采集快速难度反馈：Too easy / OK / Too hard（上传 `reading_feedback`）
* 用户对目标词勾选"不熟"→ 映射为 `result='unknown'`；无勾选视作 `good`

---

## 10. 观测与风控

* `review_events.meta`：建议写入

  * `delivery_id`、`predicted_cefr`、`estimated_new_terms_count`、`model_version`、`prompt_hash`
* 指标：

  * 句子"自评新词数"与"用户标注不熟数"的差（自评校准）
  * `reading_feedback` 分布
  * 兜底模板使用率
* 速率限制：`/candidates`、`/submit` 各加限流
* 主题过滤：`constants/filters.ts` 维护黑名单

---

## 11. 测试与验收

### 单元测试

* `fsrs.test.ts`：again 降熟/近间隔；good 升熟/长间隔
* `difficulty.test.ts`：EWMA 规则对 bias 与 budget 的调节
* `validator.test.ts`：目标覆盖/句长检查

### 集成测试（e2e.review\.flow\.test.ts）

1. 收藏 `["offset","staggering"]`；无状态时 `/candidates` 能返回 targets + profile
2. 模拟生成返回（含自评）→ 基础校验通过
3. `POST /submit`：一词 `unknown`、一词 `good`，断言 `review_events` 写入、`user_word_state` 更新、`user_review_prefs.difficulty_bias` 上调

### 验收标准（MVP）

* 能稳定获取候选词与生成句子；
* 基础校验能正常工作；
* FSRS-lite 正常延长/缩短间隔；
* 难度反馈能影响下一次预算/等级；
* 删除收藏能级联清理状态与事件。

---

## 12. 里程碑拆分

**Sprint 1（后端基础）**

* 迁移三张表
* `fsrsUpdate` + `/submit`（写事件、更新状态）
* `/candidates`（不接 LLM，先返回固定 mock）

**Sprint 2（LLM 集成）**

* `generate_items` 封装 + Zod 校验
* 基础校验器 + 兜底处理
* 前端展示 + 难度反馈上传

**Sprint 3（稳态与监控）**

* 自评与用户标注对齐监控面板
* 幂等与速率限制
* 兜底模板优化

---

## 13. 回退与扩展

* **回退**：LLM 故障 → 返回"备选模板句子"（本地兜底）
* **扩展**：未来要分义项（sense）→ 给 `user_word_state`、`review_events` 增加 `sense_key`，其余流程不变

---

### 附：提示词模板（简化版，填到 `/llm/prompts/generate_items.md`）

* 角色：生成英语句子练习器
* 目标：覆盖所有 `targets`，整体难度≈`{{level_cefr}}`，**允许的新词数 ≤ {{unknown\_budget}}**
* 返回严格 JSON：`items[].text`、`targets[]`、`self_eval.predicted_cefr`、`self_eval.estimated_new_terms_count`、`self_eval.new_terms[]`
* 简化要求：专注于生成符合要求的句子，不需要复杂的备选方案

---

**说明**：本方案不依赖白名单词表；难度通过 **CEFR + 预算 + 自评 + 用户反馈** 控制。FSRS/DSR 仅负责"挑词与定间隔"。
Coding agent 按本文件逐项实现与勾验即可交付 MVP。需要我把提示词文件与 Zod Schema 直接生成到具体路径吗？我可以按你仓库结构补齐样板文件名与内容。
