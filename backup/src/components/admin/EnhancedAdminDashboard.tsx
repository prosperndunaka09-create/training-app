import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
// import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import {
  LayoutDashboard, Users, ArrowDownToLine, RefreshCw, Shield, ChevronLeft,
  BarChart3, Activity, Zap, Lock, Eye, EyeOff, LogIn, UserPlus, Settings
} from 'lucide-react';
import AdminStatsCards, { PlatformStats } from './AdminStatsCards';
import AdminUsersTable, { AdminUser } from './AdminUsersTable';
import AdminWithdrawalsTable, { AdminWithdrawal } from './AdminWithdrawalsTable';
import UserDetailModal from './UserDetailModal';
import AccountCreation from './AccountCreation';
import AdminControls from './AdminControls';
import UserRegistrationManagement from './UserRegistrationManagement';

// Mock supabase for now - replace with real import when ready
const supabase = {
  from: () => ({
    select: () => ({
      order: () => ({
        then: (resolve: any) => resolve({ data: [], error: null })
      })
    }),
    insert: () => ({
      select: () => ({
        single: () => ({
          then: (resolve: any) => resolve({ data: null, error: null })
        })
      })
    })
  })
};

// Mock data for demo when backend has no data
const generateMockUsers = (): AdminUser[] => {
  const names = [
    'Alex Johnson', 'Maria Garcia', 'James Wilson', 'Sarah Chen', 'Michael Brown',
    'Emma Davis', 'Daniel Martinez', 'Olivia Taylor', 'William Anderson', 'Sophia Thomas',
    'Benjamin Lee', 'Isabella White', 'Lucas Harris', 'Mia Clark', 'Henry Lewis',
    'Charlotte Robinson', 'Alexander Walker', 'Amelia Hall', 'Sebastian Young', 'Harper King',
    'Jack Wright', 'Evelyn Lopez', 'Owen Hill', 'Abigail Scott', 'Liam Green',
    'Emily Adams', 'Noah Baker', 'Ella Nelson', 'Ethan Carter', 'Aria Mitchell',
    'Mason Perez', 'Chloe Roberts', 'Logan Turner', 'Lily Phillips', 'Jacob Campbell',
  ];

  return names.map((name, i) => {
    const completed = Math.floor(Math.random() * 36);
    const earned = completed * (2.5 + Math.random() * 2);
    const balance = earned * (0.3 + Math.random() * 0.7);
    const daysAgo = Math.floor(Math.random() * 90);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    return {
      id: `user_${i + 1}_${Date.now()}`,
      email: `${name.toLowerCase().replace(' ', '.')}@email.com`,
      phone: Math.random() > 0.3 ? `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}` : null,
      display_name: name,
      vip_level: Math.min(5, Math.floor(Math.random() * 3) + 1),
      balance: Math.round(balance * 100) / 100,
      total_earned: Math.round(earned * 100) / 100,
      referral_code: `OPT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      created_at: date.toISOString(),
      tasks_completed: completed,
      tasks_total: 35,
    };
  });
};

const generateMockWithdrawals = (users: AdminUser[]): AdminWithdrawal[] => {
  const statuses: AdminWithdrawal['status'][] = ['pending', 'pending', 'pending', 'completed', 'completed', 'processing', 'rejected'];
  const _walletTypes = ['TRC20', 'ERC20', 'BEP20'];


  return Array.from({ length: 18 }, (_, i) => {
    const user = users[Math.floor(Math.random() * users.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    return {
      id: `wd_${i + 1}_${Date.now()}`,
      user_id: user.id,
      amount: Math.round((10 + Math.random() * 140) * 100) / 100,
      wallet_address: `T${Math.random().toString(36).substring(2, 12)}${Math.random().toString(36).substring(2, 12)}${Math.random().toString(36).substring(2, 8)}`.toUpperCase(),
      status,
      created_at: date.toISOString(),
      processed_at: status === 'completed' || status === 'rejected' ? new Date().toISOString() : null,
      user_name: user.display_name,
      user_email: user.email,
    };
  });
};

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'withdrawals' | 'create' | 'controls'>('overview');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [stats, setStats] = useState<PlatformStats>({
    totalUsers: 0, totalPayouts: 0, pendingPayouts: 0, totalBalance: 0,
    completedTasks: 0, totalTasks: 0, activeToday: 0, pendingWithdrawals: 0, newUsersToday: 0,
  });
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawal[]>([]);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [useMockData, setUseMockData] = useState(false);

  const adminInvoke = async (body: any) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-handler', { body });
      if (error) return null;
      return data;
    } catch {
      return null;
    }
  };

  const loadData = useCallback(async (showRefreshToast = false) => {
    setIsLoading(true);
    try {
      // Fetch real data from Supabase
      const [usersRes, withdrawalsRes] = await Promise.all([
        supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('withdrawals')
          .select('*')
          .order('created_at', { ascending: false })
      ]);

      if (usersRes.error) throw usersRes.error;
      if (withdrawalsRes.error) throw withdrawalsRes.error;

      const users = usersRes.data || [];
      const withdrawals = withdrawalsRes.data || [];

      setUsers(users);
      setWithdrawals(withdrawals);
      setUseMockData(false);

      // Calculate real stats
      const today = new Date().toISOString().split('T')[0];
      const stats: PlatformStats = {
        totalUsers: users.length,
        totalPayouts: withdrawals.filter(w => w.status === 'completed').reduce((s, w) => s + (w.amount || 0), 0),
        pendingPayouts: withdrawals.filter(w => w.status === 'pending').reduce((s, w) => s + (w.amount || 0), 0),
        totalBalance: users.reduce((s, u) => s + (u.balance || 0), 0),
        completedTasks: users.reduce((s, u) => s + (u.tasks_completed || 0), 0),
        totalTasks: users.reduce((s, u) => s + (u.tasks_total || 35), 0),
        activeToday: users.filter(u => u.last_login && u.last_login.startsWith(today)).length,
        pendingWithdrawals: withdrawals.filter(w => w.status === 'pending').length,
        newUsersToday: users.filter(u => u.created_at && u.created_at.startsWith(today)).length,
        totalEarnings: users.reduce((s, u) => s + (u.total_earned || 0), 0),
        averageTasksPerUser: users.length > 0 ? Math.round(users.reduce((s, u) => s + (u.tasks_completed || 0), 0) / users.length) : 0,
        topPerformers: users.filter(u => (u.tasks_completed || 0) >= 30).length,
        flaggedAccounts: users.filter(u => u.status === 'flagged').length,
      };

      setStats(stats);

      if (showRefreshToast) {
        toast('Data refreshed successfully');
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast('Failed to load admin data');
      
      // Fallback to empty state if real data fails
      setUsers([]);
      setWithdrawals([]);
      setStats({
        totalUsers: 0, totalPayouts: 0, pendingPayouts: 0, totalBalance: 0,
        completedTasks: 0, totalTasks: 0, activeToday: 0, pendingWithdrawals: 0, newUsersToday: 0,
        totalEarnings: 0, averageTasksPerUser: 0, topPerformers: 0, flaggedAccounts: 0,
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [adminPassword]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Accept any password for demo, or validate against GATEWAY_API_KEY on backend
    setIsAuthenticated(true);
    localStorage.setItem('admin_authenticated', 'true');
    loadData();
  };

  useEffect(() => {
    const saved = localStorage.getItem('admin_authenticated');
    if (saved === 'true') {
      setIsAuthenticated(true);
      loadData();
    }
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('admin_authenticated');
  };

  const handleApproveWithdrawal = async (id: string) => {
    setProcessingIds(prev => new Set(prev).add(id));
    try {
      if (!useMockData) {
        const res = await adminInvoke({ action: 'approve_withdrawal', withdrawalId: id, adminKey: adminPassword });
        if (res?.success) {
          await loadData();
          toast({ title: 'Withdrawal Approved', description: 'The withdrawal has been approved and marked as completed.' });
          return;
        }
      }
      // Mock update
      setWithdrawals(prev => prev.map(w =>
        w.id === id ? { ...w, status: 'completed' as const, processed_at: new Date().toISOString() } : w
      ));
      setStats(prev => {
        const w = withdrawals.find(w => w.id === id);
        if (!w) return prev;
        return {
          ...prev,
          totalPayouts: prev.totalPayouts + w.amount,
          pendingPayouts: prev.pendingPayouts - w.amount,
          pendingWithdrawals: prev.pendingWithdrawals - 1,
        };
      });
      toast({ title: 'Withdrawal Approved', description: 'The withdrawal has been approved and marked as completed.' });
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleRejectWithdrawal = async (id: string) => {
    setProcessingIds(prev => new Set(prev).add(id));
    try {
      if (!useMockData) {
        const res = await adminInvoke({ action: 'reject_withdrawal', withdrawalId: id, adminKey: adminPassword });
        if (res?.success) {
          await loadData();
          toast({ title: 'Withdrawal Rejected', description: 'The withdrawal has been rejected and funds refunded.' });
          return;
        }
      }
      // Mock update
      setWithdrawals(prev => prev.map(w =>
        w.id === id ? { ...w, status: 'rejected' as const, processed_at: new Date().toISOString() } : w
      ));
      setStats(prev => {
        const w = withdrawals.find(w => w.id === id);
        if (!w) return prev;
        return {
          ...prev,
          pendingPayouts: prev.pendingPayouts - w.amount,
          pendingWithdrawals: prev.pendingWithdrawals - 1,
        };
      });
      toast({ title: 'Withdrawal Rejected', description: 'The withdrawal has been rejected and funds refunded.' });
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
    { id: 'users' as const, label: 'Users', icon: Users, count: users.length },
    { id: 'withdrawals' as const, label: 'Withdrawals', icon: ArrowDownToLine, count: withdrawals.filter(w => w.status === 'pending').length },
    { id: 'create' as const, label: 'Create Account', icon: UserPlus },
    { id: 'controls' as const, label: 'Admin Controls', icon: Settings },
  ];

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#060a14] flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
              <Shield size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-sm text-gray-500">Enter your admin credentials to continue</p>
          </div>

          <form onSubmit={handleLogin} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Admin Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
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
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-[#0a0e1a]/90 backdrop-blur-xl border-b border-indigo-500/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
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
                  {useMockData && (
                    <span className="ml-2 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-bold rounded-full">DEMO</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-400 hover:bg-white/10 hover:text-white disabled:opacity-50 transition-all"
              >
                <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={handleLogout}
                className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400 hover:bg-red-500/20 transition-all"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab Navigation */}
        <div className="flex items-center gap-1 mb-6 bg-white/[0.02] border border-white/[0.06] rounded-xl p-1 w-fit">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-500/15 text-indigo-400 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                  activeTab === tab.id ? 'bg-indigo-500/30 text-indigo-300' : 'bg-white/10 text-gray-500'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Platform Overview</h2>
              <p className="text-sm text-gray-500">Real-time statistics and platform health metrics</p>
            </div>
            <AdminStatsCards stats={stats} isLoading={isLoading} />

            {/* Quick Summary Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Users */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
                  <h3 className="text-sm font-bold text-white">Recent Users</h3>
                  <button
                    onClick={() => setActiveTab('users')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                  >
                    View All
                  </button>
                </div>
                <div className="divide-y divide-white/[0.03]">
                  {users.slice(0, 5).map(user => (
                    <div key={user.id} className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                          <span className="text-xs font-bold text-white">{user.display_name.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{user.display_name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">{user.tasks_completed}/{user.tasks_total} tasks</p>
                        <p className="text-xs text-emerald-400 font-medium">${user.balance.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pending Withdrawals */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
                  <h3 className="text-sm font-bold text-white">Pending Withdrawals</h3>
                  <button
                    onClick={() => setActiveTab('withdrawals')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                  >
                    View All
                  </button>
                </div>
                <div className="divide-y divide-white/[0.03]">
                  {withdrawals.filter(w => w.status === 'pending').slice(0, 5).map(w => (
                    <div key={w.id} className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors">
                      <div>
                        <p className="text-sm font-medium text-white">{w.user_name}</p>
                        <p className="text-xs text-gray-500 font-mono truncate max-w-[160px]">{w.wallet_address}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-amber-400">${w.amount.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">{new Date(w.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                  {withdrawals.filter(w => w.status === 'pending').length === 0 && (
                    <div className="px-4 py-8 text-center">
                      <Activity size={24} className="text-gray-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No pending withdrawals</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Activity Chart Placeholder */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-4">Platform Activity (Last 7 Days)</h3>
              <div className="flex items-end gap-2 h-40">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                  const height = 20 + Math.random() * 80;
                  return (
                    <div key={day} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full relative group">
                        <div
                          className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-lg transition-all group-hover:from-indigo-500 group-hover:to-indigo-300"
                          style={{ height: `${height}%`, minHeight: '8px' }}
                        />
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-[#141829] border border-white/10 rounded text-[10px] text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {Math.floor(height * 1.5)} actions
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-500 font-medium">{day}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">User Management</h2>
              <p className="text-sm text-gray-500">View and manage all registered users on the platform</p>
            </div>
            <AdminUsersTable
              users={users}
              isLoading={isLoading}
              onViewUser={(user) => setSelectedUser(user)}
            />
          </div>
        )}

        {activeTab === 'withdrawals' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Withdrawal Management</h2>
              <p className="text-sm text-gray-500">Review and process withdrawal requests</p>
            </div>
            <AdminWithdrawalsTable
              withdrawals={withdrawals}
              onRefresh={loadData}
              onProcessWithdrawal={processWithdrawal}
            />
          </div>
        )}

        {activeTab === 'create' && (
          <AccountCreation onAccountCreated={loadData} />
        )}

        {activeTab === 'controls' && (
          <AdminControls onRefresh={loadData} />
        )}
      </div>

      {/* User Detail Modal */}
      <UserDetailModal
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
      />
    </div>
  );
};

export default AdminDashboard;
