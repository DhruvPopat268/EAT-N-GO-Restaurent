"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/utils/axiosConfig';
import { toast } from '@/utils/toast';
import Pagination from '@/components/tables/Pagination';
import { formatDateTime } from '@/utils/dateUtils';
import { usePageOrderSocket } from '@/hooks/usePageOrderSocket';
import { useSocket } from '@/context/SocketContext';
import { useNotification } from '@/context/NotificationContext';
import { playNotificationSound } from '@/utils/soundUtils';
import { useOrderNotifications } from '@/hooks/useOrderNotifications';
import { useOrderRequestNotifications } from '@/hooks/useOrderRequestNotifications';

interface Reason {
  _id: string;
  reasonType: 'waiting' | 'rejected';
  reasonText: string;
}

interface OrderRequest {
  _id: string;
  orderRequestNo: number;
  userId: {
    fullName: string;
    phone: string;
  };
  orderType: string;
  status: string;
  items: any[];
  eatTimings?: {
    startTime: string;
    endTime: string;
  };
  takeawayTimings?: {
    startTime: string;
    endTime: string;
  };
  cartTotal: number;
  cancelledBy?: string;
  statusUpdatedBy?: string;
  createdAt: string;
  updatedAt: string;
  waitingTime?: number;
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export default function AllOrderRequests() {
  const [orders, setOrders] = useState<OrderRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0
  });
  const [showConfirmModal, setShowConfirmModal] = useState<{show: boolean, orderId: string, action: string}>({show: false, orderId: '', action: ''});
  const [showReasonModal, setShowReasonModal] = useState<{show: boolean, orderId: string, action: 'waiting' | 'reject' | 'cancel'}>({show: false, orderId: '', action: 'waiting'});
  const [reasons, setReasons] = useState<Reason[]>([]);
  const [selectedReason, setSelectedReason] = useState('');
  const [waitingMinutes, setWaitingMinutes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [orderTypeFilter, setOrderTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const router = useRouter();
  
  // Socket integration for notifications
  const { socket, isConnected } = useSocket();
  const { showNotification } = useNotification();

  // Add order notifications
  useOrderNotifications("All Order Requests");
  useOrderRequestNotifications("All Order Requests");

  // Direct socket listener for notifications
  useEffect(() => {
    if (!socket || !isConnected) {
      console.log('📱 All Orders page: Socket not ready', { socket: !!socket, isConnected });
      return;
    }

    const handleNewOrder = (orderData: any) => {
      const timestamp = new Date().toLocaleString();
      console.log(`🔔 [${timestamp}] ALL ORDERS PAGE - New order received:`, {
        orderId: orderData._id,
        orderNo: orderData.orderRequestNo || orderData.orderNo,
        customer: orderData.userId?.fullName || 'Unknown',
        status: orderData.status
      });
      
      // Show notification for waiting or confirmed orders
      if (orderData.status === 'waiting' || orderData.status === 'confirmed') {
        // Play sound
        console.log(`🔊 [${timestamp}] Playing sound for ${orderData.status} order...`);
        playNotificationSound('new-order');
        
        // Show notification
        console.log(`📱 [${timestamp}] Showing notification for ${orderData.status} order...`);
        showNotification({
          id: orderData._id,
          orderNo: orderData.orderRequestNo || orderData.orderNo,
          customerName: orderData.userId?.fullName || 'Unknown',
          orderType: orderData.orderType,
          totalAmount: orderData.cartTotal || orderData.totalAmount,
          itemsCount: orderData.items?.length || 0,
          timestamp: new Date().toISOString()
        });
      }
    };

    console.log('📱 All Orders page: Registering socket listener');
    socket.on('new-order', handleNewOrder);

    return () => {
      console.log('📱 All Orders page: Removing socket listener');
      socket.off('new-order', handleNewOrder);
    };
  }, [socket, isConnected, showNotification]);

  // Socket integration for real-time updates
  usePageOrderSocket((newOrder) => {
    const timestamp = new Date().toLocaleString();
    console.log(`📝 [${timestamp}] Order page received new order:`, {
      orderId: newOrder._id,
      orderNo: newOrder.orderRequestNo,
      customer: newOrder.userId?.fullName,
      currentPage: pagination.page
    });
    
    // Add new order to the list if we're on page 1
    if (pagination.page === 1) {
      console.log(`➕ [${timestamp}] Adding new order to orders list (page 1)`);
      setOrders(prev => [newOrder, ...prev]);
      setPagination(prev => ({ ...prev, totalCount: prev.totalCount + 1 }));
      console.log(`✅ [${timestamp}] Order added to list, total count updated`);
    } else {
      console.log(`📊 [${timestamp}] Not adding to list (not on page 1, current page: ${pagination.page})`);
    }
  });

  useEffect(() => {
    fetchOrders(1);
  }, [search, statusFilter, orderTypeFilter, startDate, endDate]);

  const fetchOrders = async (page: number = pagination.page, limit: number = pagination.limit) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (orderTypeFilter) params.append('orderType', orderTypeFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await axiosInstance.get(`/api/restaurants/order-requests/all?${params.toString()}`);
      setOrders(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    fetchOrders(page, pagination.limit);
  };

  const fetchReasons = async (reasonType: 'waiting' | 'reject' | 'cancel') => {
    try {
      const apiReasonType = reasonType === 'reject' ? 'rejected' : reasonType === 'cancel' ? 'cancelled' : reasonType;
      const response = await axiosInstance.get(`/api/restaurants/order-requests/active-reasons?reasonType=${apiReasonType}`);
      setReasons(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch reasons');
    }
  };

  const updateOrderStatus = async (orderId: string, action: string, reasonId?: string) => {
    setActionLoading(true);
    try {
      const payload: any = { orderReqId: orderId };
      if (reasonId) payload.orderReqReasonId = reasonId;
      if (action === 'waiting' && waitingMinutes) payload.waitingTime = parseInt(waitingMinutes);
      
      console.log('Making API call with payload:', payload);
      const response = await axiosInstance.patch(`/api/restaurants/order-requests/${action}`, payload);
      console.log('API response:', response.data);
      
      if (response.data.message) {
        console.log('Calling toast.success with:', response.data.message);
        toast.success(response.data.message);
      } else {
        console.log('Calling toast.success with fallback');
        toast.success(`Order ${action}ed successfully`);
      }
      fetchOrders(pagination.page, pagination.limit);
    } catch (error: any) {
      console.error('Error updating order status:', error);
      if (error.response?.data?.message) {
        console.log('Calling toast.error with:', error.response.data.message);
        toast.error(error.response.data.message);
      } else {
        console.log('Calling toast.error with fallback');
        toast.error(`Failed to ${action} order`);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmAction = async () => {
    await updateOrderStatus(showConfirmModal.orderId, showConfirmModal.action);
    
    // Close modal after a small delay to ensure toast shows
    setTimeout(() => {
      setShowConfirmModal({show: false, orderId: '', action: ''});
    }, 200);
  };

  const handleReasonAction = async () => {
    if (!selectedReason) {
      toast.error('Please select a reason');
      return;
    }
    if (showReasonModal.action === 'waiting' && !waitingMinutes) {
      toast.error('Please enter waiting time in minutes');
      return;
    }
    
    await updateOrderStatus(showReasonModal.orderId, showReasonModal.action, selectedReason);
    
    // Close modal after a small delay to ensure toast shows
    setTimeout(() => {
      setShowReasonModal({show: false, orderId: '', action: 'waiting'});
      setSelectedReason('');
      setWaitingMinutes('');
    }, 200);
  };

  const openConfirmModal = (orderId: string, action: string) => {
    setShowConfirmModal({show: true, orderId, action});
  };

  const openReasonModal = async (orderId: string, action: 'waiting' | 'reject' | 'cancel') => {
    await fetchReasons(action);
    setShowReasonModal({show: true, orderId, action});
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'waiting': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">All Order Requests</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage all order requests</p>
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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer name, phone, or order number..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-4">
            {/* Status Filter */}
            <div className="w-40">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="rejected">Rejected</option>
                <option value="waiting">Waiting</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Order Type Filter */}
            <div className="w-40">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Order Type
              </label>
              <select
                value={orderTypeFilter}
                onChange={(e) => setOrderTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
              >
                <option value="">All Types</option>
                <option value="dine-in">Dine In</option>
                <option value="takeaway">Takeaway</option>
              </select>
            </div>

            {/* Start Date */}
            <div className="w-40">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
              />
            </div>

            {/* End Date */}
            <div className="w-40">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
              />
            </div>
          </div>
        </div>

        {/* Clear Filters */}
        {(search || statusFilter || orderTypeFilter || startDate || endDate) && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('');
                setOrderTypeFilter('');
                setStartDate('');
                setEndDate('');
              }}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mb-4 flex justify-between items-center">
        {pagination.totalCount > 0 && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of {pagination.totalCount} orders
          </p>
        )}
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Show</span>
          <select
            value={pagination.limit}
            onChange={(e) => {
              const newLimit = parseInt(e.target.value);
              setPagination(prev => ({ ...prev, limit: newLimit }));
              fetchOrders(1, newLimit);
            }}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-sm text-gray-600 dark:text-gray-400">entries</span>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Order No
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  User Info
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Order Type
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Items Count
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Timings
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Waiting Time
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Order Req Total
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Cancelled By
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Created At
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Updated At
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {orders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white text-center">
                    #{order.orderRequestNo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-sm text-gray-900 dark:text-white">{order.userId.fullName}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{order.userId.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white capitalize text-center">
                    {order.orderType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-center">
                    {order.items?.length || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-center">
                    {order.eatTimings && (
                      <div>{order.eatTimings.startTime} - {order.eatTimings.endTime}</div>
                    )}
                    {order.takeawayTimings && (
                      <div>{order.takeawayTimings.startTime} - {order.takeawayTimings.endTime}</div>
                    )}
                    {!order.eatTimings && !order.takeawayTimings && (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-center">
                    {order.waitingTime && order.waitingTime > 0 ? `${order.waitingTime} min` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white text-center">
                    ₹{order.cartTotal}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-center">
                    {order.cancelledBy || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-center">
                    <div>{formatDateTime(order.createdAt).date}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{formatDateTime(order.createdAt).time}</div>
                  </td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-center">
                    <div>{formatDateTime(order.updatedAt).date}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{formatDateTime(order.updatedAt).time}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2 text-center">
                    <button
                      onClick={() => router.push(`/order-requests/detail/${order._id}`)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1"
                      title="View Details"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    {order.status === 'pending' && (
                      <>
                        <button
                          onClick={() => openConfirmModal(order._id, 'confirm')}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 p-1"
                          title="Confirm Order"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <button
                          onClick={() => openReasonModal(order._id, 'waiting')}
                          className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300 p-1"
                          title="Set Waiting"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <button
                          onClick={() => openReasonModal(order._id, 'reject')}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1"
                          title="Reject Order"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </>
                    )}
                    {(order.status === 'pending' || order.status === 'confirmed' || order.status === 'waiting') && (
                      <button
                        onClick={() => openReasonModal(order._id, 'cancel')}
                        className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300 p-1"
                        title="Cancel Order"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {orders.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">No orders found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-6 flex justify-end">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirmModal.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Confirm Order Request
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to confirm this order request?
              </p>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal({show: false, orderId: '', action: ''})}
                  disabled={actionLoading}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAction}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reason Modal */}
      {showReasonModal.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {showReasonModal.action === 'waiting' ? 'Set Order to Waiting' : showReasonModal.action === 'cancel' ? 'Cancel Order Request' : 'Reject Order Request'}
              </h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Reason
                </label>
                <select
                  value={selectedReason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="">Select a reason</option>
                  {reasons.map((reason) => (
                    <option key={reason._id} value={reason._id}>
                      {reason.reasonText}
                    </option>
                  ))}
                </select>
              </div>
              {showReasonModal.action === 'waiting' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Waiting Time (Minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={waitingMinutes}
                    onChange={(e) => setWaitingMinutes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter waiting time in minutes"
                    required
                  />
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowReasonModal({show: false, orderId: '', action: 'waiting'});
                    setSelectedReason('');
                    setWaitingMinutes('');
                  }}
                  disabled={actionLoading}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReasonAction}
                  disabled={actionLoading || !selectedReason || (showReasonModal.action === 'waiting' && !waitingMinutes)}
                  className={`px-4 py-2 text-white rounded-lg disabled:opacity-50 flex items-center gap-2 ${
                    showReasonModal.action === 'waiting' ? 'bg-yellow-600 hover:bg-yellow-700' : showReasonModal.action === 'cancel' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {actionLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                  {showReasonModal.action === 'waiting' ? 'Set Waiting' : showReasonModal.action === 'cancel' ? 'Cancel' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}