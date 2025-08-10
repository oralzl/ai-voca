/**
 * @fileoverview 复习系统初始化API
 * @module api/review/init
 * @description 将用户的收藏词汇同步到复习系统，处理数据初始化
 * @version 1.0.0
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// ==================== 类型定义 ====================

interface AuthUser {
  id: string;
  email: string;
  user_metadata: any;
}

interface InitResponse {
  success: boolean;
  data?: {
    syncedWords: string[];
    totalWords: number;
    dueToday: number;
  };
  error?: string;
}

// ==================== 认证函数 ====================

async function authenticateUser(req: VercelRequest, supabaseUrl: string, supabaseAnonKey: string): Promise<AuthUser | null> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    const token = authHeader.substring(7);
    
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      console.error('Auth verification failed:', response.status);
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

// ==================== 数据同步逻辑 ====================

/**
 * 将用户的收藏词汇同步到复习系统
 */
async function syncFavoritesToReview(supabase: any, userId: string): Promise<string[]> {
  try {
    // 1. 获取用户的所有收藏词汇
    const { data: favorites, error: favoritesError } = await supabase
      .from('user_favorites')
      .select('word, created_at')
      .eq('user_id', userId);

    if (favoritesError) {
      console.error('Error fetching favorites:', favoritesError);
      throw new Error('Failed to fetch user favorites');
    }

    if (!favorites || favorites.length === 0) {
      return [];
    }

    // 2. 获取已存在的复习词汇
    const { data: existingWords, error: existingError } = await supabase
      .from('user_word_state')
      .select('word')
      .eq('user_id', userId);

    if (existingError) {
      console.error('Error fetching existing words:', existingError);
      throw new Error('Failed to check existing words');
    }

    const existingWordSet = new Set(existingWords?.map(w => w.word) || []);
    const newWords = favorites.filter(f => !existingWordSet.has(f.word));

    if (newWords.length === 0) {
      return [];
    }

    // 3. 批量插入新的复习词汇
    const now = new Date().toISOString();
    const wordsToInsert = newWords.map(f => ({
      user_id: userId,
      word: f.word,
      familiarity: 0,
      last_seen_at: null,
      next_due_at: now, // 新词汇立即加入复习
      interval_days: 1,
      ease_factor: 2.5,
      review_count: 0,
      lapse_count: 0,
      created_at: f.created_at || now,
      updated_at: now
    }));

    const { error: insertError } = await supabase
      .from('user_word_state')
      .insert(wordsToInsert);

    if (insertError) {
      console.error('Error inserting words:', insertError);
      throw new Error('Failed to insert new words');
    }

    return newWords.map(w => w.word);
  } catch (error) {
    console.error('Sync error:', error);
    throw error;
  }
}

/**
 * 获取用户复习统计
 */
async function getReviewStats(supabase: any, userId: string) {
  try {
    const { data: stats, error: statsError } = await supabase
      .from('user_word_state')
      .select('*')
      .eq('user_id', userId);

    if (statsError) {
      console.error('Error fetching stats:', statsError);
      return { totalWords: 0, dueToday: 0 };
    }

    const now = new Date().toISOString();
    const dueToday = stats?.filter((word: any) => 
      word.next_due_at && word.next_due_at <= now
    ).length || 0;

    return {
      totalWords: stats?.length || 0,
      dueToday
    };
  } catch (error) {
    console.error('Stats error:', error);
    return { totalWords: 0, dueToday: 0 };
  }
}

// ==================== 主处理函数 ====================

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  console.log('Review init handler started', { 
    method: req.method, 
    url: req.url,
    timestamp: new Date().toISOString()
  });
  
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // 处理 OPTIONS 请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // 只允许 POST 请求
  if (req.method !== 'POST') {
    res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
    return;
  }
  
  try {
    // 初始化Supabase配置
    const supabaseUrl = process.env.SUPABASE_URL;
    const rawServiceKey = process.env.SUPABASE_SERVICE_KEY;
    const rawAnonKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !rawServiceKey || !rawAnonKey) {
      console.error('Missing environment variables');
      res.status(500).json({
        success: false,
        error: 'Server configuration error'
      });
      return;
    }
    
    const supabaseServiceKey = rawServiceKey.replace(/\s/g, '').trim();
    const supabaseAnonKey = rawAnonKey.replace(/\s/g, '').trim();
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    
    // 用户认证
    const user = await authenticateUser(req, supabaseUrl, supabaseAnonKey);
    if (!user) {
      res.status(401).json({
        success: false,
        error: '请先登录'
      });
      return;
    }
    
    console.log('User authenticated:', user.id);
    
    // 执行数据同步
    const syncedWords = await syncFavoritesToReview(supabase, user.id);
    const stats = await getReviewStats(supabase, user.id);
    
    console.log('Sync completed:', {
      syncedWords: syncedWords.length,
      totalWords: stats.totalWords,
      dueToday: stats.dueToday
    });
    
    const response: InitResponse = {
      success: true,
      data: {
        syncedWords,
        totalWords: stats.totalWords,
        dueToday: stats.dueToday
      }
    };
    
    res.json(response);
    
  } catch (error: any) {
    console.error('Review init error:', {
      message: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      error: error.message || '初始化复习系统失败'
    });
  }
}