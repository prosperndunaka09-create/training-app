import React, { useState, useEffect, useCallback } from 'react';
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
// import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  account_type: 'personal' | 'training';
  vip_level: number;
  tasks_completed: number;
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
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      // Mock data for now - replace with real supabase call later
      const mockUsers: User[] = [
        {
          id: '1',
          email: 'user1@example.com',
          account_type: 'personal',
          vip_level: 1,
          tasks_completed: 25,
          total_earned: 150.50,
          balance: 75.25,
          training_completed: false,
          referral_code: 'REF123',
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString(),
          status: 'active'
        },
        {
          id: '2',
          email: 'user2@example.com',
          account_type: 'training',
          vip_level: 0,
          tasks_completed: 15,
          total_earned: 75.00,
          balance: 50.00,
          training_completed: false,
          referral_code: 'REF456',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          last_login: new Date(Date.now() - 3600000).toISOString(),
          status: 'active'
        },
        {
          id: '3',
          email: 'user3@example.com',
          account_type: 'personal',
          vip_level: 2,
          tasks_completed: 35,
          total_earned: 250.00,
          balance: 125.50,
          training_completed: false,
          referral_code: 'REF789',
          created_at: new Date(Date.now() - 172800000).toISOString(),
          last_login: new Date(Date.now() - 7200000).toISOString(),
          status: 'suspended'
        }
      ];

      setUsers(mockUsers);
      setFilteredUsers(mockUsers);
      
      toast({
        title: 'Users Loaded',
        description: `Loaded ${mockUsers.length} users successfully`,
      });
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
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
      toast({
        title: 'User Suspended',
        description: `${email} has been suspended`,
      });
      // loadUsers();
    } catch (error) {
      console.error('Error suspending user:', error);
      toast({
        title: 'Error',
        description: 'Failed to suspend user',
        variant: 'destructive',
      });
    }
  };

  const handleBanUser = async (userId: string, email: string) => {
    try {
      // Mock ban for now - replace with real supabase call later
      console.log(`Would ban user ${userId} (${email})`);
      toast({
        title: 'User Banned',
        description: `${email} has been banned`,
      });
      // loadUsers();
    } catch (error) {
      console.error('Error banning user:', error);
      toast({
        title: 'Error',
        description: 'Failed to ban user',
        variant: 'destructive',
      });
    }
  };

  const handleActivateUser = async (userId: string, email: string) => {
    try {
      // Mock activate for now - replace with real supabase call later
      console.log(`Would activate user ${userId} (${email})`);
      toast({
        title: 'User Activated',
        description: `${email} has been activated`,
      });
      // loadUsers();
    } catch (error) {
      console.error('Error activating user:', error);
      toast({
        title: 'Error',
        description: 'Failed to activate user',
        variant: 'destructive',
      });
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
    </div>
  );
};

export default AdminUsers;
