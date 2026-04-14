-- ============================================
-- EMERGENCY CLEANUP - Run This First
-- ============================================

-- Drop all potentially conflicting objects
DROP TABLE IF EXISTS public.admin_logs CASCADE;
DROP FUNCTION IF EXISTS log_admin_action CASCADE;
DROP FUNCTION IF EXISTS admin_clear_pending_order CASCADE;
DROP FUNCTION IF EXISTS create_pending_order CASCADE;
DROP FUNCTION IF EXISTS clear_pending_order_and_add_profit CASCADE;
DROP FUNCTION IF EXISTS complete_task_and_update_balance CASCADE;

-- Drop all policies on admin_logs (if table exists in some form)
DO $$
BEGIN
    -- Drop all policies that might reference admin_logs
    DROP POLICY IF EXISTS "Admins can view all logs" ON public.admin_logs;
    DROP POLICY IF EXISTS "Users can view own logs" ON public.admin_logs;
EXCEPTION WHEN OTHERS THEN
    -- Ignore errors if policies don't exist
    NULL;
END $$;

-- Now run the full setup
\i FINAL_SETUP.sql
