import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  DollarSign, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Settings,
  FileText,
  Eye,
  Shield,
  LogOut,
  Activity
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  pendingPayouts: number;
  completedTasksToday: number;
  flaggedAccounts: number;
  recentActivity: Array<{
    id: string;
    action: string;
    actor: string;
    timestamp: string;
  }>;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    pendingPayouts: 0,
    completedTasksToday: 0,
    flaggedAccounts: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const mockStats: DashboardStats = {
        totalUsers: 1247,
        activeUsers: 892,
        pendingPayouts: 23,
        completedTasksToday: 1456,
        flaggedAccounts: 8,
        recentActivity: [
          { id: '1', action: 'User Registration', actor: 'System', timestamp: '2025-03-26T18:30:00Z' },
          { id: '2', action: 'Payout Request', actor: 'john@example.com', timestamp: '2025-03-26T18:25:00Z' },
          { id: '3', action: 'Task Approved', actor: 'admin@optimize.com', timestamp: '2025-03-26T18:20:00Z' },
          { id: '4', action: 'Account Flagged', actor: 'System', timestamp: '2025-03-26T18:15:00Z' },
          { id: '5', action: 'Admin Login', actor: 'admin@optimize.com', timestamp: '2025-03-26T18:10:00Z' }
        ]
      };
      setStats(mockStats);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMaintenanceMode = async () => {
    try {
      setMaintenanceMode(!maintenanceMode);
      await logAdminAction('MAINTENANCE_TOGGLE', 'admin@optimize.com', { newStatus: !maintenanceMode });
    } catch (error) {
      console.error('Failed to toggle maintenance mode:', error);
    }
  };

  const logAdminAction = async (action: string, actor: string, details: any) => {
    try {
      console.log('Logging admin action:', { action, actor, details });
    } catch (error) {
      console.error('Failed to log admin action:', error);
    }
  };

  const quickActions = [
    {
      title: 'View Users',
      description: 'Manage user accounts and permissions',
      icon: Users,
      color: 'bg-blue-500',
      onClick: () => navigate('/admin/users')
    },
    {
      title: 'Review Payouts',
      description: 'Process withdrawal requests',
      icon: DollarSign,
      color: 'bg-green-500',
      onClick: () => navigate('/admin/payouts')
    },
    {
      title: 'View Tasks',
      description: 'Create and manage tasks',
      icon: FileText,
      color: 'bg-purple-500',
      onClick: () => navigate('/admin/tasks')
    },
    {
      title: 'Open Audit Logs',
      description: 'View system activity logs',
      icon: Activity,
      color: 'bg-orange-500',
      onClick: () => navigate('/admin/audit')
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-gray-400">Platform Management & Analytics</p>
          </div>
          <div className="flex items-center gap-4">
            {maintenanceMode && (
              <Badge variant="destructive" className="flex items-center gap-2">
                <AlertTriangle size={14} />
                Maintenance Mode
              </Badge>
            )}
            <Button
              variant={maintenanceMode ? "destructive" : "outline"}
              onClick={toggleMaintenanceMode}
              className="flex items-center gap-2"
            >
              <Settings size={16} />
              {maintenanceMode ? 'Disable Maintenance' : 'Enable Maintenance'}
            </Button>
            <Button variant="outline" onClick={() => navigate('/admin/settings')}>
              <Settings size={16} />
            </Button>
            <Button variant="outline" onClick={() => navigate('/admin/logout')}>
              <LogOut size={16} />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total Users</p>
                <p className="text-2xl font-bold text-white">{stats.totalUsers.toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Active Users</p>
                <p className="text-2xl font-bold text-green-400">{stats.activeUsers.toLocaleString()}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Pending Payouts</p>
                <p className="text-2xl font-bold text-yellow-400">{stats.pendingPayouts}</p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Tasks Completed Today</p>
                <p className="text-2xl font-bold text-purple-400">{stats.completedTasksToday.toLocaleString()}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Flagged Accounts</p>
                <p className="text-2xl font-bold text-red-400">{stats.flaggedAccounts}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">System Status</p>
                <p className="text-lg font-bold text-green-400">Operational</p>
              </div>
              <Shield className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Card key={index} className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors cursor-pointer" onClick={action.onClick}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${action.color}`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{action.title}</h3>
                    <p className="text-sm text-gray-400">{action.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Clock size={18} />
            Recent Admin Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Activity className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-white">{activity.action}</p>
                    <p className="text-xs text-gray-400">by {activity.actor}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-700">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/admin/audit')}
            >
              <Eye size={16} className="mr-2" />
              View All Activity Logs
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
