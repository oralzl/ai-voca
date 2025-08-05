/**
 * @fileoverview 复习系统核心类型定义
 * @module types/review
 * @description 定义复习系统的核心类型、接口和Zod Schema验证
 */

import { z } from 'zod';

// ==================== 基础类型定义 ====================

/**
 * 复习结果评分类型
 */
export type Rating = 'again' | 'hard' | 'good' | 'easy' | 'unknown';

/**
 * 难度反馈类型
 */
export type DifficultyFeedback = 'too_easy' | 'ok' | 'too_hard';

/**
 * 复习事件类型
 */
export type ReviewEventType = 'read' | 'quiz' | 'mark_unknown';

/**
 * CEFR等级类型
 */
export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

/**
 * 生成风格类型
 */
export type GenerationStyle = 'neutral' | 'news' | 'dialog' | 'academic';

// ==================== 核心接口定义 ====================

/**
 * 词汇状态接口
 */
export interface WordState {
  /** 熟悉度等级 0-5 */
  familiarity: number;
  /** 难度等级 1-5 */
  difficulty: number;
  /** 稳定性（天） */
  stability?: number;
  /** 回忆概率 */
  recall_p?: number;
  /** 成功次数 */
  successes: number;
  /** 失败次数 */
  lapses: number;
  /** 最后复习时间 */
  last_seen_at?: string;
  /** 下次复习时间 */
  next_due_at?: string;
}

/**
 * 用户复习偏好接口
 */
export interface UserPrefs {
  /** CEFR等级 */
  level_cefr: CEFRLevel;
  /** 是否允许顺带学习 */
  allow_incidental: boolean;
  /** 每句允许新词数 0-4 */
  unknown_budget: number;
  /** 生成风格 */
  style: GenerationStyle;
  /** 难度偏置 -1.5到+1.5 */
  difficulty_bias: number;
}

/**
 * 生成输入接口
 */
export interface GenerateItemsInput {
  /** 目标词汇列表 */
  targets: string[];
  /** 用户偏好 */
  profile: UserPrefs;
  /** 生成约束 */
  constraints: {
    /** 句长范围 [最小, 最大] */
    sentence_length_range: [number, number];
    /** 每句最大目标词数 */
    max_targets_per_sentence: number;
  };
}

/**
 * 目标词位置接口
 */
export interface TargetPosition {
  /** 目标词 */
  word: string;
  /** 开始位置 */
  begin: number;
  /** 结束位置 */
  end: number;
}

/**
 * 新词汇接口
 */
export interface NewTerm {
  /** 词汇表面形式 */
  surface: string;
  /** CEFR等级 */
  cefr: CEFRLevel;
  /** 释义 */
  gloss: string;
}

/**
 * 自评结果接口
 */
export interface SelfEvaluation {
  /** 预测的CEFR等级 */
  predicted_cefr: CEFRLevel;
  /** 估计的新词汇数量 */
  estimated_new_terms_count: number;
  /** 新词汇列表 */
  new_terms?: NewTerm[];
  /** 生成理由 */
  reason?: string;
}

/**
 * 生成的句子项接口
 */
export interface GeneratedItem {
  /** 句子ID */
  sid: string;
  /** 生成的句子 */
  text: string;
  /** 目标词位置 */
  targets: TargetPosition[];
  /** 自评结果 */
  self_eval: SelfEvaluation;
}

/**
 * 生成输出接口
 */
export interface GenerateItemsOutput {
  /** 生成的句子列表 */
  items: GeneratedItem[];
}

/**
 * 复习事件接口
 */
export interface ReviewEvent {
  /** 事件ID */
  id: string;
  /** 用户ID */
  user_id: string;
  /** 词汇 */
  word: string;
  /** 事件类型 */
  event_type: ReviewEventType;
  /** 复习结果 */
  result?: Rating;
  /** 响应延迟（毫秒） */
  latency_ms?: number;
  /** 元数据 */
  meta?: {
    /** 交付ID */
    delivery_id?: string;
    /** 预测的CEFR等级 */
    predicted_cefr?: CEFRLevel;
    /** 估计的新词汇数量 */
    estimated_new_terms_count?: number;
    /** 变体信息 */
    variant?: string;
  };
  /** 创建时间 */
  created_at: string;
}

/**
 * 候选词接口
 */
export interface CandidateWord {
  /** 词汇 */
  word: string;
  /** 当前状态 */
  state: WordState;
  /** 下次复习时间 */
  next_due_at: string;
}

/**
 * 复习提交请求接口
 */
export interface ReviewSubmitRequest {
  /** 词汇 */
  word: string;
  /** 复习结果 */
  rating: Rating;
  /** 难度反馈 */
  difficulty_feedback?: DifficultyFeedback;
  /** 响应延迟（毫秒） */
  latency_ms?: number;
  /** 元数据 */
  meta?: {
    /** 交付ID */
    delivery_id?: string;
    /** 预测的CEFR等级 */
    predicted_cefr?: CEFRLevel;
    /** 估计的新词汇数量 */
    estimated_new_terms_count?: number;
    /** 变体信息 */
    variant?: string;
  };
}

/**
 * 复习提交响应接口
 */
export interface ReviewSubmitResponse {
  /** 成功状态 */
  success: boolean;
  /** 更新后的词汇状态 */
  data?: {
    /** 词汇状态 */
    word_state: WordState;
    /** 用户偏好 */
    user_prefs: UserPrefs;
  };
  /** 错误信息 */
  error?: string;
}

/**
 * 候选词获取响应接口
 */
export interface CandidatesResponse {
  /** 成功状态 */
  success: boolean;
  /** 候选词数据 */
  data?: {
    /** 候选词列表 */
    candidates: CandidateWord[];
    /** 生成参数 */
    generation_params: {
      /** 目标词汇 */
      targets: string[];
      /** 用户偏好 */
      profile: UserPrefs;
      /** 生成约束 */
      constraints: GenerateItemsInput['constraints'];
    };
  };
  /** 错误信息 */
  error?: string;
}

/**
 * 句子生成请求接口
 */
export interface GenerateRequest {
  /** 目标词汇列表 */
  targets: string[];
  /** 用户偏好 */
  profile: UserPrefs;
  /** 生成约束 */
  constraints: GenerateItemsInput['constraints'];
}

/**
 * 句子生成响应接口
 */
export interface GenerateResponse {
  /** 成功状态 */
  success: boolean;
  /** 生成结果 */
  data?: GenerateItemsOutput;
  /** 错误信息 */
  error?: string;
}

/**
 * 复习计数响应接口
 */
export interface ReviewCountResponse {
  /** 成功状态 */
  success: boolean;
  /** 计数数据 */
  data?: {
    /** 今日需要复习的词汇数量 */
    today_count: number;
    /** 总收藏词汇数量 */
    total_count: number;
  };
  /** 错误信息 */
  error?: string;
}

// ==================== Zod Schema 验证 ====================

/**
 * Rating类型Schema
 */
export const RatingSchema = z.enum(['again', 'hard', 'good', 'easy', 'unknown']);

/**
 * DifficultyFeedback类型Schema
 */
export const DifficultyFeedbackSchema = z.enum(['too_easy', 'ok', 'too_hard']);

/**
 * ReviewEventType类型Schema
 */
export const ReviewEventTypeSchema = z.enum(['read', 'quiz', 'mark_unknown']);

/**
 * CEFRLevel类型Schema
 */
export const CEFRLevelSchema = z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);

/**
 * GenerationStyle类型Schema
 */
export const GenerationStyleSchema = z.enum(['neutral', 'news', 'dialog', 'academic']);

/**
 * WordState接口Schema
 */
export const WordStateSchema = z.object({
  familiarity: z.number().min(0).max(5),
  difficulty: z.number().min(1).max(5),
  stability: z.number().optional(),
  recall_p: z.number().min(0).max(1).optional(),
  successes: z.number().min(0),
  lapses: z.number().min(0),
  last_seen_at: z.string().optional(),
  next_due_at: z.string().optional(),
});

/**
 * UserPrefs接口Schema
 */
export const UserPrefsSchema = z.object({
  level_cefr: CEFRLevelSchema,
  allow_incidental: z.boolean(),
  unknown_budget: z.number().min(0).max(4),
  style: GenerationStyleSchema,
  difficulty_bias: z.number().min(-1.5).max(1.5),
});

/**
 * TargetPosition接口Schema
 */
export const TargetPositionSchema = z.object({
  word: z.string(),
  begin: z.number().min(0),
  end: z.number().min(0),
});

/**
 * NewTerm接口Schema
 */
export const NewTermSchema = z.object({
  surface: z.string(),
  cefr: CEFRLevelSchema,
  gloss: z.string(),
});

/**
 * SelfEvaluation接口Schema
 */
export const SelfEvaluationSchema = z.object({
  predicted_cefr: CEFRLevelSchema,
  estimated_new_terms_count: z.number().min(0),
  new_terms: z.array(NewTermSchema).optional(),
  reason: z.string().optional(),
});

/**
 * GeneratedItem接口Schema
 */
export const GeneratedItemSchema = z.object({
  sid: z.string(),
  text: z.string(),
  targets: z.array(TargetPositionSchema),
  self_eval: SelfEvaluationSchema,
});

/**
 * GenerateItemsOutput接口Schema
 */
export const GenerateItemsOutputSchema = z.object({
  items: z.array(GeneratedItemSchema),
});

/**
 * GenerateItemsInput接口Schema
 */
export const GenerateItemsInputSchema = z.object({
  targets: z.array(z.string()).min(1).max(8),
  profile: UserPrefsSchema,
  constraints: z.object({
    sentence_length_range: z.tuple([z.number(), z.number()]),
    max_targets_per_sentence: z.number().min(1),
  }),
});

/**
 * ReviewEvent接口Schema
 */
export const ReviewEventSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  word: z.string(),
  event_type: ReviewEventTypeSchema,
  result: RatingSchema.optional(),
  latency_ms: z.number().optional(),
  meta: z.object({
    delivery_id: z.string().optional(),
    predicted_cefr: CEFRLevelSchema.optional(),
    estimated_new_terms_count: z.number().optional(),
    variant: z.string().optional(),
  }).optional(),
  created_at: z.string(),
});

/**
 * ReviewSubmitRequest接口Schema
 */
export const ReviewSubmitRequestSchema = z.object({
  word: z.string(),
  rating: RatingSchema,
  difficulty_feedback: DifficultyFeedbackSchema.optional(),
  latency_ms: z.number().optional(),
  meta: z.object({
    delivery_id: z.string().optional(),
    predicted_cefr: CEFRLevelSchema.optional(),
    estimated_new_terms_count: z.number().optional(),
    variant: z.string().optional(),
  }).optional(),
});

/**
 * GenerateRequest接口Schema
 */
export const GenerateRequestSchema = z.object({
  targets: z.array(z.string()).min(1).max(8),
  profile: UserPrefsSchema,
  constraints: z.object({
    sentence_length_range: z.tuple([z.number(), z.number()]),
    max_targets_per_sentence: z.number().min(1),
  }),
});

// ==================== 类型导出 ====================

// 所有类型和Schema已在文件开头导出，无需重复导出 