'use client';
import { useEffect } from 'react';
import { useSocket } from '@/context/SocketContext';
import { useNotification } from '@/context/NotificationContext';
import { playNotificationSound } from '@/utils/soundUtils';

export const useOrderRequestNotifications = (pageName: string) => {
  const { socket, isConnected } = useSocket();
  const { showNotification } = useNotification();

  useEffect(() => {
    if (!socket || !isConnected) {
      console.log(`📱 ${pageName}: Socket not ready`, { socket: !!socket, isConnected });
      return;
    }

    const handleNewOrderRequest = (orderData: any) => {
      const timestamp = new Date().toLocaleString();
      console.log(`🔔 [${timestamp}] ${pageName.toUpperCase()} - New order request received:`, {
        orderId: orderData._id,
        orderNo: orderData.orderRequestNo || orderData.orderNo,
        customer: orderData.userId?.fullName || 'Unknown',
        status: orderData.status,
        orderType: orderData.orderType,
        numberOfGuests: orderData.numberOfGuests
      });
      
      // Show notification for pending order requests
      if (orderData.status === 'pending') {
        // Play sound
        console.log(`🔊 [${timestamp}] Playing sound for ${orderData.status} order request...`);
        playNotificationSound('new-order');
        
        // Show notification
        console.log(`📱 [${timestamp}] Showing notification for ${orderData.status} order request...`);
        console.log(`📱 Debug - numberOfGuests value:`, orderData.numberOfGuests, typeof orderData.numberOfGuests);
        showNotification({
          id: orderData._id,
          orderNo: orderData.orderRequestNo || orderData.orderNo,
          orderRequestNo: orderData.orderRequestNo, // Track if it's an order request
          customerName: orderData.userId?.fullName || 'Unknown',
          orderType: orderData.orderType,
          totalAmount: orderData.cartTotal || orderData.totalAmount,
          itemsCount: orderData.items?.length || 0,
          noOfGuest: orderData.numberOfGuests,
          eatTimings: orderData.eatTimings,
          takeawayTimings: orderData.takeawayTimings,
          userCurrentLocation: orderData.userCurrentLocation,
          distanceToReachRestaurant: orderData.distanceToReachRestaurant,
          durationToReachRestaurant: orderData.durationToReachRestaurant,
          timestamp: new Date().toISOString()
        });
      }
    };

    console.log(`📱 ${pageName}: Registering socket listener for new-order-req`);
    socket.on('new-order-req', handleNewOrderRequest);

    return () => {
      console.log(`📱 ${pageName}: Removing socket listener for new-order-req`);
      socket.off('new-order-req', handleNewOrderRequest);
    };
  }, [socket, isConnected, showNotification, pageName]);
};