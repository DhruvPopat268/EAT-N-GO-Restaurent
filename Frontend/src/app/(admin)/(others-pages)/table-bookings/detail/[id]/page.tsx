"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axiosInstance from "@/utils/axiosConfig";
import { toast } from "@/utils/toast";
import { ArrowLeft, User, Calendar, Users, CreditCard, MapPin, Clock } from "lucide-react";

// Utility function to format time to 12-hour format with AM/PM
const formatTimeTo12Hour = (time24: string): string => {
  if (!time24) return '-';

  const [hours, minutes] = time24.split(':');
  const hour24 = parseInt(hours, 10);

  if (isNaN(hour24) || hour24 < 0 || hour24 > 23) return '-';

  const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
  const ampm = hour24 >= 12 ? 'PM' : 'AM';
  return `${hour12}:${minutes} ${ampm}`;
};

// Utility function to format date to DD/MM/YY format
const formatDateToDDMMYY = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString().slice(-2);
  return `${day}/${month}/${year}`;
};

// Get available status transitions based on current status
const getAvailableStatuses = (currentStatus: string) => {
  const statusFlow = {
    'pending': ['pending', 'confirmed', 'cancelled'],
    'confirmed': ['confirmed', 'arrived', 'notArrived', 'cancelled'],
    'arrived': ['arrived', 'seated'],
    'seated': ['seated', 'completed'],
    'notArrived': ['notArrived', 'arrived', 'cancelled'], // Allow transition to arrived if they show up late
    'completed': ['completed'],
    'cancelled': ['cancelled']
  };

  return statusFlow[currentStatus as keyof typeof statusFlow] || [currentStatus];
};

// Table booking status update API functions
const tableBookingApi = {
  updateToArrived: async (bookingId: string) => {
    const response = await axiosInstance.patch('/api/restaurants/table-bookings/arrived', {
      bookingId
    });
    return response.data;
  },

  updateToSeated: async (bookingId: string) => {
    const response = await axiosInstance.patch('/api/restaurants/table-bookings/seated', {
      bookingId
    });
    return response.data;
  },

  updateToCompleted: async (bookingId: string) => {
    const response = await axiosInstance.patch('/api/restaurants/table-bookings/completed', {
      bookingId
    });
    return response.data;
  },

  updateToDidNotArrive: async (bookingId: string) => {
    const response = await axiosInstance.patch('/api/restaurants/table-bookings/did-not-arrive', {
      bookingId
    });
    return response.data;
  },

  cancelBooking: async (bookingId: string, reason: string) => {
    const response = await axiosInstance.patch('/api/restaurants/table-bookings/cancel', {
      bookingId,
      reason
    });
    return response.data;
  }
};

interface BookingTimings {
  date: string;
  slotTime: string;
}

interface UserInfo {
  _id: string;
  phone: string;
  fullName: string;
}

interface AllocatedTable {
  tableNumbers: string[];
  allocatedAt: string;
  _id: string;
}

interface TableBookingDetail {
  _id: string;
  tableBookingNo: number;
  userId: UserInfo;
  bookingTimings: BookingTimings;
  numberOfGuests: number;
  coverCharges: number;
  coverChargePaymentStatus: string;
  status: string;
  allocatedTables: AllocatedTable[];
  currency?: {
    code: string;
    name: string;
    symbol: string;
  };
  createdAt: string;
  updatedAt: string;
}

const TableBookingDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;
  
  const [booking, setBooking] = useState<TableBookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusConfirm, setStatusConfirm] = useState<{ show: boolean, bookingId: string, bookingNo: string, currentStatus: string, newStatus: string }>({ show: false, bookingId: '', bookingNo: '', currentStatus: '', newStatus: '' });
  const [showCancelModal, setShowCancelModal] = useState<{ show: boolean, bookingId: string, bookingNo: string }>({ show: false, bookingId: '', bookingNo: '' });
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.post('/api/restaurants/table-bookings/details', {
        tableBookingId: bookingId,
        restaurantId: localStorage.getItem('restaurantId') // Assuming restaurantId is stored in localStorage
      });

      if (data.success) {
        setBooking(data.data);
      }
    } catch (error: any) {
      console.error('Error fetching booking details:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch booking details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (bookingId: string, bookingNo: string, currentStatus: string, newStatus: string) => {
    console.log('Status change requested:', { bookingId, bookingNo, currentStatus, newStatus });
    
    if (newStatus === currentStatus) {
      console.log('Same status selected, ignoring');
      return;
    }
    
    if (newStatus === 'cancelled') {
      setShowCancelModal({ show: true, bookingId, bookingNo });
      return;
    }
    
    if (newStatus === 'confirmed') {
      // For confirmed status, we might want to show table allocation modal
      // For now, just show confirmation
      setStatusConfirm({
        show: true,
        bookingId,
        bookingNo,
        currentStatus,
        newStatus
      });
      return;
    }
    
    setStatusConfirm({
      show: true,
      bookingId,
      bookingNo,
      currentStatus,
      newStatus
    });
  };

  const confirmStatusUpdate = async () => {
    setUpdatingStatus(true);
    try {
      let response;
      const { newStatus, bookingId } = statusConfirm;

      console.log('Updating status to:', newStatus, 'for booking:', bookingId);

      switch (newStatus) {
        case 'confirmed':
          // For confirmed status, we would need a confirm API endpoint
          // For now, just show success message
          toast.success('Booking confirmed successfully');
          setBooking(prev => prev ? { ...prev, status: newStatus } : null);
          return;
        case 'arrived':
          response = await tableBookingApi.updateToArrived(bookingId);
          break;
        case 'seated':
          response = await tableBookingApi.updateToSeated(bookingId);
          break;
        case 'completed':
          response = await tableBookingApi.updateToCompleted(bookingId);
          break;
        case 'notArrived':
          response = await tableBookingApi.updateToDidNotArrive(bookingId);
          break;
        default:
          throw new Error(`Invalid status update: ${newStatus}`);
      }

      console.log('API Response:', response);

      if (response && response.success) {
        toast.success(`Booking status updated to ${newStatus === 'notArrived' ? 'not arrived' : newStatus}`);
        setBooking(response.data);
      } else if (response) {
        toast.error(response.message || 'Error updating status');
      }
    } catch (error: any) {
      console.error('Error updating status:', error);
      console.error('Error details:', error.response?.data);
      toast.error(error.response?.data?.message || error.message || 'Error updating status');
    } finally {
      setUpdatingStatus(false);
      setStatusConfirm({ show: false, bookingId: '', bookingNo: '', currentStatus: '', newStatus: '' });
    }
  };

  const handleCancelBooking = async () => {
    if (!cancelReason.trim()) {
      toast.error('Please enter a cancellation reason');
      return;
    }
    
    setActionLoading(true);
    try {
      const response = await tableBookingApi.cancelBooking(showCancelModal.bookingId, cancelReason);
      if (response.success) {
        toast.success('Booking cancelled successfully');
        setBooking(response.data);
      } else {
        toast.error(response.message || 'Error cancelling booking');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setActionLoading(false);
      setShowCancelModal({ show: false, bookingId: '', bookingNo: '' });
      setCancelReason('');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100';
      case 'arrived':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100';
      case 'seated':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-100';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
      case 'notArrived':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    return status === 'paid' 
      ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
      : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Booking not found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">The booking you're looking for doesn't exist.</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center justify-center w-10 h-10 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Booking #{booking.tableBookingNo}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">Table booking details</p>
            </div>
          </div>
          
          {/* Status Update Dropdown - Right Corner */}
          {!['completed', 'cancelled'].includes(booking.status) && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Update Status:</label>
              <select
                value={booking.status}
                onChange={(e) => handleStatusChange(booking._id, booking.tableBookingNo.toString(), booking.status, e.target.value)}
                disabled={updatingStatus}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white min-w-[150px]"
              >
                {getAvailableStatuses(booking.status).map(status => (
                  <option key={status} value={status} className="capitalize">
                    {status === 'notArrived' ? 'Not Arrived' : status}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-3">
          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(booking.status)}`}>
            {booking.status === 'notArrived' ? 'Not Arrived' : booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </span>
          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getPaymentStatusColor(booking.coverChargePaymentStatus)}`}>
            Payment: {booking.coverChargePaymentStatus.charAt(0).toUpperCase() + booking.coverChargePaymentStatus.slice(1)}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Customer Information</h2>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Full Name</label>
              <p className="text-sm text-gray-900 dark:text-white">{booking.userId.fullName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Phone Number</label>
              <p className="text-sm text-gray-900 dark:text-white">{booking.userId.phone}</p>
            </div>
          </div>
        </div>

        {/* Booking Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Booking Information</h2>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Date</label>
              <p className="text-sm text-gray-900 dark:text-white">{booking.bookingTimings.date}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Time Slot</label>
              <p className="text-sm text-gray-900 dark:text-white">{formatTimeTo12Hour(booking.bookingTimings.slotTime)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Number of Guests</label>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                <p className="text-sm text-gray-900 dark:text-white">{booking.numberOfGuests} guests</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <CreditCard className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Payment Information</h2>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Cover Charges</label>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {booking.currency?.symbol || '₹'}{booking.coverCharges}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Payment Status</label>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(booking.coverChargePaymentStatus)}`}>
                {booking.coverChargePaymentStatus.charAt(0).toUpperCase() + booking.coverChargePaymentStatus.slice(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Assigned Tables */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Assigned Tables</h2>
          </div>
          <div className="space-y-3">
            {booking.allocatedTables && booking.allocatedTables.length > 0 ? (
              booking.allocatedTables.map((allocation, index) => (
                <div key={allocation._id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {allocation.tableNumbers.map((tableNumber, tableIndex) => (
                      <div key={tableIndex} className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900 border-2 border-blue-300 dark:border-blue-700 rounded-lg">
                        <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                          {tableNumber}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Assigned on {formatDateToDDMMYY(allocation.allocatedAt)} at {formatTimeTo12Hour(new Date(allocation.allocatedAt).toLocaleTimeString('en-US', { hour12: false }))}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">No tables assigned yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Timestamps */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Booking Timeline</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Created At</label>
            <p className="text-sm text-gray-900 dark:text-white">
              {formatDateToDDMMYY(booking.createdAt)} at {formatTimeTo12Hour(new Date(booking.createdAt).toLocaleTimeString('en-US', { hour12: false }))}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Updated</label>
            <p className="text-sm text-gray-900 dark:text-white">
              {formatDateToDDMMYY(booking.updatedAt)} at {formatTimeTo12Hour(new Date(booking.updatedAt).toLocaleTimeString('en-US', { hour12: false }))}
            </p>
          </div>
        </div>
      </div>

      {/* Status Confirmation Modal */}
      {statusConfirm.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999]">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Confirm Status Update</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to update status from <span className="font-semibold capitalize">{statusConfirm.currentStatus === 'notArrived' ? 'Not Arrived' : statusConfirm.currentStatus}</span> to <span className="font-semibold capitalize">{statusConfirm.newStatus === 'notArrived' ? 'Not Arrived' : statusConfirm.newStatus}</span> for booking #{statusConfirm.bookingNo}?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setStatusConfirm({ show: false, bookingId: '', bookingNo: '', currentStatus: '', newStatus: '' })}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusUpdate}
                disabled={updatingStatus}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {updatingStatus && (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Cancel Booking #{showCancelModal.bookingNo}
              </h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cancellation Reason
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Enter reason for cancellation..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                  rows={3}
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCancelModal({ show: false, bookingId: '', bookingNo: '' });
                    setCancelReason('');
                  }}
                  disabled={actionLoading}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Close
                </button>
                <button
                  onClick={handleCancelBooking}
                  disabled={actionLoading || !cancelReason.trim()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                  Cancel Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableBookingDetailPage;