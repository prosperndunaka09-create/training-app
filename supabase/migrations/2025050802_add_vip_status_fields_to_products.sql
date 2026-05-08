-- ============================================
-- ADD VIP LEVEL AND STATUS FIELDS TO TRAINING PRODUCTS
-- ============================================

-- Add vip_level column (TEXT: 'vip1', 'vip2', 'vip3', etc.)
ALTER TABLE training_products
ADD COLUMN IF NOT EXISTS vip_level TEXT DEFAULT 'vip2';

-- Add status column (TEXT: 'active', 'inactive', 'draft')
ALTER TABLE training_products
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Update existing products to have default values
UPDATE training_products
SET vip_level = 'vip2', status = 'active'
WHERE vip_level IS NULL OR status IS NULL;

-- Add check constraint for valid status values
ALTER TABLE training_products
ADD CONSTRAINT training_products_status_check
CHECK (status IN ('active', 'inactive', 'draft'));

-- Add check constraint for valid vip_level values
ALTER TABLE training_products
ADD CONSTRAINT training_products_vip_level_check
CHECK (vip_level IN ('vip1', 'vip2', 'vip3', 'vip4', 'vip5'));

-- Create index for faster filtering by status
CREATE INDEX IF NOT EXISTS idx_training_products_status ON training_products(status);

-- Create index for faster filtering by vip_level
CREATE INDEX IF NOT EXISTS idx_training_products_vip_level ON training_products(vip_level);
