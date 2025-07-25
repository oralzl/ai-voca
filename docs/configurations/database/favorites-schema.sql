-- AI词汇收藏功能数据库脚本
-- 只包含收藏相关的表和策略，避免与现有结构冲突

-- 1. 创建用户收藏表
CREATE TABLE IF NOT EXISTS public.user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  word VARCHAR(100) NOT NULL,           -- 存储lemma后的标准形式(text)
  original_query VARCHAR(100),          -- 原始查询词(如"running")
  query_data JSONB NOT NULL,            -- 完整的WordExplanation数据
  raw_response TEXT,                    -- AI原始响应内容(可选)
  notes TEXT,                           -- 用户笔记(可选)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 确保用户不会重复收藏同一个标准单词
  UNIQUE(user_id, word)
);

-- 2. 为收藏表创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_word ON public.user_favorites(word);
CREATE INDEX IF NOT EXISTS idx_user_favorites_created_at ON public.user_favorites(created_at);

-- 3. 启用收藏表的行级安全
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- 4. 创建收藏表的RLS策略 - 用户只能访问自己的收藏
-- 先检查策略是否已存在，如果存在则跳过
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_favorites' 
        AND policyname = 'Users can manage their own favorites'
    ) THEN
        CREATE POLICY "Users can manage their own favorites" ON public.user_favorites
          FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- 5. 为收藏表创建更新时间戳的触发器
-- 先检查触发器是否已存在
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE event_object_table = 'user_favorites' 
        AND trigger_name = 'update_user_favorites_updated_at'
    ) THEN
        CREATE TRIGGER update_user_favorites_updated_at
          BEFORE UPDATE ON public.user_favorites
          FOR EACH ROW
          EXECUTE FUNCTION public.handle_updated_at();
    END IF;
END $$;

-- 完成！收藏功能数据库结构创建完成