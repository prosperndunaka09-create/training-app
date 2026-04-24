import { createClient } from '@supabase/supabase-js'
console.log("SUPABASE URL:", import.meta.env.VITE_SUPABASE_URL)

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})
export default supabase;

// ================= DATABASE TYPES =================
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          password_hash: string
          balance: number
          vip_level: number
          account_type: string
          training_completed: boolean
          training_progress: number
          training_phase: number
          tasks_completed: number
          trigger_task_number: number | null
          has_pending_order: boolean
          pending_amount: number
          is_negative_balance: boolean
          profit_added: boolean
          pending_product: any
          created_at: string
          updated_at: string
        }
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          task_number: number
          reward: number
          status: 'pending' | 'completed' | 'locked'
          created_at: string
          completed_at: string | null
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          type: 'deposit' | 'earning' | 'withdrawal' | 'task_reward'
          amount: number
          description: string
          status: 'pending' | 'completed' | 'failed'
          created_at: string
        }
      }
      training_accounts: {
        Row: {
          id: string
          email: string
          password: string
          assigned_to: string
          created_by: string
          status: string
          created_at: string
        }
      }
      admin_logs: {
        Row: {
          id: string
          action: string
          user_id: string
          details: any
          created_at: string
        }
      }
    }
  }
}