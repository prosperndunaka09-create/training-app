const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://ybxshqzwirqfybdeukvq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuZ2plY3BpYnJjaW5jbGNlcGVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMTQwNjIsImV4cCI6MjA4ODU5MDA2Mn0.6Q2HjDOXJw1mNPNjlH9dFIEtZNrbXR6EaeKTRF9eDwU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCustomerService() {
  console.log('🔍 Testing Customer Service Database Connection...');
  
  try {
    // Test 1: Check if tickets table exists
    console.log('📋 Testing customer_service_tickets table...');
    const { data: tickets, error: ticketsError } = await supabase
      .from('customer_service_tickets')
      .select('id')
      .limit(1);
    
    if (ticketsError) {
      if (ticketsError.code === 'PGRST205') {
        console.log('❌ customer_service_tickets table does not exist');
        console.log('💡 Please run the SQL setup first (see CUSTOMER_SERVICE_SETUP.md)');
      } else {
        console.log('❌ Error accessing tickets table:', ticketsError.message);
      }
    } else {
      console.log('✅ customer_service_tickets table exists and is accessible');
    }
    
    // Test 2: Check if messages table exists
    console.log('📝 Testing customer_service_messages table...');
    const { data: messages, error: messagesError } = await supabase
      .from('customer_service_messages')
      .select('id')
      .limit(1);
    
    if (messagesError) {
      if (messagesError.code === 'PGRST205') {
        console.log('❌ customer_service_messages table does not exist');
        console.log('💡 Please run the SQL setup first (see CUSTOMER_SERVICE_SETUP.md)');
      } else {
        console.log('❌ Error accessing messages table:', messagesError.message);
      }
    } else {
      console.log('✅ customer_service_messages table exists and is accessible');
    }
    
    // Test 3: Check if functions exist (if tables exist)
    if (!ticketsError && !messagesError) {
      console.log('🔧 Testing database functions...');
      
      try {
        const { data: functionTest, error: functionError } = await supabase
          .rpc('generate_ticket_number');
        
        if (functionError) {
          console.log('❌ generate_ticket_number function not available:', functionError.message);
        } else {
          console.log('✅ generate_ticket_number function is working');
          console.log('🎫 Sample ticket number:', functionTest);
        }
      } catch (e) {
        console.log('❌ Function test failed:', e.message);
      }
    }
    
    // Test 4: Check overall connection
    console.log('🌐 Testing overall Supabase connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (connectionError) {
      console.log('❌ Supabase connection error:', connectionError.message);
    } else {
      console.log('✅ Supabase connection is working');
    }
    
    console.log('\n🎯 Summary:');
    if (ticketsError?.code === 'PGRST205' || messagesError?.code === 'PGRST205') {
      console.log('📝 ACTION REQUIRED: Database tables need to be created');
      console.log('📖 Please follow: CUSTOMER_SERVICE_SETUP.md');
    } else if (!ticketsError && !messagesError) {
      console.log('🎉 Customer service database is ready!');
      console.log('📱 You can use the customer service feature now');
    } else {
      console.log('⚠️ Some issues detected - check the errors above');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testCustomerService();
