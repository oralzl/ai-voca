/**
 * @fileoverview JSON 解析器实现
 * @description LLM 响应的 JSON 解析和验证
 * @author thiskee
 * 
 * 任务 3.3 实现 JSON 解析器
 * 实现 LLM 响应的 JSON 解析和验证
 * 
 * JSON 解析器负责解析和验证 LLM 返回的 JSON 响应
 * 包括类型验证、错误处理、数据转换等功能
 */

import { z } from 'zod';
import type {
  TargetPosition,
} from '@ai-voca/shared';

// ==================== Zod Schema 定义 ====================

/**
 * 目标词位置 Schema
 */
export const TargetPositionSchema = z.object({
  word: z.string().min(1),
  begin: z.number().min(0),
  end: z.number().min(0),
});

/**
 * 新词汇 Schema
 */
export const NewTermSchema = z.object({
  surface: z.string().min(1),
  cefr: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  gloss: z.string().min(1),
});

/**
 * 自评结果 Schema
 */
export const SelfEvaluationSchema = z.object({
  predicted_cefr: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  estimated_new_terms_count: z.number().min(0).max(10),
  new_terms: z.array(NewTermSchema).optional(),
  reason: z.string().optional(),
});

/**
 * 生成的句子项目 Schema
 */
export const GeneratedItemSchema = z.object({
  sid: z.string().min(1),
  text: z.string().min(10).max(500),
  targets: z.array(TargetPositionSchema).min(1),
  self_eval: SelfEvaluationSchema,
});

/**
 * 生成响应 Schema
 */
export const GenerateItemsOutputSchema = z.object({
  items: z.array(GeneratedItemSchema).min(1).max(10),
});

// ==================== 类型导出 ====================

export type ParsedGeneratedItem = z.infer<typeof GeneratedItemSchema>;
export type ParsedGenerateItemsOutput = z.infer<typeof GenerateItemsOutputSchema>;

// ==================== 解析错误类型 ====================

export interface ParseError {
  message: string;
  position?: number;
  expected?: string;
  received?: string;
  details?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ParseResult {
  success: boolean;
  data?: ParsedGenerateItemsOutput;
  errors: ParseError[];
  validationErrors: ValidationError[];
}

// ==================== 核心解析函数 ====================

/**
 * 解析生成项目的 JSON 响应
 * 实现完整的 JSON 解析和验证逻辑
 */
export function parseGenerateItemsJSON(jsonString: string): ParseResult {
  const result: ParseResult = {
    success: false,
    errors: [],
    validationErrors: [],
  };

  try {
    // 第一步：JSON 解析
    let jsonData: any;
    try {
      jsonData = JSON.parse(jsonString);
    } catch (jsonError) {
      result.errors.push({
        message: 'JSON 解析失败',
        details: (jsonError as Error).message,
        received: jsonString.substring(0, 100) + '...',
      });
      return result;
    }

    // 第二步：Zod Schema 验证
    try {
      const validatedData = GenerateItemsOutputSchema.parse(jsonData);
      result.data = validatedData;
      result.success = true;
    } catch (zodError) {
      if (zodError instanceof z.ZodError) {
        // 处理 Zod 验证错误
        for (const issue of zodError.issues) {
          const field = issue.path.join('.');
          result.validationErrors.push({
            field,
            message: issue.message,
            value: issue.input,
          });
        }
        
        result.errors.push({
          message: 'JSON 结构验证失败',
          expected: '符合 GenerateItemsOutput 格式的对象',
          received: JSON.stringify(jsonData).substring(0, 100) + '...',
          details: `验证失败: ${zodError.message}`,
        });
      } else {
        result.errors.push({
          message: '未知验证错误',
          details: (zodError as Error).message,
        });
      }
    }

  } catch (error) {
    result.errors.push({
      message: '解析过程中发生未知错误',
      details: (error as Error).message,
    });
  }

  return result;
}

/**
 * 验证生成的句子是否包含目标词
 * 实现目标词覆盖检查
 */
export function validateGeneratedItems(
  items: ParsedGeneratedItem[],
  targetWords: string[]
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  coverage: number;
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  let totalCoverage = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const sentence = item.text.toLowerCase();
    let itemCoverage = 0;
    
    // 检查目标词覆盖
    for (const word of targetWords) {
      const wordLower = word.toLowerCase();
      if (!sentence.includes(wordLower)) {
        errors.push(`句子 ${i + 1} (${item.sid}) 缺少目标词: "${word}"`);
      } else {
        itemCoverage++;
      }
    }

    // 检查目标词位置信息
    for (const target of item.targets) {
      const targetWord = target.word.toLowerCase();

      
      // 验证位置信息
      if (target.begin < 0 || target.end > sentence.length) {
        errors.push(`句子 ${i + 1} (${item.sid}) 目标词 "${target.word}" 位置信息无效: [${target.begin}, ${target.end}]`);
      }
      
      // 验证位置对应的文本
      const positionedText = sentence.substring(target.begin, target.end);
      if (positionedText.toLowerCase() !== targetWord) {
        errors.push(`句子 ${i + 1} (${item.sid}) 目标词 "${target.word}" 位置文本不匹配: "${positionedText}" != "${targetWord}"`);
      }
    }

    // 检查句子长度
    if (item.text.length < 10) {
      warnings.push(`句子 ${i + 1} (${item.sid}) 长度过短: ${item.text.length} 字符`);
    } else if (item.text.length > 500) {
      warnings.push(`句子 ${i + 1} (${item.sid}) 长度过长: ${item.text.length} 字符`);
    }

    // 检查自评结果
    if (item.self_eval.estimated_new_terms_count < 0 || item.self_eval.estimated_new_terms_count > 10) {
      errors.push(`句子 ${i + 1} (${item.sid}) 估计新词数量超出范围: ${item.self_eval.estimated_new_terms_count}`);
    }

    // 计算覆盖率
    totalCoverage += itemCoverage / targetWords.length;
  }

  const averageCoverage = items.length > 0 ? totalCoverage / items.length : 0;

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    coverage: averageCoverage,
  };
}

/**
 * 创建默认的生成响应
 */
export function createDefaultGenerateItemsOutput(): ParsedGenerateItemsOutput {
  return {
    items: [],
  };
}

/**
 * 验证目标词位置信息
 */
export function validateTargetPositions(
  text: string,
  targets: TargetPosition[]
): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  for (const target of targets) {
    // 检查位置范围
    if (target.begin < 0 || target.end > text.length) {
      errors.push(`目标词 "${target.word}" 位置超出范围: [${target.begin}, ${target.end}]`);
      continue;
    }

    // 检查位置顺序
    if (target.begin >= target.end) {
      errors.push(`目标词 "${target.word}" 位置顺序错误: begin(${target.begin}) >= end(${target.end})`);
      continue;
    }

    // 检查位置对应的文本
    const positionedText = text.substring(target.begin, target.end);
    if (positionedText.toLowerCase() !== target.word.toLowerCase()) {
      errors.push(`目标词 "${target.word}" 位置文本不匹配: "${positionedText}" != "${target.word}"`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * 格式化解析错误信息
 */
export function formatParseErrors(result: ParseResult): string {
  const messages: string[] = [];

  if (result.errors.length > 0) {
    messages.push('解析错误:');
    for (const error of result.errors) {
      messages.push(`  - ${error.message}`);
      if (error.details) {
        messages.push(`    详情: ${error.details}`);
      }
    }
  }

  if (result.validationErrors.length > 0) {
    messages.push('验证错误:');
    for (const error of result.validationErrors) {
      messages.push(`  - ${error.field}: ${error.message}`);
    }
  }

  return messages.join('\n');
} 