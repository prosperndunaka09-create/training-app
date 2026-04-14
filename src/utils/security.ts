// Security utilities for application hardening

export interface AdminLog {
  action: string;
  email?: string;
  timestamp: string;
  details?: any;
}

export interface SecureSession {
  user: any;
  isAdmin: boolean;
  loginTime: number;
  lastActivity: number;
}

// In-memory session storage (not persistent)
let currentSession: SecureSession | null = null;
let adminLogs: AdminLog[] = [];

// Session timeout (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000;

export class SecurityManager {
  // Initialize secure session
  static createSession(user: any, isAdmin: boolean = false): void {
    currentSession = {
      user,
      isAdmin,
      loginTime: Date.now(),
      lastActivity: Date.now()
    };
    
    this.logAction('SESSION_CREATED', user.email, { isAdmin });
  }

  // Get current session
  static getSession(): SecureSession | null {
    if (currentSession) {
      // Check session timeout
      if (Date.now() - currentSession.lastActivity > SESSION_TIMEOUT) {
        this.destroySession();
        return null;
      }
      currentSession.lastActivity = Date.now();
    }
    return currentSession;
  }

  // Destroy session
  static destroySession(): void {
    if (currentSession) {
      this.logAction('SESSION_DESTROYED', currentSession.user.email);
      currentSession = null;
    }
  }

  // Check if user is admin
  static isAdmin(): boolean {
    const session = this.getSession();
    return session?.isAdmin || false;
  }

  // Get current user
  static getCurrentUser(): any {
    const session = this.getSession();
    return session?.user || null;
  }

  // Validate user data integrity
  static validateUserData(userData: any): boolean {
    if (!userData || typeof userData !== 'object') return false;
    
    // Check required fields
    const requiredFields = ['id', 'email', 'balance', 'total_earned'];
    for (const field of requiredFields) {
      if (!(field in userData)) return false;
    }
    
    // Validate data types
    if (typeof userData.balance !== 'number' || userData.balance < 0) return false;
    if (typeof userData.total_earned !== 'number' || userData.total_earned < 0) return false;
    if (typeof userData.email !== 'string' || !userData.email.includes('@')) return false;
    
    return true;
  }

  // Validate task data
  static validateTask(task: any): boolean {
    if (!task || typeof task !== 'object') return false;
    
    const requiredFields = ['id', 'task_number', 'status', 'reward'];
    for (const field of requiredFields) {
      if (!(field in task)) return false;
    }
    
    // Validate data types
    if (typeof task.task_number !== 'number' || task.task_number < 1) return false;
    if (typeof task.reward !== 'number' || task.reward < 0) return false;
    if (!['pending', 'locked', 'completed'].includes(task.status)) return false;
    
    return true;
  }

  // Recalculate balance from tasks (prevents manipulation)
  static recalculateBalance(tasks: any[]): number {
    if (!Array.isArray(tasks)) return 0;
    
    return tasks.reduce((sum, task) => {
      if (this.validateTask(task) && task.status === 'completed') {
        return sum + (task.reward || 0);
      }
      return sum;
    }, 0);
  }

  // Validate training completion
  static validateTrainingCompletion(tasks: any[]): boolean {
    if (!Array.isArray(tasks)) return false;
    
    const completedTasks = tasks.filter(task => 
      this.validateTask(task) && task.status === 'completed'
    ).length;
    
    return completedTasks === 90; // 45 tasks per phase × 2 phases
  }

  // Log admin action
  static logAction(action: string, email?: string, details?: any): void {
    const log: AdminLog = {
      action,
      email,
      timestamp: new Date().toISOString(),
      details
    };
    
    adminLogs.push(log);
    
    // Keep only last 100 logs
    if (adminLogs.length > 100) {
      adminLogs = adminLogs.slice(-100);
    }
    
    console.log('ADMIN ACTION:', log);
  }

  // Get admin logs
  static getAdminLogs(): AdminLog[] {
    return [...adminLogs];
  }

  // Detect suspicious activity
  static detectSuspiciousActivity(userData: any): boolean {
    // Check for impossible balances
    if (userData.balance > 100000 || userData.total_earned > 100000) {
      return true;
    }
    
    // Check for negative balances (except pending orders)
    if (userData.balance < 0 && !userData.has_pending_order) {
      return true;
    }
    
    // Check for impossible task completion
    if (userData.tasks_completed > 90) {
      return true;
    }
    
    return false;
  }

  // Safely reset compromised account
  static resetCompromisedAccount(email: string): void {
    this.logAction('ACCOUNT_RESET_COMPROMISED', email);
    
    // Remove suspicious data
    const keysToRemove = [
      `training_account_${email}`,
      `training_tasks_${email}`,
      `opt_training_${email}`,
      `opt_tasks_${email}`,
      `opt_user`
    ];
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  // Validate localStorage data
  static validateLocalStorage(): boolean {
    try {
      // Check user data
      const userData = localStorage.getItem('opt_user');
      if (userData) {
        const parsed = JSON.parse(userData);
        if (!this.validateUserData(parsed)) {
          return false;
        }
      }
      
      // Check for suspicious activity
      if (userData && this.detectSuspiciousActivity(JSON.parse(userData))) {
        this.resetCompromisedAccount(JSON.parse(userData).email);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('LocalStorage validation failed:', error);
      return false;
    }
  }

  // Prevent double-click protection
  static createButtonProtection() {
    let isProcessing = false;
    
    return {
      isProcessing: () => isProcessing,
      setProcessing: (state: boolean) => {
        isProcessing = state;
      },
      executeWithProtection: async (callback: () => Promise<any>) => {
        if (isProcessing) return null;
        
        isProcessing = true;
        try {
          return await callback();
        } finally {
          isProcessing = false;
        }
      }
    };
  }
}

// Route protection utility
export const requireAdmin = (navigate: (to: string) => void) => {
  if (!SecurityManager.isAdmin()) {
    navigate('/');
    return false;
  }
  return true;
};

// Data validation hooks
export const useSecureData = () => {
  const validateAndLoadData = (key: string, validator: (data: any) => boolean) => {
    try {
      const data = localStorage.getItem(key);
      if (!data) return null;
      
      const parsed = JSON.parse(data);
      if (!validator(parsed)) {
        console.warn(`Invalid data detected for key: ${key}`);
        localStorage.removeItem(key);
        return null;
      }
      
      return parsed;
    } catch (error) {
      console.error(`Error loading data for key ${key}:`, error);
      localStorage.removeItem(key);
      return null;
    }
  };
  
  return { validateAndLoadData };
};
