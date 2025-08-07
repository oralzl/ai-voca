/**
 * @fileoverview 复习提交API无服务器函数
 * @module api/review/submit
 * @description 处理复习反馈提交，更新词汇状态和用户偏好
 * @version 1.0.0
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { fsrsUpdate, initializeWordState } from '@ai-voca/review-engine';
import type { ReviewSubmitRequest, ReviewSubmitResponse, WordState, UserPrefs, Rating, DifficultyFeedback } from '@ai-voca/shared';

interface AuthUser {
  id: string;
  email: string;
  user_metadata: any;
}

async function authenticateUser(req: VercelRequest): Promise<AuthUser | null> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    const token = authHeader.substring(7);
    const supabaseUrl = process.env.SUPABASE_URL;
    const rawAnonKey = process.env.SUPABASE_ANON_KEY;
    const supabaseAnonKey = rawAnonKey ? rawAnonKey.replace(/\s/g, '').trim() : rawAnonKey;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return null;
    }
    
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      return null;
    }
    
    const user = await response.json();
    return {
      id: user.id,
      email: user.email || '',
      user_metadata: user.user_metadata || {}
    };
  } catch (error) {
    return null;
  }
}

function ratingToDbValue(rating: Rating): number {
  const ratingMap: Record<Rating, number> = {
    'again': 1, 'hard': 2, 'good': 3, 'easy': 4
  };
  return ratingMap[rating];
}

function difficultyToEventType(feedback: DifficultyFeedback): string {
  const eventTypeMap: Record<DifficultyFeedback, string> = {
    'too_easy': 'sentence_too_easy', 'ok': 'sentence_ok', 'too_hard': 'sentence_too_hard'
  };
  return eventTypeMap[feedback];
}

async function getUserWordState(supabase: any, userId: string, word: string): Promise<WordState | null> {
  try {
    const { data, error } = await supabase
      .from('user_word_state')
      .select('*')
      .eq('user_id', userId)
      .eq('word', word)
      .single();
    
    if (error) {
      return null;
    }
    
    return {
      familiarity: data.familiarity || 0,
      difficulty: data.ease_factor || 2.5,
      stability: data.interval_days,
      recall_p: undefined,
      successes: data.review_count || 0,
      lapses: data.lapse_count || 0,
      last_seen_at: data.last_seen_at,
      next_due_at: data.next_due_at
    };
  } catch (error) {
    return null;
  }
}

async function updateUserWordState(supabase: any, userId: string, word: string, newState: WordState): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_word_state')
      .upsert({
        user_id: userId,
        word: word,
        familiarity: newState.familiarity,
        ease_factor: newState.difficulty,
        interval_days: newState.stability || 1,
        review_count: newState.successes,
        lapse_count: newState.lapses,
        last_seen_at: newState.last_seen_at,
        next_due_at: newState.next_due_at,
        updated_at: new Date().toISOString()
      });
    
    return !error;
  } catch (error) {
    return false;
  }
}

async function recordReviewEvent(supabase: any, event: any): Promise<boolean> {
  try {
    const { error } = await supabase.from('review_events').insert(event);
    return !error;
  } catch (error) {
    return false;
  }
}

async function updateUserReviewPrefs(supabase: any, userId: string, difficultyFeedback?: DifficultyFeedback): Promise<UserPrefs | null> {
  try {
    const { data: currentPrefs } = await supabase
      .from('user_review_prefs')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    const prefs = currentPrefs || {
      level_cefr: 'B1',
      allow_incidental: true,
      unknown_budget: 2,
      style: 'neutral',
      difficulty_bias: 0.0
    };
    
    if (difficultyFeedback) {
      const biasAdjustment = difficultyFeedback === 'too_hard' ? -0.1 : 
                            difficultyFeedback === 'too_easy' ? 0.1 : 0;
      prefs.difficulty_bias = Math.max(-1.5, Math.min(1.5, prefs.difficulty_bias + biasAdjustment));
    }
    
    const { error } = await supabase
      .from('user_review_prefs')
      .upsert({
        user_id: userId,
        level_cefr: prefs.level_cefr,
        unknown_budget: prefs.unknown_budget,
        difficulty_bias: prefs.difficulty_bias,
        preferred_style: prefs.style,
        allow_incidental_learning: prefs.allow_incidental,
        updated_at: new Date().toISOString()
      });
    
    return error ? null : prefs;
  } catch (error) {
    return null;
  }
}

async function processReviewSubmit(supabase: any, userId: string, request: ReviewSubmitRequest): Promise<{ wordState: WordState; userPrefs: UserPrefs } | null> {
  try {
    let currentState = await getUserWordState(supabase, userId, request.word);
    if (!currentState) {
      // 为新词汇初始化状态
      currentState = initializeWordState(new Date());
    }
    
    const now = new Date();
    const { next: newState } = fsrsUpdate(currentState, request.rating, now);
    
    const updateSuccess = await updateUserWordState(supabase, userId, request.word, newState);
    if (!updateSuccess) {
      return null;
    }
    
    const reviewEvent = {
      user_id: userId,
      delivery_id: request.meta?.delivery_id || 'unknown',
      event_type: 'word_' + request.rating,
      word: request.word,
      rating: ratingToDbValue(request.rating),
      response_time_ms: request.latency_ms,
      meta: {
        delivery_id: request.meta?.delivery_id,
        predicted_cefr: request.meta?.predicted_cefr,
        estimated_new_terms_count: request.meta?.estimated_new_terms_count,
        variant: request.meta?.variant
      }
    };
    
    const eventRecorded = await recordReviewEvent(supabase, reviewEvent);
    if (!eventRecorded) {
      return null;
    }
    
    let userPrefs: UserPrefs | null = null;
    if (request.difficulty_feedback) {
      const sentenceEvent = {
        user_id: userId,
        delivery_id: request.meta?.delivery_id || 'unknown',
        event_type: difficultyToEventType(request.difficulty_feedback),
        sentence_text: 'review_session',
        meta: {
          delivery_id: request.meta?.delivery_id,
          predicted_cefr: request.meta?.predicted_cefr,
          estimated_new_terms_count: request.meta?.estimated_new_terms_count
        }
      };
      
      await recordReviewEvent(supabase, sentenceEvent);
      userPrefs = await updateUserReviewPrefs(supabase, userId, request.difficulty_feedback);
    }
    
    if (!userPrefs) {
      const { data: prefsData } = await supabase
        .from('user_review_prefs')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      userPrefs = prefsData || {
        level_cefr: 'B1',
        allow_incidental: true,
        unknown_budget: 2,
        style: 'neutral',
        difficulty_bias: 0.0
      };
    }
    
    if (!userPrefs) {
      return null;
    }
    
    return { wordState: newState, userPrefs };
  } catch (error) {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }
  
  try {
    const user = await authenticateUser(req);
    if (!user) {
      res.status(401).json({ success: false, error: '请先登录' });
      return;
    }
    
    const requestBody = req.body as ReviewSubmitRequest;
    if (!requestBody.word || !requestBody.rating) {
      res.status(400).json({ success: false, error: '缺少必要参数：word 和 rating' });
      return;
    }
    
    const validRatings: Rating[] = ['again', 'hard', 'good', 'easy'];
    if (!validRatings.includes(requestBody.rating)) {
      res.status(400).json({ success: false, error: '无效的rating值' });
      return;
    }
    
    if (requestBody.difficulty_feedback) {
      const validFeedbacks: DifficultyFeedback[] = ['too_easy', 'ok', 'too_hard'];
      if (!validFeedbacks.includes(requestBody.difficulty_feedback)) {
        res.status(400).json({ success: false, error: '无效的difficulty_feedback值' });
        return;
      }
    }
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const rawServiceKey = process.env.SUPABASE_SERVICE_KEY;
    const supabaseServiceKey = rawServiceKey ? rawServiceKey.replace(/\s/g, '').trim() : rawServiceKey;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      res.status(500).json({ success: false, error: '服务器配置错误' });
      return;
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    
    const result = await processReviewSubmit(supabase, user.id, requestBody);
    
    if (!result) {
      res.status(500).json({ success: false, error: '处理复习提交失败' });
      return;
    }
    
    const response: ReviewSubmitResponse = {
      success: true,
      data: {
        word_state: result.wordState,
        user_prefs: result.userPrefs
      }
    };
    
    res.json(response);
    
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || '服务器内部错误'
    });
  }
} 