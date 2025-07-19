import { createClient } from '@supabase/supabase-js'

// 使用环境变量配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
// 清理JWT token中的无效字符（换行符、空格等）
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabaseAnonKey = rawAnonKey ? rawAnonKey.replace(/\s/g, '').trim() : rawAnonKey

console.log('Supabase Config:', {
  url: supabaseUrl,
  hasKey: !!supabaseAnonKey,
  keyPrefix: supabaseAnonKey?.substring(0, 20) + '...',
  mode: import.meta.env.MODE,
  prod: import.meta.env.PROD,
  dev: import.meta.env.DEV
})

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: supabaseUrl,
    hasKey: !!supabaseAnonKey
  })
  throw new Error('Missing Supabase environment variables. Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
}

console.log('创建Supabase客户端:', { supabaseUrl, supabaseAnonKey: supabaseAnonKey.substring(0, 20) + '...' })


export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

console.log('Supabase客户端创建完成，URL:', supabaseUrl)

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          display_name: string | null
          avatar_url: string | null
          subscription_tier: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          avatar_url?: string | null
          subscription_tier?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          avatar_url?: string | null
          subscription_tier?: string
          created_at?: string
          updated_at?: string
        }
      }
      word_queries: {
        Row: {
          id: string
          user_id: string
          word: string
          query_params: any
          response_data: any
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          word: string
          query_params?: any
          response_data?: any
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          word?: string
          query_params?: any
          response_data?: any
          created_at?: string
        }
      }
      user_query_limits: {
        Row: {
          id: string
          user_id: string
          daily_queries: number
          last_reset_date: string
          max_daily_queries: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          daily_queries?: number
          last_reset_date?: string
          max_daily_queries?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          daily_queries?: number
          last_reset_date?: string
          max_daily_queries?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}