import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { toast } from 'sonner';
import {
  Shield,
  Users,
  ArrowDownToLine,
  FileText,
  Settings,
  LayoutDashboard,
  RefreshCw,
  LogIn,
  Search,
  Filter,
  AlertTriangle,
  Database,
  UserCheck,
  Target,
  Eye,
  EyeOff,
  TrendingUp,
  DollarSign,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  ChevronDown,
  Mail,
  Calendar,
  Zap,
  Crown,
  Star,
  Ban,
  Edit,
  Trash2
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  account_type: 'personal' | 'training';
  vip_level: number;
  tasks_completed: number;
  training_progress?: number;
  training_phase?: number;
  total_earned: number;
  balance: number;
  training_completed: boolean;
  referral_code: string;
  created_at: string;
  last_login: string;
  status: 'active' | 'suspended' | 'banned';
}

interface AdminUsersProps {
  onLogout: () => void;
}

const AdminUsers: React.FC<AdminUsersProps> = ({ onLogout }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      // Read real users from localStorage
      const loadedUsers: User[] = [];
      
      // Search through localStorage for user accounts
      if (typeof window !== 'undefined') {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            // Check for user accounts (opt_user, opt_account_*, training_account_*)
            if (key === 'opt_user' || key.startsWith('opt_account_') || key.startsWith('training_account_')) {
              const data = localStorage.getItem(key);
              if (data) {
                try {
                  const parsed = JSON.parse(data);
                  const userData = parsed.user || parsed;
                  
                  if (userData && userData.email) {
                    // Get actual task count from tasks storage
                    const userId = userData.id || userData.email;
                    const tasksKey = 'opt_tasks_' + userId;
                    const tasksData = localStorage.getItem(tasksKey);
                    let actualTasksCompleted = userData.tasks_completed || 0;
                    
                    if (tasksData) {
                      try {
                        const tasks = JSON.parse(tasksData);
                        actualTasksCompleted = tasks.filter((t: any) => t.status === 'completed').length;
                      } catch (e) {
                        // Use stored value if parsing fails
                      }
                    }
                    
                    loadedUsers.push({
                      id: userData.id || userData.email,
                      email: userData.email,
                      account_type: userData.account_type || 'personal',
                      vip_level: userData.vip_level || 1,
                      tasks_completed: actualTasksCompleted,
                      training_progress: actualTasksCompleted,
                      training_completed: userData.training_completed || false,
                      total_earned: userData.total_earned || 0,
                      balance: userData.balance || 0,
                      status: userData.status || 'active',
                      referral_code: userData.referral_code || '',
                      created_at: userData.created_at,
                      last_login: userData.last_login,
                      assigned_to: userData.assigned_to,
                      is_training_account: userData.is_training_account || false
                    });
                  }
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('[AdminUsers] Error loading users:', error);
      toast.error('Failed to load users from Supabase, using localStorage');
      // Fall back to localStorage on error
      const storedUsers = localStorage.getItem('registeredUsers');
      if (storedUsers) {
        const parsed = JSON.parse(storedUsers);
        const realUsers = parsed.filter((u: any) => !u.is_training_account);
        setUsers(realUsers);
        setFilteredUsers(realUsers);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    let filtered = users;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.referral_code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(user => user.status === filterStatus);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, filterStatus]);

  const handleSuspendUser = async (userId: string, email: string) => {
    try {
      // Mock suspend for now - replace with real supabase call later
      console.log(`Would suspend user ${userId} (${email})`);
      toast.success(`${email} has been suspended`);
      loadUsers();
    } catch (error) {
      console.error('Error suspending user:', error);
      toast.error('Failed to suspend user');
    }
  };

  const handleBanUser = async (userId: string, email: string) => {
    try {
      // Mock ban for now - replace with real supabase call later
      console.log(`Would ban user ${userId} (${email})`);
      toast.success(`${email} has been banned`);
      loadUsers();
    } catch (error) {
      console.error('Error banning user:', error);
      toast.error('Failed to ban user');
    }
  };

  const handleActivateUser = async (userId: string, email: string) => {
    try {
      // Mock activate for now - replace with real supabase call later
      console.log(`Would activate user ${userId} (${email})`);
      toast.success(`${email} has been activated`);
      loadUsers();
    } catch (error) {
      console.error('Error activating user:', error);
      toast.error('Failed to activate user');
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    try {
      // Delete from Supabase
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('Error deleting user:', error);
        toast.error('Failed to delete user');
        return;
      }

      toast.success(`${email} has been deleted`);
      setShowDeleteConfirm(false);
      setUserToDelete(null);
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>;
      case 'suspended':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Suspended</Badge>;
      case 'banned':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Banned</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Unknown</Badge>;
    }
  };

  const getAccountTypeBadge = (type: string) => {
    return type === 'personal' 
      ? <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Personal</Badge>
      : <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Training</Badge>;
  };

  const getVipLevelBadge = (level: number) => {
    return level === 0 
      ? <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Free</Badge>
      : <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">VIP {level}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">User Management</h2>
          <p className="text-slate-400">Manage all registered users and their accounts</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-600 text-white placeholder-slate-400 w-64"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-800 border-slate-600 text-white rounded px-3 py-2"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
            </select>
          </div>
          <Button
            onClick={loadUsers}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{users.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {users.filter(u => u.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              ${users.reduce((sum, user) => sum + (user.balance || 0), 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              ${users.reduce((sum, user) => sum + (user.total_earned || 0), 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Registered Users</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
              <p className="text-slate-400">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Users Found</h3>
              <p className="text-slate-400 max-w-md mx-auto">
                {searchTerm || filterStatus !== 'all' 
                  ? 'No users match your search criteria'
                  : 'No users registered yet'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="px-6 py-3 text-slate-300 font-medium">User</th>
                    <th className="px-6 py-3 text-slate-300 font-medium">Type</th>
                    <th className="px-6 py-3 text-slate-300 font-medium">VIP Level</th>
                    <th className="px-6 py-3 text-slate-300 font-medium">Tasks</th>
                    <th className="px-6 py-3 text-slate-300 font-medium">Balance</th>
                    <th className="px-6 py-3 text-slate-300 font-medium">Earnings</th>
                    <th className="px-6 py-3 text-slate-300 font-medium">Status</th>
                    <th className="px-6 py-3 text-slate-300 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-white">{user.email}</div>
                          <div className="text-xs text-slate-400">
                            Joined: {new Date(user.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getAccountTypeBadge(user.account_type)}
                      </td>
                      <td className="px-6 py-4">
                        {getVipLevelBadge(user.vip_level)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white">
                          {user.tasks_completed || 0}
                          <span className="text-xs text-slate-400">
                            /{user.account_type === 'personal' ? (user.vip_level === 1 ? 35 : 45) : 45}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white font-medium">
                          ${(user.balance || 0).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white font-medium">
                          ${(user.total_earned || 0).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(user.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowUserDetails(true);
                            }}
                            className="border-blue-600 text-blue-400 hover:bg-blue-600/10"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {user.status === 'active' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSuspendUser(user.id, user.email)}
                              className="border-yellow-600 text-yellow-400 hover:bg-yellow-600/10"
                            >
                              <Ban className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleActivateUser(user.id, user.email)}
                              className="border-green-600 text-green-400 hover:bg-green-600/10"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setUserToDelete(user);
                              setShowDeleteConfirm(true);
                            }}
                            className="border-red-600 text-red-400 hover:bg-red-600/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">User Details</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUserDetails(false)}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-400">Email Address</label>
                    <div className="text-white font-mono">{selectedUser.email}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-400">Account Type</label>
                    <div>{getAccountTypeBadge(selectedUser.account_type)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-400">VIP Level</label>
                    <div>{getVipLevelBadge(selectedUser.vip_level)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-400">Account Status</label>
                    <div>{getStatusBadge(selectedUser.status)}</div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-400">Tasks Completed</label>
                    <div className="text-white text-lg">
                      {selectedUser.tasks_completed || 0} / 
                      {selectedUser.account_type === 'personal' 
                        ? (selectedUser.vip_level === 1 ? 35 : 45) 
                        : 45}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-400">Current Balance</label>
                    <div className="text-white text-lg font-medium">
                      ${(selectedUser.balance || 0).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-400">Total Earnings</label>
                    <div className="text-white text-lg font-medium">
                      ${(selectedUser.total_earned || 0).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-400">Referral Code</label>
                    <div className="text-white font-mono">{selectedUser.referral_code || 'None'}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-400">Member Since</label>
                    <div className="text-white">
                      {new Date(selectedUser.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-400">Last Login</label>
                    <div className="text-white">
                      {selectedUser.last_login 
                        ? new Date(selectedUser.last_login).toLocaleString()
                        : 'Never logged in'
                      }
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && userToDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Delete User
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-300">
                Are you sure you want to permanently delete <strong className="text-white">{userToDelete.email}</strong>?
              </p>
              <p className="text-slate-400 text-sm">
                This action cannot be undone. All user data including tasks, earnings, and history will be permanently removed.
              </p>
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setUserToDelete(null);
                  }}
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleDeleteUser(userToDelete.id, userToDelete.email)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Permanently
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
