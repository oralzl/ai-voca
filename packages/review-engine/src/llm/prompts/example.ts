/**
 * @fileoverview 提示词构建器使用示例
 * @description 展示如何使用提示词构建器的各种功能
 * @author thiskee
 * 
 * 任务 3.2 示例文件
 * 展示提示词构建器的使用方法
 */

import {
  buildPrompt,
  createPromptParams,
  validatePromptParams,
  getPromptHash,
  getDefaultPromptTemplate,
} from './generate_items';

/**
 * 基础使用示例
 */
export function basicExample() {
  console.log('=== 基础使用示例 ===');
  
  // 创建基础参数
  const params = createPromptParams(['happy', 'success']);
  
  // 构建提示词
  const prompt = buildPrompt(params);
  
  console.log('生成的提示词长度:', prompt.length);
  console.log('提示词包含目标词:', prompt.includes('["happy","success"]'));
  console.log('提示词包含CEFR等级:', prompt.includes('"B1"'));
  
  return prompt;
}

/**
 * 高级配置示例
 */
export function advancedExample() {
  console.log('=== 高级配置示例 ===');
  
  // 创建高级参数
  const params = createPromptParams(
    ['academic', 'research', 'methodology'],
    {
      level_cefr: 'C1',
      difficulty_bias: 0.5,
      style: 'academic',
      allow_incidental: true,
      unknown_budget: 3,
    },
    {
      sentence_length_range: [15, 25],
      max_targets_per_sentence: 6,
    }
  );
  
  // 构建提示词
  const prompt = buildPrompt(params);
  
  console.log('高级配置提示词长度:', prompt.length);
  console.log('包含学术风格:', prompt.includes('"academic"'));
  console.log('包含C1等级:', prompt.includes('"C1"'));
  
  return prompt;
}

/**
 * 参数验证示例
 */
export function validationExample() {
  console.log('=== 参数验证示例 ===');
  
  try {
    // 有效参数
    const validParams = {
      targets: ['test', 'word'],
      profile: {
        level_cefr: 'B2' as const,
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
    
    validatePromptParams(validParams);
    console.log('✅ 有效参数验证通过');
    
    // 无效参数
    const invalidParams = {
      targets: Array(10).fill('word'), // 超过8个目标词
      profile: {
        level_cefr: 'B2' as const,
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
    
    validatePromptParams(invalidParams);
    console.log('❌ 应该抛出错误但通过了');
  } catch (error) {
    console.log('✅ 无效参数被正确拒绝:', (error as Error).message);
  }
}

/**
 * 模板哈希示例
 */
export function hashExample() {
  console.log('=== 模板哈希示例 ===');
  
  const template = getDefaultPromptTemplate();
  const hash = getPromptHash(template);
  
  console.log('模板哈希值:', hash);
  console.log('哈希值长度:', hash.length);
  
  return hash;
}

/**
 * 不同风格示例
 */
export function styleExamples() {
  console.log('=== 不同风格示例 ===');
  
  const styles = ['neutral', 'news', 'dialog', 'academic'] as const;
  
  styles.forEach(style => {
    const params = createPromptParams(
      ['example', 'word'],
      { style }
    );
    
    const prompt = buildPrompt(params);
    console.log(`${style} 风格提示词长度:`, prompt.length);
  });
}

/**
 * 运行所有示例
 */
export function runAllExamples() {
  console.log('🚀 开始运行提示词构建器示例\n');
  
  basicExample();
  console.log();
  
  advancedExample();
  console.log();
  
  validationExample();
  console.log();
  
  hashExample();
  console.log();
  
  styleExamples();
  console.log();
  
  console.log('✅ 所有示例运行完成');
}

// 如果直接运行此文件
if (require.main === module) {
  runAllExamples();
} 