import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, CheckCircle, RefreshCw, Search, DollarSign, User, 
  AlertCircle, Users, Target, Calendar, Award, Hash, Filter, Plus,
  Sparkles, TrendingUp, Clock
} from 'lucide-react';

interface TrackedUser {
  id: string;
  email: string;
  display_name: string;
  referral_code: string;
  account_type: string;
  balance: number;
  vip_level: number;
  training_phase: number;
  tasks_completed: number;
  current_work_day: number;
  successful_work_days: number;
  is_on_day_2: boolean;
  day_2_pending_triggered: boolean;
  has_pending_order: boolean;
  pending_amount: number;
  last_work_day_completed_at: string;
  pending_order_assigned_at: string;
  user_status: string;
  created_at: string;
}

interface PendingOrderUser extends TrackedUser {
  trigger_task_number: number;
  is_negative_balance: boolean;
  pending_product?: {
    name?: string;
    price?: number;
    assigned_by_admin?: boolean;
    auto_triggered?: boolean;
    day_2_special?: boolean;
  };
}

const EnhancedPendingOrdersManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [allUsers, setAllUsers] = useState<TrackedUser[]>([]);
  const [pendingUsers, setPendingUsers] = useState<PendingOrderUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<TrackedUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<TrackedUser | null>(null);
  const [assignForm, setAssignForm] = useState({
    pending_amount: 100,
    trigger_task_number: 20,
    product_name: 'Combination Product'
  });
  const [filterDay, setFilterDay] = useState<'all' | 'day1' | 'day2'>('all');
  const [filterPhase, setFilterPhase] = useState<'all' | 'phase1' | 'phase2'>('all');

  // Load all users with tracking info
  const loadAllUsers = async () => {
    setIsLoading(true);
    try {
      const { data: { user: adminUser } } = await supabase.auth.getUser();
      
      if (!adminUser) {
        toast({ title: 'Error', description: 'Admin authentication required', variant: 'destructive' });
        return;
      }

      const { data, error } = await supabase.rpc('get_users_with_tracking', {
        p_admin_id: adminUser.id
      });

      if (error) {
        console.error('Error loading users:', error);
        toast({ title: 'Error', description: 'Failed to load users', variant: 'destructive' });
        return;
      }

      const users = data || [];
      setAllUsers(users);
      
      // Separate pending users
      const pending = users.filter((u: TrackedUser) => u.has_pending_order);
      setPendingUsers(pending);
      
      applyFilters(users, searchTerm, filterDay, filterPhase);
      
      toast({
        title: 'Loaded',
        description: `Found ${users.length} users, ${pending.length} with pending orders`,
      });
    } catch (error) {
      console.error('Exception loading users:', error);
      toast({ title: 'Error', description: 'Failed to load users', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filters
  const applyFilters = (users: TrackedUser[], search: string, day: string, phase: string) => {
    let filtered = [...users];
    
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(user =>
        user.email?.toLowerCase().includes(searchLower) ||
        user.display_name?.toLowerCase().includes(searchLower) ||
        user.referral_code?.toLowerCase().includes(searchLower)
      );
    }
    
    // Day filter
    if (day === 'day1') {
      filtered = filtered.filter(u => u.current_work_day === 1);
    } else if (day === 'day2') {
      filtered = filtered.filter(u => u.current_work_day === 2 || u.is_on_day_2);
    }
    
    // Phase filter
    if (phase === 'phase1') {
      filtered = filtered.filter(u => u.training_phase === 1);
    } else if (phase === 'phase2') {
      filtered = filtered.filter(u => u.training_phase === 2);
    }
    
    setFilteredUsers(filtered);
  };

  useEffect(() => {
    loadAllUsers();
  }, []);

  useEffect(() => {
    applyFilters(allUsers, searchTerm, filterDay, filterPhase);
  }, [searchTerm, filterDay, filterPhase, allUsers]);

  // Clear pending order
  const handleClearOrder = async (userId: string) => {
    setProcessingIds(prev => new Set(prev).add(userId));
    
    try {
      const { data: { user: adminUser } } = await supabase.auth.getUser();
      
      if (!adminUser) {
        toast({ title: 'Error', description: 'Admin authentication required', variant: 'destructive' });
        return;
      }

      const { data, error } = await supabase.rpc('admin_clear_pending_order', {
        p_admin_id: adminUser.id,
        p_user_id: userId
      });

      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        return;
      }

      const result = data as { success: boolean; profit?: number; error?: string };
      
      if (result.success) {
        toast({
          title: 'Success!',
          description: `Cleared pending order and added $${result.profit?.toFixed(2)} (6× profit)`,
        });
        
        await loadAllUsers();
        setShowConfirmModal(false);
        setSelectedUser(null);
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  // Assign pending order to user
  const handleAssignPendingOrder = async () => {
    if (!selectedUser) return;
    
    setProcessingIds(prev => new Set(prev).add(selectedUser.id));
    
    try {
      const { data: { user: adminUser } } = await supabase.auth.getUser();
      
      if (!adminUser) {
        toast({ title: 'Error', description: 'Admin authentication required', variant: 'destructive' });
        return;
      }

      const { data, error } = await supabase.rpc('admin_assign_pending_order', {
        p_admin_id: adminUser.id,
        p_user_id: selectedUser.id,
        p_pending_amount: assignForm.pending_amount,
        p_trigger_task_number: assignForm.trigger_task_number,
        p_product_name: assignForm.product_name
      });

      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        return;
      }

      const result = data as { success: boolean; error?: string; referral_code?: string };
      
      if (result.success) {
        toast({
          title: 'Success!',
          description: `Pending order assigned to ${selectedUser.email} (Ref: ${result.referral_code})`,
        });
        
        await loadAllUsers();
        setShowAssignModal(false);
        setSelectedUser(null);
        setAssignForm({ pending_amount: 100, trigger_task_number: 20, product_name: 'Combination Product' });
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(selectedUser.id);
        return newSet;
      });
    }
  };

  // Trigger Day 2 pending orders
  const handleTriggerDay2 = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('check_and_trigger_day2_pending');

      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        return;
      }

      const result = data as { success: boolean; assigned_count?: number; message?: string };
      
      if (result.success) {
        toast({
          title: 'Day 2 Triggered!',
          description: result.message || `Triggered for ${result.assigned_count} users`,
        });
        await loadAllUsers();
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateProfit = (pendingAmount: number) => pendingAmount * 6;

  // Get user stage badge
  const getUserStageBadge = (user: TrackedUser) => {
    if (user.is_on_day_2) {
      return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Day 2</Badge>;
    }
    return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Day 1</Badge>;
  };

  // Get phase badge
  const getPhaseBadge = (phase: number) => {
    if (phase === 2) {
      return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Phase 2</Badge>;
    }
    return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">Phase 1</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            Pending Orders & User Tracking
          </h2>
          <p className="text-slate-400">
            Track users by referral code, manage Day 2 triggers, assign combination products
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleTriggerDay2}
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Trigger Day 2
          </Button>
          <Button
            onClick={loadAllUsers}
            disabled={isLoading}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-slate-400">Pending Orders</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{pendingUsers.length}</div>
            <p className="text-xs text-slate-400">Awaiting clearance</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-slate-400">Day 2 Users</CardTitle>
            <Calendar className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">
              {allUsers.filter(u => u.is_on_day_2).length}
            </div>
            <p className="text-xs text-slate-400">Active Day 2</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-slate-400">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{allUsers.length}</div>
            <p className="text-xs text-slate-400">All tracked users</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-slate-400">6× Profit Due</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              ${pendingUsers.reduce((sum, u) => sum + calculateProfit(u.pending_amount || 0), 0).toFixed(2)}
            </div>
            <p className="text-xs text-slate-400">Total to pay</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="pending" className="data-[state=active]:bg-slate-700">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Pending Orders ({pendingUsers.length})
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-slate-700">
            <Users className="w-4 h-4 mr-2" />
            All Users ({allUsers.length})
          </TabsTrigger>
        </TabsList>

        {/* Pending Orders Tab */}
        <TabsContent value="pending" className="space-y-4">
          {pendingUsers.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-12 text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Pending Orders</h3>
                <p className="text-slate-400">All combination orders have been cleared</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingUsers.map((user) => (
                <Card key={user.id} className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* User Info */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                          <User className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                          <div className="font-medium text-white">{user.display_name || 'Unknown'}</div>
                          <div className="text-sm text-slate-400">{user.email}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs border-slate-600">
                              <Hash className="w-3 h-3 mr-1" />
                              {user.referral_code || 'No Code'}
                            </Badge>
                            {getUserStageBadge(user)}
                            {getPhaseBadge(user.training_phase)}
                            {user.pending_product?.day_2_special && (
                              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                                <Sparkles className="w-3 h-3 mr-1" />
                                Day 2 Special
                              </Badge>
                            )}
                            {user.pending_product?.assigned_by_admin && (
                              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                Admin Assigned
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Pending Details */}
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="text-xs text-slate-400">Task #</div>
                          <div className="text-lg font-bold text-amber-400">{user.trigger_task_number}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-slate-400">Pending</div>
                          <div className="text-lg font-bold text-red-400">-${user.pending_amount?.toFixed(2)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-slate-400">6× Profit</div>
                          <div className="text-lg font-bold text-green-400">
                            +${calculateProfit(user.pending_amount || 0).toFixed(2)}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => { setSelectedUser(user); setShowConfirmModal(true); }}
                          disabled={processingIds.has(user.id)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {processingIds.has(user.id) ? (
                            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <CheckCircle className="w-4 h-4 mr-2" />
                          )}
                          Clear & Pay
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* All Users Tab */}
        <TabsContent value="users" className="space-y-4">
          {/* Filters */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search by email, name, or referral code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={filterDay}
                    onChange={(e) => setFilterDay(e.target.value as any)}
                    className="bg-slate-700 border-slate-600 text-white rounded-md px-3 py-2 text-sm"
                  >
                    <option value="all">All Days</option>
                    <option value="day1">Day 1</option>
                    <option value="day2">Day 2</option>
                  </select>
                  <select
                    value={filterPhase}
                    onChange={(e) => setFilterPhase(e.target.value as any)}
                    className="bg-slate-700 border-slate-600 text-white rounded-md px-3 py-2 text-sm"
                  >
                    <option value="all">All Phases</option>
                    <option value="phase1">Phase 1</option>
                    <option value="phase2">Phase 2</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-slate-700 bg-slate-800/80">
                      <th className="px-4 py-3 text-slate-300 font-medium">User</th>
                      <th className="px-4 py-3 text-slate-300 font-medium">Referral Code</th>
                      <th className="px-4 py-3 text-slate-300 font-medium">Stage</th>
                      <th className="px-4 py-3 text-slate-300 font-medium">Progress</th>
                      <th className="px-4 py-3 text-slate-300 font-medium">Balance</th>
                      <th className="px-4 py-3 text-slate-300 font-medium">Status</th>
                      <th className="px-4 py-3 text-slate-300 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-slate-700 hover:bg-slate-700/30">
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium text-white">{user.display_name || 'Unknown'}</div>
                            <div className="text-xs text-slate-400">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <code className="bg-slate-700 px-2 py-1 rounded text-xs text-amber-400">
                            {user.referral_code || 'N/A'}
                          </code>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            {getUserStageBadge(user)}
                            {getPhaseBadge(user.training_phase)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs text-slate-400">
                            Tasks: {user.tasks_completed}/35
                          </div>
                          <div className="text-xs text-slate-400">
                            Work Days: {user.successful_work_days}
                          </div>
                          {user.last_work_day_completed_at && (
                            <div className="text-xs text-slate-500">
                              Last: {new Date(user.last_work_day_completed_at).toLocaleDateString()}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-white">${user.balance?.toFixed(2)}</div>
                          <div className="text-xs text-slate-400">VIP{user.vip_level}</div>
                        </td>
                        <td className="px-4 py-3">
                          {user.has_pending_order ? (
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Pending
                            </Badge>
                          ) : (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Active
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {!user.has_pending_order && user.account_type === 'personal' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => { setSelectedUser(user); setShowAssignModal(true); }}
                              className="border-amber-500 text-amber-400 hover:bg-amber-500/10"
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Assign Order
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Clear Order Confirmation Modal */}
      {showConfirmModal && selectedUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Clear Pending Order?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-700/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">User:</span>
                  <span className="text-white font-medium">{selectedUser.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Referral Code:</span>
                  <code className="text-amber-400">{selectedUser.referral_code || 'N/A'}</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Stage:</span>
                  <span className="text-white">
                    Day {selectedUser.current_work_day} • Phase {selectedUser.training_phase}
                  </span>
                </div>
                <div className="border-t border-slate-600 pt-2 flex justify-between">
                  <span className="text-slate-300 font-medium">Pending Amount:</span>
                  <span className="text-red-400">-${selectedUser.pending_amount?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300 font-medium">6× Profit:</span>
                  <span className="text-green-400">+${calculateProfit(selectedUser.pending_amount || 0).toFixed(2)}</span>
                </div>
                <div className="border-t border-slate-600 pt-2 flex justify-between">
                  <span className="text-slate-300 font-bold">Total Credit:</span>
                  <span className="text-green-400 font-bold text-lg">
                    +${((selectedUser.pending_amount || 0) + calculateProfit(selectedUser.pending_amount || 0)).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => { setShowConfirmModal(false); setSelectedUser(null); }}
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleClearOrder(selectedUser.id)}
                  disabled={processingIds.has(selectedUser.id)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  {processingIds.has(selectedUser.id) ? (
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Confirm Clear
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Assign Pending Order Modal */}
      {showAssignModal && selectedUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-amber-400" />
                Assign Pending Order
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center">
                    <User className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <div className="font-medium text-white">{selectedUser.email}</div>
                    <code className="text-xs text-amber-400">Ref: {selectedUser.referral_code || 'N/A'}</code>
                  </div>
                </div>
                <div className="flex gap-2 text-xs">
                  {getUserStageBadge(selectedUser)}
                  {getPhaseBadge(selectedUser.training_phase)}
                  <Badge className="bg-slate-600 text-slate-300">
                    Tasks: {selectedUser.tasks_completed}/35
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm text-slate-400 block mb-1">Pending Amount ($)</label>
                  <Input
                    type="number"
                    value={assignForm.pending_amount}
                    onChange={(e) => setAssignForm({...assignForm, pending_amount: Number(e.target.value)})}
                    className="bg-slate-700 border-slate-600 text-white"
                    min={10}
                    max={500}
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 block mb-1">Trigger Task Number</label>
                  <Input
                    type="number"
                    value={assignForm.trigger_task_number}
                    onChange={(e) => setAssignForm({...assignForm, trigger_task_number: Number(e.target.value)})}
                    className="bg-slate-700 border-slate-600 text-white"
                    min={1}
                    max={35}
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 block mb-1">Product Name</label>
                  <Input
                    value={assignForm.product_name}
                    onChange={(e) => setAssignForm({...assignForm, product_name: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-medium text-amber-400">Profit Preview</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pending Amount:</span>
                    <span className="text-red-400">-${assignForm.pending_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">6× Profit:</span>
                    <span className="text-green-400">+${(assignForm.pending_amount * 6).toFixed(2)}</span>
                  </div>
                  <div className="border-t border-amber-500/20 pt-1 flex justify-between">
                    <span className="text-slate-300">Total Credit When Cleared:</span>
                    <span className="text-green-400 font-bold">+${(assignForm.pending_amount * 7).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => { setShowAssignModal(false); setSelectedUser(null); }}
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAssignPendingOrder}
                  disabled={processingIds.has(selectedUser.id)}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {processingIds.has(selectedUser.id) ? (
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Assign Order
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default EnhancedPendingOrdersManager;
