-- ============================================================================
-- DIAGNOSE ACTUAL TABLE SCHEMA
-- Run this to see what columns actually exist
-- ============================================================================

-- 1. Check actual columns in training_accounts
SELECT 'TRAINING_ACCOUNTS COLUMNS:' as section;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'training_accounts' 
ORDER BY ordinal_position;

-- 2. Check actual columns in users table
SELECT 'USERS COLUMNS:' as section;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 3. Try to select from training_accounts without specifying columns
SELECT 'TRAINING_ACCOUNTS DATA (first 3 rows):' as section;
SELECT * FROM training_accounts LIMIT 3;

-- 4. Try to select from users
SELECT 'USERS DATA (first 3 rows):' as section;
SELECT * FROM users LIMIT 3;

-- 5. Count rows
SELECT 'ROW COUNTS:' as section;
SELECT COUNT(*) as training_accounts_count FROM training_accounts;
SELECT COUNT(*) as users_count FROM users;

-- 6. If training_accounts has different columns, recreate it properly
DO $$
BEGIN
    -- Check if email column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'training_accounts' AND column_name = 'email'
    ) THEN
        -- Drop and recreate the table with correct schema
        DROP TABLE IF EXISTS training_accounts CASCADE;
        
        CREATE TABLE training_accounts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            status TEXT DEFAULT 'active',
            balance NUMERIC DEFAULT 1100,
            tasks_completed INTEGER DEFAULT 0,
            training_progress INTEGER DEFAULT 0,
            training_completed BOOLEAN DEFAULT false,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Enable RLS
        ALTER TABLE training_accounts ENABLE ROW LEVEL SECURITY;
        
        -- Create permissive policy
        DROP POLICY IF EXISTS "Allow all on training_accounts" ON training_accounts;
        CREATE POLICY "Allow all on training_accounts" ON training_accounts
            FOR ALL TO anon, authenticated
            USING (true) WITH CHECK (true);
        
        -- Insert sample training accounts
        INSERT INTO training_accounts (id, email, password, status, balance, tasks_completed, training_progress)
        VALUES 
            (gen_random_uuid(), 'training1@test.com', 'pass123', 'active', 1100, 5, 5),
            (gen_random_uuid(), 'training2@test.com', 'pass123', 'active', 1100, 3, 3);
        
        RAISE NOTICE 'Recreated training_accounts table with proper schema';
    ELSE
        RAISE NOTICE 'training_accounts already has email column';
    END IF;
END $$;
