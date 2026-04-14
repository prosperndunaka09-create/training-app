# Supabase Security Fix - Step by Step

## Project: angjecpibrcinclcepef
## Site: https://earnings.ink

---

## STEP 1: Go to Supabase SQL Editor

1. Open: https://app.supabase.com/project/angjecpibrcinclcepef
2. Left sidebar → **SQL Editor**
3. Click **"New query"**
4. Paste the SQL below

---

## STEP 2: Run Each Section Separately

### SECTION 1: Enable RLS on Tables
```sql
-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Enable RLS on training_accounts table
ALTER TABLE public.training_accounts ENABLE ROW LEVEL SECURITY;
```

### SECTION 2: Users Table Policies
```sql
-- Drop existing public policies
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
```

### SECTION 3: Training Accounts Policies
```sql
-- Drop existing public policies
DROP POLICY IF EXISTS "training_accounts_public_select" ON public.training_accounts;
DROP POLICY IF EXISTS "training_accounts_public_all" ON public.training_accounts;

-- SELECT: Authenticated users can view
CREATE POLICY "training_accounts_select_auth"
ON public.training_accounts
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- INSERT: Authenticated users can create
CREATE POLICY "training_accounts_insert_auth"
ON public.training_accounts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);
```

### SECTION 4: Deposits Policies
```sql
-- Drop existing public policies
DROP POLICY IF EXISTS "deposits_public_select" ON public.deposits;
DROP POLICY IF EXISTS "deposits_public_insert" ON public.deposits;
DROP POLICY IF EXISTS "deposits_public_all" ON public.deposits;

-- SELECT: Authenticated users can view
CREATE POLICY "deposits_select_auth"
ON public.deposits
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- INSERT: Authenticated users can create
CREATE POLICY "deposits_insert_auth"
ON public.deposits
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);
```

### SECTION 5: Customer Conversations Fix
```sql
-- Drop existing public policies
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
```

### SECTION 6: Customer Messages Fix
```sql
-- Drop existing public policies
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
```

### SECTION 7: Customer Service Messages Fix
```sql
-- Drop existing public policies
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
```

---

## STEP 3: Verify Security Fix

Run this query to check all policies:
```sql
SELECT 
    tablename,
    policyname,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## Expected Results

After running all sections, you should see:
- ✅ RLS enabled on: users, training_accounts
- ✅ All policies use `TO authenticated` (not public)
- ✅ No policies with "public" in the name

---

## Files Created

1. `SECURITY_FIX.sql` - Complete SQL file (all sections)
2. `SECURITY_FIX_STEPS.md` - This step-by-step guide

You can copy from either file to run in Supabase SQL Editor.
