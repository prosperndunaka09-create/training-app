import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import {
  LayoutDashboard, Users, ArrowDownToLine, RefreshCw, Shield, ChevronLeft,
  BarChart3, Activity, LogIn, Headphones, Settings, UserPlus, Package,
  AlertTriangle, DollarSign, CheckCircle, Search, ShoppingBag
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AdminTasksManagement from './AdminTasksManagement';
import AdminCustomerService from './AdminCustomerService';
import AdminControls from './AdminControls';
import AccountCreation from './AccountCreation';
import EnhancedPendingOrdersManager from './EnhancedPendingOrdersManager';
import ProductCatalogManager from './ProductCatalogManager';
import { sendTelegramNotification } from '@/lib/realtime';

interface RealUser {
  id: string;
  email: string;
  phone?: string;
  display_name?: string;
  vip_level: number;
  balance: number;
  total_earned: number;
  referral_code: string;
  created_at: string;
  last_login?: string;
  account_status: 'active' | 'suspended' | 'flagged';
  is_frozen: boolean;
  tasks_completed: number;
  tasks_total?: number;
  account_type: 'personal' | 'training';
  referral_count?: number;
  status?: string;
  user_status?: string;
}

interface RealWithdrawal {
  id: string;
  user_id: string;
  amount: number;
  wallet_address: string;
  wallet_type: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  created_at: string;
  processed_at?: string;
  user_email: string;
  user_name: string;
}

interface RealStats {
  totalUsers: number;
  totalPayouts: number;
  pendingPayouts: number;
  totalBalance: number;
  completedTasks: number;
  totalTasks: number;
  activeToday: number;
  pendingWithdrawals: number;
  newUsersToday: number;
  totalEarnings: number;
  averageTasksPerUser: number;
  topPerformers: number;
  flaggedAccounts: number;
}

const ADMIN_PASSWORD = '08167731393';

const MainAdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'withdrawals' | 'pending-orders' | 'customer-service' | 'tasks' | 'product-catalog' | 'admin-controls' | 'create-account'>('overview');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('connected');

  const [stats, setStats] = useState<RealStats>({
    totalUsers: 0, totalPayouts: 0, pendingPayouts: 0, totalBalance: 0,
    completedTasks: 0, totalTasks: 0, activeToday: 0, pendingWithdrawals: 0, newUsersToday: 0,
    totalEarnings: 0, averageTasksPerUser: 0, topPerformers: 0, flaggedAccounts: 0,
  });

  const [users, setUsers] = useState<RealUser[]>([]);
  const [withdrawals, setWithdrawals] = useState<RealWithdrawal[]>([]);
  const [selectedUser, setSelectedUser] = useState<RealUser | null>(null);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [pendingOrderUsers, setPendingOrderUsers] = useState<RealUser[]>([]);
  const [pendingOrderSearch, setPendingOrderSearch] = useState('');

  // Check auth status on mount and subscribe to real-time updates
  useEffect(() => {
    const saved = localStorage.getItem('main_admin_authenticated');
    if (saved === 'true') {
      setIsAuthenticated(true);
      loadData();
    }

    // Subscribe to real-time users changes
    const usersSubscription = supabase
      .channel('users-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'users' },
        (payload) => {
          console.log('[MainAdmin] Real-time update received:', payload);
          loadData();
        }
      )
      .subscribe();

    return () => {
      usersSubscription.unsubscribe();
    };
  }, []);

  const loadData = useCallback(async (showRefreshToast = false) => {
    setIsLoading(true);
    console.log('[MainAdmin] Starting data load...');
    
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.error('[MainAdmin] Data load timed out after 30 seconds');
      setIsLoading(false);
      setIsRefreshing(false);
      toast({ 
        title: 'Error', 
        description: 'Data load timed out. Please check your connection and try again.',
        variant: 'destructive'
      });
    }, 30000);
    
    try {
      console.log('[MainAdmin] Loading data from Supabase...');
      
      // Get current session for consistent auth
      const { data: sessionData } = await supabase.auth.getSession();
      console.log('[MainAdmin] Current session:', sessionData.session ? 'Authenticated' : 'Not authenticated');
      
      // Test connection with cache-busting
      const { error: connectionError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .abortSignal(AbortSignal.timeout(5000));
        
      if (connectionError) {
        console.error('[MainAdmin] Connection test failed:', connectionError);
        setConnectionStatus('error');
        clearTimeout(timeoutId);
        setIsLoading(false);
        setIsRefreshing(false);
        toast({ 
          title: 'Connection Error', 
          description: 'Cannot connect to database. Please check your internet connection.',
          variant: 'destructive'
        });
        return;
      }
      
      setConnectionStatus('connected');
      
      // Fetch users from Supabase with cache busting
      console.log('[MainAdmin] Fetching users from Supabase...');
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .abortSignal(AbortSignal.timeout(10000));
      
      console.log('[MainAdmin] Users fetch result:', { 
        hasError: !!usersError, 
        errorMessage: usersError?.message,
        errorCode: usersError?.code,
        dataLength: usersData?.length,
        firstUser: usersData?.[0]?.email 
      });
      
      if (usersError) {
        console.error('[MainAdmin] Users fetch error:', usersError);
        toast({ 
          title: 'Error', 
          description: 'Failed to load users: ' + usersError.message,
          variant: 'destructive'
        });
      } else if (!usersData || usersData.length === 0) {
        console.warn('[MainAdmin] No users returned from Supabase - this may indicate a connection or permissions issue');
        // Try one more time with a simpler query
        console.log('[MainAdmin] Retrying with count query...');
        const { count, error: countError } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });
        
        console.log('[MainAdmin] Count query result:', { count, countError: countError?.message });
        
        if (count && count > 0) {
          // Users exist but we couldn't fetch them - likely an RLS or permissions issue
          toast({ 
            title: 'Warning', 
            description: `Database shows ${count} users but data could not be retrieved. This may be a permissions issue.`,
            variant: 'destructive'
          });
        }
        
        setUsers([]);
      } else {
        console.log('[MainAdmin] Loaded', usersData.length, 'users successfully');
        // Process users with account status
        const processedUsers = usersData.map(user => ({
          ...user,
          account_status: user.is_frozen ? 'suspended' : 'active'
        }));
        setUsers(processedUsers);
      }
      
      // Fetch withdrawals from Supabase
      const { data: withdrawalsData, error: withdrawalsError } = await supabase
        .from('withdrawals')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (withdrawalsError) {
        console.error('[MainAdmin] Withdrawals fetch error:', withdrawalsError);
      } else {
        console.log('[MainAdmin] Loaded', withdrawalsData?.length || 0, 'withdrawals');
        // Enrich withdrawals with user data
        const enrichedWithdrawals = (withdrawalsData || []).map((w) => {
          const user = usersData?.find((u: RealUser) => u.id === w.user_id);
          return {
            ...w,
            user_email: user?.email || 'Unknown',
            user_name: user?.display_name || user?.email?.split('@')[0] || 'Unknown'
          };
        });
        setWithdrawals(enrichedWithdrawals);
      }
      
      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      const users = usersData || [];
      const withdrawals = withdrawalsData || [];
      
      setStats({
        totalUsers: users.length,
        totalPayouts: withdrawals.filter((w: RealWithdrawal) => w.status === 'completed').reduce((s: number, w: RealWithdrawal) => s + (w.amount || 0), 0),
        pendingPayouts: withdrawals.filter((w: RealWithdrawal) => w.status === 'pending').reduce((s: number, w: RealWithdrawal) => s + (w.amount || 0), 0),
        totalBalance: users.reduce((s: number, u: RealUser) => s + (u.balance || 0), 0),
        completedTasks: users.reduce((s: number, u: RealUser) => s + (u.tasks_completed || 0), 0),
        totalTasks: users.reduce((s: number, u: RealUser) => s + (u.tasks_total || 35), 0),
        activeToday: users.filter((u: RealUser) => u.last_login && u.last_login.startsWith(today)).length,
        pendingWithdrawals: withdrawals.filter((w: RealWithdrawal) => w.status === 'pending').length,
        newUsersToday: users.filter((u: RealUser) => u.created_at && u.created_at.startsWith(today)).length,
        totalEarnings: users.reduce((s: number, u: RealUser) => s + (u.total_earned || 0), 0),
        averageTasksPerUser: users.length > 0 ? users.reduce((s: number, u: RealUser) => s + (u.tasks_completed || 0), 0) / users.length : 0,
        topPerformers: users.filter((u: RealUser) => (u.tasks_completed || 0) > 30).length,
        flaggedAccounts: users.filter((u: RealUser) => u.user_status === 'flagged' || u.user_status === 'suspended' || u.is_frozen).length,
      });

      if (showRefreshToast && users.length > 0) {
        toast({ 
          title: 'Success', 
          description: `Loaded ${users.length} users from Supabase` 
        });
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
      toast({ 
        title: 'Error', 
        description: 'Failed to load admin data: ' + (err as Error).message,
        variant: 'destructive'
      });
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPassword = adminPassword.trim();
    
    if (cleanPassword === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem('main_admin_authenticated', 'true');
      loadData();
      toast({
        title: 'Welcome',
        description: 'Admin access granted',
      });
    } else {
      toast({
        title: 'Authentication Failed',
        description: 'Invalid admin password',
        variant: 'destructive',
      });
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('main_admin_authenticated');
    setAdminPassword('');
    toast({
      title: 'Logged Out',
      description: 'You have been logged out of admin panel',
    });
  };

  const handleApproveWithdrawal = async (withdrawalId: string) => {
    setProcessingIds(prev => new Set(prev).add(withdrawalId));
    try {
      const { error } = await supabase
        .from('withdrawals')
        .update({ 
          status: 'completed', 
          processed_at: new Date().toISOString(),
          processed_by: 'admin'
        })
        .eq('id', withdrawalId);

      if (error) throw error;

      setWithdrawals(prev => prev.map(w => 
        w.id === withdrawalId ? { ...w, status: 'completed' as const, processed_at: new Date().toISOString() } : w
      ));

      toast({
        title: 'Withdrawal Approved',
        description: 'Withdrawal has been processed successfully',
      });
      
      // Refresh stats
      loadData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve withdrawal',
        variant: 'destructive',
      });
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(withdrawalId);
        return newSet;
      });
    }
  };

  const handleRejectWithdrawal = async (withdrawalId: string) => {
    setProcessingIds(prev => new Set(prev).add(withdrawalId));
    try {
      const { error } = await supabase
        .from('withdrawals')
        .update({ 
          status: 'rejected', 
          processed_at: new Date().toISOString(),
          processed_by: 'admin'
        })
        .eq('id', withdrawalId);

      if (error) throw error;

      setWithdrawals(prev => prev.map(w => 
        w.id === withdrawalId ? { ...w, status: 'rejected' as const, processed_at: new Date().toISOString() } : w
      ));

      toast({
        title: 'Withdrawal Rejected',
        description: 'Withdrawal has been rejected',
      });
      
      loadData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject withdrawal',
        variant: 'destructive',
      });
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(withdrawalId);
        return newSet;
      });
    }
  };

  const handleFreezeUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_frozen: true, frozen_reason: 'Administrative action' })
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, is_frozen: true, account_status: 'suspended' as const } : u
      ));

      toast({
        title: 'User Frozen',
        description: 'User account has been frozen successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to freeze user account',
        variant: 'destructive',
      });
    }
  };

  const handleUnfreezeUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_frozen: false, frozen_reason: null })
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, is_frozen: false, account_status: 'active' as const } : u
      ));

      toast({
        title: 'User Unfrozen',
        description: 'User account has been unfrozen successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to unfreeze user account',
        variant: 'destructive',
      });
    }
  };

  // Pending Orders Functions
  const loadPendingOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('has_pending_order', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pending orders:', error);
        toast({
          title: 'Error',
          description: 'Failed to load pending orders',
          variant: 'destructive'
        });
        return;
      }

      setPendingOrderUsers(data || []);
    } catch (error) {
      console.error('Exception loading pending orders:', error);
    }
  };

  const handleClearPendingOrder = async (userId: string) => {
    setProcessingIds(prev => new Set(prev).add(userId));
    
    try {
      // Get current admin user ID
      const { data: { user: adminUser } } = await supabase.auth.getUser();
      
      if (!adminUser) {
        toast({
          title: 'Error',
          description: 'Admin authentication required',
          variant: 'destructive'
        });
        return;
      }

      // Call the admin function to clear pending order and add 6× profit
      const { data, error } = await supabase.rpc('admin_clear_pending_order', {
        p_admin_id: adminUser.id,
        p_user_id: userId
      });

      if (error) {
        console.error('Error clearing pending order:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to clear pending order',
          variant: 'destructive'
        });
        return;
      }

      const result = data as { success: boolean; profit?: number; error?: string };
      
      if (result.success) {
        toast({
          title: 'Success!',
          description: `Cleared pending order and added $${result.profit?.toFixed(2)} (6× profit)`,
        });
        
        // Get user details for Telegram notification
        const user = pendingOrderUsers.find(u => u.id === userId);
        const pendingAmount = user ? (user as any).pending_amount || 0 : 0;
        const profit = result.profit || pendingAmount * 6;
        
        // Send Telegram notification
        await sendTelegramNotification('PENDING_ORDER_CLEARED', {
          userEmail: user?.email || 'Unknown',
          userId: userId,
          pendingAmount: pendingAmount.toFixed(2),
          profit: profit.toFixed(2),
          totalCredit: (pendingAmount + profit).toFixed(2),
          adminEmail: adminUser.email || 'Admin'
        });
        
        // Remove user from list
        setPendingOrderUsers(prev => prev.filter(u => u.id !== userId));
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to clear pending order',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('Exception clearing pending order:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to clear pending order',
        variant: 'destructive'
      });
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  // Calculate 6× profit
  const calculate6xProfit = (pendingAmount: number) => {
    return pendingAmount * 6;
  };

  // Filter pending order users based on search
  const filteredPendingUsers = pendingOrderSearch
    ? pendingOrderUsers.filter(user =>
        user.email.toLowerCase().includes(pendingOrderSearch.toLowerCase()) ||
        user.display_name?.toLowerCase().includes(pendingOrderSearch.toLowerCase())
      )
    : pendingOrderUsers;

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#060a14] flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
              <Shield size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Admin Panel</h1>
            <p className="text-sm text-gray-500">Enter admin credentials to continue</p>
          </div>

          <form onSubmit={handleLogin} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Admin Password</label>
              <div className="relative">
                <Shield size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full pl-10 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/25"
            >
              <LogIn size={16} />
              Access Dashboard
            </button>

            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <ChevronLeft size={14} />
              Back to Main Site
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060a14] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0e1a]/95 backdrop-blur-xl border-b border-indigo-500/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                title="Back to site"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Shield size={16} className="text-white" />
                </div>
                <div>
                  <span className="text-sm font-bold text-white">Admin Panel</span>
                  <Badge 
                    variant="secondary" 
                    className={`ml-2 text-[10px] border ${
                      connectionStatus === 'connected' 
                        ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                        : connectionStatus === 'error'
                        ? 'bg-red-500/20 text-red-400 border-red-500/30'
                        : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                    }`}
                  >
                    {connectionStatus === 'connected' ? '● LIVE' : connectionStatus === 'error' ? '● ERROR' : '● OFFLINE'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <RefreshCw size={14} className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="border-red-600 text-red-400 hover:bg-red-600/10"
              >
                <LogIn size={14} className="mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-[#0a0e1a]/50 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 overflow-x-auto py-2">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'withdrawals', label: 'Withdrawals', icon: ArrowDownToLine },
              { id: 'pending-orders', label: 'Pending Orders', icon: AlertTriangle },
              { id: 'customer-service', label: 'Customer Service', icon: Headphones },
              { id: 'tasks', label: 'Tasks', icon: Package },
              { id: 'product-catalog', label: 'Product Catalog', icon: ShoppingBag },
              { id: 'admin-controls', label: 'Admin Controls', icon: Settings },
              { id: 'create-account', label: 'Create Account', icon: UserPlus },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon size={16} />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading && activeTab !== 'tasks' && activeTab !== 'customer-service' && activeTab !== 'admin-controls' && activeTab !== 'create-account' && activeTab !== 'product-catalog' ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Loading admin dashboard...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Platform Overview</h2>
                  <p className="text-sm text-gray-500">Real-time statistics and platform health metrics</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-400">Total Users</p>
                          <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
                          <p className="text-xs text-slate-400">
                            <span className="text-green-400">+{stats.newUsersToday}</span> today
                          </p>
                        </div>
                        <Users className="h-8 w-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-400">Total Balance</p>
                          <p className="text-2xl font-bold text-white">${stats.totalBalance.toFixed(2)}</p>
                          <p className="text-xs text-slate-400">Across all users</p>
                        </div>
                        <BarChart3 className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-400">Pending Withdrawals</p>
                          <p className="text-2xl font-bold text-white">${stats.pendingPayouts.toFixed(2)}</p>
                          <p className="text-xs text-slate-400">{stats.pendingWithdrawals} requests</p>
                        </div>
                        <Activity className="h-8 w-8 text-orange-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-400">Completed Tasks</p>
                          <p className="text-2xl font-bold text-white">{stats.completedTasks}</p>
                          <p className="text-xs text-slate-400">
                            {stats.averageTasksPerUser.toFixed(1)} avg per user
                          </p>
                        </div>
                        <RefreshCw className="h-8 w-8 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Users */}
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center text-lg">
                        <Users className="w-5 h-5 mr-2 text-blue-500" />
                        Recent Users
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {users.slice(0, 5).map((user) => (
                          <div key={user.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                <span className="text-xs font-bold text-white">{(user.display_name || user.email || 'U').charAt(0).toUpperCase()}</span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white">{user.display_name || user.email?.split('@')[0] || 'Unknown'}</p>
                                <p className="text-xs text-slate-400">{user.email}</p>
                              </div>
                            </div>
                            <Badge variant={user.account_status === 'active' ? 'default' : 'destructive'}>
                              {user.account_status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Pending Withdrawals */}
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center text-lg">
                        <ArrowDownToLine className="w-5 h-5 mr-2 text-green-500" />
                        Pending Withdrawals
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {withdrawals.filter(w => w.status === 'pending').slice(0, 5).map(w => (
                          <div key={w.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                            <div>
                              <p className="text-sm font-medium text-white">{w.user_name}</p>
                              <p className="text-xs text-slate-400 font-mono truncate max-w-[160px]">{w.wallet_address}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-amber-400">${w.amount.toFixed(2)}</p>
                              <p className="text-xs text-slate-500">{new Date(w.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                        ))}
                        {withdrawals.filter(w => w.status === 'pending').length === 0 && (
                          <div className="text-center py-8 text-slate-400">
                            <Activity size={24} className="mx-auto mb-2 opacity-50" />
                            <p>No pending withdrawals</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">User Management</h2>
                    <p className="text-sm text-gray-500">Manage user accounts and permissions</p>
                  </div>
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                    {users.length} Total Users
                  </Badge>
                </div>

                <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-700/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">User</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Type</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">VIP</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Balance</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Tasks</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700">
                        {users.map((user) => (
                          <tr key={user.id} className="hover:bg-slate-700/30 transition-colors">
                            <td className="px-4 py-3">
                              <div>
                                <p className="text-sm font-medium text-white">{user.display_name || user.email?.split('@')[0]}</p>
                                <p className="text-xs text-slate-400">{user.email}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant={user.account_type === 'training' ? 'secondary' : 'default'}>
                                {user.account_type}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm text-white">VIP{user.vip_level}</span>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm font-medium text-emerald-400">${user.balance?.toFixed(2) || '0.00'}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm text-white">{user.tasks_completed || 0}</p>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant={user.is_frozen ? 'destructive' : 'default'}>
                                {user.is_frozen ? 'Frozen' : 'Active'}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {user.is_frozen ? (
                                  <button
                                    onClick={() => handleUnfreezeUser(user.id)}
                                    className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs hover:bg-green-500/30 transition-colors"
                                  >
                                    Unfreeze
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleFreezeUser(user.id)}
                                    className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30 transition-colors"
                                  >
                                    Freeze
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Withdrawals Tab */}
            {activeTab === 'withdrawals' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Withdrawal Management</h2>
                    <p className="text-sm text-gray-500">Process and manage withdrawal requests</p>
                  </div>
                  <Badge variant="secondary" className="bg-amber-500/20 text-amber-400">
                    {withdrawals.filter(w => w.status === 'pending').length} Pending
                  </Badge>
                </div>

                <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-700/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">User</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Wallet</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700">
                        {withdrawals.map((w) => (
                          <tr key={w.id} className="hover:bg-slate-700/30 transition-colors">
                            <td className="px-4 py-3">
                              <div>
                                <p className="text-sm font-medium text-white">{w.user_name}</p>
                                <p className="text-xs text-slate-400">{w.user_email}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm font-bold text-white">${w.amount.toFixed(2)}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-xs text-slate-400 font-mono truncate max-w-[120px]">{w.wallet_address}</p>
                              <p className="text-xs text-slate-500">{w.wallet_type}</p>
                            </td>
                            <td className="px-4 py-3">
                              <Badge 
                                variant={
                                  w.status === 'completed' ? 'default' : 
                                  w.status === 'pending' ? 'secondary' : 
                                  'destructive'
                                }
                                className={
                                  w.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                  w.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                                  'bg-red-500/20 text-red-400'
                                }
                              >
                                {w.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-xs text-slate-400">{new Date(w.created_at).toLocaleDateString()}</p>
                            </td>
                            <td className="px-4 py-3">
                              {w.status === 'pending' && (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleApproveWithdrawal(w.id)}
                                    disabled={processingIds.has(w.id)}
                                    className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs hover:bg-green-500/30 transition-colors disabled:opacity-50"
                                  >
                                    {processingIds.has(w.id) ? 'Processing...' : 'Approve'}
                                  </button>
                                  <button
                                    onClick={() => handleRejectWithdrawal(w.id)}
                                    disabled={processingIds.has(w.id)}
                                    className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30 transition-colors disabled:opacity-50"
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Pending Orders Tab - ENHANCED with tracking */}
            {activeTab === 'pending-orders' && (
              <EnhancedPendingOrdersManager />
            )}

            {/* Customer Service Tab */}
            {activeTab === 'customer-service' && (
              <div className="h-[calc(100vh-180px)] -mx-4 -my-8">
                <AdminCustomerService />
              </div>
            )}

            {/* Tasks Tab */}
            {activeTab === 'tasks' && (
              <AdminTasksManagement />
            )}

            {/* Product Catalog Tab */}
            {activeTab === 'product-catalog' && (
              <ProductCatalogManager />
            )}

            {/* Admin Controls Tab */}
            {activeTab === 'admin-controls' && (
              <AdminControls onRefresh={loadData} />
            )}

            {/* Create Account Tab */}
            {activeTab === 'create-account' && (
              <AccountCreation onAccountCreated={loadData} />
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default MainAdminPanel;
