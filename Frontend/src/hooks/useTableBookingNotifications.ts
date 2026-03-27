'use client';
import { useEffect } from 'react';
import { useSocket } from '@/context/SocketContext';
import { useNotification } from '@/context/NotificationContext';
import { playNotificationSound } from '@/utils/soundUtils';

export const useTableBookingNotifications = (pageName: string) => {
  const { socket, isConnected } = useSocket();
  const { showNotification } = useNotification();

  useEffect(() => {
    if (!socket || !isConnected) {
      console.log(`📅 ${pageName}: Socket not ready`, { socket: !!socket, isConnected });
      return;
    }

    const handleNewTableBooking = (bookingData: any) => {
      const timestamp = new Date().toLocaleString();
      console.log(`🔔 [${timestamp}] ${pageName.toUpperCase()} - New table booking received:`, {
        bookingId: bookingData._id,
        bookingNo: bookingData.tableBookingNo,
        customer: bookingData.userId?.fullName || 'Unknown',
        status: bookingData.status,
        numberOfGuests: bookingData.numberOfGuests,
        bookingDate: bookingData.bookingTimings?.date,
        slotTime: bookingData.bookingTimings?.slotTime,
        coverCharges: bookingData.coverCharges,
        allBookingData: Object.keys(bookingData)
      });
      
      // Show notification for new table bookings (typically pending status)
      if (bookingData.status === 'pending' || bookingData.status === 'confirmed') {
        // Play sound
        console.log(`🔊 [${timestamp}] Playing sound for ${bookingData.status} table booking...`);
        playNotificationSound('new-order');
        
        // Show notification
        console.log(`📱 [${timestamp}] Showing notification for ${bookingData.status} table booking...`);
        
        showNotification({
          id: bookingData._id,
          orderNo: `TB-${bookingData.tableBookingNo}`, // Prefix with TB for Table Booking
          isTableBooking: true, // Flag to identify table booking notifications
          customerName: bookingData.userId?.fullName || 'Unknown',
          orderType: 'table-booking',
          totalAmount: bookingData.coverCharges || 0,
          itemsCount: 0, // Table bookings don't have items
          noOfGuest: bookingData.numberOfGuests,
          bookingDate: bookingData.bookingTimings?.date,
          slotTime: bookingData.bookingTimings?.slotTime,
          coverCharges: bookingData.coverCharges,
          coverChargePaymentStatus: bookingData.coverChargePaymentStatus,
          timestamp: new Date().toISOString()
        });
      }
    };

    const handleTableBookingStatusUpdate = (data: any) => {
      const timestamp = new Date().toLocaleString();
      const bookingData = data.booking || data;
      
      console.log(`🔔 [${timestamp}] ${pageName.toUpperCase()} - Table booking status updated:`, {
        bookingId: bookingData._id,
        bookingNo: bookingData.tableBookingNo,
        customer: bookingData.userId?.fullName || 'Unknown',
        newStatus: bookingData.status,
        previousStatus: data.previousStatus
      });
      
      // Play sound for important status updates
      if (['confirmed', 'arrived', 'seated'].includes(bookingData.status)) {
        playNotificationSound('new-order');
        
        showNotification({
          id: bookingData._id,
          orderNo: `TB-${bookingData.tableBookingNo}`,
          isTableBooking: true,
          isStatusUpdate: true,
          customerName: bookingData.userId?.fullName || 'Unknown',
          orderType: 'table-booking',
          totalAmount: bookingData.coverCharges || 0,
          itemsCount: 0,
          noOfGuest: bookingData.numberOfGuests,
          bookingDate: bookingData.bookingTimings?.date,
          slotTime: bookingData.bookingTimings?.slotTime,
          newStatus: bookingData.status,
          previousStatus: data.previousStatus,
          timestamp: new Date().toISOString()
        });
      }
    };

    console.log(`📅 ${pageName}: Registering table booking socket listeners`);
    socket.on('new-table-booking', handleNewTableBooking);
    socket.on('table-booking-status-updated', handleTableBookingStatusUpdate);

    return () => {
      console.log(`📅 ${pageName}: Removing table booking socket listeners`);
      socket.off('new-table-booking', handleNewTableBooking);
      socket.off('table-booking-status-updated', handleTableBookingStatusUpdate);
    };
  }, [socket, isConnected, showNotification, pageName]);
};