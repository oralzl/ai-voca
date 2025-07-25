/**
 * @fileoverview 单词查询自定义Hook
 * @module useWordQuery
 * @description 管理单词查询状态、处理API调用和错误处理的React Hook
 */

import { useState, useCallback } from 'react';
import { WordQueryResponse, FavoriteWord } from '@ai-voca/shared';
import { wordApi } from '../utils/api';
import { useFavorites } from './useFavorites';

export function useWordQuery() {
  const [result, setResult] = useState<WordQueryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { checkFavorite } = useFavorites();

  const queryWord = useCallback(async (
    word: string
  ) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // 先进行AI查询获取lemma后的标准形式
      const response = await wordApi.queryWord({
        word,
        includeExample: true
      });

      if (response.success && response.data?.text) {
        // 使用lemma后的text检查收藏状态
        const lemmaWord = response.data.text;
        const favoriteCheck = await checkFavorite(lemmaWord);
        
        if (favoriteCheck.isFavorited && favoriteCheck.favoriteData) {
          // 已收藏，展示收藏时保存的数据
          setResult({
            ...response,
            data: favoriteCheck.favoriteData,
            isFavorited: true
          });
        } else {
          // 未收藏，展示新查询的数据
          setResult({
            ...response,
            isFavorited: false
          });
        }
      } else {
        // 查询失败或无数据
        setResult({
          ...response,
          isFavorited: false
        });
      }
      
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
        timestamp: Date.now(),
        isFavorited: false
      });
    } finally {
      setLoading(false);
    }
  }, [checkFavorite]);

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

  // 从收藏数据直接设置结果，无需API查询
  const loadFromFavorite = useCallback((favorite: FavoriteWord) => {
    console.log('useWordQuery: loadFromFavorite called with:', favorite.word);
    
    // 将收藏的queryData转换为WordQueryResponse格式，确保包含所有字段
    const wordQueryResponse: WordQueryResponse = {
      success: true,
      data: {
        text: favorite.queryData.text || favorite.queryData.word,
        word: favorite.queryData.word,
        lemmatizationExplanation: favorite.queryData.lemmatizationExplanation || '',
        pronunciation: favorite.queryData.pronunciation || '',
        definition: favorite.queryData.definition,
        simpleExplanation: favorite.queryData.simpleExplanation || '',
        example: favorite.queryData.example || '', // 向后兼容
        examples: favorite.queryData.examples || [],
        synonyms: favorite.queryData.synonyms || [],
        antonyms: favorite.queryData.antonyms || [],
        etymology: favorite.queryData.etymology || '',
        memoryTips: favorite.queryData.memoryTips || ''
      },
      rawResponse: favorite.rawResponse, // 添加原始响应数据
      isFavorited: true,
      timestamp: Date.now(),
      inputParams: {
        word: favorite.originalQuery || favorite.word,
        timestamp: Date.now()
      }
    };

    setResult(wordQueryResponse);
    setLoading(false);
    setError(null);
    
    console.log('useWordQuery: loadFromFavorite completed, result set');
  }, []);

  return {
    result,
    loading,
    error,
    queryWord,
    clearResult,
    retryQuery,
    loadFromFavorite
  };
}