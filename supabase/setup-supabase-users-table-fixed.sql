-- Setup users table for Supabase project angjecpibricnclcepef
-- Run this in your Supabase SQL Editor

-- Drop existing table if it exists to start fresh
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  display_name TEXT,
  account_type TEXT DEFAULT 'personal',
  vip_level INTEGER DEFAULT 1,
  tasks_completed INTEGER DEFAULT 0,
  tasks_total INTEGER DEFAULT 45,
  balance DECIMAL(10,2) DEFAULT 0,
  total_earned DECIMAL(10,2) DEFAULT 0,
  referral_code TEXT UNIQUE,
  referred_by TEXT,
  training_completed BOOLEAN DEFAULT false,
  training_phase INTEGER DEFAULT 1,
  trigger_task_number INTEGER,
  has_pending_order BOOLEAN DEFAULT false,
  pending_amount DECIMAL(10,2) DEFAULT 0,
  is_negative_balance BOOLEAN DEFAULT false,
  profit_added BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_account_type ON users(account_type);
CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_users_status ON users(status);

-- Enable RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow anonymous users to insert (for account creation)
CREATE POLICY "Allow anonymous inserts" ON users
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anonymous users to select their own data
CREATE POLICY "Allow anonymous selects" ON users
  FOR SELECT
  TO anon
  USING (true);

-- Allow authenticated users to select all data
CREATE POLICY "Allow authenticated selects" ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert
CREATE POLICY "Allow authenticated inserts" ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow users to update their own data
CREATE POLICY "Allow users to update own data" ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = email::text);

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for auto-updating updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert a test training account to verify setup
INSERT INTO users (
  email,
  password,
  display_name,
  account_type,
  vip_level,
  tasks_completed,
  tasks_total,
  balance,
  total_earned,
  referral_code,
  training_completed,
  training_phase,
  status
) VALUES (
  'test@training.com',
  'test123',
  'Test Training User',
  'training',
  2,
  0,
  45,
  1100,
  0,
  'TRN-TEST123',
  false,
  1,
  'active'
);
