-- Create withdrawals table if it doesn't exist
CREATE TABLE IF NOT EXISTS withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL DEFAULT 0,
    wallet_address TEXT NOT NULL,
    wallet_type TEXT DEFAULT 'TRC20',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    processed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    rejection_reason TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_created_at ON withdrawals(created_at);

-- Enable RLS
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Users can create withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Admins can manage all withdrawals" ON withdrawals;

-- Create policies
CREATE POLICY "Users can view own withdrawals" 
    ON withdrawals FOR SELECT 
    USING (user_id = auth.uid());

CREATE POLICY "Users can create withdrawals" 
    ON withdrawals FOR INSERT 
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all withdrawals" 
    ON withdrawals FOR ALL 
    USING (auth.uid() IN (SELECT id FROM users WHERE account_type = 'admin'));

-- Add some sample withdrawal data for testing
INSERT INTO withdrawals (user_id, amount, wallet_address, wallet_type, status, created_at)
SELECT 
    u.id,
    ROUND((RANDOM() * 100 + 10)::numeric, 2),
    'T' || SUBSTRING(MD5(RANDOM()::text), 1, 33),
    'TRC20',
    (ARRAY['pending', 'pending', 'completed', 'completed', 'rejected'])[FLOOR(RANDOM() * 5 + 1)],
    NOW() - INTERVAL '1 day' * FLOOR(RANDOM() * 30)
FROM users u
WHERE u.account_type != 'admin'
LIMIT 10
ON CONFLICT DO NOTHING;
