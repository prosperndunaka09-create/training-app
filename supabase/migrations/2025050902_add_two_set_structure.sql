-- ============================================
-- TWO-SET TASK STRUCTURE
-- For Set 1 (0/35) and Set 2 (0/35) task progression
-- ============================================

-- Add current_task_set column to users table
-- Tracks which set the user is currently on (1 or 2)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS current_task_set INTEGER DEFAULT 1;

-- Add set_1_completed column to track when Set 1 was completed
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS set_1_completed_at TIMESTAMP WITH TIME ZONE;

-- Add set_2_completed column to track when Set 2 was completed
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS set_2_completed_at TIMESTAMP WITH TIME ZONE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_current_task_set ON public.users(current_task_set);

-- ============================================
-- FUNCTION TO AUTO-RESET FROM SET 1 TO SET 2
-- ============================================

CREATE OR REPLACE FUNCTION auto_reset_to_set_2(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_current_set INTEGER;
    v_tasks_completed INTEGER;
    v_current_phase INTEGER;
    v_result JSONB;
BEGIN
    -- Get current user state
    SELECT current_task_set, tasks_completed, training_phase
    INTO v_current_set, v_tasks_completed, v_current_phase
    FROM public.users 
    WHERE id = p_user_id;
    
    -- Only proceed if user is on Set 1 and has completed 35 tasks
    IF v_current_set = 1 AND v_tasks_completed >= 35 THEN
        -- Update user to Set 2
        UPDATE public.users 
        SET 
            current_task_set = 2,
            tasks_completed = 0,
            training_progress = 0,
            set_1_completed_at = NOW(),
            updated_at = NOW()
        WHERE id = p_user_id;
        
        -- Delete all existing tasks for this user
        DELETE FROM public.tasks 
        WHERE user_id = p_user_id;
        
        v_result := jsonb_build_object(
            'success', true,
            'message', 'Successfully reset from Set 1 to Set 2',
            'previous_set', 1,
            'new_set', 2,
            'set_1_completed_at', NOW()
        );
    ELSE
        v_result := jsonb_build_object(
            'success', false,
            'message', 'Conditions not met for Set 1 to Set 2 transition',
            'current_set', v_current_set,
            'tasks_completed', v_tasks_completed
        );
    END IF;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Two-set structure migration completed successfully!';
    RAISE NOTICE '📊 Added columns to users: current_task_set, set_1_completed_at, set_2_completed_at';
    RAISE NOTICE '🔧 Created function: auto_reset_to_set_2';
    RAISE NOTICE '📊 Created index: idx_users_current_task_set';
END $$;
