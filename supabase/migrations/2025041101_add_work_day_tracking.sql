-- ============================================
-- WORK DAY TRACKING & PENDING ORDER ASSIGNMENT
-- For Day 2 Auto-trigger and Admin Assignment
-- ============================================

-- 1. ADD NEW COLUMNS TO USERS TABLE
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS current_work_day INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS successful_work_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_work_day_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_withdrawal_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS pending_order_assigned_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS pending_order_assigned_by UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS is_on_day_2 BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS day_2_pending_triggered BOOLEAN DEFAULT false;

-- 2. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_users_current_work_day ON public.users(current_work_day);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON public.users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_training_phase ON public.users(training_phase);
CREATE INDEX IF NOT EXISTS idx_users_is_on_day_2 ON public.users(is_on_day_2);

-- 3. CREATE FUNCTION TO TRACK SUCCESSFUL WORK DAY
CREATE OR REPLACE FUNCTION record_successful_work_day(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_current_day INTEGER;
    v_successful_days INTEGER;
BEGIN
    -- Get current values
    SELECT current_work_day, successful_work_days 
    INTO v_current_day, v_successful_days
    FROM public.users 
    WHERE id = p_user_id;
    
    -- Update user record
    UPDATE public.users 
    SET 
        successful_work_days = COALESCE(successful_work_days, 0) + 1,
        last_work_day_completed_at = NOW(),
        current_work_day = CASE 
            WHEN current_work_day = 1 THEN 2
            ELSE current_work_day
        END,
        is_on_day_2 = CASE 
            WHEN current_work_day = 1 THEN true
            ELSE is_on_day_2
        END,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    v_result := jsonb_build_object(
        'success', true,
        'previous_day', v_current_day,
        'new_day', CASE WHEN v_current_day = 1 THEN 2 ELSE v_current_day END,
        'total_successful_days', COALESCE(v_successful_days, 0) + 1,
        'message', 'Work day recorded successfully'
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. CREATE FUNCTION FOR ADMIN TO ASSIGN PENDING ORDER
CREATE OR REPLACE FUNCTION admin_assign_pending_order(
    p_admin_id UUID,
    p_user_id UUID,
    p_pending_amount NUMERIC,
    p_trigger_task_number INTEGER,
    p_product_name TEXT DEFAULT 'Combination Product',
    p_product_price NUMERIC DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_user_record RECORD;
    v_result JSONB;
    v_product_data JSONB;
BEGIN
    -- Verify admin
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = p_admin_id AND account_type = 'admin'
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Admin access required');
    END IF;
    
    -- Get user info
    SELECT * INTO v_user_record 
    FROM public.users 
    WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    -- Check if user already has pending order
    IF v_user_record.has_pending_order THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', 'User already has a pending order',
            'existing_amount', v_user_record.pending_amount
        );
    END IF;
    
    -- Build product data
    v_product_data := jsonb_build_object(
        'name', p_product_name,
        'price', COALESCE(p_product_price, p_pending_amount),
        'combination', true,
        'assigned_by_admin', true,
        'assigned_at', NOW()
    );
    
    -- Assign pending order
    UPDATE public.users 
    SET 
        has_pending_order = true,
        pending_amount = p_pending_amount,
        trigger_task_number = p_trigger_task_number,
        is_negative_balance = true,
        pending_product = v_product_data,
        pending_order_assigned_at = NOW(),
        pending_order_assigned_by = p_admin_id,
        balance = balance - p_pending_amount,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Create transaction record
    INSERT INTO public.transactions (
        user_id, type, amount, description, status, metadata
    ) VALUES (
        p_user_id,
        'combination_order',
        -p_pending_amount,
        'Combination order assigned by admin: ' || p_product_name,
        'completed',
        jsonb_build_object(
            'admin_id', p_admin_id,
            'product_name', p_product_name,
            'trigger_task', p_trigger_task_number,
            'assigned_manually', true
        )
    );
    
    -- Log admin action
    INSERT INTO public.admin_logs (action, user_id, admin_id, details)
    VALUES (
        'assign_pending_order',
        p_user_id,
        p_admin_id,
        jsonb_build_object(
            'pending_amount', p_pending_amount,
            'trigger_task_number', p_trigger_task_number,
            'product_name', p_product_name,
            'user_email', v_user_record.email,
            'user_referral_code', v_user_record.referral_code,
            'user_current_day', v_user_record.current_work_day,
            'user_training_phase', v_user_record.training_phase
        )
    );
    
    v_result := jsonb_build_object(
        'success', true,
        'user_id', p_user_id,
        'user_email', v_user_record.email,
        'referral_code', v_user_record.referral_code,
        'pending_amount', p_pending_amount,
        'trigger_task', p_trigger_task_number,
        'message', 'Pending order assigned successfully'
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. CREATE FUNCTION FOR DAY 2 AUTO-TRIGGER
CREATE OR REPLACE FUNCTION check_and_trigger_day2_pending()
RETURNS JSONB AS $$
DECLARE
    v_user RECORD;
    v_assigned_count INTEGER := 0;
    v_product_price NUMERIC;
BEGIN
    -- Find users on Day 2 who haven't had pending order triggered yet
    FOR v_user IN 
        SELECT * FROM public.users 
        WHERE is_on_day_2 = true 
        AND day_2_pending_triggered = false
        AND account_type = 'personal'
        AND current_work_day = 2
        AND has_pending_order = false
        AND last_work_day_completed_at IS NOT NULL
    LOOP
        -- Random amount between 50 and 200 for combination product
        v_product_price := 50 + (random() * 150)::NUMERIC;
        
        -- Trigger pending order
        UPDATE public.users 
        SET 
            has_pending_order = true,
            pending_amount = v_product_price,
            trigger_task_number = 15 + (random() * 20)::INTEGER, -- Random task between 15-35
            is_negative_balance = true,
            pending_product = jsonb_build_object(
                'name', 'Day 2 Premium Combination',
                'price', v_product_price,
                'combination', true,
                'auto_triggered', true,
                'day_2_special', true,
                'triggered_at', NOW()
            ),
            day_2_pending_triggered = true,
            balance = balance - v_product_price,
            updated_at = NOW()
        WHERE id = v_user.id;
        
        -- Create transaction record
        INSERT INTO public.transactions (
            user_id, type, amount, description, status, metadata
        ) VALUES (
            v_user.id,
            'combination_order',
            -v_product_price,
            'Day 2 combination product encountered',
            'completed',
            jsonb_build_object(
                'auto_triggered', true,
                'day_2_special', true,
                'trigger_task', 15 + (random() * 20)::INTEGER
            )
        );
        
        v_assigned_count := v_assigned_count + 1;
    END LOOP;
    
    RETURN jsonb_build_object(
        'success', true,
        'assigned_count', v_assigned_count,
        'message', format('Day 2 pending orders triggered for %s users', v_assigned_count)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. CREATE FUNCTION TO GET ALL USERS FOR ADMIN (WITH TRACKING INFO)
CREATE OR REPLACE FUNCTION get_users_with_tracking(p_admin_id UUID)
RETURNS TABLE (
    id UUID,
    email TEXT,
    display_name TEXT,
    referral_code TEXT,
    account_type TEXT,
    balance NUMERIC,
    vip_level INTEGER,
    training_phase INTEGER,
    tasks_completed INTEGER,
    current_work_day INTEGER,
    successful_work_days INTEGER,
    is_on_day_2 BOOLEAN,
    day_2_pending_triggered BOOLEAN,
    has_pending_order BOOLEAN,
    pending_amount NUMERIC,
    last_work_day_completed_at TIMESTAMP WITH TIME ZONE,
    pending_order_assigned_at TIMESTAMP WITH TIME ZONE,
    user_status TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- Verify admin
    IF NOT EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = p_admin_id AND u.account_type = 'admin'
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;
    
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.display_name,
        u.referral_code,
        u.account_type,
        u.balance,
        u.vip_level,
        u.training_phase,
        u.tasks_completed,
        u.current_work_day,
        u.successful_work_days,
        u.is_on_day_2,
        u.day_2_pending_triggered,
        u.has_pending_order,
        u.pending_amount,
        u.last_work_day_completed_at,
        u.pending_order_assigned_at,
        u.user_status,
        u.created_at
    FROM public.users u
    WHERE u.account_type != 'admin'
    ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. ENABLE RLS FOR NEW COLUMNS (already covered by existing policies)

COMMENT ON FUNCTION admin_assign_pending_order IS 'Allows admin to manually assign pending orders to specific users with full tracking';
COMMENT ON FUNCTION check_and_trigger_day2_pending IS 'Automatically triggers pending orders for users on Day 2';
COMMENT ON FUNCTION record_successful_work_day IS 'Records a successful work day and advances user to next day if applicable';
