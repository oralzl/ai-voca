/**
 * @fileoverview 复习反馈Hook
 * @module useReviewFeedback
 * @description 处理复习反馈的提交和状态管理
 */

import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { ReviewFeedback } from '../components/ReviewFeedbackPanel';
import type { ReviewSubmitResponse } from '@ai-voca/shared';

interface UseReviewFeedbackReturn {
  /** 是否正在提交 */
  isSubmitting: boolean;
  /** 提交错误 */
  submitError: string | null;
  /** 提交反馈 */
  submitFeedback: (feedback: ReviewFeedback) => Promise<boolean>;
  /** 重置状态 */
  reset: () => void;
}

/**
 * 复习反馈Hook
 */
export function useReviewFeedback(): UseReviewFeedbackReturn {
  const { user, getAccessToken } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  /**
   * 提交单个词汇的复习反馈
   */
  const submitWordFeedback = useCallback(async (
    word: string,
    rating: string,
    sentenceId: string,
    meta?: any
  ): Promise<boolean> => {
    if (!user) {
      setSubmitError('用户未登录');
      return false;
    }

    try {
      const token = await getAccessToken();
      if (!token) {
        setSubmitError('无法获取访问令牌');
        return false;
      }

      const response = await fetch('/api/review/submit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          word,
          rating,
          meta: {
            delivery_id: sentenceId,
            ...meta
          }
        }),
      });

      const data: ReviewSubmitResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || '提交失败');
      }

      return true;
    } catch (error) {
      console.error('提交词汇反馈失败:', error);
      setSubmitError(error instanceof Error ? error.message : '提交失败');
      return false;
    }
  }, [user, getAccessToken]);

  /**
   * 提交完整的复习反馈
   */
  const submitFeedback = useCallback(async (feedback: ReviewFeedback): Promise<boolean> => {
    if (!user) {
      setSubmitError('用户未登录');
      return false;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // 并行提交所有词汇的反馈
      const wordPromises = Object.entries(feedback.wordFeedback).map(([word, rating]) =>
        submitWordFeedback(word, rating, feedback.sentenceId, {
          predicted_cefr: 'B1', // 这里可以根据实际数据传递
          estimated_new_terms_count: 0
        })
      );

      // 如果有整体难度反馈，也提交
      if (feedback.difficultyFeedback) {
        const difficultyResponse = await fetch('/api/review/submit', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${await getAccessToken()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            word: 'sentence_difficulty',
            rating: 'good', // 难度反馈使用good作为占位符
            difficulty_feedback: feedback.difficultyFeedback,
            meta: {
              delivery_id: feedback.sentenceId,
              targets: feedback.targets
            }
          }),
        });

        const difficultyData: ReviewSubmitResponse = await difficultyResponse.json();
        if (!difficultyData.success) {
          console.warn('难度反馈提交失败:', difficultyData.error);
        }
      }

      // 等待所有词汇反馈完成
      const results = await Promise.all(wordPromises);
      const allSuccess = results.every(result => result === true);

      if (!allSuccess) {
        throw new Error('部分词汇反馈提交失败');
      }

      return true;
    } catch (error) {
      console.error('提交复习反馈失败:', error);
      setSubmitError(error instanceof Error ? error.message : '提交失败');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [user, getAccessToken, submitWordFeedback]);

  /**
   * 重置状态
   */
  const reset = useCallback(() => {
    setIsSubmitting(false);
    setSubmitError(null);
  }, []);

  return {
    isSubmitting,
    submitError,
    submitFeedback,
    reset,
  };
}