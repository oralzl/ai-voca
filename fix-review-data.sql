-- 修复复习系统数据同步的SQL脚本
-- 运行此脚本将测试用户的收藏词汇同步到复习系统

-- 1. 确认当前用户ID
SELECT '当前用户ID: 6b7fdadc-55f4-4076-9bc1-61af5e769b32' as info;

-- 2. 查看当前收藏词汇
SELECT '当前收藏词汇:' as info;
SELECT word, created_at FROM public.user_favorites 
WHERE user_id = '6b7fdadc-55f4-4076-9bc1-61af5e769b32' 
ORDER BY created_at DESC;

-- 3. 查看当前复习状态
SELECT '当前复习状态:' as info;
SELECT word, familiarity, next_due_at FROM public.user_word_state 
WHERE user_id = '6b7fdadc-55f4-4076-9bc1-61af5e769b32' 
ORDER BY next_due_at ASC;

-- 4. 清理现有复习状态（重新开始）
DELETE FROM public.user_word_state 
WHERE user_id = '6b7fdadc-55f4-4076-9bc1-61af5e769b32';

-- 5. 批量同步收藏词汇到复习系统
INSERT INTO public.user_word_state (
  user_id, 
  word, 
  familiarity, 
  difficulty, 
  stability, 
  recall_p, 
  successes, 
  lapses, 
  last_seen_at, 
  next_due_at,
  created_at,
  updated_at
)
SELECT 
  user_id,
  word,
  0 as familiarity,          -- 初始熟悉度0
  2.5 as difficulty,         -- 初始难度2.5
  null as stability,         -- 稳定性留空
  null as recall_p,          -- 回忆概率留空
  0 as successes,            -- 成功次数0
  0 as lapses,               -- 失败次数0
  null as last_seen_at,      -- 从未复习
  NOW() as next_due_at,      -- 立即加入复习
  created_at,
  NOW() as updated_at
FROM public.user_favorites 
WHERE user_id = '6b7fdadc-55f4-4076-9bc1-61af5e769b32'
ON CONFLICT (user_id, word) DO NOTHING;

-- 6. 验证同步结果
SELECT '同步后复习状态:' as info;
SELECT 
  COUNT(*) as total_words,
  COUNT(CASE WHEN next_due_at <= NOW() THEN 1 END) as due_today
FROM public.user_word_state 
WHERE user_id = '6b7fdadc-55f4-4076-9bc1-61af5e769b32';

-- 7. 查看具体词汇
SELECT '同步后的词汇列表:' as info;
SELECT word, next_due_at FROM public.user_word_state 
WHERE user_id = '6b7fdadc-55f4-4076-9bc1-61af5e769b32' 
ORDER BY word;