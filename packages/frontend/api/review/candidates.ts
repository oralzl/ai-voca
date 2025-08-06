/**
 * @fileoverview 候选词获取API无服务器函数
 * @module api/review/candidates
 * @description 处理候选词获取请求，返回今天需要复习的词汇和生成参数
 * @version 1.0.0
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import type { 
  CandidatesResponse, 
  CandidateWord, 
  UserPrefs, 
  WordState 
} from '@ai-voca/shared';

// ==================== 类型定义 ====================

interface AuthUser {
  id: string;
  email: string;
  user_metadata: any;
}

interface CandidateSelectionParams {
  n?: number; // 候选词数量，默认15
}

// ==================== 认证函数 ====================

async function authenticateUser(req: VercelRequest): Promise<AuthUser | null> {
  try {
    console.log('Review candidates authentication started', {
      hasAuthHeader: !!req.headers.authorization,
      timestamp: new Date().toISOString()
    });
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Auth header missing or invalid format');
      return null;
    }
    
    const token = authHeader.substring(7);
    const supabaseUrl = process.env.SUPABASE_URL;
    const rawAnonKey = process.env.SUPABASE_ANON_KEY;
    const supabaseAnonKey = rawAnonKey ? rawAnonKey.replace(/\s/g, '').trim() : rawAnonKey;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase URL or anon key for authentication');
      return null;
    }
    
    // 使用Auth API直接验证token
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      console.error('Auth verification failed:', response.status, response.statusText);
      return null;
    }
    
    const user = await response.json();
    return {
      id: user.id,
      email: user.email || '',
      user_metadata: user.user_metadata || {}
    };
  } catch (error) {
    console.error('Authentication failed:', error);
    return null;
  }
}

function createAuthError(message: string = 'Unauthorized'): CandidatesResponse {
  return {
    success: false,
    error: message
  };
}

// ==================== 候选词选择逻辑 ====================

/**
 * 获取用户复习偏好
 */
async function getUserReviewPrefs(supabase: any, userId: string): Promise<UserPrefs> {
  try {
    const { data, error } = await supabase
      .from('user_review_prefs')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching user review prefs:', error);
    }
    
    // 返回默认偏好或用户自定义偏好
    return data || {
      level_cefr: 'B1',
      allow_incidental: true,
      unknown_budget: 2,
      style: 'neutral',
      difficulty_bias: 0.0
    };
  } catch (error) {
    console.error('Error in getUserReviewPrefs:', error);
    return {
      level_cefr: 'B1',
      allow_incidental: true,
      unknown_budget: 2,
      style: 'neutral',
      difficulty_bias: 0.0
    };
  }
}

/**
 * 获取候选词汇列表
 */
async function getCandidateWords(
  supabase: any, 
  userId: string, 
  limit: number
): Promise<CandidateWord[]> {
  const now = new Date().toISOString();
  
  try {
    // 首先获取今天需要复习的词汇（next_due_at <= now）
    let { data: dueWords, error: dueError } = await supabase
      .from('user_word_state')
      .select(`
        word,
        familiarity,
        interval_days,
        ease_factor,
        review_count,
        lapse_count,
        last_seen_at,
        next_due_at
      `)
      .eq('user_id', userId)
      .lte('next_due_at', now)
      .order('next_due_at', { ascending: true })
      .limit(limit);
    
    if (dueError) {
      console.error('Error fetching due words:', dueError);
      dueWords = [];
    }
    
    // 如果今天需要复习的词汇不足，补充新收藏的词汇
    let additionalWords: any[] = [];
    if (!dueWords || dueWords.length < limit) {
      const remainingCount = limit - (dueWords?.length || 0);
      
      const { data: newWords, error: newError } = await supabase
        .from('user_word_state')
        .select(`
          word,
          familiarity,
          interval_days,
          ease_factor,
          review_count,
          lapse_count,
          last_seen_at,
          next_due_at
        `)
        .eq('user_id', userId)
        .is('next_due_at', null)
        .order('created_at', { ascending: false })
        .limit(remainingCount);
      
      if (newError) {
        console.error('Error fetching new words:', newError);
      } else {
        additionalWords = newWords || [];
      }
    }
    
    // 合并词汇列表
    const allWords = [...(dueWords || []), ...additionalWords];
    
    // 转换为CandidateWord格式
    return allWords.map(word => ({
      word: word.word,
      state: {
        familiarity: word.familiarity || 0,
        difficulty: word.ease_factor || 2.5,
        stability: word.interval_days,
        recall_p: null,
        successes: word.review_count || 0,
        lapses: word.lapse_count || 0,
        last_seen_at: word.last_seen_at,
        next_due_at: word.next_due_at
      },
      next_due_at: word.next_due_at || now
    }));
  } catch (error) {
    console.error('Error in getCandidateWords:', error);
    return [];
  }
}

/**
 * 根据用户反馈调整难度偏置
 */
async function adjustDifficultyBias(supabase: any, userId: string): Promise<number> {
  try {
    // 获取最近7天的复习事件
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: recentEvents, error } = await supabase
      .from('review_events')
      .select('meta')
      .eq('user_id', userId)
      .gte('created_at', sevenDaysAgo.toISOString())
      .not('meta', 'is', null);
    
    if (error || !recentEvents || recentEvents.length === 0) {
      return 0.0; // 默认偏置
    }
    
    // 计算too_hard反馈的比例
    const tooHardCount = recentEvents.filter(event => 
      event.meta?.reading_feedback === 'too_hard'
    ).length;
    
    const totalFeedbackCount = recentEvents.filter(event => 
      event.meta?.reading_feedback
    ).length;
    
    if (totalFeedbackCount === 0) {
      return 0.0;
    }
    
    const tooHardRatio = tooHardCount / totalFeedbackCount;
    
    // 根据too_hard比例调整偏置
    // 如果too_hard比例 > 0.3，降低难度
    // 如果too_hard比例 < 0.1，提高难度
    let biasAdjustment = 0.0;
    if (tooHardRatio > 0.3) {
      biasAdjustment = -0.2; // 降低难度
    } else if (tooHardRatio < 0.1) {
      biasAdjustment = 0.2; // 提高难度
    }
    
    return biasAdjustment;
  } catch (error) {
    console.error('Error adjusting difficulty bias:', error);
    return 0.0;
  }
}

// ==================== 主处理函数 ====================

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  console.log('Review candidates handler started', { 
    method: req.method, 
    url: req.url,
    timestamp: new Date().toISOString()
  });
  
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // 处理 OPTIONS 请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // 只允许 GET 请求
  if (req.method !== 'GET') {
    res.status(405).json({ 
      success: false,
      error: 'Method not allowed'
    });
    return;
  }
  
  try {
    // 用户认证
    const user = await authenticateUser(req);
    if (!user) {
      res.status(401).json(createAuthError('请先登录'));
      return;
    }
    
    // 解析请求参数
    const params: CandidateSelectionParams = {
      n: req.query.n ? parseInt(req.query.n as string) : 15
    };
    
    // 验证参数
    if (params.n && (params.n < 1 || params.n > 50)) {
      res.status(400).json({
        success: false,
        error: '候选词数量必须在1-50之间'
      });
      return;
    }
    
    // 初始化Supabase客户端
    const supabaseUrl = process.env.SUPABASE_URL;
    const rawServiceKey = process.env.SUPABASE_SERVICE_KEY;
    const supabaseServiceKey = rawServiceKey ? rawServiceKey.replace(/\s/g, '').trim() : rawServiceKey;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      res.status(500).json({
        success: false,
        error: '服务器配置错误'
      });
      return;
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    
    // 获取用户复习偏好
    const userPrefs = await getUserReviewPrefs(supabase, user.id);
    
    // 根据用户反馈调整难度偏置
    const biasAdjustment = await adjustDifficultyBias(supabase, user.id);
    userPrefs.difficulty_bias = Math.max(-1.5, Math.min(1.5, userPrefs.difficulty_bias + biasAdjustment));
    
    // 获取候选词汇
    const candidates = await getCandidateWords(supabase, user.id, params.n || 15);
    
    // 生成交付ID
    const deliveryId = uuidv4();
    
    // 构建响应
    const response: CandidatesResponse = {
      success: true,
      data: {
        candidates,
        generation_params: {
          targets: candidates.map(c => c.word).slice(0, 8), // 最多8个目标词
          profile: userPrefs,
          constraints: {
            sentence_length_range: [12, 22],
            max_targets_per_sentence: 2
          }
        }
      }
    };
    
    console.log('Review candidates response generated', {
      candidateCount: candidates.length,
      targetCount: response.data?.generation_params.targets.length,
      deliveryId
    });
    
    res.json(response);
    
  } catch (error: any) {
    console.error('Review candidates handler error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    res.status(500).json({
      success: false,
      error: error.message || '服务器内部错误'
    });
  }
} 