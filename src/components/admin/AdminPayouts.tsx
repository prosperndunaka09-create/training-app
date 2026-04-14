import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Check, 
  X, 
  DollarSign, 
  Calendar, 
  CreditCard,
  Banknote,
  Wallet,
  Eye,
  AlertTriangle,
  Clock
} from 'lucide-react';

interface PayoutRequest {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  amount: number;
  method: string;
  method_details: any;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  requested_at: string;
  reviewed_by?: string;
  review_date?: string;
  review_notes?: string;
  approved_amount?: number;
  paid_at?: string;
  transaction_hash?: string;
}

const AdminPayouts: React.FC = () => {
  const navigate = useNavigate();
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [filteredPayouts, setFilteredPayouts] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPayout, setSelectedPayout] = useState<PayoutRequest | null>(null);
  const [reviewForm, setReviewForm] = useState({
    status: '',
    review_notes: '',
    approved_amount: 0
  });

  useEffect(() => {
    fetchPayouts();
  }, []);

  useEffect(() => {
    let filtered = payouts;
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(payout => payout.status === statusFilter);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(payout => 
        payout.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payout.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payout.method.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredPayouts(filtered);
  }, [searchTerm, statusFilter, payouts]);

  const fetchPayouts = async () => {
    try {
      // Mock data - replace with real API call
      const mockPayouts: PayoutRequest[] = [
        {
          id: '1',
          user_id: 'user-1',
          user_email: 'john@example.com',
          user_name: 'John Doe',
          amount: 250.00,
          method: 'bank_transfer',
          method_details: {
            bank_name: 'First National Bank',
            account_number: '****1234',
            routing_number: '****5678'
          },
          status: 'pending',
          requested_at: '2025-03-26T14:30:00Z',
        },
        {
          id: '2',
          user_id: 'user-2',
          user_email: 'jane@example.com',
          user_name: 'Jane Smith',
          amount: 500.00,
          method: 'crypto',
          method_details: {
            currency: 'BTC',
            address: '1A2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7'
          },
          status: 'approved',
          reviewed_by: 'admin@optimize.com',
          review_date: '2025-03-26T16:45:00Z',
          review_notes: 'Approved for standard withdrawal',
          approved_amount: 500.00,
          requested_at: '2025-03-25T10:15:00Z',
        },
        {
          id: '3',
          user_id: 'user-3',
          user_email: 'mike@example.com',
          user_name: 'Mike Johnson',
          amount: 1000.00,
          method: 'paypal',
          method_details: {
            paypal_email: 'mike.johnson@example.com'
          },
          status: 'rejected',
          reviewed_by: 'admin@optimize.com',
          review_date: '2025-03-26T12:20:00Z',
          review_notes: 'Insufficient balance. User needs to complete more tasks.',
          requested_at: '2025-03-24T09:30:00Z',
        },
        {
          id: '4',
          user_id: 'user-4',
          user_email: 'sarah@example.com',
          user_name: 'Sarah Wilson',
          amount: 150.00,
          method: 'crypto',
          method_details: {
            currency: 'ETH',
            address: '0x742d35Cc6634C0532925a3b844Bc9e7598d'
          },
          status: 'paid',
          reviewed_by: 'admin@optimize.com',
          review_date: '2025-03-26T11:00:00Z',
          review_notes: 'Processed via ETH network',
          approved_amount: 150.00,
          paid_at: '2025-03-26T14:00:00Z',
          transaction_hash: '0x123456789abcdef123456789',
          requested_at: '2025-03-20T16:45:00Z',
        }
      ];
      setPayouts(mockPayouts);
    } catch (error) {
      console.error('Failed to fetch payouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePayout = async (payoutId: string, approvedAmount: number, notes: string) => {
    try {
      // API call to approve payout
      await logAdminAction('PAYOUT_APPROVE', 'admin@optimize.com', { 
        payoutId, 
        approvedAmount, 
        notes 
      });
      
      setPayouts(payouts.map(p => 
        p.id === payoutId 
          ? { 
              ...p, 
              status: 'approved' as const,
              approved_amount: approvedAmount,
              reviewed_by: 'admin@optimize.com',
              review_date: new Date().toISOString(),
              review_notes: notes
            }
          : p
      ));
      setSelectedPayout(null);
    } catch (error) {
      console.error('Failed to approve payout:', error);
    }
  };

  const handleRejectPayout = async (payoutId: string, notes: string) => {
    try {
      // API call to reject payout
      await logAdminAction('PAYOUT_REJECT', 'admin@optimize.com', { payoutId, notes });
      
      setPayouts(payouts.map(p => 
        p.id === payoutId 
          ? { 
              ...p, 
              status: 'rejected' as const,
              reviewed_by: 'admin@optimize.com',
              review_date: new Date().toISOString(),
              review_notes: notes
            }
          : p
      ));
      setSelectedPayout(null);
    } catch (error) {
      console.error('Failed to reject payout:', error);
    }
  };

  const handleMarkPaid = async (payoutId: string, transactionHash: string) => {
    try {
      // API call to mark payout as paid
      await logAdminAction('PAYOUT_MARK_PAID', 'admin@optimize.com', { payoutId, transactionHash });
      
      setPayouts(payouts.map(p => 
        p.id === payoutId 
          ? { 
              ...p, 
              status: 'paid' as const,
              paid_at: new Date().toISOString(),
              transaction_hash: transactionHash
            }
          : p
      ));
      setSelectedPayout(null);
    } catch (error) {
      console.error('Failed to mark payout as paid:', error);
    }
  };

  const openReviewModal = (payout: PayoutRequest) => {
    setSelectedPayout(payout);
    setReviewForm({
      status: payout.status === 'pending' ? 'approved' : payout.status,
      review_notes: payout.review_notes || '',
      approved_amount: payout.approved_amount || payout.amount
    });
  };

  const closeReviewModal = () => {
    setSelectedPayout(null);
    setReviewForm({
      status: '',
      review_notes: '',
      approved_amount: 0
    });
  };

  const logAdminAction = async (action: string, actor: string, details: any) => {
    try {
      console.log('Logging admin action:', { action, actor, details });
    } catch (error) {
      console.error('Failed to log admin action:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; text: string }> = {
      pending: { variant: 'outline', text: 'Pending' },
      approved: { variant: 'default', text: 'Approved' },
      rejected: { variant: 'destructive', text: 'Rejected' },
      paid: { variant: 'default', text: 'Paid' }
    };
    return variants[status] || { variant: 'outline', text: status };
  };

  const getMethodIcon = (method: string) => {
    const icons: Record<string, React.ReactNode> = {
      bank_transfer: <Banknote size={16} />,
      crypto: <CreditCard size={16} />,
      paypal: <Wallet size={16} />,
      skrill: <DollarSign size={16} />
    };
    return icons[method] || <DollarSign size={16} />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading payout requests...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Payout Requests</h1>
            <p className="text-gray-400">Review and process withdrawal requests</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/admin/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-gray-800 border-gray-700 mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search by user, email, or method..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-gray-400">
              {filteredPayouts.length} of {payouts.length} requests
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payouts Table */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-4 font-medium text-gray-300">User</th>
                  <th className="text-left p-4 font-medium text-gray-300">Amount</th>
                  <th className="text-left p-4 font-medium text-gray-300">Method</th>
                  <th className="text-left p-4 font-medium text-gray-300">Status</th>
                  <th className="text-left p-4 font-medium text-gray-300">Requested</th>
                  <th className="text-left p-4 font-medium text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayouts.map((payout) => (
                  <tr key={payout.id} className="border-b border-gray-700 hover:bg-gray-750 transition-colors">
                    <td className="p-4">
                      <div>
                        <div className="font-medium text-white">{payout.user_name}</div>
                        <div className="text-sm text-gray-400">{payout.user_email}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-400" />
                        <span className="font-mono text-white">${payout.amount.toFixed(2)}</span>
                        {payout.approved_amount && payout.approved_amount !== payout.amount && (
                          <div className="text-xs text-yellow-400">
                            Approved: ${payout.approved_amount.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getMethodIcon(payout.method)}
                        <span className="text-white capitalize">{payout.method.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant={getStatusBadge(payout.status).variant as any}>
                        {getStatusBadge(payout.status).text}
                      </Badge>
                      {payout.review_notes && (
                        <div className="text-xs text-gray-400 mt-1 max-w-xs truncate">
                          {payout.review_notes}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-gray-400">
                        {new Date(payout.requested_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(payout.requested_at).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openReviewModal(payout)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye size={14} />
                        </Button>
                        
                        {payout.status === 'approved' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkPaid(payout.id, '0x' + Math.random().toString(36).substr(2, 10))}
                            className="h-8 w-8 p-0 text-green-400 hover:text-green-300"
                          >
                            <Check size={14} />
                          </Button>
                        )}
                        
                        {(payout.status === 'pending' || payout.status === 'approved') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openReviewModal(payout)}
                            className="h-8 w-8 p-0 text-orange-400 hover:text-orange-300"
                          >
                            <AlertTriangle size={14} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Review Modal */}
      {selectedPayout && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="bg-gray-800 border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-white">Review Payout Request</CardTitle>
                <Button variant="outline" onClick={closeReviewModal}>
                  <X size={16} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Request Details</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-400">User</label>
                      <p className="text-white">{selectedPayout.user_name} ({selectedPayout.user_email})</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">Requested Amount</label>
                      <p className="text-xl font-bold text-white">${selectedPayout.amount.toFixed(2)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">Method</label>
                      <div className="flex items-center gap-2">
                        {getMethodIcon(selectedPayout.method)}
                        <span className="text-white capitalize">{selectedPayout.method.replace('_', ' ')}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">Requested Date</label>
                      <p className="text-white">{new Date(selectedPayout.requested_at).toLocaleString()}</p>
                    </div>
                    {selectedPayout.method_details && (
                      <div>
                        <label className="text-sm font-medium text-gray-400">Method Details</label>
                        <pre className="text-xs bg-gray-700 p-2 rounded text-gray-300 overflow-x-auto">
                          {JSON.stringify(selectedPayout.method_details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Review Action</h3>
                  <div className="space-y-4">
                    {selectedPayout.status === 'pending' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Decision</label>
                          <Select value={reviewForm.status} onValueChange={(value) => setReviewForm(prev => ({ ...prev, status: value }))}>
                            <SelectTrigger className="w-full bg-gray-700 border-gray-600 text-white">
                              <SelectValue placeholder="Select action" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-700 border-gray-600">
                              <SelectItem value="approved">Approve</SelectItem>
                              <SelectItem value="rejected">Reject</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {reviewForm.status === 'approved' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Approved Amount</label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={reviewForm.approved_amount}
                              onChange={(e) => setReviewForm(prev => ({ ...prev, approved_amount: parseFloat(e.target.value) || 0 }))}
                              placeholder="0.00"
                              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                            />
                          </div>
                        )}
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Review Notes</label>
                          <Textarea
                            value={reviewForm.review_notes}
                            onChange={(e) => setReviewForm(prev => ({ ...prev, review_notes: e.target.value }))}
                            placeholder="Enter review notes..."
                            rows={4}
                            className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          />
                        </div>
                        
                        <div className="flex justify-end gap-4 pt-4">
                          <Button variant="outline" onClick={closeReviewModal}>
                            Cancel
                          </Button>
                          <Button 
                            onClick={() => {
                              if (reviewForm.status === 'approved') {
                                handleApprovePayout(selectedPayout.id, reviewForm.approved_amount, reviewForm.review_notes);
                              } else if (reviewForm.status === 'rejected') {
                                handleRejectPayout(selectedPayout.id, reviewForm.review_notes);
                              }
                            }}
                            disabled={!reviewForm.status || !reviewForm.review_notes.trim()}
                          >
                            {reviewForm.status === 'approved' ? 'Approve' : 'Reject'}
                          </Button>
                        </div>
                      </>
                    )}
                    
                    {selectedPayout.status === 'approved' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Transaction Hash</label>
                          <Input
                            value={reviewForm.review_notes}
                            onChange={(e) => setReviewForm(prev => ({ ...prev, review_notes: e.target.value }))}
                            placeholder="0x..."
                            className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          />
                        </div>
                        
                        <div className="flex justify-end gap-4 pt-4">
                          <Button variant="outline" onClick={closeReviewModal}>
                            Cancel
                          </Button>
                          <Button 
                            onClick={() => handleMarkPaid(selectedPayout.id, reviewForm.review_notes)}
                            disabled={!reviewForm.review_notes.trim()}
                          >
                            Mark as Paid
                          </Button>
                        </div>
                      </>
                    )}
                    
                    {selectedPayout.status === 'rejected' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Rejection Reason</label>
                        <p className="text-red-400 bg-gray-700 p-3 rounded">
                          {selectedPayout.review_notes}
                        </p>
                      </div>
                    )}
                    
                    {selectedPayout.status === 'paid' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Payment Details</label>
                        <div className="space-y-2">
                          <p className="text-white">Paid Amount: <span className="font-bold text-green-400">${selectedPayout.approved_amount?.toFixed(2) || selectedPayout.amount.toFixed(2)}</span></p>
                          <p className="text-white">Paid Date: <span className="text-green-400">{selectedPayout.paid_at ? new Date(selectedPayout.paid_at).toLocaleString() : 'N/A'}</span></p>
                          {selectedPayout.transaction_hash && (
                            <p className="text-white">Transaction: <span className="font-mono text-xs text-gray-400">{selectedPayout.transaction_hash}</span></p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminPayouts;
