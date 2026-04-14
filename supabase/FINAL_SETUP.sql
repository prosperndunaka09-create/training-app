-- ============================================
-- FINAL DATABASE SETUP - Complete Earnings Platform
-- With 6× Profit Training System
-- ============================================

-- ============================================
-- 1. ENSURE ALL TABLES EXIST
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    display_name TEXT NOT NULL,
    phone TEXT,
    account_type TEXT DEFAULT 'personal',
    user_status TEXT DEFAULT 'active',
    vip_level INTEGER DEFAULT 1,
    balance DECIMAL DEFAULT 0,
    total_earned DECIMAL DEFAULT 0,
    referral_code TEXT UNIQUE,
    
    -- Training fields
    training_completed BOOLEAN DEFAULT false,
    training_progress INTEGER DEFAULT 0,
    training_phase INTEGER DEFAULT 1,
    tasks_completed INTEGER DEFAULT 0,
    
    -- Pending order fields (6× profit system)
    trigger_task_number INTEGER,
    has_pending_order BOOLEAN DEFAULT false,
    pending_amount DECIMAL DEFAULT 0,
    is_negative_balance BOOLEAN DEFAULT false,
    profit_added BOOLEAN DEFAULT false,
    pending_product JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    task_number INTEGER NOT NULL,
    reward DECIMAL DEFAULT 0,
    status TEXT DEFAULT 'locked',
    product_name TEXT,
    product_image TEXT,
    product_price DECIMAL,
    task_set INTEGER DEFAULT 1,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, task_number)
);

-- Training accounts table
CREATE TABLE IF NOT EXISTS public.training_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
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

-- Add missing columns to training_accounts if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'training_accounts' AND column_name = 'assigned_to'
    ) THEN
        ALTER TABLE public.training_accounts ADD COLUMN assigned_to TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'training_accounts' AND column_name = 'created_by'
    ) THEN
        ALTER TABLE public.training_accounts ADD COLUMN created_by TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'training_accounts' AND column_name = 'progress'
    ) THEN
        ALTER TABLE public.training_accounts ADD COLUMN progress INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'training_accounts' AND column_name = 'total_tasks'
    ) THEN
        ALTER TABLE public.training_accounts ADD COLUMN total_tasks INTEGER DEFAULT 45;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'training_accounts' AND column_name = 'completed'
    ) THEN
        ALTER TABLE public.training_accounts ADD COLUMN completed BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'deposit', 'earning', 'withdrawal', 'task_reward', 'combination_order', 'profit_claim'
    amount DECIMAL NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'completed',
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wallets table
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    wallet_type TEXT NOT NULL,
    chain TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Withdrawals table
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount DECIMAL NOT NULL,
    wallet_address TEXT NOT NULL,
    chain TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deposits table
CREATE TABLE IF NOT EXISTS public.deposits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount DECIMAL NOT NULL,
    wallet_address TEXT NOT NULL,
    chain TEXT NOT NULL,
    tx_hash TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer service tables
CREATE TABLE IF NOT EXISTS public.customer_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT,
    status TEXT DEFAULT 'open',
    telegram_chat_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.customer_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.customer_conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT false,
    sender_role TEXT DEFAULT 'customer',
    source TEXT DEFAULT 'website',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Telegram chat mappings
CREATE TABLE IF NOT EXISTS public.telegram_chat_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    telegram_chat_id TEXT NOT NULL,
    telegram_username TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin logs - Handle existing table with different structure
-- First check if table exists and drop it completely
DROP TABLE IF EXISTS public.admin_logs CASCADE;

-- Also drop any related objects that might conflict
DROP FUNCTION IF EXISTS log_admin_action CASCADE;

-- Create fresh admin_logs table with correct schema
CREATE TABLE public.admin_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_logs_user_id ON public.admin_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON public.admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON public.admin_logs(created_at);

-- ============================================
-- 2. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_chat_mappings ENABLE ROW LEVEL SECURITY;
-- Admin logs RLS - only enable if table was just created
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_logs') THEN
        ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- ============================================
-- 3. CREATE RLS POLICIES
-- ============================================

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id OR auth.uid() IN (
        SELECT id FROM public.users WHERE account_type = 'admin'
    ));

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Tasks policies
CREATE POLICY "Users can view own tasks" ON public.tasks
    FOR SELECT USING (user_id = auth.uid() OR auth.uid() IN (
        SELECT id FROM public.users WHERE account_type = 'admin'
    ));

CREATE POLICY "Users can update own tasks" ON public.tasks
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can insert tasks" ON public.tasks
    FOR INSERT WITH CHECK (true);

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON public.transactions
    FOR SELECT USING (user_id = auth.uid() OR auth.uid() IN (
        SELECT id FROM public.users WHERE account_type = 'admin'
    ));

CREATE POLICY "System can insert transactions" ON public.transactions
    FOR INSERT WITH CHECK (true);

-- Training accounts policies
CREATE POLICY "Admins can manage training accounts" ON public.training_accounts
    FOR ALL USING (auth.uid() IN (
        SELECT id FROM public.users WHERE account_type = 'admin'
    ));

CREATE POLICY "Users can view own training account" ON public.training_accounts
    FOR SELECT USING (user_id = auth.uid());

-- Wallets policies
CREATE POLICY "Users can manage own wallets" ON public.wallets
    FOR ALL USING (user_id = auth.uid());

-- Customer service policies
CREATE POLICY "Users can view own conversations" ON public.customer_conversations
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create conversations" ON public.customer_conversations
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own messages" ON public.customer_messages
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can send messages" ON public.customer_messages
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Admin logs policies
CREATE POLICY "Admins can view all logs" ON public.admin_logs
    FOR SELECT USING (auth.uid() IN (
        SELECT id FROM public.users WHERE account_type = 'admin'
    ));

-- ============================================
-- 4. CREATE FUNCTIONS FOR 6× PROFIT SYSTEM
-- ============================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_training_accounts_updated_at ON public.training_accounts;
CREATE TRIGGER update_training_accounts_updated_at BEFORE UPDATE ON public.training_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customer_conversations_updated_at ON public.customer_conversations;
CREATE TRIGGER update_customer_conversations_updated_at BEFORE UPDATE ON public.customer_conversations
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
    FROM public.tasks
    WHERE user_id = p_user_id AND task_number = p_task_number;
    
    IF v_task_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Task not found');
    END IF;
    
    -- Update task status
    UPDATE public.tasks 
    SET status = 'completed', completed_at = NOW()
    WHERE id = v_task_id;
    
    -- Update user balance
    UPDATE public.users
    SET 
        balance = balance + v_reward,
        total_earned = total_earned + v_reward,
        tasks_completed = tasks_completed + 1,
        training_progress = LEAST(100, ROUND((tasks_completed + 1) * 100.0 / 45))
    WHERE id = p_user_id;
    
    -- Create transaction record
    INSERT INTO public.transactions (user_id, type, amount, description, status)
    VALUES (p_user_id, 'task_reward', v_reward, 'Task ' || p_task_number || ' reward', 'completed');
    
    -- Unlock next task
    UPDATE public.tasks
    SET status = 'pending'
    WHERE user_id = p_user_id AND task_number = p_task_number + 1;
    
    RETURN jsonb_build_object('success', true, 'reward', v_reward);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create pending order (combination product)
CREATE OR REPLACE FUNCTION create_pending_order(
    p_user_id UUID,
    p_task_number INTEGER,
    p_pending_amount NUMERIC,
    p_product JSONB
)
RETURNS JSONB AS $$
BEGIN
    UPDATE public.users
    SET 
        has_pending_order = true,
        trigger_task_number = p_task_number,
        pending_amount = p_pending_amount,
        is_negative_balance = true,
        pending_product = p_product,
        balance = balance - p_pending_amount,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Create transaction for combination order
    INSERT INTO public.transactions (user_id, type, amount, description, status, metadata)
    VALUES (p_user_id, 'combination_order', p_pending_amount, 'Combination order at task ' || p_task_number, 'completed', jsonb_build_object('product', p_product));
    
    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clear pending order and add 6× profit
CREATE OR REPLACE FUNCTION clear_pending_order_and_add_profit(
    p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_pending_amount NUMERIC;
    v_profit NUMERIC;
    v_current_balance NUMERIC;
BEGIN
    -- Get pending amount
    SELECT pending_amount, balance INTO v_pending_amount, v_current_balance
    FROM public.users WHERE id = p_user_id;
    
    IF v_pending_amount IS NULL OR v_pending_amount = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'No pending order found');
    END IF;
    
    -- Calculate 6× profit
    v_profit := v_pending_amount * 6;
    
    -- Clear pending order and add profit
    UPDATE public.users
    SET 
        has_pending_order = false,
        is_negative_balance = false,
        profit_added = true,
        balance = v_current_balance + v_pending_amount + v_profit,
        pending_amount = 0,
        pending_product = NULL,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Create profit transaction
    INSERT INTO public.transactions (user_id, type, amount, description, status)
    VALUES (p_user_id, 'profit_claim', v_profit, '6× Profit claimed: $' || v_pending_amount || ' × 6 = $' || v_profit, 'completed');
    
    RETURN jsonb_build_object('success', true, 'profit', v_profit, 'pending_amount', v_pending_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin function to clear any user's pending order
CREATE OR REPLACE FUNCTION admin_clear_pending_order(
    p_admin_id UUID,
    p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_pending_amount NUMERIC;
    v_profit NUMERIC;
    v_current_balance NUMERIC;
    v_is_admin BOOLEAN;
BEGIN
    -- Verify admin
    SELECT account_type = 'admin' INTO v_is_admin
    FROM public.users WHERE id = p_admin_id;
    
    IF NOT v_is_admin THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Admin access required');
    END IF;
    
    -- Get pending amount
    SELECT pending_amount, balance INTO v_pending_amount, v_current_balance
    FROM public.users WHERE id = p_user_id;
    
    IF v_pending_amount IS NULL OR v_pending_amount = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'User has no pending order');
    END IF;
    
    -- Calculate 6× profit
    v_profit := v_pending_amount * 6;
    
    -- Clear pending order and add profit
    UPDATE public.users
    SET 
        has_pending_order = false,
        is_negative_balance = false,
        profit_added = true,
        balance = v_current_balance + v_pending_amount + v_profit,
        pending_amount = 0,
        pending_product = NULL,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Create profit transaction
    INSERT INTO public.transactions (user_id, type, amount, description, status)
    VALUES (p_user_id, 'profit_claim', v_profit, '6× Profit (cleared by admin): $' || v_pending_amount || ' × 6 = $' || v_profit, 'completed');
    
    -- Log admin action
    INSERT INTO public.admin_logs (action, user_id, admin_id, details)
    VALUES ('clear_pending_order', p_user_id, p_admin_id, jsonb_build_object('pending_amount', v_pending_amount, 'profit', v_profit));
    
    RETURN jsonb_build_object('success', true, 'profit', v_profit, 'user_id', p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON public.users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_account_type ON public.users(account_type);
CREATE INDEX IF NOT EXISTS idx_users_has_pending_order ON public.users(has_pending_order);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_task_number ON public.tasks(user_id, task_number);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_training_accounts_email ON public.training_accounts(email);
CREATE INDEX IF NOT EXISTS idx_training_accounts_user_id ON public.training_accounts(user_id);

-- ============================================
-- 6. SEED DATA - CREATE DEFAULT ADMIN
-- ============================================

INSERT INTO public.users (
    id, 
    email, 
    display_name, 
    account_type, 
    user_status, 
    vip_level, 
    training_completed,
    training_progress,
    training_phase,
    balance,
    total_earned
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin@optimize.com',
    'Administrator',
    'admin',
    'active',
    2,
    true,
    100,
    2,
    0,
    0
)
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- 7. VERIFICATION
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Final database setup completed!';
    RAISE NOTICE '✅ Tables created: users, tasks, training_accounts, transactions, wallets, withdrawals, deposits, customer_conversations, customer_messages, telegram_chat_mappings, admin_logs';
    RAISE NOTICE '✅ RLS policies enabled for security';
    RAISE NOTICE '✅ Functions created:';
    RAISE NOTICE '   - complete_task_and_update_balance()';
    RAISE NOTICE '   - create_pending_order()';
    RAISE NOTICE '   - clear_pending_order_and_add_profit() - USER VERSION';
    RAISE NOTICE '   - admin_clear_pending_order() - ADMIN VERSION';
    RAISE NOTICE '✅ Default admin user created: admin@optimize.com';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 6× PROFIT SYSTEM READY!';
    RAISE NOTICE '   1. User completes tasks and hits combination product';
    RAISE NOTICE '   2. System creates pending order (negative balance)';
    RAISE NOTICE '   3. User contacts customer service';
    RAISE NOTICE '   4. Admin clears pending order via admin panel';
    RAISE NOTICE '   5. User receives 6× profit automatically';
END $$;
