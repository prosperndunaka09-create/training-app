-- Add unique constraint for referral codes
ALTER TABLE users ADD CONSTRAINT unique_referral_code UNIQUE (referral_code);

-- Add fields for Phase 2 checkpoint tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS training_phase_2_checkpoint JSONB DEFAULT '{"status": "pending", "cleared_at": null, "multiplier_applied": false}'::jsonb;

-- Add field to track second phase completion
ALTER TABLE users ADD COLUMN IF NOT EXISTS training_completed_v2 BOOLEAN DEFAULT false;

-- Add field to track if 2% commission has been transferred
ALTER TABLE users ADD COLUMN IF NOT EXISTS commission_transferred BOOLEAN DEFAULT false;

-- Add field to track commission transfer amount
ALTER TABLE users ADD COLUMN IF NOT EXISTS commission_transfer_amount DECIMAL(10, 2) DEFAULT 0.00;

-- Add field to track commission transfer timestamp
ALTER TABLE users ADD COLUMN IF NOT EXISTS commission_transferred_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add index for faster lookups on referral codes
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);

-- Add index for training completion tracking
CREATE INDEX IF NOT EXISTS idx_users_training_completed_v2 ON users(training_completed_v2) WHERE training_completed_v2 = true;

-- Create function to handle Phase 1 lock at 45/45
CREATE OR REPLACE FUNCTION check_phase_1_lock()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user is VIP2 training account and has completed 45 tasks in Phase 1
  IF NEW.vip_level = 2 AND NEW.account_type = 'training' AND NEW.training_phase = 1 THEN
    IF NEW.tasks_completed >= 45 AND OLD.tasks_completed < 45 THEN
      -- Lock the account - set a flag that requires admin reset
      NEW.training_phase_1_locked = true;
      NEW.training_phase_1_locked_at = NOW();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for Phase 1 lock
DROP TRIGGER IF EXISTS trigger_check_phase_1_lock ON users;
CREATE TRIGGER trigger_check_phase_1_lock
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION check_phase_1_lock();

-- Create function to handle Phase 2 checkpoint at task #30
CREATE OR REPLACE FUNCTION check_phase_2_checkpoint()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user is VIP2 training account in Phase 2 and has reached task #30
  IF NEW.vip_level = 2 AND NEW.account_type = 'training' AND NEW.training_phase = 2 THEN
    IF NEW.tasks_completed >= 30 AND OLD.tasks_completed < 30 THEN
      -- Trigger Phase 2 checkpoint modal
      NEW.training_phase_2_checkpoint = jsonb_build_object(
        'status', 'pending_review',
        'triggered_at', NOW(),
        'cleared_at', null,
        'multiplier_applied', false
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for Phase 2 checkpoint
DROP TRIGGER IF EXISTS trigger_check_phase_2_checkpoint ON users;
CREATE TRIGGER trigger_check_phase_2_checkpoint
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION check_phase_2_checkpoint();

-- Create function to apply 6x profit multiplier after Phase 2 checkpoint is cleared
CREATE OR REPLACE FUNCTION apply_phase_2_multiplier()
RETURNS TRIGGER AS $$
DECLARE
  multiplier DECIMAL := 6.0;
BEGIN
  -- Check if Phase 2 checkpoint was just cleared
  IF NEW.training_phase_2_checkpoint->>'status' = 'cleared' 
     AND OLD.training_phase_2_checkpoint->>'status' = 'pending_review' THEN
    -- Apply 6x multiplier to current balance
    NEW.balance = NEW.balance * multiplier;
    NEW.training_phase_2_checkpoint = jsonb_set(
      NEW.training_phase_2_checkpoint,
      '{multiplier_applied}',
      'true'::jsonb
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for Phase 2 multiplier
DROP TRIGGER IF EXISTS trigger_apply_phase_2_multiplier ON users;
CREATE TRIGGER trigger_apply_phase_2_multiplier
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION apply_phase_2_multiplier();

-- Create function to handle 2% commission transfer on training completion
CREATE OR REPLACE FUNCTION transfer_training_commission()
RETURNS TRIGGER AS $$
DECLARE
  personal_account RECORD;
  commission_amount DECIMAL(10, 2);
BEGIN
  -- Check if VIP2 training account just completed Phase 2 (45 tasks)
  IF NEW.vip_level = 2 AND NEW.account_type = 'training' 
     AND NEW.training_completed_v2 = true 
     AND OLD.training_completed_v2 = false 
     AND NEW.commission_transferred = false THEN
    
    -- Calculate 2% commission
    commission_amount = NEW.balance * 0.02;
    
    -- Find linked personal account using referred_by field
    IF NEW.referred_by IS NOT NULL THEN
      SELECT * INTO personal_account 
      FROM users 
      WHERE referral_code = NEW.referred_by 
      AND account_type = 'personal'
      LIMIT 1;
      
      IF personal_account.id IS NOT NULL THEN
        -- Transfer commission to personal account
        UPDATE users 
        SET balance = balance + commission_amount,
            total_earned = total_earned + commission_amount
        WHERE id = personal_account.id;
        
        -- Mark commission as transferred
        NEW.commission_transferred = true;
        NEW.commission_transfer_amount = commission_amount;
        NEW.commission_transferred_at = NOW();
        
        -- Log the transfer
        INSERT INTO transactions (user_id, amount, transaction_type, status, created_at)
        VALUES (personal_account.id, commission_amount, 'commission_transfer', 'completed', NOW());
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for commission transfer
DROP TRIGGER IF EXISTS trigger_transfer_training_commission ON users;
CREATE TRIGGER trigger_transfer_training_commission
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION transfer_training_commission();

-- Add missing column for Phase 1 lock tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS training_phase_1_locked BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS training_phase_1_locked_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
