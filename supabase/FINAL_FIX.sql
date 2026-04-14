-- FINAL FIX - Create Functions and Insert Test Data
-- Run this after the main SQL to complete the setup

-- ============================================================================
-- 1. CREATE DASHBOARD FUNCTIONS (if not exists)
-- ============================================================================

-- Drop functions if they exist (to avoid conflicts)
DROP FUNCTION IF EXISTS get_dashboard_stats();
DROP FUNCTION IF EXISTS get_recent_users(INTEGER);

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
-- 2. INSERT TEST DATA (only if tables are empty)
-- ============================================================================

-- Only insert if no users exist
DO $$
BEGIN
    IF (SELECT COUNT(*) FROM users) = 0 THEN
        
        -- Insert 5 test users
        INSERT INTO users (id, email, username, display_name, password_hash, balance, account_type, vip_level, tasks_completed, total_earned, referral_code, created_at, last_login)
        VALUES 
            ('550e8400-e29b-41d4-a716-446655440001', 'john.doe@example.com', 'johndoe', 'John Doe', 'hashed_password_1', 1250.50, 'vip1', 1, 15, 3200.00, 'JOHN2024', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 hour'),
            ('550e8400-e29b-41d4-a716-446655440002', 'sarah.smith@test.com', 'sarahs', 'Sarah Smith', 'hashed_password_2', 890.00, 'vip2', 2, 28, 5400.00, 'SARAH2024', NOW() - INTERVAL '5 days', NOW() - INTERVAL '3 hours'),
            ('550e8400-e29b-41d4-a716-446655440003', 'mike.wilson@demo.com', 'mikew', 'Mike Wilson', 'hashed_password_3', 45.00, 'training', 1, 5, 120.00, 'MIKE2024', NOW() - INTERVAL '1 day', NOW() - INTERVAL '30 minutes'),
            ('550e8400-e29b-41d4-a716-446655440004', 'emma.brown@example.com', 'emmab', 'Emma Brown', 'hashed_password_4', 2100.75, 'vip2', 2, 32, 7800.00, 'EMMA2024', NOW() - INTERVAL '10 days', NOW() - INTERVAL '5 hours'),
            ('550e8400-e29b-41d4-a716-446655440005', 'alex.jones@test.com', 'alexj', 'Alex Jones', 'hashed_password_5', 560.25, 'vip1', 1, 22, 2100.00, 'ALEX2024', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 hours');

        -- Insert tasks
        INSERT INTO tasks (id, user_id, task_number, product_name, product_price, commission, reward, status, created_at, completed_at)
        SELECT gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 1, 'iPhone 14 Pro', 349.99, 0.7, 0.7, 'completed', NOW() - INTERVAL '1 day', NOW() - INTERVAL '12 hours'
        WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE user_id = '550e8400-e29b-41d4-a716-446655440001');

        -- Insert withdrawals
        INSERT INTO withdrawals (id, user_id, amount, wallet_address, wallet_type, network, status, created_at)
        SELECT gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 500.00, 'TX1234567890abcdef', 'TRC20', 'TRC20', 'pending', NOW() - INTERVAL '2 hours'
        WHERE NOT EXISTS (SELECT 1 FROM withdrawals WHERE user_id = '550e8400-e29b-41d4-a716-446655440001' AND status = 'pending');

        -- Insert wallets
        INSERT INTO wallets (id, user_id, address, network, wallet_type, is_default)
        SELECT gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'TX1234567890abcdef1234567890', 'TRC20', 'USDT', true
        WHERE NOT EXISTS (SELECT 1 FROM wallets WHERE user_id = '550e8400-e29b-41d4-a716-446655440001');

        -- Insert transactions
        INSERT INTO transactions (id, user_id, type, amount, description, status, created_at)
        SELECT gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'task', 0.7, 'Task #1 completed', 'completed', NOW() - INTERVAL '1 day'
        WHERE NOT EXISTS (SELECT 1 FROM transactions WHERE user_id = '550e8400-e29b-41d4-a716-446655440001');

    END IF;
END $$;

-- ============================================================================
-- 3. VERIFY SETUP
-- ============================================================================
SELECT 'Setup complete!' as status;
SELECT 'Functions created:' as info;
SELECT proname as function_name FROM pg_proc WHERE proname IN ('get_dashboard_stats', 'get_recent_users');
SELECT 'Table counts:' as info;
SELECT COUNT(*) as users FROM users;
SELECT COUNT(*) as tasks FROM tasks;
SELECT COUNT(*) as withdrawals FROM withdrawals;
SELECT COUNT(*) as wallets FROM wallets;
SELECT COUNT(*) as transactions FROM transactions;
