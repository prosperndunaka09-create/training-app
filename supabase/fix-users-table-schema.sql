-- Diagnostic: Check users table structure and fix missing columns
-- Run this in Supabase SQL Editor

-- 1. Check current table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 2. Add any missing columns that the app expects
-- These are all the columns the app tries to insert:

-- Already added: password
-- Already exists: email, display_name, account_type, vip_level, balance, total_earned
-- Check and add missing ones:

DO $$
BEGIN
    -- Add tasks_completed if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'tasks_completed') THEN
        ALTER TABLE users ADD COLUMN tasks_completed INTEGER DEFAULT 0;
    END IF;

    -- Add tasks_total if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'tasks_total') THEN
        ALTER TABLE users ADD COLUMN tasks_total INTEGER DEFAULT 45;
    END IF;

    -- Add referral_code if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'referral_code') THEN
        ALTER TABLE users ADD COLUMN referral_code VARCHAR(50);
    END IF;

    -- Add referred_by if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'referred_by') THEN
        ALTER TABLE users ADD COLUMN referred_by VARCHAR(50);
    END IF;

    -- Add training_completed if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'training_completed') THEN
        ALTER TABLE users ADD COLUMN training_completed BOOLEAN DEFAULT false;
    END IF;

    -- Add training_phase if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'training_phase') THEN
        ALTER TABLE users ADD COLUMN training_phase INTEGER DEFAULT 1;
    END IF;

    -- Add trigger_task_number if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'trigger_task_number') THEN
        ALTER TABLE users ADD COLUMN trigger_task_number INTEGER;
    END IF;

    -- Add has_pending_order if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'has_pending_order') THEN
        ALTER TABLE users ADD COLUMN has_pending_order BOOLEAN DEFAULT false;
    END IF;

    -- Add pending_amount if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'pending_amount') THEN
        ALTER TABLE users ADD COLUMN pending_amount DECIMAL(10,2) DEFAULT 0;
    END IF;

    -- Add is_negative_balance if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_negative_balance') THEN
        ALTER TABLE users ADD COLUMN is_negative_balance BOOLEAN DEFAULT false;
    END IF;

    -- Add profit_added if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'profit_added') THEN
        ALTER TABLE users ADD COLUMN profit_added BOOLEAN DEFAULT false;
    END IF;

    -- Add status if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'status') THEN
        ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active';
    END IF;

    -- Add created_at if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'created_at') THEN
        ALTER TABLE users ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- Add updated_at if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'updated_at') THEN
        ALTER TABLE users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 3. Verify final table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
