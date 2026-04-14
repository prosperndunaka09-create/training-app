-- Complete Database Schema for Production Backend
-- This migration creates all tables with proper RLS policies

-- ===========================================
-- 1. USERS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    display_name TEXT,
    phone TEXT,
    balance NUMERIC DEFAULT 0,
    vip_level INTEGER DEFAULT 1,
    total_earned NUMERIC DEFAULT 0,
    referral_code TEXT UNIQUE,
    account_type TEXT DEFAULT 'personal', -- 'personal', 'training', 'admin'
    user_status TEXT DEFAULT 'active', -- 'active', 'suspended', 'deleted'
    
    -- Training fields
    training_completed BOOLEAN DEFAULT false,
    training_progress INTEGER DEFAULT 0,
    training_phase INTEGER DEFAULT 1,
    tasks_completed INTEGER DEFAULT 0,
    
    -- Pending order fields
    trigger_task_number INTEGER,
    has_pending_order BOOLEAN DEFAULT false,
    pending_amount NUMERIC DEFAULT 0,
    is_negative_balance BOOLEAN DEFAULT false,
    profit_added BOOLEAN DEFAULT false,
    pending_product JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_account_type ON users(account_type);

-- ===========================================
-- 2. TRAINING ACCOUNTS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS training_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    assigned_to TEXT,
    created_by TEXT,
    status TEXT DEFAULT 'active',
    progress INTEGER DEFAULT 0,
    total_tasks INTEGER DEFAULT 45,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_training_accounts_email ON training_accounts(email);
CREATE INDEX IF NOT EXISTS idx_training_accounts_user_id ON training_accounts(user_id);

-- ===========================================
-- 3. TASKS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    task_number INTEGER NOT NULL,
    reward NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'locked', -- 'pending', 'completed', 'locked'
    product_name TEXT,
    product_image TEXT,
    product_price NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, task_number)
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_task_number ON tasks(user_id, task_number);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- ===========================================
-- 4. TRANSACTIONS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL, -- 'deposit', 'earning', 'withdrawal', 'task_reward', 'combination_order', 'profit_claim'
    amount NUMERIC NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'completed', -- 'pending', 'completed', 'failed'
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

-- ===========================================
-- 5. ADMIN LOGS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS admin_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    action TEXT NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_user_id ON admin_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at);

-- ===========================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id OR auth.uid() IN (
        SELECT id FROM users WHERE account_type = 'admin'
    ));

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Tasks table policies
CREATE POLICY "Users can view own tasks" ON tasks
    FOR SELECT USING (user_id = auth.uid() OR auth.uid() IN (
        SELECT id FROM users WHERE account_type = 'admin'
    ));

CREATE POLICY "Users can update own tasks" ON tasks
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can insert tasks" ON tasks
    FOR INSERT WITH CHECK (true);

-- Transactions table policies
CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT USING (user_id = auth.uid() OR auth.uid() IN (
        SELECT id FROM users WHERE account_type = 'admin'
    ));

CREATE POLICY "System can insert transactions" ON transactions
    FOR INSERT WITH CHECK (true);

-- Training accounts policies
CREATE POLICY "Admins can manage training accounts" ON training_accounts
    FOR ALL USING (auth.uid() IN (
        SELECT id FROM users WHERE account_type = 'admin'
    ));

CREATE POLICY "Users can view own training account" ON training_accounts
    FOR SELECT USING (user_id = auth.uid());

-- Admin logs policies
CREATE POLICY "Admins can view all logs" ON admin_logs
    FOR SELECT USING (auth.uid() IN (
        SELECT id FROM users WHERE account_type = 'admin'
    ));

CREATE POLICY "System can insert logs" ON admin_logs
    FOR INSERT WITH CHECK (true);

-- ===========================================
-- 7. FUNCTIONS AND TRIGGERS
-- ===========================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update trigger to tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_accounts_updated_at BEFORE UPDATE ON training_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to complete task and update balance
CREATE OR REPLACE FUNCTION complete_task_and_update_balance(
    p_user_id UUID,
    p_task_number INTEGER
)
RETURNS JSONB AS $$
DECLARE
    v_reward NUMERIC;
    v_task_id UUID;
    v_result JSONB;
BEGIN
    -- Get task info
    SELECT id, reward INTO v_task_id, v_reward
    FROM tasks
    WHERE user_id = p_user_id AND task_number = p_task_number;
    
    IF v_task_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Task not found');
    END IF;
    
    -- Update task status
    UPDATE tasks 
    SET status = 'completed', completed_at = NOW()
    WHERE id = v_task_id;
    
    -- Update user balance
    UPDATE users
    SET 
        balance = balance + v_reward,
        total_earned = total_earned + v_reward,
        tasks_completed = tasks_completed + 1
    WHERE id = p_user_id;
    
    -- Create transaction record
    INSERT INTO transactions (user_id, type, amount, description, status)
    VALUES (p_user_id, 'task_reward', v_reward, 'Task ' || p_task_number || ' reward', 'completed');
    
    -- Unlock next task
    UPDATE tasks
    SET status = 'pending'
    WHERE user_id = p_user_id AND task_number = p_task_number + 1;
    
    RETURN jsonb_build_object('success', true, 'reward', v_reward);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create pending order
CREATE OR REPLACE FUNCTION create_pending_order(
    p_user_id UUID,
    p_task_number INTEGER,
    p_pending_amount NUMERIC,
    p_product JSONB
)
RETURNS JSONB AS $$
BEGIN
    UPDATE users
    SET 
        has_pending_order = true,
        trigger_task_number = p_task_number,
        pending_amount = p_pending_amount,
        is_negative_balance = true,
        pending_product = p_product,
        balance = balance - p_pending_amount
    WHERE id = p_user_id;
    
    -- Create transaction for combination order
    INSERT INTO transactions (user_id, type, amount, description, status)
    VALUES (p_user_id, 'combination_order', p_pending_amount, 'Combination order at task ' || p_task_number, 'completed');
    
    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clear pending order and add profit
CREATE OR REPLACE FUNCTION clear_pending_order_and_add_profit(
    p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_pending_amount NUMERIC;
    v_profit NUMERIC;
BEGIN
    -- Get pending amount
    SELECT pending_amount INTO v_pending_amount
    FROM users WHERE id = p_user_id;
    
    v_profit := v_pending_amount * 6; -- 6x profit
    
    UPDATE users
    SET 
        has_pending_order = false,
        is_negative_balance = false,
        profit_added = true,
        balance = balance + v_pending_amount + v_profit,
        pending_amount = 0,
        pending_product = NULL
    WHERE id = p_user_id;
    
    -- Create profit transaction
    INSERT INTO transactions (user_id, type, amount, description, status)
    VALUES (p_user_id, 'profit_claim', v_profit, '6x Profit claimed', 'completed');
    
    RETURN jsonb_build_object('success', true, 'profit', v_profit);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- 8. SEED DATA
-- ===========================================

-- Create admin user if not exists
INSERT INTO users (id, email, display_name, account_type, user_status, vip_level, training_completed)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin@optimize.com',
    'Administrator',
    'admin',
    'active',
    2,
    true
)
ON CONFLICT (email) DO NOTHING;

-- Verification
DO $$
BEGIN
    RAISE NOTICE '✅ Complete database schema created successfully';
    RAISE NOTICE '✅ Tables: users, training_accounts, tasks, transactions, admin_logs';
    RAISE NOTICE '✅ RLS policies enabled for security';
    RAISE NOTICE '✅ Functions created for task completion and pending orders';
END $$;
