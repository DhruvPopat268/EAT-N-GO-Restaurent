'use client';
import { useEffect } from 'react';
import { useSocket } from '@/context/SocketContext';
import { useNotification } from '@/context/NotificationContext';
import { playNotificationSound } from '@/utils/soundUtils';

interface UseTableBookingSocketOptions {
  pageName?: string;
  onNewBooking?: (bookingData: any) => void;
  showNotifications?: boolean;
}

export const useTableBookingSocket = (options: UseTableBookingSocketOptions = {}) => {
  const { 
    pageName = 'Unknown Page',
    onNewBooking,
    showNotifications = true 
  } = options;
  
  const { socket, isConnected } = useSocket();
  const { showNotification } = useNotification();

  // Format date to DD/MM/YY
  const formatDateToDDMMYY = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `${day}/${month}/${year}`;
  };

  // Format time to 12-hour format with AM/PM
  const formatTimeTo12Hour = (time24: string): string => {
    if (!time24) return '-';
    const [hours, minutes] = time24.split(':');
    const hour24 = parseInt(hours, 10);
    if (isNaN(hour24) || hour24 < 0 || hour24 > 23) return '-';
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewTableBooking = (bookingData: any) => {
      const formattedDate = formatDateToDDMMYY(bookingData.bookingTimings?.date);
      const formattedTime = formatTimeTo12Hour(bookingData.bookingTimings?.slotTime);
      
      // Show notification for new table bookings
      if (bookingData.status === 'pending' || bookingData.status === 'confirmed') {
        // Play sound
        playNotificationSound('new-order');
        
        // Show popup notification
        if (showNotifications) {
          showNotification({
            id: bookingData._id,
            orderNo: bookingData.tableBookingNo.toString(),
            isTableBooking: true,
            customerName: bookingData.userId?.fullName || 'Unknown',
            orderType: 'table-booking',
            totalAmount: bookingData.coverCharges || 0,
            itemsCount: 0,
            noOfGuest: bookingData.numberOfGuests,
            bookingDate: formattedDate,
            slotTime: formattedTime,
            coverCharges: bookingData.coverCharges,
            coverChargePaymentStatus: bookingData.coverChargePaymentStatus,
            timestamp: new Date().toISOString()
          });
        }

        // Call custom handler if provided
        if (onNewBooking) {
          onNewBooking({
            ...bookingData,
            formattedDate,
            formattedTime
          });
        }
      }
    };

    socket.on('new-table-booking', handleNewTableBooking);
    
    return () => {
      socket.off('new-table-booking', handleNewTableBooking);
    };
  }, [socket, isConnected, showNotification, showNotifications, onNewBooking]);

  return {
    formatDateToDDMMYY,
    formatTimeTo12Hour
  };
};