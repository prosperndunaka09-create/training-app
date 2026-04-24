// Admin Customer Service Delete Conversation API
// Provides authenticated admin ability to delete conversations using service role key

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { conversationId } = req.body;

    if (!conversationId) {
      return res.status(400).json({ error: 'Missing conversationId' });
    }

    // Get environment variables
    const env = req?.env || process.env;
    const supabaseUrl = env.VITE_SUPABASE_URL;
    const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: 'Missing Supabase configuration' });
    }

    // Create Supabase client with service role key (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // First delete all messages in the conversation
    const { error: msgError } = await supabase
      .from('customer_messages')
      .delete()
      .eq('conversation_id', conversationId);

    if (msgError) {
      console.error('Error deleting messages:', msgError);
      return res.status(500).json({ error: 'Failed to delete conversation messages' });
    }

    // Then delete the conversation
    const { error } = await supabase
      .from('customer_conversations')
      .delete()
      .eq('id', conversationId);

    if (error) {
      console.error('Error deleting conversation:', error);
      return res.status(500).json({ error: 'Failed to delete conversation' });
    }

    console.log('💾 ADMIN API: Conversation deleted:', conversationId);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error in admin-customer-service-delete API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
