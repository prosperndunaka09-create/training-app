-- Add set completion timestamp columns to users table
-- These columns track when each training set was completed for proper display

ALTER TABLE users
ADD COLUMN IF NOT EXISTS set_1_completed_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS set_2_completed_at TIMESTAMP WITH TIME ZONE;

-- Add comments
COMMENT ON COLUMN users.set_1_completed_at IS 'Timestamp when Set 1 was completed';
COMMENT ON COLUMN users.set_2_completed_at IS 'Timestamp when Set 2 was completed';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_set_1_completed_at ON users(set_1_completed_at);
CREATE INDEX IF NOT EXISTS idx_users_set_2_completed_at ON users(set_2_completed_at);
