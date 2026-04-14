import React, { useEffect, useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Wallet, Copy, CheckCircle, Plus, Shield, AlertCircle, Loader2, ExternalLink, History } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import TransactionHistory from './TransactionHistory';

const WALLET_TYPES = [
  { value: 'USDT-TRC20', label: 'USDT (TRC20)', network: 'Tron Network' },
  { value: 'USDT-ERC20', label: 'USDT (ERC20)', network: 'Ethereum Network' },
  { value: 'USDT-BEP20', label: 'USDT (BEP20)', network: 'BSC Network' },
  { value: 'BTC', label: 'Bitcoin (BTC)', network: 'Bitcoin Network' },
];

const WalletSection: React.FC = () => {
  const { wallets, refreshWallets, addWallet, isLoading } = useAppContext();
  const [showBindForm, setShowBindForm] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [walletType, setWalletType] = useState('USDT-TRC20');
  const [copied, setCopied] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    refreshWallets();
  }, [refreshWallets]);

  const safeWallets = wallets || [];
  const primaryWallet = safeWallets.find(w => w.is_primary);

  const validateAddress = (address: string, type: string): boolean => {
    if (!address.trim()) {
      setErrors({ address: 'Wallet address is required' });
      return false;
    }
    if (address.length < 20) {
      setErrors({ address: 'Invalid wallet address format' });
      return false;
    }
    // Basic validation per type
    if (type === 'USDT-TRC20' && !address.startsWith('T')) {
      setErrors({ address: 'TRC20 addresses must start with T' });
      return false;
    }
    if ((type === 'USDT-ERC20' || type === 'USDT-BEP20') && !address.startsWith('0x')) {
      setErrors({ address: 'ERC20/BEP20 addresses must start with 0x' });
      return false;
    }
    setErrors({});
    return true;
  };

  const handleBind = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAddress(walletAddress, walletType)) return;
    const success = await addWallet(walletAddress, walletType);
    if (success) {
      setWalletAddress('');
      setShowBindForm(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast({ title: 'Copied!', description: 'Wallet address copied to clipboard.' });
    setTimeout(() => setCopied(null), 2000);
  };

  const truncateAddress = (addr: string) => {
    if (addr.length <= 16) return addr;
    return `${addr.slice(0, 8)}...${addr.slice(-8)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Wallet Management</h2>
          <p className="text-sm text-gray-500 mt-0.5">Bind and manage your digital wallets for withdrawals</p>
        </div>
        <button
          onClick={() => setShowBindForm(!showBindForm)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold rounded-lg transition-all shadow-lg shadow-indigo-500/25"
        >
          <Plus size={16} />
          Bind Wallet
        </button>
      </div>

      {/* Bind Wallet Form */}
      {showBindForm && (
        <div className="p-6 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Shield size={18} className="text-indigo-400" />
            Bind New Wallet
          </h3>
          <form onSubmit={handleBind} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Wallet Network</label>
              <div className="grid grid-cols-2 gap-2">
                {WALLET_TYPES.map(wt => (
                  <button
                    key={wt.value}
                    type="button"
                    onClick={() => { setWalletType(wt.value); setErrors({}); }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      walletType === wt.value
                        ? 'bg-indigo-500/15 border-indigo-500/40 ring-1 ring-indigo-500/30'
                        : 'bg-white/[0.02] border-white/[0.06] hover:border-white/10'
                    }`}
                  >
                    <div className={`text-sm font-semibold ${walletType === wt.value ? 'text-indigo-300' : 'text-gray-300'}`}>
                      {wt.label}
                    </div>
                    <div className="text-xs text-gray-500">{wt.network}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Wallet Address</label>
              <input
                type="text"
                value={walletAddress}
                onChange={e => { setWalletAddress(e.target.value); setErrors({}); }}
                placeholder={walletType === 'USDT-TRC20' ? 'T...' : walletType === 'BTC' ? 'bc1...' : '0x...'}
                className="w-full px-4 py-3 bg-[#1a2038] border border-indigo-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono text-sm"
              />
              {errors.address && (
                <p className="flex items-center gap-1 text-red-400 text-xs mt-1.5">
                  <AlertCircle size={12} /> {errors.address}
                </p>
              )}
            </div>

            <div className="p-3 bg-amber-500/5 border border-amber-500/15 rounded-lg">
              <p className="text-xs text-amber-400/80 flex items-start gap-2">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                Please double-check your wallet address. Incorrect addresses may result in permanent loss of funds.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setShowBindForm(false); setErrors({}); setWalletAddress(''); }}
                className="flex-1 py-3 bg-white/5 border border-white/10 text-gray-300 font-semibold rounded-xl hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? <><Loader2 size={16} className="animate-spin" /> Binding...</> : 'Confirm Binding'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Primary Wallet */}
      {primaryWallet ? (
        <div className="p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                <Wallet size={20} className="text-indigo-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Primary Wallet</h3>
                <p className="text-xs text-gray-500">{primaryWallet.wallet_type}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/15 border border-emerald-500/25 rounded-full">
              <CheckCircle size={12} className="text-emerald-400" />
              <span className="text-xs text-emerald-400 font-medium">Active</span>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-black/20 rounded-lg">
            <code className="flex-1 text-sm text-indigo-300 font-mono truncate">{primaryWallet.wallet_address}</code>
            <button
              onClick={() => copyToClipboard(primaryWallet.wallet_address, primaryWallet.id)}
              className="flex-shrink-0 p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              {copied === primaryWallet.id ? (
                <CheckCircle size={16} className="text-emerald-400" />
              ) : (
                <Copy size={16} className="text-gray-400" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Bound on {new Date(primaryWallet.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      ) : (
        <div className="p-8 bg-white/[0.02] border border-dashed border-white/10 rounded-2xl text-center">
          <Wallet size={40} className="text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-300 mb-1">No Wallet Bound</h3>
          <p className="text-sm text-gray-500 mb-4">Bind a digital wallet to enable withdrawals.</p>
          <button
            onClick={() => setShowBindForm(true)}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-lg transition-all"
          >
            Bind Your Wallet
          </button>
        </div>
      )}

      {/* All Wallets */}
      {safeWallets.length > 1 && (
        <div className="p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
          <h3 className="text-lg font-semibold text-white mb-4">All Wallets</h3>
          <div className="space-y-3">
            {safeWallets.map(w => (
              <div key={w.id} className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                    <Wallet size={16} className="text-indigo-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{w.wallet_type}</span>
                      {w.is_primary && <span className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-400 text-[10px] font-bold rounded">PRIMARY</span>}
                    </div>
                    <code className="text-xs text-gray-500 font-mono">{truncateAddress(w.wallet_address)}</code>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(w.wallet_address, w.id)}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors flex-shrink-0"
                >
                  {copied === w.id ? <CheckCircle size={14} className="text-emerald-400" /> : <Copy size={14} className="text-gray-400" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <History size={18} className="text-indigo-400" />
            Transaction History
          </h3>
        </div>
        <TransactionHistory />
      </div>

      {/* Security Info */}
      <div className="p-5 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
        <div className="flex items-start gap-3">
          <Shield size={20} className="text-indigo-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-white mb-1">Wallet Security</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Your wallet addresses are encrypted and stored securely. We never store private keys or seed phrases. 
              Only bind wallets that you have full control over. Withdrawals are processed to your primary wallet address.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletSection;
