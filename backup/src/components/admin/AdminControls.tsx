import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import {
  RefreshCw,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  UserX,
  Settings,
  DollarSign,
  TrendingUp,
  Users,
  Shield
} from 'lucide-react';
// import { supabase } from '../lib/supabase';

// Mock supabase for now - replace with real import when ready
const supabase = {
  from: () => ({
    update: () => ({
      eq: () => ({
        eq: () => ({
          then: (resolve: any) => resolve({ error: null })
        })
      })
    })
  })
};

interface AdminControlsProps {
  onRefresh: () => void;
}

const AdminControls: React.FC<AdminControlsProps> = ({ onRefresh }) => {
  const [isResetting, setIsResetting] = useState(false);
  const [profitMultiplier, setProfitMultiplier] = useState(6);
  const [resetEmail, setResetEmail] = useState('');

  const resetPersonalAccount = async () => {
    if (!resetEmail.trim()) {
      toast('Please enter an email address');
      return;
    }

    setIsResetting(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          tasks_completed: 0,
          // DO NOT clear balance or earnings - preserve them
          updated_at: new Date().toISOString()
        })
        .eq('email', resetEmail.trim())
        .eq('account_type', 'personal');

      if (error) throw error;

      toast('Personal account reset successfully - Tasks reset to 0/35, balance and earnings preserved');
      setResetEmail('');
      onRefresh();
    } catch (error) {
      console.error('Error resetting personal account:', error);
      toast('Failed to reset personal account');
    } finally {
      setIsResetting(false);
    }
  };

  const resetTrainingAccount = async () => {
    if (!resetEmail.trim()) {
      toast('Please enter an email address');
      return;
    }

    setIsResetting(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          tasks_completed: 0,
          training_phase: 1,
          trigger_task_number: null,
          has_pending_order: false,
          pending_amount: 0,
          is_negative_balance: false,
          profit_added: false,
          training_completed: false,
          // DO NOT clear balance or earnings - preserve them
          updated_at: new Date().toISOString()
        })
        .eq('email', resetEmail.trim())
        .eq('account_type', 'training');

      if (error) throw error;

      toast('Training account reset successfully - Tasks reset to 0/45, balance and earnings preserved');
      setResetEmail('');
      onRefresh();
    } catch (error) {
      console.error('Error resetting training account:', error);
      toast('Failed to reset training account');
    } finally {
      setIsResetting(false);
    }
  };

  const removePendingOrder = async () => {
    if (!resetEmail.trim()) {
      toast('Please enter an email address');
      return;
    }

    setIsResetting(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          has_pending_order: false,
          pending_amount: 0,
          is_negative_balance: false,
          // Resume task progression
          updated_at: new Date().toISOString()
        })
        .eq('email', resetEmail.trim())
        .eq('account_type', 'training');

      if (error) throw error;

      toast('Pending order removed successfully - User can continue tasks');
      setResetEmail('');
      onRefresh();
    } catch (error) {
      console.error('Error removing pending order:', error);
      toast('Failed to remove pending order');
    } finally {
      setIsResetting(false);
    }
  };

  const updateProfitMultiplier = async () => {
    try {
      // This would typically update a system settings table
      toast(`Profit multiplier updated to ${profitMultiplier}x`);
    } catch (error) {
      console.error('Error updating profit multiplier:', error);
      toast('Failed to update profit multiplier');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Admin Controls</h2>
          <p className="text-slate-400">Manage training system and user accounts</p>
        </div>
        <Button
          onClick={onRefresh}
          variant="outline"
          size="sm"
          className="border-slate-600 text-slate-300 hover:bg-slate-700"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Reset Controls */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <RotateCcw className="w-5 h-5 mr-2 text-orange-500" />
              Account Reset Controls
            </CardTitle>
            <p className="text-slate-400 text-sm">
              Reset personal and training accounts
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                User Email Address
              </label>
              <Input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="user@example.com"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div className="grid grid-cols-1 gap-3">
              <Button
                onClick={resetPersonalAccount}
                disabled={isResetting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isResetting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <UserX className="w-4 h-4 mr-2" />
                    Reset Personal Account
                  </>
                )}
              </Button>

              <Button
                onClick={resetTrainingAccount}
                disabled={isResetting}
                variant="outline"
                className="border-purple-600 text-purple-400 hover:bg-purple-700"
              >
                {isResetting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset Training Account
                  </>
                )}
              </Button>
            </div>

            <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5" />
                <div>
                  <p className="text-orange-400 text-sm font-medium">Reset Effects:</p>
                  <ul className="text-orange-300 text-xs space-y-1 mt-1">
                    <li>• Personal: Tasks reset to 0/35, balance & earnings preserved</li>
                    <li>• Training: Tasks reset to 0/45, balance & earnings preserved</li>
                    <li>• All progress and pending orders cleared</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Controls */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Settings className="w-5 h-5 mr-2 text-green-500" />
              System Controls
            </CardTitle>
            <p className="text-slate-400 text-sm">
              Configure training system parameters
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Combination Product Profit
              </label>
              <div className="flex items-center space-x-3">
                <Input
                  type="number"
                  value={6}
                  disabled
                  className="bg-slate-700 border-slate-600 text-white w-24 opacity-60"
                />
                <span className="text-slate-400 text-sm">x (Fixed for combo clearance)</span>
              </div>
              <p className="text-slate-400 text-xs mt-1">
                6x profit automatically applied when clearing combination orders
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <Button
                onClick={removePendingOrder}
                disabled={isResetting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isResetting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Removing...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Remove Pending Order
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                View Pending Orders
              </Button>

              <Button
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Training Analytics
              </Button>
            </div>

            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-blue-400 mt-0.5" />
                <div>
                  <p className="text-green-400 text-sm font-medium">System Features:</p>
                  <ul className="text-green-300 text-xs space-y-1 mt-1">
                    <li>• Training accounts: 2-phase system (45/45 each)</li>
                    <li>• Combination products: Auto-trigger at tasks 19/24/31</li>
                    <li>• 6x profit system: Fixed for combination clearance</li>
                    <li>• Task pausing: During pending orders</li>
                    <li>• Withdrawal blocking: During training</li>
                    <li>• Referral tracking: Link accounts to users</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Shield className="w-5 h-5 mr-2 text-yellow-500" />
            Admin Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-yellow-400 mb-2">Training Account Flow:</h4>
              <ul className="text-xs text-slate-300 space-y-1">
                <li>• Phase 1: Complete 45/45 tasks normally</li>
                <li>• Phase 2: Trigger combination product</li>
                <li>• Auto-trigger at task 19/24/31</li>
                <li>• Negative balance until cleared</li>
                <li>• 6x profit added after clearing</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-green-400 mb-2">Personal Account Flow:</h4>
              <ul className="text-xs text-slate-300 space-y-1">
                <li>• 20% profit transfer after training</li>
                <li>• Withdrawal restrictions during training</li>
                <li>• Separate balance tracking</li>
                <li>• No combination products</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminControls;
