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
  refreshCandidates: (opts?: { n?: number; exclude?: string[] }) => Promise<void>;
  getCandidates: (opts?: { n?: number; exclude?: string[] }) => Promise<CandidateWord[]>;
  
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
  const fetchCandidates = useCallback(async (opts?: { n?: number; exclude?: string[] }) => {
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

      const params = new URLSearchParams();
      if (opts?.n !== undefined) params.set('n', String(opts.n));
      if (opts?.exclude && opts.exclude.length > 0) params.set('exclude', opts.exclude.join(','));

      const response = await fetch(`/api/review/candidates${params.toString() ? `?${params.toString()}` : ''}` , {
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
   * 仅获取候选词（不落地到全局 candidates 状态），用于自动选词预取
   */
  const getCandidates = useCallback(async (opts?: { n?: number; exclude?: string[] }) => {
    if (!user) {
      throw new Error('用户未登录');
    }
    const token = await getAccessToken();
    if (!token) throw new Error('无法获取访问令牌');

    const params = new URLSearchParams();
    if (opts?.n !== undefined) params.set('n', String(opts.n));
    if (opts?.exclude && opts.exclude.length > 0) params.set('exclude', opts.exclude.join(','));

    const response = await fetch(`/api/review/candidates${params.toString() ? `?${params.toString()}` : ''}` , {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error(`获取候选词失败: ${response.status}`);
    const data: CandidatesResponse = await response.json();
    if (!data.success || !data.data) throw new Error(data.error || '获取候选词失败');
    return data.data.candidates;
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
  const refreshCandidates = useCallback(async (opts?: { n?: number; exclude?: string[] }) => {
    await fetchCandidates(opts);
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

  // 自动获取候选词 - 只在用户登录且候选词为空时获取
  useEffect(() => {
    if (user && candidates.length === 0) {
      fetchCandidates();
    }
  }, [user, candidates.length, fetchCandidates]);

  return {
    candidates,
    candidatesLoading,
    candidatesError,
    refreshCandidates,
    getCandidates,
    generatedItems,
    generatedLoading,
    generatedError,
    generateSentences,
    userPrefs,
    reset,
  };
} 