/**
 * @fileoverview 收藏列表API无服务器函数
 * @module api/favorites/list
 * @description 获取用户收藏的单词列表，支持分页和搜索
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// 内联的类型定义（从 @ai-voca/shared 复制）
interface WordExample {
  sentence: string;
  translation?: string;
}

interface WordExplanation {
  word: string;
  text?: string;
  lemmatizationExplanation?: string;
  pronunciation?: string;
  partOfSpeech?: string;
  definition: string;
  simpleExplanation?: string;
  examples?: WordExample[];
  synonyms?: string[];
  antonyms?: string[];
  etymology?: string;
  memoryTips?: string;
}

interface FavoriteWord {
  id: string;
  word: string;
  originalQuery?: string;
  queryData: WordExplanation;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface FavoriteListResponse {
  success: boolean;
  data?: {
    favorites: FavoriteWord[];
    total: number;
    page: number;
    pageSize: number;
  };
  error?: string;
}

// Supabase配置
const supabaseUrl = process.env.SUPABASE_URL;
const rawServiceKey = process.env.SUPABASE_SERVICE_KEY;
const rawAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = rawServiceKey ? rawServiceKey.replace(/\s/g, '').trim() : rawServiceKey;
const supabaseAnonKey = rawAnonKey ? rawAnonKey.replace(/\s/g, '').trim() : rawAnonKey;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// 用户认证函数
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

function createAuthError(message: string = 'Unauthorized') {
  return {
    success: false,
    error: message
  };
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  console.log('Favorites list handler started', { method: req.method });
  
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
    } as FavoriteListResponse);
    return;
  }
  
  try {
    // 用户认证
    const user = await authenticateUser(req);
    if (!user) {
      res.status(401).json(createAuthError('请先登录'));
      return;
    }
    
    // 解析查询参数
    const {
      page = '1',
      pageSize = '20',
      search = '',
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;
    
    const pageNum = parseInt(page as string) || 1;
    const pageSizeNum = Math.min(parseInt(pageSize as string) || 20, 100); // 最大100条
    const offset = (pageNum - 1) * pageSizeNum;
    
    // 构建查询
    let query = supabase
      .from('user_favorites')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id);
    
    // 添加搜索条件
    if (search && typeof search === 'string' && search.trim()) {
      const searchTerm = search.trim().toLowerCase();
      query = query.or(`word.ilike.%${searchTerm}%,original_query.ilike.%${searchTerm}%`);
    }
    
    // 添加排序
    const validSortFields = ['created_at', 'updated_at', 'word'];
    const validSortOrders = ['asc', 'desc'];
    
    if (validSortFields.includes(sortBy as string) && validSortOrders.includes(sortOrder as string)) {
      query = query.order(sortBy as string, { ascending: sortOrder === 'asc' });
    } else {
      query = query.order('created_at', { ascending: false });
    }
    
    // 添加分页
    query = query.range(offset, offset + pageSizeNum - 1);
    
    const { data: favorites, error: queryError, count } = await query;
    
    if (queryError) {
      console.error('Error fetching favorites:', queryError);
      res.status(500).json({
        success: false,
        error: '获取收藏列表失败'
      } as FavoriteListResponse);
      return;
    }
    
    // 转换数据格式
    const favoriteList: FavoriteWord[] = (favorites || []).map(fav => ({
      id: fav.id,
      word: fav.word,
      originalQuery: fav.original_query,
      queryData: fav.query_data,
      notes: fav.notes,
      createdAt: fav.created_at,
      updatedAt: fav.updated_at
    }));
    
    res.json({
      success: true,
      data: {
        favorites: favoriteList,
        total: count || 0,
        page: pageNum,
        pageSize: pageSizeNum
      }
    } as FavoriteListResponse);
    
  } catch (error: any) {
    console.error('Favorites list handler error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    } as FavoriteListResponse);
  }
}