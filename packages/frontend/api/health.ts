/**
 * @fileoverview API健康检查无服务器函数
 * @module api/health
 * @description 提供API服务状态检查，显示环境变量配置状态
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // 处理 OPTIONS 请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  console.log('Health check called', { method: req.method, timestamp: new Date().toISOString() });
  
  try {
    const health = {
      success: true,
      status: 'ok',
      message: 'API Routes is healthy',
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_ENV: process.env.VERCEL_ENV,
        hasSupabaseUrl: !!process.env.SUPABASE_URL,
        hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
        hasSupabaseAnonKey: !!process.env.SUPABASE_ANON_KEY,
        hasAiHubMixKey: !!process.env.AIHUBMIX_API_KEY,
        supabaseUrlLength: process.env.SUPABASE_URL?.length || 0,
        serviceKeyLength: process.env.SUPABASE_SERVICE_KEY?.length || 0,
        anonKeyLength: process.env.SUPABASE_ANON_KEY?.length || 0,
        aiKeyLength: process.env.AIHUBMIX_API_KEY?.length || 0
      }
    };
    
    console.log('Health check response:', health);
    
    res.status(200).json(health);
  } catch (error: any) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}