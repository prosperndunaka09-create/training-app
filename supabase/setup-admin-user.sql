-- Setup Admin User for Supabase Login
-- Run this in Supabase SQL Editor to create/update admin user

-- First ensure all required columns exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'personal';
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_status TEXT DEFAULT 'active';

-- Create or update admin user with password "081677"
INSERT INTO users (
    id, 
    email, 
    display_name, 
    password_hash, 
    account_type, 
    user_status, 
    vip_level, 
    training_completed,
    balance,
    created_at,
    updated_at
)
VALUES (
    '00000000-0000-0000-0000-000000000001', 
    'admin@optimize.com', 
    'Administrator', 
    '081677',  -- Admin password
    'admin', 
    'active', 
    2, 
    true,
    0,
    NOW(),
    NOW()
)
ON CONFLICT (email) 
DO UPDATE SET 
    password_hash = '081677',
    account_type = 'admin',
    display_name = 'Administrator',
    user_status = 'active',
    updated_at = NOW();

-- Verify admin user exists
SELECT id, email, display_name, account_type, user_status 
FROM users 
WHERE email = 'admin@optimize.com';
