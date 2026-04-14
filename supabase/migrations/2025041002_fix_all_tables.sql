-- COMPREHENSIVE DATABASE FIX - April 10, 2026
-- This migration ensures all tables and columns exist for the admin panel

-- ============================================
-- 1. USERS TABLE - Core user data
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE,
    password_hash TEXT,
    phone TEXT,
    display_name TEXT,
    balance NUMERIC DEFAULT 0,
    vip_level INTEGER DEFAULT 1,
    total_earned NUMERIC DEFAULT 0,
    referral_code TEXT UNIQUE,
    account_type TEXT DEFAULT 'personal',
    user_status TEXT DEFAULT 'active',
    training_completed BOOLEAN DEFAULT false,
    training_progress INTEGER DEFAULT 0,
    training_phase INTEGER DEFAULT 1,
    tasks_completed INTEGER DEFAULT 0,
    tasks_total INTEGER DEFAULT 35,
    trigger_task_number INTEGER,
    has_pending_order BOOLEAN DEFAULT false,
    pending_amount NUMERIC DEFAULT 0,
    is_negative_balance BOOLEAN DEFAULT false,
    profit_added BOOLEAN DEFAULT false,
    last_login TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if they don't exist
DO $$
BEGIN
    ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS balance NUMERIC DEFAULT 0;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS vip_level INTEGER DEFAULT 1;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS total_earned NUMERIC DEFAULT 0;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'personal';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS user_status TEXT DEFAULT 'active';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS training_completed BOOLEAN DEFAULT false;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS training_progress INTEGER DEFAULT 0;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS training_phase INTEGER DEFAULT 1;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS tasks_completed INTEGER DEFAULT 0;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS tasks_total INTEGER DEFAULT 35;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS trigger_task_number INTEGER;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS has_pending_order BOOLEAN DEFAULT false;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS pending_amount NUMERIC DEFAULT 0;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS is_negative_balance BOOLEAN DEFAULT false;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS profit_added BOOLEAN DEFAULT false;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
    ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
END $$;

-- ============================================
-- 2. WITHDRAWALS TABLE - Withdrawal requests
-- ============================================
CREATE TABLE IF NOT EXISTS withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL DEFAULT 0,
    wallet_address TEXT NOT NULL,
    wallet_type TEXT DEFAULT 'TRC20',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    processed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    rejection_reason TEXT
);

-- ============================================
-- 3. TASKS TABLE - User task progress
-- ============================================
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    task_number INTEGER NOT NULL,
    reward NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'locked' CHECK (status IN ('pending', 'completed', 'locked')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- ============================================
-- 4. TRANSACTIONS TABLE - All financial transactions
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'earning', 'withdrawal', 'task_reward', 'profit_claim')),
    amount NUMERIC NOT NULL DEFAULT 0,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- ============================================
-- 5. TRAINING ACCOUNTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS training_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    password TEXT NOT NULL,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. ADMIN LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS admin_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 8. CREATE POLICIES
-- ============================================

-- Users policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;

CREATE POLICY "Users can view own profile" ON users 
    FOR SELECT USING (auth.uid() = id);
    
CREATE POLICY "Users can update own profile" ON users 
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users 
    FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE account_type = 'admin'));

-- Withdrawals policies
DROP POLICY IF EXISTS "Users can view own withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Users can create withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Admins can manage all withdrawals" ON withdrawals;

CREATE POLICY "Users can view own withdrawals" ON withdrawals 
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create withdrawals" ON withdrawals 
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all withdrawals" ON withdrawals 
    FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE account_type = 'admin'));

-- Tasks policies
DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
DROP POLICY IF EXISTS "Admins can view all tasks" ON tasks;

CREATE POLICY "Users can view own tasks" ON tasks 
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all tasks" ON tasks 
    FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE account_type = 'admin'));

-- Transactions policies
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON transactions;

CREATE POLICY "Users can view own transactions" ON transactions 
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all transactions" ON transactions 
    FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE account_type = 'admin'));

-- Training accounts policies
DROP POLICY IF EXISTS "Admins can manage training accounts" ON training_accounts;
DROP POLICY IF EXISTS "Users can view own training account" ON training_accounts;

CREATE POLICY "Admins can manage training accounts" ON training_accounts 
    FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE account_type = 'admin'));

CREATE POLICY "Users can view own training account" ON training_accounts 
    FOR SELECT USING (assigned_to = auth.uid());

-- Admin logs policies
DROP POLICY IF EXISTS "Admins can view all logs" ON admin_logs;
DROP POLICY IF EXISTS "System can insert logs" ON admin_logs;

CREATE POLICY "Admins can view all logs" ON admin_logs 
    FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE account_type = 'admin'));

CREATE POLICY "System can insert logs" ON admin_logs 
    FOR INSERT WITH CHECK (true);

-- ============================================
-- 9. CREATE INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_account_type ON users(account_type);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);

-- ============================================
-- 10. VERIFY SETUP
-- ============================================
SELECT 'Tables created successfully' as status;
