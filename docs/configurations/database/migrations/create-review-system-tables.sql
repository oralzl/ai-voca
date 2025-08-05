-- 复习系统数据库迁移文件
-- 创建用户词汇状态、复习事件和用户偏好表
-- 在Supabase SQL编辑器中执行以下SQL

-- 1. 创建复习事件类型枚举
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_event_type') THEN
    CREATE TYPE review_event_type AS ENUM (
      'word_again',
      'word_hard', 
      'word_good',
      'word_easy',
      'word_unknown',
      'sentence_too_hard',
      'sentence_ok',
      'sentence_too_easy'
    );
  END IF;
END $$;

-- 2. 创建用户词汇状态表 (user_word_state)
CREATE TABLE IF NOT EXISTS public.user_word_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word VARCHAR(100) NOT NULL,
  familiarity INTEGER NOT NULL DEFAULT 0, -- FSRS 熟练度 (0-5)
  last_seen_at TIMESTAMP WITH TIME ZONE,
  next_due_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  interval_days INTEGER NOT NULL DEFAULT 1, -- 下次复习间隔天数
  ease_factor DECIMAL(4,3) NOT NULL DEFAULT 2.5, -- FSRS 难度因子
  review_count INTEGER NOT NULL DEFAULT 0, -- 复习次数
  lapse_count INTEGER NOT NULL DEFAULT 0, -- 遗忘次数
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 确保每个用户对每个词只有一条记录
  UNIQUE(user_id, word)
);

-- 3. 创建复习事件表 (review_events)
CREATE TABLE IF NOT EXISTS public.review_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delivery_id UUID NOT NULL, -- 复习会话ID，用于关联同一会话的事件
  event_type review_event_type NOT NULL,
  word VARCHAR(100), -- 对于词汇事件必填，对于句子事件为空
  sentence_text TEXT, -- 对于句子事件必填，对于词汇事件为空
  rating INTEGER, -- 对于词汇事件：1=again, 2=hard, 3=good, 4=easy, 5=unknown
  response_time_ms INTEGER, -- 响应时间（毫秒）
  meta JSONB, -- 存储自评元数据：predicted_cefr, estimated_new_terms_count, new_terms等
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 创建用户复习偏好表 (user_review_prefs)
CREATE TABLE IF NOT EXISTS public.user_review_prefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level_cefr VARCHAR(2) NOT NULL DEFAULT 'B1' CHECK (level_cefr IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  unknown_budget INTEGER NOT NULL DEFAULT 2 CHECK (unknown_budget >= 0 AND unknown_budget <= 4),
  difficulty_bias DECIMAL(3,2) NOT NULL DEFAULT 0.0 CHECK (difficulty_bias >= -1.5 AND difficulty_bias <= 1.5),
  preferred_style VARCHAR(20) NOT NULL DEFAULT 'neutral' CHECK (preferred_style IN ('neutral', 'news', 'dialog', 'academic')),
  allow_incidental_learning BOOLEAN NOT NULL DEFAULT true,
  daily_review_limit INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 创建索引优化查询性能
-- user_word_state 表索引
CREATE INDEX IF NOT EXISTS idx_user_word_state_user_id ON public.user_word_state(user_id);
CREATE INDEX IF NOT EXISTS idx_user_word_state_word ON public.user_word_state(word);
CREATE INDEX IF NOT EXISTS idx_user_word_state_next_due_at ON public.user_word_state(next_due_at);
CREATE INDEX IF NOT EXISTS idx_user_word_state_familiarity ON public.user_word_state(familiarity);

-- review_events 表索引
CREATE INDEX IF NOT EXISTS idx_review_events_user_id ON public.review_events(user_id);
CREATE INDEX IF NOT EXISTS idx_review_events_delivery_id ON public.review_events(delivery_id);
CREATE INDEX IF NOT EXISTS idx_review_events_event_type ON public.review_events(event_type);
CREATE INDEX IF NOT EXISTS idx_review_events_created_at ON public.review_events(created_at);
CREATE INDEX IF NOT EXISTS idx_review_events_word ON public.review_events(word);

-- user_review_prefs 表索引
CREATE INDEX IF NOT EXISTS idx_user_review_prefs_user_id ON public.user_review_prefs(user_id);

-- 6. 启用行级安全 (RLS)
ALTER TABLE public.user_word_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_review_prefs ENABLE ROW LEVEL SECURITY;

-- 7. 创建RLS策略 - 用户只能访问自己的数据
-- user_word_state 策略
CREATE POLICY "Users can manage their own word states" ON public.user_word_state
  FOR ALL USING (auth.uid() = user_id);

-- review_events 策略
CREATE POLICY "Users can manage their own review events" ON public.review_events
  FOR ALL USING (auth.uid() = user_id);

-- user_review_prefs 策略
CREATE POLICY "Users can manage their own review preferences" ON public.user_review_prefs
  FOR ALL USING (auth.uid() = user_id);

-- 8. 为 user_word_state 和 user_review_prefs 创建更新时间戳的触发器
CREATE TRIGGER update_user_word_state_updated_at
  BEFORE UPDATE ON public.user_word_state
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_user_review_prefs_updated_at
  BEFORE UPDATE ON public.user_review_prefs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 9. 创建自动创建用户复习偏好的函数
CREATE OR REPLACE FUNCTION public.handle_new_user_review_prefs()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_review_prefs (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. 创建新用户自动触发器（如果还没有的话）
-- 注意：这个触发器可能已经存在，如果存在会报错，可以忽略
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created_review_prefs'
  ) THEN
    CREATE TRIGGER on_auth_user_created_review_prefs
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user_review_prefs();
  END IF;
END $$;

-- 11. 创建获取用户待复习词汇的函数
CREATE OR REPLACE FUNCTION public.get_user_due_words(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
  word VARCHAR(100),
  familiarity INTEGER,
  next_due_at TIMESTAMP WITH TIME ZONE,
  interval_days INTEGER,
  ease_factor DECIMAL(4,3),
  review_count INTEGER,
  lapse_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uws.word,
    uws.familiarity,
    uws.next_due_at,
    uws.interval_days,
    uws.ease_factor,
    uws.review_count,
    uws.lapse_count
  FROM public.user_word_state uws
  WHERE uws.user_id = p_user_id
    AND uws.next_due_at <= NOW()
  ORDER BY uws.next_due_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. 创建获取用户复习统计的函数
CREATE OR REPLACE FUNCTION public.get_user_review_stats(
  p_user_id UUID,
  p_days INTEGER DEFAULT 7
)
RETURNS TABLE(
  total_reviews INTEGER,
  today_reviews INTEGER,
  average_rating DECIMAL(3,2),
  completion_rate DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_reviews,
    COUNT(CASE WHEN DATE(re.created_at) = CURRENT_DATE THEN 1 END)::INTEGER as today_reviews,
    AVG(re.rating)::DECIMAL(3,2) as average_rating,
    (COUNT(CASE WHEN re.rating >= 3 THEN 1 END) * 100.0 / COUNT(*))::DECIMAL(5,2) as completion_rate
  FROM public.review_events re
  WHERE re.user_id = p_user_id
    AND re.created_at >= NOW() - INTERVAL '1 day' * p_days
    AND re.word IS NOT NULL; -- 只统计词汇事件，不包括句子事件
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 完成！复习系统数据库结构创建完成
-- 下一步：在Supabase控制台中执行此SQL脚本 