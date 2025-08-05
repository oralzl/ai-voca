/**
 * @fileoverview 难度控制器测试
 * @description 测试 EWMA 算法和难度调整功能
 * @author thiskee
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  adjustLevelAndBudget,
  calibrateBudgetEstimation,
  calculateEWMA,
  getDefaultEWMAParams,
  validateEWMAParams,
  createEWMAParams,
  formatDifficultyAdjustResult,
  formatBudgetCalibrationResult,
  type UserPrefs,
  type DifficultyFeedback,
  type EWMAParams,
} from './difficulty';

// ==================== 测试数据 ====================

/**
 * 测试用的用户偏好
 */
const mockUserPrefs: UserPrefs = {
  level_cefr: 'B1',
  allow_incidental: true,
  unknown_budget: 2,
  style: 'neutral',
  difficulty_bias: 0.0,
};

/**
 * 测试用的 EWMA 参数
 */
const testEWMAParams: EWMAParams = {
  alpha: 0.3,
  minBias: -1.5,
  maxBias: 1.5,
  minBudget: 0,
  maxBudget: 4,
};

// ==================== EWMA 算法测试 ====================

describe('EWMA 算法', () => {
  it('应该正确计算 EWMA 值', () => {
    const currentValue = 0.5;
    const newValue = 1.0;
    const alpha = 0.3;
    
    const result = calculateEWMA(currentValue, newValue, alpha);
    const expected = 0.3 * 1.0 + 0.7 * 0.5; // 0.3 + 0.35 = 0.65
    
    expect(result).toBeCloseTo(expected, 5);
  });

  it('应该处理 alpha = 0 的情况', () => {
    const currentValue = 0.5;
    const newValue = 1.0;
    const alpha = 0;
    
    const result = calculateEWMA(currentValue, newValue, alpha);
    expect(result).toBe(currentValue);
  });

  it('应该处理 alpha = 1 的情况', () => {
    const currentValue = 0.5;
    const newValue = 1.0;
    const alpha = 1;
    
    const result = calculateEWMA(currentValue, newValue, alpha);
    expect(result).toBe(newValue);
  });

  it('应该在 alpha 超出范围时抛出错误', () => {
    expect(() => calculateEWMA(0.5, 1.0, -0.1)).toThrow('EWMA alpha 参数必须在 0-1 范围内');
    expect(() => calculateEWMA(0.5, 1.0, 1.1)).toThrow('EWMA alpha 参数必须在 0-1 范围内');
  });

  it('应该展示 EWMA 的平滑效果', () => {
    const values = [1, 2, 1, 3, 1, 2, 1];
    let current = 1;
    const alpha = 0.3;
    
    const smoothed = values.map(value => {
      current = calculateEWMA(current, value, alpha);
      return current;
    });
    
    // 平滑后的值应该比原始值更稳定
    expect(smoothed[0]).toBeCloseTo(1, 5);
    expect(smoothed[1]).toBeCloseTo(1.3, 5);
    expect(smoothed[2]).toBeCloseTo(1.21, 5);
  });
});

// ==================== 难度调整测试 ====================

describe('难度调整功能', () => {
  it('应该根据 too_hard 反馈增加难度偏置', () => {
    const feedback: DifficultyFeedback = 'too_hard';
    const result = adjustLevelAndBudget(mockUserPrefs, feedback, testEWMAParams);
    
    expect(result.difficulty_bias).toBeGreaterThan(0);
    expect(result.target_level_shift).toBe(1);
    expect(result.budget).toBe(3); // 2 + 1
  });

  it('应该根据 too_easy 反馈减少难度偏置', () => {
    const feedback: DifficultyFeedback = 'too_easy';
    const result = adjustLevelAndBudget(mockUserPrefs, feedback, testEWMAParams);
    
    expect(result.difficulty_bias).toBeLessThan(0);
    expect(result.target_level_shift).toBe(-1);
    expect(result.budget).toBe(1); // 2 - 1
  });

  it('应该根据 ok 反馈保持当前难度', () => {
    const feedback: DifficultyFeedback = 'ok';
    const result = adjustLevelAndBudget(mockUserPrefs, feedback, testEWMAParams);
    
    expect(result.difficulty_bias).toBeCloseTo(0, 5);
    expect(result.target_level_shift).toBe(0);
    expect(result.budget).toBe(2); // 保持不变
  });

  it('应该处理 null 反馈', () => {
    const result = adjustLevelAndBudget(mockUserPrefs, null, testEWMAParams);
    
    expect(result.difficulty_bias).toBeCloseTo(0, 5);
    expect(result.target_level_shift).toBe(0);
    expect(result.budget).toBe(2);
  });

  it('应该限制难度偏置在合理范围内', () => {
    // 设置一个已经很高的难度偏置
    const highBiasPrefs: UserPrefs = {
      ...mockUserPrefs,
      difficulty_bias: 1.4,
    };
    
    const feedback: DifficultyFeedback = 'too_hard';
    const result = adjustLevelAndBudget(highBiasPrefs, feedback, testEWMAParams);
    
    expect(result.difficulty_bias).toBeLessThanOrEqual(1.5);
  });

  it('应该限制预算在合理范围内', () => {
    // 设置最小预算
    const minBudgetPrefs: UserPrefs = {
      ...mockUserPrefs,
      unknown_budget: 0,
    };
    
    const feedback: DifficultyFeedback = 'too_easy';
    const result = adjustLevelAndBudget(minBudgetPrefs, feedback, testEWMAParams);
    
    expect(result.budget).toBeGreaterThanOrEqual(0);
  });

  it('应该展示连续的难度调整过程', () => {
    let currentPrefs = { ...mockUserPrefs };
    const feedbacks: DifficultyFeedback[] = ['too_hard', 'too_hard', 'ok', 'too_easy'];
    
    const results = feedbacks.map(feedback => {
      const result = adjustLevelAndBudget(currentPrefs, feedback, testEWMAParams);
      currentPrefs = {
        ...currentPrefs,
        difficulty_bias: result.difficulty_bias,
        unknown_budget: result.budget,
      };
      return result;
    });
    
    // 验证调整过程
    expect(results[0].difficulty_bias).toBeGreaterThan(0);
    expect(results[1].difficulty_bias).toBeGreaterThan(results[0].difficulty_bias);
    expect(results[2].difficulty_bias).toBeCloseTo(results[1].difficulty_bias * 0.7, 5);
    expect(results[3].difficulty_bias).toBeLessThan(results[2].difficulty_bias);
  });
});

// ==================== 预算校准测试 ====================

describe('预算校准功能', () => {
  it('应该在估算准确时保持预算', () => {
    const result = calibrateBudgetEstimation(2, 2, 2);
    
    expect(result.adjustedBudget).toBe(2);
    expect(result.accuracy).toBe(1.0);
  });

  it('应该在严重低估时减少预算', () => {
    const result = calibrateBudgetEstimation(2, 4, 2); // 实际是估计的2倍
    
    expect(result.adjustedBudget).toBe(1);
    expect(result.accuracy).toBe(2.0);
  });

  it('应该在严重高估时增加预算', () => {
    const result = calibrateBudgetEstimation(4, 1, 2); // 实际是估计的1/4
    
    expect(result.adjustedBudget).toBe(3);
    expect(result.accuracy).toBe(0.25);
  });

  it('应该在估算为0时正确处理', () => {
    const result = calibrateBudgetEstimation(0, 2, 2);
    
    expect(result.accuracy).toBe(1);
    expect(result.adjustedBudget).toBe(2);
  });

  it('应该限制预算在合理范围内', () => {
    // 测试最小预算
    const result1 = calibrateBudgetEstimation(2, 4, 0);
    expect(result1.adjustedBudget).toBeGreaterThanOrEqual(0);
    
    // 测试最大预算
    const result2 = calibrateBudgetEstimation(4, 1, 4);
    expect(result2.adjustedBudget).toBeLessThanOrEqual(4);
  });
});

// ==================== 参数验证测试 ====================

describe('EWMA 参数验证', () => {
  it('应该验证有效的参数', () => {
    const validParams: EWMAParams = {
      alpha: 0.3,
      minBias: -1.5,
      maxBias: 1.5,
      minBudget: 0,
      maxBudget: 4,
    };
    
    expect(validateEWMAParams(validParams)).toBe(true);
  });

  it('应该拒绝无效的 alpha 值', () => {
    const invalidParams: EWMAParams = {
      alpha: 1.5,
      minBias: -1.5,
      maxBias: 1.5,
      minBudget: 0,
      maxBudget: 4,
    };
    
    expect(validateEWMAParams(invalidParams)).toBe(false);
  });

  it('应该拒绝无效的偏置范围', () => {
    const invalidParams: EWMAParams = {
      alpha: 0.3,
      minBias: 1.5,
      maxBias: -1.5, // 最小值大于最大值
      minBudget: 0,
      maxBudget: 4,
    };
    
    expect(validateEWMAParams(invalidParams)).toBe(false);
  });

  it('应该拒绝无效的预算范围', () => {
    const invalidParams: EWMAParams = {
      alpha: 0.3,
      minBias: -1.5,
      maxBias: 1.5,
      minBudget: 5, // 超出范围
      maxBudget: 4,
    };
    
    expect(validateEWMAParams(invalidParams)).toBe(false);
  });
});

// ==================== 工具函数测试 ====================

describe('工具函数', () => {
  it('应该格式化难度调整结果', () => {
    const result = {
      difficulty_bias: 0.5,
      target_level_shift: 1,
      budget: 3,
    };
    
    const formatted = formatDifficultyAdjustResult(result);
    expect(formatted).toContain('难度偏置增加至 0.50');
    expect(formatted).toContain('等级提升');
    expect(formatted).toContain('预算调整为 3');
  });

  it('应该格式化预算校准结果', () => {
    const result = {
      adjustedBudget: 1,
      accuracy: 2.0,
    };
    
    const formatted = formatBudgetCalibrationResult(result);
    expect(formatted).toContain('估算准确性: 2.00 (严重低估)');
    expect(formatted).toContain('预算调整为 1');
  });

  it('应该创建自定义 EWMA 参数', () => {
    const params = createEWMAParams(0.5, -2, 2, 1, 3);
    
    expect(params.alpha).toBe(0.5);
    expect(params.minBias).toBe(-2);
    expect(params.maxBias).toBe(2);
    expect(params.minBudget).toBe(1);
    expect(params.maxBudget).toBe(3);
  });

  it('应该在创建无效参数时抛出错误', () => {
    expect(() => createEWMAParams(1.5, -1.5, 1.5, 0, 4)).toThrow('无效的 EWMA 参数配置');
  });
});

// ==================== 集成测试 ====================

describe('难度控制器集成测试', () => {
  it('应该模拟完整的难度调整流程', () => {
    // 初始状态
    let userPrefs: UserPrefs = {
      level_cefr: 'B1',
      allow_incidental: true,
      unknown_budget: 2,
      style: 'neutral',
      difficulty_bias: 0.0,
    };
    
    // 模拟用户连续反馈
    const feedbacks: DifficultyFeedback[] = ['too_hard', 'too_hard', 'ok', 'too_easy'];
    const results = [];
    
    for (const feedback of feedbacks) {
      const result = adjustLevelAndBudget(userPrefs, feedback, testEWMAParams);
      results.push(result);
      
      // 更新用户偏好
      userPrefs = {
        ...userPrefs,
        difficulty_bias: result.difficulty_bias,
        unknown_budget: result.budget,
      };
    }
    
    // 验证调整过程
    expect(results[0].difficulty_bias).toBeGreaterThan(0);
    expect(results[1].difficulty_bias).toBeGreaterThan(results[0].difficulty_bias);
    expect(results[2].difficulty_bias).toBeCloseTo(results[1].difficulty_bias * 0.7, 5);
    expect(results[3].difficulty_bias).toBeLessThan(results[2].difficulty_bias);
    
    // 验证预算调整
    expect(results[0].budget).toBe(3); // 第一次 too_hard: 2 + 1 = 3
    expect(results[1].budget).toBe(4); // 第二次 too_hard: 3 + 1 = 4 (达到最大值)
    expect(results[2].budget).toBe(4); // ok: 保持 4
    expect(results[3].budget).toBe(3); // too_easy: 4 - 1 = 3
  });

  it('应该结合预算校准功能', () => {
    // 模拟生成内容的自评
    const estimatedNewTerms = 2;
    const actualUnknownWords = 3; // 用户标记了3个unknown，比估计多
    const currentBudget = 2;
    
    // 校准预算
    const calibration = calibrateBudgetEstimation(estimatedNewTerms, actualUnknownWords, currentBudget);
    
    // 调整难度
    const feedback: DifficultyFeedback = 'too_hard';
    const adjustment = adjustLevelAndBudget(mockUserPrefs, feedback, testEWMAParams);
    
    // 验证结果
    expect(calibration.adjustedBudget).toBe(1); // 因为严重低估，减少预算
    expect(adjustment.difficulty_bias).toBeGreaterThan(0); // 因为太难，增加难度偏置
  });
}); 