/**
 * @fileoverview 收藏切换API无服务器函数
 * @module api/favorites/toggle
 * @description 处理添加/删除收藏操作，基于lemma后的text作为唯一标识符
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

interface FavoriteToggleRequest {
  word: string;
  originalQuery?: string;
  queryData?: WordExplanation;
  rawResponse?: string;
  notes?: string;
}

interface FavoriteToggleResponse {
  success: boolean;
  data?: {
    isFavorited: boolean;
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
  console.log('Favorites toggle handler started', { method: req.method });
  
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
    } as FavoriteToggleResponse);
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
    const { word, originalQuery, queryData, rawResponse, notes } = req.body as FavoriteToggleRequest;
    
    console.log('Toggle API received:', {
      word,
      originalQuery,
      hasQueryData: !!queryData,
      hasRawResponse: !!rawResponse,
      rawResponseLength: rawResponse?.length || 0,
      rawResponsePreview: rawResponse ? rawResponse.substring(0, 100) + '...' : null
    });
    
    console.log('Favorites toggle request data:', {
      word,
      originalQuery,
      hasQueryData: !!queryData,
      hasRawResponse: !!rawResponse,
      rawResponseLength: rawResponse?.length || 0,
      notes
    });
    
    // 验证必需参数
    if (!word || typeof word !== 'string') {
      res.status(400).json({
        success: false,
        error: '单词参数是必需的'
      } as FavoriteToggleResponse);
      return;
    }
    
    if (!isValidWord(word)) {
      res.status(400).json({
        success: false,
        error: '无效的单词格式'
      } as FavoriteToggleResponse);
      return;
    }
    
    const normalizedWord = word.trim().toLowerCase();
    
    // 检查当前收藏状态
    const { data: existingFavorite, error: checkError } = await supabase
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
      } as FavoriteToggleResponse);
      return;
    }
    
    if (existingFavorite) {
      // 已收藏，执行取消收藏操作
      const { error: deleteError } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('word', normalizedWord);
      
      if (deleteError) {
        console.error('Error removing favorite:', deleteError);
        res.status(500).json({
          success: false,
          error: '取消收藏失败'
        } as FavoriteToggleResponse);
        return;
      }
      
      res.json({
        success: true,
        data: {
          isFavorited: false
        }
      } as FavoriteToggleResponse);
    } else {
      // 未收藏，执行添加收藏操作
      if (!queryData) {
        res.status(400).json({
          success: false,
          error: '添加收藏时需要提供单词数据'
        } as FavoriteToggleResponse);
        return;
      }
      
      const favoriteRecord = {
        user_id: user.id,
        word: normalizedWord,
        original_query: originalQuery || word,
        query_data: queryData,
        raw_response: rawResponse || null,
        notes: notes || null
      };
      
      console.log('About to insert to DB:', {
        ...favoriteRecord,
        raw_response: favoriteRecord.raw_response ? `${favoriteRecord.raw_response.length} chars` : 'null'
      });
      
      console.log('Adding favorite with data:', {
        word: normalizedWord,
        hasQueryData: !!queryData,
        hasRawResponse: !!rawResponse,
        rawResponsePreview: rawResponse ? rawResponse.substring(0, 100) + '...' : null
      });
      
      const { data: newFavorite, error: insertError } = await supabase
        .from('user_favorites')
        .insert(favoriteRecord)
        .select('*')
        .single();
      
      if (insertError) {
        console.error('Error adding favorite:', insertError);
        res.status(500).json({
          success: false,
          error: '添加收藏失败'
        } as FavoriteToggleResponse);
        return;
      }
      
      const favoriteResponse: FavoriteWord = {
        id: newFavorite.id,
        word: newFavorite.word,
        originalQuery: newFavorite.original_query,
        queryData: newFavorite.query_data,
        rawResponse: newFavorite.raw_response,
        notes: newFavorite.notes,
        createdAt: newFavorite.created_at,
        updatedAt: newFavorite.updated_at
      };
      
      res.json({
        success: true,
        data: {
          isFavorited: true,
          favorite: favoriteResponse
        }
      } as FavoriteToggleResponse);
    }
    
  } catch (error: any) {
    console.error('Favorites toggle handler error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    } as FavoriteToggleResponse);
  }
}