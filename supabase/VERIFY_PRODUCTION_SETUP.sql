-- ============================================================================
-- PRODUCTION VERIFICATION SCRIPT
-- Run this in Supabase SQL Editor to verify everything is set up correctly
-- ============================================================================

-- ============================================================================
-- 1. VERIFY TABLES EXIST
-- ============================================================================
SELECT '=== TABLE EXISTS CHECK ===' as section;

SELECT 
    table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = check_tables.table_name
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM (VALUES 
    ('users'),
    ('tasks'),
    ('withdrawals'),
    ('wallets'),
    ('transactions'),
    ('training_accounts'),
    ('admin_logs')
) AS check_tables(table_name);

-- ============================================================================
-- 2. VERIFY TABLE COUNTS
-- ============================================================================
SELECT '=== TABLE COUNTS ===' as section;

SELECT 'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'tasks', COUNT(*) FROM tasks
UNION ALL
SELECT 'withdrawals', COUNT(*) FROM withdrawals
UNION ALL
SELECT 'wallets', COUNT(*) FROM wallets
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'training_accounts', COUNT(*) FROM training_accounts
UNION ALL
SELECT 'admin_logs', COUNT(*) FROM admin_logs;

-- ============================================================================
-- 3. VERIFY RLS IS ENABLED
-- ============================================================================
SELECT '=== RLS STATUS ===' as section;

SELECT 
    tablename,
    rowsecurity as rls_enabled,
    CASE WHEN rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'tasks', 'withdrawals', 'wallets', 'transactions', 'training_accounts', 'admin_logs');

-- ============================================================================
-- 4. VERIFY POLICIES EXIST
-- ============================================================================
SELECT '=== RLS POLICIES ===' as section;

SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- 5. CHECK FOR ADMIN USERS
-- ============================================================================
SELECT '=== ADMIN USERS ===' as section;

SELECT 
    id,
    email,
    display_name,
    account_type,
    user_status,
    created_at
FROM users
WHERE account_type = 'admin'
LIMIT 5;

-- ============================================================================
-- 6. CHECK RECENT USERS
-- ============================================================================
SELECT '=== RECENT USERS (Last 10) ===' as section;

SELECT 
    id,
    email,
    display_name,
    account_type,
    balance,
    total_earned,
    tasks_completed,
    created_at
FROM users
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- 7. CHECK PENDING WITHDRAWALS
-- ============================================================================
SELECT '=== PENDING WITHDRAWALS ===' as section;

SELECT 
    w.id,
    w.user_id,
    u.email as user_email,
    w.amount,
    w.wallet_address,
    w.status,
    w.created_at
FROM withdrawals w
LEFT JOIN users u ON w.user_id = u.id
WHERE w.status = 'pending'
ORDER BY w.created_at DESC
LIMIT 10;

-- ============================================================================
-- 8. CHECK COMPLETED WITHDRAWALS
-- ============================================================================
SELECT '=== COMPLETED WITHDRAWALS ===' as section;

SELECT 
    COUNT(*) as total_completed,
    COALESCE(SUM(amount), 0) as total_amount
FROM withdrawals
WHERE status = 'completed';

-- ============================================================================
-- 9. CHECK DASHBOARD STATS
-- ============================================================================
SELECT '=== DASHBOARD STATS ===' as section;

SELECT 
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COALESCE(SUM(balance), 0) FROM users) as total_balance,
    (SELECT COALESCE(SUM(amount), 0) FROM withdrawals WHERE status = 'completed') as total_payouts,
    (SELECT COALESCE(SUM(amount), 0) FROM withdrawals WHERE status = 'pending') as pending_payouts,
    (SELECT COUNT(*) FROM withdrawals WHERE status = 'pending') as pending_withdrawals_count,
    (SELECT COUNT(*) FROM tasks WHERE status = 'completed') as completed_tasks,
    (SELECT COUNT(DISTINCT user_id) FROM tasks WHERE status = 'completed') as users_with_completed_tasks;

-- ============================================================================
-- 10. CHECK TRAINING ACCOUNTS
-- ============================================================================
SELECT '=== TRAINING ACCOUNTS ===' as section;

SELECT 
    id,
    email,
    assigned_to,
    status,
    created_at
FROM training_accounts
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- 11. VERIFY DATABASE CONNECTION
-- ============================================================================
SELECT '=== CONNECTION TEST ===' as section;

SELECT 
    current_database() as database_name,
    current_user as connected_user,
    version() as postgres_version,
    '✅ CONNECTED' as status;

-- ============================================================================
-- 12. SUMMARY VERIFICATION
-- ============================================================================
SELECT '=== SETUP VERIFICATION SUMMARY ===' as section;

SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM users) > 0 THEN '✅ Users table has data'
        ELSE '⚠️ Users table is empty - may need seed data'
    END as users_check,
    CASE 
        WHEN (SELECT COUNT(*) FROM tasks) > 0 THEN '✅ Tasks table has data'
        ELSE '⚠️ Tasks table is empty'
    END as tasks_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM users WHERE account_type = 'admin') THEN '✅ Admin users exist'
        ELSE '⚠️ No admin users found'
    END as admin_check,
    CASE 
        WHEN (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') > 0 THEN '✅ RLS policies exist'
        ELSE '❌ No RLS policies found'
    END as rls_check;

-- ============================================================================
-- END OF VERIFICATION SCRIPT
-- ============================================================================
SELECT 'Verification complete! Check results above.' as final_message;
