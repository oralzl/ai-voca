import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import type { AiHubMixRequest, AiHubMixResponse, AiHubMixMessage } from '../types/index.js';

/**
 * AiHubMix API 客户端配置
 */
export interface AiHubMixConfig {
  apiUrl?: string;
  apiKey: string;
  model?: string;
  timeout?: number;
  defaultTemperature?: number;
  defaultMaxTokens?: number;
}

/**
 * AiHubMix API 客户端封装
 * 提供统一的 AI 模型调用接口，支持多种模型
 */
export class AiHubMixClient {
  private readonly axiosInstance: AxiosInstance;
  private readonly defaultModel: string;
  private readonly defaultTemperature: number;
  private readonly defaultMaxTokens: number;

  constructor(config: AiHubMixConfig) {
    if (!config.apiKey) {
      throw new Error('AiHubMix API key is required');
    }

    this.defaultModel = config.model || 'gemini-2.5-flash-lite-preview-06-17';
    this.defaultTemperature = config.defaultTemperature || 0.1;
    this.defaultMaxTokens = config.defaultMaxTokens || 2000;

    this.axiosInstance = axios.create({
      baseURL: config.apiUrl || 'https://aihubmix.com/v1',
      timeout: config.timeout || 30000,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * 发送聊天完成请求
   * @param messages 消息数组
   * @param options 请求选项
   * @returns API 响应
   */
  async chatCompletion(
    messages: AiHubMixMessage[],
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      stream?: boolean;
    }
  ): Promise<AiHubMixResponse> {
    const request: AiHubMixRequest = {
      model: options?.model || this.defaultModel,
      messages,
      temperature: options?.temperature || this.defaultTemperature,
      max_tokens: options?.maxTokens || this.defaultMaxTokens,
      stream: options?.stream || false,
    };

    console.log('发送 AiHubMix 请求:', {
      model: request.model,
      messageCount: messages.length,
      temperature: request.temperature,
      maxTokens: request.max_tokens,
    });

    try {
      const response = await this.axiosInstance.post<AiHubMixResponse>('/chat/completions', request);
      
      if (!response.data.choices || response.data.choices.length === 0) {
        throw new Error('AI API 返回空响应');
      }

      return response.data;
    } catch (error: any) {
      console.error('AiHubMix API 调用失败:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('API 密钥无效');
        } else if (error.response?.status === 429) {
          throw new Error('API 调用频率超限');
        } else if (error.code === 'ECONNABORTED') {
          throw new Error('请求超时');
        } else {
          throw new Error(`API 错误: ${error.response?.data?.error?.message || error.message}`);
        }
      }
      
      throw error;
    }
  }

  /**
   * 获取当前默认模型
   */
  getDefaultModel(): string {
    return this.defaultModel;
  }

  /**
   * 更新请求配置
   * @param config 新的配置
   */
  updateConfig(config: Partial<AxiosRequestConfig>): void {
    Object.assign(this.axiosInstance.defaults, config);
  }
}

/**
 * 创建 AiHubMix 客户端实例
 * @param config 配置选项
 * @returns AiHubMix 客户端实例
 */
export function createAiHubMixClient(config: AiHubMixConfig): AiHubMixClient {
  return new AiHubMixClient(config);
}

/**
 * 从环境变量创建 AiHubMix 客户端
 * @returns AiHubMix 客户端实例
 */
export function createAiHubMixClientFromEnv(): AiHubMixClient {
  const config: AiHubMixConfig = {
    apiUrl: process.env.AIHUBMIX_API_URL,
    apiKey: process.env.AIHUBMIX_API_KEY || '',
    model: process.env.AIHUBMIX_MODEL,
    timeout: process.env.AIHUBMIX_TIMEOUT ? parseInt(process.env.AIHUBMIX_TIMEOUT) : undefined,
  };

  return new AiHubMixClient(config);
}