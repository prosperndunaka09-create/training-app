-- ============================================
-- FIX: Create tasks for users who have none
-- Run this to generate tasks for existing users with 0 tasks
-- ============================================

-- Create a function to generate tasks for a user
CREATE OR REPLACE FUNCTION create_tasks_for_user(p_user_id UUID, p_task_count INTEGER DEFAULT 35)
RETURNS INTEGER AS $$
DECLARE
    v_created_count INTEGER := 0;
    v_existing_count INTEGER;
    v_vip_level INTEGER;
    v_account_type TEXT;
BEGIN
    -- Check if user already has tasks
    SELECT COUNT(*) INTO v_existing_count 
    FROM public.tasks 
    WHERE user_id = p_user_id;
    
    IF v_existing_count > 0 THEN
        RETURN 0; -- User already has tasks
    END IF;
    
    -- Get user's VIP level and account type
    SELECT vip_level, account_type 
    INTO v_vip_level, v_account_type
    FROM public.users 
    WHERE id = p_user_id;
    
    v_vip_level := COALESCE(v_vip_level, 1);
    
    -- Insert tasks for this user
    INSERT INTO public.tasks (user_id, task_number, reward, status, product_name, product_price)
    SELECT 
        p_user_id,
        i,
        -- Calculate reward based on VIP level (0.5% commission for personal accounts)
        ROUND((50 + (random() * 100)) * 0.005 * (1 + ((random() - 0.5) * 0.2)), 2),
        CASE WHEN i = 1 THEN 'pending' ELSE 'locked' END,
        'Training Product ' || i,
        50 + floor(random() * 100)::INTEGER
    FROM generate_series(1, p_task_count) AS i;
    
    GET DIAGNOSTICS v_created_count = ROW_COUNT;
    
    RETURN v_created_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create tasks for all users who have no tasks
DO $$
DECLARE
    v_user RECORD;
    v_created INTEGER;
    v_total_created INTEGER := 0;
BEGIN
    FOR v_user IN 
        SELECT u.id, u.email, u.display_name
        FROM public.users u
        LEFT JOIN (
            SELECT user_id, COUNT(*) as task_count 
            FROM public.tasks 
            GROUP BY user_id
        ) t ON u.id = t.user_id
        WHERE t.task_count IS NULL OR t.task_count = 0
    LOOP
        v_created := create_tasks_for_user(v_user.id, 35);
        v_total_created := v_total_created + v_created;
        
        RAISE NOTICE 'Created % tasks for user: % (%)', v_created, v_user.email, v_user.display_name;
    END LOOP;
    
    RAISE NOTICE '=== TOTAL: Created % tasks across all users ===', v_total_created;
END $$;

-- Verify results
SELECT 
    u.email,
    u.display_name,
    COUNT(t.id) as task_count
FROM public.users u
LEFT JOIN public.tasks t ON u.id = t.user_id
GROUP BY u.id, u.email, u.display_name
ORDER BY task_count ASC;
