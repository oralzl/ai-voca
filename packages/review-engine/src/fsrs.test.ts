/**
 * @fileoverview FSRS 算法测试文件
 * @description FSRS 算法的单元测试和验证
 * @author thiskee
 * 
 * 任务 2.1 实现
 * 测试 FSRS 算法的核心功能和边界情况
 * 
 * 测试覆盖 FSRS 算法的初始化、更新、参数验证等功能
 * 确保算法的正确性和稳定性
 */

import { describe, it, expect } from 'vitest';
import { 
  fsrsUpdate, 
  initializeWordState, 
  getIntervals,
  getFamiliarityRange,
  isDueToday,
  getReviewPriority,
  getReviewStats,
  validateWordState,
  formatInterval,
} from './fsrs';
import type { WordState, Rating } from '@ai-voca/shared';

describe('FSRS Algorithm', () => {
  const now = new Date('2024-01-01T10:00:00Z');

  describe('fsrsUpdate', () => {
    it('should handle again rating correctly', () => {
      const prev: WordState = {
        familiarity: 3,
        difficulty: 2.5,
        successes: 5,
        lapses: 2,
        last_seen_at: '2024-01-01T09:00:00Z',
        next_due_at: '2024-01-01T09:00:00Z',
      };

      const result = fsrsUpdate(prev, 'again', now);
      
      expect(result.next.familiarity).toBe(2); // 熟悉度降低
      expect(result.next.lapses).toBe(3); // 失败次数增加
      expect(result.next.successes).toBe(5); // 成功次数不变
      expect(result.next.last_seen_at).toBe(now.toISOString());
      expect(result.next.next_due_at).toBeDefined();
    });

    it('should handle unknown rating correctly', () => {
      const prev: WordState = {
        familiarity: 1,
        difficulty: 2.5,
        successes: 2,
        lapses: 1,
      };

      const result = fsrsUpdate(prev, 'unknown', now);
      
      expect(result.next.familiarity).toBe(0); // 熟悉度降到最低
      expect(result.next.lapses).toBe(2); // 失败次数增加
      expect(result.next.successes).toBe(2); // 成功次数不变
    });

    it('should handle hard rating correctly', () => {
      const prev: WordState = {
        familiarity: 2,
        difficulty: 2.5,
        successes: 3,
        lapses: 1,
      };

      const result = fsrsUpdate(prev, 'hard', now);
      
      expect(result.next.familiarity).toBe(2); // 熟悉度保持不变
      expect(result.next.lapses).toBe(1); // 失败次数不变
      expect(result.next.successes).toBe(3); // 成功次数不变
    });

    it('should handle good rating correctly', () => {
      const prev: WordState = {
        familiarity: 2,
        difficulty: 2.5,
        successes: 3,
        lapses: 1,
      };

      const result = fsrsUpdate(prev, 'good', now);
      
      expect(result.next.familiarity).toBe(3); // 熟悉度增加
      expect(result.next.successes).toBe(4); // 成功次数增加
      expect(result.next.lapses).toBe(1); // 失败次数不变
    });

    it('should handle easy rating correctly', () => {
      const prev: WordState = {
        familiarity: 4,
        difficulty: 2.5,
        successes: 8,
        lapses: 1,
      };

      const result = fsrsUpdate(prev, 'easy', now);
      
      expect(result.next.familiarity).toBe(5); // 熟悉度增加到最高
      expect(result.next.successes).toBe(9); // 成功次数增加
      expect(result.next.lapses).toBe(1); // 失败次数不变
    });

    it('should not decrease familiarity below minimum', () => {
      const prev: WordState = {
        familiarity: 0,
        difficulty: 2.5,
        successes: 0,
        lapses: 0,
      };

      const result = fsrsUpdate(prev, 'again', now);
      
      expect(result.next.familiarity).toBe(0); // 不能低于最小值
    });

    it('should not increase familiarity above maximum', () => {
      const prev: WordState = {
        familiarity: 5,
        difficulty: 2.5,
        successes: 10,
        lapses: 0,
      };

      const result = fsrsUpdate(prev, 'easy', now);
      
      expect(result.next.familiarity).toBe(5); // 不能高于最大值
    });

    it('should calculate correct intervals based on familiarity', () => {
      const intervals = getIntervals();
      
      for (let familiarity = 0; familiarity <= 5; familiarity++) {
        const prev: WordState = {
          familiarity,
          difficulty: 2.5,
          successes: 0,
          lapses: 0,
        };

        const result = fsrsUpdate(prev, 'good', now);
        const expectedInterval = intervals[Math.min(familiarity + 1, intervals.length - 1)];
        const actualInterval = Math.floor(
          (new Date(result.next.next_due_at!).getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
        );
        
        expect(actualInterval).toBe(expectedInterval);
      }
    });

    it('should handle undefined values gracefully', () => {
      const prev: WordState = {
        familiarity: undefined as any,
        difficulty: 2.5,
        successes: undefined as any,
        lapses: undefined as any,
      };

      const result = fsrsUpdate(prev, 'good', now);
      
      expect(result.next.familiarity).toBe(1); // 默认从0开始，good评分后变为1
      expect(result.next.successes).toBe(1);
      expect(result.next.lapses).toBe(0);
    });
  });

  describe('initializeWordState', () => {
    it('should create valid initial state', () => {
      const state = initializeWordState(now);
      
      expect(state.familiarity).toBe(0);
      expect(state.difficulty).toBe(2.5);
      expect(state.successes).toBe(0);
      expect(state.lapses).toBe(0);
      expect(state.last_seen_at).toBe(now.toISOString());
      expect(state.next_due_at).toBeDefined();
      
      // 验证下次复习时间是1天后
      const nextDue = new Date(state.next_due_at!);
      const expectedDue = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      expect(nextDue.getTime()).toBe(expectedDue.getTime());
    });
  });

  describe('isDueToday', () => {
    it('should return true for new words', () => {
      const state: WordState = {
        familiarity: 0,
        difficulty: 2.5,
        successes: 0,
        lapses: 0,
      };

      expect(isDueToday(state, now)).toBe(true);
    });

    it('should return true for overdue words', () => {
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const state: WordState = {
        familiarity: 2,
        difficulty: 2.5,
        successes: 3,
        lapses: 1,
        next_due_at: yesterday.toISOString(),
      };

      expect(isDueToday(state, now)).toBe(true);
    });

    it('should return true for words due today', () => {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const state: WordState = {
        familiarity: 2,
        difficulty: 2.5,
        successes: 3,
        lapses: 1,
        next_due_at: today.toISOString(),
      };

      expect(isDueToday(state, now)).toBe(true);
    });

    it('should return false for future words', () => {
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const state: WordState = {
        familiarity: 2,
        difficulty: 2.5,
        successes: 3,
        lapses: 1,
        next_due_at: tomorrow.toISOString(),
      };

      expect(isDueToday(state, now)).toBe(false);
    });
  });

  describe('getReviewPriority', () => {
    it('should give highest priority to new words', () => {
      const state: WordState = {
        familiarity: 0,
        difficulty: 2.5,
        successes: 0,
        lapses: 0,
      };

      const priority = getReviewPriority(state, now);
      expect(priority).toBe(1000);
    });

    it('should calculate priority based on overdue days and familiarity', () => {
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const state: WordState = {
        familiarity: 1,
        difficulty: 2.5,
        successes: 2,
        lapses: 1,
        next_due_at: yesterday.toISOString(),
      };

      const priority = getReviewPriority(state, now);
      // 过期1天 * 10 + (5 - 熟悉度1) * 2 = 10 + 8 = 18
      expect(priority).toBe(18);
    });

    it('should handle words with high familiarity', () => {
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const state: WordState = {
        familiarity: 5,
        difficulty: 2.5,
        successes: 10,
        lapses: 0,
        next_due_at: yesterday.toISOString(),
      };

      const priority = getReviewPriority(state, now);
      // 过期1天 * 10 + (5 - 熟悉度5) * 2 = 10 + 0 = 10
      expect(priority).toBe(10);
    });
  });

  describe('getReviewStats', () => {
    it('should calculate correct statistics', () => {
      const state: WordState = {
        familiarity: 3,
        difficulty: 2.5,
        successes: 8,
        lapses: 2,
      };

      const stats = getReviewStats(state);
      
      expect(stats.totalReviews).toBe(10);
      expect(stats.successRate).toBe(0.8); // 8/10
      expect(stats.averageInterval).toBe(14); // intervals[3]
    });

    it('should handle zero reviews', () => {
      const state: WordState = {
        familiarity: 0,
        difficulty: 2.5,
        successes: 0,
        lapses: 0,
      };

      const stats = getReviewStats(state);
      
      expect(stats.totalReviews).toBe(0);
      expect(stats.successRate).toBe(0);
      expect(stats.averageInterval).toBe(1); // intervals[0]
    });
  });

  describe('validateWordState', () => {
    it('should validate correct state', () => {
      const state: WordState = {
        familiarity: 3,
        difficulty: 2.5,
        successes: 5,
        lapses: 2,
        last_seen_at: '2024-01-01T10:00:00Z',
        next_due_at: '2024-01-02T10:00:00Z',
      };

      const result = validateWordState(state);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid familiarity', () => {
      const state: WordState = {
        familiarity: 6, // 超出范围
        difficulty: 2.5,
        successes: 5,
        lapses: 2,
      };

      const result = validateWordState(state);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('熟悉度必须在 0 到 5 之间');
    });

    it('should detect negative counts', () => {
      const state: WordState = {
        familiarity: 3,
        difficulty: 2.5,
        successes: -1, // 负数
        lapses: 2,
      };

      const result = validateWordState(state);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('成功次数不能为负数');
    });

    it('should detect invalid date formats', () => {
      const state: WordState = {
        familiarity: 3,
        difficulty: 2.5,
        successes: 5,
        lapses: 2,
        last_seen_at: 'invalid-date',
      };

      const result = validateWordState(state);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('最后复习时间格式无效');
    });
  });

  describe('getIntervals', () => {
    it('should return correct intervals', () => {
      const intervals = getIntervals();
      
      expect(intervals).toEqual([1, 3, 7, 14, 30, 60]);
    });
  });

  describe('getFamiliarityRange', () => {
    it('should return correct range', () => {
      const range = getFamiliarityRange();
      
      expect(range.min).toBe(0);
      expect(range.max).toBe(5);
    });
  });

  describe('formatInterval', () => {
    it('should format single day correctly', () => {
      expect(formatInterval(1)).toBe('1天');
    });

    it('should format multiple days correctly', () => {
      expect(formatInterval(3)).toBe('3天');
    });

    it('should format weeks correctly', () => {
      expect(formatInterval(7)).toBe('1周');
      expect(formatInterval(14)).toBe('2周');
      expect(formatInterval(10)).toBe('1周3天');
    });

    it('should format months correctly', () => {
      expect(formatInterval(30)).toBe('1个月');
      expect(formatInterval(60)).toBe('2个月');
      expect(formatInterval(45)).toBe('1个月15天');
    });
  });
}); 