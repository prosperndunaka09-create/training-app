-- Add auth_user_id column to training_accounts table
-- This column stores the Supabase Auth user ID for training accounts
-- allowing them to login using Supabase authentication

ALTER TABLE training_accounts
ADD COLUMN IF NOT EXISTS auth_user_id UUID;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_training_accounts_auth_user_id 
ON training_accounts(auth_user_id);

-- Add comment
COMMENT ON COLUMN training_accounts.auth_user_id IS 'Supabase Auth user ID for training account login';
