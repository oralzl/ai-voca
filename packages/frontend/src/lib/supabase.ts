import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('Supabase Config:', {
  url: supabaseUrl,
  hasKey: !!supabaseAnonKey,
  keyPrefix: supabaseAnonKey?.substring(0, 20) + '...'
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