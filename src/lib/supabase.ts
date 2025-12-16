import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 데이터베이스 타입 (Supabase에서 생성된 테이블 기준)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      admins: {
        Row: {
          id: string
          kakao_id: string
          name: string
          email: string
          created_at: string
        }
        Insert: {
          id?: string
          kakao_id: string
          name: string
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          kakao_id?: string
          name?: string
          email?: string
          created_at?: string
        }
      }
      schedules: {
        Row: {
          id: string
          service_type: string
          date: string
          location: string
          start_time: string
          end_time: string
          shift_count: number
          participants_per_shift: number
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          service_type: string
          date: string
          location: string
          start_time: string
          end_time: string
          shift_count: number
          participants_per_shift: number
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          service_type?: string
          date?: string
          location?: string
          start_time?: string
          end_time?: string
          shift_count?: number
          participants_per_shift?: number
          created_by?: string
          created_at?: string
        }
      }
      registrations: {
        Row: {
          id: string
          schedule_id: string
          user_id: string
          shift_number: number
          created_at: string
        }
        Insert: {
          id?: string
          schedule_id: string
          user_id: string
          shift_number: number
          created_at?: string
        }
        Update: {
          id?: string
          schedule_id?: string
          user_id?: string
          shift_number?: number
          created_at?: string
        }
      }
    }
  }
}
