import React from 'react';
import { X, MessageCircle, Send, Clock } from 'lucide-react';

interface CSSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTelegram: () => void;
  onSelectOnline: () => void;
}

const CSSelectionModal: React.FC<CSSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectTelegram,
  onSelectOnline
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#0f1420] border border-white/[0.1] rounded-2xl w-full max-w-md p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-white/[0.05] rounded-lg text-gray-400 hover:text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center animate-pulse">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">Customer Support</h2>
          <p className="text-sm text-gray-400 mt-1">Choose your preferred support channel</p>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {/* CS1 - Telegram */}
          <button
            onClick={onSelectTelegram}
            className="w-full p-4 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-xl hover:border-blue-500/50 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Send className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-white font-semibold">CS1 - Telegram</h3>
                <p className="text-sm text-gray-400">Direct message on Telegram</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          </button>

          {/* CS2 - Online */}
          <button
            onClick={onSelectOnline}
            className="w-full p-4 bg-gradient-to-r from-pink-600/20 to-rose-600/20 border border-pink-500/30 rounded-xl hover:border-pink-500/50 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center animate-pulse">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-white font-semibold">Online CS2</h3>
                <p className="text-sm text-gray-400">Live chat support 24/7</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-6">
          Both channels are actively monitored 24/7
        </p>
      </div>
    </div>
  );
};

export default CSSelectionModal;
