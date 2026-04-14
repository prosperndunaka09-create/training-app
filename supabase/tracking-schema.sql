-- Enhanced Database Schema for User Tracking
-- Add tracking tables to connect registered users with training accounts

-- Training Requests Table (track who needs training)
CREATE TABLE IF NOT EXISTS training_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL,
  user_display_name VARCHAR(255) NOT NULL,
  user_referral_code VARCHAR(20) NOT NULL,
  user_phone VARCHAR(20),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'completed')),
  training_account_email VARCHAR(255),
  training_password VARCHAR(255),
  assigned_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- User Training Mapping Table (connect users to their training)
CREATE TABLE IF NOT EXISTS user_training_mapping (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  training_account_email VARCHAR(255) NOT NULL,
  training_password VARCHAR(255) NOT NULL,
  assigned_by VARCHAR(255) DEFAULT 'admin@optimize.com',
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'suspended')),
  UNIQUE(user_id, training_account_email)
);

-- Update training_accounts table to include user reference
ALTER TABLE training_accounts ADD COLUMN IF NOT EXISTS user_referral_code VARCHAR(20);
ALTER TABLE training_accounts ADD COLUMN IF NOT EXISTS user_email VARCHAR(255);
ALTER TABLE training_accounts ADD COLUMN IF NOT EXISTS assigned_to_referral_code VARCHAR(20);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_training_requests_user_email ON training_requests(user_email);
CREATE INDEX IF NOT EXISTS idx_training_requests_status ON training_requests(status);
CREATE INDEX IF NOT EXISTS idx_user_training_mapping_user_id ON user_training_mapping(user_id);
CREATE INDEX IF NOT EXISTS idx_training_accounts_user_referral_code ON training_accounts(user_referral_code);

-- Row Level Security for new tables
ALTER TABLE training_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_training_mapping ENABLE ROW LEVEL SECURITY;

-- Policies for training requests
CREATE POLICY "Admin full access training requests" ON training_requests FOR ALL USING (
  auth.jwt() ->> 'email' = 'admin@optimize.com'
);

-- Policies for user training mapping
CREATE POLICY "Admin full access user training mapping" ON user_training_mapping FOR ALL USING (
  auth.jwt() ->> 'email' = 'admin@optimize.com'
);

-- Update existing training_accounts policy
CREATE POLICY "Admin full access training accounts updated" ON training_accounts FOR ALL USING (
  auth.jwt() ->> 'email' = 'admin@optimize.com'
);
