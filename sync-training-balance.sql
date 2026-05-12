-- Sync training account balances: update users.balance to include initial training capital (1100) + earned rewards
-- This fixes existing training accounts where users.balance is out of sync with training_accounts.amount

-- Update users.balance for all training accounts to include initial capital + earned rewards
-- Note: total_earned should remain as training_accounts.amount (earned rewards only, not including initial capital)
UPDATE users
SET
  balance = 1100 + COALESCE(training_accounts.amount, 0),
  updated_at = NOW()
FROM training_accounts
WHERE users.id = training_accounts.auth_user_id
  AND users.account_type = 'training';

-- Verify the results
SELECT
  u.email,
  u.account_type,
  u.balance as users_balance,
  ta.amount as training_accounts_earned,
  (1100 + COALESCE(ta.amount, 0)) as expected_balance,
  u.total_earned,
  u.commission_transferred
FROM users u
LEFT JOIN training_accounts ta ON u.id = ta.auth_user_id
WHERE u.account_type = 'training'
ORDER BY u.email;
