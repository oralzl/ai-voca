-- 生产环境数据库升级脚本（与测试环境对齐）
-- 可直接在 Supabase 控制台 Production 项目（ai-voca-app）SQL Editor 执行
-- 设计目标：幂等、可重复执行、安全对齐测试库结构与关键数据规则

-- 0) 依赖扩展（用于生成 UUID 等）
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- 1) review_event_type 枚举调整（移除 word_unknown，保留测试库一致的取值）
DO $$
BEGIN
  -- 已存在：若包含 word_unknown，则迁移并移除
  IF EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'review_event_type'
  ) THEN
    IF EXISTS (
      SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'review_event_type' AND e.enumlabel = 'word_unknown'
    ) THEN
      -- 1.1 将历史数据中的 word_unknown 迁移为 word_again（规则对齐）
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='review_events' AND column_name='event_type'
      ) THEN
        UPDATE public.review_events
        SET event_type = 'word_again'::review_event_type
        WHERE event_type::text = 'word_unknown';
      END IF;

      -- 1.2 新建不含 word_unknown 的类型，并切换列到新类型
      CREATE TYPE review_event_type_new AS ENUM (
        'word_again','word_hard','word_good','word_easy',
        'sentence_too_hard','sentence_ok','sentence_too_easy'
      );

      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='review_events' AND column_name='event_type'
      ) THEN
        ALTER TABLE public.review_events
        ALTER COLUMN event_type TYPE review_event_type_new USING event_type::text::review_event_type_new;
      END IF;

      -- 1.3 交换类型名，删除旧类型
      ALTER TYPE review_event_type RENAME TO review_event_type_old;
      ALTER TYPE review_event_type_new RENAME TO review_event_type;
      DROP TYPE review_event_type_old;
    END IF;
  ELSE
    -- 不存在：直接创建
    CREATE TYPE review_event_type AS ENUM (
      'word_again','word_hard','word_good','word_easy',
      'sentence_too_hard','sentence_ok','sentence_too_easy'
    );
  END IF;
END $$;

-- 2) 核心表存在性与结构对齐
-- 2.1 user_word_state（含 familiarity_progress，对齐测试库）
CREATE TABLE IF NOT EXISTS public.user_word_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word VARCHAR(100) NOT NULL,
  familiarity INTEGER NOT NULL DEFAULT 0,
  last_seen_at TIMESTAMPTZ,
  next_due_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  interval_days INTEGER NOT NULL DEFAULT 1,
  ease_factor DECIMAL(4,3) NOT NULL DEFAULT 2.5,
  review_count INTEGER NOT NULL DEFAULT 0,
  lapse_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
-- 唯一性（防重复）
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_word_state_user_id_word ON public.user_word_state(user_id, word);
-- 新增/对齐字段：familiarity_progress
ALTER TABLE public.user_word_state
  ADD COLUMN IF NOT EXISTS familiarity_progress NUMERIC NOT NULL DEFAULT 0.00;

-- 2.2 review_events（delivery_id 统一为 UUID NOT NULL）
CREATE TABLE IF NOT EXISTS public.review_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delivery_id UUID NOT NULL,
  event_type review_event_type NOT NULL,
  word VARCHAR(100),
  sentence_text TEXT,
  rating INTEGER,
  response_time_ms INTEGER,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 若 delivery_id 非 UUID 或允许 NULL，进行兼容性迁移
-- 安全 UUID 判定函数（幂等）
CREATE OR REPLACE FUNCTION public.is_uuid(p_text TEXT)
RETURNS boolean AS $$
BEGIN
  PERFORM p_text::uuid; RETURN true;
EXCEPTION WHEN others THEN
  RETURN false;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

DO $$
DECLARE col_type TEXT; col_is_nullable TEXT;
BEGIN
  SELECT data_type, is_nullable INTO col_type, col_is_nullable
  FROM information_schema.columns
  WHERE table_schema='public' AND table_name='review_events' AND column_name='delivery_id';

  IF col_type IS NOT NULL AND col_type <> 'uuid' THEN
    ALTER TABLE public.review_events ADD COLUMN IF NOT EXISTS delivery_id_uuid UUID;
    -- 尝试迁移：可解析则转换，否则生成新 UUID 占位
    UPDATE public.review_events
    SET delivery_id_uuid = CASE
      WHEN public.is_uuid(delivery_id::text) THEN delivery_id::uuid
      ELSE gen_random_uuid()
    END
    WHERE delivery_id_uuid IS NULL;
    ALTER TABLE public.review_events DROP COLUMN delivery_id;
    ALTER TABLE public.review_events RENAME COLUMN delivery_id_uuid TO delivery_id;
  END IF;

  -- 统一 NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='review_events' AND column_name='delivery_id'
      AND is_nullable = 'YES'
  ) THEN
    -- 补齐空值
    UPDATE public.review_events SET delivery_id = gen_random_uuid() WHERE delivery_id IS NULL;
    ALTER TABLE public.review_events ALTER COLUMN delivery_id SET NOT NULL;
  END IF;
END $$;

-- 2.3 user_review_prefs（新增自动选词/批次大小）
CREATE TABLE IF NOT EXISTS public.user_review_prefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level_cefr VARCHAR(2) NOT NULL DEFAULT 'B1',
  unknown_budget INTEGER NOT NULL DEFAULT 2,
  difficulty_bias DECIMAL(3,2) NOT NULL DEFAULT 0.0,
  preferred_style VARCHAR(20) NOT NULL DEFAULT 'neutral',
  allow_incidental_learning BOOLEAN NOT NULL DEFAULT true,
  daily_review_limit INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_review_prefs
  ADD COLUMN IF NOT EXISTS auto_select_mode BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.user_review_prefs
  ADD COLUMN IF NOT EXISTS auto_batch_size INTEGER NOT NULL DEFAULT 2;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema='public' AND table_name='user_review_prefs'
      AND constraint_name='chk_user_review_prefs_auto_batch_size_range'
  ) THEN
    ALTER TABLE public.user_review_prefs
      ADD CONSTRAINT chk_user_review_prefs_auto_batch_size_range
      CHECK (auto_batch_size >= 1 AND auto_batch_size <= 8);
  END IF;
END $$;

-- 3) 数据一致性修复（句子事件不记评分；字段互斥）
UPDATE public.review_events
SET rating = NULL
WHERE event_type IN ('sentence_too_hard','sentence_ok','sentence_too_easy') AND rating IS NOT NULL;

UPDATE public.review_events
SET word = NULL
WHERE event_type IN ('sentence_too_hard','sentence_ok','sentence_too_easy') AND word IS NOT NULL;

UPDATE public.review_events
SET sentence_text = NULL
WHERE event_type IN ('word_again','word_hard','word_good','word_easy') AND sentence_text IS NOT NULL;

-- 4) RLS 与策略（与测试库一致）
ALTER TABLE public.user_word_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_review_prefs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_word_state'
      AND policyname='Users can manage their own word states'
  ) THEN
    CREATE POLICY "Users can manage their own word states" ON public.user_word_state
      FOR ALL USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='review_events'
      AND policyname='Users can manage their own review events'
  ) THEN
    CREATE POLICY "Users can manage their own review events" ON public.review_events
      FOR ALL USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_review_prefs'
      AND policyname='Users can manage their own review preferences'
  ) THEN
    CREATE POLICY "Users can manage their own review preferences" ON public.user_review_prefs
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- 5) 触发器函数与触发器（更新时间戳；新用户自动偏好）
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 触发器（存在则保持，不存在则创建）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE event_object_table='user_word_state' AND trigger_name='update_user_word_state_updated_at'
  ) THEN
    CREATE TRIGGER update_user_word_state_updated_at
      BEFORE UPDATE ON public.user_word_state
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE event_object_table='user_review_prefs' AND trigger_name='update_user_review_prefs_updated_at'
  ) THEN
    CREATE TRIGGER update_user_review_prefs_updated_at
      BEFORE UPDATE ON public.user_review_prefs
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

-- 新用户自动创建复习偏好的触发器函数
CREATE OR REPLACE FUNCTION public.handle_new_user_review_prefs()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_review_prefs (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 若未创建，则补充触发器（避免与现有 on_auth_user_created 冲突）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname='on_auth_user_created_review_prefs'
  ) THEN
    CREATE TRIGGER on_auth_user_created_review_prefs
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user_review_prefs();
  END IF;
END $$;

-- 6) 索引（按需创建）
-- user_word_state
CREATE INDEX IF NOT EXISTS idx_user_word_state_user_id ON public.user_word_state(user_id);
CREATE INDEX IF NOT EXISTS idx_user_word_state_word ON public.user_word_state(word);
CREATE INDEX IF NOT EXISTS idx_user_word_state_next_due_at ON public.user_word_state(next_due_at);
CREATE INDEX IF NOT EXISTS idx_user_word_state_familiarity ON public.user_word_state(familiarity);

-- review_events
CREATE INDEX IF NOT EXISTS idx_review_events_user_id ON public.review_events(user_id);
CREATE INDEX IF NOT EXISTS idx_review_events_delivery_id ON public.review_events(delivery_id);
CREATE INDEX IF NOT EXISTS idx_review_events_event_type ON public.review_events(event_type);
CREATE INDEX IF NOT EXISTS idx_review_events_created_at ON public.review_events(created_at);
CREATE INDEX IF NOT EXISTS idx_review_events_word ON public.review_events(word);

-- user_review_prefs
CREATE INDEX IF NOT EXISTS idx_user_review_prefs_user_id ON public.user_review_prefs(user_id);

-- 7) 验证（只读检查）
-- 枚举值验证
-- SELECT unnest(enum_range(NULL::public.review_event_type)) AS event_type;

-- 结构与策略验证
-- SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('user_word_state','review_events','user_review_prefs');
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='review_events' AND column_name='delivery_id';
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename IN ('user_word_state','review_events','user_review_prefs') ORDER BY tablename, policyname;
-- SELECT indexname, tablename FROM pg_indexes WHERE tablename IN ('user_word_state','review_events','user_review_prefs') ORDER BY tablename, indexname;

-- 完成


