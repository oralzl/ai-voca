/**
 * @fileoverview JSON 解析器测试
 * @description 测试 LLM 响应的 JSON 解析和验证功能
 * @author thiskee
 * 
 * 任务 3.3 测试文件
 * 测试 JSON 解析器的各种功能
 */

import { describe, it, expect } from 'vitest';
import {
  parseGenerateItemsJSON,
  validateGeneratedItems,
  validateTargetPositions,
  formatParseErrors,
  createDefaultGenerateItemsOutput,
  ParsedGeneratedItem,
  ParseResult,
} from './schemas';

describe('JSON 解析器', () => {

  describe('parseGenerateItemsJSON', () => {
    it('应该成功解析有效的 JSON 响应', () => {
      const validJSON = JSON.stringify({
        items: [
          {
            sid: 's1',
            text: 'The happy student achieved success in the exam.',
            targets: [
              { word: 'happy', begin: 4, end: 9 },
              { word: 'success', begin: 17, end: 24 },
            ],
            self_eval: {
              predicted_cefr: 'B1',
              estimated_new_terms_count: 1,
              new_terms: [
                { surface: 'achieved', cefr: 'B1', gloss: '获得，达到' },
              ],
              reason: '包含目标词且难度适中',
            },
          },
        ],
      });

      const result = parseGenerateItemsJSON(validJSON);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.items).toHaveLength(1);
      expect(result.data?.items[0].sid).toBe('s1');
      expect(result.data?.items[0].text).toBe('The happy student achieved success in the exam.');
      expect(result.data?.items[0].targets).toHaveLength(2);
      expect(result.data?.items[0].self_eval.predicted_cefr).toBe('B1');
    });

    it('应该处理无效的 JSON 格式', () => {
      const invalidJSON = '{ invalid json }';

      const result = parseGenerateItemsJSON(invalidJSON);

      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toBe('JSON 解析失败');
    });

    it('应该处理缺少必需字段的 JSON', () => {
      const incompleteJSON = JSON.stringify({
        items: [
          {
            sid: 's1',
            text: 'The happy student achieved success in the exam.',
            // 缺少 targets 和 self_eval
          },
        ],
      });

      const result = parseGenerateItemsJSON(incompleteJSON);

      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.validationErrors.length).toBeGreaterThan(0);
    });

    it('应该处理空数组', () => {
      const emptyJSON = JSON.stringify({ items: [] });

      const result = parseGenerateItemsJSON(emptyJSON);

      expect(result.success).toBe(false);
      expect(result.validationErrors.length).toBeGreaterThan(0);
    });

    it('应该处理超过最大数量的项目', () => {
      const tooManyItems = JSON.stringify({
        items: Array(11).fill({
          sid: 's1',
          text: 'Test sentence.',
          targets: [{ word: 'test', begin: 0, end: 4 }],
          self_eval: {
            predicted_cefr: 'A1',
            estimated_new_terms_count: 0,
          },
        }),
      });

      const result = parseGenerateItemsJSON(tooManyItems);

      expect(result.success).toBe(false);
      expect(result.validationErrors.length).toBeGreaterThan(0);
    });

    it('应该处理无效的 CEFR 等级', () => {
      const invalidCEFR = JSON.stringify({
        items: [
          {
            sid: 's1',
            text: 'Test sentence.',
            targets: [{ word: 'test', begin: 0, end: 4 }],
            self_eval: {
              predicted_cefr: 'INVALID',
              estimated_new_terms_count: 0,
            },
          },
        ],
      });

      const result = parseGenerateItemsJSON(invalidCEFR);

      expect(result.success).toBe(false);
      expect(result.validationErrors.length).toBeGreaterThan(0);
    });
  });

  describe('validateGeneratedItems', () => {
    const mockItems: ParsedGeneratedItem[] = [
      {
        sid: 's1',
        text: 'The happy student achieved success in the exam.',
        targets: [
          { word: 'happy', begin: 4, end: 9 },
          { word: 'success', begin: 27, end: 34 },
        ],
        self_eval: {
          predicted_cefr: 'B1',
          estimated_new_terms_count: 1,
          new_terms: [
            { surface: 'achieved', cefr: 'B1', gloss: '获得，达到' },
          ],
        },
      },
    ];

    it('应该验证包含所有目标词的句子', () => {
      const targetWords = ['happy', 'success'];
      const result = validateGeneratedItems(mockItems, targetWords);



      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.coverage).toBe(1.0);
    });

    it('应该检测缺少目标词的句子', () => {
      const targetWords = ['happy', 'success', 'missing'];
      const result = validateGeneratedItems(mockItems, targetWords);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('缺少目标词');
    });

    it('应该检测无效的目标词位置', () => {
      const invalidItems: ParsedGeneratedItem[] = [
        {
          sid: 's1',
          text: 'The happy student achieved success in the exam.',
          targets: [
            { word: 'happy', begin: 4, end: 9 },
            { word: 'success', begin: 17, end: 50 }, // 超出范围
          ],
          self_eval: {
            predicted_cefr: 'B1',
            estimated_new_terms_count: 1,
          },
        },
      ];

      const targetWords = ['happy', 'success'];
      const result = validateGeneratedItems(invalidItems, targetWords);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('位置信息无效');
    });

    it('应该检测位置文本不匹配', () => {
      const invalidItems: ParsedGeneratedItem[] = [
        {
          sid: 's1',
          text: 'The happy student achieved success in the exam.',
          targets: [
            { word: 'happy', begin: 4, end: 9 },
            { word: 'success', begin: 0, end: 4 }, // 错误位置
          ],
          self_eval: {
            predicted_cefr: 'B1',
            estimated_new_terms_count: 1,
          },
        },
      ];

      const targetWords = ['happy', 'success'];
      const result = validateGeneratedItems(invalidItems, targetWords);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('位置文本不匹配');
    });

    it('应该检测句子长度问题', () => {
      const shortItem: ParsedGeneratedItem = {
        sid: 's1',
        text: 'Hi.', // 过短
        targets: [{ word: 'hi', begin: 0, end: 2 }],
        self_eval: {
          predicted_cefr: 'A1',
          estimated_new_terms_count: 0,
        },
      };

      const result = validateGeneratedItems([shortItem], ['hi']);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('长度过短');
    });

    it('应该检测无效的新词数量', () => {
      const invalidItem: ParsedGeneratedItem = {
        sid: 's1',
        text: 'The happy student achieved success in the exam.',
        targets: [{ word: 'happy', begin: 4, end: 9 }],
        self_eval: {
          predicted_cefr: 'B1',
          estimated_new_terms_count: 15, // 超出范围
        },
      };

      const result = validateGeneratedItems([invalidItem], ['happy']);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('估计新词数量超出范围');
    });
  });

  describe('validateTargetPositions', () => {
    it('应该验证有效的目标词位置', () => {
      const text = 'The happy student achieved success in the exam.';
      const targets = [
        { word: 'happy', begin: 4, end: 9 },
        { word: 'success', begin: 27, end: 34 },
      ];

      const result = validateTargetPositions(text, targets);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('应该检测位置超出范围', () => {
      const text = 'The happy student achieved success in the exam.';
      const targets = [
        { word: 'happy', begin: 4, end: 9 },
        { word: 'success', begin: 17, end: 50 }, // 超出范围
      ];

      const result = validateTargetPositions(text, targets);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('位置超出范围');
    });

    it('应该检测位置顺序错误', () => {
      const text = 'The happy student achieved success in the exam.';
      const targets = [
        { word: 'happy', begin: 9, end: 4 }, // 顺序错误
      ];

      const result = validateTargetPositions(text, targets);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('位置顺序错误');
    });

    it('应该检测位置文本不匹配', () => {
      const text = 'The happy student achieved success in the exam.';
      const targets = [
        { word: 'happy', begin: 0, end: 4 }, // 错误位置
      ];

      const result = validateTargetPositions(text, targets);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('位置文本不匹配');
    });
  });

  describe('formatParseErrors', () => {
    it('应该格式化解析错误', () => {
      const result: ParseResult = {
        success: false,
        errors: [
          {
            message: 'JSON 解析失败',
            details: 'Unexpected token',
            received: '{ invalid }',
          },
        ],
        validationErrors: [
          {
            field: 'items.0.targets',
            message: 'Required',
            value: undefined,
          },
        ],
      };

      const formatted = formatParseErrors(result);

      expect(formatted).toContain('解析错误:');
      expect(formatted).toContain('验证错误:');
      expect(formatted).toContain('JSON 解析失败');
      expect(formatted).toContain('items.0.targets: Required');
    });

    it('应该处理只有解析错误的情况', () => {
      const result: ParseResult = {
        success: false,
        errors: [
          {
            message: 'JSON 解析失败',
            details: 'Unexpected token',
          },
        ],
        validationErrors: [],
      };

      const formatted = formatParseErrors(result);

      expect(formatted).toContain('解析错误:');
      expect(formatted).not.toContain('验证错误:');
    });

    it('应该处理只有验证错误的情况', () => {
      const result: ParseResult = {
        success: false,
        errors: [],
        validationErrors: [
          {
            field: 'items.0.sid',
            message: 'Required',
          },
        ],
      };

      const formatted = formatParseErrors(result);

      expect(formatted).not.toContain('解析错误:');
      expect(formatted).toContain('验证错误:');
    });
  });

  describe('createDefaultGenerateItemsOutput', () => {
    it('应该创建默认的生成响应', () => {
      const result = createDefaultGenerateItemsOutput();

      expect(result).toEqual({
        items: [],
      });
    });
  });
}); 