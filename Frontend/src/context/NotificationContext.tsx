'use client';
import React, { createContext, useContext, useState } from 'react';

interface OrderNotification {
  id: string;
  orderNo: string;
  orderRequestNo?: string; // Add this to track if it's an order request
  customerName: string;
  orderType: string;
  totalAmount: number;
  itemsCount: number;
  noOfGuest?: number;
  eatTimings?: {
    startTime: string;
    endTime: string;
  };
  takeawayTimings?: {
    startTime: string;
    endTime: string;
  };
  timestamp: string;
}

interface NotificationContextType {
  notifications: OrderNotification[];
  showNotification: (order: OrderNotification) => void;
  dismissNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  showNotification: () => {},
  dismissNotification: () => {},
  clearAllNotifications: () => {},
});

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);

  const showNotification = (order: OrderNotification) => {
    console.log('📱 NotificationContext: showNotification called with:', order);
    setNotifications(prev => {
      console.log('📱 NotificationContext: Previous notifications:', prev.length);
      
      // Check if notification with same ID already exists
      const existingIndex = prev.findIndex(n => n.id === order.id);
      if (existingIndex !== -1) {
        console.log('📱 NotificationContext: Duplicate notification prevented for ID:', order.id);
        return prev; // Don't add duplicate
      }
      
      const newNotifications = [order, ...prev];
      console.log('📱 NotificationContext: New notifications:', newNotifications.length);
      return newNotifications;
    });
    
    // Auto dismiss after 60 seconds (1 minute)
    console.log('📱 NotificationContext: Setting 60s timeout for:', order.id);
    setTimeout(() => {
      console.log('📱 NotificationContext: Auto-dismissing:', order.id);
      dismissNotification(order.id);
    }, 60000);
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      showNotification,
      dismissNotification,
      clearAllNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
};