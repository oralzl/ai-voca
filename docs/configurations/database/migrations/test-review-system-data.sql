-- 复习系统测试数据
-- 用于验证表结构是否正确工作
-- 注意：这些是测试数据，生产环境中请删除

-- 0. 首先检查是否有真实的用户ID可以使用
-- 如果 auth.users 表中有用户，我们可以使用第一个用户的ID
-- 否则，我们需要先创建一个测试用户

DO $$
DECLARE
  test_user_id UUID;
BEGIN
  -- 尝试获取第一个真实用户
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  -- 如果没有真实用户，创建一个测试用户
  IF test_user_id IS NULL THEN
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
    VALUES (
      '11111111-1111-1111-1111-111111111111',
      'test@example.com',
      crypt('password', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW()
    );
    test_user_id := '11111111-1111-1111-1111-111111111111';
  END IF;
  
  -- 使用获取到的用户ID插入测试数据
  -- 1. 插入测试用户复习偏好
  INSERT INTO public.user_review_prefs (user_id, level_cefr, unknown_budget, difficulty_bias, preferred_style)
  VALUES 
    (test_user_id, 'B1', 2, 0.0, 'neutral')
  ON CONFLICT (user_id) DO UPDATE SET
    level_cefr = EXCLUDED.level_cefr,
    unknown_budget = EXCLUDED.unknown_budget,
    difficulty_bias = EXCLUDED.difficulty_bias,
    preferred_style = EXCLUDED.preferred_style;
    
  -- 2. 插入测试用户词汇状态
  INSERT INTO public.user_word_state (user_id, word, familiarity, next_due_at, interval_days, ease_factor, review_count, lapse_count)
  VALUES 
    (test_user_id, 'offset', 2, NOW() - INTERVAL '1 day', 3, 2.5, 5, 1),
    (test_user_id, 'adequate', 1, NOW() - INTERVAL '2 hours', 1, 2.3, 3, 2),
    (test_user_id, 'staggering', 0, NOW(), 1, 2.5, 1, 0),
    (test_user_id, 'persistent', 3, NOW() + INTERVAL '2 days', 7, 2.7, 8, 0),
    (test_user_id, 'elaborate', 4, NOW() + INTERVAL '14 days', 30, 2.9, 12, 1)
  ON CONFLICT (user_id, word) DO UPDATE SET
    familiarity = EXCLUDED.familiarity,
    next_due_at = EXCLUDED.next_due_at,
    interval_days = EXCLUDED.interval_days,
    ease_factor = EXCLUDED.ease_factor,
    review_count = EXCLUDED.review_count,
    lapse_count = EXCLUDED.lapse_count;
    
  -- 3. 插入测试复习事件
  INSERT INTO public.review_events (user_id, delivery_id, event_type, word, sentence_text, rating, response_time_ms, meta)
  VALUES 
    (test_user_id, '11111111-1111-1111-1111-111111111111', 'word_good', 'offset', NULL, 3, 2500, '{"predicted_cefr": "B1", "estimated_new_terms_count": 1}'),
    (test_user_id, '11111111-1111-1111-1111-111111111111', 'word_again', 'adequate', NULL, 1, 4500, '{"predicted_cefr": "A2", "estimated_new_terms_count": 0}'),
    (test_user_id, '11111111-1111-1111-1111-111111111111', 'sentence_too_hard', NULL, 'The offset was adequate for the staggering task.', NULL, 3000, '{"predicted_cefr": "B2", "estimated_new_terms_count": 3}');
    
  -- 4. 验证数据插入是否成功
  RAISE NOTICE '测试用户ID: %', test_user_id;
  
END $$;

-- 5. 验证数据插入是否成功
-- 查询测试用户的待复习词汇
SELECT '测试用户待复习词汇:' as test_name;
SELECT word, familiarity, next_due_at FROM public.user_word_state 
WHERE next_due_at <= NOW()
ORDER BY next_due_at ASC;

-- 查询测试用户的复习统计
SELECT '测试用户复习统计:' as test_name;
SELECT * FROM public.get_user_review_stats(
  (SELECT id FROM auth.users LIMIT 1), 
  7
);

-- 查询测试用户的偏好设置
SELECT '测试用户偏好设置:' as test_name;
SELECT level_cefr, unknown_budget, difficulty_bias, preferred_style FROM public.user_review_prefs 
WHERE user_id = (SELECT id FROM auth.users LIMIT 1);

-- 查询复习事件统计
SELECT '复习事件统计:' as test_name;
SELECT 
  event_type,
  COUNT(*) as count,
  AVG(response_time_ms) as avg_response_time
FROM public.review_events 
GROUP BY event_type 
ORDER BY count DESC;

-- 6. 清理测试数据（可选）
-- 注意：这会删除所有测试数据，包括可能创建的测试用户
/*
DELETE FROM public.review_events WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com');
DELETE FROM public.user_word_state WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com');
DELETE FROM public.user_review_prefs WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com');
DELETE FROM auth.users WHERE email = 'test@example.com';
*/ 