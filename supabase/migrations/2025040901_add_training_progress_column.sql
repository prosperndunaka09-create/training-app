-- Add missing training_progress column to users table
-- This column is required by the auth-handler Edge Function and frontend

ALTER TABLE users ADD COLUMN IF NOT EXISTS training_progress INTEGER DEFAULT 0 CHECK (training_progress >= 0);

-- Add index for faster lookups on training_progress
CREATE INDEX IF NOT EXISTS idx_users_training_progress ON users(training_progress);

-- Verify column was added
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'users' AND column_name = 'training_progress') THEN
    RAISE NOTICE '✅ training_progress column added successfully';
  ELSE
    RAISE EXCEPTION '❌ Failed to add training_progress column';
  END IF;
END $$;
