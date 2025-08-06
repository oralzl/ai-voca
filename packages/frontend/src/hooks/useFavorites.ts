/**
 * @fileoverview 收藏管理自定义Hook
 * @module useFavorites
 * @description 管理单词收藏状态、提供收藏操作和状态检查的React Hook
 */

import { useState, useCallback } from 'react';
import { 
  FavoriteWord, 
  WordExplanation,
  FavoriteListResponse 
} from '@ai-voca/shared';
import { useAuth } from '../contexts/AuthContext';
import { favoritesApi } from '../utils/favoritesApi';

interface FavoritesState {
  favorites: FavoriteWord[];
  loading: boolean;
  error: string | null;
}

interface UseFavoritesReturn {
  // 状态
  favorites: FavoriteWord[];
  loading: boolean;
  error: string | null;
  
  // 操作函数
  toggleFavorite: (word: string, originalQuery?: string, queryData?: WordExplanation, rawResponse?: string, notes?: string) => Promise<boolean>;
  checkFavorite: (word: string) => Promise<{ isFavorited: boolean; favoriteData?: WordExplanation }>;
  getFavoritesList: (page?: number, pageSize?: number, search?: string) => Promise<FavoriteListResponse>;
  refreshFavorites: () => Promise<void>;
  clearError: () => void;
}

export function useFavorites(): UseFavoritesReturn {
  const [state, setState] = useState<FavoritesState>({
    favorites: [],
    loading: false,
    error: null
  });
  
  const { getAccessToken } = useAuth();

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // 切换收藏状态
  const toggleFavorite = useCallback(async (
    word: string,
    originalQuery?: string,
    queryData?: WordExplanation,
    rawResponse?: string,
    notes?: string
  ): Promise<boolean> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await favoritesApi.toggleFavorite({
        word: word.toLowerCase().trim(),
        originalQuery,
        queryData,
        rawResponse,
        notes
      });

      // 更新本地状态
      if (result.data?.isFavorited && result.data.favorite) {
        // 添加到收藏
        setState(prev => ({
          ...prev,
          favorites: [...prev.favorites, result.data!.favorite!],
          loading: false
        }));
      } else {
        // 从收藏中移除
        setState(prev => ({
          ...prev,
          favorites: prev.favorites.filter(fav => fav.word !== word.toLowerCase().trim()),
          loading: false
        }));
      }

      return result.data?.isFavorited || false;

    } catch (error: any) {
      const errorMessage = error.message || '操作失败，请稍后重试';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      throw error;
    }
  }, []);

  // 检查收藏状态
  const checkFavorite = useCallback(async (word: string): Promise<{ 
    isFavorited: boolean; 
    favoriteData?: WordExplanation 
  }> => {
    try {
      const result = await favoritesApi.checkFavorite(word.toLowerCase().trim());

      return {
        isFavorited: result.data?.isFavorited || false,
        favoriteData: result.data?.favoriteData
      };

    } catch (error: any) {
      console.error('检查收藏状态失败:', error);
      return { isFavorited: false };
    }
  }, []);

  // 获取收藏列表
  const getFavoritesList = useCallback(async (
    page: number = 1,
    pageSize: number = 20,
    search?: string
  ): Promise<FavoriteListResponse> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await favoritesApi.getFavoritesList(page, pageSize, search);

      // 更新本地状态
      if (result.data) {
        setState(prev => ({
          ...prev,
          favorites: result.data!.favorites,
          loading: false
        }));
      }

      return result;

    } catch (error: any) {
      const errorMessage = error.message || '获取收藏列表失败，请稍后重试';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      throw error;
    }
  }, []);

  // 刷新收藏列表
  const refreshFavorites = useCallback(async () => {
    try {
      await getFavoritesList();
    } catch (error) {
      console.error('刷新收藏列表失败:', error);
    }
  }, [getFavoritesList]);

  /**
   * 同步收藏词汇到复习系统
   */
  const syncToReview = useCallback(async () => {
    try {
      const token = await getAccessToken();
      if (!token) {
        console.warn('无法获取访问令牌，跳过同步');
        return;
      }

      const response = await fetch('/api/review/init', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('同步到复习系统失败:', response.status);
        return;
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        console.log('收藏词汇同步到复习系统完成:', {
          syncedWords: data.data.syncedWords?.length || 0,
          totalWords: data.data.totalWords || 0,
          dueToday: data.data.dueToday || 0,
        });
      }

    } catch (error) {
      console.error('收藏词汇同步失败:', error);
    }
  }, [getAccessToken]);

  /**
   * 切换收藏状态并自动同步到复习系统
   */
  const toggleFavorite = useCallback(async (
    word: string,
    originalQuery?: string,
    queryData?: WordExplanation,
    rawResponse?: string,
    notes?: string
  ): Promise<boolean> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await favoritesApi.toggleFavorite({
        word: word.toLowerCase().trim(),
        originalQuery,
        queryData,
        rawResponse,
        notes
      });

      // 更新本地状态
      if (result.data?.isFavorited && result.data.favorite) {
        // 添加到收藏
        setState(prev => ({
          ...prev,
          favorites: [...prev.favorites, result.data!.favorite!],
          loading: false
        }));
        
        // 添加到收藏后自动同步到复习系统
        syncToReview();
      } else {
        // 从收藏中移除
        setState(prev => ({
          ...prev,
          favorites: prev.favorites.filter(fav => fav.word !== word.toLowerCase().trim()),
          loading: false
        }));
      }

      return result.data?.isFavorited || false;

    } catch (error: any) {
      const errorMessage = error.message || '操作失败，请稍后重试';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      throw error;
    }
  }, [syncToReview]);

  return {
    favorites: state.favorites,
    loading: state.loading,
    error: state.error,
    toggleFavorite,
    checkFavorite,
    getFavoritesList,
    refreshFavorites,
    clearError,
    syncToReview
  };
}