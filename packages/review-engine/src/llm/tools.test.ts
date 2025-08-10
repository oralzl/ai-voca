/**
 * @fileoverview LLM 工具函数测试
 * @description 测试 LLM 工具函数的各种功能
 * @author thiskee
 * 
 * 任务 3.1 测试文件
 * 测试 LLM 工具函数的实现
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateItems,
  generateWithRetry,
  getDefaultLLMConfig,
  validateLLMConfig,
  GenerateItemsParams,
  LLMConfig,
  GenerateRequest,
} from './tools';

// Mock fetch
global.fetch = vi.fn();



describe('LLM Tools', () => {
  let mockFetch: any;

  beforeEach(() => {
    mockFetch = vi.mocked(fetch);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getDefaultLLMConfig', () => {
    it('应该返回默认配置', () => {
      const config = getDefaultLLMConfig();
      
      expect(config).toEqual({
        apiUrl: 'https://aihubmix.com/v1',
        apiKey: '',
        model: 'gemini-2.5-flash-lite-preview-06-17',
        maxRetries: 3,
        timeout: 30000,
      });
    });

    it('应该使用环境变量', () => {
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        LLM_API_URL: 'https://custom.api.com',
        LLM_API_KEY: 'test-key',
        LLM_MODEL: 'custom-model',
      };

      const config = getDefaultLLMConfig();
      
      expect(config.apiUrl).toBe('https://custom.api.com');
      expect(config.apiKey).toBe('test-key');
      expect(config.model).toBe('custom-model');

      process.env = originalEnv;
    });
  });

  describe('validateLLMConfig', () => {
    it('应该验证有效配置', () => {
      const config: LLMConfig = {
        apiUrl: 'https://api.example.com',
        apiKey: 'test-key',
        model: 'test-model',
        maxRetries: 3,
        timeout: 30000,
      };

      expect(validateLLMConfig(config)).toBe(true);
    });

    it('应该拒绝无效配置', () => {
      const invalidConfig = {
        apiUrl: 'not-a-url',
        apiKey: 'test-key',
        model: 'test-model',
        maxRetries: 3,
        timeout: 30000,
      };

      expect(validateLLMConfig(invalidConfig as any)).toBe(false);
    });
  });

  describe('generateWithRetry', () => {
    it('应该成功调用 LLM API', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Test response' } }],
        usage: {
          prompt_tokens: 50,
          completion_tokens: 20,
          total_tokens: 70,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const config: LLMConfig = {
        apiUrl: 'https://api.example.com',
        apiKey: 'test-key',
        model: 'test-model',
        maxRetries: 3,
        timeout: 30000,
      };

      const request: GenerateRequest = {
        prompt: 'Test prompt',
        maxTokens: 1000,
        temperature: 0.7,
      };

      const result = await generateWithRetry(request, config);

      expect(result).toEqual({
        text: 'Test response',
        usage: {
          promptTokens: 50,
          completionTokens: 20,
          totalTokens: 70,
        },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-key',
          },
          body: JSON.stringify({
            model: 'test-model',
            messages: [{ role: 'user', content: 'Test prompt' }],
            max_tokens: 1000,
            temperature: 0.7,
            stop: undefined,
          }),
        })
      );
    });

    it('应该在失败时重试', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Test response' } }],
        usage: { total_tokens: 70 },
      };

      // 第一次失败，第二次成功
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

      const config: LLMConfig = {
        apiUrl: 'https://api.example.com',
        apiKey: 'test-key',
        model: 'test-model',
        maxRetries: 3,
        timeout: 30000,
      };

      const request: GenerateRequest = {
        prompt: 'Test prompt',
      };

      const result = await generateWithRetry(request, config);

      expect(result.text).toBe('Test response');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('应该在达到最大重试次数时失败', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const config: LLMConfig = {
        apiUrl: 'https://api.example.com',
        apiKey: 'test-key',
        model: 'test-model',
        maxRetries: 2,
        timeout: 30000,
      };

      const request: GenerateRequest = {
        prompt: 'Test prompt',
      };

      await expect(generateWithRetry(request, config)).rejects.toThrow(
        '请求超时'
      );

      expect(mockFetch).toHaveBeenCalledTimes(3); // 初始调用 + 2次重试
    });

    it('应该处理 HTTP 错误', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      const config: LLMConfig = {
        apiUrl: 'https://api.example.com',
        apiKey: 'test-key',
        model: 'test-model',
        maxRetries: 3,
        timeout: 30000,
      };

      const request: GenerateRequest = {
        prompt: 'Test prompt',
      };

      await expect(generateWithRetry(request, config)).rejects.toThrow(
        '服务器错误 (500)'
      );
    }, 10000);
  });

  describe('generateItems', () => {
    it('应该成功生成复习项目', async () => {
      const mockLLMResponse = {
        choices: [{ 
          message: { 
            content: JSON.stringify({
              items: [
                {
                  sid: 's1',
                  text: 'I am happy to see success.',
                  targets: [
                    { word: 'happy', begin: 5, end: 10 },
                    { word: 'success', begin: 18, end: 25 },
                  ],
                  self_eval: {
                    predicted_cefr: 'B1',
                    estimated_new_terms_count: 0,
                  },
                },
                {
                  sid: 's2',
                  text: 'Success makes me happy.',
                  targets: [
                    { word: 'success', begin: 0, end: 7 },
                    { word: 'happy', begin: 17, end: 22 },
                  ],
                  self_eval: {
                    predicted_cefr: 'B1',
                    estimated_new_terms_count: 0,
                  },
                },
              ],
            })
          } 
        }],
        usage: { total_tokens: 100 },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockLLMResponse,
      });

      const config: LLMConfig = {
        apiUrl: 'https://api.example.com',
        apiKey: 'test-key',
        model: 'test-model',
        maxRetries: 3,
        timeout: 30000,
      };

      const params: GenerateItemsParams = {
        targetWords: ['happy', 'success'],
        count: 2,
        difficulty: 5,
        sentenceLength: { min: 10, max: 50 },
        includeExplanation: false,
        language: 'en',
        maxRetries: 3,
      };

      const result = await generateItems(params, config);

      expect(result.success).toBe(true);
      expect(result.items).toHaveLength(2);
      expect(result.retryCount).toBe(0);
      expect(result.totalTokens).toBe(100);
    });

    it('应该在验证失败时重试', async () => {
      const mockLLMResponse = {
        choices: [{ 
          message: { 
            content: JSON.stringify({
              items: [
                {
                  sid: 's1',
                  text: 'This sentence does not contain target words.',
                  targets: [
                    { word: 'missing', begin: 0, end: 7 }, // 错误位置
                  ],
                  self_eval: {
                    predicted_cefr: 'B1',
                    estimated_new_terms_count: 0,
                  },
                },
              ],
            })
          } 
        }],
        usage: { total_tokens: 50 },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockLLMResponse,
      });

      const config: LLMConfig = {
        apiUrl: 'https://api.example.com',
        apiKey: 'test-key',
        model: 'test-model',
        maxRetries: 2,
        timeout: 30000,
      };

      const params: GenerateItemsParams = {
        targetWords: ['happy'],
        count: 1,
        difficulty: 5,
        sentenceLength: { min: 10, max: 50 },
        includeExplanation: false,
        language: 'en',
        maxRetries: 2,
      };

      const result = await generateItems(params, config);

      expect(result.success).toBe(false);
      expect(result.error).toContain('生成内容验证失败');
      expect(result.retryCount).toBe(2);
    });

    it('应该在 API 错误时重试', async () => {
      const mockLLMResponse = {
        choices: [{ 
          message: { 
            content: JSON.stringify({
              items: [
                {
                  sid: 's1',
                  text: 'I am happy to see you.',
                  targets: [
                    { word: 'happy', begin: 5, end: 10 },
                  ],
                  self_eval: {
                    predicted_cefr: 'B1',
                    estimated_new_terms_count: 0,
                  },
                },
              ],
            })
          } 
        }],
        usage: { total_tokens: 50 },
      };

      // 第一次失败，第二次成功
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockLLMResponse,
        });

      const config: LLMConfig = {
        apiUrl: 'https://api.example.com',
        apiKey: 'test-key',
        model: 'test-model',
        maxRetries: 3,
        timeout: 30000,
      };

      const params: GenerateItemsParams = {
        targetWords: ['happy'],
        count: 1,
        difficulty: 5,
        sentenceLength: { min: 10, max: 50 },
        includeExplanation: false,
        language: 'en',
        maxRetries: 3,
      };

      const result = await generateItems(params, config);

      expect(result.success).toBe(true);
      expect(result.retryCount).toBe(0);
    });

    it('应该在达到最大重试次数时失败', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const config: LLMConfig = {
        apiUrl: 'https://api.example.com',
        apiKey: 'test-key',
        model: 'test-model',
        maxRetries: 2,
        timeout: 30000,
      };

      const params: GenerateItemsParams = {
        targetWords: ['happy'],
        count: 1,
        difficulty: 5,
        sentenceLength: { min: 10, max: 50 },
        includeExplanation: false,
        language: 'en',
        maxRetries: 2,
      };

      const result = await generateItems(params, config);

      expect(result.success).toBe(false);
      expect(result.error).toBe('请求超时');
      expect(result.retryCount).toBe(1);
    });
  });
}); 