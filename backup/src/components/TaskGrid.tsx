import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { CheckCircle, Lock, Zap, Loader2, DollarSign, Award, Star, ShoppingBag, Eye, Send, Sparkles, Package } from 'lucide-react';
import DailyBonus from './DailyBonus';
import { toast } from '@/components/ui/use-toast';



// Product data for each task
const PRODUCT_CATALOG = [
  { name: 'Nova Pro Headphones', brand: 'AudioTech', price: 299.99, category: 'Audio', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787089125_7fb09f77.jpg' },
  { name: 'Eclipse Wireless Buds', brand: 'SoundCore', price: 149.99, category: 'Audio', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787082009_0270efe4.jpg' },
  { name: 'Luxe Smartwatch Pro', brand: 'ChronoTech', price: 449.99, category: 'Wearables', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787129845_314ae005.jpg' },
  { name: 'Velocity Runner X', brand: 'StridePro', price: 189.99, category: 'Footwear', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787181124_5bfe01ea.jpg' },
  { name: 'AeroGlide Sneakers', brand: 'FlexFit', price: 159.99, category: 'Footwear', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787181160_a55f4194.jpg' },
  { name: 'Pulse Sport Shoes', brand: 'RunElite', price: 219.99, category: 'Footwear', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787182124_f83fc6a1.jpg' },
  { name: 'Elegance Tote Bag', brand: 'LuxCraft', price: 389.99, category: 'Fashion', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787207165_96f32090.jpg' },
  { name: 'Milano Crossbody', brand: 'VogueHaus', price: 279.99, category: 'Fashion', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787206756_02ab622b.jpg' },
  { name: 'Parisian Clutch', brand: 'ChicMode', price: 199.99, category: 'Fashion', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787208836_6bed33bf.jpg' },
  { name: 'Quantum Phone Ultra', brand: 'TechVision', price: 999.99, category: 'Electronics', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787228845_8846c466.jpg' },
  { name: 'NexGen Smartphone', brand: 'InnoTech', price: 849.99, category: 'Electronics', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787228875_22deddf5.jpg' },
  { name: 'Prism Phone Lite', brand: 'PixelCore', price: 599.99, category: 'Electronics', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787228214_83ae7bac.jpg' },
  { name: 'Aviator Gold Shades', brand: 'OpticLux', price: 259.99, category: 'Accessories', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787293025_0eb30818.png' },
  { name: 'Retro Classic Frames', brand: 'VintageEye', price: 179.99, category: 'Accessories', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787294111_60cc7e3c.png' },
  { name: 'Sport Shield Lens', brand: 'ActiveView', price: 149.99, category: 'Accessories', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787297312_c22cfe12.png' },
  { name: 'AirPod Max Elite', brand: 'SoundWave', price: 349.99, category: 'Audio', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787324656_974c3fd9.jpg' },
  { name: 'Crystal Clear Buds', brand: 'PureAudio', price: 129.99, category: 'Audio', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787319217_3608a441.jpg' },
  { name: 'Bass Boost Pods', brand: 'DeepSound', price: 99.99, category: 'Audio', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787324035_89c94026.jpg' },
  { name: 'Noir Essence Parfum', brand: 'MaisonLux', price: 189.99, category: 'Beauty', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787341472_3444168c.jpg' },
  { name: 'Amber Oud Reserve', brand: 'FragranceCo', price: 249.99, category: 'Beauty', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787349749_f945ff9e.jpg' },
  { name: 'Rose Gold Mist', brand: 'PetalScent', price: 159.99, category: 'Beauty', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787349855_685c5231.jpg' },
  { name: 'MechStrike RGB Board', brand: 'KeyForge', price: 179.99, category: 'Tech', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787375145_9df53cc3.jpg' },
  { name: 'TactileType Pro', brand: 'SwitchCraft', price: 149.99, category: 'Tech', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787371308_5751966c.jpg' },
  { name: 'Phantom Keys 60%', brand: 'GhostBoard', price: 129.99, category: 'Tech', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787369611_dd23e2c4.jpg' },
  { name: 'Viper X Gaming Mouse', brand: 'ClickForce', price: 89.99, category: 'Gaming', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787407963_baffffe3.jpg' },
  { name: 'Stealth Ergo Mouse', brand: 'ProGrip', price: 79.99, category: 'Gaming', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787405290_e248a39d.jpg' },
  { name: 'Apex Precision Mouse', brand: 'AimTech', price: 109.99, category: 'Gaming', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787402492_78e0000f.jpg' },
  { name: 'Heritage Bifold Wallet', brand: 'LeatherCo', price: 129.99, category: 'Accessories', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787426896_6aef43d7.jpg' },
  { name: 'Slim Card Holder', brand: 'MinimalWear', price: 69.99, category: 'Accessories', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787426601_23fa6276.jpg' },
  { name: 'FitBand Ultra', brand: 'VitalTrack', price: 199.99, category: 'Wearables', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787444470_809c5d8f.jpg' },
  { name: 'PulseTrack Slim', brand: 'HealthSync', price: 149.99, category: 'Wearables', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787446440_a77aea1d.jpg' },
  // Cycle back for remaining tasks
  { name: 'Studio Monitor Pro', brand: 'AudioTech', price: 399.99, category: 'Audio', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787089125_7fb09f77.jpg' },
  { name: 'Titanium Watch Elite', brand: 'ChronoTech', price: 549.99, category: 'Wearables', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787129845_314ae005.jpg' },
  { name: 'Zenith Phone Max', brand: 'TechVision', price: 1199.99, category: 'Electronics', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787228845_8846c466.jpg' },
  { name: 'Royal Oud Intense', brand: 'MaisonLux', price: 299.99, category: 'Beauty', image: 'https://d64gsuwffb70l.cloudfront.net/69aa305f2571098cc28263b5_1772787349749_f945ff9e.jpg' },
];

// Pre-loader component with animated rings
const ProductPreloader: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center justify-center py-16">
      {/* Animated loading rings */}
      <div className="relative w-28 h-28 mb-6">
        <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 animate-ping" style={{ animationDuration: '1.5s' }} />
        <div className="absolute inset-2 rounded-full border-2 border-purple-500/30 animate-ping" style={{ animationDuration: '1.8s', animationDelay: '0.2s' }} />
        <div className="absolute inset-4 rounded-full border-2 border-pink-500/20 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.4s' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 flex items-center justify-center backdrop-blur-sm">
            <Package size={24} className="text-indigo-400 animate-pulse" />
          </div>
        </div>
        {/* Orbiting dots */}
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-indigo-400 rounded-full" />
        </div>
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s', animationDirection: 'reverse', animationDelay: '0.5s' }}>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-purple-400 rounded-full" />
        </div>
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '4s' }}>
          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-1.5 h-1.5 bg-pink-400 rounded-full" />
        </div>
      </div>
      
      {/* Loading text with shimmer */}
      <div className="relative overflow-hidden">
        <p className="text-sm font-medium text-gray-400">Loading next product...</p>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
      </div>
      
      {/* Loading bar */}
      <div className="w-48 h-1 bg-white/5 rounded-full mt-4 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full animate-loading-bar" />
      </div>
    </div>
  );
};

// Animated star rating display
const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <Star
        key={i}
        size={14}
        className={i <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-600'}
      />
    ))}
    <span className="text-xs text-gray-400 ml-1.5">{rating}.0</span>
  </div>
);

// Product showcase card with reveal animation
const ProductShowcase: React.FC<{
  product: typeof PRODUCT_CATALOG[0];
  task: any;
  isRevealed: boolean;
  onRevealComplete: () => void;
}> = ({ product, task, isRevealed, onRevealComplete }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  // Deterministic rating based on task number (4 or 5 stars)
  const rating = (task.task_number % 2 === 0) ? 5 : 4;
  const reviews = 50 + ((task.task_number * 37) % 450);


  useEffect(() => {
    if (isRevealed) {
      const timer = setTimeout(onRevealComplete, 600);
      return () => clearTimeout(timer);
    }
  }, [isRevealed, onRevealComplete]);

  return (
    <div className={`transition-all duration-700 ${isRevealed ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`}>
      <div className="relative bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.08] rounded-3xl overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/10 rounded-full blur-[60px]" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/10 rounded-full blur-[60px]" />
        
        <div className="grid md:grid-cols-2 gap-0">
          {/* Product Image */}
          <div className="relative p-6 md:p-8 flex items-center justify-center bg-gradient-to-br from-white/[0.02] to-transparent min-h-[300px] md:min-h-[400px]">
            {/* Floating particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-indigo-400/40 rounded-full animate-float-slow" />
              <div className="absolute top-3/4 right-1/4 w-1.5 h-1.5 bg-purple-400/30 rounded-full animate-float-medium" />
              <div className="absolute top-1/2 left-3/4 w-1 h-1 bg-pink-400/30 rounded-full animate-float-fast" />
            </div>
            
            {/* Image container with reveal animation */}
            <div className={`relative transition-all duration-1000 delay-200 ${isRevealed ? 'scale-100 rotate-0' : 'scale-75 rotate-3'}`}>
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-2xl blur-xl" />
              <img
                src={product.image}
                alt={product.name}
                onLoad={() => setImageLoaded(true)}
                className={`relative w-full max-w-[280px] md:max-w-[340px] h-auto rounded-2xl shadow-2xl shadow-black/30 transition-all duration-700 delay-300 ${
                  imageLoaded && isRevealed ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                }`}
              />
              {/* Shimmer overlay on image */}
              {isRevealed && (
                <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer-once" />
                </div>
              )}
            </div>
            
            {/* Category badge */}
            <div className={`absolute top-4 left-4 px-3 py-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-full transition-all duration-500 delay-500 ${
              isRevealed ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
            }`}>
              <span className="text-xs font-semibold text-white">{product.category}</span>
            </div>
            
            {/* Task number badge */}
            <div className={`absolute top-4 right-4 px-3 py-1.5 bg-indigo-500/20 backdrop-blur-md border border-indigo-500/30 rounded-full transition-all duration-500 delay-600 ${
              isRevealed ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
            }`}>
              <span className="text-xs font-bold text-indigo-300">Task #{task.task_number}</span>
            </div>
          </div>

          {/* Product Details */}
          <div className="p-6 md:p-8 flex flex-col justify-center">
            <div className={`transition-all duration-500 delay-400 ${isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">{product.brand}</p>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 leading-tight">{product.name}</h2>
              
              <div className="flex items-center gap-3 mb-4">
                <StarRating rating={rating} />
                <span className="text-xs text-gray-500">({reviews} reviews)</span>
              </div>
              
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-3xl font-bold text-white">${product.price.toFixed(2)}</span>
                <span className="text-sm text-gray-500 line-through">${(product.price * 1.3).toFixed(2)}</span>
                <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-400 text-xs font-bold rounded-full">-23%</span>
              </div>
            </div>
            
            {/* Product specs */}
            <div className={`space-y-3 mb-6 transition-all duration-500 delay-500 ${isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle size={14} className="text-emerald-400" />
                </div>
                <span className="text-gray-300">Premium quality verified</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                  <ShoppingBag size={14} className="text-indigo-400" />
                </div>
                <span className="text-gray-300">Premium quality verified</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Eye size={14} className="text-purple-400" />
                </div>
                <span className="text-gray-300">Review & earn reward</span>
              </div>
            </div>
            
            {/* Reward info */}
            <div className={`p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl mb-6 transition-all duration-500 delay-600 ${
              isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-400" />
                  <span className="text-sm font-semibold text-white">Task Reward</span>
                </div>
                <span className="text-lg font-bold text-emerald-400">+${task.reward?.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Success celebration overlay
const SuccessOverlay: React.FC<{ reward: number; onComplete: () => void }> = ({ reward, onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 3000); // 3 seconds instead of 2
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
      {/* Success ring animation */}
      <div className="relative w-32 h-32 mb-6">
        <div className="absolute inset-0 rounded-full border-4 border-emerald-500/30 animate-ping" style={{ animationDuration: '1s' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center animate-scale-bounce">
            <CheckCircle size={48} className="text-emerald-400" />
          </div>
        </div>
        {/* Confetti particles */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full animate-confetti"
            style={{
              background: ['#818cf8', '#a78bfa', '#f472b6', '#34d399', '#fbbf24', '#60a5fa', '#f87171', '#4ade80'][i],
              top: '50%',
              left: '50%',
              animationDelay: `${i * 0.1}s`,
              transform: `rotate(${i * 45}deg)`,
            }}
          />
        ))}
      </div>
      
      <h3 className="text-2xl font-bold text-white mb-2 animate-slide-up">Task Complete!</h3>
      <div className="flex items-center gap-2 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <DollarSign size={20} className="text-emerald-400" />
        <span className="text-xl font-bold text-emerald-400">+${reward.toFixed(2)} earned</span>
      </div>
    </div>
  );
};

// Mini progress tracker
const ProgressTracker: React.FC<{ tasks: any[]; currentTask: number }> = ({ tasks, currentTask }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const activeEl = scrollRef.current.querySelector(`[data-task="${currentTask}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [currentTask]);

  return (
    <div className="relative">
      <div ref={scrollRef} className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide px-1">
        {tasks.map((task: any) => {
          const product = PRODUCT_CATALOG[(task.task_number - 1) % PRODUCT_CATALOG.length];
          const isActive = task.task_number === currentTask;
          const isCompleted = task.status === 'completed';
          const isPending = task.status === 'pending';

          return (
            <div
              key={task.task_number}
              data-task={task.task_number}
              className={`relative flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                isActive ? 'border-indigo-500 ring-2 ring-indigo-500/30 scale-110' :
                isCompleted ? 'border-emerald-500/50 opacity-80' :
                isPending ? 'border-indigo-500/30' :
                'border-white/[0.06] opacity-30'
              }`}
            >
              <img
                src={product.image}
                alt=""
                className="w-full h-full object-cover"
              />
              {isCompleted && (
                <div className="absolute inset-0 bg-emerald-500/30 flex items-center justify-center">
                  <CheckCircle size={14} className="text-white" />
                </div>
              )}
              {!isCompleted && !isPending && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Lock size={10} className="text-gray-400" />
                </div>
              )}
              {isActive && (
                <div className="absolute inset-0 border-2 border-indigo-400 rounded-md animate-pulse" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TaskGrid: React.FC = () => {
  const { user, tasks, loadTasks, completeTask, isLoading } = useAppContext();
  const [phase, setPhase] = useState<'preload' | 'reveal' | 'active' | 'completing' | 'success' | 'transition'>('preload');
  const [completing, setCompleting] = useState(false);
  const [revealComplete, setRevealComplete] = useState(false);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const totalReward = tasks.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.reward, 0);
  const isTraining = user?.account_type === 'training';
  const isPersonal = user?.account_type === 'personal';
  const totalTasks = isTraining ? 45 : tasks.length;
  const progress = tasks.length > 0 ? (completedCount / totalTasks) * 100 : 0;
  const pendingTask = tasks.find(t => t.status === 'pending');
  const allComplete = isTraining ? completedCount === 45 : completedCount === tasks.length && tasks.length > 0;
  const trainingComplete = user?.training_completed;
  
  // Check if personal account can access tasks (must complete training first)
  // Check if training account has pending order (blocks submission)
  const canAccessTasks = isPersonal ? user?.training_completed : !(user?.has_pending_order && user?.is_negative_balance);

  // Reset phase when pending task changes
  useEffect(() => {
    if (pendingTask) {
      setPhase('preload');
      setRevealComplete(false);
    }
  }, [pendingTask?.task_number]);

  const handlePreloadComplete = useCallback(() => {
    setPhase('reveal');
  }, []);

  const handleRevealComplete = useCallback(() => {
    setRevealComplete(true);
    setPhase('active');
  }, []);

  const handleSubmit = async () => {
    if (!pendingTask || completing) return;
    setCompleting(true);
    setPhase('completing');
    
    const success = await completeTask(pendingTask.task_number);
    if (success) {
      setPhase('success');
    } else {
      setPhase('active');
    }
    setCompleting(false);
  };

  const handleSuccessComplete = useCallback(() => {
    setPhase('transition');
    setTimeout(() => {
      setPhase('preload');
      setRevealComplete(false);
    }, 500);
  }, []);

  const currentProduct = pendingTask
    ? PRODUCT_CATALOG[(pendingTask.task_number - 1) % PRODUCT_CATALOG.length]
    : null;

  const taskList = tasks.length > 0
    ? tasks
    : Array.from({ length: isTraining ? 45 : 35 }, (_, i) => ({ task_number: i + 1, status: i === 0 ? 'pending' : 'locked', reward: 0 }));

  return (
    <div className="space-y-6">
      {/* Daily Bonus Section */}
      <DailyBonus />

      {/* Header Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        <div className="p-5 bg-white/[0.03] border border-white/[0.06] rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-500/15 flex items-center justify-center">
              <Zap size={20} className="text-indigo-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">
                {isTraining ? 'Training Progress' : 'Tasks Progress'}
              </p>
              <p className="text-xl font-bold text-white">{completedCount} / {totalTasks}</p>
            </div>
          </div>
          <div className="mt-3 h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="p-5 bg-white/[0.03] border border-white/[0.06] rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/15 flex items-center justify-center">
              <DollarSign size={20} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Earned</p>
              <p className="text-xl font-bold text-emerald-400">${totalReward.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="p-5 bg-white/[0.03] border border-white/[0.06] rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/15 flex items-center justify-center">
              <Award size={20} className="text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Account Type</p>
              <p className="text-xl font-bold text-amber-400">
                {isTraining ? 'Training' : `VIP${user?.vip_level || 1}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Product Showcase */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShoppingBag size={18} className="text-indigo-400" />
              {isTraining ? 'Training Tasks' : 'Product Review Tasks'}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {isTraining 
                ? 'Complete training tasks to unlock personal account features'
                : 'Review products to earn rewards'
              }
            </p>
          </div>
          {isTraining && trainingComplete && (
            <div className="px-4 py-2 bg-emerald-500/15 border border-emerald-500/30 rounded-xl">
              <span className="text-emerald-400 text-sm font-semibold flex items-center gap-1.5">
                <CheckCircle size={14} /> Training Complete!
              </span>
            </div>
          )}
          {!isTraining && allComplete && (
            <div className="px-4 py-2 bg-emerald-500/15 border border-emerald-500/30 rounded-xl">
              <span className="text-emerald-400 text-sm font-semibold flex items-center gap-1.5">
                <CheckCircle size={14} /> All Tasks Complete!
              </span>
            </div>
          )}
          {pendingTask && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
              <span className="text-xs text-gray-400">Current:</span>
              <span className="text-sm font-bold text-indigo-300">#{pendingTask.task_number}</span>
              <span className="text-xs text-gray-500">of {totalTasks}</span>
            </div>
          )}
        </div>

        {/* Product Display Area */}
        <div className="min-h-[420px] flex items-center justify-center relative">
          {allComplete ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
                <Award size={48} className="text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                {isTraining ? 'Training Complete!' : 'All Products Reviewed!'}
              </h3>
              <p className="text-gray-400 mb-2">
                {isTraining 
                  ? `You've completed all ${totalTasks} training tasks` 
                  : `You've completed all ${totalTasks} product reviews`
                }
              </p>
              <p className="text-lg font-bold text-emerald-400">Total earned: ${totalReward.toFixed(2)}</p>
              {isTraining && (
                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <p className="text-sm text-blue-400">
                    🎉 Congratulations! You can now upgrade to a personal account with VIP rewards.
                  </p>
                </div>
              )}
            </div>
          ) : !pendingTask && !canAccessTasks ? (
            <div className="text-center py-16">
              <Lock size={48} className="text-gray-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Tasks Locked</h3>
              <p className="text-gray-400 mb-4">
                {isPersonal 
                  ? 'Complete training first to unlock tasks' 
                  : 'No tasks available'
                }
              </p>
              {isPersonal && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl max-w-sm mx-auto">
                  <p className="text-sm text-amber-400">
                    🎓 You must complete training before accessing personal account tasks
                  </p>
                </div>
              )}
            </div>
          ) : phase === 'preload' || phase === 'transition' ? (
            <ProductPreloader onComplete={handlePreloadComplete} />
          ) : phase === 'success' ? (
            <SuccessOverlay reward={pendingTask.reward} onComplete={handleSuccessComplete} />
          ) : currentProduct ? (
            <div className="w-full p-4 md:p-6">
              <ProductShowcase
                product={currentProduct}
                task={pendingTask}
                isRevealed={phase === 'reveal' || phase === 'active' || phase === 'completing'}
                onRevealComplete={handleRevealComplete}
              />
            </div>
          ) : null}
        </div>

        {/* Submit Button Area */}
        {pendingTask && (phase === 'active' || phase === 'completing') && (
          <div className="px-6 pb-6">
            <button
              onClick={canAccessTasks ? handleSubmit : () => {
                if (isTraining && user?.has_pending_order && user?.is_negative_balance) {
                  toast({ 
                    title: 'Pending Product!', 
                    description: 'You have a pending combination product. Please contact support to clear this product.', 
                    variant: 'destructive'
                  });
                } else {
                  toast({ 
                    title: 'Tasks Locked!', 
                    description: 'Complete your training first to unlock tasks.', 
                  });
                }
              }}
              disabled={completing || phase === 'completing'}
              className={`w-full py-4 font-bold rounded-2xl transition-all duration-300 shadow-lg flex items-center justify-center gap-3 text-lg disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] group ${
                canAccessTasks 
                  ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 shadow-indigo-500/25 hover:shadow-indigo-500/40 text-white'
                  : 'bg-gray-600 hover:bg-gray-500 shadow-gray-500/25 hover:shadow-gray-500/40 text-gray-300'
              }`}
            >
              {completing || phase === 'completing' ? (
                <>
                  <Loader2 size={22} className="animate-spin" />
                  <span>Processing Review...</span>
                </>
              ) : (
                <>
                  <Send size={20} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  <span>{canAccessTasks ? 'Submit Review' : (isTraining && user?.has_pending_order && user?.is_negative_balance ? 'Pending Product' : 'Tasks Locked')}</span>
                  <span className="ml-2 px-3 py-1 bg-white/15 rounded-full text-sm">+${pendingTask.reward.toFixed(2)}</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Progress Tracker Strip */}
        <div className="px-6 py-4 border-t border-white/[0.06] bg-white/[0.01]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500">Product Queue</span>
            <span className="text-xs font-bold text-indigo-400">{completedCount}/{isPersonal ? 35 : 45} reviewed</span>
          </div>
          <ProgressTracker tasks={taskList} currentTask={pendingTask?.task_number || 0} />
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 px-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-xs text-gray-400">Reviewed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-xs text-gray-400">Current</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-700" />
          <span className="text-xs text-gray-400">Queued</span>
        </div>
      </div>
    </div>
  );
};

export default TaskGrid;
