'use client';
import { useEffect } from 'react';
import { useSocket } from '@/context/SocketContext';
import { useNotification } from '@/context/NotificationContext';
import { playNotificationSound } from '@/utils/soundUtils';

export const useOrderNotifications = (pageName: string) => {
  const { socket, isConnected } = useSocket();
  const { showNotification } = useNotification();

  useEffect(() => {
    if (!socket || !isConnected) {
      console.log(`📱 ${pageName}: Socket not ready`, { socket: !!socket, isConnected });
      return;
    }

    const handleNewOrder = (orderData: any) => {
      const timestamp = new Date().toLocaleString();
      console.log(`🔔 [${timestamp}] ${pageName.toUpperCase()} - New order received:`, {
        orderId: orderData._id,
        orderNo: orderData.orderRequestNo || orderData.orderNo,
        customer: orderData.userId?.fullName || 'Unknown',
        status: orderData.status,
        orderType: orderData.orderType,
        noOfGuest: orderData.noOfGuest,
        numberOfGuests: orderData.numberOfGuests,
        guestCount: orderData.guestCount,
        guests: orderData.guests,
        allOrderData: Object.keys(orderData)
      });
      
      // Show notification for waiting or confirmed orders
      if (orderData.status === 'waiting' || orderData.status === 'confirmed') {
        // Play sound
        console.log(`🔊 [${timestamp}] Playing sound for ${orderData.status} order...`);
        playNotificationSound('new-order');
        
        // Show notification
        console.log(`📱 [${timestamp}] Showing notification for ${orderData.status} order...`);
        console.log(`📱 Debug - numberOfGuests value:`, orderData.numberOfGuests, typeof orderData.numberOfGuests);
        
        showNotification({
          id: orderData._id,
          orderNo: orderData.orderRequestNo || orderData.orderNo,
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

    const handleUpdatedOrder = (orderData: any) => {
      const timestamp = new Date().toLocaleString();
      console.log(`🔔 [${timestamp}] ${pageName.toUpperCase()} - Order updated:`, {
        orderId: orderData._id,
        orderNo: orderData.orderNo,
        customer: orderData.userId?.fullName || 'Unknown'
      });
      
      playNotificationSound('new-order');
      
      showNotification({
        id: orderData._id,
        orderNo: orderData.orderNo,
        isUpdated: true,
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
    };

    console.log(`📱 ${pageName}: Registering socket listeners`);
    socket.on('new-order', handleNewOrder);
    socket.on('order-updated', handleUpdatedOrder);

    return () => {
      console.log(`📱 ${pageName}: Removing socket listeners`);
      socket.off('new-order', handleNewOrder);
      socket.off('order-updated', handleUpdatedOrder);
    };
  }, [socket, isConnected, showNotification, pageName]);
};