// Admin Customer Service API
// Provides authenticated admin access to customer conversations and messages using service role key

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
    // Get environment variables
    const env = req?.env || process.env;
    const supabaseUrl = env.SUPABASE_URL;
    const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: 'Missing Supabase configuration' });
    }

    // Create Supabase client with service role key (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch conversations
    const { data: conversations, error: convError } = await supabase
      .from('customer_conversations')
      .select('*')
      .order('updated_at', { ascending: false });

    if (convError) {
      console.error('Error fetching conversations:', convError);
      return res.status(500).json({ error: 'Failed to fetch conversations' });
    }

    // Process conversations with metadata
    const processedConversations = await Promise.all(
      (conversations || []).map(async (conv) => {
        try {
          // Get message count
          const { count } = await supabase
            .from('customer_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id);

          // Get last message
          const { data: lastMsg } = await supabase
            .from('customer_messages')
            .select('content, created_at')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            ...conv,
            unread_count: count || 0,
            last_message: lastMsg?.content || ''
          };
        } catch (err) {
          console.error('Error processing conversation:', conv.id, err);
          return {
            ...conv,
            unread_count: 0,
            last_message: ''
          };
        }
      })
    );

    console.log('📨 ADMIN API: Loaded', processedConversations.length, 'conversations');

    return res.status(200).json({
      conversations: processedConversations
    });
} catch (error) {
    console.error('🔥 FULL ERROR:', error);

    return res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
}  
