import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Edit, 
  Archive, 
  Eye, 
  Trash2, 
  Calendar,
  DollarSign,
  FileText,
  Clock,
  CheckCircle,
  Pause,
  Play
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  reward_value: number;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  due_date?: string;
  eligibility_rules: any;
  proof_required: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

const AdminTasks: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    reward_value: 0,
    due_date: '',
    eligibility_rules: '',
    proof_required: true
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    let filtered = tasks;
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredTasks(filtered);
  }, [searchTerm, statusFilter, tasks]);

  const fetchTasks = async () => {
    try {
      // Mock data - replace with real API call
      const mockTasks: Task[] = [
        {
          id: '1',
          title: 'Complete Profile Setup',
          description: 'Users need to complete their profile setup including avatar, bio, and verification',
          reward_value: 5.00,
          status: 'active',
          due_date: '2025-04-15T23:59:59Z',
          eligibility_rules: {
            min_vip_level: 1,
            account_types: ['personal', 'training'],
            max_completions: 1
          },
          proof_required: true,
          created_by: 'admin@optimize.com',
          created_at: '2025-03-26T10:00:00Z',
          updated_at: '2025-03-26T10:00:00Z'
        },
        {
          id: '2',
          title: 'Social Media Sharing',
          description: 'Share platform on social media and submit proof of sharing',
          reward_value: 10.00,
          status: 'active',
          due_date: '2025-04-20T23:59:59Z',
          eligibility_rules: {
            min_vip_level: 1,
            account_types: ['personal'],
            max_completions: 1
          },
          proof_required: true,
          created_by: 'admin@optimize.com',
          created_at: '2025-03-26T09:00:00Z',
          updated_at: '2025-03-26T09:00:00Z'
        },
        {
          id: '3',
          title: 'Refer New User',
          description: 'Refer a new user to the platform and ensure they complete registration',
          reward_value: 25.00,
          status: 'paused',
          due_date: '2025-04-25T23:59:59Z',
          eligibility_rules: {
            min_vip_level: 2,
            account_types: ['personal'],
            max_completions: 5,
            min_referral_vip: 1
          },
          proof_required: true,
          created_by: 'admin@optimize.com',
          created_at: '2025-03-25T15:00:00Z',
          updated_at: '2025-03-25T15:00:00Z'
        },
        {
          id: '4',
          title: 'Daily Login Bonus',
          description: 'Login to the platform for 7 consecutive days',
          reward_value: 15.00,
          status: 'completed',
          due_date: '2025-03-31T23:59:59Z',
          eligibility_rules: {
            min_vip_level: 1,
            account_types: ['personal', 'training'],
            max_completions: 1,
            consecutive_days: 7
          },
          proof_required: false,
          created_by: 'admin@optimize.com',
          created_at: '2025-03-20T08:00:00Z',
          updated_at: '2025-03-26T12:00:00Z'
        }
      ];
      setTasks(mockTasks);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    try {
      const newTask: Task = {
        id: Date.now().toString(),
        title: taskForm.title,
        description: taskForm.description,
        reward_value: taskForm.reward_value,
        status: 'draft',
        due_date: taskForm.due_date,
        eligibility_rules: JSON.parse(taskForm.eligibility_rules || '{}'),
        proof_required: taskForm.proof_required,
        created_by: 'admin@optimize.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // API call to create task
      await logAdminAction('TASK_CREATE', 'admin@optimize.com', { task: newTask });
      
      setTasks([...tasks, newTask]);
      setShowCreateForm(false);
      resetTaskForm();
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleEditTask = async (task: Task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description,
      reward_value: task.reward_value,
      due_date: task.due_date || '',
      eligibility_rules: JSON.stringify(task.eligibility_rules || {}),
      proof_required: task.proof_required
    });
    setShowCreateForm(true);
  };

  const handleUpdateTask = async () => {
    try {
      if (!editingTask) return;

      const updatedTask: Task = {
        ...editingTask,
        title: taskForm.title,
        description: taskForm.description,
        reward_value: taskForm.reward_value,
        due_date: taskForm.due_date,
        eligibility_rules: JSON.parse(taskForm.eligibility_rules || '{}'),
        proof_required: taskForm.proof_required,
        updated_at: new Date().toISOString()
      };

      // API call to update task
      await logAdminAction('TASK_UPDATE', 'admin@optimize.com', { task: updatedTask });
      
      setTasks(tasks.map(t => t.id === editingTask.id ? updatedTask : t));
      setShowCreateForm(false);
      setEditingTask(null);
      resetTaskForm();
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleArchiveTask = async (taskId: string) => {
    try {
      // API call to archive task
      await logAdminAction('TASK_ARCHIVE', 'admin@optimize.com', { taskId });
      
      setTasks(tasks.map(t => 
        t.id === taskId ? { ...t, status: 'archived' as const } : t
      ));
    } catch (error) {
      console.error('Failed to archive task:', error);
    }
  };

  const handleSetTaskStatus = async (taskId: string, status: Task['status']) => {
    try {
      // API call to update task status
      await logAdminAction('TASK_STATUS_CHANGE', 'admin@optimize.com', { taskId, status });
      
      setTasks(tasks.map(t => 
        t.id === taskId ? { ...t, status, updated_at: new Date().toISOString() } : t
      ));
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const resetTaskForm = () => {
    setTaskForm({
      title: '',
      description: '',
      reward_value: 0,
      due_date: '',
      eligibility_rules: '',
      proof_required: true
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
      draft: { variant: 'secondary', text: 'Draft' },
      active: { variant: 'default', text: 'Active' },
      paused: { variant: 'outline', text: 'Paused' },
      completed: { variant: 'default', text: 'Completed' },
      archived: { variant: 'outline', text: 'Archived' }
    };
    return variants[status] || { variant: 'outline', text: status };
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, React.ReactNode> = {
      draft: <FileText size={14} />,
      active: <Play size={14} />,
      paused: <Pause size={14} />,
      completed: <CheckCircle size={14} />,
      archived: <Archive size={14} />
    };
    return icons[status] || <FileText size={14} />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Task Management</h1>
            <p className="text-gray-400">Create and manage platform tasks</p>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
              <Plus size={16} />
              Create Task
            </Button>
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
              <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search tasks..."
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
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-gray-400">
              {filteredTasks.length} of {tasks.length} tasks
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Table */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-4 font-medium text-gray-300">Task</th>
                  <th className="text-left p-4 font-medium text-gray-300">Reward</th>
                  <th className="text-left p-4 font-medium text-gray-300">Status</th>
                  <th className="text-left p-4 font-medium text-gray-300">Due Date</th>
                  <th className="text-left p-4 font-medium text-gray-300">Created</th>
                  <th className="text-left p-4 font-medium text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="border-b border-gray-700 hover:bg-gray-750 transition-colors">
                    <td className="p-4">
                      <div>
                        <div className="font-medium text-white">{task.title}</div>
                        <div className="text-sm text-gray-400 line-clamp-2">{task.description}</div>
                        {task.proof_required && (
                          <Badge variant="outline" className="mt-2">
                            Proof Required
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-400" />
                        <span className="font-mono text-white">${task.reward_value.toFixed(2)}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(task.status)}
                        <Badge variant={getStatusBadge(task.status).variant as any}>
                          {getStatusBadge(task.status).text}
                        </Badge>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-gray-400">
                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-gray-400">
                        {new Date(task.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        by {task.created_by}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditTask(task)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit size={14} />
                        </Button>
                        
                        {task.status === 'active' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSetTaskStatus(task.id, 'paused')}
                            className="h-8 w-8 p-0 text-orange-400 hover:text-orange-300"
                          >
                            <Pause size={14} />
                          </Button>
                        )}
                        
                        {task.status === 'paused' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSetTaskStatus(task.id, 'active')}
                            className="h-8 w-8 p-0 text-green-400 hover:text-green-300"
                          >
                            <Play size={14} />
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleArchiveTask(task.id)}
                          className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                        >
                          <Archive size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Task Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="bg-gray-800 border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-white">
                  {editingTask ? 'Edit Task' : 'Create New Task'}
                </CardTitle>
                <Button variant="outline" onClick={() => {
                  setShowCreateForm(false);
                  setEditingTask(null);
                  resetTaskForm();
                }}>
                  <Trash2 size={16} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Task Title</label>
                  <Input
                    value={taskForm.title}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter task title"
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Reward Value ($)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={taskForm.reward_value}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, reward_value: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <Textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter task description"
                  rows={4}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Due Date</label>
                  <Input
                    type="datetime-local"
                    value={taskForm.due_date}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, due_date: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Proof Required</label>
                  <Select value={taskForm.proof_required.toString()} onValueChange={(value) => setTaskForm(prev => ({ ...prev, proof_required: value === 'true' }))}>
                    <SelectTrigger className="w-full bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Eligibility Rules (JSON)</label>
                <Textarea
                  value={taskForm.eligibility_rules}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, eligibility_rules: e.target.value }))}
                  placeholder='{"min_vip_level": 1, "account_types": ["personal", "training"]}'
                  rows={3}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 font-mono text-sm"
                />
              </div>
              
              <div className="flex justify-end gap-4 pt-4">
                <Button variant="outline" onClick={() => {
                  setShowCreateForm(false);
                  setEditingTask(null);
                  resetTaskForm();
                }}>
                  Cancel
                </Button>
                <Button onClick={editingTask ? handleUpdateTask : handleCreateTask}>
                  {editingTask ? 'Update Task' : 'Create Task'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminTasks;
