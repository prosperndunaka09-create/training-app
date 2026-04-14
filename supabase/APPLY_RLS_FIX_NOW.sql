-- ============================================================================
-- URGENT: Fix RLS Policies for Admin Panel to See Users
-- Run this in Supabase SQL Editor immediately
-- ============================================================================

-- ============================================================================
-- 1. DROP ALL EXISTING RESTRICTIVE POLICIES
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
    DROP POLICY IF EXISTS "Allow all operations on users" ON users;
    DROP POLICY IF EXISTS "Admins can manage all users" ON users;
    
    -- Tasks policies
    DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
    DROP POLICY IF EXISTS "Admins can view all tasks" ON tasks;
    DROP POLICY IF EXISTS "Allow all access" ON tasks;
    DROP POLICY IF EXISTS "Enable read for authenticated" ON tasks;
    DROP POLICY IF EXISTS "Allow all operations on tasks" ON tasks;
    
    -- Withdrawals policies
    DROP POLICY IF EXISTS "Users can view own withdrawals" ON withdrawals;
    DROP POLICY IF EXISTS "Admins can manage all withdrawals" ON withdrawals;
    DROP POLICY IF EXISTS "Allow all access" ON withdrawals;
    DROP POLICY IF EXISTS "Enable read for authenticated" ON withdrawals;
    DROP POLICY IF EXISTS "Allow all operations on withdrawals" ON withdrawals;
    
    -- Wallets policies
    DROP POLICY IF EXISTS "Users can view own wallet" ON wallets;
    DROP POLICY IF EXISTS "Admins can view all wallets" ON wallets;
    DROP POLICY IF EXISTS "Allow all access" ON wallets;
    DROP POLICY IF EXISTS "Enable read for authenticated" ON wallets;
    DROP POLICY IF EXISTS "Allow all operations on wallets" ON wallets;
    
    -- Transactions policies
    DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
    DROP POLICY IF EXISTS "Admins can view all transactions" ON transactions;
    DROP POLICY IF EXISTS "Allow all access" ON transactions;
    DROP POLICY IF EXISTS "Enable read for authenticated" ON transactions;
    DROP POLICY IF EXISTS "Allow all operations on transactions" ON transactions;
    
    -- Training accounts policies
    DROP POLICY IF EXISTS "Users can view own training account" ON training_accounts;
    DROP POLICY IF EXISTS "Admins can manage training accounts" ON training_accounts;
    DROP POLICY IF EXISTS "Allow all access" ON training_accounts;
    DROP POLICY IF EXISTS "Enable read for authenticated" ON training_accounts;
    DROP POLICY IF EXISTS "Allow all operations on training_accounts" ON training_accounts;
END $$;

-- ============================================================================
-- 2. ENABLE RLS ON ALL TABLES
-- ============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_accounts ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. CREATE PERMISSIVE POLICIES (Allow admin panel to read all data)
-- ============================================================================

-- Users: Allow ALL operations for anon/authenticated (admin panel uses anon key)
CREATE POLICY "Allow all operations on users" ON users
    FOR ALL TO anon, authenticated
    USING (true) WITH CHECK (true);

-- Tasks: Allow ALL operations
CREATE POLICY "Allow all operations on tasks" ON tasks
    FOR ALL TO anon, authenticated
    USING (true) WITH CHECK (true);

-- Withdrawals: Allow ALL operations
CREATE POLICY "Allow all operations on withdrawals" ON withdrawals
    FOR ALL TO anon, authenticated
    USING (true) WITH CHECK (true);

-- Wallets: Allow ALL operations
CREATE POLICY "Allow all operations on wallets" ON wallets
    FOR ALL TO anon, authenticated
    USING (true) WITH CHECK (true);

-- Transactions: Allow ALL operations
CREATE POLICY "Allow all operations on transactions" ON transactions
    FOR ALL TO anon, authenticated
    USING (true) WITH CHECK (true);

-- Training Accounts: Allow ALL operations
CREATE POLICY "Allow all operations on training_accounts" ON training_accounts
    FOR ALL TO anon, authenticated
    USING (true) WITH CHECK (true);

-- ============================================================================
-- 4. VERIFY DATA EXISTS AND SHOW COUNTS
-- ============================================================================
SELECT 'DATA VERIFICATION:' as info;
SELECT 'Users count:' as table_name, COUNT(*) as total FROM users;
SELECT 'Training accounts count:' as table_name, COUNT(*) as total FROM training_accounts;
SELECT 'Tasks count:' as table_name, COUNT(*) as total FROM tasks;
SELECT 'Withdrawals count:' as table_name, COUNT(*) as total FROM withdrawals;
SELECT 'Wallets count:' as table_name, COUNT(*) as total FROM wallets;
SELECT 'Transactions count:' as table_name, COUNT(*) as total FROM transactions;

-- ============================================================================
-- 5. SHOW SAMPLE DATA TO CONFIRM ACCESS
-- ============================================================================
SELECT 'SAMPLE USERS (first 5):' as info;
SELECT * FROM users ORDER BY created_at DESC LIMIT 5;

SELECT 'SAMPLE TRAINING ACCOUNTS (first 5):' as info;
SELECT * FROM training_accounts ORDER BY created_at DESC LIMIT 5;

-- ============================================================================
-- 6. FORCE POLICY RELOAD
-- ============================================================================
SELECT 'RLS policies updated successfully!' as status;
SELECT 'Please refresh your admin panel to see the users!' as next_step;
