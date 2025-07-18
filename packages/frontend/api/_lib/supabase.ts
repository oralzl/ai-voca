import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../src/lib/supabase';

// 暂时硬编码配置
const supabaseUrl = process.env.SUPABASE_URL || 'https://syryqvbhfvjbctrdxcbv.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5cnlxdmJoZnZqYmN0cmR4Y2J2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjg1Mzc0OSwiZXhwIjoyMDY4NDI5NzQ5fQ.QUiT7tWhJJYQi2t0zV45HKBKjOhmQ2QJF3R8E5TdYa0';

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

// 创建服务端客户端，用于 API Routes
export const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// 创建客户端，用于用户认证验证
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5cnlxdmJoZnZqYmN0cmR4Y2J2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NTM3NDksImV4cCI6MjA2ODQyOTc0OX0.5E0H1pvs2Pv1XyT04DvDmHQuO-zsv4PdeVLMcYqFRaM';

export const supabaseClient = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);