-- Customer Service System Migration
-- Creates tables for conversations and messages

-- ============================================
-- TABLE A: customer_conversations
-- ============================================
CREATE TABLE IF NOT EXISTS customer_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  telegram_chat_id TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'pending')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON customer_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON customer_conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_telegram_chat_id ON customer_conversations(telegram_chat_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON customer_conversations(updated_at DESC);

-- Enable RLS
ALTER TABLE customer_conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own conversations"
  ON customer_conversations
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own conversations"
  ON customer_conversations
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all conversations"
  ON customer_conversations
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- ============================================
-- TABLE B: customer_messages
-- ============================================
CREATE TABLE IF NOT EXISTS customer_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES customer_conversations(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('customer', 'admin', 'telegram_admin', 'system')),
  message TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('website', 'telegram', 'dashboard')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON customer_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON customer_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender_role ON customer_messages(sender_role);

-- Enable RLS
ALTER TABLE customer_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view messages in their conversations"
  ON customer_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM customer_conversations c
      WHERE c.id = customer_messages.conversation_id
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their conversations"
  ON customer_messages
  FOR INSERT
  WITH CHECK (
    sender_role = 'customer' AND
    EXISTS (
      SELECT 1 FROM customer_conversations c
      WHERE c.id = customer_messages.conversation_id
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all messages"
  ON customer_messages
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- ============================================
-- FUNCTION: Update conversation timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE customer_conversations
  SET updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update conversation timestamp
DROP TRIGGER IF EXISTS trigger_update_conversation_timestamp ON customer_messages;
CREATE TRIGGER trigger_update_conversation_timestamp
  AFTER INSERT ON customer_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- ============================================
-- FUNCTION: Get unread message count
-- ============================================
CREATE OR REPLACE FUNCTION get_unread_count(conv_id UUID)
RETURNS INTEGER AS $$
DECLARE
  count_result INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_result
  FROM customer_messages
  WHERE conversation_id = conv_id
    AND sender_role != 'customer'
    AND read_at IS NULL;
  RETURN count_result;
END;
$$ LANGUAGE plpgsql;
