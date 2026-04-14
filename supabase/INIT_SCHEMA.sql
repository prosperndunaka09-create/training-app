-- ============================================
-- INITIAL DATABASE SCHEMA FOR NEW PROJECT
-- earnings-live (Singapore)
-- ============================================

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    phone TEXT,
    account_type TEXT DEFAULT 'personal',
    user_status TEXT DEFAULT 'active',
    vip_level INTEGER DEFAULT 1,
    balance DECIMAL DEFAULT 0,
    total_earned DECIMAL DEFAULT 0,
    referral_code TEXT UNIQUE,
    training_completed BOOLEAN DEFAULT false,
    training_progress INTEGER DEFAULT 0,
    training_phase INTEGER DEFAULT 1,
    tasks_completed INTEGER DEFAULT 0,
    trigger_task_number INTEGER,
    has_pending_order BOOLEAN DEFAULT false,
    pending_amount DECIMAL DEFAULT 0,
    is_negative_balance BOOLEAN DEFAULT false,
    profit_added BOOLEAN DEFAULT false,
    pending_product TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- WALLETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id),
    wallet_address TEXT NOT NULL,
    wallet_type TEXT NOT NULL,
    chain TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TRANSACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id),
    type TEXT NOT NULL,
    amount DECIMAL NOT NULL,
    status TEXT DEFAULT 'pending',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- WITHDRAWALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id),
    amount DECIMAL NOT NULL,
    wallet_address TEXT NOT NULL,
    chain TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- DEPOSITS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.deposits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id),
    amount DECIMAL NOT NULL,
    wallet_address TEXT NOT NULL,
    chain TEXT NOT NULL,
    tx_hash TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id),
    product_name TEXT NOT NULL,
    amount DECIMAL NOT NULL,
    commission DECIMAL NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TASKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_number INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    product_image TEXT,
    commission_rate DECIMAL NOT NULL,
    min_vip_level INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TRAINING ACCOUNTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.training_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id),
    task_number INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    amount DECIMAL NOT NULL,
    commission DECIMAL NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CUSTOMER CONVERSATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.customer_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id),
    title TEXT,
    status TEXT DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CUSTOMER MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.customer_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.customer_conversations(id),
    user_id UUID NOT NULL REFERENCES public.users(id),
    content TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CUSTOMER SERVICE TICKETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.customer_service_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id),
    subject TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'open',
    priority TEXT DEFAULT 'medium',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CUSTOMER SERVICE MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.customer_service_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.customer_service_tickets(id),
    user_id UUID NOT NULL REFERENCES public.users(id),
    content TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ADMIN LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.admin_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id TEXT,
    action TEXT NOT NULL,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TELEGRAM CHAT MAPPINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.telegram_chat_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id),
    telegram_chat_id TEXT NOT NULL,
    telegram_username TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_service_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_service_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_chat_mappings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CREATE POLICIES (Authenticated Only)
-- ============================================

-- Users can only access their own data
CREATE POLICY "users_select_own" ON public.users FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "users_update_own" ON public.users FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Wallets
CREATE POLICY "wallets_select_own" ON public.wallets FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "wallets_insert_own" ON public.wallets FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Transactions
CREATE POLICY "transactions_select_own" ON public.transactions FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Withdrawals
CREATE POLICY "withdrawals_select_own" ON public.withdrawals FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "withdrawals_insert_own" ON public.withdrawals FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Deposits
CREATE POLICY "deposits_select_own" ON public.deposits FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "deposits_insert_own" ON public.deposits FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Orders
CREATE POLICY "orders_select_own" ON public.orders FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Training Accounts
CREATE POLICY "training_accounts_select_auth" ON public.training_accounts FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "training_accounts_insert_auth" ON public.training_accounts FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- Tasks (public read)
CREATE POLICY "tasks_select_all" ON public.tasks FOR SELECT TO authenticated USING (true);

-- Customer Conversations
CREATE POLICY "conversations_select_own" ON public.customer_conversations FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "conversations_insert_own" ON public.customer_conversations FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Customer Messages
CREATE POLICY "messages_select_own" ON public.customer_messages FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "messages_insert_own" ON public.customer_messages FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Customer Service Tickets
CREATE POLICY "tickets_select_own" ON public.customer_service_tickets FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "tickets_insert_own" ON public.customer_service_tickets FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Telegram Chat Mappings
CREATE POLICY "telegram_mappings_select_own" ON public.telegram_chat_mappings FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ============================================
-- INSERT DEFAULT TASKS
-- ============================================
INSERT INTO public.tasks (task_number, product_name, product_image, commission_rate, min_vip_level) VALUES
(1, 'iPhone 15 Pro', 'https://images.unsplash.com/photo-1696446702183-cbd13d78e1f7?w=400', 2.5, 1),
(2, 'MacBook Pro', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400', 3.0, 1),
(3, 'AirPods Pro', 'https://images.unsplash.com/photo-1603351154351-5cfb3d04ef32?w=400', 2.0, 1),
(4, 'iPad Air', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400', 2.5, 1),
(5, 'Apple Watch', 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=400', 2.0, 1),
(6, 'Samsung S24', 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400', 2.5, 1),
(7, 'Sony WH-1000XM5', 'https://images.unsplash.com/photo-1618366712010-b4fafdc8d6b9?w=400', 2.0, 1),
(8, 'Nintendo Switch', 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=400', 2.5, 1),
(9, 'PlayStation 5', 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400', 3.0, 1),
(10, 'Xbox Series X', 'https://images.unsplash.com/photo-1605901309584-818e25960a8f?w=400', 3.0, 1);

-- ============================================
-- CREATE ADMIN USER (Default)
-- ============================================
-- This will be created via the app when you register first
-- The first user can be made admin manually via SQL if needed
