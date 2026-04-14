// ===========================================
// SEPARATE PRODUCT CATALOGS
// Training: 45 products
// Personal: 35 products
// Total: 80 editable products
// ===========================================

export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  category: string;
  image: string;
}

// ===========================================
// DEFAULT TRAINING PRODUCTS (45 products)
// ===========================================
export const DEFAULT_TRAINING_PRODUCTS: Product[] = [
  { id: 't1', name: 'Nova Pro Headphones', brand: 'AudioTech', price: 89.99, category: 'Audio', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787089125_7fb09f77.jpg' },
  { id: 't2', name: 'Eclipse Wireless Buds', brand: 'SoundCore', price: 49.99, category: 'Audio', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787082009_0270efe4.jpg' },
  { id: 't3', name: 'Luxe Smartwatch Pro', brand: 'ChronoTech', price: 129.99, category: 'Wearables', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787129845_314ae005.jpg' },
  { id: 't4', name: 'Velocity Runner X', brand: 'StridePro', price: 79.99, category: 'Footwear', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787181124_5bfe01ea.jpg' },
  { id: 't5', name: 'AeroGlide Sneakers', brand: 'FlexFit', price: 69.99, category: 'Footwear', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787181160_a55f4194.jpg' },
  { id: 't6', name: 'Pulse Sport Shoes', brand: 'RunElite', price: 89.99, category: 'Footwear', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787182124_f83fc6a1.jpg' },
  { id: 't7', name: 'Elegance Tote Bag', brand: 'LuxCraft', price: 59.99, category: 'Fashion', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787207165_96f32090.jpg' },
  { id: 't8', name: 'Milano Crossbody', brand: 'VogueHaus', price: 45.99, category: 'Fashion', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787206756_02ab622b.jpg' },
  { id: 't9', name: 'Parisian Clutch', brand: 'ChicMode', price: 39.99, category: 'Fashion', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787208836_6bed33bf.jpg' },
  { id: 't10', name: 'Quantum Phone Ultra', brand: 'TechVision', price: 349.99, category: 'Electronics', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787228845_8846c466.jpg' },
  { id: 't11', name: 'NexGen Smartphone', brand: 'InnoTech', price: 299.99, category: 'Electronics', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787228875_22deddf5.jpg' },
  { id: 't12', name: 'Prism Phone Lite', brand: 'PixelCore', price: 199.99, category: 'Electronics', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787228214_83ae7bac.jpg' },
  { id: 't13', name: 'Aviator Gold Shades', brand: 'OpticLux', price: 59.99, category: 'Accessories', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787293025_0eb30818.png' },
  { id: 't14', name: 'Retro Classic Frames', brand: 'VintageEye', price: 39.99, category: 'Accessories', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787294111_60cc7e3c.png' },
  { id: 't15', name: 'Sport Shield Lens', brand: 'ActiveView', price: 29.99, category: 'Accessories', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787297312_c22cfe12.png' },
  { id: 't16', name: 'AirPod Max Elite', brand: 'SoundWave', price: 99.99, category: 'Audio', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787324656_974c3fd9.jpg' },
  { id: 't17', name: 'Crystal Clear Buds', brand: 'PureAudio', price: 39.99, category: 'Audio', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787319217_3608a441.jpg' },
  { id: 't18', name: 'Bass Boost Pods', brand: 'DeepSound', price: 29.99, category: 'Audio', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787324035_89c94026.jpg' },
  { id: 't19', name: 'Noir Essence Parfum', brand: 'MaisonLux', price: 49.99, category: 'Beauty', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787341472_3444168c.jpg' },
  { id: 't20', name: 'Amber Oud Reserve', brand: 'FragranceCo', price: 69.99, category: 'Beauty', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787349749_f945ff9e.jpg' },
  { id: 't21', name: 'Rose Gold Mist', brand: 'PetalScent', price: 39.99, category: 'Beauty', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787349855_685c5231.jpg' },
  { id: 't22', name: 'MechStrike RGB Board', brand: 'KeyForge', price: 59.99, category: 'Tech', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787375145_9df53cc3.jpg' },
  { id: 't23', name: 'TactileType Pro', brand: 'SwitchCraft', price: 49.99, category: 'Tech', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787371308_5751966c.jpg' },
  { id: 't24', name: 'Phantom Keys 60%', brand: 'GhostBoard', price: 39.99, category: 'Tech', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787369611_dd23e2c4.jpg' },
  { id: 't25', name: 'Viper X Gaming Mouse', brand: 'ClickForce', price: 29.99, category: 'Gaming', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787407963_baffffe3.jpg' },
  { id: 't26', name: 'Stealth Ergo Mouse', brand: 'ProGrip', price: 24.99, category: 'Gaming', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787405290_e248a39d.jpg' },
  { id: 't27', name: 'Apex Precision Mouse', brand: 'AimTech', price: 34.99, category: 'Gaming', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787402492_78e0000f.jpg' },
  { id: 't28', name: 'Heritage Bifold Wallet', brand: 'LeatherCo', price: 34.99, category: 'Accessories', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787426896_6aef43d7.jpg' },
  { id: 't29', name: 'Slim Card Holder', brand: 'MinimalWear', price: 19.99, category: 'Accessories', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787426601_23fa6276.jpg' },
  { id: 't30', name: 'FitBand Ultra', brand: 'VitalTrack', price: 79.99, category: 'Wearables', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787444470_809c5d8f.jpg' },
  { id: 't31', name: 'PulseTrack Slim', brand: 'HealthSync', price: 59.99, category: 'Wearables', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787446440_a77aea1d.jpg' },
  { id: 't32', name: 'Studio Monitor Pro', brand: 'AudioTech', price: 119.99, category: 'Audio', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787089125_7fb09f77.jpg' },
  { id: 't33', name: 'Titanium Watch Elite', brand: 'ChronoTech', price: 149.99, category: 'Wearables', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787129845_314ae005.jpg' },
  { id: 't34', name: 'Zenith Phone Max', brand: 'TechVision', price: 399.99, category: 'Electronics', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787228845_8846c466.jpg' },
  { id: 't35', name: 'Royal Oud Intense', brand: 'MaisonLux', price: 79.99, category: 'Beauty', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787349749_f945ff9e.jpg' },
  { id: 't36', name: 'Gaming Laptop Pro', brand: 'GameTech', price: 1299.99, category: 'Electronics', image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400' },
  { id: 't37', name: 'Wireless Earbuds Elite', brand: 'AudioMax', price: 149.99, category: 'Audio', image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400' },
  { id: 't38', name: 'Smart Home Hub', brand: 'HomeTech', price: 199.99, category: 'Smart Home', image: 'https://images.unsplash.com/photo-1558089687-f282ffcbc126?w=400' },
  { id: 't39', name: '4K Action Camera', brand: 'ActionPro', price: 299.99, category: 'Electronics', image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400' },
  { id: 't40', name: 'VR Headset Pro', brand: 'VirtualTech', price: 499.99, category: 'Gaming', image: 'https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?w=400' },
  { id: 't41', name: 'Drone Flyer X', brand: 'SkyTech', price: 899.99, category: 'Electronics', image: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400' },
  { id: 't42', name: 'Smart Door Lock', brand: 'SecureHome', price: 249.99, category: 'Smart Home', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400' },
  { id: 't43', name: 'Portable Projector', brand: 'CinemaTech', price: 399.99, category: 'Electronics', image: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400' },
  { id: 't44', name: 'Electric Toothbrush', brand: 'DentalPro', price: 89.99, category: 'Health', image: 'https://images.unsplash.com/photo-1559671088-795c4b25565d?w=400' },
  { id: 't45', name: 'Coffee Maker Deluxe', brand: 'BrewMaster', price: 179.99, category: 'Kitchen', image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=400' },
];

// ===========================================
// DEFAULT PERSONAL PRODUCTS (35 products)
// ===========================================
export const DEFAULT_PERSONAL_PRODUCTS: Product[] = [
  { id: 'p1', name: 'iPhone 14 Pro Max', brand: 'Apple', price: 1099.99, category: 'Electronics', image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400' },
  { id: 'p2', name: 'iPhone 16 Pro', brand: 'Apple', price: 1199.99, category: 'Electronics', image: 'https://images.unsplash.com/photo-1696446702183-cbd13c0c4a27?w=400' },
  { id: 'p3', name: 'Samsung Galaxy S24', brand: 'Samsung', price: 999.99, category: 'Electronics', image: 'https://images.unsplash.com/photo-1610945265078-3858a0828671?w=400' },
  { id: 'p4', name: 'MacBook Air M3', brand: 'Apple', price: 1299.99, category: 'Electronics', image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca4?w=400' },
  { id: 'p5', name: 'iPad Pro 12.9', brand: 'Apple', price: 1099.99, category: 'Electronics', image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400' },
  { id: 'p6', name: 'AirPods Pro 2', brand: 'Apple', price: 249.99, category: 'Audio', image: 'https://images.unsplash.com/photo-1603351154351-5cfb3d04ef32?w=400' },
  { id: 'p7', name: 'Sony WH-1000XM5', brand: 'Sony', price: 399.99, category: 'Audio', image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400' },
  { id: 'p8', name: 'Apple Watch Ultra', brand: 'Apple', price: 799.99, category: 'Wearables', image: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=400' },
  { id: 'p9', name: 'Rolex Submariner', brand: 'Rolex', price: 8950.00, category: 'Luxury', image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=400' },
  { id: 'p10', name: 'Rolex Daytona', brand: 'Rolex', price: 12500.00, category: 'Luxury', image: 'https://images.unsplash.com/photo-1622434641406-a158123450f9?w=400' },
  { id: 'p11', name: 'Louis Vuitton Bag', brand: 'Louis Vuitton', price: 2850.00, category: 'Luxury', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400' },
  { id: 'p12', name: 'Gucci Handbag', brand: 'Gucci', price: 2300.00, category: 'Luxury', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400' },
  { id: 'p13', name: 'Premium Leather Briefcase', brand: 'Coach', price: 495.00, category: 'Accessories', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400' },
  { id: 'p14', name: 'Luxury Leather Wallet', brand: 'Montblanc', price: 385.00, category: 'Accessories', image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400' },
  { id: 'p15', name: 'Designer Leather Jacket', brand: 'AllSaints', price: 520.00, category: 'Fashion', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400' },
  { id: 'p16', name: 'Nike Air Jordan 1', brand: 'Nike', price: 180.00, category: 'Footwear', image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400' },
  { id: 'p17', name: 'Adidas Yeezy Boost', brand: 'Adidas', price: 220.00, category: 'Footwear', image: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=400' },
  { id: 'p18', name: 'New Balance 990', brand: 'New Balance', price: 184.99, category: 'Footwear', image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400' },
  { id: 'p19', name: 'Sony PlayStation 5', brand: 'Sony', price: 499.99, category: 'Gaming', image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400' },
  { id: 'p20', name: 'Xbox Series X', brand: 'Microsoft', price: 499.99, category: 'Gaming', image: 'https://images.unsplash.com/photo-1605901309584-818e25960a8f?w=400' },
  { id: 'p21', name: 'Nintendo Switch OLED', brand: 'Nintendo', price: 349.99, category: 'Gaming', image: 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=400' },
  { id: 'p22', name: 'Dyson Vacuum V15', brand: 'Dyson', price: 749.99, category: 'Home', image: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400' },
  { id: 'p23', name: 'Dyson Airwrap', brand: 'Dyson', price: 599.99, category: 'Beauty', image: 'https://images.unsplash.com/photo-1522338140262-f46f9510963c?w=400' },
  { id: 'p24', name: 'Samsung 4K TV 55"', brand: 'Samsung', price: 899.99, category: 'Electronics', image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400' },
  { id: 'p25', name: 'Canon EOS R6', brand: 'Canon', price: 2499.99, category: 'Electronics', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400' },
  { id: 'p26', name: 'Bose SoundLink', brand: 'Bose', price: 299.99, category: 'Audio', image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400' },
  { id: 'p27', name: 'Fendi Peekaboo', brand: 'Fendi', price: 3900.00, category: 'Luxury', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400' },
  { id: 'p28', name: 'Prada Galleria', brand: 'Prada', price: 3200.00, category: 'Luxury', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400' },
  { id: 'p29', name: 'Chanel Classic Flap', brand: 'Chanel', price: 8900.00, category: 'Luxury', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400' },
  { id: 'p30', name: 'Ray-Ban Aviator', brand: 'Ray-Ban', price: 185.00, category: 'Accessories', image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400' },
  { id: 'p31', name: 'Tiffany Necklace', brand: 'Tiffany', price: 1250.00, category: 'Luxury', image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400' },
  { id: 'p32', name: 'Cartier Santos', brand: 'Cartier', price: 6750.00, category: 'Luxury', image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=400' },
  { id: 'p33', name: 'Omega Seamaster', brand: 'Omega', price: 5200.00, category: 'Luxury', image: 'https://images.unsplash.com/photo-1622434641406-a158123450f9?w=400' },
  { id: 'p34', name: 'Burberry Trench Coat', brand: 'Burberry', price: 1890.00, category: 'Fashion', image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400' },
  { id: 'p35', name: 'Canada Goose Parka', brand: 'Canada Goose', price: 995.00, category: 'Fashion', image: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400' },
];

// Storage keys
const TRAINING_PRODUCTS_KEY = 'training_products_catalog';
const PERSONAL_PRODUCTS_KEY = 'personal_products_catalog';

// ===========================================
// SERVICE FUNCTIONS
// ===========================================

export const ProductCatalogService = {
  // Get Training Products
  getTrainingProducts(): Product[] {
    if (typeof window === 'undefined') return DEFAULT_TRAINING_PRODUCTS;
    const stored = localStorage.getItem(TRAINING_PRODUCTS_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return DEFAULT_TRAINING_PRODUCTS;
      }
    }
    // Initialize with defaults
    localStorage.setItem(TRAINING_PRODUCTS_KEY, JSON.stringify(DEFAULT_TRAINING_PRODUCTS));
    return DEFAULT_TRAINING_PRODUCTS;
  },

  // Get Personal Products
  getPersonalProducts(): Product[] {
    if (typeof window === 'undefined') return DEFAULT_PERSONAL_PRODUCTS;
    const stored = localStorage.getItem(PERSONAL_PRODUCTS_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return DEFAULT_PERSONAL_PRODUCTS;
      }
    }
    // Initialize with defaults
    localStorage.setItem(PERSONAL_PRODUCTS_KEY, JSON.stringify(DEFAULT_PERSONAL_PRODUCTS));
    return DEFAULT_PERSONAL_PRODUCTS;
  },

  // Save Training Products
  saveTrainingProducts(products: Product[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TRAINING_PRODUCTS_KEY, JSON.stringify(products));
  },

  // Save Personal Products
  savePersonalProducts(products: Product[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(PERSONAL_PRODUCTS_KEY, JSON.stringify(products));
  },

  // Update single Training Product
  updateTrainingProduct(id: string, updates: Partial<Product>): Product[] {
    const products = this.getTrainingProducts();
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      products[index] = { ...products[index], ...updates };
      this.saveTrainingProducts(products);
    }
    return products;
  },

  // Update single Personal Product
  updatePersonalProduct(id: string, updates: Partial<Product>): Product[] {
    const products = this.getPersonalProducts();
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      products[index] = { ...products[index], ...updates };
      this.savePersonalProducts(products);
    }
    return products;
  },

  // Add Training Product
  addTrainingProduct(product: Omit<Product, 'id'>): Product[] {
    const products = this.getTrainingProducts();
    const newId = `t${products.length + 1}`;
    const newProduct = { ...product, id: newId };
    products.push(newProduct);
    this.saveTrainingProducts(products);
    return products;
  },

  // Add Personal Product
  addPersonalProduct(product: Omit<Product, 'id'>): Product[] {
    const products = this.getPersonalProducts();
    const newId = `p${products.length + 1}`;
    const newProduct = { ...product, id: newId };
    products.push(newProduct);
    this.savePersonalProducts(products);
    return products;
  },

  // Delete Training Product
  deleteTrainingProduct(id: string): Product[] {
    const products = this.getTrainingProducts().filter(p => p.id !== id);
    this.saveTrainingProducts(products);
    return products;
  },

  // Delete Personal Product
  deletePersonalProduct(id: string): Product[] {
    const products = this.getPersonalProducts().filter(p => p.id !== id);
    this.savePersonalProducts(products);
    return products;
  },

  // Reset to defaults
  resetTrainingProducts(): Product[] {
    this.saveTrainingProducts(DEFAULT_TRAINING_PRODUCTS);
    return DEFAULT_TRAINING_PRODUCTS;
  },

  resetPersonalProducts(): Product[] {
    this.savePersonalProducts(DEFAULT_PERSONAL_PRODUCTS);
    return DEFAULT_PERSONAL_PRODUCTS;
  },

  // Get product for task (cycles through catalog)
  getProductForTask(taskNumber: number, accountType: 'training' | 'personal'): Product {
    const catalog = accountType === 'training' 
      ? this.getTrainingProducts() 
      : this.getPersonalProducts();
    const index = (taskNumber - 1) % catalog.length;
    return catalog[index];
  },

  // Get all products count
  getStats() {
    return {
      trainingCount: this.getTrainingProducts().length,
      personalCount: this.getPersonalProducts().length,
      totalCount: this.getTrainingProducts().length + this.getPersonalProducts().length
    };
  }
};

export default ProductCatalogService;
