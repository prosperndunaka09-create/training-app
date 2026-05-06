-- Product Catalog Schema for EARNINGSLLC
-- Training: 45 products | Personal: 35 products

-- ===========================================
-- TRAINING PRODUCTS TABLE (45 products)
-- ===========================================
CREATE TABLE IF NOT EXISTS training_products (
    id TEXT PRIMARY KEY, -- t1, t2, ... t45
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    image TEXT NOT NULL,
    product_number INTEGER NOT NULL CHECK (product_number >= 1 AND product_number <= 45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- PERSONAL PRODUCTS TABLE (35 products)
-- ===========================================
CREATE TABLE IF NOT EXISTS personal_products (
    id TEXT PRIMARY KEY, -- p1, p2, ... p35
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    image TEXT NOT NULL,
    product_number INTEGER NOT NULL CHECK (product_number >= 1 AND product_number <= 35),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- INDEXES FOR PERFORMANCE
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_training_products_category ON training_products(category);
CREATE INDEX IF NOT EXISTS idx_training_products_number ON training_products(product_number);
CREATE INDEX IF NOT EXISTS idx_personal_products_category ON personal_products(category);
CREATE INDEX IF NOT EXISTS idx_personal_products_number ON personal_products(product_number);

-- ===========================================
-- ENABLE ROW LEVEL SECURITY
-- ===========================================
ALTER TABLE training_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_products ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- RLS POLICIES - Allow read access to authenticated users
-- ===========================================

-- Training Products: Anyone can read, only admin can modify
CREATE POLICY "Anyone can read training products" ON training_products
    FOR SELECT USING (true);

CREATE POLICY "Admins can insert training products" ON training_products
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.email = 'admin@optimize.com'
        )
    );

CREATE POLICY "Admins can update training products" ON training_products
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.email = 'admin@optimize.com'
        )
    );

CREATE POLICY "Admins can delete training products" ON training_products
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.email = 'admin@optimize.com'
        )
    );

-- Personal Products: Anyone can read, only admin can modify
CREATE POLICY "Anyone can read personal products" ON personal_products
    FOR SELECT USING (true);

CREATE POLICY "Admins can insert personal products" ON personal_products
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.email = 'admin@optimize.com'
        )
    );

CREATE POLICY "Admins can update personal products" ON personal_products
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.email = 'admin@optimize.com'
        )
    );

CREATE POLICY "Admins can delete personal products" ON personal_products
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.email = 'admin@optimize.com'
        )
    );

-- ===========================================
-- FUNCTION TO UPDATE updated_at TIMESTAMP
-- ===========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_training_products_updated_at ON training_products;
CREATE TRIGGER update_training_products_updated_at
    BEFORE UPDATE ON training_products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_personal_products_updated_at ON personal_products;
CREATE TRIGGER update_personal_products_updated_at
    BEFORE UPDATE ON personal_products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- SEED DATA - DEFAULT TRAINING PRODUCTS (45)
-- ===========================================
INSERT INTO training_products (id, name, brand, price, category, image, product_number) VALUES
('t1', 'Nova Pro Headphones', 'AudioTech', 89.99, 'Audio', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787089125_7fb09f77.jpg', 1),
('t2', 'Eclipse Wireless Buds', 'SoundCore', 49.99, 'Audio', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787082009_0270efe4.jpg', 2),
('t3', 'Luxe Smartwatch Pro', 'ChronoTech', 129.99, 'Wearables', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787129845_314ae005.jpg', 3),
('t4', 'Velocity Runner X', 'StridePro', 79.99, 'Footwear', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787181124_5bfe01ea.jpg', 4),
('t5', 'AeroGlide Sneakers', 'FlexFit', 69.99, 'Footwear', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787181160_a55f4194.jpg', 5),
('t6', 'Pulse Sport Shoes', 'RunElite', 89.99, 'Footwear', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787182124_f83fc6a1.jpg', 6),
('t7', 'Elegance Tote Bag', 'LuxCraft', 59.99, 'Fashion', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787207165_96f32090.jpg', 7),
('t8', 'Milano Crossbody', 'VogueHaus', 45.99, 'Fashion', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787206756_02ab622b.jpg', 8),
('t9', 'Parisian Clutch', 'ChicMode', 39.99, 'Fashion', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787208836_6bed33bf.jpg', 9),
('t10', 'Quantum Phone Ultra', 'TechVision', 349.99, 'Electronics', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787228845_8846c466.jpg', 10),
('t11', 'NexGen Smartphone', 'InnoTech', 299.99, 'Electronics', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787228875_22deddf5.jpg', 11),
('t12', 'Prism Phone Lite', 'PixelCore', 199.99, 'Electronics', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787228214_83ae7bac.jpg', 12),
('t13', 'Aviator Gold Shades', 'OpticLux', 59.99, 'Accessories', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787293025_0eb30818.png', 13),
('t14', 'Retro Classic Frames', 'VintageEye', 39.99, 'Accessories', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787294111_60cc7e3c.png', 14),
('t15', 'Sport Shield Lens', 'ActiveView', 29.99, 'Accessories', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787297312_c22cfe12.png', 15),
('t16', 'AirPod Max Elite', 'SoundWave', 99.99, 'Audio', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787324656_974c3fd9.jpg', 16),
('t17', 'Crystal Clear Buds', 'PureAudio', 39.99, 'Audio', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787319217_3608a441.jpg', 17),
('t18', 'Bass Boost Pods', 'DeepSound', 29.99, 'Audio', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787324035_89c94026.jpg', 18),
('t19', 'Noir Essence Parfum', 'MaisonLux', 49.99, 'Beauty', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787341472_3444168c.jpg', 19),
('t20', 'Amber Oud Reserve', 'FragranceCo', 69.99, 'Beauty', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787349749_f945ff9e.jpg', 20),
('t21', 'Rose Gold Mist', 'PetalScent', 39.99, 'Beauty', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787349855_685c5231.jpg', 21),
('t22', 'MechStrike RGB Board', 'KeyForge', 59.99, 'Tech', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787375145_9df53cc3.jpg', 22),
('t23', 'TactileType Pro', 'SwitchCraft', 49.99, 'Tech', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787371308_5751966c.jpg', 23),
('t24', 'Phantom Keys 60%', 'GhostBoard', 39.99, 'Tech', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787369611_dd23e2c4.jpg', 24),
('t25', 'Viper X Gaming Mouse', 'ClickForce', 29.99, 'Gaming', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787407963_baffffe3.jpg', 25),
('t26', 'Stealth Ergo Mouse', 'ProGrip', 24.99, 'Gaming', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787405290_e248a39d.jpg', 26),
('t27', 'Apex Precision Mouse', 'AimTech', 34.99, 'Gaming', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787402492_78e0000f.jpg', 27),
('t28', 'Heritage Bifold Wallet', 'LeatherCo', 34.99, 'Accessories', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787426896_6aef43d7.jpg', 28),
('t29', 'Slim Card Holder', 'MinimalWear', 19.99, 'Accessories', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787426601_23fa6276.jpg', 29),
('t30', 'FitBand Ultra', 'VitalTrack', 79.99, 'Wearables', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787444470_809c5d8f.jpg', 30),
('t31', 'PulseTrack Slim', 'HealthSync', 59.99, 'Wearables', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787446440_a77aea1d.jpg', 31),
('t32', 'Studio Monitor Pro', 'AudioTech', 119.99, 'Audio', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787089125_7fb09f77.jpg', 32),
('t33', 'Titanium Watch Elite', 'ChronoTech', 149.99, 'Wearables', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787129845_314ae005.jpg', 33),
('t34', 'Zenith Phone Max', 'TechVision', 399.99, 'Electronics', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787228845_8846c466.jpg', 34),
('t35', 'Royal Oud Intense', 'MaisonLux', 79.99, 'Beauty', 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787349749_f945ff9e.jpg', 35),
('t36', 'Gaming Laptop Pro', 'GameTech', 1299.99, 'Electronics', 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400', 36),
('t37', 'Wireless Earbuds Elite', 'AudioMax', 149.99, 'Audio', 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400', 37),
('t38', 'Smart Home Hub', 'HomeTech', 199.99, 'Smart Home', 'https://images.unsplash.com/photo-1558089687-f282ffcbc126?w=400', 38),
('t39', '4K Action Camera', 'ActionPro', 299.99, 'Electronics', 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400', 39),
('t40', 'VR Headset Pro', 'VirtualTech', 499.99, 'Gaming', 'https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?w=400', 40),
('t41', 'Drone Flyer X', 'SkyTech', 899.99, 'Electronics', 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400', 41),
('t42', 'Smart Door Lock', 'SecureHome', 249.99, 'Smart Home', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', 42),
('t43', 'Portable Projector', 'CinemaTech', 399.99, 'Electronics', 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400', 43),
('t44', 'Electric Toothbrush', 'DentalPro', 89.99, 'Health', 'https://images.unsplash.com/photo-1559671088-795c4b25565d?w=400', 44),
('t45', 'Coffee Maker Deluxe', 'BrewMaster', 179.99, 'Kitchen', 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=400', 45)
ON CONFLICT (id) DO NOTHING;

-- ===========================================
-- SEED DATA - DEFAULT PERSONAL PRODUCTS (35)
-- ===========================================
INSERT INTO personal_products (id, name, brand, price, category, image, product_number) VALUES
('p1', 'iPhone 14 Pro Max', 'Apple', 1099.99, 'Electronics', 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400', 1),
('p2', 'iPhone 16 Pro', 'Apple', 1199.99, 'Electronics', 'https://images.unsplash.com/photo-1696446702183-cbd13c0c4a27?w=400', 2),
('p3', 'Samsung Galaxy S24', 'Samsung', 999.99, 'Electronics', 'https://images.unsplash.com/photo-1610945265078-3858a0828671?w=400', 3),
('p4', 'MacBook Air M3', 'Apple', 1299.99, 'Electronics', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca4?w=400', 4),
('p5', 'iPad Pro 12.9', 'Apple', 1099.99, 'Electronics', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400', 5),
('p6', 'AirPods Pro 2', 'Apple', 249.99, 'Audio', 'https://images.unsplash.com/photo-1603351154351-5cfb3d04ef32?w=400', 6),
('p7', 'Sony WH-1000XM5', 'Sony', 399.99, 'Audio', 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400', 7),
('p8', 'Apple Watch Ultra', 'Apple', 799.99, 'Wearables', 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=400', 8),
('p9', 'Rolex Submariner', 'Rolex', 8950.00, 'Luxury', 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=400', 9),
('p10', 'Rolex Daytona', 'Rolex', 12500.00, 'Luxury', 'https://images.unsplash.com/photo-1622434641406-a158123450f9?w=400', 10),
('p11', 'Louis Vuitton Bag', 'Louis Vuitton', 2850.00, 'Luxury', 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400', 11),
('p12', 'Gucci Handbag', 'Gucci', 2300.00, 'Luxury', 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400', 12),
('p13', 'Premium Leather Briefcase', 'Coach', 495.00, 'Accessories', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400', 13),
('p14', 'Luxury Leather Wallet', 'Montblanc', 385.00, 'Accessories', 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400', 14),
('p15', 'Designer Leather Jacket', 'AllSaints', 520.00, 'Fashion', 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400', 15),
('p16', 'Nike Air Jordan 1', 'Nike', 180.00, 'Footwear', 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400', 16),
('p17', 'Adidas Yeezy Boost', 'Adidas', 220.00, 'Footwear', 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=400', 17),
('p18', 'New Balance 990', 'New Balance', 184.99, 'Footwear', 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400', 18),
('p19', 'Sony PlayStation 5', 'Sony', 499.99, 'Gaming', 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400', 19),
('p20', 'Xbox Series X', 'Microsoft', 499.99, 'Gaming', 'https://images.unsplash.com/photo-1605901309584-818e25960a8f?w=400', 20),
('p21', 'Nintendo Switch OLED', 'Nintendo', 349.99, 'Gaming', 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=400', 21),
('p22', 'Dyson Vacuum V15', 'Dyson', 749.99, 'Home', 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400', 22),
('p23', 'Dyson Airwrap', 'Dyson', 599.99, 'Beauty', 'https://images.unsplash.com/photo-1522338140262-f46f9510963c?w=400', 23),
('p24', 'Samsung 4K TV 55"', 'Samsung', 899.99, 'Electronics', 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400', 24),
('p25', 'Canon EOS R6', 'Canon', 2499.99, 'Electronics', 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400', 25),
('p26', 'Bose SoundLink', 'Bose', 299.99, 'Audio', 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400', 26),
('p27', 'Fendi Peekaboo', 'Fendi', 3900.00, 'Luxury', 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400', 27),
('p28', 'Prada Galleria', 'Prada', 3200.00, 'Luxury', 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400', 28),
('p29', 'Chanel Classic Flap', 'Chanel', 8900.00, 'Luxury', 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400', 29),
('p30', 'Ray-Ban Aviator', 'Ray-Ban', 185.00, 'Accessories', 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400', 30),
('p31', 'Tiffany Necklace', 'Tiffany', 1250.00, 'Luxury', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400', 31),
('p32', 'Cartier Santos', 'Cartier', 6750.00, 'Luxury', 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=400', 32),
('p33', 'Omega Seamaster', 'Omega', 5200.00, 'Luxury', 'https://images.unsplash.com/photo-1622434641406-a158123450f9?w=400', 33),
('p34', 'Burberry Trench Coat', 'Burberry', 1890.00, 'Fashion', 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400', 34),
('p35', 'Canada Goose Parka', 'Canada Goose', 995.00, 'Fashion', 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400', 35)
ON CONFLICT (id) DO NOTHING;
