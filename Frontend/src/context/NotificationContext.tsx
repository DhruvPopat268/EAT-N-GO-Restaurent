'use client';
import React, { createContext, useContext, useState } from 'react';

interface OrderNotification {
  id: string;
  orderNo: string;
  orderRequestNo?: string; // Add this to track if it's an order request
  isUpdated?: boolean; // Add this to track if it's an updated order
  isTableBooking?: boolean; // Add this to track if it's a table booking
  isStatusUpdate?: boolean; // Add this to track if it's a status update
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
  userCurrentLocation?: {
    address: string;
    latitude: number;
    longitude: number;
  };
  distanceToReachRestaurant?: string;
  durationToReachRestaurant?: string;
  // Table booking specific fields
  bookingDate?: string;
  slotTime?: string;
  coverCharges?: number;
  coverChargePaymentStatus?: string;
  newStatus?: string;
  previousStatus?: string;
  timestamp: string;
}

interface NotificationContextType {
  notifications: OrderNotification[];
  showNotification: (notification: OrderNotification) => void;
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

  const showNotification = (notification: OrderNotification) => {
    console.log('📱 NotificationContext: showNotification called with:', notification);
    setNotifications(prev => {
      console.log('📱 NotificationContext: Previous notifications:', prev.length);
      
      // Check if notification with same ID already exists
      const existingIndex = prev.findIndex(n => n.id === notification.id);
      if (existingIndex !== -1) {
        console.log('📱 NotificationContext: Duplicate notification prevented for ID:', notification.id);
        return prev; // Don't add duplicate
      }
      
      const newNotifications = [notification, ...prev];
      console.log('📱 NotificationContext: New notifications:', newNotifications.length);
      return newNotifications;
    });
    
    // Auto dismiss after 60 seconds (1 minute)
    console.log('📱 NotificationContext: Setting 60s timeout for:', notification.id);
    setTimeout(() => {
      console.log('📱 NotificationContext: Auto-dismissing:', notification.id);
      dismissNotification(notification.id);
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