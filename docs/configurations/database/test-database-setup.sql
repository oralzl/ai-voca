-- AI词汇应用测试环境数据库设置
-- 在Supabase测试项目的SQL编辑器中执行以下SQL

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

-- 3. 创建用户查询限制表（测试环境可以设置更宽松的限制）
CREATE TABLE IF NOT EXISTS public.user_query_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_queries INTEGER DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  max_daily_queries INTEGER DEFAULT 1000, -- 测试环境设置更高限制
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_daily_queries CHECK (daily_queries >= 0)
);

-- 4. 创建用户收藏表
CREATE TABLE IF NOT EXISTS public.user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  word VARCHAR(100) NOT NULL,
  original_query VARCHAR(100),
  query_data JSONB NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, word)
);

-- 5. 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_user_queries_user_id ON public.word_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_user_queries_word ON public.word_queries(word);
CREATE INDEX IF NOT EXISTS idx_user_queries_created_at ON public.word_queries(created_at);
CREATE INDEX IF NOT EXISTS idx_query_limits_user_id ON public.user_query_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_word ON public.user_favorites(word);
CREATE INDEX IF NOT EXISTS idx_user_favorites_created_at ON public.user_favorites(created_at);

-- 6. 启用行级安全 (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.word_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_query_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- 7. 创建RLS策略 - 用户只能访问自己的数据
CREATE POLICY "Users can manage their own profile" ON public.user_profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can manage their own queries" ON public.word_queries
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own limits" ON public.user_query_limits
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own favorites" ON public.user_favorites
  FOR ALL USING (auth.uid() = user_id);

-- 8. 创建触发器函数 - 自动更新时间戳
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. 创建更新时间戳的触发器
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_query_limits_updated_at
  BEFORE UPDATE ON public.user_query_limits
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_user_favorites_updated_at
  BEFORE UPDATE ON public.user_favorites
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 10. 创建自动创建用户资料的函数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  
  INSERT INTO public.user_query_limits (user_id, max_daily_queries)
  VALUES (NEW.id, 1000); -- 测试环境更宽松的限制
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. 创建新用户自动触发器
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 12. 创建查询计数增加的函数
CREATE OR REPLACE FUNCTION public.increment_daily_queries(user_id UUID)
RETURNS VOID AS $$
DECLARE
  today DATE := CURRENT_DATE;
BEGIN
  INSERT INTO public.user_query_limits (user_id, daily_queries, last_reset_date, max_daily_queries)
  VALUES (user_id, 1, today, 1000)
  ON CONFLICT (user_id) DO UPDATE SET
    daily_queries = CASE
      WHEN user_query_limits.last_reset_date < today THEN 1
      ELSE user_query_limits.daily_queries + 1
    END,
    last_reset_date = today,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. 创建获取用户查询统计的函数
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
    COALESCE(uql.max_daily_queries - uql.daily_queries, 1000) as remaining_queries,
    MAX(wq.created_at) as last_query_date
  FROM public.word_queries wq
  FULL OUTER JOIN public.user_query_limits uql ON uql.user_id = wq.user_id
  WHERE COALESCE(wq.user_id, uql.user_id) = get_user_query_stats.user_id
    AND (uql.last_reset_date IS NULL OR uql.last_reset_date = CURRENT_DATE)
  GROUP BY uql.daily_queries, uql.max_daily_queries;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 测试环境设置完成！
-- 
-- 下一步操作指南：
-- 1. 登录到 https://supabase.com
-- 2. 创建新项目，命名为 "ai-voca-test"
-- 3. 在SQL编辑器中执行上述SQL脚本
-- 4. 记录下新项目的URL和密钥：
--    - Project URL: https://ogdqwsminccyayybqrrd.supabase.co
--    - Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nZHF3c21pbmNjeWF5eWJxcnJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MDEyMjcsImV4cCI6MjA2OTM3NzIyN30.skoQs4w9W5q3HQ7cGTfU-rk2tJAk_3Y-WO5C51J0zAg
--    - Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nZHF3c21pbmNjeWF5eWJxcnJkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzgwMTIyNywiZXhwIjoyMDY5Mzc3MjI3fQ.88b-RgMyp1mgQ9eMUx4Q-dN9558csSzIuBqjngUqUuM