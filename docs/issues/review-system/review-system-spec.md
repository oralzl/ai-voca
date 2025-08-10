
# Vocabulary Review System（LLM-Generated, No-Corpus）

**版本**：v1.0
**作者**：PM（Sira）
**读者**：Coding Agent / 后端 / 前端 / 提示词工程

---

## 1. 项目背景（为什么要做？）

### 1.1 用户问题

* 学词"背-忘-再背"循环严重：只靠卡片记忆容易"脱离语境"。
* 复习任务常被打断：用户难坚持，却又难判断"今天该复习哪些词"。
* 阅读材料不匹配：材料要么过难（生词多），要么过易（目标词接触不到）。

### 1.2 产品愿景

* 用**真实风格但按需生成**的短句/短段，围绕"今天应复习的词"，在可控难度内进行**微阅读**练习。
* 通过**简洁反馈**（不熟 / 困难 / 良好 / 容易 + Too hard/OK/Too easy）形成数据闭环，让系统**越来越懂用户**。
* **AI-native**：不落地语料库，不维护大词表，难度控制主要靠 **LLM 自评 + 用户反馈自适应**。

### 1.3 业务约束

* 迭代速度要快（可 2–3 周上线 MVP）；
* 后续可替换更高级记忆模型（FSRS → 正式 DSR / Ebisu / HLR），但**不改 API**；
* 成本与时延可控：单轮生成，P95 响应时间可控在 1.0–1.5s（依模型而定）。

---

## 2. 设计理念（我们坚持的几条原则）

1. **先把"学哪些词"与"怎么呈现"分离**

   * "学哪些词" = 调度问题 → 交给 **FSRS/DSR**（状态台账 + 简单间隔规则起步）。
   * "怎么呈现" = 难度与风格 → 交给 **LLM 提示词 + 自评 + 用户反馈**。

2. **允许"顺带学习"少量新词**

   * 禁止"镀金"式难词堆砌；但保留 1–2 个高于当前水平、带有简释或更易版本的词，提升真实感与迁移。

3. **"可验证的自然度"而不是"不可控的自由"**

   * 模型自评（predicted CEFR、estimated\_new\_terms\_count）+ 规则阈值 + 兜底处理，形成可审计闭环。

4. **数据即资产**

   * 每次练习都沉淀为事件（时间戳、结果、难度反馈、自评元数据），为后续升级记忆/难度模型准备数据地基。

---

## 3. 方案对比与取舍（关键决策）

| 方案                 | 控制手段      | 成本/复杂度      | 体验风险      | 我们的选择        |
| ------------------ | --------- | ----------- | --------- | ------------ |
| **大语料库选句**         | 检索+过滤+改写  | 高（建库、标注、存储） | 维护压力大     | **否**（非 MVP） |
| **白名单控词表**         | 词表+校验器    | 中（需词形还原/维护） | 句子有时生硬    | **否**（可选备用）  |
| **LLM难度自评 + 用户反馈** | 提示词+自评+兜底 | 低–中         | 需提示词与阈值调优 | **是**（MVP）   |

> 我们选择 **LLM 自评 + 用户反馈** 的路线：
>
> * 更 **AI-native**、工程改动小；
> * 通过 **自评 JSON + 规则阈值** 保证"可控"；
> * 保留"少量新词"的真实感；
> * 未来若需要更强的确定性，再引入白名单作为 **兜底开关**（不破坏现有结构）。

---

## 4. 目标与非目标

**MVP 目标**

* 打通"挑词→生成→自评校验→前端呈现→反馈→回写"的闭环。
* FSRS-lite 能稳定拉长/缩短间隔；用户难度反馈（Too easy/OK/Too hard）能影响下一次生成的"级别与新词预算"。
* 不落地句子，不维护大词表。

**非目标**

* 不做分义项（sense）粒度（见附录升级路径）。
* 不接长篇阅读或段落级理解（先做句级/两句级）。
* 不引入复杂模型训练流程（HLR 等）——积累数据后再上。

---

## 5. 成功指标（验收看什么）

* **学习节奏**：P7D 留存复习用户的平均 `again` 占比下降 ≥ 10%（或稳定在合理阈值）。
* **难度匹配**：Too hard 反馈占比 < 25%，且兜底模板使用率 < 15%。
* **覆盖效率**：目标词命中率（句子中按需出现）≥ 98%。
* **成本/时延**：单轮生成+校验 P95 ≤ 1.5s。
* **稳定性**：/submit 幂等，删词能级联清理状态与事件。

---

## 6. 核心流程（给编码同学的"全景图"）

```
1) 调度选词 (FSRS/DSR)
   - 从 user_word_state 取到期词；不足补未安排词
   - 返回 targets[]（仅字符串词面）

2) 难度控制器
   - 读取 user_review_prefs：level_cefr、unknown_budget、difficulty_bias
   - 基于最近 Too hard/OK/Too easy 调整 target_level_shift 与 budget（EWMA）

3) 生成
   - LLM.generate_items(targets, profile, constraints)
   - 要求返回 self_eval：predicted_cefr、estimated_new_terms_count、new_terms[]

4) 基础校验
   - 规则：目标覆盖、句长范围
   - 不通过 → 直接返回兜底模板句子

5) 呈现与反馈
   - 展示生成的句子
   - 采集：对每个目标词（again/hard/good/easy/unknown），对整句（Too hard/OK/Too easy）

6) 回写
   - review_events：写入事件 + 自评元数据、delivery_id
   - user_word_state：fsrsUpdate（更新熟练度与 next_due_at）
   - user_review_prefs：依据整句反馈更新 difficulty_bias/unknown_budget
```

---

## 7. 数据与接口（只列最关键，详细 DDL/API 见实现文档）

* **表**：

  * `user_favorites`（已存在，收藏词）
  * `user_word_state`（台账：familiarity、last\_seen\_at、next\_due\_at…）
  * `review_events`（日记：event/result/latency/meta）
  * `user_review_prefs`（用户级难度偏好：level\_cefr、unknown\_budget、difficulty\_bias…）

* **API**：

  * `GET /review/candidates` → `{ targets[], profile, constraints, delivery_id }`
  * `POST /review/submit` → `{ updates[] }`（写事件、更新状态、调偏置）

* **LLM 工具**：

  * `generate_items`（必须覆盖 targets，返回 self\_eval）

---

## 8. 为什么 FSRS/DSR 要现在就接？

* **决定"学哪些词/何时再看"**：难度控制再好，若调度错了（该复习的不复习），长期效果也差。
* **实现简单**：先用 FSRS-lite 的间隔表（1,3,7,14,30,60）起步，后续把 `fsrsUpdate` 的内部替换为正式 DSR，不改接口。
* **与难度控制解耦**：FSRS 只负责**时间**，LLM 负责**句子**，互不影响迭代节奏。

---

## 9. 关键设计问题的回答（避免理解偏差）

**Q1：不使用白名单，会不会失控？**
A：通过 **模型自评 + 规则校验 + 兜底处理** 形成闭环；再加"Too hard"用户反馈驱动的 **EWMA 难度微调**，不会失控。必要时可以打开"白名单兜底"开关（可选实现，不影响现有结构）。

**Q2：句子太简单/太生硬怎么办？**
A：允许 **unknown\_budget=1\~2** 的新词，且提供兜底模板句子，保证自然度与可读性兼顾。

**Q3：为什么不做分义项（sense）？**
A：MVP 优先验证闭环有效性与用户留存；分义项会成倍提高工程复杂度。我们在附录给出**平滑升级路径**（加 `sense_key` 列，不改现有 API）。

**Q4：用户水平从哪里来？**
A：用户设置 + 模型从上下文与历史表现推断（可在 `/candidates` 中返回前次 `predicted_cefr` 的滚动统计作为参考），最终由 **difficulty\_bias** 自适应微调。

---

## 10. 风险与缓解

| 风险          | 现象             | 缓解                                                       |
| ----------- | -------------- | -------------------------------------------------------- |
| 模型偶发超预算     | 自评新词数>预算       | 直接返回兜底模板句子                                        |
| 句子不自然/逻辑跳跃  | 用户 Too hard/奇怪 | 优化兜底模板，并记录 `variant_used` |
| 用户长时间未学     | 到期词堆积          | `/candidates` 控制每天最大新词；优先到期项                             |
| 成本/时延上升     | P95>1.5s       | 限制每轮 items 数量；必要时降模型档                           |
| 数据漂移（提示词失效） | 兜底使用率上升    | 监控指标告警；A/B 提示词；灰度回滚                                      |
| 隐私          | 训练材料泄漏担忧       | 不发 PII；仅发 targets/约束；事件与偏好仅存本库                           |

---

## 11. 里程碑（工程拆解）

**Sprint 1：基础台账 + FSRS-lite + /submit**

* 表迁移：`user_word_state`、`review_events`、`user_review_prefs`
* `fsrsUpdate`（默认间隔表）
* `POST /review/submit`（写事件、更新状态）
* 单元测试（fsrs、submit）

**Sprint 2：/candidates + 生成闭环**

* `GET /review/candidates`（targets + profile + constraints + delivery\_id）
* LLM：`generate_items`；Zod/JSON 校验
* 基础校验器：目标覆盖/句长
* 前端：句子展示；Too hard/OK/Too easy 反馈
* E2E 流程测试

**Sprint 3：可观察性 + 速率限制 + 灰度**

* 事件元数据：`predicted_cefr`、`est_new_terms`、`model_version`、`prompt_hash`
* 指标面板与告警：Too hard 占比、兜底使用率、自评 vs 真实不熟数差值
* 限流与幂等；灰度开关（禁用顺带学习）

---

## 12. Coding agent 的关键交付物（Checklist）

* [ ] SQL 迁移（3 张表 & 类型）
* [ ] `fsrsUpdate(prev, rating, now)`（TS 实现 + 测试）
* [ ] `/review/submit`（写事件、调度更新、验收测试）
* [ ] `/review/candidates`（目标/偏好/约束/交付ID）
* [ ] `llm/tools.ts`（`generate_items` 调用封装 + Schema 校验）
* [ ] `validator.ts`（基础规则校验）
* [ ] `difficulty.ts`（EWMA 调节与 budget 计算）
* [ ] 前端交互（句子展示 + 一键难度反馈）
* [ ] 观测埋点（events.meta 字段）与速率限制

---

## 13. 验收用例（面向 PM/UAT）

1. **基础闭环**

   * 收藏 3 词：offset / adequate / staggering
   * `/candidates` 返回 3 词 + profile（B1、budget=2）
   * 生成句子自评：新词=2
   * 用户对 offset=good、staggering=unknown；整句反馈 Too hard
   * `/submit` 返回 `user_word_state` 更新成功；`user_review_prefs.difficulty_bias` 上调

2. **兜底与回退**

   * 模型不可用 → 返回模板句（兜底文本，不落地）
   * 校验失败 → 直接返回兜底模板句子

---

## 14. 升级路径（非 MVP）

* **Sense 粒度**：在 `user_word_state`、`review_events` 增加 `sense_key`，主键变 `(user_id, word, sense_key)`；`targets` 改为对象 `{word, sense_key, gloss}`。
* **记忆模型**：把 `fsrsUpdate` 内核替换为 DSR/FSRS 正式实现；之后引入 Ebisu/HLR 作为概率层，用于更精细的难度与排序。
* **段落级阅读**：生成 3–5 句小段落，目标词分布控制 + 每句自评 + 段落整体 CEFR 自评。
* **白名单兜底**（可选）：在配置中加入开关；当 Too hard 超阈值或兜底使用率高时自动启用。

---

## 15. 附：提示词要点（给提示词工程）

* 角色：英语句子练习器；输入为 `targets[] / level_cefr / unknown_budget / style / sentence_length_range`。
* 输出：严格 JSON：`items[].text`、`targets[]`（词与起止 token）、`self_eval.{predicted_cefr, estimated_new_terms_count, new_terms[]}`。
* 约束：覆盖所有目标词；长度符合范围；不涉敏感话题；允许少量新词但不超过预算。

---

> **结论**：本方案以**最小代价**达成"个性化、可控、可扩展"的复习体验。
> Coding agent 请按本文件与《实现规范 + 接口细节》执行，先交付 Sprint 1–2 的 MVP，随后进入 Sprint 3 做稳定性与监控。若需要，我可以把完整的提示词模板与 Zod Schema 一并生成到仓库指定目录。
