// Test Telegram Notification
// Call this endpoint to verify Telegram notifications are working
// Usage: GET /api/test-telegram

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

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.error('[Test Telegram] Missing environment variables');
    return res.status(500).json({ 
      error: 'Telegram configuration missing',
      hasToken: !!token,
      hasChatId: !!chatId
    });
  }

  const testMessage = `🧪 <b>Telegram Notification Test</b>\n\n` +
    `✅ This is a test notification from your app.\n` +
    `📅 Timestamp: ${new Date().toISOString()}\n` +
    `🌐 Environment: ${process.env.NODE_ENV || 'development'}\n\n` +
    `If you received this, Telegram notifications are working correctly!`;

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: testMessage,
          parse_mode: 'HTML',
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error('[Test Telegram] Failed to send notification:', result);
      return res.status(500).json({ 
        error: 'Failed to send Telegram notification',
        details: result 
      });
    }

    console.log('[Test Telegram] Notification sent successfully:', result);
    return res.status(200).json({ 
      success: true,
      message: 'Test notification sent successfully',
      telegramResponse: result
    });

  } catch (error) {
    console.error('[Test Telegram] Exception:', error);
    return res.status(500).json({ 
      error: 'Exception sending notification',
      details: error.message 
    });
  }
}
