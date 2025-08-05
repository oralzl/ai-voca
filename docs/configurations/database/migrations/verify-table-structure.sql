-- 复习系统表结构验证
-- 用于验证表结构是否正确创建
-- 这个文件只验证表结构，不插入测试数据

-- 1. 检查表是否存在
SELECT '检查表是否存在:' as verification_step;
SELECT 
  table_name,
  CASE WHEN table_name IS NOT NULL THEN '✅ 存在' ELSE '❌ 不存在' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_word_state', 'review_events', 'user_review_prefs');

-- 2. 检查枚举类型是否存在
SELECT '检查枚举类型是否存在:' as verification_step;
SELECT 
  typname as enum_name,
  CASE WHEN typname IS NOT NULL THEN '✅ 存在' ELSE '❌ 不存在' END as status
FROM pg_type 
WHERE typname = 'review_event_type';

-- 3. 检查索引是否存在
SELECT '检查索引是否存在:' as verification_step;
SELECT 
  indexname,
  tablename,
  CASE WHEN indexname IS NOT NULL THEN '✅ 存在' ELSE '❌ 不存在' END as status
FROM pg_indexes 
WHERE tablename IN ('user_word_state', 'review_events', 'user_review_prefs')
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- 4. 检查函数是否存在
SELECT '检查函数是否存在:' as verification_step;
SELECT 
  routine_name,
  CASE WHEN routine_name IS NOT NULL THEN '✅ 存在' ELSE '❌ 不存在' END as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_user_due_words', 'get_user_review_stats', 'handle_new_user_review_prefs');

-- 5. 检查 RLS 策略是否存在
SELECT '检查 RLS 策略是否存在:' as verification_step;
SELECT 
  schemaname,
  tablename,
  policyname,
  CASE WHEN policyname IS NOT NULL THEN '✅ 存在' ELSE '❌ 不存在' END as status
FROM pg_policies 
WHERE tablename IN ('user_word_state', 'review_events', 'user_review_prefs')
ORDER BY tablename, policyname;

-- 6. 检查触发器是否存在
SELECT '检查触发器是否存在:' as verification_step;
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  CASE WHEN tgname IS NOT NULL THEN '✅ 存在' ELSE '❌ 不存在' END as status
FROM pg_trigger 
WHERE tgrelid::regclass::text IN ('public.user_word_state', 'public.user_review_prefs')
AND tgname LIKE '%updated_at%';

-- 7. 检查表结构详情
SELECT '检查表结构详情:' as verification_step;

-- user_word_state 表结构
SELECT 'user_word_state 表结构:' as table_info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_word_state'
ORDER BY ordinal_position;

-- review_events 表结构
SELECT 'review_events 表结构:' as table_info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'review_events'
ORDER BY ordinal_position;

-- user_review_prefs 表结构
SELECT 'user_review_prefs 表结构:' as table_info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_review_prefs'
ORDER BY ordinal_position;

-- 8. 检查约束
SELECT '检查约束:' as verification_step;
SELECT 
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public' 
AND tc.table_name IN ('user_word_state', 'review_events', 'user_review_prefs')
ORDER BY tc.table_name, tc.constraint_type;

-- 9. 总结验证结果
SELECT '验证完成！' as final_status;
SELECT 
  '如果上面的所有检查都显示 ✅ 存在，说明表结构创建成功。' as message,
  '如果有 ❌ 不存在的项目，请检查迁移脚本是否正确执行。' as action; 