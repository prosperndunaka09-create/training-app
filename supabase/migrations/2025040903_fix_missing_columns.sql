-- Migration: Fix Missing Columns for Integration
-- Created: April 9, 2026
-- Purpose: Add columns that frontend expects but are missing from database

-- ============================================
-- FIX 1: Add missing columns to users table
-- ============================================

-- Add training_progress column (frontend expects this)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS training_progress INTEGER DEFAULT 0;

-- ============================================
-- FIX 2: Add missing columns to tasks table
-- ============================================

-- Add task_number column (frontend expects this)
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS task_number INTEGER DEFAULT 0;

-- Add description column (frontend expects this)
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';

-- Add completed_at column (frontend expects this)
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Add task_set column (frontend expects this - tracks phase 1 vs phase 2)
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS task_set INTEGER DEFAULT 0;

-- Add updated_at column with auto-update trigger
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create trigger to auto-update updated_at on tasks
CREATE OR REPLACE FUNCTION update_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS tasks_updated_at_trigger ON tasks;

-- Create the trigger
CREATE TRIGGER tasks_updated_at_trigger
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_tasks_updated_at();

-- ============================================
-- VERIFICATION: Check all columns now exist
-- ============================================

-- Users table columns
SELECT 'users' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('training_progress', 'tasks_completed', 'training_phase', 'training_completed', 'has_pending_order', 'pending_amount', 'is_negative_balance', 'profit_added')
ORDER BY column_name;

-- Tasks table columns
SELECT 'tasks' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tasks' 
ORDER BY ordinal_position;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ Migration completed successfully!';
    RAISE NOTICE '📊 Added columns to users: training_progress';
    RAISE NOTICE '📊 Added columns to tasks: task_number, description, completed_at, task_set, updated_at';
    RAISE NOTICE '🔧 Created trigger: tasks_updated_at_trigger';
END $$;
