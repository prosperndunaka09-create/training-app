-- Fix RLS policies for training account creation
-- Run this in Supabase SQL Editor

-- Enable RLS on users table (if not already enabled)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow admin inserts" ON users;
DROP POLICY IF EXISTS "Allow public inserts for training accounts" ON users;
DROP POLICY IF EXISTS "Allow all inserts" ON users;

-- Create policy to allow inserts for account creation
-- This allows the frontend to create training accounts
CREATE POLICY "Allow all inserts for account creation"
ON users FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow select for login verification
DROP POLICY IF EXISTS "Allow select for login" ON users;
CREATE POLICY "Allow select for login"
ON users FOR SELECT
TO anon, authenticated
USING (true);

-- Verify the policies are created
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'users';
