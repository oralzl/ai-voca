/**
 * @fileoverview 基础校验器实现
 * @description 复习系统的基础验证和校验功能
 * @author thiskee
 * 
 * 任务 2.3 实现基础校验器
 * 实现目标词覆盖检查、句长范围验证等功能
 * 
 * 校验器负责验证生成的复习内容是否符合要求
 * 包括目标词覆盖检查、句长范围验证等功能
 */

import { GenerateItemsOutput, GenerateItemsInput } from '@ai-voca/shared';

/**
 * 校验结果接口
 */
export interface ValidationResult {
  /** 是否通过校验 */
  isValid: boolean;
  /** 失败原因 */
  reason?: string;
}

/**
 * 验证基础要求
 * 检查目标词覆盖、句长范围等基本要求
 * 
 * @param output 生成输出
 * @param input 生成输入
 * @returns 校验结果
 */
export function validateBasicRequirements(
  output: GenerateItemsOutput, 
  input: GenerateItemsInput
): ValidationResult {
  // 1. 目标词必须覆盖
  const missingTargets = checkTargetCoverage(output, input.targets);
  if (missingTargets.length > 0) {
    return { 
      isValid: false, 
      reason: `missing_targets: ${missingTargets.join(',')}` 
    };
  }
  
  // 2. 基础长度检查
  const lengthOk = checkBasicLength(output, input.constraints);
  if (!lengthOk) {
    return { 
      isValid: false, 
      reason: 'length_out_of_range' 
    };
  }
  
  return { isValid: true };
}

/**
 * 检查目标词覆盖
 * 验证生成的句子是否包含所有目标词
 * 
 * @param output 生成输出
 * @param targets 目标词汇列表
 * @returns 缺失的目标词列表
 */
function checkTargetCoverage(
  output: GenerateItemsOutput, 
  targets: string[]
): string[] {
  const text = output.items.map((item: any) => item.text).join(" ").toLowerCase();
  return targets.filter(target => !text.includes(target.toLowerCase()));
}

/**
 * 检查基础长度
 * 验证生成的句子长度是否符合要求
 * 
 * @param output 生成输出
 * @param constraints 生成约束
 * @returns 是否通过长度检查
 */
function checkBasicLength(
  output: GenerateItemsOutput, 
  constraints: GenerateItemsInput['constraints']
): boolean {
  const [minLength, maxLength] = constraints.sentence_length_range;
  
  for (const item of output.items) {
    // 简单的token计算：按空格分割
    const tokens = item.text.trim().split(/\s+/).filter((token: string) => token.length > 0);
    const tokenCount = tokens.length;
    
    if (tokenCount < minLength || tokenCount > maxLength) {
      return false;
    }
  }
  
  return true;
}

/**
 * 预算检查函数（用于监控和分析，不在基础校验中使用）
 * 检查生成内容中的新词汇数量是否在预算范围内
 * 
 * @param output 生成输出
 * @param unknownBudget 新词汇预算
 * @returns 预算检查结果
 */
export function checkBudget(
  output: GenerateItemsOutput, 
  unknownBudget: number
): { 
  isWithinBudget: boolean; 
  estimatedCount: number; 
  confidence: 'high' | 'medium' | 'low' 
} {
  const estimatedCount = output.items.reduce(
    (sum: number, item: any) => sum + (item.self_eval?.estimated_new_terms_count || 0), 
    0
  );
  
  return {
    isWithinBudget: estimatedCount <= unknownBudget,
    estimatedCount,
    confidence: 'medium' // LLM自评的置信度，实际准确性需要用户反馈验证
  };
}

/**
 * 验证目标词位置
 * 检查目标词的位置标记是否正确
 * 
 * @param output 生成输出
 * @param targets 目标词汇列表
 * @returns 校验结果
 */
export function validateTargetPositions(
  output: GenerateItemsOutput
): ValidationResult {
  for (const item of output.items) {
    for (const target of item.targets) {
      // 检查位置索引是否有效
      if (target.begin < 0 || target.end < 0 || target.begin > target.end) {
        return {
          isValid: false,
          reason: `invalid_target_position: ${target.word} at [${target.begin}, ${target.end}]`
        };
      }
      
      // 检查目标词是否在指定位置
      const text = item.text.toLowerCase();
      const targetWord = target.word.toLowerCase();
      const positionText = text.substring(target.begin, target.end + 1);
      
      if (!positionText.includes(targetWord)) {
        return {
          isValid: false,
          reason: `target_word_not_found_at_position: ${target.word}`
        };
      }
    }
  }
  
  return { isValid: true };
}

/**
 * 验证自评结果
 * 检查LLM的自评结果是否合理
 * 
 * @param output 生成输出
 * @returns 校验结果
 */
export function validateSelfEvaluation(
  output: GenerateItemsOutput
): ValidationResult {
  for (const item of output.items) {
    const selfEval = item.self_eval;
    
    // 检查CEFR等级是否有效
    if (!['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(selfEval.predicted_cefr)) {
      return {
        isValid: false,
        reason: `invalid_cefr_level: ${selfEval.predicted_cefr}`
      };
    }
    
    // 检查新词汇数量是否合理
    if (selfEval.estimated_new_terms_count < 0) {
      return {
        isValid: false,
        reason: `negative_new_terms_count: ${selfEval.estimated_new_terms_count}`
      };
    }
    
    // 检查新词汇列表与数量是否一致
    if (selfEval.new_terms && selfEval.new_terms.length !== selfEval.estimated_new_terms_count) {
      return {
        isValid: false,
        reason: `new_terms_count_mismatch: estimated ${selfEval.estimated_new_terms_count}, actual ${selfEval.new_terms.length}`
      };
    }
  }
  
  return { isValid: true };
} 