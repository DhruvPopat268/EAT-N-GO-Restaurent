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
  finalBillPaymentId?: string;
  finalBill?: {
    amount: number;
    collectedBy: 'restaurant' | 'app';
    setAt: string;
  };
  allocatedTables?: AllocatedTable;
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
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<TableBookingDetail | null>(null);
  const [tableNumbers, setTableNumbers] = useState<string[]>(['']);
  const [allocating, setAllocating] = useState(false);
  const [showBillCollectionModal, setShowBillCollectionModal] = useState<{ show: boolean, bookingId: string, bookingNo: string }>({ show: false, bookingId: '', bookingNo: '' });
  const [finalBillAmount, setFinalBillAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'restaurant' | 'app'>('restaurant');

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
    <div className="p-6 w-full space-y-6">

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Booking #{booking.tableBookingNo}
          </h1>

          <div className="flex gap-2 mt-2 flex-wrap">
            <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(booking.status)}`}>
              {booking.status}
            </span>

            <span className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-700">
              ₹{booking.finalBill?.amount || 0}
            </span>

            <span className="px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-700">
              {booking.finalBill?.collectedBy === 'app' ? 'Paid via App' : 'Restaurant Payment'}
            </span>
          </div>
        </div>
      </div>

      {/* TOP SUMMARY */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">

        {/* Customer */}
        <div className="bg-white p-5 rounded-xl shadow border">
          <p className="text-sm text-gray-500">Customer</p>
          <p className="font-semibold">{booking.userId.fullName}</p>
          <p className="text-sm text-gray-500">{booking.userId.phone}</p>
        </div>

        {/* Booking */}
        <div className="bg-white p-5 rounded-xl shadow border">
          <p className="text-sm text-gray-500">Booking</p>
          <p>{formatDateToDDMMYY(booking.bookingTimings.date)}</p>
          <p>{formatTimeTo12Hour(booking.bookingTimings.slotTime)}</p>
          <p>{booking.numberOfGuests} guests</p>
        </div>

        {/* Cover Charge */}
        <div className="bg-white p-5 rounded-xl shadow border">
          <p className="text-sm text-gray-500">Cover Charge</p>
          <p className="text-xl font-bold">₹{booking.coverCharges}</p>

          <span className={`text-xs px-2 py-1 rounded ${booking.coverChargePaymentStatus === "redeemed"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
            }`}>
            {booking.coverChargePaymentStatus}
          </span>
        </div>

        {/* 🔥 NEW USER PAID CARD */}
        <div className="bg-white p-5 rounded-xl shadow border">
          <p className="text-sm text-gray-500">User Paid</p>

          <p className="text-xl font-bold">
            ₹{booking.finalBillPaidBreakdown?.discountedFinalBill || 0}
          </p>

          <span className={`text-xs px-2 py-1 rounded ${booking.finalBillPaymentId?.status === "success"
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700"
            }`}>
            {booking.finalBillPaymentId?.status || "pending"}
          </span>
        </div>

        {/* Tables */}
        <div className="bg-white p-5 rounded-xl shadow border">
          <p className="text-sm text-gray-500">Tables</p>
          <div className="flex gap-2 mt-2 flex-wrap">
            {booking.allocatedTables?.tableNumbers?.length ? (
              booking.allocatedTables.tableNumbers.map((t, i) => (
                <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 rounded">
                  {t}
                </span>
              ))
            ) : (
              <span className="text-gray-400 text-sm">Not assigned</span>
            )}
          </div>
        </div>

      </div>



      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT SIDE */}
        <div className="lg:col-span-2 space-y-6">

          {/* OFFER */}
          {booking.offer && (
            <div className="bg-white p-6 rounded-xl shadow border">
              <h2 className="font-semibold text-lg mb-3">Offer Applied</h2>

              <p className="font-medium">{booking.offer.offerName}</p>
              <p className="text-sm text-gray-500 mb-3">
                {booking.offer.offerDescription}
              </p>

              <div className="flex justify-between text-sm">
                <span>Restaurant Contribution</span>
                <span>{booking.offer.restaurantOfferPercentageOnBill}%</span>
              </div>

              <div className="flex justify-between text-sm">
                <span>Admin Contribution</span>
                <span>{booking.offer.adminOfferPercentageOnBill}%</span>
              </div>
            </div>
          )}

          {/* BILL BREAKDOWN */}
          <div className="bg-white p-6 rounded-xl shadow border">
            <h2 className="font-semibold text-lg mb-4">Bill Breakdown</h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Original Bill</span>
                <span>₹{booking.finalBillPaidBreakdown.originalFinalBill}</span>
              </div>

              <div className="flex justify-between text-red-500">
                <span>Restaurant Discount</span>
                <span>-₹{booking.finalBillPaidBreakdown.restaurantDiscount}</span>
              </div>

              <div className="flex justify-between text-red-500">
                <span>Admin Discount</span>
                <span>-₹{booking.finalBillPaidBreakdown.adminDiscount}</span>
              </div>

              <div className="flex justify-between text-green-600">
                <span>Cover Used</span>
                <span>-₹{booking.finalBillPaidBreakdown.coverChargesDeducted}</span>
              </div>

              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Final Paid</span>
                <span>₹{booking.finalBillPaidBreakdown.discountedFinalBill}</span>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT SIDE */}
        <div className="space-y-6">

          {/* PAYMENT BREAKDOWN */}
          <div className="bg-white p-6 rounded-xl shadow border">
            <h2 className="font-semibold mb-3">Payment Breakdown</h2>

            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span>Received</span>
                <span>₹{booking.paymentBreakdown.receivedAmount}</span>
              </div>

              <div className="flex justify-between">
                <span>Commission ({booking.paymentBreakdown.commissionPercentage}%)</span>
                <span>₹{booking.paymentBreakdown.commissionAmount}</span>
              </div>

              <div className="flex justify-between font-semibold">
                <span>Restaurant Share</span>
                <span>₹{booking.paymentBreakdown.restaurantShare}</span>
              </div>
            </div>
          </div>

          {/* SETTLEMENT */}
          <div className="bg-white p-6 rounded-xl shadow border">
            <h2 className="font-semibold mb-3">Settlement</h2>

            <span className="px-3 py-1 rounded bg-green-100 text-green-700 text-sm">
              {booking.settlement.status}
            </span>

            <div className="mt-3 text-sm space-y-2">
              <div className="flex justify-between">
                <span>Restaurant Earn</span>
                <span>₹{booking.settlement.restaurantEarn}</span>
              </div>

              <div className="flex justify-between">
                <span>Admin Commission</span>
                <span>₹{booking.settlement.adminCommissionAmount}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );




};

export default TableBookingDetailPage;