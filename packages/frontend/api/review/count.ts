/**
 * @fileoverview 复习计数API无服务器函数
 * @module api/review/count
 * @description 处理复习计数请求，返回今日需要复习的词汇数量和总收藏数量
 * @version 1.0.0
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import type { ReviewCountResponse } from '@ai-voca/shared';

// ==================== 类型定义 ====================

interface AuthUser {
  id: string;
  email: string;
  user_metadata: any;
}

interface ReviewCountData {
  today_count: number;
  total_count: number;
}

// ==================== 认证函数 ====================

async function authenticateUser(req: VercelRequest): Promise<AuthUser | null> {
  try {
    console.log('Review count authentication started', {
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

function createAuthError(message: string = 'Unauthorized'): ReviewCountResponse {
  return {
    success: false,
    error: message
  };
}

// ==================== 缓存机制 ====================

interface CacheEntry {
  data: ReviewCountData;
  timestamp: number;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

function getCacheKey(userId: string): string {
  return `review_count:${userId}`;
}

function isCacheValid(entry: CacheEntry): boolean {
  return Date.now() < entry.expiresAt;
}

function getCachedCount(userId: string): ReviewCountData | null {
  const key = getCacheKey(userId);
  const entry = cache.get(key);
  
  if (entry && isCacheValid(entry)) {
    console.log('Cache hit for user:', userId);
    return entry.data;
  }
  
  if (entry) {
    console.log('Cache expired for user:', userId);
    cache.delete(key);
  }
  
  return null;
}

function setCachedCount(userId: string, data: ReviewCountData): void {
  const key = getCacheKey(userId);
  const now = Date.now();
  
  cache.set(key, {
    data,
    timestamp: now,
    expiresAt: now + CACHE_TTL
  });
  
  console.log('Cache set for user:', userId, 'expires at:', new Date(now + CACHE_TTL));
}

// ==================== 数据库查询函数 ====================

/**
 * 获取用户复习计数
 */
async function getReviewCount(supabase: any, userId: string): Promise<ReviewCountData> {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    console.log('Querying review count for user:', userId, {
      today: today.toISOString(),
      tomorrow: tomorrow.toISOString()
    });
    
    // 查询今日需要复习的词汇数量
    const { data: todayData, error: todayError } = await supabase
      .from('user_word_state')
      .select('word', { count: 'exact' })
      .eq('user_id', userId)
      .lte('next_due_at', tomorrow.toISOString())
      .gte('next_due_at', today.toISOString());
    
    if (todayError) {
      console.error('Error querying today count:', todayError);
      throw todayError;
    }
    
    // 查询总收藏词汇数量
    const { data: totalData, error: totalError } = await supabase
      .from('user_word_state')
      .select('word', { count: 'exact' })
      .eq('user_id', userId);
    
    if (totalError) {
      console.error('Error querying total count:', totalError);
      throw totalError;
    }
    
    const today_count = todayData?.length || 0;
    const total_count = totalData?.length || 0;
    
    console.log('Review count query result:', {
      userId,
      today_count,
      total_count,
      timestamp: new Date().toISOString()
    });
    
    return {
      today_count,
      total_count
    };
  } catch (error) {
    console.error('Database query failed:', error);
    throw error;
  }
}

// ==================== 主处理函数 ====================

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // 只允许GET请求
  if (req.method !== 'GET') {
    res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
    return;
  }
  
  try {
    console.log('Review count API called', {
      method: req.method,
      url: req.url,
      timestamp: new Date().toISOString()
    });
    
    // 用户认证
    const user = await authenticateUser(req);
    if (!user) {
      console.log('Authentication failed');
      res.status(401).json(createAuthError());
      return;
    }
    
    console.log('User authenticated:', user.id);
    
    // 检查缓存
    const cachedData = getCachedCount(user.id);
    if (cachedData) {
      res.status(200).json({
        success: true,
        data: cachedData
      });
      return;
    }
    
    // 初始化Supabase客户端
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration');
      res.status(500).json({
        success: false,
        error: 'Server configuration error'
      });
      return;
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // 获取复习计数
    const countData = await getReviewCount(supabase, user.id);
    
    // 缓存结果
    setCachedCount(user.id, countData);
    
    // 返回成功响应
    res.status(200).json({
      success: true,
      data: countData
    });
    
  } catch (error) {
    console.error('Review count API error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
} 