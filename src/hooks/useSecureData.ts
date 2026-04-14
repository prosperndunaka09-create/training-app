import { useState, useEffect, useCallback } from 'react';
import { SecurityManager } from '../utils/security';
import { TaskSecurityManager, SecureTask } from '../utils/taskSecurity';
import { toast } from 'sonner';

interface UseSecureDataOptions {
  validateOnLoad?: boolean;
  autoFix?: boolean;
  logSuspicious?: boolean;
}

export const useSecureData = (options: UseSecureDataOptions = {}) => {
  const {
    validateOnLoad = true,
    autoFix = true,
    logSuspicious = true
  } = options;

  const [isValid, setIsValid] = useState(true);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSuspicious, setIsSuspicious] = useState(false);

  // Validate user data
  const validateUserData = useCallback((userData: any): boolean => {
    if (!userData) {
      setValidationErrors(['No user data provided']);
      return false;
    }

    const errors: string[] = [];

    // Check required fields
    const requiredFields = ['id', 'email', 'balance', 'total_earned'];
    for (const field of requiredFields) {
      if (!(field in userData)) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate data types
    if (typeof userData.balance !== 'number' || userData.balance < 0) {
      errors.push('Invalid balance value');
    }

    if (typeof userData.total_earned !== 'number' || userData.total_earned < 0) {
      errors.push('Invalid total_earned value');
    }

    if (typeof userData.email !== 'string' || !userData.email.includes('@')) {
      errors.push('Invalid email format');
    }

    // Check for suspicious values
    if (userData.balance > 100000) {
      errors.push('Suspicious balance amount');
      setIsSuspicious(true);
    }

    if (userData.total_earned > 100000) {
      errors.push('Suspicious total earned amount');
      setIsSuspicious(true);
    }

    if (userData.tasks_completed > 90) {
      errors.push('Impossible task completion count');
      setIsSuspicious(true);
    }

    setValidationErrors(errors);
    setIsValid(errors.length === 0);

    if (errors.length > 0 && logSuspicious) {
      SecurityManager.logAction('USER_DATA_VALIDATION_FAILED', userData.email, {
        errors,
        userData
      });
    }

    return errors.length === 0;
  }, [logSuspicious]);

  // Validate task data
  const validateTaskData = useCallback((tasks: any[]): SecureTask[] => {
    if (!Array.isArray(tasks)) {
      setValidationErrors(['Tasks data is not an array']);
      setIsValid(false);
      return [];
    }

    const validTasks: SecureTask[] = [];
    const errors: string[] = [];

    tasks.forEach((task, index) => {
      if (!SecurityManager.validateTask(task)) {
        errors.push(`Invalid task at index ${index}`);
        return;
      }

      validTasks.push(task as SecureTask);
    });

    // Check for suspicious patterns
    const suspicious = TaskSecurityManager.detectSuspiciousPatterns(validTasks);
    if (suspicious.isSuspicious) {
      setIsSuspicious(true);
      errors.push(...suspicious.reasons);
      
      if (logSuspicious) {
        SecurityManager.logAction('SUSPICIOUS_TASK_PATTERN', undefined, {
          reasons: suspicious.reasons,
          taskCount: validTasks.length
        });
      }
    }

    setValidationErrors(errors);
    setIsValid(errors.length === 0);

    return validTasks;
  }, [logSuspicious]);

  // Securely load data from localStorage
  const secureLoadData = useCallback((key: string, validator?: (data: any) => boolean): any => {
    try {
      const data = localStorage.getItem(key);
      if (!data) return null;

      const parsed = JSON.parse(data);

      // Run custom validator if provided
      if (validator && !validator(parsed)) {
        console.warn(`Validation failed for key: ${key}`);
        if (autoFix) {
          localStorage.removeItem(key);
        }
        return null;
      }

      return parsed;
    } catch (error) {
      console.error(`Error loading data for key ${key}:`, error);
      SecurityManager.logAction('DATA_LOAD_ERROR', undefined, { 
        key, 
        error: String(error) 
      });
      
      if (autoFix) {
        localStorage.removeItem(key);
      }
      return null;
    }
  }, [autoFix]);

  // Securely save data to localStorage
  const secureSaveData = useCallback((key: string, data: any, validator?: (data: any) => boolean): boolean => {
    try {
      // Run custom validator if provided
      if (validator && !validator(data)) {
        console.warn(`Validation failed, not saving data for key: ${key}`);
        return false;
      }

      localStorage.setItem(key, JSON.stringify(data));
      
      SecurityManager.logAction('DATA_SAVED', undefined, { key });
      return true;
    } catch (error) {
      console.error(`Error saving data for key ${key}:`, error);
      SecurityManager.logAction('DATA_SAVE_ERROR', undefined, { 
        key, 
        error: String(error) 
      });
      return false;
    }
  }, []);

  // Recalculate balance from tasks
  const recalculateBalance = useCallback((tasks: SecureTask[]): number => {
    return TaskSecurityManager.recalculateBalance(tasks);
  }, []);

  // Validate localStorage integrity
  const validateLocalStorageIntegrity = useCallback((): boolean => {
    try {
      // Check user data
      const userData = localStorage.getItem('opt_user');
      if (userData) {
        const parsed = JSON.parse(userData);
        if (!validateUserData(parsed)) {
          return false;
        }
      }

      // Check for suspicious activity
      if (userData && SecurityManager.detectSuspiciousActivity(JSON.parse(userData))) {
        if (logSuspicious) {
          SecurityManager.logAction('SUSPICIOUS_ACTIVITY_DETECTED', JSON.parse(userData).email);
        }
        return false;
      }

      return true;
    } catch (error) {
      console.error('LocalStorage validation failed:', error);
      return false;
    }
  }, [validateUserData, logSuspicious]);

  // Auto-fix compromised data
  const fixCompromisedData = useCallback((email?: string): void => {
    if (email) {
      SecurityManager.resetCompromisedAccount(email);
      toast.warning('Account data has been reset due to suspicious activity');
    } else {
      // Clear all suspicious data
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('training_') || key.startsWith('opt_'))) {
          const data = localStorage.getItem(key);
          if (data) {
            try {
              const parsed = JSON.parse(data);
              if (!SecurityManager.validateUserData(parsed)) {
                keysToRemove.push(key);
              }
            } catch (e) {
              keysToRemove.push(key);
            }
          }
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      if (keysToRemove.length > 0) {
        toast.warning(`${keysToRemove.length} suspicious data entries have been removed`);
      }
    }
  }, []);

  // Validate on mount
  useEffect(() => {
    if (validateOnLoad) {
      validateLocalStorageIntegrity();
    }
  }, [validateOnLoad, validateLocalStorageIntegrity]);

  return {
    isValid,
    validationErrors,
    isSuspicious,
    validateUserData,
    validateTaskData,
    secureLoadData,
    secureSaveData,
    recalculateBalance,
    validateLocalStorageIntegrity,
    fixCompromisedData
  };
};

export default useSecureData;
