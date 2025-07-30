/**
 * @fileoverview 测试环境变量配置的简单端点
 * @module api/test-env
 * @description 用于验证Vercel环境变量是否正确配置
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // 处理 OPTIONS 请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  const timestamp = new Date().toISOString();
  
  console.log(`[${timestamp}] Test-env endpoint called`);
  
  // 检查环境变量
  const envCheck = {
    success: true,
    timestamp,
    version: 'test-env-v1',
    environment: {
      NODE_ENV: process.env.NODE_ENV || 'not-set',
      VERCEL_ENV: process.env.VERCEL_ENV || 'not-set',
      VERCEL_URL: process.env.VERCEL_URL || 'not-set',
      VERCEL_REGION: process.env.VERCEL_REGION || 'not-set'
    },
    supabase: {
      hasUrl: !!process.env.SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
      hasAnonKey: !!process.env.SUPABASE_ANON_KEY,
      urlLength: process.env.SUPABASE_URL?.length || 0,
      serviceKeyLength: process.env.SUPABASE_SERVICE_KEY?.length || 0,
      anonKeyLength: process.env.SUPABASE_ANON_KEY?.length || 0
    },
    frontend: {
      hasViteSupabaseUrl: !!process.env.VITE_SUPABASE_URL,
      hasViteSupabaseAnonKey: !!process.env.VITE_SUPABASE_ANON_KEY,
      viteUrlLength: process.env.VITE_SUPABASE_URL?.length || 0,
      viteAnonKeyLength: process.env.VITE_SUPABASE_ANON_KEY?.length || 0
    },
    ai: {
      hasApiKey: !!process.env.AIHUBMIX_API_KEY,
      hasApiUrl: !!process.env.AIHUBMIX_API_URL,
      hasModel: !!process.env.AIHUBMIX_MODEL,
      apiKeyLength: process.env.AIHUBMIX_API_KEY?.length || 0
    }
  };
  
  console.log(`[${timestamp}] Environment check result:`, JSON.stringify(envCheck, null, 2));
  
  res.status(200).json(envCheck);
}