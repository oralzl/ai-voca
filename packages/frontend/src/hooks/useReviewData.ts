/**
 * @fileoverview 复习数据Hook
 * @module useReviewData
 * @description 管理复习数据的获取和状态
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { 
  CandidatesResponse, 
  GenerateResponse,
  CandidateWord,
  GeneratedItem,
  UserPrefs 
} from '@ai-voca/shared';

interface UseReviewDataReturn {
  // 候选词数据
  candidates: CandidateWord[];
  candidatesLoading: boolean;
  candidatesError: string | null;
  refreshCandidates: () => Promise<void>;
  
  // 生成数据
  generatedItems: GeneratedItem[];
  generatedLoading: boolean;
  generatedError: string | null;
  generateSentences: (targets: string[]) => Promise<void>;
  
  // 用户偏好
  userPrefs: UserPrefs | null;
  
  // 重置状态
  reset: () => void;
}

/**
 * 复习数据Hook
 */
export function useReviewData(): UseReviewDataReturn {
  const { user, getAccessToken } = useAuth();
  
  // 候选词状态
  const [candidates, setCandidates] = useState<CandidateWord[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [candidatesError, setCandidatesError] = useState<string | null>(null);
  
  // 生成数据状态
  const [generatedItems, setGeneratedItems] = useState<GeneratedItem[]>([]);
  const [generatedLoading, setGeneratedLoading] = useState(false);
  const [generatedError, setGeneratedError] = useState<string | null>(null);
  
  // 用户偏好
  const [userPrefs, setUserPrefs] = useState<UserPrefs | null>(null);

  /**
   * 获取候选词数据
   */
  const fetchCandidates = useCallback(async () => {
    if (!user) {
      setCandidatesError('用户未登录');
      return;
    }

    try {
      setCandidatesLoading(true);
      setCandidatesError(null);
      
      const token = await getAccessToken();
      if (!token) {
        throw new Error('无法获取访问令牌');
      }

      const response = await fetch('/api/review/candidates', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`获取候选词失败: ${response.status}`);
      }

      const data: CandidatesResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || '获取候选词失败');
      }

      if (data.data) {
        setCandidates(data.data.candidates);
        setUserPrefs(data.data.generation_params.profile);
      }
    } catch (error) {
      console.error('获取候选词失败:', error);
      setCandidatesError(error instanceof Error ? error.message : '获取候选词失败');
    } finally {
      setCandidatesLoading(false);
    }
  }, [user, getAccessToken]);

  /**
   * 生成句子
   */
  const generateSentences = useCallback(async (targets: string[]) => {
    if (!user || !userPrefs) {
      setGeneratedError('用户未登录或偏好未设置');
      return;
    }

    try {
      setGeneratedLoading(true);
      setGeneratedError(null);
      
      const token = await getAccessToken();
      if (!token) {
        throw new Error('无法获取访问令牌');
      }

      const response = await fetch('/api/review/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targets,
          profile: userPrefs,
          constraints: {
            sentence_length_range: [12, 22],
            max_targets_per_sentence: 8,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`生成句子失败: ${response.status}`);
      }

      const data: GenerateResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || '生成句子失败');
      }

      if (data.data) {
        setGeneratedItems(data.data.items);
      }
    } catch (error) {
      console.error('生成句子失败:', error);
      setGeneratedError(error instanceof Error ? error.message : '生成句子失败');
    } finally {
      setGeneratedLoading(false);
    }
  }, [user, userPrefs, getAccessToken]);

  /**
   * 刷新候选词
   */
  const refreshCandidates = useCallback(async () => {
    await fetchCandidates();
  }, [fetchCandidates]);

  /**
   * 重置状态
   */
  const reset = useCallback(() => {
    setCandidates([]);
    setCandidatesLoading(false);
    setCandidatesError(null);
    setGeneratedItems([]);
    setGeneratedLoading(false);
    setGeneratedError(null);
    setUserPrefs(null);
  }, []);

  // 自动获取候选词
  useEffect(() => {
    if (user) {
      fetchCandidates();
    }
  }, [user, fetchCandidates]);

  return {
    candidates,
    candidatesLoading,
    candidatesError,
    refreshCandidates,
    generatedItems,
    generatedLoading,
    generatedError,
    generateSentences,
    userPrefs,
    reset,
  };
} 