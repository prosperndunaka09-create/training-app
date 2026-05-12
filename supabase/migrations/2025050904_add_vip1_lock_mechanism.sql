-- Add VIP1 lock mechanism fields
-- This migration adds fields to support locking VIP1 personal accounts
-- until their linked VIP2 training account completes the full 2-phase training cycle

-- Add tasks_locked field to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS tasks_locked BOOLEAN DEFAULT false;

-- Add linked_training_account_id field to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS linked_training_account_id TEXT;

-- Create index on linked_training_account_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_linked_training_account_id ON users(linked_training_account_id);

-- Add comment to explain the fields
COMMENT ON COLUMN users.tasks_locked IS 'Indicates if tasks are locked for VIP1 accounts. Locked until linked VIP2 training account completes full 2-phase cycle.';
COMMENT ON COLUMN users.linked_training_account_id IS 'ID of the linked VIP2 training account. When this account completes training, the VIP1 account will be unlocked.';

-- Create a function to unlock VIP1 accounts when linked training completes
CREATE OR REPLACE FUNCTION unlock_vip1_on_training_complete()
RETURNS TRIGGER AS $$
BEGIN
  -- If a VIP2 training account just completed Phase 2
  IF NEW.training_completed_v2 = true AND OLD.training_completed_v2 = false THEN
    -- Find all VIP1 accounts that have this training account as their linked account
    UPDATE users 
    SET 
      tasks_locked = false,
      linked_training_account_id = NULL,
      updated_at = NOW()
    WHERE 
      linked_training_account_id = NEW.id 
      AND account_type = 'personal' 
      AND vip_level = 1;
    
    RAISE NOTICE 'Unlocked VIP1 accounts linked to training account %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the unlock function
DROP TRIGGER IF EXISTS trigger_unlock_vip1_on_training_complete ON users;
CREATE TRIGGER trigger_unlock_vip1_on_training_complete
  AFTER UPDATE OF training_completed_v2 ON users
  FOR EACH ROW
  EXECUTE FUNCTION unlock_vip1_on_training_complete();

-- Create a function to link VIP1 accounts to VIP2 training accounts on registration
CREATE OR REPLACE FUNCTION link_vip1_to_training_account()
RETURNS TRIGGER AS $$
DECLARE
  referrer_id TEXT;
BEGIN
  -- If this is a VIP1 personal account with a referral code
  IF NEW.account_type = 'personal' AND NEW.vip_level = 1 AND NEW.referred_by IS NOT NULL THEN
    -- Find the VIP2 training account that used this personal account's referral code
    SELECT id INTO referrer_id
    FROM users
    WHERE 
      referral_code = NEW.referred_by 
      AND account_type = 'training' 
      AND vip_level = 2;
    
    -- If a matching training account exists, link them
    IF referrer_id IS NOT NULL THEN
      UPDATE users
      SET 
        linked_training_account_id = referrer_id,
        tasks_locked = true,
        updated_at = NOW()
      WHERE id = NEW.id;
      
      RAISE NOTICE 'Linked VIP1 account % to training account %', NEW.id, referrer_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the link function
DROP TRIGGER IF EXISTS trigger_link_vip1_to_training_account ON users;
CREATE TRIGGER trigger_link_vip1_to_training_account
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION link_vip1_to_training_account();
