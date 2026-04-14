import React, { useState, useMemo } from 'react';
import { Search, Filter, ChevronDown, ChevronUp, User, ArrowUpDown, Eye, Ban, Shield, X, Trash2, RefreshCw } from 'lucide-react';

export interface AdminUser {
  id: string;
  email: string;
  phone?: string;
  display_name: string;
  vip_level: number;
  balance: number;
  total_earned: number;
  referral_code: string;
  created_at: string;
  tasks_completed: number;
  tasks_total: number;
  // New training system fields
  account_type: 'personal' | 'training';
  training_phase?: 1 | 2;
  training_progress?: number;
  trigger_task_number?: 19 | 24 | 31;
  has_pending_order?: boolean;
  pending_amount?: number;
  is_negative_balance?: boolean;
  profit_added?: boolean;
  training_completed?: boolean;
  last_login?: string;
  status: 'active' | 'suspended' | 'banned' | 'flagged';
}

interface AdminUsersTableProps {
  users: AdminUser[];
  isLoading: boolean;
  onViewUser: (user: AdminUser) => void;
  onDeleteUser?: (user: AdminUser) => void;
  onResetTraining?: (user: AdminUser) => void;
}

type SortField = 'display_name' | 'email' | 'balance' | 'total_earned' | 'created_at' | 'tasks_completed' | 'account_type';
type SortDir = 'asc' | 'desc';

const AdminUsersTable: React.FC<AdminUsersTableProps> = ({ users, isLoading, onViewUser, onDeleteUser, onResetTraining }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [vipFilter, setVipFilter] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const itemsPerPage = 10;

  const filteredUsers = useMemo(() => {
    let result = [...users];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(u =>
        u.display_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.referral_code.toLowerCase().includes(q) ||
        (u.phone && u.phone.includes(q))
      );
    }

    // VIP filter
    if (vipFilter !== null) {
      result = result.filter(u => u.vip_level === vipFilter);
    }

    // Status filter
    if (statusFilter === 'active') {
      result = result.filter(u => u.tasks_completed > 0);
    } else if (statusFilter === 'inactive') {
      result = result.filter(u => u.tasks_completed === 0);
    } else if (statusFilter === 'completed') {
      result = result.filter(u => u.tasks_completed >= u.tasks_total);
    }

    // Sort
    result.sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === 'created_at') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }

      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [users, searchQuery, vipFilter, statusFilter, sortField, sortDir]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown size={12} className="text-gray-600" />;
    return sortDir === 'asc' ? <ChevronUp size={12} className="text-indigo-400" /> : <ChevronDown size={12} className="text-indigo-400" />;
  };

  const getProgressColor = (completed: number, total: number) => {
    const pct = total > 0 ? (completed / total) * 100 : 0;
    if (pct >= 100) return 'bg-emerald-500';
    if (pct >= 50) return 'bg-indigo-500';
    if (pct > 0) return 'bg-amber-500';
    return 'bg-gray-600';
  };

  if (isLoading) {
    return (
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/[0.06]">
          <div className="w-64 h-10 bg-white/5 rounded-lg animate-pulse" />
        </div>
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 bg-white/[0.02] rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
      {/* Header with Search & Filters */}
      <div className="p-4 border-b border-white/[0.06]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search by name, email, phone, or referral code..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              showFilters ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30' : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
            }`}
          >
            <Filter size={14} />
            Filters
            {(vipFilter !== null || statusFilter !== 'all') && (
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
            )}
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-3 flex flex-wrap items-center gap-3 pt-3 border-t border-white/[0.06]">
            {/* VIP Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">VIP Level:</span>
              <div className="flex gap-1">
                <button
                  onClick={() => { setVipFilter(null); setCurrentPage(1); }}
                  className={`px-2.5 py-1 text-xs rounded-lg transition-all ${
                    vipFilter === null ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-white/5 text-gray-500 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  All
                </button>
                {[1, 2, 3].map(level => {
                  const tierNames: Record<number, string> = { 1: 'Bronze', 2: 'Silver', 3: 'Gold' };
                  return (
                    <button
                      key={level}
                      onClick={() => { setVipFilter(vipFilter === level ? null : level); setCurrentPage(1); }}
                      className={`px-2.5 py-1 text-xs rounded-lg transition-all ${
                        vipFilter === level ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-white/5 text-gray-500 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      VIP{level} {tierNames[level]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Status:</span>
              <div className="flex gap-1">
                {[
                  { value: 'all', label: 'All' },
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'completed', label: 'Completed' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setStatusFilter(opt.value); setCurrentPage(1); }}
                    className={`px-2.5 py-1 text-xs rounded-lg transition-all ${
                      statusFilter === opt.value ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-white/5 text-gray-500 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            {(vipFilter !== null || statusFilter !== 'all') && (
              <button
                onClick={() => { setVipFilter(null); setStatusFilter('all'); setCurrentPage(1); }}
                className="px-2.5 py-1 text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Results count */}
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Showing {paginatedUsers.length} of {filteredUsers.length} users
            {filteredUsers.length !== users.length && ` (filtered from ${users.length})`}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="text-left px-4 py-3">
                <button onClick={() => handleSort('display_name')} className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-white transition-colors">
                  User <SortIcon field="display_name" />
                </button>
              </th>
              <th className="text-left px-4 py-3">
                <button onClick={() => handleSort('account_type')} className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-white transition-colors">
                  Type <SortIcon field="account_type" />
                </button>
              </th>
              <th className="text-center px-4 py-3 hidden lg:table-cell">
                <button onClick={() => handleSort('email')} className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-white transition-colors">
                  Email <SortIcon field="email" />
                </button>
              </th>
              <th className="text-center px-4 py-3">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">VIP</span>
              </th>
              <th className="text-left px-4 py-3">
                <button onClick={() => handleSort('tasks_completed')} className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-white transition-colors">
                  Progress <SortIcon field="tasks_completed" />
                </button>
              </th>
              <th className="text-center px-4 py-3">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</span>
              </th>
              <th className="text-right px-4 py-3 hidden sm:table-cell">
                <button onClick={() => handleSort('balance')} className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-white transition-colors ml-auto">
                  Balance <SortIcon field="balance" />
                </button>
              </th>
              <th className="text-right px-4 py-3 hidden md:table-cell">
                <button onClick={() => handleSort('total_earned')} className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-white transition-colors ml-auto">
                  Earned <SortIcon field="total_earned" />
                </button>
              </th>
              <th className="text-right px-4 py-3 hidden xl:table-cell">
                <button onClick={() => handleSort('created_at')} className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-white transition-colors ml-auto">
                  Joined <SortIcon field="created_at" />
                </button>
              </th>
              <th className="text-right px-4 py-3">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <User size={32} className="text-gray-600" />
                    <p className="text-sm text-gray-500">No users found</p>
                    <p className="text-xs text-gray-600">Try adjusting your search or filters</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedUsers.map((user) => {
                const progressPct = user.tasks_total > 0 ? (user.tasks_completed / user.tasks_total) * 100 : 0;
                return (
                  <tr key={user.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-white">{(user.display_name || '?').charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">{user.display_name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500 lg:hidden truncate">{user.email || 'No email'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.account_type === 'training' 
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}>
                        {user.account_type === 'training' ? 'Training' : 'Personal'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <p className="text-sm text-gray-400 truncate max-w-[200px]">{user.email || 'No email'}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-bold rounded-full">
                        VIP{user.vip_level}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 max-w-[120px]">
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${getProgressColor(user.tasks_completed, user.tasks_total)}`}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
                          {user.tasks_completed}/{user.tasks_total}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {user.training_completed ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                          Training Complete 🎓
                        </span>
                      ) : user.has_pending_order ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                          Pending Order
                        </span>
                      ) : user.is_negative_balance ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                          Awaiting Clearance
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          Training in Progress
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell">
                      <span className="text-sm font-semibold text-emerald-400">${(user.balance || 0).toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-3 text-right hidden md:table-cell">
                      <span className="text-sm text-gray-400">${(user.total_earned || 0).toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-3 text-right hidden xl:table-cell">
                      <span className="text-xs text-gray-500">{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onViewUser(user)}
                          className="p-2 rounded-lg bg-white/5 hover:bg-indigo-500/15 text-gray-400 hover:text-indigo-400 transition-all"
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                        {user.account_type === 'training' && onResetTraining && (
                          <button
                            onClick={() => onResetTraining(user)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-amber-500/15 text-gray-400 hover:text-amber-400 transition-all"
                            title="Reset Training Account"
                          >
                            <RefreshCw size={14} />
                          </button>
                        )}
                        {user.account_type === 'training' && onDeleteUser && (
                          <button
                            onClick={() => onDeleteUser(user)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-red-500/15 text-gray-400 hover:text-red-400 transition-all"
                            title="Delete Training Account"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 text-xs font-medium text-gray-400 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Previous
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let page: number;
              if (totalPages <= 7) {
                page = i + 1;
              } else if (currentPage <= 4) {
                page = i + 1;
              } else if (currentPage >= totalPages - 3) {
                page = totalPages - 6 + i;
              } else {
                page = currentPage - 3 + i;
              }
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 text-xs font-medium rounded-lg transition-all ${
                    currentPage === page
                      ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                      : 'text-gray-500 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {page}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 text-xs font-medium text-gray-400 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminUsersTable;
