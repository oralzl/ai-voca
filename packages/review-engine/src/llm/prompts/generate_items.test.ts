/**
 * @fileoverview 提示词构建器测试
 * @description 测试提示词构建器的各项功能
 * @author thiskee
 * 
 * 任务 3.2 测试文件
 * 验证提示词构建器的模板变量替换和构建功能
 */

import { describe, it, expect } from 'vitest';
import {
  buildPrompt,
  validatePromptParams,
  createPromptParams,
  getDefaultPromptTemplate,
  getPromptHash,
  PromptParams,
} from './generate_items';

describe('提示词构建器', () => {
  describe('createPromptParams', () => {
    it('应该创建默认参数', () => {
      const params = createPromptParams(['happy', 'success']);
      
      expect(params.targets).toEqual(['happy', 'success']);
      expect(params.profile.level_cefr).toBe('B1');
      expect(params.profile.difficulty_bias).toBe(0);
      expect(params.profile.allow_incidental).toBe(true);
      expect(params.profile.unknown_budget).toBe(2);
      expect(params.profile.style).toBe('neutral');
      expect(params.constraints.sentence_length_range).toEqual([12, 22]);
      expect(params.constraints.max_targets_per_sentence).toBe(4);
    });

    it('应该合并自定义参数', () => {
      const params = createPromptParams(
        ['happy', 'success'],
        {
          level_cefr: 'C1',
          difficulty_bias: 0.5,
          style: 'academic',
        },
        {
          sentence_length_range: [15, 25],
          max_targets_per_sentence: 6,
        }
      );
      
      expect(params.profile.level_cefr).toBe('C1');
      expect(params.profile.difficulty_bias).toBe(0.5);
      expect(params.profile.style).toBe('academic');
      expect(params.constraints.sentence_length_range).toEqual([15, 25]);
      expect(params.constraints.max_targets_per_sentence).toBe(6);
    });
  });

  describe('validatePromptParams', () => {
    it('应该验证有效参数', () => {
      const validParams = {
        targets: ['happy', 'success'],
        profile: {
          level_cefr: 'B1' as const,
          difficulty_bias: 0,
          allow_incidental: true,
          unknown_budget: 2,
          style: 'neutral' as const,
        },
        constraints: {
          sentence_length_range: [12, 22] as [number, number],
          max_targets_per_sentence: 4,
        },
      };
      
      const result = validatePromptParams(validParams);
      expect(result).toEqual(validParams);
    });

    it('应该拒绝无效参数', () => {
      const invalidParams = {
        targets: ['happy'], // 只有一个目标词，但其他参数缺失
      };
      
      expect(() => validatePromptParams(invalidParams)).toThrow();
    });

    it('应该拒绝超出范围的目标词数量', () => {
      const invalidParams = {
        targets: Array(10).fill('word'), // 超过8个目标词
        profile: {
          level_cefr: 'B1' as const,
          difficulty_bias: 0,
          allow_incidental: true,
          unknown_budget: 2,
          style: 'neutral' as const,
        },
        constraints: {
          sentence_length_range: [12, 22] as [number, number],
          max_targets_per_sentence: 4,
        },
      };
      
      expect(() => validatePromptParams(invalidParams)).toThrow();
    });

    it('应该拒绝无效的CEFR等级', () => {
      const invalidParams = {
        targets: ['happy', 'success'],
        profile: {
          level_cefr: 'X1' as any, // 无效的CEFR等级
          difficulty_bias: 0,
          allow_incidental: true,
          unknown_budget: 2,
          style: 'neutral' as const,
        },
        constraints: {
          sentence_length_range: [12, 22] as [number, number],
          max_targets_per_sentence: 4,
        },
      };
      
      expect(() => validatePromptParams(invalidParams)).toThrow();
    });
  });

  describe('buildPrompt', () => {
    it('应该构建完整的提示词', () => {
      const params = createPromptParams(['happy', 'success']);
      const prompt = buildPrompt(params);
      
      // 验证提示词包含必要的部分
      expect(prompt).toContain('# SYSTEM');
      expect(prompt).toContain('# DEVELOPER');
      expect(prompt).toContain('# USER');
      
      // 验证变量替换
      expect(prompt).toContain('["happy","success"]');
      expect(prompt).toContain('"B1"');
      expect(prompt).toContain('"neutral"');
      expect(prompt).toContain('[12,22]');
      expect(prompt).toContain('4');
    });

    it('应该正确替换所有模板变量', () => {
      const params = createPromptParams(
        ['test', 'word'],
        {
          level_cefr: 'C2',
          difficulty_bias: 1.0,
          style: 'academic',
        },
        {
          sentence_length_range: [20, 30],
          max_targets_per_sentence: 8,
        }
      );
      
      const prompt = buildPrompt(params);
      
      // 验证所有变量都被正确替换
      expect(prompt).toContain('["test","word"]');
      expect(prompt).toContain('"C2"');
      expect(prompt).toContain('"academic"');
      expect(prompt).toContain('[20,30]');
      expect(prompt).toContain('8');
      expect(prompt).toContain('1');
      expect(prompt).toContain('true');
      expect(prompt).toContain('2');
    });

    it('应该处理特殊字符的转义', () => {
      const params = createPromptParams(['test-word', 'user\'s']);
      const prompt = buildPrompt(params);
      
      // 验证特殊字符被正确处理
      expect(prompt).toContain('["test-word","user\'s"]');
    });
  });

  describe('getDefaultPromptTemplate', () => {
    it('应该返回完整的模板结构', () => {
      const template = getDefaultPromptTemplate();
      
      expect(template.system).toBeTruthy();
      expect(template.developer).toBeTruthy();
      expect(template.user).toBeTruthy();
      expect(template.examples).toBeDefined();
      expect(template.examples!.length).toBeGreaterThan(0);
    });

    it('应该包含必要的模板变量', () => {
      const template = getDefaultPromptTemplate();
      
      // 验证模板包含所有必要的变量占位符
      expect(template.developer).toContain('{{profile.level_cefr}}');
      expect(template.developer).toContain('{{profile.difficulty_bias}}');
      expect(template.developer).toContain('{{profile.allow_incidental}}');
      expect(template.developer).toContain('{{profile.unknown_budget}}');
      expect(template.developer).toContain('{{profile.style}}');
      expect(template.developer).toContain('{{constraints.sentence_length_range.0}}');
      expect(template.developer).toContain('{{constraints.sentence_length_range.1}}');
      expect(template.developer).toContain('{{constraints.max_targets_per_sentence}}');
      expect(template.user).toContain('{{targets | json}}');
      expect(template.user).toContain('{{profile | json}}');
      expect(template.user).toContain('{{constraints | json}}');
    });
  });

  describe('getPromptHash', () => {
    it('应该为相同模板生成相同哈希', () => {
      const template1 = getDefaultPromptTemplate();
      const template2 = getDefaultPromptTemplate();
      
      const hash1 = getPromptHash(template1);
      const hash2 = getPromptHash(template2);
      
      expect(hash1).toBe(hash2);
    });

    it('应该为不同模板生成不同哈希', () => {
      const template1 = getDefaultPromptTemplate();
      const template2 = {
        ...template1,
        system: template1.system + ' modified',
      };
      
      const hash1 = getPromptHash(template1);
      const hash2 = getPromptHash(template2);
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('边界情况', () => {
    it('应该处理空目标词数组', () => {
      expect(() => createPromptParams([])).toThrow();
    });

    it('应该处理最大目标词数量', () => {
      const maxTargets = Array(8).fill('word');
      const params = createPromptParams(maxTargets);
      expect(params.targets).toHaveLength(8);
    });

    it('应该处理极端的难度偏差值', () => {
      const params = createPromptParams(
        ['test'],
        {
          difficulty_bias: -1.5,
        }
      );
      expect(params.profile.difficulty_bias).toBe(-1.5);
      
      const params2 = createPromptParams(
        ['test'],
        {
          difficulty_bias: 1.5,
        }
      );
      expect(params2.profile.difficulty_bias).toBe(1.5);
    });

    it('应该处理不同的风格选项', () => {
      const styles = ['neutral', 'news', 'dialog', 'academic'] as const;
      
      styles.forEach(style => {
        const params = createPromptParams(['test'], { style });
        expect(params.profile.style).toBe(style);
      });
    });
  });
}); 