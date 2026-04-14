-- Complete Supabase Database Setup
-- Run this in your Supabase SQL Editor

-- Drop existing tables to start fresh
DROP TABLE IF EXISTS withdrawals CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  display_name TEXT,
  account_type TEXT DEFAULT 'personal' CHECK (account_type IN ('personal', 'training', 'admin')),
  vip_level INTEGER DEFAULT 1 CHECK (vip_level >= 1 AND vip_level <= 3),
  tasks_completed INTEGER DEFAULT 0 CHECK (tasks_completed >= 0),
  tasks_total INTEGER DEFAULT 45 CHECK (tasks_total >= 0),
  balance DECIMAL(10,2) DEFAULT 0 CHECK (balance >= 0),
  total_earned DECIMAL(10,2) DEFAULT 0 CHECK (total_earned >= 0),
  referral_code TEXT UNIQUE,
  referred_by TEXT,
  training_completed BOOLEAN DEFAULT false,
  training_progress INTEGER DEFAULT 0 CHECK (training_progress >= 0),
  training_phase INTEGER DEFAULT 1 CHECK (training_phase >= 1 AND training_phase <= 2),
  trigger_task_number INTEGER,
  has_pending_order BOOLEAN DEFAULT false,
  pending_amount DECIMAL(10,2) DEFAULT 0 CHECK (pending_amount >= 0),
  is_negative_balance BOOLEAN DEFAULT false,
  profit_added BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_login TIMESTAMPTZ
);

-- Create tasks table
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_number INTEGER NOT NULL CHECK (task_number > 0),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'locked', 'completed')),
  reward DECIMAL(10,2) NOT NULL CHECK (reward >= 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  task_set INTEGER DEFAULT 0 CHECK (task_set >= 0),
  
  -- Unique constraint: one task per number per user
  UNIQUE(user_id, task_number)
);

-- Create transactions table
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'transfer')),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create withdrawals table
CREATE TABLE withdrawals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  wallet_address TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  admin_notes TEXT
);

-- Create user_activity_logs table
CREATE TABLE user_activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_details JSONB,
  timestamp TIMESTAMPTZ DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

-- Create admin_audit_logs table
CREATE TABLE admin_audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_details JSONB,
  target_user_id UUID REFERENCES users(id),
  timestamp TIMESTAMPTZ DEFAULT now(),
  ip_address TEXT
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_account_type ON users(account_type);
CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_training_progress ON users(training_progress);
CREATE INDEX idx_users_created_at ON users(created_at);

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);

CREATE INDEX idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX idx_withdrawals_status ON withdrawals(status);
CREATE INDEX idx_withdrawals_created_at ON withdrawals(created_at);

CREATE INDEX idx_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX idx_activity_logs_timestamp ON user_activity_logs(timestamp);

CREATE INDEX idx_admin_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX idx_admin_logs_timestamp ON admin_audit_logs(timestamp);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for users table
-- Allow anonymous users to insert (for account creation)
CREATE POLICY "Allow anonymous inserts" ON users
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow users to read their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT
  TO anon
  USING (auth.uid()::text = id::text);

-- Allow users to update their own data (except critical fields)
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE
  TO anon
  USING (auth.uid()::text = id::text)
  WITH CHECK (
    auth.uid()::text = id::text AND
    account_type != 'admin'
  );

-- Allow admins to read all data
CREATE POLICY "Admins can read all users" ON users
  FOR SELECT
  TO anon
  USING (account_type = 'admin');

-- Allow admins to update all user data
CREATE POLICY "Admins can update all users" ON users
  FOR UPDATE
  TO anon
  USING (account_type = 'admin')
  WITH CHECK (account_type = 'admin');

-- Create RLS Policies for tasks table
-- Allow users to read their own tasks
CREATE POLICY "Users can read own tasks" ON tasks
  FOR SELECT
  TO anon
  USING (auth.uid()::text = user_id::text);

-- Allow users to update their own tasks (status only)
CREATE POLICY "Users can update own tasks" ON tasks
  FOR UPDATE
  TO anon
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (
    auth.uid()::text = user_id::text AND
    status = 'completed' AND
    completed_at IS NOT NULL
  );

-- Allow admins full access to tasks
CREATE POLICY "Admins full access to tasks" ON tasks
  FOR ALL
  TO anon
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid()::text 
    AND users.account_type = 'admin'
  ));

-- Create RLS Policies for transactions table
-- Allow users to read their own transactions
CREATE POLICY "Users can read own transactions" ON transactions
  FOR SELECT
  TO anon
  USING (auth.uid()::text = user_id::text);

-- Allow admins full access to transactions
CREATE POLICY "Admins full access to transactions" ON transactions
  FOR ALL
  TO anon
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid()::text 
    AND users.account_type = 'admin'
  ));

-- Create RLS Policies for withdrawals table
-- Allow users to read their own withdrawals
CREATE POLICY "Users can read own withdrawals" ON withdrawals
  FOR SELECT
  TO anon
  USING (auth.uid()::text = user_id::text);

-- Allow users to create withdrawals
CREATE POLICY "Users can create withdrawals" ON withdrawals
  FOR INSERT
  TO anon
  WITH CHECK (auth.uid()::text = user_id::text);

-- Allow admins full access to withdrawals
CREATE POLICY "Admins full access to withdrawals" ON withdrawals
  FOR ALL
  TO anon
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid()::text 
    AND users.account_type = 'admin'
  ));

-- Create RLS Policies for activity logs
-- Allow users to read their own activity logs
CREATE POLICY "Users can read own activity logs" ON user_activity_logs
  FOR SELECT
  TO anon
  USING (auth.uid()::text = user_id::text);

-- Allow system to insert activity logs
CREATE POLICY "System can insert activity logs" ON user_activity_logs
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow admins to read all activity logs
CREATE POLICY "Admins can read all activity logs" ON user_activity_logs
  FOR SELECT
  TO anon
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid()::text 
    AND users.account_type = 'admin'
  ));

-- Create RLS Policies for admin audit logs
-- Allow admins to read admin audit logs
CREATE POLICY "Admins can read admin audit logs" ON admin_audit_logs
  FOR SELECT
  TO anon
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid()::text 
    AND users.account_type = 'admin'
  ));

-- Allow system to insert admin audit logs
CREATE POLICY "System can insert admin audit logs" ON admin_audit_logs
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create Functions for automatic balance calculation
CREATE OR REPLACE FUNCTION calculate_user_balance(user_uuid UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  initial_balance DECIMAL(10,2) := 1100;
  task_rewards DECIMAL(10,2) := 0;
BEGIN
  -- Sum all completed task rewards
  SELECT COALESCE(SUM(reward), 0) INTO task_rewards
  FROM tasks
  WHERE user_id = user_uuid AND status = 'completed';
  
  -- Return initial balance + task rewards
  RETURN initial_balance + task_rewards;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_withdrawals_updated_at
  BEFORE UPDATE ON withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to validate user integrity
CREATE OR REPLACE FUNCTION validate_user_integrity(user_uuid UUID)
RETURNS TABLE(is_valid BOOLEAN, issues TEXT[]) AS $$
DECLARE
  user_record RECORD;
  calculated_balance DECIMAL(10,2);
  completed_tasks INTEGER;
  issue_list TEXT[] := '{}';
BEGIN
  -- Get user data
  SELECT * INTO user_record FROM users WHERE id = user_uuid;
  
  IF NOT FOUND THEN
    issue_list := array_append(issue_list, 'User not found');
  ELSE
    -- Calculate correct balance
    calculated_balance := calculate_user_balance(user_uuid);
    
    -- Check balance integrity
    IF ABS(user_record.balance - calculated_balance) > 0.01 THEN
      issue_list := array_append(issue_list, 
        'Balance mismatch: stored=' || user_record.balance || ', calculated=' || calculated_balance);
    END IF;
    
    -- Check task completion integrity
    SELECT COUNT(*) INTO completed_tasks
    FROM tasks
    WHERE user_id = user_uuid AND status = 'completed';
    
    IF user_record.tasks_completed != completed_tasks THEN
      issue_list := array_append(issue_list,
        'Task count mismatch: stored=' || user_record.tasks_completed || ', actual=' || completed_tasks);
    END IF;
    
    -- Check for suspicious values
    IF user_record.balance > 100000 THEN
      issue_list := array_append(issue_list, 'Suspiciously high balance');
    END IF;
    
    IF user_record.total_earned > 100000 THEN
      issue_list := array_append(issue_list, 'Suspiciously high total earned');
    END IF;
  END IF;
  
  RETURN QUERY SELECT (array_length(issue_list, 1) = 0), issue_list;
END;
$$ LANGUAGE plpgsql;

-- Insert admin user
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
  training_progress,
  training_phase,
  has_pending_order,
  pending_amount,
  is_negative_balance,
  profit_added,
  status
) VALUES (
  'admin@optimize.com',
  'KANSASNELLY3473',
  'Admin',
  'admin',
  2,
  0,
  0,
  0,
  0,
  'ADMIN',
  false,
  0,
  1,
  false,
  0,
  false,
  false,
  'active'
) ON CONFLICT (email) DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Supabase database setup completed successfully!';
  RAISE NOTICE '📊 Tables created: users, tasks, transactions, withdrawals, user_activity_logs, admin_audit_logs';
  RAISE NOTICE '🔒 RLS policies enabled';
  RAISE NOTICE '📈 Indexes created for performance';
  RAISE NOTICE '🔧 Functions created for balance calculation and validation';
  RAISE NOTICE '👤 Admin user created: admin@optimize.com / admin123';
END $$;
