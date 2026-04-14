-- ============================================
-- EMERGENCY SECURITY CLEANUP (FIXED)
-- Removes ALL dangerous public/anonymous policies
-- Project: angjecpibrcinclcepef
-- ============================================

-- ============================================
-- STEP 1: DROP ALL DANGEROUS PUBLIC/ANON POLICIES
-- ============================================

-- USERS TABLE - Remove anonymous access
DROP POLICY IF EXISTS "Allow anonymous inserts" ON public.users;
DROP POLICY IF EXISTS "Allow anonymous selects" ON public.users;
DROP POLICY IF EXISTS "Allow all operations on users" ON public.users;
DROP POLICY IF EXISTS "users_public_select" ON public.users;
DROP POLICY IF EXISTS "users_public_insert" ON public.users;
DROP POLICY IF EXISTS "users_public_update" ON public.users;
DROP POLICY IF EXISTS "users_public_delete" ON public.users;
DROP POLICY IF EXISTS "Users public access" ON public.users;

-- WITHDRAWALS TABLE - Remove public access
DROP POLICY IF EXISTS "Allow all operations on withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "withdrawals_public_select" ON public.withdrawals;
DROP POLICY IF EXISTS "withdrawals_public_insert" ON public.withdrawals;

-- WALLETS TABLE - Remove public access
DROP POLICY IF EXISTS "Allow all operations on wallets" ON public.wallets;
DROP POLICY IF EXISTS "wallets_public_select" ON public.wallets;
DROP POLICY IF EXISTS "wallets_public_insert" ON public.wallets;

-- TRANSACTIONS TABLE - Remove public access
DROP POLICY IF EXISTS "Allow all operations on transactions" ON public.transactions;
DROP POLICY IF EXISTS "transactions_public_select" ON public.transactions;
DROP POLICY IF EXISTS "transactions_public_insert" ON public.transactions;

-- TRAINING_ACCOUNTS TABLE - Remove public access
DROP POLICY IF EXISTS "Allow all on training_accounts" ON public.training_accounts;
DROP POLICY IF EXISTS "training_accounts_public_select" ON public.training_accounts;
DROP POLICY IF EXISTS "training_accounts_public_insert" ON public.training_accounts;
DROP POLICY IF EXISTS "training_accounts_public_update" ON public.training_accounts;

-- TASKS TABLE - Remove public access
DROP POLICY IF EXISTS "Allow authenticated read tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow authenticated insert tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow authenticated update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON public.tasks;
DROP POLICY IF EXISTS "System can insert tasks" ON public.tasks;
DROP POLICY IF EXISTS "tasks_public_select" ON public.tasks;
DROP POLICY IF EXISTS "tasks_public_insert" ON public.tasks;
DROP POLICY IF EXISTS "tasks_public_update" ON public.tasks;
DROP POLICY IF EXISTS "tasks_anon_select" ON public.tasks;
DROP POLICY IF EXISTS "tasks_anon_insert" ON public.tasks;

-- DEPOSITS TABLE - Remove public access
DROP POLICY IF EXISTS "Authenticated users can view deposits" ON public.deposits;
DROP POLICY IF EXISTS "Authenticated users can insert deposits" ON public.deposits;
DROP POLICY IF EXISTS "deposits_public_select" ON public.deposits;
DROP POLICY IF EXISTS "deposits_public_insert" ON public.deposits;
DROP POLICY IF EXISTS "deposits_public_all" ON public.deposits;

-- ORDERS TABLE - Remove public access
DROP POLICY IF EXISTS "Authenticated users can view orders" ON public.orders;
DROP POLICY IF EXISTS "orders_public_select" ON public.orders;
DROP POLICY IF EXISTS "orders_public_insert" ON public.orders;

-- CUSTOMER_SERVICE_TICKETS - Remove public access
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.customer_service_tickets;
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.customer_service_tickets;
DROP POLICY IF EXISTS "Users can create their own tickets" ON public.customer_service_tickets;
DROP POLICY IF EXISTS "Admins can update all tickets" ON public.customer_service_tickets;

-- CUSTOMER_SERVICE_MESSAGES - Remove public access
DROP POLICY IF EXISTS "Users can view messages from their tickets" ON public.customer_service_messages;
DROP POLICY IF EXISTS "Admins can view all messages" ON public.customer_service_messages;
DROP POLICY IF EXISTS "Users can insert messages to their tickets" ON public.customer_service_messages;
DROP POLICY IF EXISTS "Admins can insert messages to any ticket" ON public.customer_service_messages;
DROP POLICY IF EXISTS "customer_service_messages_public" ON public.customer_service_messages;
DROP POLICY IF EXISTS "customer_service_messages_public_select" ON public.customer_service_messages;
DROP POLICY IF EXISTS "customer_service_messages_public_insert" ON public.customer_service_messages;

-- CUSTOMER_CONVERSATIONS - Remove public access
DROP POLICY IF EXISTS "Allow all operations" ON public.customer_conversations;
DROP POLICY IF EXISTS "customer_conversations_public" ON public.customer_conversations;
DROP POLICY IF EXISTS "customer_conversations_public_select" ON public.customer_conversations;
DROP POLICY IF EXISTS "customer_conversations_public_insert" ON public.customer_conversations;

-- CUSTOMER_MESSAGES - Remove public access
DROP POLICY IF EXISTS "Allow all operations" ON public.customer_messages;
DROP POLICY IF EXISTS "customer_messages_public" ON public.customer_messages;
DROP POLICY IF EXISTS "customer_messages_public_select" ON public.customer_messages;
DROP POLICY IF EXISTS "customer_messages_public_insert" ON public.customer_messages;

-- TELEGRAM_CHAT_MAPPINGS
DROP POLICY IF EXISTS "Allow all operations" ON public.telegram_chat_mappings;

-- ADMIN_LOGS
DROP POLICY IF EXISTS "System can insert logs" ON public.admin_logs;

-- ============================================
-- STEP 2: ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_service_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_service_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_chat_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_training_progress ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 3: CREATE SAFE AUTHENTICATED-ONLY POLICIES
-- ============================================

-- USERS TABLE - Safe policies
CREATE POLICY "users_select_own"
ON public.users FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "users_update_own"
ON public.users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- WITHDRAWALS TABLE - Safe policies
CREATE POLICY "withdrawals_select_own"
ON public.withdrawals FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "withdrawals_insert_own"
ON public.withdrawals FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- WALLETS TABLE - Safe policies
CREATE POLICY "wallets_select_own"
ON public.wallets FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "wallets_update_own"
ON public.wallets FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- TRANSACTIONS TABLE - Safe policies
CREATE POLICY "transactions_select_own"
ON public.transactions FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "transactions_insert_own"
ON public.transactions FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- TRAINING_ACCOUNTS TABLE - Safe policies
CREATE POLICY "training_accounts_select_auth"
ON public.training_accounts FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "training_accounts_insert_auth"
ON public.training_accounts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- TASKS TABLE - Safe policies (read-only for users)
CREATE POLICY "tasks_select_auth"
ON public.tasks FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- DEPOSITS TABLE - Safe policies
CREATE POLICY "deposits_select_own"
ON public.deposits FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "deposits_insert_own"
ON public.deposits FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- ORDERS TABLE - Safe policies
CREATE POLICY "orders_select_own"
ON public.orders FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "orders_insert_own"
ON public.orders FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- CUSTOMER_SERVICE_TICKETS - Safe policies
CREATE POLICY "tickets_select_own"
ON public.customer_service_tickets FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "tickets_insert_own"
ON public.customer_service_tickets FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- CUSTOMER_SERVICE_MESSAGES - Safe policies
CREATE POLICY "service_messages_select_own"
ON public.customer_service_messages FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.customer_service_tickets t 
    WHERE t.id = ticket_id AND t.user_id = auth.uid()
));

CREATE POLICY "service_messages_insert_own"
ON public.customer_service_messages FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- CUSTOMER_CONVERSATIONS - Safe policies
CREATE POLICY "conversations_select_own"
ON public.customer_conversations FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "conversations_insert_own"
ON public.customer_conversations FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- CUSTOMER_MESSAGES - Safe policies
CREATE POLICY "messages_select_own"
ON public.customer_messages FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR conversation_id IN (
    SELECT id FROM public.customer_conversations WHERE user_id = auth.uid()
));

CREATE POLICY "messages_insert_own"
ON public.customer_messages FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- TRAINING_TASKS TABLE - Safe policies (read-only)
CREATE POLICY "training_tasks_select_auth"
ON public.training_tasks FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- USER_TRAINING_PROGRESS TABLE - Safe policies
CREATE POLICY "training_progress_select_own"
ON public.user_training_progress FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "training_progress_update_own"
ON public.user_training_progress FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- TELEGRAM_CHAT_MAPPINGS - Safe policies
CREATE POLICY "telegram_mappings_select_own"
ON public.telegram_chat_mappings FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- ADMIN_LOGS - Restricted (service role only via backend)
-- No direct client access policy

-- ============================================
-- VERIFICATION QUERY
-- ============================================

SELECT 
    tablename,
    policyname,
    roles::text,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
