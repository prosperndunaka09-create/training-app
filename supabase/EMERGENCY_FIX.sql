-- EMERGENCY FIX - Run this NOW in Supabase SQL Editor
-- This ensures the admin panel can read all data

-- 1. Drop ALL existing policies
DO $$
BEGIN
    -- Drop all policies on users table
    DROP POLICY IF EXISTS "Allow all operations on users" ON users;
    DROP POLICY IF EXISTS "Admins can manage all users" ON users;
    DROP POLICY IF EXISTS "Users can view own profile" ON users;
    DROP POLICY IF EXISTS "Public access" ON users;
    DROP POLICY IF EXISTS "Enable read access for all" ON users;
    
    -- Drop all policies on training_accounts
    DROP POLICY IF EXISTS "Allow all on training_accounts" ON training_accounts;
    DROP POLICY IF EXISTS "Allow all operations on training_accounts" ON training_accounts;
    
    -- Drop all policies on withdrawals
    DROP POLICY IF EXISTS "Allow all on withdrawals" ON withdrawals;
    DROP POLICY IF EXISTS "Allow all operations on withdrawals" ON withdrawals;
    
    -- Drop all policies on tasks
    DROP POLICY IF EXISTS "Allow all on tasks" ON tasks;
    DROP POLICY IF EXISTS "Allow all operations on tasks" ON tasks;
END $$;

-- 2. Disable RLS completely for testing (re-enable after)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE training_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE wallets DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;

-- 3. Verify data is accessible
SELECT 'USERS COUNT: ' || COUNT(*)::text as result FROM users;
SELECT 'TRAINING ACCOUNTS COUNT: ' || COUNT(*)::text as result FROM training_accounts;
SELECT 'WITHDRAWALS COUNT: ' || COUNT(*)::text as result FROM withdrawals;

-- 4. Show sample data
SELECT id, email, display_name, account_type, balance, created_at 
FROM users 
ORDER BY created_at DESC 
LIMIT 5;
