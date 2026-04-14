// Diagnostic API to check Supabase connection and tables
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ 
      error: 'Missing environment variables',
      supabaseUrl: supabaseUrl ? 'Set' : 'Missing',
      supabaseServiceKey: supabaseServiceKey ? 'Set' : 'Missing'
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const results = {
    connection: 'Unknown',
    tables: {},
    errors: []
  };

  // Test connection
  try {
    const { data, error } = await supabase.from('customer_conversations').select('count', { count: 'exact' });
    if (error) {
      results.connection = 'Failed';
      results.errors.push(`customer_conversations: ${error.message}`);
    } else {
      results.connection = 'OK';
      results.tables.customer_conversations = 'Exists';
    }
  } catch (e) {
    results.connection = 'Failed';
    results.errors.push(`Connection error: ${e.message}`);
  }

  // Check customer_messages table
  try {
    const { data, error } = await supabase.from('customer_messages').select('count', { count: 'exact' });
    if (error) {
      results.tables.customer_messages = 'Missing or error';
      results.errors.push(`customer_messages: ${error.message}`);
    } else {
      results.tables.customer_messages = 'Exists';
    }
  } catch (e) {
    results.errors.push(`customer_messages check: ${e.message}`);
  }

  // Check recent conversations
  try {
    const { data, error } = await supabase
      .from('customer_conversations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) {
      results.errors.push(`Fetch conversations: ${error.message}`);
    } else {
      results.recentConversations = data?.length || 0;
      results.sampleConversation = data?.[0] || null;
    }
  } catch (e) {
    results.errors.push(`Fetch error: ${e.message}`);
  }

  return res.status(200).json(results);
}
