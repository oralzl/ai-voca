import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

interface AuthUser {
  id: string;
  email: string;
  user_metadata: any;
}

async function authenticateUser(req: VercelRequest): Promise<AuthUser | null> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.substring(7);
    const supabaseUrl = process.env.SUPABASE_URL;
    const rawAnonKey = process.env.SUPABASE_ANON_KEY;
    const supabaseAnonKey = rawAnonKey ? rawAnonKey.replace(/\s/g, '').trim() : rawAnonKey;
    if (!supabaseUrl || !supabaseAnonKey) return null;
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return null;
    const user = await response.json();
    return { id: user.id, email: user.email || '', user_metadata: user.user_metadata || {} };
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = await authenticateUser(req);
  if (!user) return res.status(401).json({ success: false, error: '请先登录' });

  const supabaseUrl = process.env.SUPABASE_URL;
  const rawServiceKey = process.env.SUPABASE_SERVICE_KEY;
  const supabaseServiceKey = rawServiceKey ? rawServiceKey.replace(/\s/g, '').trim() : rawServiceKey;
  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ success: false, error: '服务器配置错误' });
  }
  const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { autoRefreshToken: false, persistSession: false } });

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('user_review_prefs')
        .select('auto_select_mode, auto_batch_size')
        .eq('user_id', user.id)
        .single();
      if (error && error.code !== 'PGRST116') {
        return res.status(500).json({ success: false, error: error.message });
      }
      return res.json({
        success: true,
        data: {
          auto_select_mode: data?.auto_select_mode ?? true,
          auto_batch_size: data?.auto_batch_size ?? 2,
        },
      });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message || '获取偏好失败' });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const auto_select_mode = typeof body.auto_select_mode === 'boolean' ? body.auto_select_mode : undefined;
      const auto_batch_size_raw = body.auto_batch_size;
      const auto_batch_size = typeof auto_batch_size_raw === 'number' ? Math.max(1, Math.min(8, Math.floor(auto_batch_size_raw))) : undefined;

      if (auto_select_mode === undefined && auto_batch_size === undefined) {
        return res.status(400).json({ success: false, error: '无有效更新字段' });
      }

      const updateFields: any = { updated_at: new Date().toISOString() };
      if (auto_select_mode !== undefined) updateFields.auto_select_mode = auto_select_mode;
      if (auto_batch_size !== undefined) updateFields.auto_batch_size = auto_batch_size;

      const { error } = await supabase
        .from('user_review_prefs')
        .upsert({ user_id: user.id, ...updateFields }, { onConflict: 'user_id' });
      if (error) {
        // 列不存在时给出提示
        if (error.code === '42703') {
          return res.status(400).json({ success: false, error: '缺少列：请先执行迁移以添加 auto_select_mode/auto_batch_size' });
        }
        return res.status(500).json({ success: false, error: error.message });
      }
      return res.json({ success: true });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message || '更新偏好失败' });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}


