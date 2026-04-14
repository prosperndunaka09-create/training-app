-- ============================================
-- FIX TASKS TABLE SCHEMA
-- Add missing columns for user dashboard
-- ============================================

-- Add missing columns to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS product_price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS reward NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Create index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);

-- Update RLS policies for tasks table
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON public.tasks;

-- Create new policies
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

-- Admin policy for tasks
DROP POLICY IF EXISTS "Admin full access on tasks" ON public.tasks;
CREATE POLICY "Admin full access on tasks"
ON public.tasks
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

COMMENT ON TABLE public.tasks IS 'User tasks with product pricing and rewards';
