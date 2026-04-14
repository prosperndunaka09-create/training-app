import { supabase } from '../lib/supabase';

export interface DatabaseUser {
  id: string;
  email: string;
  display_name: string;
  balance: number;
  vip_level: number;
  tasks_completed: number;
  tasks_total: number;
  account_type: string;
  status: string;
  created_at: string;
}

export interface DatabaseTask {
  id: string;
  user_id: string;
  task_number: number;
  title: string;
  description: string;
  status: string;
  reward: number;
  created_at: string;
  completed_at?: string;
}

export interface DatabaseTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  status: string;
  description: string;
  created_at: string;
}

export class SupabaseService {
  // Basic User Operations
  static async getUser(userId: string): Promise<DatabaseUser | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  static async updateUser(userId: string, updates: Partial<DatabaseUser>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      return false;
    }
  }

  // Task Operations
  static async getUserTasks(userId: string): Promise<DatabaseTask[]> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('task_number', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
  }

  static async updateTask(taskId: string, updates: Partial<DatabaseTask>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating task:', error);
      return false;
    }
  }

  // Transaction Operations
  static async createTransaction(transaction: Omit<DatabaseTransaction, 'id' | 'created_at'>): Promise<DatabaseTransaction | null> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert(transaction)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating transaction:', error);
      return null;
    }
  }

  static async getUserTransactions(userId: string): Promise<DatabaseTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  }

  // Customer Service Operations
  static async createCustomerServiceTicket(
    fullName: string,
    phoneNumber: string,
    message: string
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('create_customer_service_ticket', {
        p_full_name: fullName,
        p_phone_number: phoneNumber,
        p_initial_message: message
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating customer service ticket:', error);
      return null;
    }
  }

  static async sendCustomerServiceMessage(
    ticketId: string,
    message: string,
    isAdmin: boolean = false
  ): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('send_customer_service_message', {
        p_ticket_id: ticketId,
        p_message: message,
        p_is_admin: isAdmin
      });
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error sending customer service message:', error);
      return false;
    }
  }

  static async getCustomerServiceTickets(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('customer_service_tickets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching customer service tickets:', error);
      return [];
    }
  }

  static async getCustomerServiceMessages(ticketId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('customer_conversations')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('message_created_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching customer service messages:', error);
      return [];
    }
  }
}
