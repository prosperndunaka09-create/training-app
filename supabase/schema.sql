-- Optimize Tasks Platform Database Schema
-- Run these SQL commands in Supabase SQL Editor

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255),
  phone VARCHAR(20),
  display_name VARCHAR(255) NOT NULL,
  vip_level INTEGER DEFAULT 1 CHECK (vip_level IN (1, 2)),
  balance DECIMAL(10,2) DEFAULT 0.00,
  total_earned DECIMAL(10,2) DEFAULT 0.00,
  referral_code VARCHAR(20) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  account_type VARCHAR(20) DEFAULT 'personal' CHECK (account_type IN ('personal', 'training')),
  user_status VARCHAR(20) DEFAULT 'registered' CHECK (user_status IN ('registered', 'active', 'suspended')),
  training_completed BOOLEAN DEFAULT FALSE,
  training_progress INTEGER DEFAULT 0,
  training_phase INTEGER DEFAULT 1 CHECK (training_phase IN (1, 2)),
  tasks_completed INTEGER DEFAULT 0,
  trigger_task_number INTEGER,
  has_pending_order BOOLEAN DEFAULT FALSE,
  pending_amount DECIMAL(10,2) DEFAULT 0.00,
  is_negative_balance BOOLEAN DEFAULT FALSE,
  profit_added BOOLEAN DEFAULT FALSE
);

-- Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  task_number INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'locked' CHECK (status IN ('locked', 'pending', 'completed')),
  reward DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, task_number)
);

-- Wallets Table
CREATE TABLE IF NOT EXISTS wallets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  wallet_type VARCHAR(50) NOT NULL,
  address VARCHAR(255) NOT NULL,
  network VARCHAR(50) NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, address)
);

-- Withdrawals Table
CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  wallet_address VARCHAR(255) NOT NULL,
  network VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  tx_hash VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'task_reward', 'bonus')),
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Training Accounts Table (for admin management)
CREATE TABLE IF NOT EXISTS training_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  assigned_to VARCHAR(255),
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'suspended'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users can view own tasks" ON tasks FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own tasks" ON tasks FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own wallets" ON wallets FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can manage own wallets" ON wallets FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own withdrawals" ON withdrawals FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can create own withdrawals" ON withdrawals FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (auth.uid()::text = user_id::text);

-- Admin policies (for admin@optimize.com)
CREATE POLICY "Admin full access users" ON users FOR ALL USING (
  auth.jwt() ->> 'email' = 'admin@optimize.com'
);
CREATE POLICY "Admin full access tasks" ON tasks FOR ALL USING (
  auth.jwt() ->> 'email' = 'admin@optimize.com'
);
CREATE POLICY "Admin full access wallets" ON wallets FOR ALL USING (
  auth.jwt() ->> 'email' = 'admin@optimize.com'
);
CREATE POLICY "Admin full access withdrawals" ON withdrawals FOR ALL USING (
  auth.jwt() ->> 'email' = 'admin@optimize.com'
);
CREATE POLICY "Admin full access transactions" ON transactions FOR ALL USING (
  auth.jwt() ->> 'email' = 'admin@optimize.com'
);
CREATE POLICY "Admin full access training accounts" ON training_accounts FOR ALL USING (
  auth.jwt() ->> 'email' = 'admin@optimize.com'
);
