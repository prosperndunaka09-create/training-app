-- ============================================
-- FINAL CLEANUP - Remove ALL dangerous policies
-- Target exact policy names from your database
-- ============================================

-- ============================================
-- STEP 1: DROP ALL POLICIES BY EXACT NAMES
-- ============================================

-- USERS TABLE - Drop ALL existing policies first
DROP POLICY IF EXISTS "Allow all operations on users" ON public.users;
DROP POLICY IF EXISTS "Allow anonymous inserts" ON public.users;
DROP POLICY IF EXISTS "Allow anonymous selects" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated inserts" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated selects" ON public.users;
DROP POLICY IF EXISTS "Allow users to update own data" ON public.users;
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;

-- WITHDRAWALS TABLE
DROP POLICY IF EXISTS "Allow all operations on withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "withdrawals_select_own" ON public.withdrawals;
DROP POLICY IF EXISTS "withdrawals_insert_own" ON public.withdrawals;

-- WALLETS TABLE
DROP POLICY IF EXISTS "Allow all operations on wallets" ON public.wallets;
DROP POLICY IF EXISTS "wallets_select_own" ON public.wallets;

-- TRANSACTIONS TABLE
DROP POLICY IF EXISTS "Allow all operations on transactions" ON public.transactions;
DROP POLICY IF EXISTS "System can insert transactions" ON public.transactions;
DROP POLICY IF EXISTS "transactions_select_own" ON public.transactions;
DROP POLICY IF EXISTS "transactions_insert_own" ON public.transactions;

-- TRAINING_ACCOUNTS TABLE
DROP POLICY IF EXISTS "Allow all on training_accounts" ON public.training_accounts;
DROP POLICY IF EXISTS "training_accounts_select_auth" ON public.training_accounts;
DROP POLICY IF EXISTS "training_accounts_insert_auth" ON public.training_accounts;

-- DEPOSITS TABLE
DROP POLICY IF EXISTS "Authenticated users can view deposits" ON public.deposits;
DROP POLICY IF EXISTS "Authenticated users can insert deposits" ON public.deposits;
DROP POLICY IF EXISTS "deposits_select_own" ON public.deposits;
DROP POLICY IF EXISTS "deposits_insert_own" ON public.deposits;

-- ORDERS TABLE
DROP POLICY IF EXISTS "Authenticated users can view orders" ON public.orders;
DROP POLICY IF EXISTS "orders_select_own" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_own" ON public.orders;

-- TASKS TABLE
DROP POLICY IF EXISTS "Allow authenticated update tasks" ON public.tasks;
DROP POLICY IF EXISTS "System can insert tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON public.tasks;
DROP POLICY IF EXISTS "tasks_select_auth" ON public.tasks;

-- CUSTOMER_SERVICE_TICKETS
DROP POLICY IF EXISTS "Admins can update all tickets" ON public.customer_service_tickets;
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.customer_service_tickets;
DROP POLICY IF EXISTS "Users can create their own tickets" ON public.customer_service_tickets;
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.customer_service_tickets;
DROP POLICY IF EXISTS "tickets_select_own" ON public.customer_service_tickets;
DROP POLICY IF EXISTS "tickets_insert_own" ON public.customer_service_tickets;

-- CUSTOMER_SERVICE_MESSAGES
DROP POLICY IF EXISTS "Admins can insert messages to any ticket" ON public.customer_service_messages;
DROP POLICY IF EXISTS "Admins can view all messages" ON public.customer_service_messages;
DROP POLICY IF EXISTS "Users can insert messages to their tickets" ON public.customer_service_messages;
DROP POLICY IF EXISTS "Users can view messages from their tickets" ON public.customer_service_messages;
DROP POLICY IF EXISTS "service_messages_select_own" ON public.customer_service_messages;
DROP POLICY IF EXISTS "service_messages_insert_own" ON public.customer_service_messages;

-- CUSTOMER_CONVERSATIONS
DROP POLICY IF EXISTS "Allow all operations" ON public.customer_conversations;
DROP POLICY IF EXISTS "conversations_select_own" ON public.customer_conversations;
DROP POLICY IF EXISTS "conversations_insert_own" ON public.customer_conversations;

-- CUSTOMER_MESSAGES
DROP POLICY IF EXISTS "Allow all operations" ON public.customer_messages;
DROP POLICY IF EXISTS "messages_select_own" ON public.customer_messages;
DROP POLICY IF EXISTS "messages_insert_own" ON public.customer_messages;

-- TELEGRAM_CHAT_MAPPINGS
DROP POLICY IF EXISTS "Allow all operations" ON public.telegram_chat_mappings;
DROP POLICY IF EXISTS "telegram_mappings_select_own" ON public.telegram_chat_mappings;

-- ADMIN_LOGS
DROP POLICY IF EXISTS "Admins can view all logs" ON public.admin_logs;
DROP POLICY IF EXISTS "System can insert logs" ON public.admin_logs;

-- ============================================
-- STEP 2: ENABLE RLS WITH FORCE
-- ============================================

ALTER TABLE public.users FORCE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals FORCE ROW LEVEL SECURITY;
ALTER TABLE public.wallets FORCE ROW LEVEL SECURITY;
ALTER TABLE public.transactions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.training_accounts FORCE ROW LEVEL SECURITY;
ALTER TABLE public.deposits FORCE ROW LEVEL SECURITY;
ALTER TABLE public.orders FORCE ROW LEVEL SECURITY;
ALTER TABLE public.tasks FORCE ROW LEVEL SECURITY;
ALTER TABLE public.customer_service_tickets FORCE ROW LEVEL SECURITY;
ALTER TABLE public.customer_service_messages FORCE ROW LEVEL SECURITY;
ALTER TABLE public.customer_conversations FORCE ROW LEVEL SECURITY;
ALTER TABLE public.customer_messages FORCE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_chat_mappings FORCE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs FORCE ROW LEVEL SECURITY;

-- ============================================
-- STEP 3: CREATE ONLY SAFE POLICIES
-- ============================================

-- USERS TABLE - Only safe policies
CREATE POLICY "users_select_own"
ON public.users FOR SELECT
TO authenticated
USING (id = auth.uid()::text);

CREATE POLICY "users_update_own"
ON public.users FOR UPDATE
TO authenticated
USING (id = auth.uid()::text)
WITH CHECK (id = auth.uid()::text);

-- WITHDRAWALS TABLE
CREATE POLICY "withdrawals_select_own"
ON public.withdrawals FOR SELECT
TO authenticated
USING (user_id = auth.uid()::text);

CREATE POLICY "withdrawals_insert_own"
ON public.withdrawals FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid()::text);

-- WALLETS TABLE
CREATE POLICY "wallets_select_own"
ON public.wallets FOR SELECT
TO authenticated
USING (user_id = auth.uid()::text);

-- TRANSACTIONS TABLE
CREATE POLICY "transactions_select_own"
ON public.transactions FOR SELECT
TO authenticated
USING (user_id = auth.uid()::text);

-- TRAINING_ACCOUNTS TABLE
CREATE POLICY "training_accounts_select_auth"
ON public.training_accounts FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "training_accounts_insert_auth"
ON public.training_accounts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- DEPOSITS TABLE
CREATE POLICY "deposits_select_own"
ON public.deposits FOR SELECT
TO authenticated
USING (user_id = auth.uid()::text);

CREATE POLICY "deposits_insert_own"
ON public.deposits FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid()::text);

-- ORDERS TABLE
CREATE POLICY "orders_select_own"
ON public.orders FOR SELECT
TO authenticated
USING (user_id = auth.uid()::text);

-- TASKS TABLE
CREATE POLICY "tasks_select_auth"
ON public.tasks FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- CUSTOMER_CONVERSATIONS
CREATE POLICY "conversations_select_own"
ON public.customer_conversations FOR SELECT
TO authenticated
USING (user_id = auth.uid()::text);

CREATE POLICY "conversations_insert_own"
ON public.customer_conversations FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid()::text);

-- CUSTOMER_MESSAGES
CREATE POLICY "messages_select_own"
ON public.customer_messages FOR SELECT
TO authenticated
USING (user_id = auth.uid()::text);

CREATE POLICY "messages_insert_own"
ON public.customer_messages FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid()::text);

-- CUSTOMER_SERVICE_TICKETS
CREATE POLICY "tickets_select_own"
ON public.customer_service_tickets FOR SELECT
TO authenticated
USING (user_id = auth.uid()::text);

CREATE POLICY "tickets_insert_own"
ON public.customer_service_tickets FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid()::text);

-- CUSTOMER_SERVICE_MESSAGES
CREATE POLICY "service_messages_select_own"
ON public.customer_service_messages FOR SELECT
TO authenticated
USING (user_id = auth.uid()::text);

CREATE POLICY "service_messages_insert_own"
ON public.customer_service_messages FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid()::text);

-- TELEGRAM_CHAT_MAPPINGS
CREATE POLICY "telegram_mappings_select_own"
ON public.telegram_chat_mappings FOR SELECT
TO authenticated
USING (user_id = auth.uid()::text);

-- ADMIN_LOGS - Backend only, no client access
-- No policies created - access via service role only
