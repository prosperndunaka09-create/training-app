import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, RefreshCw, Search, DollarSign, User, AlertCircle } from 'lucide-react';

interface PendingOrderUser {
  id: string;
  email: string;
  display_name: string;
  pending_amount: number;
  trigger_task_number: number;
  is_negative_balance: boolean;
  balance: number;
  tasks_completed: number;
  training_phase: number;
  pending_product?: {
    name?: string;
    price?: number;
  };
  created_at: string;
}

const PendingOrdersManager: React.FC = () => {
  const [users, setUsers] = useState<PendingOrderUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<PendingOrderUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PendingOrderUser | null>(null);

  const loadPendingOrders = async () => {
    setIsLoading(true);
    try {
      // Fetch users with pending orders
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

      const pendingUsers = data || [];
      setUsers(pendingUsers);
      setFilteredUsers(pendingUsers);
      
      toast({
        title: 'Loaded',
        description: `Found ${pendingUsers.length} pending orders`,
      });
    } catch (error) {
      console.error('Exception loading pending orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to load pending orders',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPendingOrders();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  const handleClearOrder = async (userId: string) => {
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
        
        // Remove user from list
        setUsers(prev => prev.filter(u => u.id !== userId));
        setFilteredUsers(prev => prev.filter(u => u.id !== userId));
        
        // Close modal if open
        setShowConfirmModal(false);
        setSelectedUser(null);
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

  const openConfirmModal = (user: PendingOrderUser) => {
    setSelectedUser(user);
    setShowConfirmModal(true);
  };

  const calculateProfit = (pendingAmount: number) => {
    return pendingAmount * 6;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            Pending Orders (6× Profit)
          </h2>
          <p className="text-slate-400">
            Manage combination orders and apply 6× profit multiplier
          </p>
        </div>
        <Button
          onClick={loadPendingOrders}
          disabled={isLoading}
          variant="outline"
          className="border-slate-600 text-slate-300 hover:bg-slate-700"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Pending Orders
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{users.length}</div>
            <p className="text-xs text-slate-400">Awaiting admin clearance</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Total Pending Amount
            </CardTitle>
            <DollarSign className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">
              ${users.reduce((sum, u) => sum + (u.pending_amount || 0), 0).toFixed(2)}
            </div>
            <p className="text-xs text-slate-400">Negative balances</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Total 6× Profit to Pay
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              ${users.reduce((sum, u) => sum + calculateProfit(u.pending_amount || 0), 0).toFixed(2)}
            </div>
            <p className="text-xs text-slate-400">Profit multiplier</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search by email or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
            />
          </div>
        </CardContent>
      </Card>

      {/* Pending Orders Table */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Users with Pending Orders</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No Pending Orders
              </h3>
              <p className="text-slate-400">
                All combination orders have been cleared
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="px-6 py-3 text-slate-300 font-medium">User</th>
                    <th className="px-6 py-3 text-slate-300 font-medium">Task #</th>
                    <th className="px-6 py-3 text-slate-300 font-medium">Pending Amount</th>
                    <th className="px-6 py-3 text-slate-300 font-medium">6× Profit</th>
                    <th className="px-6 py-3 text-slate-300 font-medium">Total Credit</th>
                    <th className="px-6 py-3 text-slate-300 font-medium">Status</th>
                    <th className="px-6 py-3 text-slate-300 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-400" />
                          <div>
                            <div className="font-medium text-white">{user.display_name || 'Unknown'}</div>
                            <div className="text-xs text-slate-400">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="border-amber-500 text-amber-400">
                          Task {user.trigger_task_number || '?'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-red-400 font-medium">
          -${user.pending_amount?.toFixed(2) || '0.00'}
                        </div>
                        <div className="text-xs text-slate-500">Negative balance</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-green-400 font-medium">
                          +${calculateProfit(user.pending_amount || 0).toFixed(2)}
                        </div>
                        <div className="text-xs text-slate-500">6× multiplier</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white font-bold">
                          +${((user.pending_amount || 0) + calculateProfit(user.pending_amount || 0)).toFixed(2)}
                        </div>
                        <div className="text-xs text-slate-500">Return + Profit</div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          size="sm"
                          onClick={() => openConfirmModal(user)}
                          disabled={processingIds.has(user.id)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {processingIds.has(user.id) ? (
                            <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                          ) : (
                            <CheckCircle className="w-3 h-3 mr-1" />
                          )}
                          Clear & Pay
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Modal */}
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
                  <span className="text-slate-400">Task:</span>
                  <span className="text-white">#{selectedUser.trigger_task_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Pending Amount:</span>
                  <span className="text-red-400">-${selectedUser.pending_amount?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">6× Profit:</span>
                  <span className="text-green-400">+${calculateProfit(selectedUser.pending_amount || 0).toFixed(2)}</span>
                </div>
                <div className="border-t border-slate-600 pt-2 flex justify-between">
                  <span className="text-slate-300 font-medium">Total Credit:</span>
                  <span className="text-green-400 font-bold">
                    +${((selectedUser.pending_amount || 0) + calculateProfit(selectedUser.pending_amount || 0)).toFixed(2)}
                  </span>
                </div>
              </div>
              
              <p className="text-slate-300 text-sm">
                This will:
                <br />1. Clear the pending order status
                <br />2. Restore the pending amount
                <br />3. Add <strong className="text-green-400">6× profit</strong> to user's balance
                <br />4. Allow user to continue tasks
              </p>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowConfirmModal(false);
                    setSelectedUser(null);
                  }}
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
    </div>
  );
};

export default PendingOrdersManager;
