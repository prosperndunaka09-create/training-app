import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
// Admin Customer Service Reply API
// Provides authenticated admin ability to send replies using service role key

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { conversationId, userId, content } = req.body;

    console.log('📤 API RECEIVED:', { conversationId, userId, contentLength: content?.length });

    if (!conversationId || !userId || !content) {
      console.error('❌ Missing fields:', { conversationId, userId, content });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get environment variables
    const supabaseUrl = process.env.SUPABASE_URL;  
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    console.log('SUPABASE URL:', supabaseUrl);
console.log('SUPABASE KEY EXISTS:', !!supabaseServiceKey);
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing env vars:', { supabaseUrl: !!supabaseUrl, supabaseServiceKey: !!supabaseServiceKey });
      return res.status(500).json({ error: 'Missing Supabase configuration' });
    }

    // Create Supabase client with service role key (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('💾 Attempting to insert into customer_messages...');

    // Save to database
    const { data, error } = await supabase
  .from('customer_messages')
  .insert([
    {
      conversation_id: conversationId,
      user_id: userId,
      content: content,
      is_admin: true
    }
  ])
  .select();

   if (error) {
  console.error('SUPABASE INSERT ERROR:', error);
  return res.status(500).json({
    error: 'Failed to send message',
    details: error.message,
    code: error.code,
    hint: error.hint
  });
} 

    console.log('✅ ADMIN API: Reply saved successfully', { data });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('❌ Catch Error in admin-customer-service-reply API:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
}
