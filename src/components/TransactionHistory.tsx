import React, { useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { ArrowDownLeft, ArrowUpRight, DollarSign, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const TransactionHistory: React.FC = () => {
  const { transactions, refreshTransactions } = useAppContext();
  const safeTransactions = transactions || [];

  useEffect(() => {
    refreshTransactions();
  }, [refreshTransactions]);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft size={16} className="text-emerald-400" />;
      case 'withdrawal':
        return <ArrowUpRight size={16} className="text-red-400" />;
      case 'reward':
        return <DollarSign size={16} className="text-amber-400" />;
      case 'demo':
        return <AlertCircle size={16} className="text-blue-400" />;
      default:
        return <DollarSign size={16} className="text-gray-400" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={14} className="text-emerald-400" />;
      case 'pending':
        return <Clock size={14} className="text-amber-400" />;
      case 'failed':
        return <XCircle size={14} className="text-red-400" />;
      default:
        return <Clock size={14} className="text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/15 text-emerald-400';
      case 'pending':
        return 'bg-amber-500/15 text-amber-400';
      case 'failed':
        return 'bg-red-500/15 text-red-400';
      default:
        return 'bg-gray-500/15 text-gray-400';
    }
  };

  const formatAmount = (amount: number, type: string) => {
    const isPositive = amount > 0 || type === 'demo';
    return {
      value: Math.abs(amount).toFixed(2),
      color: isPositive ? 'text-emerald-400' : 'text-red-400',
      sign: isPositive ? '+' : '-'
    };
  };

  if (safeTransactions.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 rounded-xl bg-gray-500/10 flex items-center justify-center mx-auto mb-4">
          <Clock size={24} className="text-gray-500" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">No Transactions Yet</h3>
        <p className="text-gray-400 text-sm">Your transaction history will appear here once you start completing tasks.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {safeTransactions.map((transaction) => {
        const amountDisplay = formatAmount(transaction.amount, transaction.type);
        
        return (
          <div
            key={transaction.id}
            className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl hover:bg-white/[0.04] transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                  {getTransactionIcon(transaction.type)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{transaction.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">
                      {new Date(transaction.created_at).toLocaleDateString()} • {new Date(transaction.created_at).toLocaleTimeString()}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(transaction.status)}`}>
                      {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-lg font-bold ${amountDisplay.color}`}>
                  {amountDisplay.sign}${amountDisplay.value}
                </p>
                <div className="flex items-center gap-1 justify-end mt-1">
                  {getStatusIcon(transaction.status)}
                  <span className="text-xs text-gray-500 capitalize">
                    {transaction.type}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TransactionHistory;
