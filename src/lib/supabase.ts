import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

if (supabaseUrl.includes('your-supabase-url-here')) {
  throw new Error('Please update your Supabase URL in .env.local')
}

if (supabaseAnonKey.includes('your-supabase-anon-key-here')) {
  throw new Error('Please update your Supabase anon key in .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          mobile_no: string
          is_admin: boolean
          created_at: string
        }
        Insert: {
          id: string
          name: string
          mobile_no: string
          is_admin?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          mobile_no?: string
          is_admin?: boolean
          created_at?: string
        }
      }
      referrals: {
        Row: {
          id: string
          referrer_user_id: string
          name: string
          mobile_no: string
          residency_pincode: string
          employment_type: 'salaried' | 'self-employed'
          employer_name: string | null
          monthly_net_income: number
          terms_accepted_at: string
          status: 'InProgress' | 'Approved' | 'Decline'
          processed_by: string | null
          processed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          referrer_user_id: string
          name: string
          mobile_no: string
          residency_pincode: string
          employment_type: 'salaried' | 'self-employed'
          employer_name?: string | null
          monthly_net_income: number
          terms_accepted_at: string
          status?: 'InProgress' | 'Approved' | 'Decline'
          processed_by?: string | null
          processed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          referrer_user_id?: string
          name?: string
          mobile_no?: string
          residency_pincode?: string
          employment_type?: 'salaried' | 'self-employed'
          employer_name?: string | null
          monthly_net_income?: number
          terms_accepted_at?: string
          status?: 'InProgress' | 'Approved' | 'Decline'
          processed_by?: string | null
          processed_at?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      referrals_masked: {
        Row: {
          id: string
          referrer_user_id: string
          name: string
          mobile_no: string
          residency_pincode: string
          employment_type: 'salaried' | 'self-employed'
          employer_name: string | null
          monthly_net_income: number
          terms_accepted_at: string
          status: 'InProgress' | 'Approved' | 'Decline'
          processed_by: string | null
          processed_at: string | null
          created_at: string
        }
      }
    }
  }
}
