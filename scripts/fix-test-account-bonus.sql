-- Fix checkpoint bonus_amount for test account (water@gmail.com)
-- This updates the stored bonus from 2104.87 to 1052.43

-- Step 1: Find user ID by email
-- Run this first to get the user ID
-- SELECT id FROM auth.users WHERE email = 'water@gmail.com';

-- Step 2: Update the checkpoint bonus_amount
-- Replace <USER_ID> with the actual user ID from step 1
-- UPDATE phase2_checkpoints 
-- SET bonus_amount = 1052.43 
-- WHERE auth_user_id = '<USER_ID>' 
-- AND status = 'approved';

-- Combined query (run this after confirming user ID):
UPDATE phase2_checkpoints 
SET bonus_amount = 1052.43 
WHERE auth_user_id = (SELECT id FROM auth.users WHERE email = 'water@gmail.com')
AND status = 'approved';

-- Verify the update
SELECT id, auth_user_id, task_number, bonus_amount, status 
FROM phase2_checkpoints 
WHERE auth_user_id = (SELECT id FROM auth.users WHERE email = 'water@gmail.com')
AND status = 'approved';
