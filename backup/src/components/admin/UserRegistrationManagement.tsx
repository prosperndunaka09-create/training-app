import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { UserPlus, Mail, Phone, Hash, GraduationCap, Send, CheckCircle, Clock, AlertCircle, Lock } from 'lucide-react';

interface User {
  id: string;
  email: string;
  phone: string | null;
  display_name: string;
  vip_level: 1 | 2;
  account_type: 'personal' | 'training';
  user_status: 'registered' | 'waiting_training' | 'training_assigned' | 'credentials_sent' | 'training_completed';
  referral_code: string;
  referred_by: string | null;
  training_completed: boolean;
  created_at: string;
  training_account?: {
    email: string;
    password: string;
    referral_code: string;
    created_at: string;
  };
}

interface UserRegistrationManagementProps {
  onRefresh: () => void;
}

const UserRegistrationManagement: React.FC<UserRegistrationManagementProps> = ({ onRefresh }) => {
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      email: 'ADA@GMAIL.COM',
      phone: null,
      display_name: 'ADA',
      vip_level: 1,
      account_type: 'personal',
      user_status: 'waiting_training',
      referral_code: 'OPT-TYY1O6',
      referred_by: null,
      training_completed: false,
      created_at: '2026-03-26T18:08:02Z'
    }
  ]);
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'registered': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'waiting_training': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'training_assigned': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'credentials_sent': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'training_completed': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'registered': return <UserPlus size={14} />;
      case 'waiting_training': return <Clock size={14} />;
      case 'training_assigned': return <GraduationCap size={14} />;
      case 'credentials_sent': return <Send size={14} />;
      case 'training_completed': return <CheckCircle size={14} />;
      default: return <AlertCircle size={14} />;
    }
  };

  const createTrainingAccount = async (user: User) => {
    setIsCreating(true);
    try {
      // Generate training account credentials
      const trainingEmail = user.email.toLowerCase();
      const trainingPassword = Math.random().toString(36).substring(2, 8).toUpperCase();
      const trainingReferralCode = `TRN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Update user with training account
      const updatedUsers = users.map(u => 
        u.id === user.id 
          ? {
              ...u,
              user_status: 'training_assigned' as const,
              training_account: {
                email: trainingEmail,
                password: trainingPassword,
                referral_code: trainingReferralCode,
                created_at: new Date().toISOString()
              }
            }
          : u
      );
      setUsers(updatedUsers);
      
      toast('Training account created successfully');
    } catch (error) {
      console.error('Error creating training account:', error);
      toast('Failed to create training account');
    } finally {
      setIsCreating(false);
    }
  };

  const sendTrainingCredentials = async (user: User) => {
    if (!user.training_account) return;
    
    setIsSending(true);
    try {
      // Send Telegram notification
      const telegramMessage = `
🎓 <b>TRAINING ACCOUNT CREATED</b>

👤 <b>User Details:</b>
📧 <b>Email:</b> ${user.email}
👤 <b>Name:</b> ${user.display_name}
📞 <b>Phone:</b> ${user.phone || 'Not provided'}
👑 <b>VIP Level:</b> ${user.vip_level}
🏷️ <b>Account Type:</b> ${user.account_type}
📊 <b>Status:</b> ${user.user_status.replace('_', ' ').toUpperCase()}
🔗 <b>Referral Code:</b> ${user.referral_code}
📅 <b>Registered:</b> ${new Date(user.created_at).toLocaleString()}

🎓 <b>TRAINING ACCOUNT</b>

👤 <b>Account Details:</b>
📧 <b>Email:</b> ${user.training_account.email}
🔑 <b>Password:</b> ${user.training_account.password}
👤 <b>Assigned to:</b> ${user.display_name}
🏷️ <b>Account Type:</b> Training
💰 <b>Initial Balance:</b> $1100.00
🔗 <b>Referral Code:</b> ${user.training_account.referral_code}
📊 <b>Total Tasks:</b> 90 (45 per phase)
📅 <b>Registered:</b> ${new Date(user.training_account.created_at).toLocaleString()}

⚠️ <b>Action Required:</b>
• Create training account for this user
• Send training credentials via Telegram
• Monitor training progress

💾 <b>TRACKING ENABLED:</b>
• This training account is linked to referral code: ${user.training_account.referral_code}
• User progress will be tracked throughout training
• Admin can monitor completion status

🔗 <b>Contact User Support:</b> https://t.me/EARNINGSLLCONLINECS1
      `.trim();

      // Mock Telegram send
      console.log('Sending Telegram message:', telegramMessage);

      // Update user status
      const updatedUsers = users.map(u => 
        u.id === user.id 
          ? { ...u, user_status: 'credentials_sent' as const }
          : u
      );
      setUsers(updatedUsers);
      
      toast('Training credentials sent successfully');
    } catch (error) {
      console.error('Error sending credentials:', error);
      toast('Failed to send training credentials');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">User Registration Management</h2>
          <p className="text-slate-400">Track user registration and training account assignment</p>
        </div>
      </div>

      {/* Registration Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs">Registered</p>
                <p className="text-white text-lg font-bold">
                  {users.filter(u => u.user_status === 'registered').length}
                </p>
              </div>
              <UserPlus className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs">Waiting Training</p>
                <p className="text-white text-lg font-bold">
                  {users.filter(u => u.user_status === 'waiting_training').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs">Training Assigned</p>
                <p className="text-white text-lg font-bold">
                  {users.filter(u => u.user_status === 'training_assigned').length}
                </p>
              </div>
              <GraduationCap className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs">Credentials Sent</p>
                <p className="text-white text-lg font-bold">
                  {users.filter(u => u.user_status === 'credentials_sent').length}
                </p>
              </div>
              <Send className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs">Training Completed</p>
                <p className="text-white text-lg font-bold">
                  {users.filter(u => u.user_status === 'training_completed').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Registered Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-white font-semibold">{user.display_name}</h3>
                      <Badge className={getStatusColor(user.user_status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(user.user_status)}
                          {user.user_status.replace('_', ' ').toUpperCase()}
                        </div>
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Mail size={14} className="text-slate-400" />
                          <span className="text-slate-300">{user.email}</span>
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-2">
                            <Phone size={14} className="text-slate-400" />
                            <span className="text-slate-300">{user.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Hash size={14} className="text-slate-400" />
                          <span className="text-slate-300">{user.referral_code}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">VIP Level:</span>
                          <span className="text-slate-300">{user.vip_level}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">Account Type:</span>
                          <span className="text-slate-300">{user.account_type}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">Registered:</span>
                          <span className="text-slate-300">{new Date(user.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {user.training_account && (
                      <div className="mt-3 p-3 bg-slate-800/50 border border-slate-600 rounded-lg">
                        <h4 className="text-white text-sm font-semibold mb-2">Training Account Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-slate-400">Email:</span>
                            <span className="text-slate-300 ml-2">{user.training_account.email}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Password:</span>
                            <span className="text-slate-300 ml-2">{user.training_account.password}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Referral Code:</span>
                            <span className="text-slate-300 ml-2">{user.training_account.referral_code}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Created:</span>
                            <span className="text-slate-300 ml-2">{new Date(user.training_account.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2 ml-4">
                    {user.user_status === 'waiting_training' && (
                      <Button
                        onClick={() => createTrainingAccount(user)}
                        disabled={isCreating}
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {isCreating ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <GraduationCap className="w-4 h-4 mr-2" />
                            Create Training
                          </>
                        )}
                      </Button>
                    )}
                    
                    {user.user_status === 'training_assigned' && (
                      <Button
                        onClick={() => sendTrainingCredentials(user)}
                        disabled={isSending}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isSending ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Send Credentials
                          </>
                        )}
                      </Button>
                    )}
                    
                    {user.user_status === 'credentials_sent' && (
                      <div className="flex items-center gap-2 text-green-400">
                        <CheckCircle size={16} />
                        <span className="text-xs">Credentials Sent</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserRegistrationManagement;
