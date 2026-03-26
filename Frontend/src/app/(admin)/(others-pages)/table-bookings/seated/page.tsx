"use client";
import React, { useState, useEffect, useCallback } from "react";
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

// Utility function to convert YYYY-MM-DD to DD/MM/YY
const formatDateToDDMMYY = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString().slice(-2);
  return `${day}/${month}/${year}`;
};

// Utility function to convert DD/MM/YY to YYYY-MM-DD
const formatDateToYYYYMMDD = (dateStr: string): string => {
  if (!dateStr) return '';
  const [day, month, year] = dateStr.split('/');
  const fullYear = year.length === 2 ? `20${year}` : year;
  return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

// Utility function to convert YYYY-MM-DD to DD/MM/YY for display
const convertToDisplayFormat = (dateStr: string): string => {
  if (!dateStr) return '';
  return formatDateToDDMMYY(dateStr);
};

// Utility function to convert DD/MM/YY to YYYY-MM-DD for input
const convertToInputFormat = (dateStr: string): string => {
  if (!dateStr) return '';
  return formatDateToYYYYMMDD(dateStr);
};

// Get available status transitions based on current status
const getAvailableStatuses = (currentStatus: string) => {
  const statusFlow = {
    'pending': ['pending', 'confirmed', 'cancelled'],
    'confirmed': ['confirmed', 'arrived', 'notArrived', 'cancelled'],
    'arrived': ['arrived', 'seated'],
    'seated': ['seated', 'completed'],
    'notArrived': ['notArrived', 'arrived', 'cancelled'],
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

interface TimeSlot {
  _id: string;
  time: string;
  status: boolean;
}

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
  allocatedTables?: {
    tableNumbers: string[];
    allocatedAt: string;
  };
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

const SeatedTableBookings = () => {
  const [bookings, setBookings] = useState<TableBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10
  });
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusConfirm, setStatusConfirm] = useState<{ show: boolean, bookingId: string, bookingNo: string, currentStatus: string, newStatus: string }>({ show: false, bookingId: '', bookingNo: '', currentStatus: '', newStatus: '' });
  const [showCancelModal, setShowCancelModal] = useState<{ show: boolean, bookingId: string, bookingNo: string }>({ show: false, bookingId: '', bookingNo: '' });
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  // Filter states
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [filters, setFilters] = useState({
    slot: '',
    startDate: '',
    endDate: '',
    search: ''
  });
  const [displayDates, setDisplayDates] = useState({
    startDate: '',
    endDate: ''
  });

  // Debounced search
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  const fetchSeatedBookings = async (page: number = pagination.currentPage, limit: number = pagination.limit, applyFilters: boolean = false) => {
    try {
      setLoading(true);
      const params: any = { page, limit };
      
      // Apply filters if they exist and applyFilters is true
      if (applyFilters) {
        if (filters.search) {
          params.search = filters.search;
        }
        if (filters.slot) {
          params.slot = filters.slot;
        }
        if (filters.startDate || filters.endDate) {
          params.date = JSON.stringify({
            startDate: filters.startDate ? filters.startDate : undefined,
            endDate: filters.endDate ? filters.endDate : undefined
          });
        }
      }
      
      const { data } = await axiosInstance.get('/api/restaurants/table-bookings/seated', {
        params
      });
      
      if (data.success) {
        setBookings(data.data.bookings);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching seated table bookings:', error);
      toast.error('Error fetching seated table bookings');
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeSlots = async () => {
    try {
      const { data } = await axiosInstance.get('/api/restaurants/table-booking');
      if (data.timeSlots?.timeSlots) {
        setAvailableSlots(data.timeSlots.timeSlots.filter((slot: TimeSlot) => slot.status));
      }
    } catch (error) {
      console.error('Error fetching time slots:', error);
    }
  };

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Update filters when debounced search term changes
  useEffect(() => {
    setFilters(prev => ({ ...prev, search: debouncedSearchTerm }));
  }, [debouncedSearchTerm]);

  // Fetch bookings when filters change
  useEffect(() => {
    const hasActiveFilters = filters.search || filters.slot || filters.startDate || filters.endDate;
    if (hasActiveFilters) {
      fetchSeatedBookings(1, pagination.limit, true);
    }
  }, [filters.search, filters.slot, filters.startDate, filters.endDate]);

  useEffect(() => {
    fetchSeatedBookings();
    fetchTimeSlots();
  }, []);

  const handlePageChange = (page: number) => {
    const hasActiveFilters = filters.search || filters.slot || filters.startDate || filters.endDate;
    fetchSeatedBookings(page, pagination.limit, hasActiveFilters);
  };

  const handleLimitChange = (limit: number) => {
    const hasActiveFilters = filters.search || filters.slot || filters.startDate || filters.endDate;
    fetchSeatedBookings(1, limit, hasActiveFilters);
  };

  const handleFilterChange = (filterType: 'search' | 'slot' | 'startDate' | 'endDate', value: string) => {
    if (filterType === 'search') {
      setSearchTerm(value);
      return;
    }
    
    if (filterType === 'startDate' || filterType === 'endDate') {
      // Update both internal filter (YYYY-MM-DD) and display format (DD/MM/YY)
      const newFilters = { ...filters, [filterType]: value };
      const newDisplayDates = { ...displayDates, [filterType]: convertToDisplayFormat(value) };
      
      setFilters(newFilters);
      setDisplayDates(newDisplayDates);
    } else {
      const newFilters = { ...filters, [filterType]: value };
      setFilters(newFilters);
    }
  };

  const applyFiltersWithValues = (filterValues = filters) => {
    const params: any = { page: 1, limit: pagination.limit };
    
    if (filterValues.search) {
      params.search = filterValues.search;
    }
    if (filterValues.slot) {
      params.slot = filterValues.slot;
    }
    if (filterValues.startDate || filterValues.endDate) {
      params.date = JSON.stringify({
        startDate: filterValues.startDate ? filterValues.startDate : undefined,
        endDate: filterValues.endDate ? filterValues.endDate : undefined
      });
    }
    
    setLoading(true);
    axiosInstance.get('/api/restaurants/table-bookings/seated', { params })
      .then(({ data }) => {
        if (data.success) {
          setBookings(data.data.bookings);
          setPagination(data.data.pagination);
        }
      })
      .catch((error) => {
        console.error('Error fetching filtered bookings:', error);
        toast.error('Error fetching filtered bookings');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const clearFilters = () => {
    setFilters({ slot: '', startDate: '', endDate: '', search: '' });
    setDisplayDates({ startDate: '', endDate: '' });
    setSearchTerm('');
    setDebouncedSearchTerm('');
    // Fetch all data without any filters
    fetchSeatedBookings(1, pagination.limit, false);
  };

  const hasActiveFilters = filters.search || filters.slot || filters.startDate || filters.endDate;

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
        case 'notArrived':
          response = await tableBookingApi.updateToDidNotArrive(bookingId);
          break;
        default:
          throw new Error(`Invalid status update: ${newStatus}`);
      }

      console.log('API Response:', response);

      if (response.success) {
        toast.success(`Booking status updated to ${newStatus === 'notArrived' ? 'not arrived' : newStatus}`);
        fetchSeatedBookings(); // Refresh the bookings list
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
        fetchSeatedBookings(); // Refresh the bookings list
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Seated Table Bookings</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage bookings where customers are seated</p>
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Seated Table Bookings</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage bookings where customers are seated</p>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex flex-wrap justify-between items-end gap-4">
          {/* Search */}
          <div className="w-128">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search by table number, customer name, or phone..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-4">
            {/* Slot Filter */}
            <div className="w-40">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Time Slot
              </label>
              <select
                value={filters.slot}
                onChange={(e) => handleFilterChange('slot', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
              >
                <option value="">All Slots</option>
                {availableSlots.map((slot) => (
                  <option key={slot._id} value={slot.time}>
                    {formatTimeTo12Hour(slot.time)}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date Filter */}
            <div className="w-40">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  onClick={(e) => e.target.showPicker()}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm opacity-0 absolute inset-0 cursor-pointer"
                />
                <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm pointer-events-none">
                  {displayDates.startDate || 'Select date'}
                </div>
              </div>
            </div>

            {/* End Date Filter */}
            <div className="w-40">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  onClick={(e) => e.target.showPicker()}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm opacity-0 absolute inset-0 cursor-pointer"
                />
                <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm pointer-events-none">
                  {displayDates.endDate || 'Select date'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Results Count and Records Per Page */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing {bookings.length} of {pagination.totalCount} seated bookings
          {hasActiveFilters && (
            <span className="ml-2 text-blue-600 dark:text-blue-400">
              (filtered)
            </span>
          )}
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
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <TableProperties className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No Seated Table Bookings Found
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        There are currently no bookings where customers are seated.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900 dark:text-white">
                      #{booking.tableBookingNo}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{booking.userId.fullName}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{booking.userId.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{convertToDisplayFormat(booking.bookingTimings.date)}</div>
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
                      {!['completed', 'cancelled'].includes(booking.status) ? (
                        <select
                          value={booking.status}
                          onChange={(e) => handleStatusChange(booking._id, booking.tableBookingNo.toString(), booking.status, e.target.value)}
                          disabled={updatingStatus}
                          className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white min-w-[120px]"
                        >
                          {getAvailableStatuses(booking.status).map(status => (
                            <option key={status} value={status} className="capitalize">
                              {status === 'notArrived' ? 'Not Arrived' : status}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                          {booking.status === 'notArrived' ? 'Not Arrived' : booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-white">
                      {booking.allocatedTables && booking.allocatedTables.tableNumbers && booking.allocatedTables.tableNumbers.length > 0 ? (
                        booking.allocatedTables.tableNumbers.join(', ')
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">Not Allocated</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center">
                        <Link
                          href={`/table-bookings/detail/${booking._id}`}
                          className="inline-flex items-center justify-center w-8 h-8 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
                          title="View Booking Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
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

export default SeatedTableBookings;