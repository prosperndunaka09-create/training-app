// Telegram Bot Configuration
// Real bot credentials for active notifications

export const TELEGRAM_CONFIG = {
  // Primary Bot (for user registration, pending issues) - Optimize Tasks Bot
  BOT_TOKEN: '7578832675:AAHUf8pGIgBMlgFfJlBSQBoMokJO3v_Vl3o',
  CHAT_ID: '7683177085',
  
  // Customer Service Bot (for online CS interactions) - ONLINE CUSTOMER Optimize Tasks Bot
  CS_BOT_TOKEN: '8513756424:AAGvKY6eJK8ANfqC2S-5z0LlXM-YDRGbmaA',
  CS_CHAT_ID: '7683177085',
  
  // Support link for users
  SUPPORT_LINK: 'https://t.me/EARNINGSLLCONLINECS1'
};

// Test function to check if primary bot is configured
export const isTelegramConfigured = () => {
  return TELEGRAM_CONFIG.BOT_TOKEN !== 'YOUR_BOT_TOKEN_HERE' && 
         TELEGRAM_CONFIG.CHAT_ID !== 'YOUR_CHAT_ID_HERE';
};

// Test function to check if CS bot is configured
export const isCSBotConfigured = () => {
  return TELEGRAM_CONFIG.CS_BOT_TOKEN !== 'YOUR_CS_BOT_TOKEN_HERE' && 
         TELEGRAM_CONFIG.CS_CHAT_ID !== 'YOUR_CS_CHAT_ID_HERE';
};
