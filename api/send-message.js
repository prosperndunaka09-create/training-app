// Vercel Serverless Function for Sending Customer Service Messages
// This receives messages from the website form and sends to Telegram
// Falls back to in-memory storage if database is unavailable
// Version: 2.2 - Improved Supabase error handling and logging

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8513756424:AAGvKY6eJK8ANfqC2S-5z0LlXM-YDRGbmaA';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '7683177085';

// In-memory storage for when database is unavailable
const conversationStore = new Map();

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

  console.log('📩 API: Starting message processing...');
  console.log('📩 API: Supabase URL exists:', !!supabaseUrl);
  console.log('📩 API: Supabase Service Key exists:', !!supabaseServiceKey);

  try {
    const { name, phone, message, userId, username } = req.body;
    
    console.log('📩 API: Received message request:', { name, phone, messageLength: message?.length, userId, username });

    // Validate required fields
    if (!name || !message) {
      console.error('❌ API: Missing required fields');
      return res.status(400).json({ error: 'Missing required fields: name and message are required' });
    }

    // Generate a unique user ID if not provided
    const finalUserId = userId || `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const finalUsername = username || name || 'Guest User';

    let conversationId;
    let useDatabase = false;

    // Try to use Supabase if configured
    if (supabaseUrl && supabaseServiceKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        console.log('🔍 API: Checking for existing open conversation for user:', finalUserId);

        // Step 1: Find existing open conversation for this user
        const { data: existingConvs, error: findError } = await supabase
          .from('customer_conversations')
          .select('*')
          .eq('user_id', finalUserId)
          .eq('status', 'open')
          .order('updated_at', { ascending: false })
          .limit(1);

        if (findError) {
          console.error('❌ API: Database FIND error:', findError.message, findError.details, findError.hint);
        } else if (existingConvs && existingConvs.length > 0) {
          conversationId = existingConvs[0].id;
          useDatabase = true;
          console.log('✅ API: Found existing conversation:', conversationId);
        } else {
          console.log('🔍 API: No existing conversation found, creating new one...');
          
          // Create new conversation in database
          const { data: newConv, error: createError } = await supabase
            .from('customer_conversations')
            .insert({
              user_id: finalUserId,
              username: finalUsername,
              phone: phone || null,
              status: 'open',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();

          if (createError) {
            console.error('❌ API: Database CREATE error:', createError.message, createError.details, createError.hint);
          } else if (newConv) {
            conversationId = newConv.id;
            useDatabase = true;
            console.log('✅ API: Created new conversation:', conversationId);
          }
        }

        // Save message to database if we have a conversation
        if (useDatabase && conversationId) {
          console.log('💾 API: Saving message to database...');
          const { error: msgError } = await supabase
            .from('customer_messages')
            .insert({
              conversation_id: conversationId,
              sender_role: 'customer',
              message: message,
              source: 'website',
              created_at: new Date().toISOString(),
              read_at: null
            });

          if (msgError) {
            console.error('❌ API: Database INSERT error:', msgError.message, msgError.details, msgError.hint);
            useDatabase = false;
          } else {
            // Update conversation timestamp
            await supabase
              .from('customer_conversations')
              .update({ updated_at: new Date().toISOString() })
              .eq('id', conversationId);
            console.log('✅ API: Message saved to database successfully');
          }
        }
      } catch (dbError) {
        console.error('❌ API: Database connection error:', dbError.message, dbError.stack);
        useDatabase = false;
      }
    } else {
      console.log('⚠️ API: Supabase not configured');
    }

    // Fallback to in-memory storage if database didn't work
    if (!conversationId) {
      console.log('💾 API: Using in-memory storage as fallback');
      // Check for existing conversation in memory
      const existingConv = conversationStore.get(finalUserId);
      if (existingConv && existingConv.status === 'open') {
        conversationId = existingConv.id;
        existingConv.messages.push({
          id: `msg-${Date.now()}`,
          sender_role: 'customer',
          message: message,
          source: 'website',
          created_at: new Date().toISOString()
        });
        existingConv.updated_at = new Date().toISOString();
        console.log('💾 API: Message saved to in-memory conversation:', conversationId);
      } else {
        // Create new in-memory conversation
        conversationId = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        conversationStore.set(finalUserId, {
          id: conversationId,
          user_id: finalUserId,
          username: finalUsername,
          phone: phone || null,
          status: 'open',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          messages: [{
            id: `msg-${Date.now()}`,
            sender_role: 'customer',
            message: message,
            source: 'website',
            created_at: new Date().toISOString()
          }]
        });
        console.log('✅ API: Created in-memory conversation:', conversationId);
      }
    }

    // ALWAYS send to Telegram
    console.log('📤 API: Sending notification to Telegram');
    
    try {
      const telegramResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: `🆕 NEW CUSTOMER MESSAGE\n\n👤 Name: ${name}\n📞 Phone: ${phone || 'Not provided'}\n🆔 User ID: ${finalUserId}\n💬 Message:\n${message}\n\n📝 Conversation ID: ${conversationId}\n📊 Storage: ${useDatabase ? 'Database' : 'In-Memory'}`,
          parse_mode: 'HTML'
        })
      });

      const telegramResult = await telegramResponse.json();
      
      if (telegramResult.ok) {
        console.log('✅ API: Telegram notification sent successfully');
      } else {
        console.error('❌ API: Telegram API error:', telegramResult);
      }
    } catch (telegramError) {
      console.error('❌ API: Error sending to Telegram:', telegramError);
    }

    console.log('✅ API: Message processed successfully - Database:', useDatabase);
    
    // Return success with storage info
    return res.status(200).json({ 
      success: true, 
      conversation_id: conversationId,
      user_id: finalUserId,
      storage: useDatabase ? 'database' : 'in-memory',
      message: 'Message sent successfully - Our team will reply via Telegram at @EARNINGSLLCONLINECS1',
      version: '2.2'
    });

  } catch (error) {
    console.error('❌ API: Unhandled error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}
