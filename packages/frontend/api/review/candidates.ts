/**
 * @fileoverview 候选词获取API无服务器函数
 * @module api/review/candidates
 * @description 处理候选词获取请求，返回今天需要复习的词汇和生成参数
 * @version 1.0.0
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// ==================== 内联类型定义 ====================

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
  level_cefr: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  /** 是否允许顺带学习 */
  allow_incidental: boolean;
  /** 每句允许新词数 0-4 */
  unknown_budget: number;
  /** 生成风格 */
  style: 'neutral' | 'news' | 'dialog' | 'academic';
  /** 难度偏置 -1.5到+1.5 */
  difficulty_bias: number;
}

/**
 * 候选词接口
 */
interface CandidateWord {
  /** 词汇 */
  word: string;
  /** 当前状态 */
  state: WordState;
  /** 下次复习时间 */
  next_due_at: string;
}

/**
 * 候选词获取响应接口
 */
interface CandidatesResponse {
  /** 成功状态 */
  success: boolean;
  /** 候选词数据 */
  data?: {
    /** 候选词列表 */
    candidates: CandidateWord[];
    /** 是否处于回填模式（无到期词，使用 not-due 回填） */
    backfill_mode: boolean;
    /** 生成参数 */
    generation_params: {
      /** 目标词汇 */
      targets: string[];
      /** 用户偏好 */
      profile: UserPrefs;
      /** 生成约束 */
      constraints: {
        /** 句长范围 [最小, 最大] */
        sentence_length_range: [number, number];
        /** 每句最大目标词数 */
        max_targets_per_sentence: number;
      };
    };
  };
  /** 错误信息 */
  error?: string;
}

// ==================== 类型定义 ====================

interface AuthUser {
  id: string;
  email: string;
  user_metadata: any;
}

interface CandidateSelectionParams {
  n?: number; // 候选词数量
  exclude?: string[]; // 需要排除的词（逗号分隔解析后）
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
    
    console.log('Auth environment check', {
      hasSupabaseUrl: !!supabaseUrl,
      hasAnonKey: !!supabaseAnonKey,
      anonKeyLength: supabaseAnonKey?.length || 0
    });
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase URL or anon key for authentication');
      return null;
    }
    
    // 使用Auth API直接验证token
    console.log('Making auth request to Supabase', {
      url: `${supabaseUrl}/auth/v1/user`,
      hasToken: !!token
    });
    
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Auth response received', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
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
  limit: number,
  notDueCap: number = 2,
  excludeSet: Set<string> = new Set()
): Promise<{ candidates: CandidateWord[]; backfill_mode: boolean }> {
  const nowDate = new Date();
  const endOfDay = new Date(nowDate);
  endOfDay.setHours(23, 59, 59, 999);
  const now = nowDate.toISOString();
  const eod = endOfDay.toISOString();
  
  try {
    // 1) overdue：next_due_at <= now（过取3倍，过滤后再截断）
    let { data: overdueWords, error: overdueError } = await supabase
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
      .limit(limit * 3);
    
    if (overdueError) {
      console.error('Error fetching overdue words:', overdueError);
      overdueWords = [];
    }
    
    // 2) today-due：now < next_due_at <= EOD（过取3倍，过滤后再截断）
    let todayDueWords: any[] = [];
    if ((overdueWords?.length || 0) < limit) {
      const remaining = limit * 3; // 先过取，后过滤
      const { data, error } = await supabase
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
        .gt('next_due_at', now)
        .lte('next_due_at', eod)
        .order('next_due_at', { ascending: true })
        .limit(remaining);
      if (error) {
        console.error('Error fetching today-due words:', error);
      } else {
        todayDueWords = data || [];
      }
    }

    // 3) not-due pool（scheduled in future or new words），最终只取 ≤ notDueCap
    let notDuePool: any[] = [];
    // 先过滤排除集
    const filterExcluded = (arr: any[]) => (arr || []).filter(w => !excludeSet.has(w.word));
    const overdueFiltered = filterExcluded(overdueWords || []);
    const todayFiltered = filterExcluded(todayDueWords || []);
    // 逐段截断到 limit
    const selectedOverdue = overdueFiltered.slice(0, limit);
    let remainingLimit = Math.max(0, limit - selectedOverdue.length);
    const selectedToday = todayFiltered.slice(0, remainingLimit);
    remainingLimit = Math.max(0, remainingLimit - selectedToday.length);
    const taken = selectedOverdue.length + selectedToday.length;
    if (taken < limit && notDueCap > 0) {
      const remainForNotDue = Math.min(notDueCap, limit - taken);
      // 3.1 scheduled in future (> EOD)
      const { data: futureScheduled, error: futureError } = await supabase
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
        .gt('next_due_at', eod)
        .order('next_due_at', { ascending: true })
        .limit(remainForNotDue * 5); // 拉一个小池，后续按优先级选 topN
      if (futureError) {
        console.error('Error fetching future scheduled words:', futureError);
      }
      // 3.2 new words (next_due_at is null)
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
          next_due_at,
          created_at
        `)
        .eq('user_id', userId)
        .is('next_due_at', null)
        .order('created_at', { ascending: false })
        .limit(remainForNotDue * 5);
      if (newError) {
        console.error('Error fetching new words (not-due pool):', newError);
      }
      const pool = filterExcluded([ ...(futureScheduled || []), ...(newWords || []) ]).filter(w =>
        !selectedOverdue.find(s => s.word === w.word) && !selectedToday.find(s => s.word === w.word)
      );
      // 易忘优先 S = (5 - familiarity) + daysSinceLastSeen/7 （overdue/today标志为0）
      const scored = pool.map(w => {
        const fam = typeof w.familiarity === 'number' ? w.familiarity : 0;
        const lastSeen = w.last_seen_at ? new Date(w.last_seen_at) : null;
        const days = lastSeen ? Math.max(0, (nowDate.getTime() - lastSeen.getTime()) / 86400000) : 999;
        const score = (5 - fam) + days / 7;
        return { w, score };
      }).sort((a, b) => b.score - a.score);
      notDuePool = scored.slice(0, remainForNotDue).map(s => s.w);
    }
    
    // 合并（overdue > today-due > not-due≤cap），并再次确保排除
    const allWords = [ ...selectedOverdue, ...selectedToday, ...notDuePool ].filter(w => !excludeSet.has(w.word));
    
    // 转换为CandidateWord格式
    const candidates = allWords.map(word => ({
      word: word.word,
      state: {
        familiarity: word.familiarity || 0,
        difficulty: word.ease_factor || 2.5,
        stability: word.interval_days,
        successes: word.review_count || 0,
        lapses: word.lapse_count || 0,
        last_seen_at: word.last_seen_at,
        next_due_at: word.next_due_at
      },
      next_due_at: word.next_due_at || now
    }));

    const backfill_mode = (selectedOverdue.length + selectedToday.length) === 0;
    return { candidates, backfill_mode };
  } catch (error) {
    console.error('Error in getCandidateWords:', error);
    return { candidates: [], backfill_mode: false };
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
      n: req.query.n ? parseInt(req.query.n as string) : 15,
      exclude: typeof req.query.exclude === 'string'
        ? (req.query.exclude as string).split(',').map(s => s.trim()).filter(Boolean)
        : Array.isArray(req.query.exclude)
          ? (req.query.exclude as string[]).flatMap(s => s.split(',')).map(s => s.trim()).filter(Boolean)
          : []
    };
    
    // 验证参数
    if (params.n && (params.n < 0 || params.n > 50)) {
      res.status(400).json({
        success: false,
        error: '候选词数量必须在0-50之间'
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
    const excludeSet = new Set((params.exclude || []).map(w => w.toLowerCase()));
    const { candidates, backfill_mode } = await getCandidateWords(
      supabase,
      user.id,
      params.n || 15,
      2,
      excludeSet
    );
    
    // 生成交付ID
    const deliveryId = uuidv4();
    
    // 构建响应
    const response: CandidatesResponse = {
      success: true,
      data: {
        candidates,
        backfill_mode,
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