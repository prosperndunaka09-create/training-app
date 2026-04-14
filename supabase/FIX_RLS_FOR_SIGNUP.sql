-- ============================================
-- FIX RLS POLICY FOR USER REGISTRATION
-- Allow new users to create their own profile
-- ============================================

-- 1. Enable RLS on users table (if not already)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing insert policy if it exists
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;

-- 3. Create new insert policy for signup
CREATE POLICY "Users can insert their own profile"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 4. Also ensure select/update policies exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 5. Admin policies (keep existing admin access)
DROP POLICY IF EXISTS "Admin full access" ON public.users;
CREATE POLICY "Admin full access"
ON public.users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND account_type = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND account_type = 'admin'
  )
);

-- 6. Allow service role to bypass RLS (for edge functions)
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;

COMMENT ON POLICY "Users can insert their own profile" IS 'Allows newly registered users to create their profile in the users table';
