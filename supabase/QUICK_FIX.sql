-- ============================================
-- QUICK FIX - Safe for Production
-- ============================================

-- Step 1: Create admin_logs table fresh (ignore if exists)
CREATE TABLE IF NOT EXISTS public.admin_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create indexes (ignore if exist)
CREATE INDEX IF NOT EXISTS idx_admin_logs_user_id ON public.admin_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON public.admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON public.admin_logs(created_at);

-- Step 3: Enable RLS
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop and recreate policy safely
DO $$
BEGIN
    -- Try to drop policy if exists (ignore error)
    DROP POLICY IF EXISTS "Admins can view all logs" ON public.admin_logs;
    
    -- Create fresh policy
    CREATE POLICY "Admins can view all logs" ON public.admin_logs
        FOR ALL USING (auth.uid() IN (
            SELECT id FROM public.users WHERE account_type = 'admin'
        ));
EXCEPTION WHEN OTHERS THEN
    -- If any error, just create the policy
    CREATE POLICY "Admins can view all logs" ON public.admin_logs
        FOR ALL USING (auth.uid() IN (
            SELECT id FROM public.users WHERE account_type = 'admin'
        ));
END $$;

SELECT '✅ Admin logs fixed successfully!' as status;
