// Telegram Bot Configuration
// Bot tokens are now handled securely via Supabase Edge Functions
// Frontend no longer has access to bot tokens

export const TELEGRAM_CONFIG = {
  // Support link for users
  SUPPORT_LINK: 'https://t.me/EARNINGSLLCONLINECS1'
};

// Test function to check if primary bot is configured (now handled by Edge Function)
export const isTelegramConfigured = () => {
  // Bot configuration is now handled by Supabase Edge Function
  // This function is kept for backward compatibility
  return true;
};

// Test function to check if CS bot is configured (now handled by Edge Function)
export const isCSBotConfigured = () => {
  // Bot configuration is now handled by Supabase Edge Function
  // This function is kept for backward compatibility
  return true;
};
