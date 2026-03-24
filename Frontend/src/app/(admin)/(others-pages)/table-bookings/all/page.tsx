"use client";
import React, { useState, useEffect } from "react";
import Pagination from "@/components/tables/Pagination";
import axiosInstance from "@/utils/axiosConfig";
import { toast } from "@/utils/toast";
import { Eye, TableProperties } from "lucide-react";
import Link from "next/link";

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

// Get available status transitions based on current status
const getAvailableStatuses = (currentStatus: string) => {
  const statusFlow = {
    'pending': ['pending', 'cancelled'], // Removed 'confirmed' since no API route exists
    'confirmed': ['confirmed', 'arrived', 'didNotArrived', 'cancelled'],
    'arrived': ['arrived', 'seated'],
    'seated': ['seated', 'completed'],
    'didNotArrived': ['didNotArrived', 'cancelled'],
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

interface TableBooking {
  _id: string;
  tableBookingNo: number;
  userId: UserInfo;
  bookingTimings: BookingTimings;
  numberOfGuests: number;
  coverCharges: number;
  coverChargePaymentStatus: string;
  status: string;
  allocatedTables: any[];
  currency?: {
    code: string;
    name: string;
    symbol: string;
  };
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
}

const AllTableBookings = () => {
  const [bookings, setBookings] = useState<TableBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10
  });
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<TableBooking | null>(null);
  const [tableNumbers, setTableNumbers] = useState<string[]>(['']);
  const [allocating, setAllocating] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusConfirm, setStatusConfirm] = useState<{ show: boolean, bookingId: string, bookingNo: string, currentStatus: string, newStatus: string }>({ show: false, bookingId: '', bookingNo: '', currentStatus: '', newStatus: '' });
  const [showCancelModal, setShowCancelModal] = useState<{ show: boolean, bookingId: string, bookingNo: string }>({ show: false, bookingId: '', bookingNo: '' });
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchBookings = async (page: number = pagination.currentPage, limit: number = pagination.limit) => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get('/api/restaurants/table-bookings', {
        params: { page, limit }
      });
      
      if (data.success) {
        setBookings(data.data.bookings);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching table bookings:', error);
      toast.error('Error fetching table bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handlePageChange = (page: number) => {
    fetchBookings(page, pagination.limit);
  };

  const handleLimitChange = (limit: number) => {
    fetchBookings(1, limit);
  };



  const handleAllocateTable = (booking: TableBooking) => {
    setSelectedBooking(booking);
    // Initialize table inputs based on number of guests (at least 1, max based on guests)
    const initialTables = Math.max(1, Math.ceil(booking.numberOfGuests / 4)); // Assuming 4 guests per table
    setTableNumbers(Array(initialTables).fill(''));
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
    
    // Filter out empty table numbers
    const validTableNumbers = tableNumbers.filter(num => num.trim() !== '');
    
    if (validTableNumbers.length === 0) {
      toast.error('Please enter at least one table number');
      return;
    }

    // Check for duplicate table numbers
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
        toast.success('Tables allocated successfully');
        setShowAllocateModal(false);
        setSelectedBooking(null);
        setTableNumbers(['']);
        fetchBookings(); // Refresh the bookings list
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
        case 'arrived':
          response = await tableBookingApi.updateToArrived(bookingId);
          break;
        case 'seated':
          response = await tableBookingApi.updateToSeated(bookingId);
          break;
        case 'completed':
          response = await tableBookingApi.updateToCompleted(bookingId);
          break;
        case 'didNotArrived':
          response = await tableBookingApi.updateToDidNotArrive(bookingId);
          break;
        default:
          throw new Error(`Invalid status update: ${newStatus}`);
      }

      console.log('API Response:', response);

      if (response.success) {
        toast.success(`Booking status updated to ${newStatus === 'didNotArrived' ? 'did not arrive' : newStatus}`);
        // Update the booking in the list
        setBookings(prevBookings => 
          prevBookings.map(booking => 
            booking._id === bookingId ? { ...booking, status: newStatus } : booking
          )
        );
      } else {
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
        // Update the booking in the list
        setBookings(prevBookings => 
          prevBookings.map(booking => 
            booking._id === showCancelModal.bookingId ? { ...booking, status: 'cancelled' } : booking
          )
        );
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
      case 'didNotArrived':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">All Table Bookings</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage all table bookings</p>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">All Table Bookings</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage all table bookings</p>
      </div>

      {/* Results Count and Records Per Page */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing {bookings.length} of {pagination.totalCount} bookings
        </p>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 dark:text-gray-400">Records per page:</label>
          <select
            value={pagination.limit}
            onChange={(e) => handleLimitChange(parseInt(e.target.value))}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Booking No
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  User Info
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Booking Timings
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Guests
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Cover Charges
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Payment Status
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Allocated Tables
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {bookings.map((booking) => (
                <tr key={booking._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900 dark:text-white">
                    #{booking.tableBookingNo}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{booking.userId.fullName}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{booking.userId.phone}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{booking.bookingTimings.date}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{formatTimeTo12Hour(booking.bookingTimings.slotTime)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-white">
                    {booking.numberOfGuests}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-white">
                    {booking.currency?.symbol || '₹'}{booking.coverCharges}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      booking.coverChargePaymentStatus === 'paid' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                        : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                    }`}>
                      {booking.coverChargePaymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {booking.status === 'pending' ? (
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    ) : !['completed', 'cancelled'].includes(booking.status) ? (
                      <select
                        value={booking.status}
                        onChange={(e) => handleStatusChange(booking._id, booking.tableBookingNo.toString(), booking.status, e.target.value)}
                        disabled={updatingStatus}
                        className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white min-w-[120px]"
                      >
                        {getAvailableStatuses(booking.status).map(status => (
                          <option key={status} value={status} className="capitalize">
                            {status === 'didNotArrived' ? 'Did Not Arrive' : status}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                        {booking.status === 'didNotArrived' ? 'Did Not Arrive' : booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-white">
                    {booking.allocatedTables && booking.allocatedTables.length > 0 ? (
                      booking.allocatedTables.map(allocation => allocation.tableNumbers).flat().join(' , ')
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400">Not Allocated</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex justify-center space-x-2">
                      <Link
                        href={`/table-bookings/detail/${booking._id}`}
                        className="inline-flex items-center justify-center w-8 h-8 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
                        title="View Booking Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleAllocateTable(booking)}
                        disabled={booking.status !== 'pending'}
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                          booking.status === 'pending'
                            ? 'text-green-600 hover:text-green-800 hover:bg-green-100 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/20'
                            : 'text-gray-400 cursor-not-allowed dark:text-gray-600'
                        }`}
                        title={booking.status === 'pending' ? 'Assign Table' : 'Can only allocate tables for pending bookings'}
                      >
                        <TableProperties className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-end mt-6">
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Allocate Tables Modal */}
      {showAllocateModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md shadow-xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Allocate Tables
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
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Booking Details
                </h3>
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
                    <span className="font-medium">Date & Time:</span> {selectedBooking.bookingTimings.date} at {formatTimeTo12Hour(selectedBooking.bookingTimings.slotTime)}
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
                
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Recommended: {Math.ceil(selectedBooking.numberOfGuests / 4)} table(s) for {selectedBooking.numberOfGuests} guests
                </p>
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
                  Allocate Tables
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
              Are you sure you want to update status from <span className="font-semibold capitalize">{statusConfirm.currentStatus === 'didNotArrived' ? 'Did Not Arrive' : statusConfirm.currentStatus}</span> to <span className="font-semibold capitalize">{statusConfirm.newStatus === 'didNotArrived' ? 'Did Not Arrive' : statusConfirm.newStatus}</span> for booking #{statusConfirm.bookingNo}?
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

export default AllTableBookings;