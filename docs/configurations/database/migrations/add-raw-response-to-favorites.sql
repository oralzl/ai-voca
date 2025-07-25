-- 添加原始响应字段到用户收藏表
-- 用于支持在收藏详情中展示AI原始响应内容

-- 添加 raw_response 字段到 user_favorites 表
ALTER TABLE public.user_favorites 
ADD COLUMN IF NOT EXISTS raw_response TEXT;

-- 创建注释，说明字段用途
COMMENT ON COLUMN public.user_favorites.raw_response IS 'AI原始响应内容，用于在收藏详情中展示';

-- 迁移完成
-- 注意：此字段为可选字段(NULL)，对现有数据无影响
-- 新的收藏将会保存原始响应内容，旧的收藏则保持为NULL