/**
 * @fileoverview 环境变量测试端点
 * @description 用于测试预览环境的环境变量配置
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  console.log('Test env v2 handler started', {
    timestamp: new Date().toISOString(),
    vercelEnv: process.env.VERCEL_ENV,
    nodeEnv: process.env.NODE_ENV
  });

  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const envStatus = {
    timestamp: new Date().toISOString(),
    environment: {
      VERCEL_ENV: process.env.VERCEL_ENV || 'not_set',
      NODE_ENV: process.env.NODE_ENV || 'not_set',
      VERCEL_URL: process.env.VERCEL_URL || 'not_set',
      VERCEL_REGION: process.env.VERCEL_REGION || 'not_set'
    },
    supabase: {
      hasUrl: !!process.env.SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
      hasAnonKey: !!process.env.SUPABASE_ANON_KEY,
      urlLength: process.env.SUPABASE_URL?.length || 0,
      serviceKeyLength: process.env.SUPABASE_SERVICE_KEY?.length || 0,
      anonKeyLength: process.env.SUPABASE_ANON_KEY?.length || 0,
      urlPrefix: process.env.SUPABASE_URL?.substring(0, 30) || 'not_set'
    },
    ai: {
      hasApiKey: !!process.env.AIHUBMIX_API_KEY,
      hasApiUrl: !!process.env.AIHUBMIX_API_URL,
      hasModel: !!process.env.AIHUBMIX_MODEL,
      apiUrl: process.env.AIHUBMIX_API_URL || 'not_set',
      model: process.env.AIHUBMIX_MODEL || 'not_set'
    },
    runtime: {
      tag: process.env.FORCE_RUNTIME_TAG || 'not_set',
      memory: process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE || 'not_set',
      handler: process.env._HANDLER || 'not_set',
      region: process.env.AWS_REGION || 'not_set'
    }
  };

  res.status(200).json({
    success: true,
    message: 'Environment test endpoint v2',
    data: envStatus
  });
}