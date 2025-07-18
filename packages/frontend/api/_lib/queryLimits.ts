import { supabase } from './supabase';

export interface QueryLimits {
  dailyQueries: number;
  maxDailyQueries: number;
  remainingQueries: number;
  canQuery: boolean;
}

export async function checkQueryLimits(userId: string): Promise<QueryLimits> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // 获取用户查询限制
    let { data: limits, error } = await supabase
      .from('user_query_limits')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code === 'PGRST116') {
      // 记录不存在，创建新的限制记录
      const { data: newLimits, error: createError } = await supabase
        .from('user_query_limits')
        .insert({
          user_id: userId,
          daily_queries: 0,
          last_reset_date: today,
          max_daily_queries: 100
        })
        .select()
        .single();
        
      if (createError) {
        throw createError;
      }
      
      limits = newLimits;
    } else if (error) {
      throw error;
    }
    
    if (!limits) {
      throw new Error('Failed to get query limits');
    }
    
    // 检查是否需要重置每日计数
    if (limits.last_reset_date !== today) {
      const { data: updatedLimits, error: updateError } = await supabase
        .from('user_query_limits')
        .update({
          daily_queries: 0,
          last_reset_date: today
        })
        .eq('user_id', userId)
        .select()
        .single();
        
      if (updateError) {
        throw updateError;
      }
      
      limits = updatedLimits;
    }
    
    const remainingQueries = Math.max(0, limits.max_daily_queries - limits.daily_queries);
    const canQuery = remainingQueries > 0;
    
    return {
      dailyQueries: limits.daily_queries,
      maxDailyQueries: limits.max_daily_queries,
      remainingQueries,
      canQuery
    };
    
  } catch (error) {
    console.error('Error checking query limits:', error);
    // 降级处理：允许查询但记录错误
    return {
      dailyQueries: 0,
      maxDailyQueries: 100,
      remainingQueries: 100,
      canQuery: true
    };
  }
}

export async function incrementQueryCount(userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .rpc('increment_daily_queries', { user_id: userId });
      
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error incrementing query count:', error);
    // 不抛出错误，避免影响主要功能
  }
}

export async function saveQueryRecord(
  userId: string,
  word: string,
  queryParams: any,
  responseData: any
): Promise<void> {
  try {
    const { error } = await supabase
      .from('word_queries')
      .insert({
        user_id: userId,
        word,
        query_params: queryParams,
        response_data: responseData
      });
      
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error saving query record:', error);
    // 不抛出错误，避免影响主要功能
  }
}