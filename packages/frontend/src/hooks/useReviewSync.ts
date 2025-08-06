/**
 * @fileoverview 复习系统同步Hook
 * @module useReviewSync
 * @description 处理收藏词汇到复习系统的自动同步
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface SyncStatus {
  isSynced: boolean;
  isSyncing: boolean;
  lastSyncTime: number | null;
  syncedWords: string[];
  totalWords: number;
  dueToday: number;
}

interface UseReviewSyncReturn {
  syncStatus: SyncStatus;
  syncFavoritesToReview: () => Promise<void>;
  resetSync: () => void;
}

/**
 * 复习系统同步Hook
 * 自动将收藏词汇同步到复习系统
 */
export function useReviewSync(): UseReviewSyncReturn {
  const { user, getAccessToken } = useAuth();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isSynced: false,
    isSyncing: false,
    lastSyncTime: null,
    syncedWords: [],
    totalWords: 0,
    dueToday: 0,
  });

  /**
   * 同步收藏词汇到复习系统
   */
  const syncFavoritesToReview = useCallback(async () => {
    if (!user) {
      console.log('用户未登录，跳过同步');
      return;
    }

    try {
      setSyncStatus(prev => ({ ...prev, isSyncing: true }));
      
      const token = await getAccessToken();
      if (!token) {
        throw new Error('无法获取访问令牌');
      }

      const response = await fetch('/api/review/init', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`同步失败: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || '同步失败');
      }

      if (data.data) {
        setSyncStatus({
          isSynced: true,
          isSyncing: false,
          lastSyncTime: Date.now(),
          syncedWords: data.data.syncedWords || [],
          totalWords: data.data.totalWords || 0,
          dueToday: data.data.dueToday || 0,
        });

        console.log('复习系统同步完成:', {
          syncedWords: data.data.syncedWords?.length || 0,
          totalWords: data.data.totalWords || 0,
          dueToday: data.data.dueToday || 0,
        });
      }
    } catch (error) {
      console.error('复习系统同步失败:', error);
      setSyncStatus(prev => ({
        ...prev,
        isSyncing: false,
        isSynced: false,
      }));
    }
  }, [user, getAccessToken]);

  /**
   * 重置同步状态
   */
  const resetSync = useCallback(() => {
    setSyncStatus({
      isSynced: false,
      isSyncing: false,
      lastSyncTime: null,
      syncedWords: [],
      totalWords: 0,
      dueToday: 0,
    });
  }, []);

  /**
   * 自动同步：当用户登录且未同步过时触发
   */
  useEffect(() => {
    if (user && !syncStatus.isSynced && !syncStatus.isSyncing) {
      syncFavoritesToReview();
    }
  }, [user, syncStatus.isSynced, syncStatus.isSyncing, syncFavoritesToReview]);

  return {
    syncStatus,
    syncFavoritesToReview,
    resetSync,
  };
}