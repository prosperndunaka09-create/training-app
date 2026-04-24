// Admin Customer Service Messages API
// Provides authenticated admin access to customer messages using service role key

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get conversation ID from query
    const { conversationId } = req.query;

    if (!conversationId) {
      console.error('ADMIN MESSAGES ERROR: Missing conversationId');
      return res.status(400).json({ error: 'Missing conversationId' });
    }

    // Validate conversationId is a valid UUID
    if (typeof conversationId !== 'string' || conversationId.length < 10) {
      console.error('ADMIN MESSAGES ERROR: Invalid conversationId format:', conversationId);
      return res.status(400).json({ error: 'Invalid conversationId format' });
    }

    // Get environment variables
    const env = req?.env || process.env;
    const supabaseUrl = env.VITE_SUPABASE_URL;
    const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('ADMIN MESSAGES ERROR: Missing Supabase configuration');
      return res.status(500).json({ error: 'Missing Supabase configuration' });
    }

    // Create Supabase client with service role key (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch messages
    const { data: messages, error } = await supabase
      .from('customer_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('ADMIN MESSAGES ERROR: Supabase query failed:', error);
      return res.status(500).json({ error: 'Failed to fetch messages', details: error.message });
    }

    console.log('📨 ADMIN API: Loaded', messages?.length || 0, 'messages for conversation:', conversationId);

    return res.status(200).json({
      messages: messages || []
    });
  } catch (error) {
    console.error('ADMIN MESSAGES ERROR: Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
