import { supabase } from '../lib/supabase';

// Customer Service Schema Setup Script
async function setupCustomerService() {
  console.log('🔧 Setting up Customer Service Database Schema...');

  try {
    // Create customer_service_tickets table
    const { error: ticketsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS customer_service_tickets (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            ticket_number VARCHAR(20) UNIQUE NOT NULL,
            full_name VARCHAR(255) NOT NULL,
            phone_number VARCHAR(50) NOT NULL,
            initial_message TEXT NOT NULL,
            status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
            priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            assigned_to UUID REFERENCES users(id),
            last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (ticketsError) {
      console.error('Error creating tickets table:', ticketsError);
    } else {
      console.log('✅ Customer service tickets table created');
    }

    // Create customer_service_messages table
    const { error: messagesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS customer_service_messages (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            ticket_id UUID REFERENCES customer_service_tickets(id) ON DELETE CASCADE,
            sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
            message TEXT NOT NULL,
            message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'admin_note')),
            is_system_message BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            read_at TIMESTAMP WITH TIME ZONE
        );
      `
    });

    if (messagesError) {
      console.error('Error creating messages table:', messagesError);
    } else {
      console.log('✅ Customer service messages table created');
    }

    // Create indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_customer_service_tickets_user_id ON customer_service_tickets(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_customer_service_tickets_status ON customer_service_tickets(status);',
      'CREATE INDEX IF NOT EXISTS idx_customer_service_tickets_created_at ON customer_service_tickets(created_at DESC);',
      'CREATE INDEX IF NOT EXISTS idx_customer_service_messages_ticket_id ON customer_service_messages(ticket_id);',
      'CREATE INDEX IF NOT EXISTS idx_customer_service_messages_created_at ON customer_service_messages(created_at ASC);'
    ];

    for (const indexSql of indexes) {
      const { error } = await supabase.rpc('exec_sql', { sql: indexSql });
      if (error) {
        console.error('Error creating index:', error);
      }
    }
    console.log('✅ Indexes created');

    // Enable RLS
    await supabase.rpc('exec_sql', { sql: 'ALTER TABLE customer_service_tickets ENABLE ROW LEVEL SECURITY;' });
    await supabase.rpc('exec_sql', { sql: 'ALTER TABLE customer_service_messages ENABLE ROW LEVEL SECURITY;' });
    console.log('✅ RLS enabled');

    console.log('🎉 Customer Service Database Setup Complete!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

// Run the setup
setupCustomerService();
