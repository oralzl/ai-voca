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
  pronunciation?: string | {
    uk?: string;
    us?: string;
  };
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
  isFavorited?: boolean; // 收藏状态
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

// 收藏相关类型
export interface FavoriteWord {
  id: string;
  word: string;                    // lemma后的标准形式
  originalQuery?: string;          // 原始查询词
  queryData: WordExplanation;      // 完整的单词解释数据
  rawResponse?: string;            // AI原始响应内容
  notes?: string;                  // 用户笔记
  createdAt: string;
  updatedAt: string;
}

export interface FavoriteToggleRequest {
  word: string;                    // lemma后的标准单词
  originalQuery?: string;          // 原始查询词
  queryData?: WordExplanation;     // 单词数据(添加收藏时需要)
  rawResponse?: string;            // AI原始响应内容
  notes?: string;                  // 用户笔记
}

export interface FavoriteToggleResponse {
  success: boolean;
  data?: {
    isFavorited: boolean;          // 切换后的状态
    favorite?: FavoriteWord;       // 如果是添加操作，返回收藏数据
  };
  error?: string;
}

export interface FavoriteCheckResponse {
  success: boolean;
  data?: {
    isFavorited: boolean;
    favoriteData?: WordExplanation; // 如果已收藏，返回收藏时的数据
    favorite?: FavoriteWord;        // 完整的收藏记录
  };
  error?: string;
}

export interface FavoriteListResponse {
  success: boolean;
  data?: {
    favorites: FavoriteWord[];
    total: number;
    page: number;
    pageSize: number;
  };
  error?: string;
}

// 配置类型
export interface AppConfig {
  apiUrl: string;
  apiKey: string;
  model: string;
  timeout: number;
}

// 导出复习系统类型（避免重复导出）
// export * from './review';