// Server-side Telegram notification API route
// This function is server-side only and does not expose tokens to the frontend

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { message } = JSON.parse(event.body);

    if (!message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Message is required' })
      };
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      console.error('[Telegram] Missing environment variables: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Telegram configuration missing' })
      };
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    console.log('[Telegram] Sending message:', message);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Telegram] Failed to send message:', data);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to send Telegram message', details: data })
      };
    }

    console.log('[Telegram] Message sent successfully:', data.result?.message_id);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, messageId: data.result?.message_id })
    };

  } catch (error) {
    console.error('[Telegram] Exception:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error', message: error.message })
    };
  }
};
