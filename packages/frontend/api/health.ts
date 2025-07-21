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
  console.log('Health check called');
  
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_KEY,
      hasAiHubMixKey: !!process.env.AIHUBMIX_API_KEY,
    }
  };
  
  console.log('Health check response:', health);
  
  res.status(200).json(health);
}