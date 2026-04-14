import React, { useEffect, useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { User, Mail, Phone, Award, Copy, CheckCircle, Calendar, TrendingUp, DollarSign, Zap, Shield, LogOut } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const ProfileSection: React.FC = () => {
  const { user, tasks, refreshTasks, logout } = useAppContext();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    refreshTasks();
  }, [refreshTasks]);

  const safeTasks = tasks || [];
  const completedCount = safeTasks.filter(t => t.status === 'completed').length;
  const totalReward = safeTasks.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.reward, 0);
  const progress = safeTasks.length > 0 ? (completedCount / safeTasks.length) * 100 : 0;

  const copyReferral = () => {
    if (user?.referral_code) {
      navigator.clipboard.writeText(user.referral_code);
      setCopied(true);
      toast({ title: 'Copied!', description: 'Referral code copied to clipboard.' });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'N/A';

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-500/30">
            <span className="text-3xl font-bold text-white">{user?.display_name?.[0]?.toUpperCase() || 'U'}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-bold text-white">{user?.display_name || 'User'}</h2>
              <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-bold rounded-full">VIP{user?.vip_level || 1}</span>
            </div>
            <p className="text-sm text-gray-400">{user?.email}</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <Calendar size={12} className="text-gray-500" />
              <span className="text-xs text-gray-500">Member since {memberSince}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white/[0.03] border border-white/[0.06] rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center mb-3">
            <DollarSign size={18} className="text-emerald-400" />
          </div>
          <p className="text-xs text-gray-500 font-medium">Total Balance</p>
          <p className="text-xl font-bold text-emerald-400">${(user?.balance || 0).toFixed(2)}</p>
        </div>
        <div className="p-5 bg-white/[0.03] border border-white/[0.06] rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center mb-3">
            <TrendingUp size={18} className="text-indigo-400" />
          </div>
          <p className="text-xs text-gray-500 font-medium">Total Earned</p>
          <p className="text-xl font-bold text-indigo-400">${(user?.total_earned || 0).toFixed(2)}</p>
        </div>
        <div className="p-5 bg-white/[0.03] border border-white/[0.06] rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center mb-3">
            <Zap size={18} className="text-purple-400" />
          </div>
          <p className="text-xs text-gray-500 font-medium">Tasks Done</p>
          <p className="text-xl font-bold text-purple-400">
            {user?.account_type === 'training'
              ? user?.training_completed === true || (user?.training_phase === 2 && (user?.training_progress || 0) >= 45)
                ? 'TRAINING COMPLETE'
                : user?.training_phase === 2 && (user?.training_progress || 0) === 0
                ? 'SET 1 COMPLETED'
                : `SET ${user?.training_phase || 1}/${user?.training_progress || 0}`
              : `${completedCount}/35`}
          </p>
        </div>
        <div className="p-5 bg-white/[0.03] border border-white/[0.06] rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center mb-3">
            <Award size={18} className="text-amber-400" />
          </div>
          <p className="text-xs text-gray-500 font-medium">VIP Level</p>
          <p className="text-xl font-bold text-amber-400">Level {user?.vip_level || 1}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
        <h3 className="text-lg font-bold text-white mb-4">Task Progress</h3>
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">VIP{user?.vip_level || 1} Completion</span>
            <span className="text-sm font-bold text-indigo-400">{progress.toFixed(0)}%</span>
          </div>
          <div className="h-3 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{completedCount} completed</span>
          <span>{(user?.account_type === 'training' ? 45 : 35) - completedCount} remaining</span>
        </div>
      </div>

      {/* Referral Code */}
      <div className="p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
        <h3 className="text-lg font-bold text-white mb-2">Referral Code</h3>
        <p className="text-sm text-gray-500 mb-4">Share your referral code with friends to earn bonus rewards.</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 p-3 bg-[#1a2038] border border-indigo-500/20 rounded-lg">
            <code className="text-lg font-bold text-indigo-300 tracking-wider">{user?.referral_code || 'N/A'}</code>
          </div>
          <button
            onClick={copyReferral}
            className="p-3 bg-indigo-500/15 border border-indigo-500/25 rounded-lg hover:bg-indigo-500/25 transition-colors"
          >
            {copied ? <CheckCircle size={20} className="text-emerald-400" /> : <Copy size={20} className="text-indigo-400" />}
          </button>
        </div>
      </div>

      {/* Account Details */}
      <div className="p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
        <h3 className="text-lg font-bold text-white mb-4">Account Details</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-xl">
            <User size={18} className="text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Display Name</p>
              <p className="text-sm text-white font-medium">{user?.display_name || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-xl">
            <Mail size={18} className="text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-sm text-white font-medium">{user?.email || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-xl">
            <Phone size={18} className="text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Phone</p>
              <p className="text-sm text-white font-medium">{user?.phone || 'Not provided'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
        <h3 className="text-lg font-bold text-white mb-4">Security</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl">
            <div className="flex items-center gap-3">
              <Shield size={18} className="text-emerald-400" />
              <div>
                <p className="text-sm text-white font-medium">Account Status</p>
                <p className="text-xs text-gray-500">Your account is active and verified</p>
              </div>
            </div>
            <span className="px-2 py-1 bg-emerald-500/15 text-emerald-400 text-xs font-medium rounded-full">Active</span>
          </div>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        className="w-full p-4 bg-red-500/5 border border-red-500/15 rounded-2xl flex items-center justify-center gap-2 text-red-400 font-semibold hover:bg-red-500/10 transition-all"
      >
        <LogOut size={18} />
        Sign Out
      </button>
    </div>
  );
};

export default ProfileSection;
