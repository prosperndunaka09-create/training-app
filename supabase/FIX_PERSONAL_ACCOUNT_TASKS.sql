-- Fix RLS policies for tasks table to allow personal accounts to create and view their tasks
-- This ensures personal accounts can have their 35 tasks created during registration

-- Drop all existing task policies
DROP POLICY IF EXISTS "Users can view own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON public.tasks;
DROP POLICY IF EXISTS "System can insert tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admin full access tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admins can view all tasks" ON public.tasks;
DROP POLICY IF EXISTS "tasks_select_auth" ON public.tasks;
DROP POLICY IF EXISTS "tasks_select_all" ON public.tasks;

-- Create new policies that work for both training and personal accounts
CREATE POLICY "Users can view own tasks"
ON public.tasks
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own tasks"
ON public.tasks
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own tasks"
ON public.tasks
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Admin policy for full access
CREATE POLICY "Admin full access tasks"
ON public.tasks
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND account_type = 'admin'
  )
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
