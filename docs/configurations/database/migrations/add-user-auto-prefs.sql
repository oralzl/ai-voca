-- 添加自动选词与批次大小到用户复习偏好表（带默认值与约束）
-- 可在 Supabase 控制台 SQL Editor 直接执行

-- 1) 自动选词模式：默认开启
ALTER TABLE public.user_review_prefs
ADD COLUMN IF NOT EXISTS auto_select_mode BOOLEAN NOT NULL DEFAULT true;

-- 2) 自动选词批次大小：默认 2，范围 1..8
ALTER TABLE public.user_review_prefs
ADD COLUMN IF NOT EXISTS auto_batch_size INTEGER NOT NULL DEFAULT 2
  CHECK (auto_batch_size >= 1 AND auto_batch_size <= 8);

-- 3) 触发 updated_at（若已存在触发器可忽略）
-- 依赖 handle_updated_at() 已在基础迁移中创建
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_review_prefs_updated_at'
  ) THEN
    CREATE TRIGGER update_user_review_prefs_updated_at
      BEFORE UPDATE ON public.user_review_prefs
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

-- 完成

