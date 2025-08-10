/**
 * @fileoverview 环境变量测试API
 * @module api/test-env
 * @description 测试环境变量是否正确加载
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  console.log('Environment test handler started', { 
    method: req.method, 
    url: req.url,
    timestamp: new Date().toISOString()
  });
  
  // 检查环境变量
  const envCheck = {
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
    hasSupabaseAnonKey: !!process.env.SUPABASE_ANON_KEY,
    hasAiHubMixKey: !!process.env.AIHUBMIX_API_KEY,
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    timestamp: new Date().toISOString()
  };
  
  console.log('Environment check result:', envCheck);
  
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
  
  res.json({
    success: true,
    data: envCheck,
    message: 'Environment variables check completed'
  });
} 