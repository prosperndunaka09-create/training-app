// Telegram Bot Edge Function
// Sends notifications to Telegram for platform events

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const TELEGRAM_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID');

serve(async (req) => {
  // Enable CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  try {
    // Validate environment variables
    if (!TELEGRAM_BOT_TOKEN) {
      console.error('[telegram-bot] TELEGRAM_BOT_TOKEN environment variable is missing');
      return new Response(
        JSON.stringify({ error: 'Telegram bot token missing' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!TELEGRAM_CHAT_ID) {
      console.error('[telegram-bot] TELEGRAM_CHAT_ID environment variable is missing');
      return new Response(
        JSON.stringify({ error: 'Telegram chat ID missing' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { message } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Send message to Telegram
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'Markdown',
        }),
      }
    );

    const result = await telegramResponse.json();

    if (!result.ok) {
      console.error('Telegram API error:', result);
      return new Response(
        JSON.stringify({ error: 'Failed to send Telegram message', details: result }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Notification sent' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in telegram-bot function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
