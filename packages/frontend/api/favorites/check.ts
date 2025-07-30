/**
 * @fileoverview 收藏状态检查API无服务器函数
 * @module api/favorites/check
 * @description 检查单词是否已收藏，如已收藏返回收藏时保存的完整数据
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
  rawResponse?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface FavoriteCheckResponse {
  success: boolean;
  data?: {
    isFavorited: boolean;
    favoriteData?: WordExplanation;
    favorite?: FavoriteWord;
  };
  error?: string;
}

// Supabase配置 - 使用 try-catch 避免模块加载时的环境变量检查错误
let supabase: any = null;
let supabaseUrl: string | undefined;
let supabaseServiceKey: string | undefined;
let supabaseAnonKey: string | undefined;

try {
  supabaseUrl = process.env.SUPABASE_URL;
  const rawServiceKey = process.env.SUPABASE_SERVICE_KEY;
  const rawAnonKey = process.env.SUPABASE_ANON_KEY;
  supabaseServiceKey = rawServiceKey ? rawServiceKey.replace(/\s/g, '').trim() : rawServiceKey;
  supabaseAnonKey = rawAnonKey ? rawAnonKey.replace(/\s/g, '').trim() : rawAnonKey;

  if (supabaseUrl && supabaseServiceKey && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
  }
} catch (error) {
  console.log('Supabase initialization deferred to runtime');
}

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

function isValidWord(word: string): boolean {
  if (!word || typeof word !== 'string') {
    return false;
  }
  
  const trimmed = word.trim();
  if (trimmed.length === 0 || trimmed.length > 100) {
    return false;
  }
  
  const validPattern = /^[a-zA-Z0-9\s\-']+$/;
  return validPattern.test(trimmed);
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  console.log('Favorites check handler started', { method: req.method });
  
  // 运行时初始化Supabase配置（如果模块加载时未成功）
  if (!supabase) {
    try {
      supabaseUrl = process.env.SUPABASE_URL;
      const rawServiceKey = process.env.SUPABASE_SERVICE_KEY;
      const rawAnonKey = process.env.SUPABASE_ANON_KEY;
      supabaseServiceKey = rawServiceKey ? rawServiceKey.replace(/\s/g, '').trim() : rawServiceKey;
      supabaseAnonKey = rawAnonKey ? rawAnonKey.replace(/\s/g, '').trim() : rawAnonKey;

      if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
        console.error('Missing Supabase environment variables:', {
          hasUrl: !!supabaseUrl,
          hasServiceKey: !!supabaseServiceKey,
          hasAnonKey: !!supabaseAnonKey
        });
        res.status(500).json({
          success: false,
          error: 'Server configuration error',
          timestamp: Date.now()
        });
        return;
      }

      supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });
    } catch (error) {
      console.error('Failed to initialize Supabase:', error);
      res.status(500).json({
        success: false,
        error: 'Server configuration error',
        timestamp: Date.now()
      });
      return;
    }
  }
  
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
    } as FavoriteCheckResponse);
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
    const { word } = req.query;
    
    // 验证参数
    if (!word || typeof word !== 'string') {
      res.status(400).json({
        success: false,
        error: '单词参数是必需的'
      } as FavoriteCheckResponse);
      return;
    }
    
    if (!isValidWord(word)) {
      res.status(400).json({
        success: false,
        error: '无效的单词格式'
      } as FavoriteCheckResponse);
      return;
    }
    
    const normalizedWord = word.trim().toLowerCase();
    
    // 查询收藏状态
    const { data: favoriteRecord, error: checkError } = await supabase
      .from('user_favorites')
      .select('*')
      .eq('user_id', user.id)
      .eq('word', normalizedWord)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking favorite:', checkError);
      res.status(500).json({
        success: false,
        error: '检查收藏状态失败'
      } as FavoriteCheckResponse);
      return;
    }
    
    if (favoriteRecord) {
      // 已收藏，返回收藏的数据
      const favorite: FavoriteWord = {
        id: favoriteRecord.id,
        word: favoriteRecord.word,
        originalQuery: favoriteRecord.original_query,
        queryData: favoriteRecord.query_data,
        rawResponse: favoriteRecord.raw_response,
        notes: favoriteRecord.notes,
        createdAt: favoriteRecord.created_at,
        updatedAt: favoriteRecord.updated_at
      };
      
      res.json({
        success: true,
        data: {
          isFavorited: true,
          favoriteData: favoriteRecord.query_data,  // 收藏时保存的WordExplanation数据
          favorite: favorite                        // 完整的收藏记录
        }
      } as FavoriteCheckResponse);
    } else {
      // 未收藏
      res.json({
        success: true,
        data: {
          isFavorited: false
        }
      } as FavoriteCheckResponse);
    }
    
  } catch (error: any) {
    console.error('Favorites check handler error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    } as FavoriteCheckResponse);
  }
}