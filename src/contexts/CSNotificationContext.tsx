import React, { createContext, useContext, useState, useEffect } from 'react';

interface CSNotificationContextType {
  unreadCount: number;
  incrementUnread: () => void;
  resetUnread: () => void;
}

const CSNotificationContext = createContext<CSNotificationContextType | undefined>(undefined);

export const CSNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  // Load unread count from localStorage on mount
  useEffect(() => {
    const savedUnread = localStorage.getItem('cs_unread_count');
    if (savedUnread) {
      setUnreadCount(parseInt(savedUnread, 10));
    }
  }, []);

  // Save unread count to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('cs_unread_count', unreadCount.toString());
  }, [unreadCount]);

  const incrementUnread = () => {
    setUnreadCount(prev => prev + 1);
  };

  const resetUnread = () => {
    setUnreadCount(0);
  };

  return (
    <CSNotificationContext.Provider value={{ unreadCount, incrementUnread, resetUnread }}>
      {children}
    </CSNotificationContext.Provider>
  );
};

export const useCSNotification = () => {
  const context = useContext(CSNotificationContext);
  if (context === undefined) {
    throw new Error('useCSNotification must be used within a CSNotificationProvider');
  }
  return context;
};
