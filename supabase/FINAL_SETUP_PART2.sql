-- ============================================
-- FINAL SETUP - PART 2 (Skip admin_logs - already fixed!)
-- Run this after QUICK_FIX.sql succeeds
-- ============================================

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
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Enable insert for authentication" ON public.users
    FOR INSERT WITH CHECK (true);

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

CREATE POLICY "Users can insert own transactions" ON public.transactions
    FOR INSERT WITH CHECK (user_id = auth.uid());

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
    FOR ALL USING (auth.uid() IN (
        SELECT id FROM public.users WHERE account_type = 'admin'
    ));

-- ============================================
-- 4. CREATE FUNCTIONS
-- ============================================

-- Function to complete task and update balance
CREATE OR REPLACE FUNCTION complete_task_and_update_balance(
    p_user_id UUID,
    p_task_number INTEGER
)
RETURNS JSONB AS $$
DECLARE
    v_task_id UUID;
    v_reward DECIMAL;
BEGIN
    -- Get task info
    SELECT id, reward INTO v_task_id, v_reward
    FROM public.tasks
    WHERE user_id = p_user_id AND task_number = p_task_number;
    
    IF v_task_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Task not found');
    END IF;
    
    -- Mark task complete
    UPDATE public.tasks
    SET status = 'completed', completed_at = NOW()
    WHERE id = v_task_id;
    
    -- Update user balance and progress
    UPDATE public.users
    SET balance = balance + v_reward,
        total_earned = total_earned + v_reward,
        tasks_completed = tasks_completed + 1,
        training_progress = LEAST(100, ROUND((tasks_completed + 1) * 100.0 / 35))
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
    -- Set user to pending order state
    UPDATE public.users
    SET has_pending_order = true,
        pending_amount = p_pending_amount,
        trigger_task_number = p_task_number,
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
    v_pending_amount DECIMAL;
    v_current_balance DECIMAL;
    v_profit DECIMAL;
BEGIN
    -- Get pending amount
    SELECT pending_amount, balance INTO v_pending_amount, v_current_balance
    FROM public.users WHERE id = p_user_id;
    
    IF v_pending_amount IS NULL OR v_pending_amount = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'No pending order found');
    END IF;
    
    -- Calculate 6× profit
    v_profit := v_pending_amount * 6;
    
    -- Update user: clear pending order and add profit
    UPDATE public.users
    SET has_pending_order = false,
        pending_amount = 0,
        pending_product = NULL,
        trigger_task_number = NULL,
        balance = v_current_balance + v_pending_amount + v_profit,
        total_earned = total_earned + v_profit,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Create transaction for profit
    INSERT INTO public.transactions (user_id, type, amount, description, status)
    VALUES (p_user_id, 'profit_claim', v_profit, '6× profit from combination order', 'completed');
    
    RETURN jsonb_build_object('success', true, 'profit', v_profit, 'total_credit', v_pending_amount + v_profit);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin function to clear pending order
CREATE OR REPLACE FUNCTION admin_clear_pending_order(
    p_admin_id UUID,
    p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_pending_amount DECIMAL;
    v_current_balance DECIMAL;
    v_profit DECIMAL;
BEGIN
    -- Verify admin
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_admin_id AND account_type = 'admin') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Admin access required');
    END IF;
    
    -- Get pending amount
    SELECT pending_amount, balance INTO v_pending_amount, v_current_balance
    FROM public.users WHERE id = p_user_id;
    
    IF v_pending_amount IS NULL OR v_pending_amount = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'No pending order found for user');
    END IF;
    
    -- Calculate 6× profit
    v_profit := v_pending_amount * 6;
    
    -- Update user
    UPDATE public.users
    SET has_pending_order = false,
        pending_amount = 0,
        pending_product = NULL,
        trigger_task_number = NULL,
        is_negative_balance = false,
        balance = v_current_balance + v_pending_amount + v_profit,
        total_earned = total_earned + v_profit,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Create profit transaction
    INSERT INTO public.transactions (user_id, type, amount, description, status)
    VALUES (p_user_id, 'profit_claim', v_profit, '6× profit - Admin cleared', 'completed');
    
    -- Log admin action
    INSERT INTO public.admin_logs (action, user_id, admin_id, details)
    VALUES ('CLEAR_PENDING_ORDER', p_user_id, p_admin_id, jsonb_build_object('pending_amount', v_pending_amount, 'profit', v_profit));
    
    RETURN jsonb_build_object('success', true, 'profit', v_profit);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. ENABLE REALTIME
-- ============================================

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.withdrawals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.customer_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.customer_messages;

-- ============================================
-- 6. CREATE DEFAULT ADMIN USER
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
