-- 修复查询计数增加函数中的列名冲突问题
CREATE OR REPLACE FUNCTION public.increment_daily_queries(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  today DATE := CURRENT_DATE;
BEGIN
  INSERT INTO public.user_query_limits (user_id, daily_queries, last_reset_date)
  VALUES (p_user_id, 1, today)
  ON CONFLICT (user_id) DO UPDATE SET
    daily_queries = CASE
      WHEN user_query_limits.last_reset_date < today THEN 1
      ELSE user_query_limits.daily_queries + 1
    END,
    last_reset_date = today,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 同时修复获取用户查询统计函数
CREATE OR REPLACE FUNCTION public.get_user_query_stats(p_user_id UUID)
RETURNS TABLE(
  total_queries BIGINT,
  today_queries INTEGER,
  remaining_queries INTEGER,
  last_query_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(wq.id) as total_queries,
    COALESCE(uql.daily_queries, 0) as today_queries,
    COALESCE(uql.max_daily_queries - uql.daily_queries, 100) as remaining_queries,
    MAX(wq.created_at) as last_query_date
  FROM public.word_queries wq
  FULL OUTER JOIN public.user_query_limits uql ON uql.user_id = wq.user_id
  WHERE COALESCE(wq.user_id, uql.user_id) = p_user_id
    AND (uql.last_reset_date IS NULL OR uql.last_reset_date = CURRENT_DATE)
  GROUP BY uql.daily_queries, uql.max_daily_queries;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;