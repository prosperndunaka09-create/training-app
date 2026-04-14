-- Add password column to users table if it doesn't exist
-- Run this in the databasepad.com project

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password TEXT;

-- Also add any other missing columns that the app expects
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS tasks_completed INTEGER DEFAULT 0;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS tasks_total INTEGER DEFAULT 45;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS referral_code TEXT;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS referred_by TEXT;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS training_completed BOOLEAN DEFAULT false;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS training_phase INTEGER DEFAULT 1;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS trigger_task_number INTEGER;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS has_pending_order BOOLEAN DEFAULT false;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS pending_amount DECIMAL DEFAULT 0;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_negative_balance BOOLEAN DEFAULT false;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profit_added BOOLEAN DEFAULT false;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create index on account_type for filtering
CREATE INDEX IF NOT EXISTS idx_users_account_type ON users(account_type);
