-- ============================================
-- TRAINING PRODUCTS TABLE
-- Stores all 45 training products for admin editing
-- ============================================

CREATE TABLE IF NOT EXISTS training_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_number INTEGER UNIQUE NOT NULL,
    product_name TEXT NOT NULL,
    brand TEXT,
    price NUMERIC NOT NULL,
    category TEXT,
    image TEXT,
    commission NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE training_products ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admins can manage training products" ON training_products
    FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE account_type = 'admin'));

-- Public can read
CREATE POLICY "Public can view training products" ON training_products
    FOR SELECT USING (true);

-- ============================================
-- SEED TRAINING PRODUCTS (45 products)
-- ============================================

INSERT INTO training_products (product_number, product_name, brand, price, category, image, commission) VALUES
(1, 'Nova Pro Headphones', 'AudioTech', 89.99, 'Audio', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787089125_7fb09f77.jpg', 15.00),
(2, 'Eclipse Wireless Buds', 'SoundCore', 49.99, 'Audio', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787082009_0270efe4.jpg', 8.00),
(3, 'Luxe Smartwatch Pro', 'ChronoTech', 129.99, 'Wearables', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787129845_314ae005.jpg', 22.00),
(4, 'Velocity Runner X', 'StridePro', 79.99, 'Footwear', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787181124_5bfe01ea.jpg', 12.00),
(5, 'AeroGlide Sneakers', 'FlexFit', 69.99, 'Footwear', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787181160_a55f4194.jpg', 10.00),
(6, 'Pulse Sport Shoes', 'RunElite', 89.99, 'Footwear', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787182124_f83fc6a1.jpg', 15.00),
(7, 'Elegance Tote Bag', 'LuxCraft', 59.99, 'Fashion', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787207165_96f32090.jpg', 9.00),
(8, 'Milano Crossbody', 'VogueHaus', 45.99, 'Fashion', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787206756_02ab622b.jpg', 7.00),
(9, 'Parisian Clutch', 'ChicMode', 39.99, 'Fashion', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787208836_6bed33bf.jpg', 6.00),
(10, 'Quantum Phone Ultra', 'TechVision', 349.99, 'Electronics', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787228845_8846c466.jpg', 50.00),
(11, 'NexGen Smartphone', 'InnoTech', 299.99, 'Electronics', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787228875_22deddf5.jpg', 45.00),
(12, 'Prism Phone Lite', 'PixelCore', 199.99, 'Electronics', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787228214_83ae7bac.jpg', 30.00),
(13, 'Aviator Gold Shades', 'OpticLux', 59.99, 'Accessories', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787293025_0eb30818.png', 9.00),
(14, 'Retro Classic Frames', 'VintageEye', 39.99, 'Accessories', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787294111_60cc7e3c.png', 6.00),
(15, 'Sport Shield Lens', 'ActiveView', 29.99, 'Accessories', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787297312_c22cfe12.png', 5.00),
(16, 'AirPod Max Elite', 'SoundWave', 99.99, 'Audio', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787324656_974c3fd9.jpg', 17.00),
(17, 'Crystal Clear Buds', 'PureAudio', 39.99, 'Audio', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787319217_3608a441.jpg', 6.00),
(18, 'Bass Boost Pods', 'DeepSound', 29.99, 'Audio', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787324035_89c94026.jpg', 5.00),
(19, 'Noir Essence Parfum', 'MaisonLux', 49.99, 'Beauty', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787341472_3444168c.jpg', 8.00),
(20, 'Amber Oud Reserve', 'FragranceCo', 69.99, 'Beauty', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787349749_f945ff9e.jpg', 11.00),
(21, 'Rose Gold Mist', 'PetalScent', 39.99, 'Beauty', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787349855_685c5231.jpg', 6.00),
(22, 'MechStrike RGB Board', 'KeyForge', 59.99, 'Tech', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787375145_9df53cc3.jpg', 9.00),
(23, 'TactileType Pro', 'SwitchCraft', 49.99, 'Tech', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787371308_5751966c.jpg', 8.00),
(24, 'Phantom Keys 60%', 'GhostBoard', 39.99, 'Tech', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787369611_dd23e2c4.jpg', 6.00),
(25, 'Viper X Gaming Mouse', 'ClickForce', 29.99, 'Gaming', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787407963_baffffe3.jpg', 5.00),
(26, 'Stealth Ergo Mouse', 'ProGrip', 24.99, 'Gaming', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787405290_e248a39d.jpg', 4.00),
(27, 'Apex Precision Mouse', 'AimTech', 34.99, 'Gaming', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787402492_78e0000f.jpg', 5.00),
(28, 'Heritage Bifold Wallet', 'LeatherCo', 34.99, 'Accessories', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787426896_6aef43d7.jpg', 5.00),
(29, 'Slim Card Holder', 'MinimalWear', 19.99, 'Accessories', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787426601_23fa6276.jpg', 3.00),
(30, 'FitBand Ultra', 'VitalTrack', 79.99, 'Wearables', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787444470_809c5d8f.jpg', 13.00),
(31, 'PulseTrack Slim', 'HealthSync', 59.99, 'Wearables', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787446440_a77aea1d.jpg', 9.00),
(32, 'Studio Monitor Pro', 'AudioTech', 119.99, 'Audio', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787089125_7fb09f77.jpg', 20.00),
(33, 'Titanium Watch Elite', 'ChronoTech', 149.99, 'Wearables', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787129845_314ae005.jpg', 25.00),
(34, 'Zenith Phone Max', 'TechVision', 399.99, 'Electronics', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787228845_8846c466.jpg', 60.00),
(35, 'Royal Oud Intense', 'MaisonLux', 79.99, 'Beauty', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787349749_f945ff9e.jpg', 13.00),
(36, 'Gaming Laptop Pro', 'GameTech', 1299.99, 'Electronics', 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400', 150.00),
(37, 'Wireless Earbuds Elite', 'AudioMax', 149.99, 'Audio', 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400', 22.00),
(38, 'Smart Home Hub', 'HomeTech', 199.99, 'Smart Home', 'https://images.unsplash.com/photo-1558089687-f282ffcbc126?w=400', 30.00),
(39, '4K Action Camera', 'ActionPro', 299.99, 'Electronics', 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400', 45.00),
(40, 'VR Headset Pro', 'VirtualTech', 499.99, 'Gaming', 'https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?w=400', 75.00),
(41, 'Drone Flyer X', 'SkyTech', 899.99, 'Electronics', 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400', 100.00),
(42, 'Smart Door Lock', 'SecureHome', 249.99, 'Smart Home', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', 35.00),
(43, 'Portable Projector', 'CinemaTech', 399.99, 'Electronics', 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400', 60.00),
(44, 'Electric Toothbrush', 'DentalPro', 89.99, 'Health', 'https://images.unsplash.com/photo-1559671088-795c4b25565d?w=400', 13.00),
(45, 'Coffee Maker Deluxe', 'BrewMaster', 179.99, 'Kitchen', 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=400', 25.00)
ON CONFLICT (product_number) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_training_products_product_number ON training_products(product_number);
