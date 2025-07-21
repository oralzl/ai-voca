/**
 * @fileoverview 单词查询自定义Hook
 * @module useWordQuery
 * @description 管理单词查询状态、处理API调用和错误处理的React Hook
 */

import { useState, useCallback } from 'react';
import { WordQueryResponse } from '@ai-voca/shared';
import { wordApi } from '../utils/api';

export function useWordQuery() {
  const [result, setResult] = useState<WordQueryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queryWord = useCallback(async (
    word: string
  ) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await wordApi.queryWord({
        word,
        includeExample: true
      });

      setResult(response);
      
      if (!response.success) {
        setError(response.error || '查询失败');
      }
    } catch (err: any) {
      // 确保错误消息是字符串
      let errorMessage = '网络错误';
      if (err.response?.data?.error) {
        // 如果error是对象，提取message属性
        if (typeof err.response.data.error === 'object' && err.response.data.error.message) {
          errorMessage = err.response.data.error.message;
        } else if (typeof err.response.data.error === 'string') {
          errorMessage = err.response.data.error;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setResult({
        success: false,
        error: errorMessage,
        timestamp: Date.now()
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  const retryQuery = useCallback(async () => {
    if (!result?.inputParams) {
      console.warn('无法重试：缺少查询参数');
      return;
    }
    
    const { word } = result.inputParams;
    await queryWord(word);
  }, [result, queryWord]);

  return {
    result,
    loading,
    error,
    queryWord,
    clearResult,
    retryQuery
  };
}