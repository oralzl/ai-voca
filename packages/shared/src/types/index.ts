/**
 * @fileoverview 类型定义文件
 * @module types
 * @description 定义API请求响应、单词解释、AI服务和配置等接口类型
 */

// API 请求和响应类型
export interface WordQueryRequest {
  word: string;
  includeExample?: boolean;
}

// 例句接口
export interface WordExample {
  sentence: string;
  translation?: string;
}

export interface WordExplanation {
  word: string;
  text?: string; // lemma后的单词
  lemmatizationExplanation?: string; // 对词形还原结果的简要说明
  pronunciation?: string;
  partOfSpeech?: string;
  definition: string;
  simpleExplanation?: string; // 用常见单词平白介绍的英文注释
  example?: string; // 保留向后兼容性
  examples?: WordExample[]; // 新的多例句支持
  synonyms?: string[];
  antonyms?: string[];
  etymology?: string; // 词源信息
  memoryTips?: string; // 记忆技巧
}

export interface WordQueryResponse {
  success: boolean;
  data?: WordExplanation;
  error?: string;
  timestamp: number;
  rawResponse?: string; // AI原始响应内容，用于调试
  inputParams?: {      // 查询参数，用于重试功能
    word: string;
    timestamp: number;
  };
}

// AiHubMix API 类型
export interface AiHubMixMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AiHubMixRequest {
  model: string;
  messages: AiHubMixMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface AiHubMixResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: AiHubMixMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// 错误类型
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// 配置类型
export interface AppConfig {
  apiUrl: string;
  apiKey: string;
  model: string;
  timeout: number;
}