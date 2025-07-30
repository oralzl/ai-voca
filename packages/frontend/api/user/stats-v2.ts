/**
 * @fileoverview 用户统计信息API无服务器函数 - 简化版本
 * @module api/user/stats-v2
 * @description 临时的简化版本，用于测试Vercel部署问题
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  console.log('Stats API v2 - Simplified version for testing');
  
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
  
  // 返回一个简单的响应
  res.json({
    success: true,
    data: {
      totalQueries: 0,
      todayQueries: 0,
      remainingQueries: 100,
      maxDailyQueries: 100,
      lastQueryDate: null
    },
    version: 'v2-simplified',
    timestamp: Date.now()
  });
}