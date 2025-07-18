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
    
    // 获取用户查询限制信息
    const { data: limitData, error: limitError } = await supabase
      .from('user_query_limits')
      .select('daily_queries, max_daily_queries, last_reset_date')
      .eq('user_id', user.id)
      .single();
    
    if (limitError && limitError.code !== 'PGRST116') { // PGRST116 是记录不存在的错误
      throw limitError;
    }
    
    // 获取用户总查询数
    const { count: totalQueries, error: countError } = await supabase
      .from('word_queries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    
    if (countError) {
      throw countError;
    }
    
    // 获取最后查询日期
    const { data: lastQueryData, error: lastQueryError } = await supabase
      .from('word_queries')
      .select('created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (lastQueryError && lastQueryError.code !== 'PGRST116') {
      throw lastQueryError;
    }
    
    // 计算今日剩余查询次数
    const todayQueries = limitData?.daily_queries || 0;
    const maxDailyQueries = limitData?.max_daily_queries || 100;
    const remainingQueries = Math.max(0, maxDailyQueries - todayQueries);
    
    res.json({
      success: true,
      data: {
        totalQueries: totalQueries || 0,
        todayQueries: todayQueries,
        remainingQueries: remainingQueries,
        maxDailyQueries: maxDailyQueries,
        lastQueryDate: lastQueryData?.created_at || null
      }
    });
    
  } catch (error: any) {
    console.error('User stats error:', error);
    res.status(500).json({
      success: false,
      error: '获取用户统计信息失败'
    });
  }
}