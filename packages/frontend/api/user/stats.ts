/**
 * @fileoverview 用户统计信息API无服务器函数
 * @module api/user/stats
 * @description 获取用户查询统计信息，包括总查询数、今日查询数和剩余次数
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Supabase配置将在handler函数中初始化，避免模块加载时的环境变量检查

// 内联的认证函数
interface AuthUser {
  id: string;
  email: string;
  user_metadata: any;
}

async function authenticateUser(req: VercelRequest, supabaseUrl: string, supabaseAnonKey: string): Promise<AuthUser | null> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    const token = authHeader.substring(7);
    
    // 使用Auth API直接验证token
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
    error: message,
    timestamp: Date.now()
  };
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  console.log('User stats handler started', { 
    method: req.method, 
    url: req.url,
    hasAuth: !!req.headers.authorization,
    timestamp: new Date().toISOString()
  });
  
  // 检查环境变量是否正确加载
  console.log('Environment check:', {
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
    hasSupabaseAnonKey: !!process.env.SUPABASE_ANON_KEY,
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV
  });
  
  // 初始化 Supabase 配置
  const supabaseUrl = process.env.SUPABASE_URL;
  const rawServiceKey = process.env.SUPABASE_SERVICE_KEY;
  const rawAnonKey = process.env.SUPABASE_ANON_KEY;
  const supabaseServiceKey = rawServiceKey ? rawServiceKey.replace(/\s/g, '').trim() : rawServiceKey;
  const supabaseAnonKey = rawAnonKey ? rawAnonKey.replace(/\s/g, '').trim() : rawAnonKey;

  if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      hasAnonKey: !!supabaseAnonKey,
      serviceKeyLength: supabaseServiceKey?.length,
      anonKeyLength: supabaseAnonKey?.length
    });
    res.status(500).json({
      success: false,
      error: 'Server configuration error',
      timestamp: Date.now()
    });
    return;
  }
  
  console.log('Supabase config initialized:', {
    url: supabaseUrl,
    hasServiceKey: !!supabaseServiceKey,
    hasAnonKey: !!supabaseAnonKey
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
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  try {
    console.log('Starting user authentication');
    
    // 用户认证
    const user = await authenticateUser(req, supabaseUrl, supabaseAnonKey);
    if (!user) {
      console.log('User authentication failed');
      res.status(401).json(createAuthError('请先登录'));
      return;
    }
    
    console.log('User authenticated successfully:', user.id);
    
    // 先返回一个简单的响应来测试基本功能
    res.json({
      success: true,
      data: {
        totalQueries: 0,
        todayQueries: 0,
        remainingQueries: 100,
        maxDailyQueries: 100,
        lastQueryDate: null
      }
    });
    
  } catch (error: any) {
    console.error('User stats error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    
    const errorMessage = error.message || '获取用户统计信息失败';
    res.status(500).json({
      success: false,
      error: errorMessage,
      debug: {
        code: error.code,
        hint: error.hint
      }
    });
  }
}