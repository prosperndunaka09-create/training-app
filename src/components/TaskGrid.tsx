import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { CheckCircle, Lock, Zap, Loader2, DollarSign, Award, Star, ShoppingBag, Send, Package, Headphones, AlertTriangle, MessageCircle, ArrowRight, Plus, Sparkles, Crown, GraduationCap } from 'lucide-react';
import DailyBonus from './DailyBonus';
import { toast } from '@/components/ui/use-toast';
import ProductCatalogService, { Product } from '@/services/productCatalogService';
import SupabaseService from '@/services/supabaseService';



// Product catalogs are now managed by ProductCatalogService
// Training: 45 products | Personal: 35 products | Total: 80 products

// Animated Preloader Component (2.5-3 seconds)
const ProductPreloader: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2800); // 2.8 seconds for nice animation
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

// Simple Product Card - Just shows product with profit and submit button
const SimpleProductCard: React.FC<{
  product: Product;
  reward: number;
  taskNumber: number;
  totalTasks: number;
  onSubmit: () => void;
  isSubmitting: boolean;
  isTraining: boolean;
  hasPendingOrder?: boolean;
}> = ({ product, reward, taskNumber, totalTasks, onSubmit, isSubmitting, isTraining, hasPendingOrder }) => {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.12] rounded-3xl overflow-hidden p-6 text-center shadow-2xl">
        <div className="absolute top-3 right-3">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
            <Crown className="w-3 h-3" />
            VIP{Math.ceil(taskNumber / 10)}
          </div>
        </div>

        <div className="mb-4">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-48 object-contain rounded-2xl bg-gradient-to-br from-white/[0.05] to-transparent"
          />
        </div>

        <h3 className="text-xl font-bold text-white mb-1">{product.name}</h3>
        <p className="text-sm text-gray-400 mb-4">{product.brand} • {product.category}</p>

        <div className={`${hasPendingOrder ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20'} border rounded-xl p-3 mb-4`}>
          <p className="text-sm text-gray-400 mb-1">{hasPendingOrder ? 'Pending Order Amount' : 'Commission Reward'}</p>
          <div className="flex items-center justify-center gap-1">
            <DollarSign className={`w-5 h-5 ${hasPendingOrder ? 'text-red-400' : 'text-emerald-400'}`} />
            <span className={`text-2xl font-bold ${hasPendingOrder ? 'text-red-400' : 'text-emerald-400'}`}>{hasPendingOrder ? product.price?.toFixed(2) || reward.toFixed(2) : reward.toFixed(2)}</span>
          </div>
        </div>

        {hasPendingOrder ? (
          <div className="w-full py-4 font-bold rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-rose-600 text-white flex items-center justify-center gap-2 text-lg cursor-not-allowed">
            <AlertTriangle size={20} />
            <span>Pending Order - Contact Support</span>
          </div>
        ) : (
          <button onClick={onSubmit} disabled={isSubmitting} className="w-full py-4 font-bold rounded-2xl transition-all duration-200 shadow-lg flex items-center justify-center gap-2 text-lg disabled:opacity-60 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white">
            {isSubmitting ? <><Loader2 size={20} className="animate-spin" /><span>Processing...</span></> : <><Send size={20} /><span>Submit Task</span><span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-sm">+${reward.toFixed(2)}</span></>}
          </button>
        )}
      </div>
    </div>
  );
};

// Combination Product Card - Premium card showing 2 products side by side
const CombinationProductCard: React.FC<{
  product1: Product;
  product2: Product;
  combinedPrice: number;
  taskNumber: number;
  userBalance: number;
  onContactSupport: () => void;
}> = ({ product1, product2, combinedPrice, taskNumber, userBalance, onContactSupport }) => {
  const negativeBalance = userBalance - combinedPrice;
  
  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="relative bg-gradient-to-br from-purple-900/40 via-indigo-900/30 to-purple-900/40 border-2 border-purple-500/40 rounded-3xl overflow-hidden p-8 text-center shadow-2xl shadow-purple-500/20 animate-pulse-slow">
        {/* Premium Badge */}
        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2">
          <div className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-black text-xs font-extrabold px-6 py-2 rounded-b-xl flex items-center gap-2 shadow-lg shadow-amber-500/30 uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            Premium Combination
          </div>
        </div>

        {/* Pending Status Badge */}
        <div className="absolute top-4 right-4">
          <div className="bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1.5 animate-pulse">
            <div className="w-2 h-2 bg-red-400 rounded-full animate-ping" />
            Pending Order
          </div>
        </div>

        {/* Title */}
        <div className="mt-6 mb-6">
          <h2 className="text-2xl font-black text-white mb-1 tracking-tight">
            COMBINATION PRODUCT
          </h2>
          <p className="text-sm text-purple-300">Two Premium Items • One Special Order</p>
        </div>

        {/* Two Products Side by Side */}
        <div className="flex gap-4 mb-6">
          {/* Product 1 */}
          <div className="flex-1 bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.12] rounded-2xl p-4 transform hover:scale-105 transition-all duration-300 group">
            <div className="relative">
              <img
                src={product1.image}
                alt={product1.name}
                className="w-full h-32 object-contain rounded-xl bg-gradient-to-br from-white/[0.05] to-transparent group-hover:brightness-110 transition-all"
              />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                1
              </div>
            </div>
            <h4 className="text-sm font-bold text-white mt-3 truncate">{product1.name}</h4>
            <p className="text-xs text-gray-400">{product1.brand}</p>
          </div>

          {/* Plus Icon */}
          <div className="flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Plus className="w-5 h-5 text-white" />
            </div>
          </div>

          {/* Product 2 */}
          <div className="flex-1 bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.12] rounded-2xl p-4 transform hover:scale-105 transition-all duration-300 group">
            <div className="relative">
              <img
                src={product2.image}
                alt={product2.name}
                className="w-full h-32 object-contain rounded-xl bg-gradient-to-br from-white/[0.05] to-transparent group-hover:brightness-110 transition-all"
              />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                2
              </div>
            </div>
            <h4 className="text-sm font-bold text-white mt-3 truncate">{product2.name}</h4>
            <p className="text-xs text-gray-400">{product2.brand}</p>
          </div>
        </div>

        {/* Combined Price */}
        <div className="bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-purple-500/20 border border-purple-500/30 rounded-2xl p-4 mb-4">
          <p className="text-sm text-purple-300 mb-1">Combined Order Value</p>
          <div className="flex items-center justify-center gap-2">
            <DollarSign className="w-6 h-6 text-amber-400" />
            <span className="text-3xl font-black text-white">{combinedPrice.toFixed(2)}</span>
          </div>
        </div>

        {/* Balance Display */}
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
          <p className="text-sm text-gray-400 mb-1">Current Balance</p>
          <div className="flex items-center justify-center gap-2">
            <DollarSign className="w-5 h-5 text-red-400" />
            <span className="text-2xl font-bold text-red-400">{negativeBalance.toFixed(2)}</span>
          </div>
          <p className="text-xs text-red-300/70 mt-1">Insufficient balance for this order</p>
        </div>

        {/* Warning Message */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-4">
          <div className="flex items-center gap-2 text-amber-300">
            <Lock className="w-4 h-4" />
            <span className="text-sm">Tasks locked until order is cleared by customer service</span>
          </div>
        </div>

        {/* Contact Support Button */}
        <button 
          onClick={onContactSupport}
          className="w-full py-4 font-bold rounded-2xl transition-all duration-200 shadow-lg shadow-purple-500/30 flex items-center justify-center gap-3 text-lg bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:via-indigo-500 hover:to-purple-500 text-white transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Headphones className="w-5 h-5" />
          <span>Contact Customer Service</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

const SuccessMessage: React.FC<{ reward: number; onNext: () => void }> = ({ reward, onNext }) => {
  useEffect(() => {
    const timer = setTimeout(onNext, 1500);
    return () => clearTimeout(timer);
  }, [onNext]);
  return (
    <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
      <div className="relative w-24 h-24 mb-4">
        <div className="absolute inset-0 rounded-full border-4 border-emerald-500/30 animate-ping" />
        <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <CheckCircle size={48} className="text-emerald-400" />
        </div>
      </div>
      <h3 className="text-xl font-bold text-white mb-2">Task Complete!</h3>
      <div className="flex items-center gap-1 text-emerald-400">
        <DollarSign size={18} />
        <span className="text-lg font-bold">+${reward.toFixed(2)} added</span>
      </div>
      <p className="text-sm text-gray-500 mt-2">Loading next product...</p>
    </div>
  );
};

const ProgressTracker: React.FC<{ tasks: any[]; currentTask: number; productCatalog: any[] }> = ({ tasks: tasksProp, currentTask, productCatalog: catalogProp }) => {
  const tasks = tasksProp || [];
  const productCatalog = catalogProp || [];
  const safeCatalog = Array.isArray(productCatalog) ? productCatalog : [];
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) {
      const activeEl = scrollRef.current.querySelector(`[data-task="${currentTask}"]`);
      if (activeEl) activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [currentTask]);
  return (
    <div className="relative">
      <div ref={scrollRef} className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide px-1">
        {tasks.map((task: any) => {
          const product = (safeCatalog || []).length > 0 
            ? safeCatalog[(task.task_number - 1) % safeCatalog.length]
            : { image: 'https://via.placeholder.com/40', name: 'Product' };
          const isActive = task.task_number === currentTask;
          const isCompleted = task.status === 'completed';
          const isPending = task.status === 'pending';
          return (
            <div key={task.task_number} data-task={task.task_number} className={`relative flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden border-2 transition-all duration-300 ${isActive ? 'border-indigo-500 ring-2 ring-indigo-500/30 scale-110' : isCompleted ? 'border-emerald-500/50 opacity-80' : isPending ? 'border-indigo-500/30' : 'border-white/[0.06] opacity-30'}`}>
              <img src={product?.image || 'https://via.placeholder.com/40'} alt="" className="w-full h-full object-cover" />
              {isCompleted && <div className="absolute inset-0 bg-emerald-500/30 flex items-center justify-center"><CheckCircle size={14} className="text-white" /></div>}
              {!isCompleted && !isPending && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Lock size={10} className="text-gray-400" /></div>}
              {isActive && <div className="absolute inset-0 border-2 border-indigo-400 rounded-md animate-pulse" />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TaskGrid: React.FC = () => {
  const { user, tasks, refreshTasks, completeTask, isLoading } = useAppContext();
  const [showSuccess, setShowSuccess] = useState(false);
  const [completedReward, setCompletedReward] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [pendingCompletionTask, setPendingCompletionTask] = useState<number | null>(null);
  const [productCatalog, setProductCatalog] = useState<Product[]>([]);
  const [showCombinationModal, setShowCombinationModal] = useState(true);
  const [showClaimProfitModal, setShowClaimProfitModal] = useState(true);
  const [showSupportOptions, setShowSupportOptions] = useState(false);
  const [showTrainingShowroomModal, setShowTrainingShowroomModal] = useState(false);
  const [previewImageFailed, setPreviewImageFailed] = useState(false);

  // Load appropriate product catalog based on account type
  useEffect(() => {
    const isTraining = user?.account_type === 'training';
    const catalog = isTraining 
      ? ProductCatalogService.getTrainingProducts()
      : ProductCatalogService.getPersonalProducts();
    setProductCatalog(catalog);
  }, [user?.account_type]);

  useEffect(() => { refreshTasks(); }, [refreshTasks]);

  const safeTasks = tasks || [];
  const calculatedCompletedCount = safeTasks.filter(t => t.status === 'completed').length;
  const pendingTask = safeTasks.find(t => t.status === 'pending') || safeTasks[0];
  const isTasksLoading = isLoading || (safeTasks.length === 0 && !pendingTask);
  
  // Reset loading state when pending task changes
  useEffect(() => {
    if (pendingTask) {
      setIsLoadingProduct(true);
    }
  }, [pendingTask?.task_number]);
  
  // Reset modal visibility when component mounts (so modal shows again if pending order exists)
  useEffect(() => {
    if (user?.has_pending_order) {
      setShowCombinationModal(true);
    }
  }, [user?.has_pending_order]);
  
  // Don't include the pending completion task in total reward until after success animation
  const totalReward = safeTasks
    .filter(t => t.status === 'completed' && t.task_number !== pendingCompletionTask)
    .reduce((sum, t) => sum + t.reward, 0);
  const isTraining = user?.account_type === 'training';
  // Support Phase 1 and Phase 2 for both account types
  // Training: 45 tasks per phase (90 total)
  // Personal: 35 tasks per phase (70 total)
  const tasksPerPhase = isTraining ? 45 : 35;
  const currentPhase = user?.training_phase || 1;

completedCount
const totalTasks = tasksPerPhase;

const progress = totalTasks > 0
  ? (completedCount / totalTasks) * 100
  : 0;

const allComplete = isTraining
  ? completedCount === 45
  : completedCount === 35;
  
  // NEW: Check if user has completed training (for non-training accounts)
  // ALL personal accounts must complete training before accessing tasks
  const canSubmitTasks = isTraining || user?.training_completed === true;
  const needsTraining = !isTraining && !user?.training_completed;

  const handleSubmit = async () => {
    if (!pendingTask || isSubmitting) return;
    
    // BLOCK task submission if pending order exists
    if (user?.has_pending_order) {
      toast({
        title: 'Tasks Locked',
        description: 'Please clear your pending combination order first. Contact customer service.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    setPendingCompletionTask(pendingTask.task_number);
    const result = await completeTask(pendingTask.task_number);

if (result.success) {
  setCompletedReward(result.reward || pendingTask.reward);
  setCompletedCount(prev => prev + 1);
  setShowSuccess(true);
      
      // Auto-advance to next task after 2.5 seconds
      setTimeout(() => {
        handleNextProduct();
      }, 2500);
    } else {
      setPendingCompletionTask(null);
    }
    setIsSubmitting(false);
  };

  const handleNextProduct = useCallback(() => {
    setShowSuccess(false);
    setCompletedReward(0);
    setPendingCompletionTask(null);
    setIsLoadingProduct(true);
  }, []);

  const handlePreloaderComplete = useCallback(() => {
    setIsLoadingProduct(false);
  }, []);

  // Ensure catalog is never empty - use defaults if needed
  const safeCatalog = productCatalog.length > 0 ? productCatalog : 
    (user?.account_type === 'training' ? ProductCatalogService.getTrainingProducts() : ProductCatalogService.getPersonalProducts());
  
  // When pending order exists and we're at the trigger task, show pending product
  const currentProduct = pendingTask 
    ? (user?.has_pending_order && pendingTask.task_number === user?.trigger_task_number && user?.pending_product)
      ? user.pending_product  // Show the pending order product
      : safeCatalog.length > 0 
        ? safeCatalog[(pendingTask.task_number - 1) % safeCatalog.length]  // Show regular product
        : { id: 'loading', name: 'Loading...', brand: 'Loading', price: 0, category: 'Loading', image: 'https://via.placeholder.com/150' }
    : null;
  const taskList = safeTasks.length > 0 ? safeTasks : Array.from({ length: isTraining ? 45 : 35 }, (_, i) => ({ task_number: i + 1, status: i === 0 ? 'pending' : 'locked', reward: [0.7, 1.6, 2.5, 6.4, 7.2][i % 5] }));
  const previewProduct = safeCatalog[2] || safeCatalog[0] || { id: 'preview', name: 'Preview', brand: 'Loading', price: 0, category: 'Loading', image: 'https://via.placeholder.com/150' };
  const previewImageSrc = previewProduct?.image || '';

  useEffect(() => {
    setPreviewImageFailed(false);
  }, [previewImageSrc]);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Combination Order Modal - Blocks tasks when pending order exists */}
      {user?.has_pending_order && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f1420] border border-white/[0.1] rounded-2xl w-full max-w-md shadow-2xl shadow-purple-500/10">
            {/* Header with gradient accent */}
            <div className="px-6 py-5 border-b border-white/[0.06] bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-purple-500/10 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Combination Order Detected</h3>
                  <span className="text-xs text-amber-400 font-medium">Pending Order</span>
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-400 leading-relaxed">
                A premium optimization product has been assigned to your account. Your balance is temporarily negative. Please contact support to proceed.
              </p>
              
              {/* Balance Display */}
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Current Balance</p>
                <p className="text-2xl font-bold text-red-400">-${Math.abs(user?.pending_amount || 0).toFixed(2)}</p>
              </div>
              
              {/* Info note */}
              <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <Lock className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-400/80">
                  Tasks are temporarily locked until this order is cleared by customer service.
                </p>
              </div>
            </div>
            
            {/* Actions */}
            <div className="p-6 pt-0 flex gap-3">
              <button 
                onClick={() => setShowSupportOptions(true)}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
              >
                <Headphones className="w-4 h-4" />
                Contact Support
              </button>
              <button 
                onClick={() => setShowCombinationModal(false)}
                className="px-4 py-3 bg-white/[0.05] hover:bg-white/[0.1] text-gray-400 hover:text-white rounded-xl font-medium transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Claim 6x Profit Modal - Shows after admin clears pending order */}
      {!user?.has_pending_order && user?.trigger_task_number && !user?.profit_added && user?.pending_product && showClaimProfitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f1420] border border-emerald-500/20 rounded-2xl w-full max-w-md shadow-2xl shadow-emerald-500/10">
            {/* Header with emerald gradient */}
            <div className="px-6 py-5 border-b border-white/[0.06] bg-gradient-to-r from-emerald-500/10 via-green-500/10 to-emerald-500/10 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">6x Profit Available!</h3>
                  <span className="text-xs text-emerald-400 font-medium">Order Cleared</span>
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-400 leading-relaxed">
                Your combination order has been cleared. Click below to claim your 6x profit reward!
              </p>
              
              {/* Product Display */}
              <div className="p-4 bg-white/[0.03] border border-white/[0.08] rounded-xl">
                <p className="text-xs text-gray-500 mb-2">Pending Product</p>
                <p className="text-lg font-bold text-white">{user.pending_product.name}</p>
                <p className="text-sm text-gray-400">{user.pending_product.brand} • {user.pending_product.category}</p>
              </div>
              
              {/* Profit Display */}
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">6x Profit Reward</p>
                <div className="flex items-center gap-1">
                  <DollarSign className="w-6 h-6 text-emerald-400" />
                  <span className="text-3xl font-bold text-emerald-400">{((user.pending_amount || 210) * 6).toFixed(2)}</span>
                </div>
                <p className="text-xs text-emerald-400/60 mt-1">${(user.pending_amount || 210).toFixed(2)} × 6</p>
              </div>
            </div>
            
            {/* Actions */}
            <div className="p-6 pt-0 flex gap-3">
              <button 
                onClick={async () => {
                  setIsSubmitting(true);
                  try {
                    const result = await completeTask(pendingTask.task_number);

if (result) {
  toast({
    title: '6x Profit Added!',
    description: `$$${pendingTask.reward.toFixed(2)} has been added`,
    variant: 'default',
  });

  window.location.reload();
} else {
                      toast({
                        title: 'Already Claimed',
                        description: 'This profit has already been added to your account.',
                        variant: 'destructive',
                      });
                    }
                  } catch (err) {
                    toast({
                      title: 'Error',
                      description: 'Failed to claim profit. Please try again.',
                      variant: 'destructive',
                    });
                  }
                  setIsSubmitting(false);
                }}
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                ) : (
                  <><DollarSign className="w-4 h-4" /> Claim 6x Profit</>
                )}
              </button>
              <button 
                onClick={() => setShowClaimProfitModal(false)}
                className="px-4 py-3 bg-white/[0.05] hover:bg-white/[0.1] text-gray-400 hover:text-white rounded-xl font-medium transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Support Options Modal - Shows Pink CS and Telegram CS */}
      {showSupportOptions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f1420] border border-white/[0.1] rounded-2xl w-full max-w-md shadow-2xl">
            {/* Header */}
            <div className="px-6 py-5 border-b border-white/[0.06] bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-pink-500/10 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
                  <Headphones className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Contact Support</h3>
                  <span className="text-xs text-pink-400 font-medium">Choose your preferred support channel</span>
                </div>
              </div>
            </div>
            
            {/* Support Options */}
            <div className="p-6 space-y-4">
              {/* Pink CS Option */}
              <a 
                href="https://pinkcs.example.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 bg-pink-500/10 border border-pink-500/20 rounded-xl hover:bg-pink-500/20 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-semibold group-hover:text-pink-400 transition-colors">Pink Customer Service</h4>
                  <p className="text-sm text-gray-400">Live chat support available 24/7</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-pink-400 transition-colors" />
              </a>
              
              {/* Telegram CS Option */}
              <a 
                href="https://t.me/your_support_bot" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl hover:bg-blue-500/20 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Send className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-semibold group-hover:text-blue-400 transition-colors">Telegram Support</h4>
                  <p className="text-sm text-gray-400">Message us on Telegram for quick help</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-blue-400 transition-colors" />
              </a>
            </div>
            
            {/* Close Button */}
            <div className="p-6 pt-0">
              <button 
                onClick={() => setShowSupportOptions(false)}
                className="w-full py-3 bg-white/[0.05] hover:bg-white/[0.1] text-gray-400 hover:text-white rounded-xl font-medium transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showTrainingShowroomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f1420] border border-indigo-500/20 rounded-2xl w-full max-w-md shadow-2xl shadow-indigo-500/10">
            <div className="px-6 py-5 border-b border-white/[0.06] bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Training Access Required</h3>
                  <span className="text-xs text-indigo-300 font-medium">Showroom Preview Only</span>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-300 leading-relaxed">
                You are viewing the task showroom. Complete training first to unlock live task submission and earning access.
              </p>
              <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                <p className="text-xs text-indigo-300 mb-1">Next Step</p>
                <p className="text-sm text-gray-300">Please finish your training program, then return to start live earning tasks.</p>
              </div>
            </div>
            <div className="p-6 pt-0">
              <button
                onClick={() => setShowTrainingShowroomModal(false)}
                className="w-full py-3 bg-white/[0.05] hover:bg-white/[0.1] text-gray-300 hover:text-white rounded-xl font-medium transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      <DailyBonus />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <div className="p-3 md:p-5 bg-white/[0.03] border border-white/[0.06] rounded-xl md:rounded-2xl">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-9 h-9 md:w-11 md:h-11 rounded-lg md:rounded-xl bg-indigo-500/15 flex items-center justify-center"><Zap size={18} className="text-indigo-400" /></div>
            <div>
              <p className="text-xs text-gray-500 font-medium">{isTraining ? 'Training Progress' : 'Tasks Progress'}</p>
              <p className="text-lg md:text-xl font-bold text-white">{completedCount} / {totalTasks}</p>
            </div>
          </div>
          <div className="mt-2 md:mt-3 h-2 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="p-3 md:p-5 bg-white/[0.03] border border-white/[0.06] rounded-xl md:rounded-2xl">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-9 h-9 md:w-11 md:h-11 rounded-lg md:rounded-xl bg-emerald-500/15 flex items-center justify-center"><DollarSign size={18} className="text-emerald-400" /></div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Earned</p>
              <p className="text-lg md:text-xl font-bold text-emerald-400">${totalReward.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="p-3 md:p-5 bg-white/[0.03] border border-white/[0.06] rounded-xl md:rounded-2xl">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-9 h-9 md:w-11 md:h-11 rounded-lg md:rounded-xl bg-amber-500/15 flex items-center justify-center"><Award size={18} className="text-amber-400" /></div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Account Type</p>
              <p className="text-lg md:text-xl font-bold text-amber-400">{isTraining ? 'Training' : `VIP${user?.vip_level || 1}`}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl md:rounded-2xl overflow-hidden">
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-white/[0.06]">
          <h2 className="text-base md:text-lg font-bold text-white flex items-center gap-2"><ShoppingBag size={16} className="text-indigo-400" />{isTraining ? 'Training Tasks' : 'Product Review Tasks'}</h2>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5">{isTraining ? 'Complete training tasks to unlock personal account features' : 'Review products to earn rewards'}</p>
        </div>
        <div className="p-4 md:p-8">
          {needsTraining ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                <Lock size={40} className="text-amber-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Training Required</h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                You must complete the training program before you can start earning from product reviews.
              </p>
              {/* Show product preview without submit button */}
              <div className="max-w-xs mx-auto mb-6 opacity-95 select-none">
                <div className="relative bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.08] rounded-2xl overflow-hidden p-4 text-center">
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10">
                    <div className="bg-gradient-to-r from-amber-400 to-amber-600 px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                      <Award size={12} className="text-white" />
                      <span className="text-xs font-bold text-white">VIP1</span>
                    </div>
                  </div>
                  <div className="relative flex items-center justify-center min-h-[150px] mb-3 mt-6 rounded-xl border border-white/[0.08] bg-gradient-to-br from-[#0a111f] via-[#131d2f] to-[#0c1424] overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-white/[0.06]" />
                    <div className="absolute -inset-10 rounded-full bg-indigo-500/10 blur-2xl animate-pulse" />
                    <div
                      className="relative w-full max-w-[125px] h-[125px] animate-spin"
                      style={{ animationDuration: '16s', animationTimingFunction: 'linear' }}
                    >
                      {!previewImageFailed && previewImageSrc ? (
                        <img
                          src={previewImageSrc}
                          alt={previewProduct?.name || 'Preview'}
                          className="w-full h-full object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.55)]"
                          onError={() => setPreviewImageFailed(true)}
                        />
                      ) : (
                        <div className="w-full h-full rounded-2xl border border-white/[0.12] bg-gradient-to-br from-slate-800/90 to-slate-900/90 flex items-center justify-center">
                          <Package className="w-10 h-10 text-indigo-300/80" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1 mb-3">
                    <h3 className="text-sm font-bold text-white">{previewProduct?.name || 'Product Preview'}</h3>
                    <p className="text-xs text-gray-500">{previewProduct?.brand || 'Brand'} • {previewProduct?.category || 'Category'}</p>
                  </div>
                  <div className="mb-3 p-2 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                    <p className="text-xs text-gray-500 mb-0.5">Commission Reward</p>
                    <div className="flex items-center justify-center gap-1">
                      <DollarSign size={14} className="text-emerald-500/60" />
                      <span className="text-base font-bold text-emerald-500/60">0.25</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTrainingShowroomModal(true)}
                    className="w-full py-2.5 font-extrabold rounded-lg text-sm tracking-wide bg-gradient-to-r from-indigo-600/70 via-purple-600/70 to-indigo-600/70 border border-indigo-400/25 text-white shadow-lg shadow-indigo-900/30 hover:from-indigo-500/80 hover:via-purple-500/80 hover:to-indigo-500/80 transition-all"
                  >
                    TASK SHOWROOM
                  </button>
                </div>
              </div>
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl max-w-xs mx-auto mb-4">
                <ul className="text-xs text-gray-400 text-center list-none space-y-1">
                  <li className="text-amber-400 font-medium">Full earning capabilities</li>
                </ul>
              </div>
              <p className="text-xs text-gray-500">Please contact support if you need training account access.</p>
            </div>
          ) : allComplete ? (
            <div className="text-center py-12">
              {isTraining && user?.training_phase === 1 ? (
                // Phase 1 Complete - Show contact customer service message
                <>
                  <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4"><Award size={40} className="text-blue-400" /></div>
                  <h3 className="text-2xl font-bold text-white mb-2">🎉 Phase 1 Complete!</h3>
                  <p className="text-gray-400 mb-4">You've completed all 45 tasks in Phase 1!</p>
                  <p className="text-lg font-bold text-emerald-400 mb-6">Total earned: ${totalReward.toFixed(2)}</p>
                  
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl max-w-md mx-auto mb-4">
                    <p className="text-amber-400 font-medium mb-2">⏳ Account Reset Required</p>
                    <p className="text-sm text-gray-400">Contact Customer Service to reset your account and continue to Phase 2</p>
                  </div>
                  
                  <button 
                    onClick={() => window.open('https://t.me/EARNINGSLLCONLINECS1', '_blank')}
                    className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl font-bold text-white shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                  >
                    <Headphones className="w-5 h-5" />
                    Contact Customer Service
                  </button>
                  
                  <p className="text-sm text-gray-500 mt-4">Admin will manually reset your account to Phase 2</p>
                </>
              ) : isTraining && user?.training_phase === 2 ? (
                // Phase 2 Complete - Training fully done
                <>
                  <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4"><Award size={40} className="text-emerald-400" /></div>
                  <h3 className="text-2xl font-bold text-white mb-2">🏆 Training Fully Complete!</h3>
                  <p className="text-gray-400 mb-2">You've completed both Phase 1 and Phase 2!</p>
                  <p className="text-lg font-bold text-emerald-400">Total earned: ${totalReward.toFixed(2)}</p>
                  <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl max-w-md mx-auto space-y-3">
                    <p className="text-sm text-emerald-400 font-medium">🎉 Congratulations! Training is Complete!</p>
                    <div className="text-left text-sm text-gray-300 space-y-2">
                      <p className="flex items-center gap-2">
                        <span className="text-emerald-400">✓</span>
                        <span>Your <strong>${totalReward.toFixed(2)}</strong> earnings will be transferred to your personal account</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="text-amber-400">➜</span>
                        <span><strong>Next Step:</strong> Click "Logout" below to automatically transfer your balance</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="text-blue-400">ℹ</span>
                        <span>After logout, login to your personal account to see your transferred balance</span>
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                // Personal account completion
                <>
                  <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4"><Award size={40} className="text-emerald-400" /></div>
                  <h3 className="text-2xl font-bold text-white mb-2">All Tasks Complete!</h3>
                  <p className="text-gray-400 mb-2">You've completed all {totalTasks} product reviews</p>
                  <p className="text-lg font-bold text-emerald-400">Total earned: ${totalReward.toFixed(2)}</p>
                </>
              )}
            </div>
          ) : showSuccess ? (
            <SuccessMessage reward={completedReward} onNext={handleNextProduct} />
          ) : isLoadingProduct ? (
            <ProductPreloader onComplete={handlePreloaderComplete} />
          ) : user?.has_pending_order && pendingTask?.task_number === user?.trigger_task_number && user?.pending_product ? (
            <CombinationProductCard 
              product1={safeCatalog.length > 0 ? safeCatalog[(pendingTask.task_number - 1) % safeCatalog.length] : { id: 'p1', name: 'Product 1', brand: 'Loading', price: 0, category: 'Loading', image: 'https://via.placeholder.com/150' }} 
              product2={safeCatalog.length > 0 ? safeCatalog[(pendingTask.task_number) % safeCatalog.length] : { id: 'p2', name: 'Product 2', brand: 'Loading', price: 0, category: 'Loading', image: 'https://via.placeholder.com/150' }}
              combinedPrice={user.pending_amount || 210}
              taskNumber={pendingTask.task_number}
              userBalance={user.balance || 0}
              onContactSupport={() => setShowSupportOptions(true)}
            />
          ) : currentProduct && pendingTask ? (
            <SimpleProductCard product={currentProduct as Product} reward={pendingTask.reward} taskNumber={pendingTask.task_number} totalTasks={totalTasks} onSubmit={handleSubmit} isSubmitting={isSubmitting} isTraining={isTraining} hasPendingOrder={user?.has_pending_order} />
          ) : isTasksLoading ? (
            <div className="text-center py-12">
              <Loader2 size={40} className="text-indigo-500 mx-auto mb-4 animate-spin" />
              <h3 className="text-xl font-bold text-white mb-2">Loading Tasks...</h3>
              <p className="text-gray-400">Please wait while we fetch your tasks.</p>
            </div>
          ) : (
            <div className="text-center py-12"><Lock size={40} className="text-gray-500 mx-auto mb-4" /><h3 className="text-xl font-bold text-white mb-2">No Active Tasks</h3><p className="text-gray-400">No pending tasks available at the moment.</p></div>
          )}
        </div>
        <div className="px-4 md:px-6 py-3 md:py-4 border-t border-white/[0.06] bg-white/[0.01]">
          <div className="flex items-center justify-between mb-2 md:mb-3"><span className="text-xs font-medium text-gray-500">Product Queue</span><span className="text-xs font-bold text-indigo-400">{completedCount}/{totalTasks} completed</span></div>
          <ProgressTracker tasks={taskList} currentTask={pendingTask?.task_number || 0} productCatalog={productCatalog} />
        </div>
      </div>
      <div className="flex items-center gap-4 md:gap-6 px-2">
        <div className="flex items-center gap-1.5 md:gap-2"><div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-emerald-500" /><span className="text-xs text-gray-400">Completed</span></div>
        <div className="flex items-center gap-1.5 md:gap-2"><div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-indigo-500 animate-pulse" /><span className="text-xs text-gray-400">Current</span></div>
        <div className="flex items-center gap-1.5 md:gap-2"><div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-gray-700" /><span className="text-xs text-gray-400">Locked</span></div>
      </div>
    </div>
  );
};

export default TaskGrid;
