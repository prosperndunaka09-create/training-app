// Vercel Serverless Function for Telegram Webhook
// This receives messages from Telegram and saves them to the database

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
    const update = req.body;
    
    console.log('📩 WEBHOOK: Telegram update received:', JSON.stringify(update, null, 2));

    // Check if it's a message
    if (!update.message) {
      return res.status(200).json({ ok: true, message: 'No message in update' });
    }

    const message = update.message;
    const chatId = message.chat?.id?.toString();
    const text = message.text || '';
    const senderName = message.from?.first_name || message.from?.username || 'Telegram User';

    if (!chatId) {
      console.error('❌ WEBHOOK: No chat_id in message');
      return res.status(400).json({ error: 'No chat_id in message' });
    }

    console.log('📩 WEBHOOK: Processing message from chat:', chatId, 'Text:', text);

    // Initialize Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the conversation by chat_id or look for recent open conversations
    const { data: conversations, error: convError } = await supabase
      .from('customer_conversations')
      .select('*')
      .eq('telegram_chat_id', chatId.toString())
      .eq('status', 'open')
      .order('updated_at', { ascending: false })
      .limit(1);

    if (convError) {
      console.error('Error finding conversation:', convError);
      return res.status(500).json({ error: 'Database error' });
    }

    let conversationId;

    if (conversations && conversations.length > 0) {
      conversationId = conversations[0].id;
    } else {
      // Try to find any open conversation without a telegram_chat_id assigned
      const { data: openConvs, error: openError } = await supabase
        .from('customer_conversations')
        .select('*')
        .is('telegram_chat_id', null)
        .eq('status', 'open')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (openError) {
        console.error('Error finding open conversation:', openError);
      } else if (openConvs && openConvs.length > 0) {
        conversationId = openConvs[0].id;
        
        // Assign the chat_id to this conversation
        await supabase
          .from('customer_conversations')
          .update({ telegram_chat_id: chatId.toString() })
          .eq('id', conversationId);
      }
    }

    if (!conversationId) {
      // Create a new conversation for this Telegram chat
      const { data: newConv, error: createError } = await supabase
        .from('customer_conversations')
        .insert({
          user_id: 'telegram-' + chatId,
          username: senderName,
          telegram_chat_id: chatId.toString(),
          status: 'open'
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating conversation:', createError);
        return res.status(500).json({ error: 'Failed to create conversation' });
      }

      conversationId = newConv.id;
    }

    // Save the message from Telegram admin
    const { error: msgError } = await supabase
      .from('customer_messages')
      .insert({
        conversation_id: conversationId,
        sender_role: 'telegram_admin',
        message: text,
        source: 'telegram',
        created_at: new Date().toISOString()
      });

    if (msgError) {
      console.error('Error saving message:', msgError);
      return res.status(500).json({ error: 'Failed to save message' });
    }

    // Update conversation timestamp
    await supabase
      .from('customer_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    console.log('✅ WEBHOOK: Message saved successfully to conversation:', conversationId);
    
    return res.status(200).json({ 
      ok: true, 
      conversation_id: conversationId,
      message: 'Message saved successfully'
    });

  } catch (error) {
    console.error('❌ WEBHOOK: Unhandled error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
