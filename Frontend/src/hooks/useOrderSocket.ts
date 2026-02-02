'use client';
import { useEffect } from 'react';
import { useSocket } from '@/context/SocketContext';
import { useNotification } from '@/context/NotificationContext';
import { playNotificationSound } from '@/utils/soundUtils';

export const useOrderSocket = (onNewOrder?: (order: any) => void) => {
  const { socket } = useSocket();
  const { showNotification } = useNotification();

  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (orderData: any) => {
      const timestamp = new Date().toLocaleString();
      console.log(`🔔 [${timestamp}] NEW ORDER EVENT RECEIVED:`, {
        orderId: orderData._id,
        orderNo: orderData.orderRequestNo || orderData.orderNo,
        customer: orderData.userId?.fullName || 'Unknown',
        orderType: orderData.orderType,
        total: orderData.cartTotal || orderData.totalAmount,
        items: orderData.items?.length || 0
      });
      
      // Play sound with logging
      console.log(`🔊 [${timestamp}] Playing new-order sound...`);
      playNotificationSound('new-order');
      console.log(`✅ [${timestamp}] Sound playback initiated`);
      
      // Show notification with logging
      console.log(`📱 [${timestamp}] Showing popup notification...`);
      const notificationData = {
        id: orderData._id,
        orderNo: orderData.orderRequestNo || orderData.orderNo,
        customerName: orderData.userId?.fullName || 'Unknown',
        orderType: orderData.orderType,
        totalAmount: orderData.cartTotal || orderData.totalAmount,
        itemsCount: orderData.items?.length || 0,
        timestamp: new Date().toISOString()
      };
      showNotification(notificationData);
      console.log(`✅ [${timestamp}] Popup notification displayed:`, notificationData);

      // Call custom handler if provided
      if (onNewOrder) {
        console.log(`🔄 [${timestamp}] Calling custom order handler...`);
        onNewOrder(orderData);
        console.log(`✅ [${timestamp}] Custom handler executed`);
      }
    };

    const handleOrderStatusUpdate = (orderData: any) => {
      const timestamp = new Date().toLocaleString();
      console.log(`📊 [${timestamp}] ORDER STATUS UPDATE:`, {
        orderId: orderData._id,
        status: orderData.status
      });
      
      if (orderData.status === 'ready') {
        console.log(`🔊 [${timestamp}] Playing order-ready sound...`);
        playNotificationSound('order-ready');
        console.log(`✅ [${timestamp}] Order ready sound initiated`);
      }
    };

    console.log('🚀 Socket listeners registered for new-order and order-status-updated events');
    socket.on('new-order', handleNewOrder);
    socket.on('order-status-updated', handleOrderStatusUpdate);

    return () => {
      console.log('🔌 Socket listeners removed');
      socket.off('new-order', handleNewOrder);
      socket.off('order-status-updated', handleOrderStatusUpdate);
    };
  }, [socket, showNotification, onNewOrder]);
};