/**
 * 测试复习系统同步功能
 */

const SUPABASE_URL = 'https://syryqvbhfvjbctrdxcbv.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5cnlxdmJoZnZqYmN0cmR4Y2J2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjg1Mzc0OSwiZXhwIjoyMDY4NDI5NzQ5fQ.8aR9v6z3mX8qY5n2kL7pQ4wR9sT2vX6z3mX8qY5n2kL7p';

async function testSync() {
  console.log('开始测试复习系统同步...');
  
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    const userId = '6b7fdadc-55f4-4076-9bc1-61af5e769b32';
    
    // 1. 获取用户的收藏词汇
    const { data: favorites, error: favoritesError } = await supabase
      .from('user_favorites')
      .select('word, created_at')
      .eq('user_id', userId);
    
    if (favoritesError) {
      console.error('获取收藏词汇失败:', favoritesError);
      return;
    }
    
    console.log('收藏词汇:', favorites);
    
    // 2. 获取已存在的复习词汇
    const { data: existingWords, error: existingError } = await supabase
      .from('user_word_state')
      .select('word')
      .eq('user_id', userId);
    
    if (existingError) {
      console.error('获取已存在词汇失败:', existingError);
      return;
    }
    
    const existingWordSet = new Set(existingWords?.map(w => w.word) || []);
    const newWords = favorites.filter(f => !existingWordSet.has(f.word));
    
    console.log('新词汇需要同步:', newWords);
    
    if (newWords.length === 0) {
      console.log('没有需要同步的新词汇');
      return;
    }
    
    // 3. 同步新词汇到复习系统
    const now = new Date().toISOString();
    const wordsToInsert = newWords.map(f => ({
      user_id: userId,
      word: f.word,
      familiarity: 0,
      difficulty: 2.5,
      stability: null,
      recall_p: null,
      successes: 0,
      lapses: 0,
      last_seen_at: null,
      next_due_at: now,
      created_at: f.created_at || now,
      updated_at: now
    }));
    
    const { error: insertError } = await supabase
      .from('user_word_state')
      .insert(wordsToInsert);
    
    if (insertError) {
      console.error('插入词汇失败:', insertError);
      return;
    }
    
    console.log('同步成功！添加了', newWords.length, '个新词汇');
    
    // 4. 验证同步结果
    const { data: updatedWords } = await supabase
      .from('user_word_state')
      .select('word, familiarity')
      .eq('user_id', userId);
    
    console.log('同步后复习词汇:', updatedWords);
    
  } catch (error) {
    console.error('测试同步失败:', error);
  }
}

testSync();