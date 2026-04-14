-- ============================================================================
-- COMPLETE DATABASE FIX FOR ADMIN PANEL
-- Created: April 10, 2026
-- Purpose: Fix all tables, RLS policies, and insert test data
-- ============================================================================

-- ============================================================================
-- 1. DROP EXISTING POLICIES (to avoid conflicts)
-- ============================================================================
DO $$
BEGIN
    -- Users policies
    DROP POLICY IF EXISTS "Users can view own profile" ON users;
    DROP POLICY IF EXISTS "Users can update own profile" ON users;
    DROP POLICY IF EXISTS "Admins can view all users" ON users;
    DROP POLICY IF EXISTS "Allow all access" ON users;
    DROP POLICY IF EXISTS "Public read access" ON users;
    DROP POLICY IF EXISTS "Enable read for authenticated" ON users;
    
    -- Tasks policies
    DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
    DROP POLICY IF EXISTS "Admins can view all tasks" ON tasks;
    DROP POLICY IF EXISTS "Allow all access" ON tasks;
    DROP POLICY IF EXISTS "Enable read for authenticated" ON tasks;
    
    -- Withdrawals policies
    DROP POLICY IF EXISTS "Users can view own withdrawals" ON withdrawals;
    DROP POLICY IF EXISTS "Admins can manage all withdrawals" ON withdrawals;
    DROP POLICY IF EXISTS "Allow all access" ON withdrawals;
    DROP POLICY IF EXISTS "Enable read for authenticated" ON withdrawals;
    
    -- Wallets policies
    DROP POLICY IF EXISTS "Users can view own wallet" ON wallets;
    DROP POLICY IF EXISTS "Admins can view all wallets" ON wallets;
    DROP POLICY IF EXISTS "Allow all access" ON wallets;
    DROP POLICY IF EXISTS "Enable read for authenticated" ON wallets;
    
    -- Transactions policies
    DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
    DROP POLICY IF EXISTS "Admins can view all transactions" ON transactions;
    DROP POLICY IF EXISTS "Allow all access" ON transactions;
    DROP POLICY IF EXISTS "Enable read for authenticated" ON transactions;
END $$;

-- ============================================================================
-- 2. CREATE USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE,
    username TEXT,
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
    pending_product JSONB,
    is_negative_balance BOOLEAN DEFAULT false,
    profit_added BOOLEAN DEFAULT false,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add any missing columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;
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
ALTER TABLE users ADD COLUMN IF NOT EXISTS pending_product JSONB;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_negative_balance BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profit_added BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_account_type ON users(account_type);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- ============================================================================
-- 3. CREATE TASKS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    task_number INTEGER NOT NULL,
    product_name TEXT,
    product_price NUMERIC DEFAULT 0,
    commission NUMERIC DEFAULT 0,
    reward NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'locked' CHECK (status IN ('pending', 'completed', 'locked')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Add missing columns
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS product_name TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS product_price NUMERIC DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS commission NUMERIC DEFAULT 0;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- ============================================================================
-- 4. CREATE WITHDRAWALS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL DEFAULT 0,
    wallet_address TEXT NOT NULL,
    wallet_type TEXT DEFAULT 'TRC20',
    network TEXT DEFAULT 'TRC20',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'rejected')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    processed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    rejection_reason TEXT
);

-- Add missing columns
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS network TEXT DEFAULT 'TRC20';
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS processed_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_created_at ON withdrawals(created_at);

-- ============================================================================
-- 5. CREATE WALLETS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    address TEXT NOT NULL,
    network TEXT DEFAULT 'TRC20',
    wallet_type TEXT DEFAULT 'USDT',
    is_default BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);

-- ============================================================================
-- 6. CREATE TRANSACTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('task', 'withdrawal', 'deposit', 'earning', 'commission', 'bonus')),
    amount NUMERIC NOT NULL DEFAULT 0,
    description TEXT,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
    reference_id UUID,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

-- ============================================================================
-- 7. ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 8. CREATE RLS POLICIES (PERMISSIVE FOR ADMIN ACCESS)
-- ============================================================================

-- Users: Allow all operations for now (admin panel needs full access)
CREATE POLICY "Allow all operations on users" ON users
    FOR ALL TO authenticated, anon
    USING (true) WITH CHECK (true);

-- Tasks: Allow all operations
CREATE POLICY "Allow all operations on tasks" ON tasks
    FOR ALL TO authenticated, anon
    USING (true) WITH CHECK (true);

-- Withdrawals: Allow all operations
CREATE POLICY "Allow all operations on withdrawals" ON withdrawals
    FOR ALL TO authenticated, anon
    USING (true) WITH CHECK (true);

-- Wallets: Allow all operations
CREATE POLICY "Allow all operations on wallets" ON wallets
    FOR ALL TO authenticated, anon
    USING (true) WITH CHECK (true);

-- Transactions: Allow all operations
CREATE POLICY "Allow all operations on transactions" ON transactions
    FOR ALL TO authenticated, anon
    USING (true) WITH CHECK (true);

-- ============================================================================
-- 9. INSERT TEST DATA
-- ============================================================================

-- Clear existing test data first (optional - comment out if you want to keep existing)
-- DELETE FROM transactions WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%test%');
-- DELETE FROM tasks WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%test%');
-- DELETE FROM withdrawals WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%test%');
-- DELETE FROM wallets WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%test%');
-- DELETE FROM users WHERE email LIKE '%test%' OR email LIKE '%demo%' OR email LIKE '%example%';

-- Insert 5 test users
INSERT INTO users (id, email, username, display_name, password_hash, balance, account_type, vip_level, tasks_completed, total_earned, referral_code, created_at, last_login)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', 'john.doe@example.com', 'johndoe', 'John Doe', 'hashed_password_1', 1250.50, 'vip1', 1, 15, 3200.00, 'JOHN2024', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 hour'),
    ('550e8400-e29b-41d4-a716-446655440002', 'sarah.smith@test.com', 'sarahs', 'Sarah Smith', 'hashed_password_2', 890.00, 'vip2', 2, 28, 5400.00, 'SARAH2024', NOW() - INTERVAL '5 days', NOW() - INTERVAL '3 hours'),
    ('550e8400-e29b-41d4-a716-446655440003', 'mike.wilson@demo.com', 'mikew', 'Mike Wilson', 'hashed_password_3', 45.00, 'training', 1, 5, 120.00, 'MIKE2024', NOW() - INTERVAL '1 day', NOW() - INTERVAL '30 minutes'),
    ('550e8400-e29b-41d4-a716-446655440004', 'emma.brown@example.com', 'emmab', 'Emma Brown', 'hashed_password_4', 2100.75, 'vip2', 2, 32, 7800.00, 'EMMA2024', NOW() - INTERVAL '10 days', NOW() - INTERVAL '5 hours'),
    ('550e8400-e29b-41d4-a716-446655440005', 'alex.jones@test.com', 'alexj', 'Alex Jones', 'hashed_password_5', 560.25, 'vip1', 1, 22, 2100.00, 'ALEX2024', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 hours')
ON CONFLICT (id) DO NOTHING;

-- Insert tasks for users
INSERT INTO tasks (id, user_id, task_number, product_name, product_price, commission, reward, status, created_at, completed_at)
VALUES
    -- John Doe tasks (3 completed, 1 pending)
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 1, 'iPhone 14 Pro', 349.99, 0.7, 0.7, 'completed', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 2, 'Samsung Galaxy', 299.99, 1.6, 1.6, 'completed', NOW() - INTERVAL '1 day', NOW() - INTERVAL '12 hours'),
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 3, 'iPad Pro', 449.99, 2.5, 2.5, 'completed', NOW() - INTERVAL '12 hours', NOW() - INTERVAL '6 hours'),
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 4, 'AirPods Pro', 199.99, 6.4, 6.4, 'pending', NOW() - INTERVAL '1 hour', NULL),
    
    -- Sarah Smith tasks (5 completed)
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', 1, 'MacBook Pro', 1299.99, 0.7, 0.7, 'completed', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days'),
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', 2, 'Apple Watch', 399.99, 1.6, 1.6, 'completed', NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days'),
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', 3, 'iPhone 15', 899.99, 2.5, 2.5, 'completed', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days'),
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', 4, 'AirPods Max', 549.99, 6.4, 6.4, 'completed', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', 5, 'iPad Air', 599.99, 7.2, 7.2, 'completed', NOW() - INTERVAL '1 day', NOW() - INTERVAL '12 hours'),
    
    -- Mike Wilson tasks (2 completed, 1 pending)
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440003', 1, 'Wireless Earbuds', 79.99, 0.7, 0.7, 'completed', NOW() - INTERVAL '1 day', NOW() - INTERVAL '20 hours'),
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440003', 2, 'Smart Watch', 149.99, 1.6, 1.6, 'completed', NOW() - INTERVAL '20 hours', NOW() - INTERVAL '16 hours'),
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440003', 3, 'Bluetooth Speaker', 89.99, 2.5, 2.5, 'pending', NOW() - INTERVAL '2 hours', NULL);

-- Insert withdrawals (mix of pending, completed, rejected)
INSERT INTO withdrawals (id, user_id, amount, wallet_address, wallet_type, network, status, created_at, processed_at)
VALUES
    -- Pending withdrawals
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 500.00, 'TX1234567890abcdef', 'TRC20', 'TRC20', 'pending', NOW() - INTERVAL '2 hours', NULL),
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', 1200.00, 'TXabcdef1234567890', 'TRC20', 'TRC20', 'pending', NOW() - INTERVAL '5 hours', NULL),
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440004', 800.00, 'TX9876543210fedcba', 'ERC20', 'ERC20', 'pending', NOW() - INTERVAL '1 day', NULL),
    
    -- Completed withdrawals
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', 2000.00, 'TXfedcba9876543210', 'TRC20', 'TRC20', 'completed', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days'),
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440004', 1500.00, 'TX5678901234abcdef', 'TRC20', 'TRC20', 'completed', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days'),
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440005', 400.00, 'TXabcdef5678901234', 'BEP20', 'BEP20', 'completed', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),
    
    -- Rejected withdrawals
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440003', 100.00, 'TXinvalidaddress123', 'TRC20', 'TRC20', 'rejected', NOW() - INTERVAL '1 day', NOW() - INTERVAL '20 hours');

-- Insert wallets for users
INSERT INTO wallets (id, user_id, address, network, wallet_type, is_default)
VALUES
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'TX1234567890abcdef1234567890', 'TRC20', 'USDT', true),
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', 'TXabcdef1234567890abcdef12', 'TRC20', 'USDT', true),
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440003', 'TX9876543210fedcba98765432', 'TRC20', 'USDT', true),
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440004', 'TX5678901234abcdef56789012', 'ERC20', 'USDT', true),
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440005', 'TXabcdef5678901234abcdef56', 'BEP20', 'USDT', true);

-- Insert transactions
INSERT INTO transactions (id, user_id, type, amount, description, status, created_at)
VALUES
    -- Task earnings
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'task', 0.7, 'Task #1 completed - iPhone 14 Pro', 'completed', NOW() - INTERVAL '1 day'),
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'task', 1.6, 'Task #2 completed - Samsung Galaxy', 'completed', NOW() - INTERVAL '12 hours'),
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'task', 2.5, 'Task #3 completed - iPad Pro', 'completed', NOW() - INTERVAL '6 hours'),
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', 'task', 0.7, 'Task #1 completed - MacBook Pro', 'completed', NOW() - INTERVAL '4 days'),
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', 'task', 1.6, 'Task #2 completed - Apple Watch', 'completed', NOW() - INTERVAL '3 days'),
    
    -- Withdrawals
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', 'withdrawal', -2000.00, 'Withdrawal to TRC20 wallet', 'completed', NOW() - INTERVAL '2 days'),
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440004', 'withdrawal', -1500.00, 'Withdrawal to TRC20 wallet', 'completed', NOW() - INTERVAL '4 days'),
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440005', 'withdrawal', -400.00, 'Withdrawal to BEP20 wallet', 'completed', NOW() - INTERVAL '1 day'),
    
    -- Pending withdrawals (not yet deducted)
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'withdrawal', 500.00, 'Pending withdrawal request', 'pending', NOW() - INTERVAL '2 hours'),
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', 'withdrawal', 1200.00, 'Pending withdrawal request', 'pending', NOW() - INTERVAL '5 hours');

-- ============================================================================
-- 10. CREATE DASHBOARD QUERY FUNCTIONS
-- ============================================================================

-- Function to get dashboard stats
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS TABLE (
    total_users BIGINT,
    total_balance NUMERIC,
    total_withdrawals NUMERIC,
    pending_withdrawals NUMERIC,
    completed_tasks BIGINT,
    pending_withdrawal_count BIGINT,
    new_users_today BIGINT,
    active_today BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM users)::BIGINT as total_users,
        (SELECT COALESCE(SUM(balance), 0) FROM users)::NUMERIC as total_balance,
        (SELECT COALESCE(SUM(amount), 0) FROM withdrawals WHERE status = 'completed')::NUMERIC as total_withdrawals,
        (SELECT COALESCE(SUM(amount), 0) FROM withdrawals WHERE status = 'pending')::NUMERIC as pending_withdrawals,
        (SELECT COUNT(*) FROM tasks WHERE status = 'completed')::BIGINT as completed_tasks,
        (SELECT COUNT(*) FROM withdrawals WHERE status = 'pending')::BIGINT as pending_withdrawal_count,
        (SELECT COUNT(*) FROM users WHERE created_at >= CURRENT_DATE)::BIGINT as new_users_today,
        (SELECT COUNT(*) FROM users WHERE last_login >= CURRENT_DATE)::BIGINT as active_today;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get recent users
CREATE OR REPLACE FUNCTION get_recent_users(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID,
    email TEXT,
    username TEXT,
    display_name TEXT,
    balance NUMERIC,
    account_type TEXT,
    tasks_completed INTEGER,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.username,
        u.display_name,
        u.balance,
        u.account_type,
        u.tasks_completed,
        u.created_at
    FROM users u
    ORDER BY u.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 11. VERIFY SETUP
-- ============================================================================
SELECT 'Database setup complete!' as status;
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as task_count FROM tasks;
SELECT COUNT(*) as withdrawal_count FROM withdrawals;
SELECT COUNT(*) as wallet_count FROM wallets;
SELECT COUNT(*) as transaction_count FROM transactions;
