/**
 * @fileoverview 难度控制器实现
 * @description 基于 EWMA 算法的动态难度调整系统
 * @author thiskee
 * 
 * 任务 2.2 完成文件
 * 实现用户难度等级和预算的动态调整
 * 
 * 难度控制器根据用户的评分和项目难度
 * 动态调整用户的难度等级和复习预算
 */

import { z } from 'zod';
import type { UserPrefs, DifficultyFeedback } from '@ai-voca/shared';

// ==================== 类型定义 ====================

/**
 * 难度调整结果
 */
export interface DifficultyAdjustResult {
  /** 新的难度偏置 */
  difficulty_bias: number;
  /** 目标等级偏移 */
  target_level_shift: number;
  /** 新的预算 */
  budget: number;
}

/**
 * 预算校准结果
 */
export interface BudgetCalibrationResult {
  /** 调整后的预算 */
  adjustedBudget: number;
  /** 估算准确性 */
  accuracy: number;
}

/**
 * EWMA 参数配置
 */
export interface EWMAParams {
  /** 平滑因子 (0-1) */
  alpha: number;
  /** 最小难度偏置 */
  minBias: number;
  /** 最大难度偏置 */
  maxBias: number;
  /** 最小预算 */
  minBudget: number;
  /** 最大预算 */
  maxBudget: number;
}

// ==================== Zod Schema ====================

/**
 * 难度反馈 Schema
 */
export const DifficultyFeedbackSchema = z.enum(['too_easy', 'ok', 'too_hard']);

/**
 * 难度调整输入 Schema
 */
export const DifficultyAdjustInputSchema = z.object({
  userPrefs: z.object({
    level_cefr: z.string(),
    allow_incidental: z.boolean(),
    unknown_budget: z.number().min(0).max(4),
    style: z.string(),
    difficulty_bias: z.number().min(-1.5).max(1.5),
  }),
  feedback: DifficultyFeedbackSchema.nullable(),
});

/**
 * 预算校准输入 Schema
 */
export const BudgetCalibrationInputSchema = z.object({
  estimatedNewTerms: z.number().min(0),
  actualUnknownWords: z.number().min(0),
  currentBudget: z.number().min(0).max(4),
});

// ==================== 常量定义 ====================

/**
 * 默认 EWMA 参数
 */
export const DEFAULT_EWMA_PARAMS: EWMAParams = {
  alpha: 0.3,        // 平滑因子，新反馈权重30%
  minBias: -1.5,     // 最小难度偏置
  maxBias: 1.5,      // 最大难度偏置
  minBudget: 0,      // 最小预算
  maxBudget: 4,      // 最大预算
};

/**
 * 难度反馈映射
 */
const DIFFICULTY_FEEDBACK_MAP = {
  too_easy: -1,
  ok: 0,
  too_hard: 1,
} as const;

// ==================== 核心函数实现 ====================

/**
 * 调整难度等级和预算
 * 基于用户反馈使用 EWMA 算法动态调整难度偏置和预算
 * 
 * @param userPrefs 用户偏好设置
 * @param feedback 用户难度反馈
 * @param params EWMA 参数配置
 * @returns 调整后的难度偏置、等级偏移和预算
 */
export function adjustLevelAndBudget(
  userPrefs: UserPrefs,
  feedback: DifficultyFeedback | null,
  params: EWMAParams = DEFAULT_EWMA_PARAMS
): DifficultyAdjustResult {
  // 将反馈转换为数值
  const delta = feedback ? DIFFICULTY_FEEDBACK_MAP[feedback as keyof typeof DIFFICULTY_FEEDBACK_MAP] : 0;
  
  // 使用 EWMA 算法平滑处理难度偏置
  const newBias = calculateEWMA(
    userPrefs.difficulty_bias,
    delta,
    params.alpha
  );
  
  // 限制难度偏置在合理范围内
  const clampedBias = Math.max(params.minBias, Math.min(params.maxBias, newBias));
  
  // 计算目标等级偏移（-1/0/+1档）
  // 注意：这里需要根据反馈直接计算等级偏移，而不是基于平滑后的偏置
  const targetLevelShift = feedback ? DIFFICULTY_FEEDBACK_MAP[feedback as keyof typeof DIFFICULTY_FEEDBACK_MAP] : 0;
  
  // 根据等级偏移调整预算
  const newBudget = Math.max(
    params.minBudget,
    Math.min(params.maxBudget, userPrefs.unknown_budget + targetLevelShift)
  );
  
  return {
    difficulty_bias: clampedBias,
    target_level_shift: targetLevelShift,
    budget: newBudget,
  };
}

/**
 * 校准预算估算
 * 基于实际新词汇数量与估算数量的对比，调整预算分配策略
 * 
 * @param estimatedNewTerms 估算的新词汇数量
 * @param actualUnknownWords 用户标记为unknown的词汇数量
 * @param currentBudget 当前预算设置
 * @returns 调整后的预算和估算准确性
 */
export function calibrateBudgetEstimation(
  estimatedNewTerms: number,
  actualUnknownWords: number,
  currentBudget: number
): BudgetCalibrationResult {
  // 计算估算准确性
  const accuracy = estimatedNewTerms > 0 
    ? actualUnknownWords / estimatedNewTerms 
    : 1;
  
  // 根据准确性调整预算
  let adjustedBudget = currentBudget;
  
  if (accuracy >= 1.5) {
    // 实际新词比估计多50%或以上，降低预算
    adjustedBudget = Math.max(0, currentBudget - 1);
  } else if (accuracy <= 0.5) {
    // 实际新词比估计少50%或以下，增加预算
    adjustedBudget = Math.min(4, currentBudget + 1);
  }
  // 准确性在0.5-1.5之间，保持当前预算
  
  return {
    adjustedBudget,
    accuracy,
  };
}

/**
 * 计算 EWMA 值
 * 指数加权移动平均算法
 * 
 * @param currentValue 当前值
 * @param newValue 新值
 * @param alpha 平滑因子 (0-1)
 * @returns 平滑后的值
 */
export function calculateEWMA(
  currentValue: number,
  newValue: number,
  alpha: number
): number {
  if (alpha < 0 || alpha > 1) {
    throw new Error('EWMA alpha 参数必须在 0-1 范围内');
  }
  
  return alpha * newValue + (1 - alpha) * currentValue;
}

/**
 * 获取默认 EWMA 参数
 * 
 * @returns 默认参数配置
 */
export function getDefaultEWMAParams(): EWMAParams {
  return { ...DEFAULT_EWMA_PARAMS };
}

/**
 * 验证 EWMA 参数
 * 
 * @param params 参数配置
 * @returns 是否有效
 */
export function validateEWMAParams(params: EWMAParams): boolean {
  return (
    params.alpha >= 0 &&
    params.alpha <= 1 &&
    params.minBias <= params.maxBias &&
    params.minBudget <= params.maxBudget &&
    params.minBudget >= 0 &&
    params.maxBudget <= 4
  );
}

/**
 * 创建自定义 EWMA 参数
 * 
 * @param alpha 平滑因子
 * @param minBias 最小难度偏置
 * @param maxBias 最大难度偏置
 * @param minBudget 最小预算
 * @param maxBudget 最大预算
 * @returns 参数配置
 */
export function createEWMAParams(
  alpha: number = 0.3,
  minBias: number = -1.5,
  maxBias: number = 1.5,
  minBudget: number = 0,
  maxBudget: number = 4
): EWMAParams {
  const params: EWMAParams = {
    alpha,
    minBias,
    maxBias,
    minBudget,
    maxBudget,
  };
  
  if (!validateEWMAParams(params)) {
    throw new Error('无效的 EWMA 参数配置');
  }
  
  return params;
}

// ==================== 工具函数 ====================

/**
 * 格式化难度调整结果为可读字符串
 * 
 * @param result 难度调整结果
 * @returns 格式化字符串
 */
export function formatDifficultyAdjustResult(result: DifficultyAdjustResult): string {
  const { difficulty_bias, target_level_shift, budget } = result;
  
  const biasDirection = difficulty_bias > 0 ? '增加' : difficulty_bias < 0 ? '减少' : '保持';
  const levelChange = target_level_shift > 0 ? '提升' : target_level_shift < 0 ? '降低' : '保持';
  
  return `难度偏置${biasDirection}至 ${difficulty_bias.toFixed(2)}，等级${levelChange}，预算调整为 ${budget}`;
}

/**
 * 格式化预算校准结果为可读字符串
 * 
 * @param result 预算校准结果
 * @returns 格式化字符串
 */
export function formatBudgetCalibrationResult(result: BudgetCalibrationResult): string {
  const { adjustedBudget, accuracy } = result;
  
  const accuracyText = accuracy > 1.5 ? '严重低估' : 
                      accuracy < 0.5 ? '严重高估' : 
                      '估算准确';
  
  return `估算准确性: ${accuracy.toFixed(2)} (${accuracyText})，预算调整为 ${adjustedBudget}`;
} 