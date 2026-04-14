import React from 'react';
// v2.0 - Added reset and delete functionality
import { X, RefreshCw, Trash2, Mail, Phone, Hash, GraduationCap, Crown, Wallet, TrendingUp, Calendar } from 'lucide-react';
import { AdminUser } from './AdminUsersTable';

interface UserDetailsModalProps {
  user: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
  onResetTraining?: (user: AdminUser) => void;
  onDeleteUser?: (user: AdminUser) => void;
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({ 
  user, 
  isOpen, 
  onClose, 
  onResetTraining,
  onDeleteUser 
}) => {
  // Early return with safety check
  if (!isOpen || !user) return null;

  // Guard against undefined user properties
  const safeUser = {
    ...user,
    display_name: user.display_name || 'Unknown',
    email: user.email || '',
    phone: user.phone || 'Not provided',
    referral_code: user.referral_code || '',
    account_type: user.account_type || 'personal',
    status: user.status || 'active',
    vip_level: user.vip_level || 0,
    balance: typeof user.balance === 'number' ? user.balance : 0,
    total_earned: typeof user.total_earned === 'number' ? user.total_earned : 0,
    training_progress: user.training_progress || 0,
    tasks_completed: user.tasks_completed || 0,
    created_at: user.created_at || new Date().toISOString(),
    id: user.id || ''
  };

  const handleReset = () => {
    if (onResetTraining && safeUser.account_type === 'training') {
      onResetTraining(user);
      onClose();
    }
  };

  const handleDelete = () => {
    if (onDeleteUser && safeUser.account_type === 'training') {
      onDeleteUser(user);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1a1f2e] border border-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-bold text-xl">
              {(safeUser.display_name || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{safeUser.display_name || 'Unknown'}</h2>
              <div className="flex items-center gap-2 text-sm">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  safeUser.vip_level === 1 
                    ? 'bg-orange-700/30 text-orange-400 border border-orange-600/30' // Bronze
                    : safeUser.vip_level === 2
                    ? 'bg-slate-400/20 text-slate-300 border border-slate-500/30' // Silver
                    : safeUser.vip_level === 3
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' // Gold
                    : 'bg-gray-500/20 text-gray-400'
                }`}>
                  VIP{safeUser.vip_level} {safeUser.vip_level === 1 ? 'Bronze' : safeUser.vip_level === 2 ? 'Silver' : safeUser.vip_level === 3 ? 'Gold' : ''}
                </span>
                <span className="text-gray-500">Member since {new Date(safeUser.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Account Type Badge */}
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              safeUser.account_type === 'training' 
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
            }`}>
              {safeUser.account_type === 'training' ? (
                <span className="flex items-center gap-1"><GraduationCap size={12} /> Training Account</span>
              ) : (
                <span className="flex items-center gap-1"><Crown size={12} /> Personal Account</span>
              )}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              safeUser.status === 'active' 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : safeUser.status === 'suspended'
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {safeUser.status ? (safeUser.status.charAt(0).toUpperCase() + safeUser.status.slice(1)) : 'Active'}
            </span>
          </div>

          {/* Contact Information */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact Information</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 bg-[#0f1419] rounded-lg">
                <Mail size={16} className="text-gray-500" />
                <span className="text-sm text-gray-300">{safeUser.email || 'No email'}</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-[#0f1419] rounded-lg">
                <Phone size={16} className="text-gray-500" />
                <span className="text-sm text-gray-300">{safeUser.phone || 'Not provided'}</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-[#0f1419] rounded-lg">
                <Hash size={16} className="text-gray-500" />
                <span className="text-sm text-gray-300 font-mono">{safeUser.referral_code || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Financial */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Financial</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-[#0f1419] rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Wallet size={14} className="text-emerald-400" />
                  <span className="text-xs text-gray-500">Balance</span>
                </div>
                <p className="text-xl font-bold text-emerald-400">${(safeUser.balance || 0).toFixed(2)}</p>
              </div>
              <div className="p-4 bg-[#0f1419] rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp size={14} className="text-purple-400" />
                  <span className="text-xs text-gray-500">Total Earned</span>
                </div>
                <p className="text-xl font-bold text-purple-400">${(safeUser.total_earned || 0).toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Task Progress */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Task Progress</h3>
            <div className="p-4 bg-[#0f1419] rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <RefreshCw size={14} className="text-blue-400" />
                  <span className="text-sm text-gray-300">
                    {safeUser.account_type === 'training' 
                      ? `${safeUser.training_progress || 0} of 45 tasks` 
                      : `${safeUser.tasks_completed || 0} of 35 tasks`
                    }
                  </span>
                </div>
                <span className="text-sm text-blue-400 font-medium">
                  {safeUser.account_type === 'training' 
                    ? Math.round(((safeUser.training_progress || 0) / 45) * 100)
                    : Math.round(((safeUser.tasks_completed || 0) / 35) * 100)
                  }%
                </span>
              </div>
              <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                  style={{ 
                    width: `${safeUser.account_type === 'training' 
                      ? Math.min(100, ((safeUser.training_progress || 0) / 45) * 100)
                      : Math.min(100, ((safeUser.tasks_completed || 0) / 35) * 100)
                    }%` 
                  }}
                />
              </div>
            </div>
          </div>

          {/* Training Account Actions */}
          {safeUser.account_type === 'training' && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</h3>
              <div className="flex gap-3">
                {onResetTraining && (
                  <button
                    onClick={handleReset}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-all font-medium"
                  >
                    <RefreshCw size={18} />
                    Reset Training Account
                  </button>
                )}
                {onDeleteUser && (
                  <button
                    onClick={handleDelete}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all font-medium"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Reset will clear all progress and set tasks back to 0/45. The user will see the change immediately.
              </p>
            </div>
          )}

          {/* User ID */}
          <div className="pt-4 border-t border-gray-800">
            <p className="text-xs text-gray-600 font-mono">User ID: {safeUser.id}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;
