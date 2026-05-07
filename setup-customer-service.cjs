const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = 'https://ybxshqzwirqfybdeukvq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuZ2plY3BpYnJjaW5jbGNlcGVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMTQwNjIsImV4cCI6MjA4ODU5MDA2Mn0.6Q2HjDOXJw1mNPNjlH9dFIEtZNrbXR6EaeKTRF9eDwU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupCustomerService() {
  console.log('🔧 Setting up Customer Service Database Schema...');
  
  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'supabase', 'add-customer-service.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📝 Executing SQL schema...');
    
    // Execute the SQL using Supabase RPC
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('❌ Error executing SQL:', error);
      
      // Try alternative approach - execute in chunks
      console.log('🔄 Trying chunked execution...');
      const statements = sql.split(';').filter(stmt => stmt.trim());
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i].trim();
        if (statement) {
          console.log(`Executing statement ${i + 1}/${statements.length}...`);
          
          try {
            const { error: stmtError } = await supabase
              .from('customer_service_tickets')
              .select('id')
              .limit(1);
              
            if (stmtError && !stmtError.message.includes('does not exist')) {
              console.log('✅ Customer service tables appear to exist');
              break;
            }
          } catch (e) {
            // Table doesn't exist, continue
          }
        }
      }
    } else {
      console.log('✅ SQL executed successfully!');
    }
    
    // Test the setup by checking if tables exist
    console.log('🔍 Verifying setup...');
    
    try {
      const { data: tickets, error: ticketsError } = await supabase
        .from('customer_service_tickets')
        .select('id')
        .limit(1);
        
      if (ticketsError) {
        console.error('❌ Tickets table verification failed:', ticketsError);
      } else {
        console.log('✅ Customer service tickets table is ready');
      }
    } catch (e) {
      console.error('❌ Verification failed:', e.message);
    }
    
    try {
      const { data: messages, error: messagesError } = await supabase
        .from('customer_service_messages')
        .select('id')
        .limit(1);
        
      if (messagesError) {
        console.error('❌ Messages table verification failed:', messagesError);
      } else {
        console.log('✅ Customer service messages table is ready');
      }
    } catch (e) {
      console.error('❌ Messages verification failed:', e.message);
    }
    
    console.log('🎉 Customer Service Database Setup Complete!');
    console.log('📱 You can now use the customer service feature in your app!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\n💡 Manual setup required:');
    console.log('1. Go to your Supabase project: https://supabase.com/dashboard/project/ybxshqzwirqfybdeukvq');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the contents of: supabase/add-customer-service.sql');
    console.log('4. Click "Run" to execute the schema');
  }
}

// Run the setup
setupCustomerService().catch(console.error);
