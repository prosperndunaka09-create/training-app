import React, { useState, useMemo } from 'react';
import { Search, Filter, ChevronDown, ChevronUp, ArrowUpDown, Check, X, Clock, AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export interface AdminWithdrawal {
  id: string;
  user_id: string;
  amount: number;
  wallet_address: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  created_at: string;
  processed_at: string | null;
  user_name: string;
  user_email: string;
}

interface AdminWithdrawalsTableProps {
  withdrawals: AdminWithdrawal[];
  isLoading: boolean;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  processingIds: Set<string>;
}

type SortField = 'user_name' | 'amount' | 'status' | 'created_at';
type SortDir = 'asc' | 'desc';

const AdminWithdrawalsTable: React.FC<AdminWithdrawalsTableProps> = ({
  withdrawals,
  isLoading,
  onApprove,
  onReject,
  processingIds,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: 'approve' | 'reject' } | null>(null);
  const itemsPerPage = 10;

  const filteredWithdrawals = useMemo(() => {
    let result = [...withdrawals];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(w =>
        w.user_name.toLowerCase().includes(q) ||
        w.user_email.toLowerCase().includes(q) ||
        w.wallet_address.toLowerCase().includes(q) ||
        w.amount.toString().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(w => w.status === statusFilter);
    }

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
  }, [withdrawals, searchQuery, statusFilter, sortField, sortDir]);

  const totalPages = Math.ceil(filteredWithdrawals.length / itemsPerPage);
  const paginatedWithdrawals = filteredWithdrawals.slice(
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

  const statusConfig = {
    pending: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/15', label: 'Pending' },
    processing: { icon: Loader2, color: 'text-blue-400', bg: 'bg-blue-500/15', label: 'Processing' },
    completed: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/15', label: 'Completed' },
    rejected: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/15', label: 'Rejected' },
  };

  const pendingCount = withdrawals.filter(w => w.status === 'pending').length;
  const totalPending = withdrawals.filter(w => w.status === 'pending').reduce((s, w) => s + w.amount, 0);

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    if (confirmAction.action === 'approve') {
      await onApprove(confirmAction.id);
    } else {
      await onReject(confirmAction.id);
    }
    setConfirmAction(null);
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
    <>
      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setConfirmAction(null)}>
          <div className="bg-[#141829] border border-white/10 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className={`w-12 h-12 rounded-xl ${confirmAction.action === 'approve' ? 'bg-emerald-500/15' : 'bg-red-500/15'} flex items-center justify-center mx-auto mb-4`}>
              {confirmAction.action === 'approve' ? (
                <Check size={24} className="text-emerald-400" />
              ) : (
                <X size={24} className="text-red-400" />
              )}
            </div>
            <h3 className="text-lg font-bold text-white text-center mb-2">
              {confirmAction.action === 'approve' ? 'Approve Withdrawal' : 'Reject Withdrawal'}
            </h3>
            <p className="text-sm text-gray-400 text-center mb-6">
              {confirmAction.action === 'approve'
                ? 'Are you sure you want to approve this withdrawal? The funds will be marked as sent.'
                : 'Are you sure you want to reject this withdrawal? The funds will be refunded to the user\'s balance.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-gray-400 hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all ${
                  confirmAction.action === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-red-600 hover:bg-red-500'
                }`}
              >
                {confirmAction.action === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
        {/* Summary Bar */}
        {pendingCount > 0 && (
          <div className="px-4 py-3 bg-amber-500/5 border-b border-amber-500/10 flex items-center gap-3">
            <AlertTriangle size={16} className="text-amber-400" />
            <span className="text-sm text-amber-400 font-medium">
              {pendingCount} pending withdrawal{pendingCount > 1 ? 's' : ''} totaling ${totalPending.toFixed(2)}
            </span>
          </div>
        )}

        {/* Header */}
        <div className="p-4 border-b border-white/[0.06]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search by user, email, or wallet address..."
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

            <div className="flex gap-1">
              {[
                { value: 'all', label: 'All' },
                { value: 'pending', label: 'Pending' },
                { value: 'processing', label: 'Processing' },
                { value: 'completed', label: 'Completed' },
                { value: 'rejected', label: 'Rejected' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setStatusFilter(opt.value); setCurrentPage(1); }}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                    statusFilter === opt.value
                      ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                      : 'bg-white/5 text-gray-500 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3">
            <p className="text-xs text-gray-500">
              Showing {paginatedWithdrawals.length} of {filteredWithdrawals.length} withdrawals
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left px-4 py-3">
                  <button onClick={() => handleSort('user_name')} className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-white transition-colors">
                    User <SortIcon field="user_name" />
                  </button>
                </th>
                <th className="text-right px-4 py-3">
                  <button onClick={() => handleSort('amount')} className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-white transition-colors ml-auto">
                    Amount <SortIcon field="amount" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 hidden md:table-cell">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Wallet</span>
                </th>
                <th className="text-center px-4 py-3">
                  <button onClick={() => handleSort('status')} className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-white transition-colors mx-auto">
                    Status <SortIcon field="status" />
                  </button>
                </th>
                <th className="text-right px-4 py-3 hidden sm:table-cell">
                  <button onClick={() => handleSort('created_at')} className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-white transition-colors ml-auto">
                    Date <SortIcon field="created_at" />
                  </button>
                </th>
                <th className="text-right px-4 py-3">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedWithdrawals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle size={32} className="text-gray-600" />
                      <p className="text-sm text-gray-500">No withdrawals found</p>
                      <p className="text-xs text-gray-600">
                        {statusFilter !== 'all' ? 'Try changing the status filter' : 'No withdrawal requests yet'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedWithdrawals.map((w) => {
                  const config = statusConfig[w.status];
                  const isProcessing = processingIds.has(w.id);
                  return (
                    <tr key={w.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-white">{w.user_name}</p>
                          <p className="text-xs text-gray-500">{w.user_email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-bold text-white">${w.amount.toFixed(2)}</span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-gray-400 font-mono truncate block max-w-[180px]" title={w.wallet_address}>
                          {w.wallet_address}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${config.bg} ${config.color}`}>
                          <config.icon size={12} className={w.status === 'processing' ? 'animate-spin' : ''} />
                          {config.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right hidden sm:table-cell">
                        <div>
                          <p className="text-xs text-gray-400">{new Date(w.created_at).toLocaleDateString()}</p>
                          <p className="text-xs text-gray-600">{new Date(w.created_at).toLocaleTimeString()}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {w.status === 'pending' && !isProcessing ? (
                          <div className="flex items-center gap-1.5 justify-end">
                            <button
                              onClick={() => setConfirmAction({ id: w.id, action: 'approve' })}
                              className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-all"
                              title="Approve"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => setConfirmAction({ id: w.id, action: 'reject' })}
                              className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all"
                              title="Reject"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : isProcessing ? (
                          <Loader2 size={16} className="text-indigo-400 animate-spin ml-auto" />
                        ) : (
                          <span className="text-xs text-gray-600">
                            {w.processed_at ? new Date(w.processed_at).toLocaleDateString() : '—'}
                          </span>
                        )}
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
    </>
  );
};

export default AdminWithdrawalsTable;
