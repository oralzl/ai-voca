-- AI词汇应用数据库设计
-- 在Supabase SQL编辑器中执行以下SQL

-- 1. 创建用户扩展信息表
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name VARCHAR(100),
  avatar_url TEXT,
  subscription_tier VARCHAR(20) DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建查询历史表
CREATE TABLE IF NOT EXISTS public.word_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  word VARCHAR(100) NOT NULL,
  query_params JSONB,
  response_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 创建用户查询限制表
CREATE TABLE IF NOT EXISTS public.user_query_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_queries INTEGER DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  max_daily_queries INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 约束：确保查询次数不能为负数
  CONSTRAINT valid_daily_queries CHECK (daily_queries >= 0)
);

-- 4. 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_user_queries_user_id ON public.word_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_user_queries_word ON public.word_queries(word);
CREATE INDEX IF NOT EXISTS idx_user_queries_created_at ON public.word_queries(created_at);
CREATE INDEX IF NOT EXISTS idx_query_limits_user_id ON public.user_query_limits(user_id);

-- 5. 启用行级安全 (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.word_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_query_limits ENABLE ROW LEVEL SECURITY;

-- 6. 创建RLS策略 - 用户只能访问自己的数据
-- 用户资料策略
CREATE POLICY "Users can manage their own profile" ON public.user_profiles
  FOR ALL USING (auth.uid() = id);

-- 查询历史策略
CREATE POLICY "Users can manage their own queries" ON public.word_queries
  FOR ALL USING (auth.uid() = user_id);

-- 查询限制策略
CREATE POLICY "Users can manage their own limits" ON public.user_query_limits
  FOR ALL USING (auth.uid() = user_id);

-- 7. 创建触发器函数 - 自动更新时间戳
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. 创建更新时间戳的触发器
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_query_limits_updated_at
  BEFORE UPDATE ON public.user_query_limits
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 9. 创建自动创建用户资料的函数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  
  INSERT INTO public.user_query_limits (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. 创建新用户自动触发器
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 11. 创建查询计数增加的函数
CREATE OR REPLACE FUNCTION public.increment_daily_queries(user_id UUID)
RETURNS VOID AS $$
DECLARE
  today DATE := CURRENT_DATE;
BEGIN
  INSERT INTO public.user_query_limits (user_id, daily_queries, last_reset_date)
  VALUES (user_id, 1, today)
  ON CONFLICT (user_id) DO UPDATE SET
    daily_queries = CASE
      WHEN user_query_limits.last_reset_date < today THEN 1
      ELSE user_query_limits.daily_queries + 1
    END,
    last_reset_date = today,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. 创建获取用户查询统计的函数
CREATE OR REPLACE FUNCTION public.get_user_query_stats(user_id UUID)
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
  WHERE COALESCE(wq.user_id, uql.user_id) = get_user_query_stats.user_id
    AND (uql.last_reset_date IS NULL OR uql.last_reset_date = CURRENT_DATE)
  GROUP BY uql.daily_queries, uql.max_daily_queries;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. 创建清理过期数据的函数（可选）
CREATE OR REPLACE FUNCTION public.cleanup_old_queries()
RETURNS VOID AS $$
BEGIN
  -- 删除30天前的查询记录（保留最近的查询）
  DELETE FROM public.word_queries 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 完成！数据库结构创建完成
-- 下一步：在Supabase控制台中执行此SQL脚本