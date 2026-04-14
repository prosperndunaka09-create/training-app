-- QUICK FIX - Run this FIRST to add missing columns
-- This only adds columns, doesn't insert data yet

-- Add all missing columns to users table (run these one by one if needed)
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
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
ALTER TABLE users ADD COLUMN IF NOT EXISTS trigger_task_number INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS has_pending_order BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pending_amount NUMERIC DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_negative_balance BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profit_added BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pending_product JSONB;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    task_number INTEGER NOT NULL,
    reward NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'locked',
    product_name TEXT,
    product_image TEXT,
    product_price NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, task_number)
);

CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'completed',
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS admin_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    action TEXT NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Create policies (drop first to avoid errors)
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
DROP POLICY IF EXISTS "System can insert tasks" ON tasks;
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "System can insert transactions" ON transactions;
DROP POLICY IF EXISTS "Admins can manage training accounts" ON training_accounts;
DROP POLICY IF EXISTS "Users can view own training account" ON training_accounts;
DROP POLICY IF EXISTS "Admins can view all logs" ON admin_logs;
DROP POLICY IF EXISTS "System can insert logs" ON admin_logs;

-- Users policies
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Tasks policies
CREATE POLICY "Users can view own tasks" ON tasks FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own tasks" ON tasks FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "System can insert tasks" ON tasks FOR INSERT WITH CHECK (true);

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "System can insert transactions" ON transactions FOR INSERT WITH CHECK (true);

-- Training accounts policies
CREATE POLICY "Admins can manage training accounts" ON training_accounts FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE account_type = 'admin'));
CREATE POLICY "Users can view own training account" ON training_accounts FOR SELECT USING (user_id = auth.uid());

-- Admin logs policies
CREATE POLICY "Admins can view all logs" ON admin_logs FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE account_type = 'admin'));
CREATE POLICY "System can insert logs" ON admin_logs FOR INSERT WITH CHECK (true);

-- Create functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_training_accounts_updated_at ON training_accounts;
CREATE TRIGGER update_training_accounts_updated_at BEFORE UPDATE ON training_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Task completion function
CREATE OR REPLACE FUNCTION complete_task_and_update_balance(
    p_user_id UUID,
    p_task_number INTEGER
)
RETURNS JSONB AS $$
DECLARE
    v_reward NUMERIC;
    v_task_id UUID;
BEGIN
    SELECT id, reward INTO v_task_id, v_reward
    FROM tasks
    WHERE user_id = p_user_id AND task_number = p_task_number;
    
    IF v_task_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Task not found');
    END IF;
    
    UPDATE tasks SET status = 'completed', completed_at = NOW() WHERE id = v_task_id;
    UPDATE users SET balance = balance + v_reward, total_earned = total_earned + v_reward, tasks_completed = tasks_completed + 1 WHERE id = p_user_id;
    INSERT INTO transactions (user_id, type, amount, description, status)
    VALUES (p_user_id, 'task_reward', v_reward, 'Task ' || p_task_number || ' reward', 'completed');
    UPDATE tasks SET status = 'pending' WHERE user_id = p_user_id AND task_number = p_task_number + 1;
    
    RETURN jsonb_build_object('success', true, 'reward', v_reward);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Pending order function
CREATE OR REPLACE FUNCTION create_pending_order(
    p_user_id UUID,
    p_task_number INTEGER,
    p_pending_amount NUMERIC,
    p_product JSONB
)
RETURNS JSONB AS $$
BEGIN
    UPDATE users SET 
        has_pending_order = true,
        trigger_task_number = p_task_number,
        pending_amount = p_pending_amount,
        is_negative_balance = true,
        pending_product = p_product,
        balance = balance - p_pending_amount
    WHERE id = p_user_id;
    
    INSERT INTO transactions (user_id, type, amount, description, status)
    VALUES (p_user_id, 'combination_order', p_pending_amount, 'Combination order at task ' || p_task_number, 'completed');
    
    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clear pending order and add profit function
CREATE OR REPLACE FUNCTION clear_pending_order_and_add_profit(
    p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_pending_amount NUMERIC;
    v_profit NUMERIC;
BEGIN
    SELECT pending_amount INTO v_pending_amount FROM users WHERE id = p_user_id;
    v_profit := v_pending_amount * 6;
    
    UPDATE users SET 
        has_pending_order = false,
        is_negative_balance = false,
        profit_added = true,
        balance = balance + v_pending_amount + v_profit,
        pending_amount = 0,
        pending_product = NULL
    WHERE id = p_user_id;
    
    INSERT INTO transactions (user_id, type, amount, description, status)
    VALUES (p_user_id, 'profit_claim', v_profit, '6x Profit claimed', 'completed');
    
    RETURN jsonb_build_object('success', true, 'profit', v_profit);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add admin user (only if email column now exists)
INSERT INTO users (id, email, display_name, password_hash, account_type, user_status, vip_level, training_completed, balance)
VALUES ('00000000-0000-0000-0000-000000000001', 'admin@optimize.com', 'Administrator', '081677', 'admin', 'active', 2, true, 0)
ON CONFLICT (email) DO UPDATE SET password_hash = '081677', account_type = 'admin';
