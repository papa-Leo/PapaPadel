// src/lib/supabase.ts
import { createBrowserClient } from '@supabase/ssr'

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          phone: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      courts: {
        Row: {
          id: string
          name: string
          description: string | null
          is_indoor: boolean
          is_active: boolean
          image_url: string | null
          created_at: string
        }
      }
      bookings: {
        Row: {
          id: string
          court_id: string
          user_id: string
          date: string
          start_time: string
          end_time: string
          status: 'confirmed' | 'cancelled' | 'completed'
          notes: string | null
          player_count: number
          created_at: string
        }
        Insert: {
          court_id: string
          user_id: string
          date: string
          start_time: string
          end_time: string
          status?: 'confirmed' | 'cancelled' | 'completed'
          notes?: string
          player_count?: number
        }
      }
    }
  }
}

export const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
