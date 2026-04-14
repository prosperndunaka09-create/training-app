import { SecurityManager } from '../utils/security';

export interface SecureTask {
  id: string;
  user_id: string;
  task_number: number;
  title: string;
  description: string;
  status: 'pending' | 'locked' | 'completed';
  reward: number;
  created_at: string;
  completed_at?: string;
  task_set: number;
}

export class TaskSecurityManager {
  // Validate task submission
  static validateTaskSubmission(task: SecureTask, currentBalance: number): {
    isValid: boolean;
    error?: string;
    newBalance?: number;
  } {
    // Validate task structure
    if (!SecurityManager.validateTask(task)) {
      return { isValid: false, error: 'Invalid task structure' };
    }

    // Check if already completed
    if (task.status === 'completed') {
      return { isValid: false, error: 'Task already completed' };
    }

    // Check if task is pending (can be submitted)
    if (task.status !== 'pending') {
      return { isValid: false, error: 'Task is not ready for submission' };
    }

    // Validate reward amount
    if (task.reward < 0 || task.reward > 100) {
      return { isValid: false, error: 'Invalid reward amount' };
    }

    // Calculate new balance
    const newBalance = currentBalance + task.reward;

    // Check for suspicious balance
    if (newBalance > 50000) {
      SecurityManager.logAction('SUSPICIOUS_BALANCE_DETECTED', task.user_id, { 
        currentBalance, 
        reward: task.reward, 
        newBalance 
      });
      return { isValid: false, error: 'Suspicious activity detected' };
    }

    return { isValid: true, newBalance };
  }

  // Secure task completion
  static completeTask(task: SecureTask, currentBalance: number): {
    completedTask: SecureTask;
    newBalance: number;
    isValid: boolean;
    error?: string;
  } {
    const validation = this.validateTaskSubmission(task, currentBalance);
    
    if (!validation.isValid) {
      return {
        completedTask: task,
        newBalance: currentBalance,
        isValid: false,
        error: validation.error
      };
    }

    // Create completed task
    const completedTask: SecureTask = {
      ...task,
      status: 'completed',
      completed_at: new Date().toISOString()
    };

    // Log the action
    SecurityManager.logAction('TASK_COMPLETED', task.user_id, {
      taskNumber: task.task_number,
      reward: task.reward,
      newBalance: validation.newBalance
    });

    return {
      completedTask,
      newBalance: validation.newBalance!,
      isValid: true
    };
  }

  // Recalculate balance from completed tasks
  static recalculateBalance(tasks: SecureTask[]): number {
    return SecurityManager.recalculateBalance(tasks);
  }

  // Validate training completion
  static validateTrainingCompletion(tasks: SecureTask[]): {
    isComplete: boolean;
    completedTasks: number;
    totalPhases: number;
  } {
    const completedTasks = tasks.filter(task => 
      task.status === 'completed'
    ).length;

    const totalPhases = Math.ceil(completedTasks / 45);
    const isComplete = SecurityManager.validateTrainingCompletion(tasks);

    return {
      isComplete,
      completedTasks,
      totalPhases
    };
  }

  // Get next available task
  static getNextAvailableTask(tasks: SecureTask[]): SecureTask | null {
    // Find first pending task
    const pendingTask = tasks.find(task => task.status === 'pending');
    
    if (!pendingTask) return null;

    // Validate the task
    if (!SecurityManager.validateTask(pendingTask)) {
      return null;
    }

    return pendingTask;
  }

  // Unlock next task after completion
  static unlockNextTask(completedTaskNumber: number, tasks: SecureTask[]): SecureTask[] {
    const updatedTasks = [...tasks];
    
    // Find the next task
    const nextTask = updatedTasks.find(task => 
      task.task_number === completedTaskNumber + 1 && 
      task.status === 'locked'
    );

    if (nextTask) {
      nextTask.status = 'pending';
      
      SecurityManager.logAction('TASK_UNLOCKED', nextTask.user_id, {
        taskNumber: nextTask.task_number
      });
    }

    return updatedTasks;
  }

  // Detect suspicious task patterns
  static detectSuspiciousPatterns(tasks: SecureTask[]): {
    isSuspicious: boolean;
    reasons: string[];
  } {
    const reasons: string[] = [];
    let isSuspicious = false;

    // Check for too many completed tasks too quickly
    const completedTasks = tasks.filter(task => task.status === 'completed');
    const recentCompletions = completedTasks.filter(task => {
      if (!task.completed_at) return false;
      const completionTime = new Date(task.completed_at).getTime();
      const now = Date.now();
      return (now - completionTime) < (5 * 60 * 1000); // Last 5 minutes
    });

    if (recentCompletions.length > 10) {
      reasons.push('Too many tasks completed in short time');
      isSuspicious = true;
    }

    // Check for invalid reward amounts
    const invalidRewards = tasks.filter(task => 
      task.reward < 0.5 || task.reward > 10
    );

    if (invalidRewards.length > 0) {
      reasons.push('Invalid reward amounts detected');
      isSuspicious = true;
    }

    // Check for duplicate task IDs
    const taskIds = tasks.map(task => task.id);
    const uniqueIds = new Set(taskIds);
    if (taskIds.length !== uniqueIds.size) {
      reasons.push('Duplicate task IDs detected');
      isSuspicious = true;
    }

    return { isSuspicious, reasons };
  }

  // Secure task loading from localStorage
  static loadTasksSecurely(userId: string): SecureTask[] | null {
    try {
      const tasksKey = `training_tasks_${userId}`;
      const tasksData = localStorage.getItem(tasksKey);
      
      if (!tasksData) return null;

      const tasks = JSON.parse(tasksData);

      // Validate array structure
      if (!Array.isArray(tasks)) {
        console.warn('Tasks data is not an array');
        localStorage.removeItem(tasksKey);
        return null;
      }

      // Validate each task
      const validTasks = tasks.filter(task => SecurityManager.validateTask(task));

      // If any tasks were invalid, log and save cleaned version
      if (validTasks.length !== tasks.length) {
        console.warn(`Removed ${tasks.length - validTasks.length} invalid tasks`);
        SecurityManager.logAction('INVALID_TASKS_CLEANED', userId, {
          originalCount: tasks.length,
          validCount: validTasks.length
        });
        localStorage.setItem(tasksKey, JSON.stringify(validTasks));
      }

      // Check for suspicious patterns
      const suspicious = this.detectSuspiciousPatterns(validTasks);
      if (suspicious.isSuspicious) {
        console.warn('Suspicious task patterns detected:', suspicious.reasons);
        SecurityManager.logAction('SUSPICIOUS_TASK_PATTERN', userId, {
          reasons: suspicious.reasons
        });
      }

      return validTasks;
    } catch (error) {
      console.error('Error loading tasks:', error);
      SecurityManager.logAction('TASK_LOAD_ERROR', userId, { error: String(error) });
      return null;
    }
  }

  // Secure task saving to localStorage
  static saveTasksSecurely(userId: string, tasks: SecureTask[]): boolean {
    try {
      // Validate tasks before saving
      const validTasks = tasks.filter(task => SecurityManager.validateTask(task));
      
      if (validTasks.length !== tasks.length) {
        console.warn('Attempted to save invalid tasks');
        return false;
      }

      // Check for suspicious patterns
      const suspicious = this.detectSuspiciousPatterns(validTasks);
      if (suspicious.isSuspicious) {
        console.warn('Suspicious task patterns detected, not saving');
        return false;
      }

      const tasksKey = `training_tasks_${userId}`;
      localStorage.setItem(tasksKey, JSON.stringify(validTasks));
      
      SecurityManager.logAction('TASKS_SAVED', userId, {
        taskCount: validTasks.length
      });

      return true;
    } catch (error) {
      console.error('Error saving tasks:', error);
      SecurityManager.logAction('TASK_SAVE_ERROR', userId, { error: String(error) });
      return false;
    }
  }

  // Generate secure task ID
  static generateSecureTaskId(userId: string, taskNumber: number): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `task-${userId}-${taskNumber}-${timestamp}-${random}`;
  }

  // Create secure training tasks
  static createSecureTrainingTasks(userId: string): SecureTask[] {
    const rewardPatterns = [0.7, 1.6, 2.5, 6.4, 7.2];
    
    return Array.from({ length: 45 }, (_, i) => {
      const patternIndex = i % rewardPatterns.length;
      const baseReward = rewardPatterns[patternIndex];
      
      // Add small variation to make it realistic (±0.2)
      const variation = (Math.random() - 0.5) * 0.4;
      const finalReward = Math.max(0.5, baseReward + variation);

      return {
        id: this.generateSecureTaskId(userId, i + 1),
        user_id: userId,
        task_number: i + 1,
        title: `Training Task ${i + 1}`,
        description: `Complete training task ${i + 1} for phase 1`,
        status: i === 0 ? 'pending' : 'locked',
        reward: Math.round(finalReward * 100) / 100,
        created_at: new Date().toISOString(),
        task_set: 0,
      };
    });
  }
}
