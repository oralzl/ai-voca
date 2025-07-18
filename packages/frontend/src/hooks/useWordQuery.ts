import { useState, useCallback } from 'react';
import { WordQueryResponse } from '@ai-voca/shared';
import { wordApi } from '../utils/api';

export function useWordQuery() {
  const [result, setResult] = useState<WordQueryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queryWord = useCallback(async (
    word: string,
    includeExample: boolean = true
  ) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await wordApi.queryWord({
        word,
        includeExample
      });

      setResult(response);
      
      if (!response.success) {
        setError(response.error || '查询失败');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || '网络错误';
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

  return {
    result,
    loading,
    error,
    queryWord,
    clearResult
  };
}