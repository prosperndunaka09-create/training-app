import React from 'react';
import { Users, DollarSign, Clock, TrendingUp, Activity, CheckCircle, AlertTriangle, Wallet } from 'lucide-react';

export interface PlatformStats {
  totalUsers: number;
  totalPayouts: number;
  pendingPayouts: number;
  totalBalance: number;
  completedTasks: number;
  totalTasks: number;
  activeToday: number;
  pendingWithdrawals: number;
  newUsersToday: number;
}

interface AdminStatsCardsProps {
  stats: PlatformStats;
  isLoading: boolean;
}

const AdminStatsCards: React.FC<AdminStatsCardsProps> = ({ stats, isLoading }) => {
  const cards = [
    {
      label: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: 'indigo',
      bgColor: 'bg-indigo-500/15',
      textColor: 'text-indigo-400',
      borderColor: 'hover:border-indigo-500/30',
      change: `+${stats.newUsersToday} today`,
    },
    {
      label: 'Total Payouts',
      value: `$${stats.totalPayouts.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'emerald',
      bgColor: 'bg-emerald-500/15',
      textColor: 'text-emerald-400',
      borderColor: 'hover:border-emerald-500/30',
      change: 'All time',
    },
    {
      label: 'Pending Payouts',
      value: `$${stats.pendingPayouts.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      icon: Clock,
      color: 'amber',
      bgColor: 'bg-amber-500/15',
      textColor: 'text-amber-400',
      borderColor: 'hover:border-amber-500/30',
      change: `${stats.pendingWithdrawals} requests`,
    },
    {
      label: 'Active Today',
      value: stats.activeToday.toLocaleString(),
      icon: Activity,
      color: 'purple',
      bgColor: 'bg-purple-500/15',
      textColor: 'text-purple-400',
      borderColor: 'hover:border-purple-500/30',
      change: `${stats.totalUsers > 0 ? ((stats.activeToday / stats.totalUsers) * 100).toFixed(1) : 0}% of users`,
    },
    {
      label: 'Platform Balance',
      value: `$${stats.totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      icon: Wallet,
      color: 'cyan',
      bgColor: 'bg-cyan-500/15',
      textColor: 'text-cyan-400',
      borderColor: 'hover:border-cyan-500/30',
      change: 'Held by users',
    },
    {
      label: 'Tasks Completed',
      value: stats.completedTasks.toLocaleString(),
      icon: CheckCircle,
      color: 'green',
      bgColor: 'bg-green-500/15',
      textColor: 'text-green-400',
      borderColor: 'hover:border-green-500/30',
      change: `${stats.totalTasks > 0 ? ((stats.completedTasks / stats.totalTasks) * 100).toFixed(1) : 0}% completion`,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-5 bg-white/[0.03] border border-white/[0.06] rounded-2xl animate-pulse">
            <div className="flex items-center justify-between mb-3">
              <div className="w-11 h-11 rounded-xl bg-white/5" />
              <div className="w-16 h-4 bg-white/5 rounded" />
            </div>
            <div className="w-20 h-3 bg-white/5 rounded mb-2" />
            <div className="w-28 h-7 bg-white/5 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`p-5 bg-white/[0.03] border border-white/[0.06] rounded-2xl transition-all ${card.borderColor} group`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`w-11 h-11 rounded-xl ${card.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <card.icon size={20} className={card.textColor} />
            </div>
            <span className={`text-xs font-medium ${card.textColor} bg-white/5 px-2 py-1 rounded-full`}>
              {card.change}
            </span>
          </div>
          <p className="text-xs text-gray-500 font-medium mb-0.5">{card.label}</p>
          <p className="text-2xl font-bold text-white">{card.value}</p>
        </div>
      ))}
    </div>
  );
};

export default AdminStatsCards;
