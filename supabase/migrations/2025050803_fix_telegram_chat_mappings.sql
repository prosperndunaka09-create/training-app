-- Fix telegram_chat_mappings table schema
-- This migration fixes the issue where chat_id column is missing

-- Check if chat_id column exists, if not add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'telegram_chat_mappings' 
    AND column_name = 'chat_id'
  ) THEN
    ALTER TABLE telegram_chat_mappings ADD COLUMN chat_id TEXT;
  END IF;
END $$;

-- Add unique constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'telegram_chat_mappings_chat_id_key'
    AND table_name = 'telegram_chat_mappings'
  ) THEN
    ALTER TABLE telegram_chat_mappings ADD CONSTRAINT telegram_chat_mappings_chat_id_key UNIQUE (chat_id);
  END IF;
END $$;

-- Create indexes if not exist
CREATE INDEX IF NOT EXISTS idx_telegram_chat_mappings_chat_id ON telegram_chat_mappings(chat_id);

-- Only create ticket_id index if column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'telegram_chat_mappings' AND column_name = 'ticket_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_telegram_chat_mappings_ticket_id ON telegram_chat_mappings(ticket_id);
    END IF;
END $$;
