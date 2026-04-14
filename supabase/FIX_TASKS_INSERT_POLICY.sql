-- ============================================
-- FIX: Add INSERT policy for tasks table
-- Allows users to create their own tasks during registration
-- ============================================

-- Enable RLS on tasks table
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing insert policy if it exists
DROP POLICY IF EXISTS "tasks_insert_own" ON public.tasks;

-- Create INSERT policy - users can only insert tasks for themselves
CREATE POLICY "tasks_insert_own"
ON public.tasks
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Ensure select policy exists (read own tasks)
DROP POLICY IF EXISTS "tasks_select_own" ON public.tasks;
CREATE POLICY "tasks_select_own"
ON public.tasks
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Allow update on own tasks
DROP POLICY IF EXISTS "tasks_update_own" ON public.tasks;
CREATE POLICY "tasks_update_own"
ON public.tasks
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Verify policies
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'tasks' AND schemaname = 'public';
