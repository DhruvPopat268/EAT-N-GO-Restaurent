"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axiosInstance from "@/utils/axiosConfig";
import { toast } from "@/utils/toast";
import { ArrowLeft, User, Calendar, Users, CreditCard, MapPin, Clock } from "lucide-react";
import { useTableBookingSocket } from '@/hooks/useTableBookingSocket';

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
    'notArrived': ['notArrived', 'arrived', 'expired'], // Added expired option
    'completed': ['completed'],
    'cancelled': ['cancelled'],
    'expired': ['expired'] // Final state
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

  updateToCompleted: async (bookingId: string, finalBillAmount?: number, collectedBy?: string) => {
    const payload: any = { bookingId };
    if (finalBillAmount !== undefined) {
      payload.finalBillAmount = finalBillAmount;
    }
    if (collectedBy !== undefined) {
      payload.collectedBy = collectedBy;
    }

    const response = await axiosInstance.patch('/api/restaurants/table-bookings/completed', payload);
    return response.data;
  },

  updateToDidNotArrive: async (bookingId: string) => {
    const response = await axiosInstance.patch('/api/restaurants/table-bookings/did-not-arrive', {
      bookingId
    });
    return response.data;
  },

  updateToExpired: async (bookingId: string) => {
    const response = await axiosInstance.patch('/api/restaurants/table-bookings/expired', {
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
  finalBillPaymentId?: { _id: string; status: string } | string;
  finalBill?: {
    amount: number;
    collectedBy: 'restaurant' | 'app';
    setAt: string;
  };
  finalBillPaidBreakdown?: {
    originalFinalBill: number;
    restaurantDiscount: number;
    adminDiscount: number;
    coverChargesDeducted: number;
    discountedFinalBill: number;
  };
  settlement?: {
    status: string;
    settledAt: string;
    finalBillAmount: number;
    restaurantDiscount: number;
    adminDiscount: number;
    restaurantEarn: number;
    adminCommissionAmount: number;
    adminCommissionInINR: number;
  };
  allocatedTables?: AllocatedTable;
  currency?: {
    code: string;
    name: string;
    symbol: string;
  };
  adminCommission?: number;
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
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<TableBookingDetail | null>(null);
  const [tableNumbers, setTableNumbers] = useState<string[]>(['']);
  const [allocating, setAllocating] = useState(false);
  const [showBillCollectionModal, setShowBillCollectionModal] = useState<{ show: boolean, bookingId: string, bookingNo: string }>({ show: false, bookingId: '', bookingNo: '' });
  const [finalBillAmount, setFinalBillAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'restaurant' | 'app'>('app');

  // Add table booking socket events
  useTableBookingSocket({
    pageName: "Table Booking Details"
  });

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId]);

  const handleAllocateTable = (booking: TableBookingDetail) => {
    setSelectedBooking(booking);
    setTableNumbers(['']);
    setShowAllocateModal(true);
  };

  const addTableInput = () => {
    setTableNumbers([...tableNumbers, '']);
  };

  const removeTableInput = (index: number) => {
    if (tableNumbers.length > 1) {
      const newTableNumbers = tableNumbers.filter((_, i) => i !== index);
      setTableNumbers(newTableNumbers);
    }
  };

  const updateTableNumber = (index: number, value: string) => {
    const newTableNumbers = [...tableNumbers];
    newTableNumbers[index] = value;
    setTableNumbers(newTableNumbers);
  };

  const handleAllocateTables = async () => {
    if (!selectedBooking) return;

    const validTableNumbers = tableNumbers.filter(num => num.trim() !== '');

    if (validTableNumbers.length === 0) {
      toast.error('Please enter at least one table number');
      return;
    }

    const uniqueTableNumbers = [...new Set(validTableNumbers)];
    if (uniqueTableNumbers.length !== validTableNumbers.length) {
      toast.error('Please remove duplicate table numbers');
      return;
    }

    setAllocating(true);
    try {
      const { data } = await axiosInstance.patch('/api/restaurants/table-bookings/allocate-tables', {
        tableNumbers: validTableNumbers,
        bookingId: selectedBooking._id
      });

      if (data.success) {
        toast.success(selectedBooking.status === 'pending' ? 'Booking confirmed and tables allocated successfully' : 'Tables allocated successfully');
        setShowAllocateModal(false);
        setSelectedBooking(null);
        setTableNumbers(['']);
        // Update the booking with the response data
        setBooking(data.data);
      }
    } catch (error: any) {
      console.error('Error allocating tables:', error);
      toast.error(error.response?.data?.message || 'Failed to allocate tables');
    } finally {
      setAllocating(false);
    }
  };

  const closeAllocateModal = () => {
    setShowAllocateModal(false);
    setSelectedBooking(null);
    setTableNumbers(['']);
  };

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
    if (newStatus === currentStatus) return;

    if (newStatus === 'cancelled') {
      setShowCancelModal({ show: true, bookingId, bookingNo });
      return;
    }

    if (newStatus === 'confirmed') {
      if (booking) {
        handleAllocateTable(booking);
      }
      return;
    }

    // Check if transitioning from seated to completed
    if (currentStatus === 'seated' && newStatus === 'completed') {
      if (booking) {
        // If no final bill is set, show bill collection modal
        if (!booking.finalBill) {
          setShowBillCollectionModal({ show: true, bookingId, bookingNo });
          return;
        }
        // If final bill is set but payment is via app, prevent transition
        if (booking.finalBill.collectedBy === 'app') {
          toast.error('Cannot complete booking. Customer payment via app is still pending.');
          return;
        }
      }
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
        case 'expired':
          response = await tableBookingApi.updateToExpired(bookingId);
          break;
        default:
          throw new Error(`Invalid status update: ${newStatus}`);
      }

      if (response && response.success) {
        toast.success(`Booking status updated to ${newStatus === 'notArrived' ? 'not arrived' : newStatus}`);
        setBooking(response.data);
      } else if (response) {
        toast.error(response.message || 'Error updating status');
      }
    } catch (error: any) {
      console.error('Error updating status:', error);
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

  const handleBillCollection = async () => {
    if (!finalBillAmount.trim()) {
      toast.error('Please enter the final bill amount');
      return;
    }

    const billAmount = parseInt(finalBillAmount);
    if (isNaN(billAmount) || billAmount <= 0) {
      toast.error('Please enter a valid bill amount');
      return;
    }

    setActionLoading(true);
    try {
      const response = await axiosInstance.patch('/api/restaurants/table-bookings/completed', {
        bookingId: showBillCollectionModal.bookingId,
        finalBillAmount: billAmount,
        collectedBy: paymentMethod
      });

      if (response.data.success) {
        if (paymentMethod === 'restaurant') {
          toast.success('Booking completed successfully!');
        } else {
          toast.success('Final bill set. Waiting for customer payment via app.');
        }

        // Update the booking with the response data
        setBooking(response.data.data);
      } else {
        toast.error(response.data.message || 'Error setting final bill');
      }
    } catch (error: any) {
      console.error('Error setting final bill:', error);
      toast.error(error.response?.data?.message || 'Failed to set final bill');
    } finally {
      setActionLoading(false);
      setShowBillCollectionModal({ show: false, bookingId: '', bookingNo: '' });
      setFinalBillAmount('');
      setPaymentMethod('restaurant');
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
      case 'expired':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
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
    <div className="p-6 max-w-7xl mx-auto">
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
          {!['completed', 'cancelled', 'expired'].includes(booking.status) && (
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

      {/* Main Content - Row 1: 3 cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
              <p className="text-sm text-gray-900 dark:text-white">{formatDateToDDMMYY(booking.bookingTimings.date)}</p>
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

        {/* Assigned Tables */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Assigned Tables
            </h2>
          </div>

          {/* Content */}
          <div className="space-y-3">
            {booking.allocatedTables?.tableNumbers?.length ? (
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">

                {/* Tables Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-3">
                  {booking.allocatedTables.tableNumbers.map((tableNumber, tableIndex) => (
                    <div
                      key={tableIndex}
                      className="
                flex items-center justify-center
                min-h-[60px]
                px-2 py-2
                bg-gradient-to-br from-blue-100 to-blue-200
                dark:from-blue-900 dark:to-blue-800
                border border-blue-300 dark:border-blue-700
                rounded-xl shadow-sm
                text-center
              "
                    >
                      <span className="text-sm font-semibold text-blue-900 dark:text-blue-100 leading-tight break-words">
                        {tableNumber}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Assigned Time */}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Assigned on{" "}
                  {formatDateToDDMMYY(booking.allocatedTables.allocatedAt)} at{" "}
                  {formatTimeTo12Hour(
                    new Date(booking.allocatedTables.allocatedAt).toLocaleTimeString("en-US", { hour12: false })
                  )}
                </p>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No tables assigned yet
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Payment, Bill Breakdown, Settlement */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Cover Charge Payment Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <CreditCard className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Cover Charge Payment Info</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Cover Charges</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {booking.currency?.symbol || '₹'}{booking.coverCharges}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Payment Status</span>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(booking.coverChargePaymentStatus)}`}>
                {booking.coverChargePaymentStatus.charAt(0).toUpperCase() + booking.coverChargePaymentStatus.slice(1)}
              </span>
            </div>
          </div>

        </div>

        {/* Final Bill Breakdown */}
        {booking.finalBillPaidBreakdown && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="w-5 h-5 text-teal-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Final Bill Breakdown</h2>
            </div>
            <div className="space-y-3">
              {([
                ['Original Bill', booking.finalBillPaidBreakdown.originalFinalBill],
                ['Restaurant Discount', booking.finalBillPaidBreakdown.restaurantDiscount],
                ['Admin Discount', booking.finalBillPaidBreakdown.adminDiscount],
                ['Cover Charges Deducted', booking.finalBillPaidBreakdown.coverChargesDeducted],
              ] as [string, number][]).map(([label, value]) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{booking.currency?.symbol || '₹'}{value}</span>
                </div>
              ))}
              <div className="border-t border-gray-200 dark:border-gray-600 pt-2 flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">Discounted Final Bill</span>
                <span className="text-base font-bold text-green-600 dark:text-green-400">{booking.currency?.symbol || '₹'}{booking.finalBillPaidBreakdown.discountedFinalBill}</span>
              </div>
              {booking.finalBill && (
                <div className="border-t border-gray-200 dark:border-gray-600 pt-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Collected By</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${booking.finalBill.collectedBy === 'restaurant'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
                      : 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100'
                      }`}>
                      {booking.finalBill.collectedBy === 'restaurant' ? 'Restaurant' : 'Via App'}
                    </span>
                  </div>
                  {typeof booking.finalBillPaymentId === 'object' && booking.finalBillPaymentId?.status && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Payment Status</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${booking.finalBillPaymentId.status === 'success'
                        ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                        : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                        }`}>
                        {booking.finalBillPaymentId.status.charAt(0).toUpperCase() + booking.finalBillPaymentId.status.slice(1)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Settlement */}
        {booking.settlement && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Settlement</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${booking.settlement.status === 'settled'
                  ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                  }`}>
                  {booking.settlement.status.charAt(0).toUpperCase() + booking.settlement.status.slice(1)}
                </span>
              </div>

              {/* Only show settlement details if status is 'settled' */}
              {booking.settlement.status === 'settled' && (
                <>
                  {([
                    ['Final Bill Amount', booking.settlement.finalBillAmount],
                    ['Restaurant Discount', booking.settlement.restaurantDiscount],
                    ['Admin Discount', booking.settlement.adminDiscount],
                    ['Admin Commission', booking.settlement.adminCommissionAmount],
                  ] as [string, number][]).map(([label, value]) => (
                    <div key={label} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{booking.currency?.symbol || '₹'}{value}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-2 flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">Restaurant Earnings</span>
                    <span className="text-base font-bold text-green-600 dark:text-green-400">{booking.currency?.symbol || '₹'}{booking.settlement.restaurantEarn}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Settled At</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDateToDDMMYY(booking.settlement.settledAt)} at {formatTimeTo12Hour(new Date(booking.settlement.settledAt).toLocaleTimeString('en-US', { hour12: false }))}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
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

      {/* Allocate Tables Modal */}
      {showAllocateModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md shadow-xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedBooking.status === 'pending' ? 'Confirm Booking & Assign Tables' : 'Allocate Tables'}
                </h2>
                <button
                  onClick={closeAllocateModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              {/* Booking Details */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Booking Details</h3>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Booking #:</span> {selectedBooking.tableBookingNo}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Customer:</span> {selectedBooking.userId.fullName}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Guests:</span> {selectedBooking.numberOfGuests}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Date & Time:</span> {formatDateToDDMMYY(selectedBooking.bookingTimings.date)} at {formatTimeTo12Hour(selectedBooking.bookingTimings.slotTime)}
                  </p>
                </div>
              </div>

              {/* Table Numbers Input */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Table Numbers
                  </label>
                  <button
                    onClick={addTableInput}
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                  >
                    + Add Table
                  </button>
                </div>

                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {tableNumbers.map((tableNumber, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={tableNumber}
                        onChange={(e) => updateTableNumber(index, e.target.value)}
                        placeholder={`Table ${index + 1} number`}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 dark:bg-gray-700 dark:text-white text-sm"
                      />
                      {tableNumbers.length > 1 && (
                        <button
                          onClick={() => removeTableInput(index)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1"
                          title="Remove table"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeAllocateModal}
                  disabled={allocating}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAllocateTables}
                  disabled={allocating || tableNumbers.every(num => num.trim() === '')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {allocating && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  {selectedBooking.status === 'pending' ? 'Confirm & Allocate Tables' : 'Allocate Tables'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* Bill Collection Modal */}
      {showBillCollectionModal.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Set Final Bill - Booking #{showBillCollectionModal.bookingNo}
              </h2>

              {/* Payment Method Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  How will the customer pay?
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="app"
                      checked={paymentMethod === 'app'}
                      onChange={(e) => setPaymentMethod(e.target.value as 'restaurant' | 'app')}
                      className="mr-3 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Pay via app</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Customer will pay through the mobile app</p>
                    </div>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="restaurant"
                      checked={paymentMethod === 'restaurant'}
                      onChange={(e) => setPaymentMethod(e.target.value as 'restaurant' | 'app')}
                      className="mr-3 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Pay directly to restaurant</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Customer will pay cash/card to restaurant</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Final Bill Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={finalBillAmount}
                    onChange={(e) => setFinalBillAmount(e.target.value)}
                    placeholder="0"
                    min="0"
                    step="1"
                    onKeyPress={(e) => {
                      // Prevent decimal point entry
                      if (e.key === '.' || e.key === ',') {
                        e.preventDefault();
                      }
                    }}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowBillCollectionModal({ show: false, bookingId: '', bookingNo: '' });
                    setFinalBillAmount('');
                    setPaymentMethod('app');
                  }}
                  disabled={actionLoading}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBillCollection}
                  disabled={actionLoading || !finalBillAmount.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                  {paymentMethod === 'restaurant' ? 'Set Bill & Complete' : 'Set Bill Amount'}
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