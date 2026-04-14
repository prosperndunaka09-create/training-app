-- ============================================
-- SUPABASE SECURITY FIX - Complete RLS Setup
-- Project: angjecpibrcinclcepef
-- Date: 2025-04-11
-- ============================================

-- ============================================
-- 1. ENABLE RLS ON TABLES
-- ============================================

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Enable RLS on training_accounts table
ALTER TABLE public.training_accounts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. USERS TABLE POLICIES (Authenticated Only)
-- ============================================

-- Drop existing public policies if any
DROP POLICY IF EXISTS "Users public access" ON public.users;
DROP POLICY IF EXISTS "users_public_select" ON public.users;
DROP POLICY IF EXISTS "users_public_all" ON public.users;

-- SELECT: Users can view their own data
CREATE POLICY "users_select_own"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- UPDATE: Users can update their own data
CREATE POLICY "users_update_own"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ============================================
-- 3. TRAINING_ACCOUNTS TABLE POLICIES (Authenticated Only)
-- ============================================

-- Drop existing public policies if any
DROP POLICY IF EXISTS "training_accounts_public_select" ON public.training_accounts;
DROP POLICY IF EXISTS "training_accounts_public_all" ON public.training_accounts;

-- SELECT: Authenticated users can view training accounts
CREATE POLICY "training_accounts_select_auth"
ON public.training_accounts
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- INSERT: Authenticated users can create training accounts
CREATE POLICY "training_accounts_insert_auth"
ON public.training_accounts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: Authenticated users can update training accounts
CREATE POLICY "training_accounts_update_auth"
ON public.training_accounts
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- 4. DEPOSITS TABLE POLICIES (Authenticated Only)
-- ============================================

-- Drop existing public policies if any
DROP POLICY IF EXISTS "deposits_public_select" ON public.deposits;
DROP POLICY IF EXISTS "deposits_public_insert" ON public.deposits;
DROP POLICY IF EXISTS "deposits_public_all" ON public.deposits;

-- SELECT: Authenticated users can view deposits
CREATE POLICY "deposits_select_auth"
ON public.deposits
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- INSERT: Authenticated users can create deposits
CREATE POLICY "deposits_insert_auth"
ON public.deposits
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- 5. CUSTOMER_CONVERSATIONS POLICY FIX
-- ============================================

-- Drop existing public policy
DROP POLICY IF EXISTS "customer_conversations_public" ON public.customer_conversations;
DROP POLICY IF EXISTS "customer_conversations_public_select" ON public.customer_conversations;
DROP POLICY IF EXISTS "customer_conversations_public_insert" ON public.customer_conversations;

-- SELECT: Authenticated only
CREATE POLICY "customer_conversations_select_auth"
ON public.customer_conversations
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- INSERT: Authenticated only
CREATE POLICY "customer_conversations_insert_auth"
ON public.customer_conversations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: Authenticated only
CREATE POLICY "customer_conversations_update_auth"
ON public.customer_conversations
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- 6. CUSTOMER_MESSAGES POLICY FIX
-- ============================================

-- Drop existing public policy
DROP POLICY IF EXISTS "customer_messages_public" ON public.customer_messages;
DROP POLICY IF EXISTS "customer_messages_public_select" ON public.customer_messages;
DROP POLICY IF EXISTS "customer_messages_public_insert" ON public.customer_messages;

-- SELECT: Authenticated only
CREATE POLICY "customer_messages_select_auth"
ON public.customer_messages
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- INSERT: Authenticated only
CREATE POLICY "customer_messages_insert_auth"
ON public.customer_messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: Authenticated only
CREATE POLICY "customer_messages_update_auth"
ON public.customer_messages
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- 7. CUSTOMER_SERVICE_MESSAGES POLICY FIX
-- ============================================

-- Drop existing public policy
DROP POLICY IF EXISTS "customer_service_messages_public" ON public.customer_service_messages;
DROP POLICY IF EXISTS "customer_service_messages_public_select" ON public.customer_service_messages;
DROP POLICY IF EXISTS "customer_service_messages_public_insert" ON public.customer_service_messages;

-- SELECT: Authenticated only
CREATE POLICY "customer_service_messages_select_auth"
ON public.customer_service_messages
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- INSERT: Authenticated only
CREATE POLICY "customer_service_messages_insert_auth"
ON public.customer_service_messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: Authenticated only (for admin replies)
CREATE POLICY "customer_service_messages_update_auth"
ON public.customer_service_messages
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- VERIFICATION QUERIES (Run these to verify)
-- ============================================

-- Check RLS is enabled on tables
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    forcerowsecurity
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename IN ('users', 'training_accounts', 'deposits', 'customer_conversations', 'customer_messages', 'customer_service_messages');

-- Check policies exist
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
