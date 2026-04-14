import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { toast } from 'sonner';
import { SecurityManager } from '../utils/security';
import { TaskSecurityManager, SecureTask } from '../utils/taskSecurity';
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface SecureTaskSubmissionProps {
  task: SecureTask | null;
  currentBalance: number;
  onTaskComplete: (completedTask: SecureTask, newBalance: number) => void;
  onUnlockNext: (taskNumber: number) => void;
}

const SecureTaskSubmission: React.FC<SecureTaskSubmissionProps> = ({
  task,
  currentBalance,
  onTaskComplete,
  onUnlockNext
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Button protection
  const buttonProtection = SecurityManager.createButtonProtection();

  // Secure task submission
  const handleTaskSubmission = async () => {
    if (!task) {
      setSubmissionError('No task available for submission');
      return;
    }

    setSubmissionError(null);

    const result = await buttonProtection.executeWithProtection(async () => {
      try {
        // Validate task submission
        const validation = TaskSecurityManager.validateTaskSubmission(task, currentBalance);
        
        if (!validation.isValid) {
          throw new Error(validation.error);
        }

        // Complete the task securely
        const completion = TaskSecurityManager.completeTask(task, currentBalance);
        
        if (!completion.isValid) {
          throw new Error(completion.error);
        }

        // Log the successful submission
        SecurityManager.logAction('TASK_SUBMITTED_SUCCESS', task.user_id, {
          taskNumber: task.task_number,
          reward: task.reward,
          newBalance: completion.newBalance
        });

        return completion;
      } catch (error) {
        // Log the failed submission
        SecurityManager.logAction('TASK_SUBMISSION_FAILED', task?.user_id, {
          taskNumber: task?.task_number,
          error: String(error)
        });
        throw error;
      }
    });

    if (result) {
      // Update parent components
      onTaskComplete(result.completedTask, result.newBalance);
      
      // Unlock next task
      onUnlockNext(task.task_number);
      
      // Show success message
      toast.success(`Task ${task.task_number} completed! Earned $${task.reward.toFixed(2)}`);
    }
  };

  // Check if task can be submitted
  const canSubmit = task && 
    task.status === 'pending' && 
    !isSubmitting && 
    !buttonProtection.isProcessing();

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardContent className="p-6">
        {task ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold">Task {task.task_number}</h3>
                <p className="text-slate-400 text-sm">{task.title}</p>
              </div>
              <div className="text-right">
                <div className="text-green-400 font-semibold">
                  ${task.reward.toFixed(2)}
                </div>
                <div className="text-slate-400 text-xs">Reward</div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className={`px-2 py-1 rounded text-xs font-medium ${
                task.status === 'completed' 
                  ? 'bg-green-500/20 text-green-400'
                  : task.status === 'pending'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-slate-600/20 text-slate-400'
              }`}>
                {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
              </div>
              
              {task.status === 'completed' && (
                <CheckCircle className="w-4 h-4 text-green-400" />
              )}
              
              {task.status === 'locked' && (
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
              )}
            </div>

            {submissionError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-red-400 text-sm">{submissionError}</span>
                </div>
              </div>
            )}

            <Button
              onClick={handleTaskSubmission}
              disabled={!canSubmit}
              className={`w-full ${
                task.status === 'completed'
                  ? 'bg-green-600 hover:bg-green-700'
                  : task.status === 'pending'
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-slate-600 cursor-not-allowed'
              }`}
            >
              {task.status === 'completed' ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Completed
                </>
              ) : task.status === 'pending' ? (
                isSubmitting || buttonProtection.isProcessing() ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Submit Task
                  </>
                )
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Locked
                </>
              )}
            </Button>

            {task.status === 'locked' && (
              <p className="text-slate-400 text-xs text-center">
                Complete previous tasks to unlock this task
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <AlertTriangle className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <p className="text-slate-400">No tasks available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SecureTaskSubmission;
