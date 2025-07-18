import { createClient } from '@supabase/supabase-js'

// 临时硬编码配置用于测试
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://syryqvbhfvjbctrdxcbv.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5cnlxdmJoZnZqYmN0cmR4Y2J2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NTM3NDksImV4cCI6MjA2ODQyOTc0OX0.5E0H1pvs2Pv1XyT04DvDmHQuO-zsv4PdeVLMcYqFRaM'

console.log('Supabase Config:', {
  url: supabaseUrl,
  hasKey: !!supabaseAnonKey,
  keyPrefix: supabaseAnonKey?.substring(0, 20) + '...',
  envUrl: import.meta.env.VITE_SUPABASE_URL,
  envKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'present' : 'missing'
})

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: supabaseUrl,
    key: supabaseAnonKey
  })
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

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