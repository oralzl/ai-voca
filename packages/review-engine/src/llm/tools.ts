/**
 * @fileoverview LLM 工具函数实现
 * @description 与 AI 服务集成的工具函数
 * @author thiskee
 * 
 * 任务 3.1 完成文件
 * 实现 LLM 调用和重试机制
 * 
 * LLM 工具函数负责与 AI 服务进行交互
 * 包括生成复习内容、重试机制、错误处理等功能
 */

import { z } from 'zod';
import { buildPrompt, createPromptParams } from './prompts/generate_items';
import { 
  parseGenerateItemsJSON, 
  validateGeneratedItems
} from './schemas';

// LLM 配置
export const LLMConfig = z.object({
  apiUrl: z.string().url(),
  apiKey: z.string(),
  model: z.string(),
  maxRetries: z.number().min(1).max(10),
  timeout: z.number().positive(),
});

export type LLMConfig = z.infer<typeof LLMConfig>;

// 生成请求
export const GenerateRequest = z.object({
  prompt: z.string(),
  maxTokens: z.number().positive().optional(),
  temperature: z.number().min(0).max(2).optional(),
  stopSequences: z.array(z.string()).optional(),
});

export type GenerateRequest = z.infer<typeof GenerateRequest>;

// 生成响应
export const GenerateResponse = z.object({
  text: z.string(),
  usage: z.object({
    promptTokens: z.number(),
    completionTokens: z.number(),
    totalTokens: z.number(),
  }).optional(),
});

export type GenerateResponse = z.infer<typeof GenerateResponse>;

// 生成参数
export const GenerateItemsParams = z.object({
  targetWords: z.array(z.string()).min(1).max(8),
  count: z.number().min(1).max(10).default(1),
  difficulty: z.number().min(1).max(10).default(5),
  sentenceLength: z.object({
    min: z.number().min(5).default(12),
    max: z.number().max(300).default(22),
  }).default({ min: 12, max: 22 }),
  includeExplanation: z.boolean().default(false),
  language: z.enum(['en', 'zh']).default('en'),
  maxRetries: z.number().min(0).max(10).default(3),
});

export type GenerateItemsParams = z.infer<typeof GenerateItemsParams>;

// 生成结果
export const GenerateItemsResult = z.object({
  success: z.boolean(),
  items: z.array(z.any()).optional(), // 使用 any 避免循环引用
  metadata: z.object({
    totalItems: z.number(),
    averageDifficulty: z.number(),
    targetWordCoverage: z.number().min(0).max(1),
  }).optional(),
  error: z.string().optional(),
  retryCount: z.number().default(0),
  totalTokens: z.number().optional(),
});

export type GenerateItemsResult = z.infer<typeof GenerateItemsResult>;

// 错误类型
export enum GenerateErrorType {
  API_ERROR = 'api_error',
  PARSE_ERROR = 'parse_error',
  VALIDATION_ERROR = 'validation_error',
  TIMEOUT_ERROR = 'timeout_error',
  RATE_LIMIT_ERROR = 'rate_limit_error',
}

export interface GenerateError {
  type: GenerateErrorType;
  message: string;
  details?: any;
  retryable: boolean;
}

/**
 * 生成复习项目
 * 调用 LLM 生成包含目标词的句子
 */
export async function generateItems(
  params: GenerateItemsParams,
  config: LLMConfig
): Promise<GenerateItemsResult> {
  console.log('开始生成复习项目', {
    targetWords: params.targetWords,
    count: params.count,
    difficulty: params.difficulty,
    maxRetries: params.maxRetries,
    timestamp: new Date().toISOString()
  });

  let retryCount = 0;
  const maxRetries = params.maxRetries || 3;

  while (retryCount <= maxRetries) {
    try {
      // 使用新的提示词构建器
      const promptParams = createPromptParams(
        params.targetWords,
        {
          level_cefr: 'B1', // 默认CEFR等级
          difficulty_bias: 0,
          allow_incidental: true,
          unknown_budget: 2,
          style: 'neutral',
        },
        {
          sentence_length_range: [12, 22],
          max_targets_per_sentence: 4,
        }
      );

      const prompt = buildPrompt(promptParams);
      console.log('构建提示词完成', {
        promptLength: prompt.length,
        targetWords: params.targetWords,
        retryCount
      });

      // 调用 LLM API
      let response: GenerateResponse;
      
      try {
        response = await generateWithRetry(
          {
            prompt,
            maxTokens: 1000,
            temperature: 0.7,
          },
          config
        );
      } catch (error) {
        // 如果 generateWithRetry 抛出错误，我们需要在这里处理重试逻辑
        const generateError = classifyError(error);
        console.error('LLM API 调用失败', {
          errorType: generateError.type,
          message: generateError.message,
          retryCount,
          details: generateError.details
        });

        if (generateError.retryable && retryCount < maxRetries) {
          retryCount++;
          console.log(`可重试错误，准备重试 (${retryCount}/${maxRetries})`);
          
          // 指数退避延迟
          const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          continue;
        } else {
          // 当 generateWithRetry 抛出错误时，我们需要确保重试计数正确
          // 如果这是最后一次重试，我们需要增加重试计数
          if (retryCount < maxRetries) {
            retryCount++;
          }
          return {
            success: false,
            error: generateError.message,
            retryCount: retryCount,
          };
        }
      }

      console.log('LLM API 调用成功', {
        responseLength: response.text.length,
        totalTokens: response.usage?.totalTokens,
        retryCount
      });

      // 解析 JSON 响应
      const parseResult = parseGenerateItemsJSON(response.text);
      
      if (!parseResult.success) {
        console.warn('JSON 解析失败', {
          errors: parseResult.errors,
          validationErrors: parseResult.validationErrors,
          retryCount
        });

        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`JSON 解析失败，准备重试 (${retryCount}/${maxRetries})`);
          continue;
        } else {
          return {
            success: false,
            error: `JSON 解析失败: ${parseResult.errors.map(e => e.message).join('; ')}`,
            retryCount,
            totalTokens: response.usage?.totalTokens,
          };
        }
      }

      const parsedData = parseResult.data!;
      console.log('JSON 解析成功', {
        itemsCount: parsedData.items.length,
        retryCount
      });

      // 验证生成的内容
      const validation = validateGeneratedItems(
        parsedData.items,
        params.targetWords
      );

      if (!validation.isValid) {
        console.warn('生成内容验证失败', {
          errors: validation.errors,
          warnings: validation.warnings,
          retryCount
        });

        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`验证失败，准备重试 (${retryCount}/${maxRetries})`);
          continue;
        } else {
          return {
            success: false,
            error: `生成内容验证失败: ${validation.errors.join('; ')}`,
            retryCount,
            totalTokens: response.usage?.totalTokens,
          };
        }
      }

      // 成功返回结果
      return {
        success: true,
        items: parsedData.items,
        retryCount,
        totalTokens: response.usage?.totalTokens,
        metadata: {
          totalItems: parsedData.items.length,
          averageDifficulty: 5, // 默认值，可以从自评结果计算
          targetWordCoverage: validation.coverage,
        },
      };

    } catch (error) {
      console.error('生成复习项目时发生未预期错误', {
        error,
        retryCount
      });

      if (retryCount < maxRetries) {
        retryCount++;
        console.log(`未预期错误，准备重试 (${retryCount}/${maxRetries})`);
        
        // 指数退避延迟
        const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        continue;
      } else {
        return {
          success: false,
          error: `生成复习项目失败: ${(error as Error).message}`,
          retryCount,
        };
      }
    }
  }

  // 如果所有重试都失败了
  return {
    success: false,
    error: '达到最大重试次数',
    retryCount: maxRetries,
  };
}

/**
 * 带重试机制的生成函数
 */
export async function generateWithRetry(
  request: GenerateRequest,
  config: LLMConfig
): Promise<GenerateResponse> {
  const startTime = Date.now();

  const maxRetries = config.maxRetries;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log('调用 LLM API', {
        model: config.model,
        maxTokens: request.maxTokens,
        temperature: request.temperature,
        retryCount: attempt
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);

      const response = await fetch(`${config.apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            {
              role: 'user',
              content: request.prompt
            }
          ],
          max_tokens: request.maxTokens || 1000,
          temperature: request.temperature || 0.7,
          stop: request.stopSequences,
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const text = data.choices[0].message.content;
      const usage = data.usage;

      const duration = Date.now() - startTime;
      console.log('LLM API 调用成功', {
        duration: `${duration}ms`,
        textLength: text.length,
        totalTokens: usage?.total_tokens,
        retryCount: attempt
      });

      return {
        text,
        usage: usage ? {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
        } : undefined,
      };

    } catch (error) {
      const generateError = classifyError(error);
      console.error('LLM API 调用失败', {
        errorType: generateError.type,
        message: generateError.message,
        retryCount: attempt,
        details: generateError.details
      });

      if (generateError.retryable && attempt < maxRetries) {
        console.log(`可重试错误，准备重试 (${attempt + 1}/${maxRetries})`);
        
        // 指数退避延迟
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        continue;
      } else {
        // 不可重试的错误，直接抛出
        throw new Error(generateError.message);
      }
    }
  }

  throw new Error('请求超时');
}

/**
 * 错误分类和判断是否可重试
 */
function classifyError(error: any): GenerateError {
  const message = error.message || '未知错误';
  
  // 网络错误 - 可重试
  if (error.name === 'AbortError' || message.includes('timeout') || message.includes('Network error')) {
    return {
      type: GenerateErrorType.TIMEOUT_ERROR,
      message: '请求超时',
      details: error,
      retryable: true,
    };
  }

  // HTTP 错误
  if (message.includes('HTTP')) {
    const statusMatch = message.match(/HTTP (\d+)/);
    const status = statusMatch ? parseInt(statusMatch[1]) : 0;

    // 5xx 服务器错误 - 可重试
    if (status >= 500) {
      return {
        type: GenerateErrorType.API_ERROR,
        message: `服务器错误 (${status})`,
        details: { status, originalError: error },
        retryable: true,
      };
    }

    // 429 速率限制 - 可重试
    if (status === 429) {
      return {
        type: GenerateErrorType.RATE_LIMIT_ERROR,
        message: 'API 速率限制',
        details: { status, originalError: error },
        retryable: true,
      };
    }

    // 4xx 客户端错误 - 不可重试
    return {
      type: GenerateErrorType.API_ERROR,
      message: `客户端错误 (${status})`,
      details: { status, originalError: error },
      retryable: false,
    };
  }

  // JSON 解析错误 - 可重试
  if (message.includes('JSON') || message.includes('解析')) {
    return {
      type: GenerateErrorType.PARSE_ERROR,
      message: '响应解析失败',
      details: error,
      retryable: true,
    };
  }

  // 验证错误 - 可重试
  if (message.includes('验证') || message.includes('validation')) {
    return {
      type: GenerateErrorType.VALIDATION_ERROR,
      message: '内容验证失败',
      details: error,
      retryable: true,
    };
  }

  // 默认错误 - 不可重试
  return {
    type: GenerateErrorType.API_ERROR,
    message: message,
    details: error,
    retryable: false,
  };
}

/**
 * 获取默认 LLM 配置
 */
export function getDefaultLLMConfig(): LLMConfig {
  return {
    apiUrl: process.env.LLM_API_URL || 'https://aihubmix.com/v1',
    apiKey: process.env.LLM_API_KEY || process.env.AIHUBMIX_API_KEY || '',
    model: process.env.LLM_MODEL || 'gemini-2.5-flash-lite-preview-06-17',
    maxRetries: 3,
    timeout: 30000,
  };
}

/**
 * 验证 LLM 配置
 */
export function validateLLMConfig(config: LLMConfig): boolean {
  try {
    LLMConfig.parse(config);
    return true;
  } catch (error) {
    console.error('LLM 配置验证失败:', error);
    return false;
  }
} 