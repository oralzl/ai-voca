# 复习系统类型定义

## 概述

本模块定义了Vocabulary Review System的核心类型和接口，包括复习结果、词汇状态、用户偏好、生成输入输出等。所有类型都配备了Zod Schema验证，确保数据的安全性和一致性。

## 核心类型

### 基础类型

- `Rating`: 复习结果评分类型 ('again' | 'hard' | 'good' | 'easy')
- `DifficultyFeedback`: 难度反馈类型 ('too_easy' | 'ok' | 'too_hard')
- `ReviewEventType`: 复习事件类型 ('read' | 'quiz' | 'mark_unknown')
- `CEFRLevel`: CEFR等级类型 ('A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2')
- `GenerationStyle`: 生成风格类型 ('neutral' | 'news' | 'dialog' | 'academic')

### 核心接口

#### WordState - 词汇状态
```typescript
interface WordState {
  familiarity: number;      // 熟悉度等级 0-5
  difficulty: number;       // 难度等级 1-5
  stability?: number;       // 稳定性（天）
  recall_p?: number;        // 回忆概率
  successes: number;        // 成功次数
  lapses: number;           // 失败次数
  last_seen_at?: string;    // 最后复习时间
  next_due_at?: string;     // 下次复习时间
}
```

#### UserPrefs - 用户偏好
```typescript
interface UserPrefs {
  level_cefr: CEFRLevel;           // CEFR等级
  allow_incidental: boolean;        // 是否允许顺带学习
  unknown_budget: number;           // 每句允许新词数 0-4
  style: GenerationStyle;           // 生成风格
  difficulty_bias: number;          // 难度偏置 -1.5到+1.5
}
```

#### GenerateItemsInput - 生成输入
```typescript
interface GenerateItemsInput {
  targets: string[];                // 目标词汇列表
  profile: UserPrefs;               // 用户偏好
  constraints: {
    sentence_length_range: [number, number];  // 句长范围
    max_targets_per_sentence: number;         // 每句最大目标词数
  };
}
```

#### GeneratedItem - 生成的句子项
```typescript
interface GeneratedItem {
  sid: string;                      // 句子ID
  text: string;                     // 生成的句子
  targets: TargetPosition[];        // 目标词位置
  self_eval: SelfEvaluation;        // 自评结果
}
```

## Zod Schema 验证

所有类型都配备了对应的Zod Schema，用于运行时验证：

```typescript
import { 
  RatingSchema, 
  UserPrefsSchema, 
  GenerateItemsInputSchema 
} from '@ai-voca/shared';

// 验证用户偏好
const userPrefs = UserPrefsSchema.parse({
  level_cefr: 'B1',
  allow_incidental: true,
  unknown_budget: 2,
  style: 'neutral',
  difficulty_bias: 0.0
});

// 验证生成输入
const input = GenerateItemsInputSchema.parse({
  targets: ['apple', 'banana'],
  profile: userPrefs,
  constraints: {
    sentence_length_range: [12, 22],
    max_targets_per_sentence: 2
  }
});
```

## API 接口类型

### 请求类型

- `ReviewSubmitRequest`: 复习提交请求
- `GenerateRequest`: 句子生成请求

### 响应类型

- `ReviewSubmitResponse`: 复习提交响应
- `CandidatesResponse`: 候选词获取响应
- `GenerateResponse`: 句子生成响应
- `ReviewCountResponse`: 复习计数响应

## 使用示例

### 1. 创建用户偏好
```typescript
import { UserPrefs, UserPrefsSchema } from '@ai-voca/shared';

const userPrefs: UserPrefs = {
  level_cefr: 'B1',
  allow_incidental: true,
  unknown_budget: 2,
  style: 'neutral',
  difficulty_bias: 0.0
};

// 验证数据
const validatedPrefs = UserPrefsSchema.parse(userPrefs);
```

### 2. 处理复习结果
```typescript
import { Rating, RatingSchema } from '@ai-voca/shared';

const rating: Rating = 'good';
const validatedRating = RatingSchema.parse(rating);
```

### 3. 生成句子输入
```typescript
import { GenerateItemsInput, GenerateItemsInputSchema } from '@ai-voca/shared';

const input: GenerateItemsInput = {
  targets: ['apple', 'banana', 'orange'],
  profile: userPrefs,
  constraints: {
    sentence_length_range: [12, 22],
    max_targets_per_sentence: 3
  }
};

const validatedInput = GenerateItemsInputSchema.parse(input);
```

## 类型安全

所有类型都使用TypeScript的严格类型检查，确保：

1. **编译时类型检查**: 在开发阶段就能发现类型错误
2. **运行时验证**: 使用Zod Schema进行数据验证
3. **智能提示**: IDE提供完整的类型提示和自动补全
4. **重构安全**: 类型变更时自动检测影响范围

## 扩展性

类型定义支持未来扩展：

1. **新的事件类型**: 可以轻松添加新的ReviewEventType
2. **新的生成风格**: 可以扩展GenerationStyle
3. **新的验证规则**: 可以增强Zod Schema的验证逻辑
4. **新的API接口**: 可以添加新的请求响应类型

## 注意事项

1. **数据验证**: 始终使用Zod Schema验证外部数据
2. **类型导出**: 所有类型都从主入口文件导出
3. **文档同步**: 类型变更时需要同步更新文档
4. **向后兼容**: 新增字段时使用可选类型 