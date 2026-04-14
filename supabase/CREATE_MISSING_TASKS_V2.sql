-- ============================================
-- FIX: Create tasks for users who have none (WITH commission_rate)
-- ============================================

-- First check the tasks table structure
-- Then create function with all required columns
CREATE OR REPLACE FUNCTION create_tasks_for_user(p_user_id UUID, p_task_count INTEGER DEFAULT 35)
RETURNS INTEGER AS $$
DECLARE
    v_created_count INTEGER := 0;
    v_existing_count INTEGER;
BEGIN
    -- Check if user already has tasks
    SELECT COUNT(*) INTO v_existing_count 
    FROM public.tasks 
    WHERE user_id = p_user_id;
    
    IF v_existing_count > 0 THEN
        RETURN 0;
    END IF;
    
    -- Insert 35 tasks with ALL required columns
    INSERT INTO public.tasks (
        user_id, 
        task_number, 
        reward, 
        commission_rate,
        status, 
        product_name, 
        product_price,
        completed_at
    )
    SELECT 
        p_user_id,
        i,
        ROUND(((50 + (random() * 100)) * 0.005 * (1 + ((random() - 0.5) * 0.2)))::numeric, 2),
        0.005, -- 0.5% commission rate for VIP1 personal accounts
        CASE WHEN i = 1 THEN 'pending' ELSE 'locked' END,
        'Training Product ' || i::text,
        (50 + floor(random() * 100))::INTEGER,
        NULL -- completed_at is null for new tasks
    FROM generate_series(1, p_task_count) AS i;
    
    GET DIAGNOSTICS v_created_count = ROW_COUNT;
    RETURN v_created_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create tasks for ALL users with no tasks
DO $$
DECLARE
    v_user RECORD;
    v_created INTEGER;
BEGIN
    FOR v_user IN 
        SELECT u.id, u.email
        FROM public.users u
        LEFT JOIN public.tasks t ON u.id = t.user_id
        WHERE t.id IS NULL
    LOOP
        v_created := create_tasks_for_user(v_user.id, 35);
        RAISE NOTICE 'Created % tasks for: %', v_created, v_user.email;
    END LOOP;
END $$;

-- Show results
SELECT u.email, COUNT(t.id) as task_count
FROM public.users u
LEFT JOIN public.tasks t ON u.id = t.user_id
GROUP BY u.id, u.email
ORDER BY task_count ASC;
