'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

interface SocketProviderProps {
  children: React.ReactNode;
  restaurantId: string;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children, restaurantId }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    console.log('🔌 SocketProvider: useEffect called with restaurantId:', restaurantId);
    
    if (!restaurantId) {
      console.log('🔌 SocketProvider: No restaurantId provided');
      return;
    }

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
    console.log('🔌 SocketProvider: Connecting to socket URL:', socketUrl);
    
    const socketInstance = io(socketUrl);

    socketInstance.on('connect', () => {
      console.log('🔌 SocketProvider: Socket connected!');
      setIsConnected(true);
      console.log('🔌 SocketProvider: Joining restaurant room:', restaurantId);
      socketInstance.emit('join-restaurant', restaurantId);
    });

    socketInstance.on('disconnect', () => {
      console.log('🔌 SocketProvider: Socket disconnected!');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('🔌 SocketProvider: Connection error:', error);
    });

    console.log('🔌 SocketProvider: Setting socket instance');
    setSocket(socketInstance);

    return () => {
      console.log('🔌 SocketProvider: Cleaning up socket connection');
      socketInstance.disconnect();
    };
  }, [restaurantId]);

  console.log('🔌 SocketProvider: Rendering with socket:', !!socket, 'isConnected:', isConnected);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};