// API 请求和响应类型
export interface WordQueryRequest {
  word: string;
  language?: 'zh' | 'en';
  includeExample?: boolean;
}

// 例句接口
export interface WordExample {
  sentence: string;
  translation?: string;
}

export interface WordExplanation {
  word: string;
  pronunciation?: string;
  partOfSpeech?: string;
  definition: string;
  example?: string; // 保留向后兼容性
  examples?: WordExample[]; // 新的多例句支持
  synonyms?: string[];
  antonyms?: string[];
  etymology?: string;
}

export interface WordQueryResponse {
  success: boolean;
  data?: WordExplanation;
  error?: string;
  timestamp: number;
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