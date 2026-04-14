import React from 'react';
import { X, User, Mail, Phone, Award, Wallet, Calendar, Hash, TrendingUp, Zap } from 'lucide-react';
import { AdminUser } from './AdminUsersTable';

interface UserDetailModalProps {
  user: AdminUser | null;
  onClose: () => void;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({ user, onClose }) => {
  if (!user) return null;

  const progressPct = user.tasks_total > 0 ? (user.tasks_completed / user.tasks_total) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[#0d1120] border border-white/10 rounded-2xl max-w-lg w-full mx-4 shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-6 bg-gradient-to-r from-indigo-600/20 via-purple-600/15 to-pink-600/10 border-b border-white/[0.06]">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
          >
            <X size={16} />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <span className="text-2xl font-bold text-white">{user.display_name.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{user.display_name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-bold rounded-full">VIP{user.vip_level}</span>
                <span className="text-xs text-gray-500">Member since {new Date(user.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Contact Info */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Contact Information</h3>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-xl">
                <Mail size={16} className="text-gray-500" />
                <span className="text-sm text-gray-300">{user.email}</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-xl">
                <Phone size={16} className="text-gray-500" />
                <span className="text-sm text-gray-300">{user.phone || 'Not provided'}</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-xl">
                <Hash size={16} className="text-gray-500" />
                <span className="text-sm text-gray-300 font-mono">{user.referral_code}</span>
              </div>
            </div>
          </div>

          {/* Financial Info */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Financial</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <Wallet size={14} className="text-emerald-400" />
                  <span className="text-xs text-gray-500">Balance</span>
                </div>
                <p className="text-lg font-bold text-emerald-400">${user.balance.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp size={14} className="text-purple-400" />
                  <span className="text-xs text-gray-500">Total Earned</span>
                </div>
                <p className="text-lg font-bold text-purple-400">${user.total_earned.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Task Progress */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Task Progress</h3>
            <div className="p-4 bg-white/[0.03] rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap size={14} className="text-indigo-400" />
                  <span className="text-sm text-gray-300">{user.tasks_completed} of {user.tasks_total} tasks</span>
                </div>
                <span className="text-sm font-bold text-indigo-400">{progressPct.toFixed(0)}%</span>
              </div>
              <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* User ID */}
          <div className="pt-3 border-t border-white/[0.06]">
            <p className="text-xs text-gray-600 font-mono">User ID: {user.id}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal;
