'use client';
import { useEffect } from 'react';
import { useSocket } from '@/context/SocketContext';

export const usePageOrderSocket = (onNewOrder?: (order: any) => void) => {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket || !onNewOrder) return;

    const handleNewOrder = (orderData: any) => {
      const timestamp = new Date().toLocaleString();
      console.log(`📄 [${timestamp}] Page-specific order handler called`);
      onNewOrder(orderData);
    };

    console.log('📄 Page-specific socket listener registered');
    socket.on('new-order', handleNewOrder);

    return () => {
      console.log('📄 Page-specific socket listener removed');
      socket.off('new-order', handleNewOrder);
    };
  }, [socket, onNewOrder]);
};