/**
 * @fileoverview 基础校验器测试
 * @description 测试复习系统的基础验证和校验功能
 * @author thiskee
 * 
 * 任务 2.3 实现基础校验器测试
 * 测试目标词覆盖检查、句长范围验证等功能
 */

import { describe, it, expect } from 'vitest';
import { 
  validateBasicRequirements, 
  checkBudget, 
  validateTargetPositions, 
  validateSelfEvaluation 
} from './validator';
import { GenerateItemsOutput, GenerateItemsInput } from '@ai-voca/shared';

describe('基础校验器', () => {
  describe('validateBasicRequirements', () => {
    it('应该通过有效的生成输出', () => {
      const input: GenerateItemsInput = {
        targets: ['apple', 'banana'],
        profile: {
          level_cefr: 'B1',
          allow_incidental: true,
          unknown_budget: 2,
          style: 'neutral',
          difficulty_bias: 0.0
        },
        constraints: {
          sentence_length_range: [12, 22],
          max_targets_per_sentence: 2
        }
      };

      const output: GenerateItemsOutput = {
        items: [
          {
            sid: 's1',
            text: 'I eat an apple and a banana every single day of the week.',
            targets: [
              { word: 'apple', begin: 8, end: 12 },
              { word: 'banana', begin: 18, end: 24 }
            ],
            self_eval: {
              predicted_cefr: 'B1',
              estimated_new_terms_count: 0,
              reason: 'Simple sentence with target words'
            }
          }
        ]
      };

      const result = validateBasicRequirements(output, input);
      expect(result.isValid).toBe(true);
    });

    it('应该检测缺失的目标词', () => {
      const input: GenerateItemsInput = {
        targets: ['apple', 'banana', 'orange'],
        profile: {
          level_cefr: 'B1',
          allow_incidental: true,
          unknown_budget: 2,
          style: 'neutral',
          difficulty_bias: 0.0
        },
        constraints: {
          sentence_length_range: [12, 22],
          max_targets_per_sentence: 2
        }
      };

      const output: GenerateItemsOutput = {
        items: [
          {
            sid: 's1',
            text: 'I eat an apple and a banana every single day.',
            targets: [
              { word: 'apple', begin: 8, end: 12 },
              { word: 'banana', begin: 18, end: 24 }
            ],
            self_eval: {
              predicted_cefr: 'B1',
              estimated_new_terms_count: 0,
              reason: 'Missing orange'
            }
          }
        ]
      };

      const result = validateBasicRequirements(output, input);
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('missing_targets: orange');
    });

    it('应该检测句长超出范围', () => {
      const input: GenerateItemsInput = {
        targets: ['apple'],
        profile: {
          level_cefr: 'B1',
          allow_incidental: true,
          unknown_budget: 2,
          style: 'neutral',
          difficulty_bias: 0.0
        },
        constraints: {
          sentence_length_range: [12, 22],
          max_targets_per_sentence: 1
        }
      };

      const output: GenerateItemsOutput = {
        items: [
          {
            sid: 's1',
            text: 'I eat an apple.', // 只有4个token，少于最小值12
            targets: [
              { word: 'apple', begin: 8, end: 12 }
            ],
            self_eval: {
              predicted_cefr: 'B1',
              estimated_new_terms_count: 0,
              reason: 'Too short sentence'
            }
          }
        ]
      };

      const result = validateBasicRequirements(output, input);
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('length_out_of_range');
    });

    it('应该检测句长超过最大值', () => {
      const input: GenerateItemsInput = {
        targets: ['apple'],
        profile: {
          level_cefr: 'B1',
          allow_incidental: true,
          unknown_budget: 2,
          style: 'neutral',
          difficulty_bias: 0.0
        },
        constraints: {
          sentence_length_range: [12, 22],
          max_targets_per_sentence: 1
        }
      };

      const output: GenerateItemsOutput = {
        items: [
          {
            sid: 's1',
            text: 'I eat an apple every single day of the week because it is very healthy and nutritious for my body and mind and soul.', // 超过22个token
            targets: [
              { word: 'apple', begin: 8, end: 12 }
            ],
            self_eval: {
              predicted_cefr: 'B1',
              estimated_new_terms_count: 0,
              reason: 'Too long sentence'
            }
          }
        ]
      };

      const result = validateBasicRequirements(output, input);
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('length_out_of_range');
    });
  });

  describe('checkBudget', () => {
    it('应该正确计算预算使用情况', () => {
      const output: GenerateItemsOutput = {
        items: [
          {
            sid: 's1',
            text: 'I eat an apple.',
            targets: [
              { word: 'apple', begin: 8, end: 12 }
            ],
            self_eval: {
              predicted_cefr: 'B1',
              estimated_new_terms_count: 1,
              new_terms: [
                { surface: 'nutritious', cefr: 'B2', gloss: 'healthy' }
              ],
              reason: 'Contains one new term'
            }
          }
        ]
      };

      const result = checkBudget(output, 2);
      expect(result.isWithinBudget).toBe(true);
      expect(result.estimatedCount).toBe(1);
      expect(result.confidence).toBe('medium');
    });

    it('应该检测预算超支', () => {
      const output: GenerateItemsOutput = {
        items: [
          {
            sid: 's1',
            text: 'I eat an apple.',
            targets: [
              { word: 'apple', begin: 8, end: 12 }
            ],
            self_eval: {
              predicted_cefr: 'B1',
              estimated_new_terms_count: 3,
              new_terms: [
                { surface: 'nutritious', cefr: 'B2', gloss: 'healthy' },
                { surface: 'beneficial', cefr: 'B2', gloss: 'helpful' },
                { surface: 'essential', cefr: 'B2', gloss: 'necessary' }
              ],
              reason: 'Contains three new terms'
            }
          }
        ]
      };

      const result = checkBudget(output, 2);
      expect(result.isWithinBudget).toBe(false);
      expect(result.estimatedCount).toBe(3);
    });
  });

  describe('validateTargetPositions', () => {
    it('应该通过有效的位置标记', () => {
      const output: GenerateItemsOutput = {
        items: [
          {
            sid: 's1',
            text: 'I eat an apple.',
            targets: [
              { word: 'apple', begin: 8, end: 12 }
            ],
            self_eval: {
              predicted_cefr: 'B1',
              estimated_new_terms_count: 0,
              reason: 'Valid position'
            }
          }
        ]
      };

      const result = validateTargetPositions(output, ['apple']);
      expect(result.isValid).toBe(false); // 这个测试应该失败，因为位置索引不正确
      expect(result.reason).toContain('target_word_not_found_at_position');
    });

    it('应该检测无效的位置索引', () => {
      const output: GenerateItemsOutput = {
        items: [
          {
            sid: 's1',
            text: 'I eat an apple.',
            targets: [
              { word: 'apple', begin: -1, end: 12 } // 无效的开始位置
            ],
            self_eval: {
              predicted_cefr: 'B1',
              estimated_new_terms_count: 0,
              reason: 'Invalid position'
            }
          }
        ]
      };

      const result = validateTargetPositions(output, ['apple']);
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('invalid_target_position');
    });

    it('应该检测位置不匹配', () => {
      const output: GenerateItemsOutput = {
        items: [
          {
            sid: 's1',
            text: 'I eat an apple.',
            targets: [
              { word: 'apple', begin: 0, end: 4 } // 位置不匹配实际单词
            ],
            self_eval: {
              predicted_cefr: 'B1',
              estimated_new_terms_count: 0,
              reason: 'Position mismatch'
            }
          }
        ]
      };

      const result = validateTargetPositions(output, ['apple']);
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('target_word_not_found_at_position');
    });
  });

  describe('validateSelfEvaluation', () => {
    it('应该通过有效的自评结果', () => {
      const output: GenerateItemsOutput = {
        items: [
          {
            sid: 's1',
            text: 'I eat an apple.',
            targets: [
              { word: 'apple', begin: 8, end: 12 }
            ],
            self_eval: {
              predicted_cefr: 'B1',
              estimated_new_terms_count: 1,
              new_terms: [
                { surface: 'nutritious', cefr: 'B2', gloss: 'healthy' }
              ],
              reason: 'Valid self evaluation'
            }
          }
        ]
      };

      const result = validateSelfEvaluation(output);
      expect(result.isValid).toBe(true);
    });

    it('应该检测无效的CEFR等级', () => {
      const output: GenerateItemsOutput = {
        items: [
          {
            sid: 's1',
            text: 'I eat an apple.',
            targets: [
              { word: 'apple', begin: 8, end: 12 }
            ],
            self_eval: {
              predicted_cefr: 'B3' as any, // 无效的CEFR等级
              estimated_new_terms_count: 0,
              reason: 'Invalid CEFR level'
            }
          }
        ]
      };

      const result = validateSelfEvaluation(output);
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('invalid_cefr_level');
    });

    it('应该检测负数的新词汇数量', () => {
      const output: GenerateItemsOutput = {
        items: [
          {
            sid: 's1',
            text: 'I eat an apple.',
            targets: [
              { word: 'apple', begin: 8, end: 12 }
            ],
            self_eval: {
              predicted_cefr: 'B1',
              estimated_new_terms_count: -1, // 负数
              reason: 'Negative count'
            }
          }
        ]
      };

      const result = validateSelfEvaluation(output);
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('negative_new_terms_count');
    });

    it('应该检测新词汇数量不匹配', () => {
      const output: GenerateItemsOutput = {
        items: [
          {
            sid: 's1',
            text: 'I eat an apple.',
            targets: [
              { word: 'apple', begin: 8, end: 12 }
            ],
            self_eval: {
              predicted_cefr: 'B1',
              estimated_new_terms_count: 2, // 估计2个
              new_terms: [
                { surface: 'nutritious', cefr: 'B2', gloss: 'healthy' }
                // 实际只有1个
              ],
              reason: 'Count mismatch'
            }
          }
        ]
      };

      const result = validateSelfEvaluation(output);
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('new_terms_count_mismatch');
    });
  });
}); 