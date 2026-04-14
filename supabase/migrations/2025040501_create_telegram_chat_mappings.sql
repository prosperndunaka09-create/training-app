-- Create table to map Telegram chat IDs to tickets
CREATE TABLE IF NOT EXISTS telegram_chat_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id TEXT NOT NULL,
  ticket_id UUID NOT NULL REFERENCES customer_service_tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(chat_id)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_telegram_chat_mappings_chat_id ON telegram_chat_mappings(chat_id);
CREATE INDEX IF NOT EXISTS idx_telegram_chat_mappings_ticket_id ON telegram_chat_mappings(ticket_id);

-- Enable RLS
ALTER TABLE telegram_chat_mappings ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage mappings
CREATE POLICY "Service role can manage chat mappings"
  ON telegram_chat_mappings
  USING (true)
  WITH CHECK (true);

-- Allow users to view their own mappings
CREATE POLICY "Users can view own chat mappings"
  ON telegram_chat_mappings
  FOR SELECT
  USING (user_id = auth.uid());
