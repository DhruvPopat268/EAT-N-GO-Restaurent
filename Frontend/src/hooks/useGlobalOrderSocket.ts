'use client';
import { useEffect } from 'react';
import { useSocket } from '@/context/SocketContext';
import { useNotification } from '@/context/NotificationContext';
import { playNotificationSound } from '@/utils/soundUtils';

export const useGlobalOrderSocket = () => {
  const { socket, isConnected } = useSocket();
  const { showNotification } = useNotification();

  console.log('🌐 useGlobalOrderSocket: Hook called with socket:', !!socket, 'isConnected:', isConnected);

  useEffect(() => {
    console.log('🌐 useGlobalOrderSocket: useEffect triggered with socket:', !!socket, 'isConnected:', isConnected);
    
    if (!socket || !isConnected) {
      console.log('🌐 Global socket: No socket connection or not connected yet', { socket: !!socket, isConnected });
      return;
    }

    const handleNewOrder = (orderData: any) => {
      const timestamp = new Date().toLocaleString();
      console.log(`🔔 [${timestamp}] GLOBAL NEW ORDER EVENT:`, {
        orderId: orderData._id,
        orderNo: orderData.orderRequestNo || orderData.orderNo,
        customer: orderData.userId?.fullName || 'Unknown',
        orderType: orderData.orderType,
        total: orderData.cartTotal || orderData.totalAmount
      });
      
      // Play sound
      console.log(`🔊 [${timestamp}] Playing global new-order sound...`);
      playNotificationSound('new-order');
      
      // Show notification
      console.log(`📱 [${timestamp}] Calling showNotification...`);
      const notificationData = {
        id: orderData._id,
        orderNo: orderData.orderRequestNo || orderData.orderNo,
        customerName: orderData.userId?.fullName || 'Unknown',
        orderType: orderData.orderType,
        totalAmount: orderData.cartTotal || orderData.totalAmount,
        itemsCount: orderData.items?.length || 0,
        timestamp: new Date().toISOString()
      };
      console.log(`📱 [${timestamp}] Notification data:`, notificationData);
      showNotification(notificationData);
      console.log(`✅ [${timestamp}] showNotification called`);
    };

    const handleOrderStatusUpdate = (orderData: any) => {
      const timestamp = new Date().toLocaleString();
      console.log(`📊 [${timestamp}] GLOBAL ORDER STATUS UPDATE:`, {
        orderId: orderData._id,
        status: orderData.status
      });
      
      if (orderData.status === 'ready') {
        console.log(`🔊 [${timestamp}] Playing global order-ready sound...`);
        playNotificationSound('order-ready');
      }
    };

    console.log('🌐 Global socket listeners registered - Socket connected!');
    
    socket.on('new-order', handleNewOrder);
    socket.on('order-status-updated', handleOrderStatusUpdate);

    return () => {
      console.log('🌐 Global socket listeners removed');
      socket.off('new-order', handleNewOrder);
      socket.off('order-status-updated', handleOrderStatusUpdate);
    };
  }, [socket, isConnected]); // Removed showNotification from dependencies
};