import type { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticateUser, createAuthError } from '../_lib/auth';
import { supabase } from '../_lib/supabase';

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
  
  try {
    // 用户认证
    const user = await authenticateUser(req);
    if (!user) {
      res.status(401).json(createAuthError('请先登录'));
      return;
    }
    
    // 获取用户统计信息
    const { data: stats, error } = await supabase
      .rpc('get_user_query_stats', { user_id: user.id });
      
    if (error) {
      console.error('Error fetching user stats:', error);
      res.status(500).json({
        success: false,
        error: '获取统计信息失败',
        timestamp: Date.now()
      });
      return;
    }
    
    const userStats = stats && stats.length > 0 ? stats[0] : {
      total_queries: 0,
      today_queries: 0,
      remaining_queries: 100,
      last_query_date: null
    };
    
    res.json({
      success: true,
      data: {
        totalQueries: userStats.total_queries || 0,
        todayQueries: userStats.today_queries || 0,
        remainingQueries: userStats.remaining_queries || 100,
        lastQueryDate: userStats.last_query_date,
        maxDailyQueries: 100
      },
      timestamp: Date.now()
    });
    
  } catch (error: any) {
    console.error('User stats error:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误',
      timestamp: Date.now()
    });
  }
}