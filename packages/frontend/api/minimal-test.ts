/**
 * 极简测试 - 验证环境变量问题
 */

console.log('[Minimal Test] Module loading', {
  timestamp: new Date().toISOString(),
  line: 'top-level',
  hasSupabaseUrl: !!process.env.SUPABASE_URL
});

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  console.log('[Minimal Test] Handler called', {
    timestamp: new Date().toISOString(),
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
    hasAnonKey: !!process.env.SUPABASE_ANON_KEY
  });

  res.status(200).json({
    success: true,
    test: 'minimal',
    env: {
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
      hasAnonKey: !!process.env.SUPABASE_ANON_KEY,
      lengths: {
        url: process.env.SUPABASE_URL?.length || 0,
        serviceKey: process.env.SUPABASE_SERVICE_KEY?.length || 0,
        anonKey: process.env.SUPABASE_ANON_KEY?.length || 0
      }
    }
  });
}