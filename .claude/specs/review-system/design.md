# Vocabulary Review System 设计文档

## 概述

Vocabulary Review System是一个基于LLM生成的个性化词汇复习系统，采用AI-native的设计理念，通过FSRS算法调度复习计划，LLM生成个性化句子，用户反馈形成数据闭环。系统将"学哪些词"与"怎么呈现"分离，实现可控的难度自适应。

## 架构设计

### 整体架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端界面       │    │   后端API       │    │   数据库        │
│                 │    │                 │    │                 │
│ - 句子展示      │◄──►│ - 候选词获取    │◄──►│ - user_favorites│
│ - 反馈收集      │    │ - 复习提交      │    │ - user_word_state│
│ - 难度反馈      │    │ - 状态更新      │    │ - review_events │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   LLM服务       │
                       │                 │
                       │ - 句子生成      │
                       │ - 自评校验      │
                       │ - 难度控制      │
                       └─────────────────┘
```

### 核心组件

1. **调度引擎**：基于FSRS算法管理词汇复习间隔
2. **难度控制器**：根据用户反馈调整生成参数
3. **LLM生成器**：生成包含目标词汇的自然句子
4. **校验器**：验证生成内容的质量和合规性
5. **事件记录器**：记录复习历史和用户反馈

## 数据模型

### 数据库表设计

#### 1. user_word_state（词汇状态台账）

```sql
CREATE TABLE public.user_word_state (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word VARCHAR(100) NOT NULL,
  familiarity SMALLINT NOT NULL DEFAULT 0,  -- 0..5，熟悉度等级
  difficulty REAL NOT NULL DEFAULT 2.5,     -- DSR预留字段
  stability REAL,                           -- DSR预留字段（天）
  recall_p REAL,                            -- DSR预留字段
  successes INT NOT NULL DEFAULT 0,         -- 成功次数
  lapses INT NOT NULL DEFAULT 0,            -- 失败次数
  last_seen_at TIMESTAMPTZ,                 -- 最后复习时间
  next_due_at TIMESTAMPTZ,                  -- 下次复习时间
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, word),
  FOREIGN KEY (user_id, word)
    REFERENCES public.user_favorites(user_id, word) ON DELETE CASCADE
);
```

#### 2. review_events（复习事件日记）

```sql
CREATE TYPE review_event_type AS ENUM ('read', 'quiz', 'mark_unknown');
CREATE TYPE review_result AS ENUM ('again', 'hard', 'good', 'easy', 'unknown');

CREATE TABLE public.review_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word VARCHAR(100) NOT NULL,
  event_type review_event_type NOT NULL,
  result review_result,
  latency_ms INT,                           -- 响应延迟
  meta JSONB,                               -- 元数据：delivery_id, predicted_cefr, est_new_terms, variant
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (user_id, word)
    REFERENCES public.user_favorites(user_id, word) ON DELETE CASCADE
);
```

#### 3. user_review_prefs（用户难度偏好）

```sql
CREATE TABLE public.user_review_prefs (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  level_cefr TEXT DEFAULT 'B1',             -- CEFR等级
  allow_incidental BOOLEAN DEFAULT TRUE,    -- 是否允许顺带学习
  unknown_budget SMALLINT DEFAULT 2,        -- 每句允许新词数
  style TEXT DEFAULT 'neutral',             -- 生成风格
  difficulty_bias REAL DEFAULT 0.0,         -- EWMA偏置
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 核心类型定义

```typescript
// 复习结果类型
export type Rating = 'again' | 'hard' | 'good' | 'easy' | 'unknown';

// 词汇状态
export interface WordState {
  familiarity: number;      // 熟悉度 0-5
  difficulty: number;       // 难度 1-5
  stability?: number;       // 稳定性（天）
  recall_p?: number;        // 回忆概率
  successes: number;        // 成功次数
  lapses: number;           // 失败次数
  last_seen_at?: string;    // 最后复习时间
  next_due_at?: string;     // 下次复习时间
}

// 用户偏好
export interface UserPrefs {
  level_cefr: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  allow_incidental: boolean;
  unknown_budget: number;   // 0-4
  style: 'neutral' | 'news' | 'dialog' | 'academic';
  difficulty_bias: number;  // -1.5 到 +1.5
}

// 生成输入
export interface GenerateItemsInput {
  targets: string[];        // 目标词汇列表
  profile: UserPrefs;       // 用户偏好
  constraints: {
    sentence_length_range: [number, number];  // 句长范围
    max_targets_per_sentence: number;         // 每句最大目标词数
  };
}

// 生成输出
export interface GeneratedItem {
  sid: string;              // 句子ID
  text: string;             // 生成的句子
  targets: {                // 目标词位置
    word: string;
    begin: number;
    end: number;
  }[];
  self_eval: {              // 自评结果
    predicted_cefr: UserPrefs['level_cefr'];
    estimated_new_terms_count: number;
    new_terms?: {           // 新词汇列表
      surface: string;
      cefr: UserPrefs['level_cefr'];
      gloss: string;
    }[];
    reason?: string;        // 生成理由
  };
}
```

## 组件和接口

### 1. 调度引擎（FSRS）

```typescript
// fsrs.ts
export function fsrsUpdate(prev: WordState, rating: Rating, now: Date): { next: WordState } {
  // FSRS-lite：MVP间隔映射（天）：[1,3,7,14,30,60]
  const intervals = [1, 3, 7, 14, 30, 60];
  const f = prev.familiarity ?? 0;
  let nf = f;
  
  // 根据反馈调整熟悉度
  if (rating === 'again' || rating === 'unknown') {
    nf = Math.max(0, f - 1);
  } else if (rating === 'good' || rating === 'easy') {
    nf = Math.min(5, f + 1);
  }
  // hard: nf = f
  
  const days = intervals[nf];
  const next_due_at = new Date(now.getTime() + days * 86400000).toISOString();
  
  return {
    next: {
      ...prev,
      familiarity: nf,
      last_seen_at: now.toISOString(),
      next_due_at,
      successes: (prev.successes || 0) + (rating === 'good' || rating === 'easy' ? 1 : 0),
      lapses: (prev.lapses || 0) + (rating === 'again' || rating === 'unknown' ? 1 : 0),
    }
  };
}
```

### 2. 难度控制器

```typescript
// difficulty.ts
export function adjustLevelAndBudget(
  p: UserPrefs, 
  feedback: 'too_easy' | 'ok' | 'too_hard' | null
): { difficulty_bias: number; target_level_shift: number; budget: number } {
  const map = { too_easy: -1, ok: 0, too_hard: +1 } as const;
  const delta = feedback ? map[feedback] : 0;
  
  // EWMA算法平滑处理
  const bias = Math.max(-1.5, Math.min(1.5, 0.7 * p.difficulty_bias + 0.3 * delta));
  const levelShift = Math.round(bias);  // -1/0/+1档
  const budget = Math.max(0, Math.min(4, p.unknown_budget + levelShift));
  
  return { difficulty_bias: bias, target_level_shift: levelShift, budget };
}

// 根据用户反馈校准预算估计
export function calibrateBudgetEstimation(
  estimatedNewTerms: number,
  actualUnknownWords: number, // 用户标记为unknown的词汇数量
  currentBudget: number
): { adjustedBudget: number; accuracy: number } {
  const accuracy = estimatedNewTerms > 0 ? actualUnknownWords / estimatedNewTerms : 1;
  
  // 根据准确性调整预算
  let adjustedBudget = currentBudget;
  if (accuracy > 1.5) {
    // 实际新词比估计多50%以上，降低预算
    adjustedBudget = Math.max(0, currentBudget - 1);
  } else if (accuracy < 0.5) {
    // 实际新词比估计少50%以上，增加预算
    adjustedBudget = Math.min(4, currentBudget + 1);
  }
  
  return { adjustedBudget, accuracy };
}
```

### 3. LLM生成器

```typescript
// llm/tools.ts
export async function generateItems(input: GenerateItemsInput): Promise<GenerateItemsOutput> {
  const prompt = buildPrompt(input);
  const response = await callLLM(prompt);
  
  try {
    const result = parseGenerateItemsJSON(response);
    return result;
  } catch (error) {
    throw new Error(`LLM生成失败: ${error.message}`);
  }
}

// 重试机制
export async function generateWithRetry(
  input: GenerateItemsInput, 
  maxRetries: number = 3
): Promise<GenerateItemsOutput> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await generateItems(input);
    } catch (error) {
      if (i === maxRetries - 1) {
        throw new Error(`生成失败，已重试${maxRetries}次: ${error.message}`);
      }
      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error('生成失败');
}
```

### 4. 基础校验器

```typescript
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

function checkTargetCoverage(output: GenerateItemsOutput, targets: string[]): string[] {
  const text = output.items.map(i => i.text).join(" ").toLowerCase();
  return targets.filter(target => !text.includes(target.toLowerCase()));
}

// 预算检查函数（用于监控和分析，不在基础校验中使用）
function checkBudget(
  output: GenerateItemsOutput, 
  unknownBudget: number
): { isWithinBudget: boolean; estimatedCount: number; confidence: 'high' | 'medium' | 'low' } {
  const estimatedCount = output.items.reduce(
    (sum, item) => sum + (item.self_eval?.estimated_new_terms_count || 0), 
    0
  );
  
  return {
    isWithinBudget: estimatedCount <= unknownBudget,
    estimatedCount,
    confidence: 'medium' // LLM自评的置信度，实际准确性需要用户反馈验证
  };
}
```

### 5. LLM提示词设计

```typescript
// llm/prompts/generate_items.md
const generateItemsPrompt = `
# SYSTEM
You are an English sentence generator for vocabulary review. 
You must produce short, natural English text that includes ALL target words. 
You must control difficulty by CEFR level and limit the number of potentially new terms.
Return STRICT JSON ONLY that matches the provided schema. DO NOT include any extra commentary.

# DEVELOPER
Goals:
- Include every target word once (or at most once) in contextually correct usage.
- Overall difficulty ~= {{profile.level_cefr}} (consider {{profile.difficulty_bias}} as a soft signal).
- Allow incidental learning ONLY if {{profile.allow_incidental}} is true, with at most {{profile.unknown_budget}} potentially-new terms.
- Respect style: {{profile.style}}.
- Respect length: total tokens between {{constraints.sentence_length_range.0}} and {{constraints.sentence_length_range.1}}; ≤ {{constraints.max_targets_per_sentence}} targets per sentence.
- Avoid sensitive topics: politics, explicit sexual content, hate, self-harm, illegal acts, personal data.

Definitions:
- "Potentially-new terms" = words that are likely above {{profile.level_cefr}}. You will self-estimate them and list them in new_terms[] with a brief gloss.
- Token boundaries: split on whitespace and punctuation. Use simple, human-intuitive tokenization.
- For each target occurrence, return its token span [begin, end] (inclusive indices) in the final \`text\`. If uncertain, keep begin=end at the main head token.

Output Contract:
- Return JSON with:
  {
    "items": [
      {
        "sid": "string",
        "text": "string",
        "targets": [{"word":"string","begin":number,"end":number}, ...],
        "self_eval": {
          "predicted_cefr": "A1|A2|B1|B2|C1|C2",
          "estimated_new_terms_count": number,
          "new_terms": [{"surface":"string","cefr":"A1|A2|B1|B2|C1|C2","gloss":"short plain-English meaning"}],
          "reason": "short justification"
        }
      }
    ]
  }

Hard Requirements:
- Include ALL targets: {{targets | json}}.
- Use each target in a natural, common sense; avoid obscure idioms or rare collocations.
- Keep overall style: {{profile.style}}.
- Keep length within {{constraints.sentence_length_range.0}}..{{constraints.sentence_length_range.1}} tokens.
- Focus on generating high-quality, natural sentences that meet the requirements.

Examples for style (not to copy verbatim):
- neutral: everyday neutral tone, clear and concise.
- news: informative, objective.
- dialog: simple two-person exchange, clearly marked turns.
- academic: formal but plain; avoid heavy jargon.

# USER
Targets: {{targets | json}}

Profile:
{{profile | json}}

Constraints:
{{constraints | json}}

Return STRICT JSON ONLY.
`;

// 提示词构建函数
export function buildPrompt(input: GenerateItemsInput): string {
  return generateItemsPrompt
    .replace('{{targets | json}}', JSON.stringify(input.targets))
    .replace('{{profile | json}}', JSON.stringify(input.profile))
    .replace('{{constraints | json}}', JSON.stringify(input.constraints))
    .replace('{{profile.level_cefr}}', input.profile.level_cefr)
    .replace('{{profile.difficulty_bias}}', input.profile.difficulty_bias.toString())
    .replace('{{profile.allow_incidental}}', input.profile.allow_incidental.toString())
    .replace('{{profile.unknown_budget}}', input.profile.unknown_budget.toString())
    .replace('{{profile.style}}', input.profile.style)
    .replace('{{constraints.sentence_length_range.0}}', input.constraints.sentence_length_range[0].toString())
    .replace('{{constraints.sentence_length_range.1}}', input.constraints.sentence_length_range[1].toString())
    .replace('{{constraints.max_targets_per_sentence}}', input.constraints.max_targets_per_sentence.toString());
}
```

## 前端界面设计

> **🎨 重要提醒：所有新页面组件必须严格遵循 [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) 设计系统！**
> 
> **设计系统要求：**
> - ✅ **使用语义化颜色标记** (`text-primary`, `bg-muted`, `border-border`)
> - ✅ **移动优先的响应式设计** (`text-base sm:text-lg`, `p-4 sm:p-6`)
> - ✅ **应用玻璃拟态效果** (`glass`, `backdrop-blur-sm`)
> - ✅ **添加悬停动画效果** (`hover-lift`, `hover-scale`)
> - ✅ **使用Tailwind间距系统** (`space-y-4`, `gap-6`)
> - ❌ **禁止使用直接颜色值** (`text-blue-500`, `bg-red-100`)
> - ❌ **禁止破坏语义化颜色系统**
> 
> **组件开发规范：**
> 1. 所有新组件必须使用 `@apply` 或 Tailwind 类名
> 2. 卡片组件必须应用 `glass` 和 `hover-lift` 效果
> 3. 按钮组件必须使用设计系统的按钮模式
> 4. 响应式设计必须从移动端开始，逐步增强
> 5. 动画效果必须使用统一的 `duration-300` 时长

### 1. 复习界面布局

```typescript
// components/ReviewInterface.tsx
interface ReviewInterfaceProps {
  candidates: ReviewCandidates;
  onFeedback: (feedback: ReviewFeedback) => void;
}

const ReviewInterface: React.FC<ReviewInterfaceProps> = ({ candidates, onFeedback }) => {
  const [currentSentence, setCurrentSentence] = useState<GeneratedItem | null>(null);
  const [wordFeedback, setWordFeedback] = useState<Record<string, Rating>>({});
  const [readingFeedback, setReadingFeedback] = useState<'too_easy' | 'ok' | 'too_hard' | null>(null);
  
  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8">
      {/* 句子展示区域 */}
      <Card className="glass hover-lift border-0 shadow-lg">
        <CardContent className="p-4 sm:p-6">
          <h3 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">
            复习句子
          </h3>
          {currentSentence && (
            <div className="text-base sm:text-lg text-foreground leading-relaxed">
              {renderSentenceWithHighlights(currentSentence)}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* 词汇反馈区域 */}
      <Card className="glass hover-lift border-0 shadow-lg">
        <CardContent className="p-4 sm:p-6">
          <h3 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">
            词汇反馈
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {candidates.targets.map(word => (
              <WordFeedbackCard
                key={word}
                word={word}
                feedback={wordFeedback[word]}
                onFeedback={(rating) => setWordFeedback(prev => ({ ...prev, [word]: rating }))}
              />
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* 整体难度反馈 */}
      <Card className="glass hover-lift border-0 shadow-lg">
        <CardContent className="p-4 sm:p-6">
          <h3 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">
            整体难度
          </h3>
          <DifficultyFeedback
            feedback={readingFeedback}
            onFeedback={setReadingFeedback}
          />
        </CardContent>
      </Card>
      
      {/* 提交按钮 */}
      <div className="flex justify-center pt-4">
        <Button 
          size="lg"
          className="hover-scale transition-all duration-300 shadow-lg"
          onClick={() => handleSubmit()}
          disabled={!isFeedbackComplete()}
        >
          提交反馈
        </Button>
      </div>
    </div>
  );
};
```

### 2. 句子展示组件

```typescript
// components/SentenceDisplay.tsx
interface SentenceDisplayProps {
  sentence: GeneratedItem;
  onWordClick?: (word: string) => void;
}

const SentenceDisplay: React.FC<SentenceDisplayProps> = ({ sentence, onWordClick }) => {
  return (
    <div className="space-y-4">
      <div className="text-base sm:text-lg text-foreground leading-relaxed">
        {sentence.text.split(' ').map((token, index) => {
          const target = sentence.targets.find(t => 
            index >= t.begin && index <= t.end
          );
          
          return (
            <span
              key={index}
              className={cn(
                "transition-all duration-200 cursor-pointer",
                target 
                  ? "text-primary font-semibold hover:text-primary/80 underline decoration-primary/30" 
                  : "text-foreground"
              )}
              onClick={() => target && onWordClick?.(target.word)}
            >
              {token}
            </span>
          );
        })}
      </div>
      
      {/* 新词汇提示 */}
      {sentence.self_eval.new_terms && sentence.self_eval.new_terms.length > 0 && (
        <Card className="glass border-0 shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <h4 className="text-sm sm:text-base font-semibold text-foreground mb-2">
              可能的新词汇：
            </h4>
            <div className="space-y-2">
              {sentence.self_eval.new_terms.map(term => (
                <div key={term.surface} className="flex items-center space-x-2 text-sm">
                  <Badge variant="secondary" className="text-xs">
                    {term.cefr}
                  </Badge>
                  <span className="font-medium text-foreground">{term.surface}</span>
                  <span className="text-muted-foreground">: {term.gloss}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
```

### 3. 词汇反馈卡片

```typescript
// components/WordFeedbackCard.tsx
interface WordFeedbackCardProps {
  word: string;
  feedback: Rating | undefined;
  onFeedback: (rating: Rating) => void;
}

const WordFeedbackCard: React.FC<WordFeedbackCardProps> = ({ word, feedback, onFeedback }) => {
  const ratings: { value: Rating; label: string; variant: "destructive" | "secondary" | "default" | "outline" }[] = [
    { value: 'again', label: '不记得', variant: 'destructive' },
    { value: 'hard', label: '困难', variant: 'secondary' },
    { value: 'good', label: '良好', variant: 'default' },
    { value: 'easy', label: '容易', variant: 'outline' },
    { value: 'unknown', label: '不熟悉', variant: 'secondary' }
  ];
  
  return (
    <Card className="glass hover-lift border-0 shadow-sm">
      <CardContent className="p-3 sm:p-4">
        <h4 className="text-base sm:text-lg font-semibold text-foreground mb-3">
          {word}
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {ratings.map(rating => (
            <Button
              key={rating.value}
              variant={rating.value === feedback ? 'default' : rating.variant}
              size="sm"
              className={cn(
                "text-xs sm:text-sm transition-all duration-200",
                rating.value === feedback && "shadow-md"
              )}
              onClick={() => onFeedback(rating.value)}
            >
              {rating.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
```

### 4. 难度反馈组件

```typescript
// components/DifficultyFeedback.tsx
interface DifficultyFeedbackProps {
  feedback: 'too_easy' | 'ok' | 'too_hard' | null;
  onFeedback: (feedback: 'too_easy' | 'ok' | 'too_hard') => void;
}

const DifficultyFeedback: React.FC<DifficultyFeedbackProps> = ({ feedback, onFeedback }) => {
  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant={feedback === 'too_easy' ? 'default' : 'outline'}
          className={cn(
            "flex-1 transition-all duration-200",
            feedback === 'too_easy' && "shadow-md"
          )}
          onClick={() => onFeedback('too_easy')}
        >
          太简单
        </Button>
        <Button
          variant={feedback === 'ok' ? 'default' : 'outline'}
          className={cn(
            "flex-1 transition-all duration-200",
            feedback === 'ok' && "shadow-md"
          )}
          onClick={() => onFeedback('ok')}
        >
          合适
        </Button>
        <Button
          variant={feedback === 'too_hard' ? 'default' : 'outline'}
          className={cn(
            "flex-1 transition-all duration-200",
            feedback === 'too_hard' && "shadow-md"
          )}
          onClick={() => onFeedback('too_hard')}
        >
          太难
        </Button>
      </div>
    </div>
  );
};
```

### 5. 复习进度组件

```typescript
// components/ReviewProgress.tsx
interface ReviewProgressProps {
  current: number;
  total: number;
  onComplete: () => void;
}

const ReviewProgress: React.FC<ReviewProgressProps> = ({ current, total, onComplete }) => {
  const progress = (current / total) * 100;
  
  return (
    <Card className="glass border-0 shadow-lg">
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-4">
          {/* 进度条 */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>复习进度</span>
              <span>{current} / {total}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          
          {/* 进度文本 */}
          <div className="text-center">
            <p className="text-base sm:text-lg font-medium text-foreground">
              {current} / {total} 词汇已复习
            </p>
            {current === total && (
              <Button 
                onClick={onComplete} 
                className="mt-3 hover-scale transition-all duration-300 shadow-lg"
                size="lg"
              >
                完成复习
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
```

### 6. 复习Tab组件

```typescript
// components/layout/ReviewTab.tsx
import { BookOpen, CheckCircle } from 'lucide-react';

interface ReviewTabProps {
  reviewCount: number; // 今日需要复习的词汇数量
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const ReviewTab: React.FC<ReviewTabProps> = ({ 
  reviewCount, 
  isActive, 
  onClick, 
  disabled = false 
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-all",
        "min-w-0 flex-1 text-center",
        disabled && "opacity-50 cursor-not-allowed",
        isActive 
          ? "text-primary" 
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <div className="relative">
        <div className={cn(
          "p-2 rounded-full transition-all",
          isActive && "bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/25"
        )}>
          <BookOpen className={cn(
            "w-5 h-5 transition-colors",
            isActive && "text-white"
          )} />
        </div>
        {reviewCount > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {reviewCount > 99 ? '99+' : reviewCount}
          </div>
        )}
      </div>
      <span className={cn(
        "text-xs font-medium transition-colors truncate",
        isActive && "text-primary"
      )}>
        复习
      </span>
    </button>
  );
};
```

### 7. 复习主界面组件

```typescript
// pages/ReviewPage.tsx
interface ReviewPageProps {
  onBack: () => void;
}

const ReviewPage: React.FC<ReviewPageProps> = ({ onBack }) => {
  const [candidates, setCandidates] = useState<ReviewCandidates | null>(null);
  const [currentSentence, setCurrentSentence] = useState<GeneratedItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewProgress, setReviewProgress] = useState({ current: 0, total: 0 });
  
  // 获取复习候选词
  const fetchCandidates = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/review/candidates');
      const data = await response.json();
      setCandidates(data);
      setReviewProgress({ current: 0, total: data.targets.length });
    } catch (err) {
      setError('获取复习内容失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 生成复习句子
  const generateReviewSentence = async () => {
    if (!candidates) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/review/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(candidates)
      });
      const data = await response.json();
      setCurrentSentence(data.items[0]);
    } catch (err) {
      setError('生成复习句子失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 提交复习反馈
  const submitFeedback = async (feedback: ReviewFeedback) => {
    if (!candidates || !currentSentence) return;
    
    try {
      await fetch('/api/review/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          delivery_id: candidates.delivery_id,
          events: feedback.wordEvents,
          reading_feedback: feedback.readingFeedback
        })
      });
      
      // 更新进度
      setReviewProgress(prev => ({ 
        ...prev, 
        current: prev.current + 1 
      }));
      
      // 继续下一轮复习
      if (reviewProgress.current < reviewProgress.total - 1) {
        generateReviewSentence();
      }
    } catch (err) {
      setError('提交反馈失败');
    }
  };
  
  useEffect(() => {
    fetchCandidates();
  }, []);
  
  useEffect(() => {
    if (candidates && !currentSentence) {
      generateReviewSentence();
    }
  }, [candidates]);
  
  return (
    <div className="flex-1 flex flex-col p-4 pb-20 md:pb-4">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          onClick={onBack}
          className="flex items-center space-x-2 text-muted-foreground hover:text-foreground hover-lift"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回</span>
        </Button>
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground">词汇复习</h1>
        <div className="w-20" /> {/* 占位 */}
      </div>
      
      {/* 进度条 */}
      <div className="mb-6">
        <ReviewProgress
          current={reviewProgress.current}
          total={reviewProgress.total}
          onComplete={() => {
            // 复习完成，返回主界面
            onBack();
          }}
        />
      </div>
      
      {/* 加载状态 */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <Card className="glass border-0 shadow-lg">
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-muted-foreground">正在生成复习内容...</p>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* 错误状态 */}
      {error && (
        <div className="flex-1 flex items-center justify-center">
          <Card className="glass border-0 shadow-lg">
            <CardContent className="p-8 text-center space-y-4">
              <div className="text-destructive text-lg font-medium">{error}</div>
              <Button onClick={fetchCandidates} variant="outline" className="hover-lift">
                重试
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* 复习内容 */}
      {currentSentence && !loading && !error && (
        <div className="flex-1">
          <ReviewInterface
            candidates={candidates!}
            currentSentence={currentSentence}
            onFeedback={submitFeedback}
          />
        </div>
      )}
    </div>
  );
};
```

## 导航架构更新

### 1. 底部导航栏更新

```typescript
// components/layout/BottomNavigation.tsx
const navigation = [{
  name: '单词查询',
  key: 'search' as const,
  icon: Search
}, {
  name: '我的收藏',
  key: 'favorites' as const,
  icon: Star
}, {
  name: '复习',
  key: 'review' as const,
  icon: BookOpen
}, {
  name: '我的',
  key: 'profile' as const,
  icon: User
}, {
  name: '调试',
  key: 'debug' as const,
  icon: Bug
}];
```

### 2. 侧边栏更新

```typescript
// components/layout/AppSidebar.tsx
const getNavigation = () => {
  const baseNavigation = [{
    name: '单词查询',
    key: 'search' as const,
    icon: Search
  }, {
    name: '我的收藏',
    key: 'favorites' as const,
    icon: Star
  }, {
    name: '复习',
    key: 'review' as const,
    icon: BookOpen
  }];
  
  // 只在开发环境显示调试功能
  if (import.meta.env.DEV) {
    baseNavigation.push({
      name: '调试',
      key: 'debug' as const,
      icon: Bug
    });
  }
  
  return baseNavigation;
};
```

### 3. 复习Tab状态管理

```typescript
// hooks/useReviewCount.ts
export const useReviewCount = () => {
  const [reviewCount, setReviewCount] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const fetchReviewCount = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/review/count');
      const data = await response.json();
      setReviewCount(data.count);
    } catch (error) {
      console.error('Failed to fetch review count:', error);
      setReviewCount(0);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchReviewCount();
    // 每5分钟刷新一次复习数量
    const interval = setInterval(fetchReviewCount, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  
  return { reviewCount, loading, refetch: fetchReviewCount };
};
```

## API接口设计

### 1. GET /review/candidates

**功能**：获取候选词汇和生成参数

**请求参数**：
- `n`：候选词数量（默认15）

**响应**：
```json
{
  "targets": ["offset", "staggering", "adequate"],
  "profile": {
    "level_cefr": "B1",
    "allow_incidental": true,
    "unknown_budget": 2,
    "style": "neutral",
    "difficulty_bias": 0.0
  },
  "constraints": {
    "sentence_length_range": [12, 22],
    "max_targets_per_sentence": 2
  },
  "delivery_id": "uuid-xxxx"
}
```

**实现逻辑**：
1. 从`user_word_state`选择`next_due_at <= now`的词汇
2. 不足则补充`next_due_at IS NULL`的收藏词
3. 读取`user_review_prefs`，根据近期反馈微调`difficulty_bias`
4. 生成唯一的`delivery_id`

### 2. POST /review/submit

**功能**：提交复习反馈并更新状态

**请求体**：
```json
{
  "delivery_id": "uuid-xxxx",
  "events": [
    {
      "word": "offset",
      "event_type": "read",
      "result": "good",
      "latency_ms": 3200
    },
    {
      "word": "staggering", 
      "event_type": "read",
      "result": "unknown"
    }
  ],
  "reading_feedback": "too_hard"
}
```

**响应**：
```json
{
  "updates": [
    {
      "word": "offset",
      "familiarity": 3,
      "next_due_at": "2025-08-05T10:00:00Z"
    },
    {
      "word": "staggering",
      "familiarity": 0,
      "next_due_at": "2025-08-03T10:00:00Z"
    }
  ]
}
```

**实现逻辑**：
1. 插入`review_events`记录
2. 调用`fsrsUpdate`更新`user_word_state`
3. 根据`reading_feedback`调整`user_review_prefs`
4. 根据用户标记的unknown词汇校准预算估计准确性

### 3. GET /review/count

**功能**：获取今日需要复习的词汇数量

**响应**：
```json
{
  "count": 15,
  "last_updated": "2025-01-20T10:00:00Z"
}
```

**实现逻辑**：
1. 查询`user_word_state`中`next_due_at <= now`的词汇数量
2. 返回数量和最后更新时间
3. 用于在复习tab上显示未读数量

### 4. POST /review/generate

**功能**：根据候选词汇生成复习句子

**请求体**：
```json
{
  "targets": ["offset", "staggering", "adequate"],
  "profile": {
    "level_cefr": "B1",
    "allow_incidental": true,
    "unknown_budget": 2,
    "style": "neutral",
    "difficulty_bias": 0.0
  },
  "constraints": {
    "sentence_length_range": [12, 22],
    "max_targets_per_sentence": 2
  },
  "delivery_id": "uuid-xxxx"
}
```

**响应**：
```json
{
  "items": [{
    "sid": "sentence-001",
    "text": "The offset was staggering to see.",
    "targets": [
      {"word": "offset", "begin": 1, "end": 1},
      {"word": "staggering", "begin": 3, "end": 3}
    ],
    "self_eval": {
      "predicted_cefr": "B1",
      "estimated_new_terms_count": 1,
      "new_terms": [
        {"surface": "staggering", "cefr": "B2", "gloss": "very surprising"}
      ],
      "reason": "Generated sentence with 1 new term to maintain natural flow"
    }
  }]
}
```

**实现逻辑**：
1. 调用LLM生成包含目标词汇的句子
2. 进行基础校验（目标词覆盖、句长范围）
3. 返回生成的句子和自评结果

## 错误处理

### 1. LLM生成失败
- **策略**：自动重试，最多3次
- **间隔**：递增延迟（1s, 2s, 3s）
- **最终处理**：抛出明确错误信息

### 2. 校验失败
- **策略**：重新生成
- **限制**：最多重试2次
- **基础校验**：目标词覆盖、句长范围等硬性要求
- **兜底**：抛出错误，由前端处理

### 3. 数据库操作失败
- **策略**：事务回滚
- **日志**：记录详细错误信息
- **用户提示**：友好的错误消息

### 4. 权限验证失败
- **策略**：返回401状态码
- **日志**：记录访问尝试
- **安全**：不泄露敏感信息

## 测试策略

### 1. 单元测试
- **FSRS算法测试**：验证间隔计算和状态更新
- **难度控制测试**：验证EWMA算法和参数调整
- **校验器测试**：验证各种边界情况
- **LLM工具测试**：验证JSON解析和错误处理

### 2. 集成测试
- **API流程测试**：完整的candidates → generate → submit流程
- **数据库操作测试**：事务完整性和并发安全
- **权限控制测试**：用户隔离和数据安全

### 3. 端到端测试
- **用户场景测试**：模拟真实用户使用流程
- **性能测试**：验证P95响应时间要求
- **压力测试**：验证系统在高负载下的稳定性

### 4. 监控测试
- **指标收集测试**：验证关键指标的准确性
- **告警机制测试**：验证异常情况的及时通知
- **日志完整性测试**：验证审计追踪的完整性
- **预算监控测试**：监控LLM自评与用户反馈的一致性（不影响基础校验）

## 部署和运维

### 1. 环境配置
- **开发环境**：本地Supabase + Vercel预览
- **测试环境**：独立Supabase实例
- **生产环境**：生产Supabase + Vercel部署

### 2. 监控指标
- **业务指标**：Too hard反馈占比、生成失败率
- **性能指标**：API响应时间、LLM调用延迟
- **系统指标**：数据库连接数、内存使用率
- **预算指标**：LLM自评准确性、预算校准效果

### 3. 安全措施
- **数据加密**：传输和存储加密
- **权限控制**：基于用户ID的数据隔离
- **输入验证**：防止SQL注入和XSS攻击
- **速率限制**：防止API滥用

## 扩展性考虑

### 1. 记忆模型升级
- **FSRS → DSR**：替换调度算法内核
- **概率模型**：引入Ebisu/HLR进行精细控制
- **平滑迁移**：保持API兼容性

### 2. 功能扩展
- **分义项支持**：添加`sense_key`字段
- **段落级阅读**：支持多句生成
- **白名单兜底**：可选的确定性控制

### 3. 性能优化
- **缓存策略**：缓存用户偏好和常用数据
- **异步处理**：非关键操作的异步化
- **CDN加速**：静态资源的全球分发
- **预算优化**：基于历史数据优化LLM自评准确性
- **界面优化**：懒加载、虚拟滚动、响应式设计

## 🎨 设计系统遵循总结

### ✅ 已更新的组件设计

本设计文档中的所有前端组件示例都已严格遵循 [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) 设计系统：

1. **语义化颜色系统**
   - 使用 `text-primary`, `bg-muted`, `border-border` 等语义化标记
   - 避免直接颜色值如 `text-blue-500`

2. **响应式设计**
   - 移动优先：`text-base sm:text-lg`, `p-4 sm:p-6`
   - 网格布局：`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`

3. **玻璃拟态效果**
   - 所有卡片组件应用 `glass` 类
   - 使用 `backdrop-blur-sm` 和半透明背景

4. **悬停动画效果**
   - 卡片使用 `hover-lift` 效果
   - 按钮使用 `hover-scale` 效果
   - 统一动画时长 `duration-300`

5. **组件模式**
   - 使用 shadcn/ui 的 `Card`, `Button`, `Badge` 组件
   - 遵循设计系统的按钮变体系统

### 📋 开发检查清单

在实现复习系统组件时，请确保：

- [ ] 所有颜色使用语义化标记
- [ ] 响应式设计从移动端开始
- [ ] 卡片组件应用 `glass` 和 `hover-lift`
- [ ] 按钮使用设计系统变体
- [ ] 动画效果使用统一时长
- [ ] 间距使用 Tailwind 系统
- [ ] 文字层次遵循设计系统规范

### 🔗 相关文档

- **[DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md)** - 完整设计系统规范
- **[components.json](../components.json)** - shadcn/ui 组件配置
- **[tailwind.config.ts](../tailwind.config.ts)** - Tailwind CSS 配置

---

这个设计文档基于requirements.md的需求，参考了review-system文件夹中的现有设计，确保系统能够实现个性化、可控、可扩展的复习体验，同时严格遵循项目的设计系统规范。 

## LLM模型替换与OpenAI兼容用法示例

本系统后端所有LLM调用均采用OpenAI官方API协议（chat/completions），可无缝兼容AiHubMix平台的多种主流大模型（如GPT-4o、Gemini、Claude、通义千问等）。只需替换 `api_key` 和 `base_url`，即可切换模型，无需更改业务逻辑。

### 1. 替换模型的推荐方式

- **推荐用法**：
  - 使用 [openai](https://pypi.org/project/openai/) 官方SDK
  - `base_url` 指向 AiHubMix 平台（如 `https://aihubmix.com/v1`）
  - `api_key` 使用 AiHubMix 平台生成的密钥
  - `model` 字段填写所需模型ID（如 `gpt-4o-mini`、`gemini-2.5-flash-preview-04-17` 等）

### 2. Python 示例代码

```python
from openai import OpenAI

client = OpenAI(
    api_key="sk-***",  # 换成你在 AiHubMix 生成的密钥
    base_url="https://aihubmix.com/v1"
)

chat_completion = client.chat.completions.create(
    messages=[
        {
            "role": "user",
            "content": "Say this is a test",
        }
    ],
    model="gpt-4o-mini",
)

print(chat_completion)
```

### 3. 支持的高级功能

AiHubMix 平台已支持 OpenAI 协议下的多种高级功能，包括：
- Text input / Image input
- Streaming（流式输出）
- Web search / Deep research
- Reasoning（推理深度）
- Functions（函数调用/function calling）
- image_generation（图片生成）
- Code Interpreter（代码解释器）
- Remote MCP / Computer Use（自动操作）

**注意：** 只需在 `model` 字段切换所需模型ID，即可体验不同大模型的能力，无需更改任何业务代码。

### 4. Function Calling 示例

```python
chat_completion = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": "What's the weather in Beijing?"}],
    tools=[
        {
            "type": "function",
            "function": {
                "name": "get_weather",
                "description": "Get weather information",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "location": {"type": "string", "description": "City name"}
                    },
                    "required": ["location"]
                }
            }
        }
    ]
)
```

---

如需更多模型ID和功能支持，详见 [AiHubMix官方文档](https://docs.aihubmix.com/cn/api/OpenAI-library)。 