-- Add missing columns to training_accounts table for proper training account initialization
-- These columns are needed for balance tracking, task progress, and Phase 2 checkpoint logic

ALTER TABLE training_accounts
ADD COLUMN IF NOT EXISTS amount NUMERIC DEFAULT 1100.00;

ALTER TABLE training_accounts
ADD COLUMN IF NOT EXISTS commission NUMERIC DEFAULT 0;

ALTER TABLE training_accounts
ADD COLUMN IF NOT EXISTS task_number INTEGER DEFAULT 1;

ALTER TABLE training_accounts
ADD COLUMN IF NOT EXISTS product_name TEXT;

ALTER TABLE training_accounts
ADD COLUMN IF NOT EXISTS referral_code TEXT;

ALTER TABLE training_accounts
ADD COLUMN IF NOT EXISTS referred_by UUID;

ALTER TABLE training_accounts
ADD COLUMN IF NOT EXISTS training_phase INTEGER DEFAULT 1;

-- Add comments
COMMENT ON COLUMN training_accounts.amount IS 'Training account balance (default $1100.00)';
COMMENT ON COLUMN training_accounts.commission IS 'Commission earned from tasks';
COMMENT ON COLUMN training_accounts.task_number IS 'Current task number (next task to complete)';
COMMENT ON COLUMN training_accounts.product_name IS 'Current product being worked on';
COMMENT ON COLUMN training_accounts.referral_code IS 'Training account referral code for tracking';
COMMENT ON COLUMN training_accounts.referred_by IS 'User ID who referred this training account';
COMMENT ON COLUMN training_accounts.training_phase IS 'Training phase (1 or 2)';
