-- Fix for existing customer service tables
-- Run this if you get "cannot create index on relation" error

-- First, drop the views if they exist (they were created incorrectly)
DROP VIEW IF EXISTS customer_conversations CASCADE;
DROP VIEW IF EXISTS customer_messages CASCADE;
DROP VIEW IF EXISTS telegram_chat_mappings CASCADE;

-- Also drop tables if they exist (to start fresh)
DROP TABLE IF EXISTS telegram_chat_mappings CASCADE;
DROP TABLE IF EXISTS customer_messages CASCADE;
DROP TABLE IF EXISTS customer_conversations CASCADE;

-- ============================================
-- TABLE A: customer_conversations
-- ============================================
CREATE TABLE customer_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  phone TEXT,
  telegram_chat_id TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'pending')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_conversations_user_id ON customer_conversations(user_id);
CREATE INDEX idx_conversations_status ON customer_conversations(status);
CREATE INDEX idx_conversations_telegram_chat_id ON customer_conversations(telegram_chat_id);
CREATE INDEX idx_conversations_updated_at ON customer_conversations(updated_at DESC);

-- Enable RLS
ALTER TABLE customer_conversations ENABLE ROW LEVEL SECURITY;

-- Allow all operations
CREATE POLICY "Allow all operations" ON customer_conversations FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- TABLE B: customer_messages
-- ============================================
CREATE TABLE customer_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES customer_conversations(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('customer', 'admin', 'telegram_admin', 'system')),
  message TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('website', 'telegram', 'dashboard')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_messages_conversation_id ON customer_messages(conversation_id);
CREATE INDEX idx_messages_created_at ON customer_messages(created_at);
CREATE INDEX idx_messages_sender_role ON customer_messages(sender_role);

-- Enable RLS
ALTER TABLE customer_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations" ON customer_messages FOR ALL USING (true) WITH CHECK (true);

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

-- Trigger
CREATE TRIGGER trigger_update_conversation_timestamp
  AFTER INSERT ON customer_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- ============================================
-- TABLE C: telegram_chat_mappings
-- ============================================
CREATE TABLE telegram_chat_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES customer_conversations(id) ON DELETE CASCADE,
  telegram_chat_id TEXT NOT NULL,
  telegram_user_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_telegram_chat_id ON telegram_chat_mappings(telegram_chat_id);
CREATE INDEX idx_telegram_conversation_id ON telegram_chat_mappings(conversation_id);

ALTER TABLE telegram_chat_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations" ON telegram_chat_mappings FOR ALL USING (true) WITH CHECK (true);

-- Verify
SELECT 'customer_conversations' as table_name, COUNT(*) as count FROM customer_conversations
UNION ALL
SELECT 'customer_messages', COUNT(*) FROM customer_messages
UNION ALL
SELECT 'telegram_chat_mappings', COUNT(*) FROM telegram_chat_mappings;
