-- RLS POLICY FIX - Make tables accessible for admin panel
-- Run this in Supabase SQL Editor

-- =====================================================
-- 1. DISABLE RLS TEMPORARILY (for testing only)
-- =====================================================
-- Uncomment these if you want to completely disable RLS for testing:
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE withdrawals DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE wallets DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. CREATE PERMISSIVE POLICIES FOR ANON/Authenticated
-- =====================================================

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow all operations on users" ON users;
DROP POLICY IF EXISTS "Allow all operations on tasks" ON tasks;
DROP POLICY IF EXISTS "Allow all operations on withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Allow all operations on wallets" ON wallets;
DROP POLICY IF EXISTS "Allow all operations on transactions" ON transactions;

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create permissive policies that allow all operations
-- This is needed for the admin panel to work with the anon key
CREATE POLICY "Allow all operations on users" ON users
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Allow all operations on tasks" ON tasks
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Allow all operations on withdrawals" ON withdrawals
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Allow all operations on wallets" ON wallets
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Allow all operations on transactions" ON transactions
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- =====================================================
-- 3. VERIFY DATA EXISTS
-- =====================================================
SELECT 'Users count:' as check_name, COUNT(*) as value FROM users
UNION ALL
SELECT 'Tasks count:', COUNT(*) FROM tasks
UNION ALL
SELECT 'Withdrawals count:', COUNT(*) FROM withdrawals
UNION ALL
SELECT 'Wallets count:', COUNT(*) FROM wallets
UNION ALL
SELECT 'Transactions count:', COUNT(*) FROM transactions;

-- =====================================================
-- 4. TEST QUERY (should work after this)
-- =====================================================
SELECT * FROM users LIMIT 5;
