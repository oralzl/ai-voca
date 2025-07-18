import { VercelRequest } from '@vercel/node';
import { supabaseClient } from './supabase';

export interface AuthUser {
  id: string;
  email: string;
  user_metadata: any;
}

export async function authenticateUser(req: VercelRequest): Promise<AuthUser | null> {
  try {
    // 从请求头中获取 Authorization token
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    const token = authHeader.substring(7); // 移除 "Bearer " 前缀
    
    // 验证用户token
    const { data: { user }, error } = await supabaseClient.auth.getUser(token);
    
    if (error || !user) {
      console.error('Auth error:', error);
      return null;
    }
    
    return {
      id: user.id,
      email: user.email || '',
      user_metadata: user.user_metadata || {}
    };
    
  } catch (error) {
    console.error('Authentication failed:', error);
    return null;
  }
}

export function createAuthError(message: string = 'Unauthorized') {
  return {
    success: false,
    error: message,
    timestamp: Date.now()
  };
}