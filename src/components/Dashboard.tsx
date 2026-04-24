import React, { useEffect, useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { DollarSign, Zap, Award, Wallet, ArrowDownToLine, TrendingUp, CheckCircle, Clock, Lock, ArrowRight, BarChart3, Target, GraduationCap, Star, MessageCircle, AlertTriangle, Home, Play, FileText, Headphones } from 'lucide-react';
import { DailyBonusCompact } from './DailyBonus';
import CombinationOrderModal from './CombinationOrderModal';
import CustomerService from './CustomerService';
import CSSelectionModal from './CSSelectionModal';

const Dashboard: React.FC = () => {
  const context = useAppContext();
  const { user, tasks, wallets, transactions, walletState, refreshTasks, refreshWallets, refreshTransactions, setActiveTab } = context;
  
  // Safety wrapper for setActiveTab
  const safeSetActiveTab = (tab: string) => {
    if (typeof setActiveTab === 'function') {
      setActiveTab(tab);
    } else {
      console.error('setActiveTab is not a function', context);
    }
  };
  
  const [isTraining, setIsTraining] = useState(false);
  const [isPersonal, setIsPersonal] = useState(false);
  const [trainingComplete, setTrainingComplete] = useState(false);
  const [showCombinationModal, setShowCombinationModal] = useState(false);
  const [showCustomerService, setShowCustomerService] = useState(false);
  const [showCSSelection, setShowCSSelection] = useState(false);
  const [showOnlineCS, setShowOnlineCS] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Stub functions for missing context methods
  const clearCombinationOrder = () => {
    console.log('Clear combination order');
  };
  const upgradeAccount = () => {
    console.log('Upgrade account');
  };

  // Load data ONCE when user is available - no retry loop
  useEffect(() => {
    if (!user || dataLoaded) return;
    
    let cancelled = false;
    const loadData = async () => {
      try {
        await Promise.allSettled([
          refreshTasks(),
          refreshWallets(),
          refreshTransactions()
        ]);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        if (!cancelled) setDataLoaded(true);
      }
    };
    loadData();
    return () => { cancelled = true; };
  }, [user]); // only depend on user, not on unstable function refs

  useEffect(() => {
    try {
      if (user) {
        setIsTraining(user.account_type === 'training');
        setIsPersonal(user.account_type === 'personal');
        setTrainingComplete(user.training_completed);
        
        // Show combination modal when pending order is detected
        if (user.has_pending_order && user.is_negative_balance) {
          setShowCombinationModal(true);
        }
      }
    } catch (err: any) {
      console.error('Error in user effect:', err);
    }
  }, [user]);

  const safeTasks = tasks || [];
  const safeWallets = wallets || [];
  const safeTransactions = transactions || [];
  
  const completedCount = safeTasks.filter(t => t.status === 'completed').length;
  const nextTask = safeTasks.find(t => t.status === 'pending');
  const totalReward = safeTasks.filter(t => t.status === 'completed').reduce((sum, t) => sum + (t.reward || 0), 0);
  const progress = safeTasks.length > 0 ? (completedCount / safeTasks.length) * 100 : 0;
  const primaryWallet = safeWallets.find(w => w.is_primary);
  const allTasksComplete = isTraining ? completedCount === 45 : completedCount === safeTasks.length;
  const pendingWithdrawals = safeTransactions.filter(t => t.type === 'withdrawal' && t.status === 'pending');

  // Show loading state while data is being fetched
  if (!dataLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060a14]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Welcome Banner */}
      <div className="relative p-6 bg-gradient-to-r from-indigo-600/20 via-purple-600/15 to-pink-600/10 border border-indigo-500/20 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -left-24 top-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl animate-pulse" />
          <div
            className="absolute -right-20 top-0 w-72 h-72 rounded-full bg-purple-500/10 blur-3xl animate-pulse"
            style={{ animationDuration: '6s' }}
          />
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: 'linear-gradient(120deg, transparent 10%, rgba(255,255,255,0.08) 35%, transparent 65%)',
              backgroundSize: '220% 100%',
              animation: 'shimmer 9s linear infinite'
            }}
          />
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        
        {/* CS Button - Top Right */}
        <button
          onClick={() => setShowCSSelection(true)}
          className="absolute top-4 right-4 z-20 w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-500/30 hover:scale-105 transition-transform animate-pulse"
          title="Customer Service"
        >
          <Headphones size={20} className="text-white" />
        </button>
        
        <CSSelectionModal
          isOpen={showCSSelection}
          onClose={() => setShowCSSelection(false)}
          onSelectTelegram={() => {
            setShowCSSelection(false);
            window.open('https://t.me/EARNINGSLLCONLINECS1', '_blank');
          }}
          onSelectOnline={() => {
            setShowCSSelection(false);
            setShowCustomerService(true);
          }}
        />

        <CustomerService
          isOpen={showCustomerService}
          onClose={() => setShowCustomerService(false)}
        />

        <div className="relative pr-16 z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Zap size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-green-500">
                {isTraining ? 'Welcome back!' : 
                 user?.user_status === 'waiting_for_training' ? 'Account Created!' :
                 `Welcome back, ${user?.display_name || 'User'}!`}
              </h1>
              <p className="text-sm text-gray-400">
                {isTraining ? 'Training Account' :
                 user?.user_status === 'waiting_for_training' ? 'Your training account is being prepared by admin. Please wait for your login details through official Telegram support.' :
                 user?.account_type === 'personal' ? `VIP${user?.vip_level || 1} Member` : 'Member'}
              </p>
            </div>
          </div>
          <p className="text-gray-400 text-sm">
            {isTraining
              ? trainingComplete
                ? 'Training completed! You can now upgrade to a personal account.'
                : `Complete ${45 - completedCount} more tasks to finish training.`
              : allTasksComplete
                ? 'All tasks complete! You can now withdraw your earnings.'
                : `You have ${safeTasks.length - completedCount} tasks remaining in your VIP${user?.vip_level || 1} set.`}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className={`p-6 bg-white/[0.02] border rounded-2xl ${
          user?.is_negative_balance ? 'border-red-500/20 bg-red-500/5' : 'border-white/[0.06]'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                user?.is_negative_balance ? 'bg-red-500/20' : 'bg-emerald-500/15'
              }`}>
                <DollarSign size={20} className={user?.is_negative_balance ? 'text-red-400' : 'text-emerald-400'} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Balance</h3>
                <p className={`text-sm ${user?.is_negative_balance ? 'text-red-400' : 'text-gray-500'}`}>
                  {user?.is_negative_balance ? 'Negative Balance - Contact Support' : 'Available funds'}
                </p>
              </div>
            </div>
            {user?.has_pending_order && (
              <div className="px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full">
                <span className="text-xs font-medium text-red-400">Pending Order</span>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <p className={`text-3xl font-bold ${
              user?.is_negative_balance ? 'text-red-400' : 'text-white'
            }`}>
              ${walletState.available_balance.toFixed(2)}
            </p>
            {user?.has_pending_order && (
              <div className="flex items-center gap-2 text-xs text-red-400">
                <AlertTriangle size={12} />
                <span>Pending: ${user?.pending_amount?.toFixed(2) || '0.00'}</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-5 bg-white/[0.03] border border-white/[0.06] rounded-2xl hover:border-indigo-500/20 transition-all group cursor-pointer" onClick={() => safeSetActiveTab('tasks')}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-500/15 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Zap size={20} className="text-indigo-400" />
            </div>
            <Target size={14} className="text-indigo-400" />
          </div>
          <p className="text-xs text-gray-500 font-medium">Tasks</p>
          <p className="text-2xl font-bold text-white">{completedCount}<span className="text-sm text-gray-500 font-normal">/{isTraining ? 45 : safeTasks.length}</span></p>
        </div>

        <div className="p-5 bg-white/[0.03] border border-white/[0.06] rounded-2xl hover:border-indigo-500/20 transition-all group cursor-pointer" onClick={() => safeSetActiveTab('profile')}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-xl bg-purple-500/15 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BarChart3 size={20} className="text-purple-400" />
            </div>
            <TrendingUp size={14} className="text-purple-400" />
          </div>
          <p className="text-xs text-gray-500 font-medium">Total Earned</p>
          <p className="text-2xl font-bold text-white">${walletState.total_earned.toFixed(2)}</p>
        </div>

        <div className="p-5 bg-white/[0.03] border border-white/[0.06] rounded-2xl hover:border-indigo-500/20 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-xl bg-green-500/15 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Star size={20} className="text-green-400" />
            </div>
            <MessageCircle size={14} className="text-green-400" />
          </div>
          <p className="text-xs text-gray-500 font-medium">My Referral Code</p>
          <div className="space-y-1">
            <p className="text-lg font-bold text-white">{user?.referral_code || 'N/A'}</p>
            <button 
              onClick={() => {
                if (user?.referral_code) {
                  navigator.clipboard.writeText(user.referral_code);
                  // You could add a toast notification here
                }
              }}
              className="text-xs text-green-400 hover:text-green-300 transition-colors"
            >
              Click to copy
            </button>
          </div>
        </div>

        <div className="p-5 bg-white/[0.03] border border-white/[0.06] rounded-2xl hover:border-indigo-500/20 transition-all group cursor-pointer" onClick={() => safeSetActiveTab('wallet')}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/15 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Wallet size={20} className="text-amber-400" />
            </div>
            {primaryWallet ? <CheckCircle size={14} className="text-emerald-400" /> : <Lock size={14} className="text-amber-400" />}
          </div>
          <p className="text-xs text-gray-500 font-medium">Wallet</p>
          <p className="text-sm font-bold text-white truncate">{primaryWallet ? primaryWallet.wallet_type : 'Not Bound'}</p>
        </div>
      </div>

      {/* Progress Section */}
      <div className="p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">
            {isTraining ? 'Training Progress' : `VIP${user?.vip_level || 1} Progress`}
          </h3>
          <button
            onClick={() => safeSetActiveTab('tasks')}
            className="flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            View All Tasks <ArrowRight size={14} />
          </button>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">{completedCount} of {isTraining ? 45 : safeTasks.length} tasks completed</span>
            <span className="text-sm font-bold text-indigo-400">{progress.toFixed(0)}%</span>
          </div>
          <div className="h-3 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-700 relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
            </div>
          </div>
        </div>

        {/* Mini Task Preview */}
        <div className="flex flex-wrap gap-1.5 mt-4">
          {(safeTasks.length > 0 ? safeTasks : Array.from({ length: isTraining ? 45 : 35 }, (_, i) => ({ task_number: i + 1, status: i === 0 ? 'pending' : 'locked' }))).map((task: any) => (
            <div
              key={task.task_number}
              className={`w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-bold ${
                task.status === 'completed' ? 'bg-emerald-500/30 text-emerald-400' :
                task.status === 'pending' ? 'bg-indigo-500/30 text-indigo-400 animate-pulse' :
                'bg-white/5 text-gray-600'
              }`}
            >
              {task.task_number}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isTraining && !trainingComplete && (
          <button
            onClick={() => window.open('https://t.me/EARNINGSLLCONLINECS1', '_blank')}
            className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl hover:bg-white/[0.05] transition-all group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                <MessageCircle size={20} className="text-blue-400" />
              </div>
              <span className="text-white font-semibold">Contact Support</span>
            </div>
            <p className="text-xs text-gray-500">Get help from customer service</p>
          </button>
        )}

        {/* Clear Order - Hidden for training accounts, only admin can clear */}
        {user?.has_pending_order && user?.account_type !== 'training' && (
          <button
            onClick={clearCombinationOrder}
            className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500/15 transition-all group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center group-hover:bg-red-500/30 transition-colors">
                <AlertTriangle size={20} className="text-red-400" />
              </div>
              <span className="text-white font-semibold">Clear Order</span>
            </div>
            <p className="text-xs text-red-400">Clear pending combination order</p>
          </button>
        )}

        {isPersonal && !trainingComplete && (
          <button
            disabled
            className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl opacity-50 cursor-not-allowed group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                <Star size={20} className="text-amber-400" />
              </div>
              <span className="text-white font-semibold">Upgrade to VIP1</span>
            </div>
            <p className="text-xs text-gray-500">Unlock 0.5% task rewards</p>
          </button>
        )}

        {isPersonal && !trainingComplete && (
          <button
            disabled
            className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl opacity-50 cursor-not-allowed group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                <Star size={20} className="text-purple-400" />
              </div>
              <span className="text-white font-semibold">Upgrade to VIP2</span>
            </div>
            <p className="text-xs text-gray-500">Unlock 1% task rewards</p>
          </button>
        )}

        {isTraining && trainingComplete && (
          <button
            onClick={() => upgradeAccount(1)}
            className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl hover:bg-white/[0.05] transition-all group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                <GraduationCap size={20} className="text-emerald-400" />
              </div>
              <span className="text-white font-semibold">Upgrade to VIP1</span>
            </div>
            <p className="text-xs text-gray-500">Start earning with VIP rewards</p>
          </button>
        )}

        {isPersonal && (
          <button
            onClick={() => safeSetActiveTab('withdraw')}
            className={`p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl hover:bg-white/[0.05] transition-all group ${
              user?.has_pending_order || user?.is_negative_balance ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={user?.has_pending_order || user?.is_negative_balance}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                <ArrowDownToLine size={20} className="text-emerald-400" />
              </div>
              <span className="text-white font-semibold">
                {user?.has_pending_order || user?.is_negative_balance ? 'Tasks Incomplete' : 'Withdraw Funds'}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              {user?.has_pending_order || user?.is_negative_balance ? 'Clear pending orders first' : 'Withdraw your earnings'}
            </p>
          </button>
        )}

        <DailyBonusCompact />
      </div>

      {/* Recent Transactions */}
      {safeTransactions.length > 0 && (
        <div className="p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Recent Withdrawals</h3>
            <button
              onClick={() => safeSetActiveTab('withdraw')}
              className="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              View All
            </button>
          </div>
          <div className="space-y-2">
            {safeTransactions.slice(0, 3).map(w => (
              <div key={w.id} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                    <ArrowDownToLine size={14} className="text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">${w.amount.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">{new Date(w.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  w.status === 'completed' ? 'bg-emerald-500/15 text-emerald-400' :
                  w.status === 'processing' ? 'bg-blue-500/15 text-blue-400' :
                  w.status === 'rejected' ? 'bg-red-500/15 text-red-400' :
                  'bg-amber-500/15 text-amber-400'
                }`}>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 pb-safe pt-2">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-around">
          <button
            onClick={() => safeSetActiveTab('dashboard')}
            className="flex flex-col items-center gap-1"
          >
            <Home className="w-6 h-6 text-gray-400" />
            <span className="text-xs text-gray-400">Home</span>
          </button>
          
          <button 
            onClick={() => safeSetActiveTab('tasks')}
            className="flex flex-col items-center gap-1 relative -top-4"
          >
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Play className="w-8 h-8 text-white ml-1" />
            </div>
            <span className="text-white text-xs font-medium">Start</span>
          </button>

          <button
            onClick={() => safeSetActiveTab('withdraw')}
            className="flex flex-col items-center gap-1"
          >
            <FileText className="w-6 h-6 text-gray-400" />
            <span className="text-xs text-gray-400">Record</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
