/**
 * @fileoverview API文档无服务器函数
 * @module api/words
 * @description 提供单词查询API的文档和使用说明
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
  
  // 只允许 GET 请求
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  res.json({
    name: 'AI单词查询API',
    version: '2.0.0',
    description: '基于用户认证的智能词汇查询服务',
    endpoints: {
      'GET /api/words/query': {
        description: '查询单词解释',
        authentication: 'Bearer token required',
        parameters: {
          word: 'string (required) - 要查询的单词',
          includeExample: 'boolean (optional) - 是否包含例句，默认为 true'
        },
        limits: {
          dailyQueries: 100,
          rateLimiting: 'Per user per day'
        },
        example: '/api/words/query?word=hello&includeExample=true'
      },
      'POST /api/words/query': {
        description: '查询单词解释（POST方式）',
        authentication: 'Bearer token required',
        body: {
          word: 'string (required) - 要查询的单词',
          includeExample: 'boolean (optional) - 是否包含例句，默认为 true'
        },
        limits: {
          dailyQueries: 100,
          rateLimiting: 'Per user per day'
        }
      },
      'GET /api/user/stats': {
        description: '获取用户查询统计信息',
        authentication: 'Bearer token required'
      }
    },
    features: [
      '🔐 用户认证保护',
      '📊 查询次数限制',
      '📝 查询历史记录',
      '🤖 AI智能解释',
      '🔄 重试机制支持'
    ]
  });
}