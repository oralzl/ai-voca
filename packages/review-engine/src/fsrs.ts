/**
 * @fileoverview FSRS 算法实现
 * @description Free Spaced Repetition Scheduler 算法核心实现
 * @author thiskee
 * 
 * 任务 2.1 实现
 * 实现间隔重复算法的核心逻辑
 * 
 * FSRS 算法基于用户的评分来调整单词的复习间隔
 * 支持难度、稳定性、可检索性等状态管理
 */

import type { WordState, Rating } from '@ai-voca/shared';

// ==================== FSRS-lite 配置 ====================

/**
 * FSRS-lite 间隔映射（天）
 * 基于熟悉度等级确定下次复习间隔
 */
const INTERVALS = [1, 3, 7, 14, 30, 60] as const;

/**
 * 熟悉度等级范围
 */
const FAMILIARITY_MIN = 0;
const FAMILIARITY_MAX = 5;

// ==================== 核心算法实现 ====================

/**
 * FSRS 算法更新函数
 * 基于用户的评分更新单词的复习状态
 * 
 * @param prev - 当前词汇状态
 * @param rating - 用户评分
 * @param now - 当前时间
 * @returns 更新后的词汇状态
 */
export function fsrsUpdate(prev: WordState, rating: Rating, now: Date): { next: WordState } {
  // 获取当前熟悉度
  const currentFamiliarity = prev.familiarity ?? 0;
  
  // 根据评分调整熟悉度
  let newFamiliarity = currentFamiliarity;
  
  switch (rating) {
    case 'again':
    case 'unknown':
      // 降低熟悉度，但不低于最小值
      newFamiliarity = Math.max(FAMILIARITY_MIN, currentFamiliarity - 1);
      break;
      
    case 'hard':
      // 保持当前熟悉度
      newFamiliarity = currentFamiliarity;
      break;
      
    case 'good':
    case 'easy':
      // 提高熟悉度，但不高于最大值
      newFamiliarity = Math.min(FAMILIARITY_MAX, currentFamiliarity + 1);
      break;
  }
  
  // 计算下次复习间隔
  const intervalDays = INTERVALS[newFamiliarity] ?? INTERVALS[INTERVALS.length - 1];
  const nextDueAt = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
  
  // 更新成功/失败计数
  const isSuccess = rating === 'good' || rating === 'easy';
  const isFailure = rating === 'again' || rating === 'unknown';
  
  const newSuccesses = (prev.successes ?? 0) + (isSuccess ? 1 : 0);
  const newLapses = (prev.lapses ?? 0) + (isFailure ? 1 : 0);
  
  // 构建更新后的状态
  const next: WordState = {
    ...prev,
    familiarity: newFamiliarity,
    last_seen_at: now.toISOString(),
    next_due_at: nextDueAt.toISOString(),
    successes: newSuccesses,
    lapses: newLapses,
  };
  
  return { next };
}

/**
 * 检查词汇是否今天需要复习
 * 
 * @param wordState - 词汇状态
 * @param now - 当前时间
 * @returns 是否需要复习
 */
export function isDueToday(wordState: WordState, now: Date): boolean {
  if (!wordState.next_due_at) {
    return true; // 新词汇需要复习
  }
  
  const dueDate = new Date(wordState.next_due_at);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
  
  return dueDay <= today;
}

/**
 * 获取词汇的复习优先级
 * 优先级基于过期天数和熟悉度
 * 
 * @param wordState - 词汇状态
 * @param now - 当前时间
 * @returns 优先级分数（越高越优先）
 */
export function getReviewPriority(wordState: WordState, now: Date): number {
  if (!wordState.next_due_at) {
    return 1000; // 新词汇最高优先级
  }
  
  const dueDate = new Date(wordState.next_due_at);
  const daysOverdue = Math.max(0, (now.getTime() - dueDate.getTime()) / (24 * 60 * 60 * 1000));
  
  // 优先级计算：过期天数 * 10 + (5 - 熟悉度) * 2
  // 过期越久、熟悉度越低，优先级越高
  const familiarityBonus = (5 - (wordState.familiarity ?? 0)) * 2;
  
  return daysOverdue * 10 + familiarityBonus;
}

/**
 * 初始化新词汇的状态
 * 
 * @param now - 当前时间
 * @returns 初始词汇状态
 */
export function initializeWordState(now: Date): WordState {
  return {
    familiarity: 0,
    difficulty: 2.5,
    successes: 0,
    lapses: 0,
    last_seen_at: now.toISOString(),
    next_due_at: new Date(now.getTime() + INTERVALS[0] * 24 * 60 * 60 * 1000).toISOString(),
  };
}

/**
 * 获取词汇的复习统计信息
 * 
 * @param wordState - 词汇状态
 * @returns 统计信息
 */
export function getReviewStats(wordState: WordState): {
  totalReviews: number;
  successRate: number;
  averageInterval: number;
} {
  const totalReviews = (wordState.successes ?? 0) + (wordState.lapses ?? 0);
  const successRate = totalReviews > 0 ? (wordState.successes ?? 0) / totalReviews : 0;
  
  // 计算平均间隔（基于当前熟悉度）
  const averageInterval = INTERVALS[wordState.familiarity ?? 0] ?? INTERVALS[0];
  
  return {
    totalReviews,
    successRate,
    averageInterval,
  };
}

// ==================== 验证函数 ====================

/**
 * 验证词汇状态的有效性
 * 
 * @param wordState - 词汇状态
 * @returns 验证结果
 */
export function validateWordState(wordState: WordState): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // 检查熟悉度范围
  if (wordState.familiarity < FAMILIARITY_MIN || wordState.familiarity > FAMILIARITY_MAX) {
    errors.push(`熟悉度必须在 ${FAMILIARITY_MIN} 到 ${FAMILIARITY_MAX} 之间`);
  }
  
  // 检查成功/失败次数
  if ((wordState.successes ?? 0) < 0) {
    errors.push('成功次数不能为负数');
  }
  
  if ((wordState.lapses ?? 0) < 0) {
    errors.push('失败次数不能为负数');
  }
  
  // 检查时间格式
  if (wordState.last_seen_at && isNaN(Date.parse(wordState.last_seen_at))) {
    errors.push('最后复习时间格式无效');
  }
  
  if (wordState.next_due_at && isNaN(Date.parse(wordState.next_due_at))) {
    errors.push('下次复习时间格式无效');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// ==================== 工具函数 ====================

/**
 * 获取间隔映射表
 * 
 * @returns 间隔映射表
 */
export function getIntervals(): readonly number[] {
  return INTERVALS;
}

/**
 * 获取熟悉度等级范围
 * 
 * @returns 熟悉度范围
 */
export function getFamiliarityRange(): { min: number; max: number } {
  return {
    min: FAMILIARITY_MIN,
    max: FAMILIARITY_MAX,
  };
}

/**
 * 格式化复习间隔为可读字符串
 * 
 * @param days - 天数
 * @returns 格式化的字符串
 */
export function formatInterval(days: number): string {
  if (days === 1) {
    return '1天';
  } else if (days < 7) {
    return `${days}天`;
  } else if (days < 30) {
    const weeks = Math.floor(days / 7);
    const remainingDays = days % 7;
    if (remainingDays === 0) {
      return `${weeks}周`;
    } else {
      return `${weeks}周${remainingDays}天`;
    }
  } else {
    const months = Math.floor(days / 30);
    const remainingDays = days % 30;
    if (remainingDays === 0) {
      return `${months}个月`;
    } else {
      return `${months}个月${remainingDays}天`;
    }
  }
} 