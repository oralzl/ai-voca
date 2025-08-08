/**
 * @fileoverview 复习提交API无服务器函数
 * @module api/review/submit
 * @description 处理复习反馈提交，更新词汇状态和用户偏好
 * @version 1.0.0
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4, validate as uuidValidate } from 'uuid';

// ==================== 内联类型定义 ====================

/**
 * 复习结果评分类型
 */
type Rating = 'again' | 'hard' | 'good' | 'easy';

/**
 * 难度反馈类型
 */
type DifficultyFeedback = 'too_easy' | 'ok' | 'too_hard';

/**
 * CEFR等级类型
 */
type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

/**
 * 生成风格类型
 */
type GenerationStyle = 'neutral' | 'news' | 'dialog' | 'academic';

/**
 * 词汇状态接口
 */
interface WordState {
  /** 熟悉度等级 0-5 */
  familiarity: number;
  /** 难度等级 1-5 */
  difficulty: number;
  /** 稳定性（天） */
  stability?: number;
  /** 回忆概率 */
  recall_p?: number;
  /** 成功次数 */
  successes: number;
  /** 失败次数 */
  lapses: number;
  /** 最后复习时间 */
  last_seen_at?: string;
  /** 下次复习时间 */
  next_due_at?: string;
}

/**
 * 用户复习偏好接口
 */
interface UserPrefs {
  /** CEFR等级 */
  level_cefr: CEFRLevel;
  /** 是否允许顺带学习 */
  allow_incidental: boolean;
  /** 每句允许新词数 0-4 */
  unknown_budget: number;
  /** 生成风格 */
  style: GenerationStyle;
  /** 难度偏置 -1.5到+1.5 */
  difficulty_bias: number;
}

/**
 * 复习提交请求接口
 */
interface ReviewSubmitRequest {
  /** 词汇 */
  word: string;
  /** 复习结果 */
  rating: Rating;
  /** 难度反馈 */
  difficulty_feedback?: DifficultyFeedback;
  /** 响应延迟（毫秒） */
  latency_ms?: number;
  /** 元数据 */
  meta?: {
    /** 交付ID */
    delivery_id?: string;
    /** 预测的CEFR等级 */
    predicted_cefr?: CEFRLevel;
    /** 估计的新词汇数量 */
    estimated_new_terms_count?: number;
    /** 变体信息 */
    variant?: string;
  };
}

/**
 * 复习提交响应接口
 */
interface ReviewSubmitResponse {
  /** 成功状态 */
  success: boolean;
  /** 更新后的词汇状态 */
  data?: {
    /** 词汇状态 */
    word_state: WordState;
    /** 用户偏好 */
    user_prefs: UserPrefs;
  };
  /** 错误信息 */
  error?: string;
}

// ==================== 内联FSRS算法 ====================

/**
 * FSRS-lite 间隔映射（天）
 * 基于熟悉度等级确定下次复习间隔
 */
const INTERVALS = [1, 3, 7, 14, 30, 60] as const;

/**
 * 熟悉度等级范围
 */
const FAMILIARITY_MIN = 0;
const FAMILIARITY_MAX = 5;

/**
 * FSRS 算法更新函数
 * 基于用户的评分更新单词的复习状态
 * 
 * @param prev - 当前词汇状态
 * @param rating - 用户评分
 * @param now - 当前时间
 * @returns 更新后的词汇状态
 */
function fsrsUpdate(prev: WordState, rating: Rating, now: Date): { next: WordState } {
  // 获取当前熟悉度
  const currentFamiliarity = prev.familiarity ?? 0;
  
  // 根据评分调整熟悉度
  let newFamiliarity = currentFamiliarity;
  
  switch (rating) {
    case 'again':
      // 降低熟悉度，但不低于最小值
      newFamiliarity = Math.max(FAMILIARITY_MIN, currentFamiliarity - 1);
      break;
      
    case 'hard':
      // 保持当前熟悉度
      newFamiliarity = currentFamiliarity;
      break;
      
    case 'good':
    case 'easy':
      // 提高熟悉度，但不高于最大值
      newFamiliarity = Math.min(FAMILIARITY_MAX, currentFamiliarity + 1);
      break;
  }
  
  // 计算下次复习间隔
  const intervalDays = INTERVALS[newFamiliarity] ?? INTERVALS[INTERVALS.length - 1];
  const nextDueAt = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
  
  // 更新成功/失败计数
  const isSuccess = rating === 'good' || rating === 'easy';
  const isFailure = rating === 'again';
  
  const newSuccesses = (prev.successes ?? 0) + (isSuccess ? 1 : 0);
  const newLapses = (prev.lapses ?? 0) + (isFailure ? 1 : 0);
  
  // 构建更新后的状态
  const next: WordState = {
    ...prev,
    familiarity: newFamiliarity,
    last_seen_at: now.toISOString(),
    next_due_at: nextDueAt.toISOString(),
    successes: newSuccesses,
    lapses: newLapses,
  };
  
  return { next };
}

/**
 * 初始化新词汇的状态
 * 
 * @param now - 当前时间
 * @returns 初始词汇状态
 */
function initializeWordState(now: Date): WordState {
  return {
    familiarity: 0,
    difficulty: 2.5,
    successes: 0,
    lapses: 0,
    last_seen_at: now.toISOString(),
    next_due_at: new Date(now.getTime() + INTERVALS[0] * 24 * 60 * 60 * 1000).toISOString(),
  };
}

interface AuthUser {
  id: string;
  email: string;
  user_metadata: any;
}

async function authenticateUser(req: VercelRequest): Promise<AuthUser | null> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Authentication failed: Missing or invalid Authorization header');
      return null;
    }
    
    const token = authHeader.substring(7);
    const supabaseUrl = process.env.SUPABASE_URL;
    const rawAnonKey = process.env.SUPABASE_ANON_KEY;
    const supabaseAnonKey = rawAnonKey ? rawAnonKey.replace(/\s/g, '').trim() : rawAnonKey;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Authentication failed: Missing SUPABASE_URL or SUPABASE_ANON_KEY');
      return null;
    }
    
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      console.error('Authentication failed: Supabase auth endpoint returned', response.status, response.statusText);
      return null;
    }
    
    const user = await response.json();
    return {
      id: user.id,
      email: user.email || '',
      user_metadata: user.user_metadata || {}
    };
  } catch (error) {
    console.error('Authentication error:', error);
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
      // 正常的"未找到"错误不需要当成异常打印
      if (error.code !== 'PGRST116') {
        console.error('getUserWordState error:', error);
      }
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
    console.error('getUserWordState exception:', error);
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
      }, { onConflict: 'user_id,word' });
    
    if (error) {
      console.error('updateUserWordState error:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('updateUserWordState exception:', error);
    return false;
  }
}

async function recordReviewEvent(supabase: any, event: any): Promise<boolean> {
  try {
    const { error } = await supabase.from('review_events').insert(event);
    if (error) {
      console.error('recordReviewEvent error:', error, 'event:', event);
      return false;
    }
    return true;
  } catch (error) {
    console.error('recordReviewEvent exception:', error, 'event:', event);
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
      }, { onConflict: 'user_id' });
    
    if (error) {
      console.error('updateUserReviewPrefs error:', error);
      return null;
    }
    return prefs;
  } catch (error) {
    console.error('updateUserReviewPrefs exception:', error);
    return null;
  }
}

async function processReviewSubmit(supabase: any, userId: string, request: ReviewSubmitRequest): Promise<{ wordState: WordState; userPrefs: UserPrefs } | null> {
  try {
    const isPlaceholderDifficulty = request.word === 'sentence_difficulty';

    // 规范化 delivery_id：后端表字段为 UUID，前端传入的 sid/fallback_1 可能不是 UUID
    const rawDeliveryIdPre = request.meta?.delivery_id;
    const deliveryIdPre = rawDeliveryIdPre && uuidValidate(rawDeliveryIdPre) ? rawDeliveryIdPre : uuidv4();

    // 占位难度事件：不写 user_word_state、不写词条事件，仅写句子事件 + 更新偏好
    if (isPlaceholderDifficulty) {
      if (request.difficulty_feedback) {
        const sentenceEventOnly = {
          user_id: userId,
          delivery_id: deliveryIdPre,
          event_type: difficultyToEventType(request.difficulty_feedback),
          sentence_text: 'review_session',
          meta: {
            delivery_id: rawDeliveryIdPre,
            predicted_cefr: request.meta?.predicted_cefr,
            estimated_new_terms_count: request.meta?.estimated_new_terms_count
          }
        };
        await recordReviewEvent(supabase, sentenceEventOnly);
        const prefsOnly = await updateUserReviewPrefs(supabase, userId, request.difficulty_feedback);
        if (!prefsOnly) {
          console.error('processReviewSubmit: Failed to update prefs for difficulty-only');
          return null;
        }
        // 返回占位的 word_state（不被前端使用），以满足返回结构
        return { wordState: initializeWordState(new Date()), userPrefs: prefsOnly };
      }
      // 没有 difficulty_feedback 时，直接返回失败
      console.error('processReviewSubmit: Placeholder difficulty request missing difficulty_feedback');
      return null;
    }

    let currentState = await getUserWordState(supabase, userId, request.word);
    if (!currentState) {
      // 为新词汇初始化状态
      currentState = initializeWordState(new Date());
    }
    
    const now = new Date();
    const { next: newState } = fsrsUpdate(currentState, request.rating, now);
    
    const updateSuccess = await updateUserWordState(supabase, userId, request.word, newState);
    if (!updateSuccess) {
      console.error('processReviewSubmit: Failed to update user word state');
      return null;
    }
    
    const rawDeliveryId = request.meta?.delivery_id;
    const deliveryId = rawDeliveryId && uuidValidate(rawDeliveryId) ? rawDeliveryId : uuidv4();

    const reviewEvent = {
      user_id: userId,
      delivery_id: deliveryId,
      event_type: 'word_' + request.rating,
      word: request.word,
      rating: ratingToDbValue(request.rating),
      response_time_ms: request.latency_ms,
      meta: {
        delivery_id: rawDeliveryId,
        predicted_cefr: request.meta?.predicted_cefr,
        estimated_new_terms_count: request.meta?.estimated_new_terms_count,
        variant: request.meta?.variant
      }
    };
    
    const eventRecorded = await recordReviewEvent(supabase, reviewEvent);
    if (!eventRecorded) {
      console.error('processReviewSubmit: Failed to record word review event');
      return null;
    }
    
    let userPrefs: UserPrefs | null = null;
    if (request.difficulty_feedback) {
      const sentenceEvent = {
        user_id: userId,
        delivery_id: deliveryId,
        event_type: difficultyToEventType(request.difficulty_feedback),
        sentence_text: 'review_session',
        meta: {
          delivery_id: rawDeliveryId,
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
      console.error('processReviewSubmit: Missing userPrefs after attempts');
      return null;
    }
    
    return { wordState: newState, userPrefs };
  } catch (error) {
    console.error('processReviewSubmit exception:', error);
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
    console.log('Review submit API called', { timestamp: new Date().toISOString() });
    const user = await authenticateUser(req);
    if (!user) {
      console.error('Review submit: Unauthorized');
      res.status(401).json({ success: false, error: '请先登录' });
      return;
    }
    
    const requestBody = req.body as ReviewSubmitRequest;
    if (!requestBody.word || !requestBody.rating) {
       console.error('Review submit: Missing required params', { body: requestBody });
      res.status(400).json({ success: false, error: '缺少必要参数：word 和 rating' });
      return;
    }
    
    const validRatings: Rating[] = ['again', 'hard', 'good', 'easy'];
    if (!validRatings.includes(requestBody.rating)) {
      console.error('Review submit: Invalid rating', { rating: requestBody.rating });
      res.status(400).json({ success: false, error: '无效的rating值' });
      return;
    }
    
    if (requestBody.difficulty_feedback) {
      const validFeedbacks: DifficultyFeedback[] = ['too_easy', 'ok', 'too_hard'];
      if (!validFeedbacks.includes(requestBody.difficulty_feedback)) {
        console.error('Review submit: Invalid difficulty_feedback', { difficulty_feedback: requestBody.difficulty_feedback });
        res.status(400).json({ success: false, error: '无效的difficulty_feedback值' });
        return;
      }
    }
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const rawServiceKey = process.env.SUPABASE_SERVICE_KEY;
    const supabaseServiceKey = rawServiceKey ? rawServiceKey.replace(/\s/g, '').trim() : rawServiceKey;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Review submit: Missing Supabase configuration');
      res.status(500).json({ success: false, error: '服务器配置错误' });
      return;
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    
    const result = await processReviewSubmit(supabase, user.id, requestBody);
    
    if (!result) {
      console.error('Review submit: processReviewSubmit returned null');
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
    console.error('Review submit handler exception:', error);
    res.status(500).json({
      success: false,
      error: error.message || '服务器内部错误'
    });
  }
} 