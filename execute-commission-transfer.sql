-- Manual balance correction - set to intended final values directly
-- This will:
-- 1. Set personal account balance to 51.13 (2% commission)
-- 2. Set training account balance to 2505.48 (remaining after commission)
-- 3. Keep commission_transferred = true

-- Update personal account (fire@gmail.com) to intended commission amount
UPDATE users
SET
  balance = 51.13,
  total_earned = 51.13,
  user_status = 'active',
  training_completed = true,
  commission_transferred = true,
  commission_transfer_amount = 51.13,
  commission_transferred_at = NOW(),
  updated_at = NOW()
WHERE email = 'fire@gmail.com' AND account_type = 'personal';

-- Update training account (water@gmail.com) to intended remaining balance
UPDATE users
SET
  balance = 2505.48,
  commission_transferred = true,
  commission_transfer_amount = 51.13,
  commission_transferred_at = NOW(),
  updated_at = NOW()
WHERE email = 'water@gmail.com' AND account_type = 'training';

-- Verify the results
SELECT
  email,
  account_type,
  balance,
  total_earned,
  commission_transferred,
  commission_transfer_amount,
  commission_transferred_at
FROM users
WHERE email IN ('fire@gmail.com', 'water@gmail.com')
ORDER BY account_type;
