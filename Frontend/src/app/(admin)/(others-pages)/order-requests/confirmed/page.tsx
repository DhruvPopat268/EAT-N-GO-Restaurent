"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/utils/axiosConfig';
import { toast } from '@/utils/toast';
import Pagination from '@/components/tables/Pagination';
import { formatDateTime } from '@/utils/dateUtils';
import { useSocket } from '@/context/SocketContext';
import { useNotification } from '@/context/NotificationContext';
import { playNotificationSound } from '@/utils/soundUtils';
import { useOrderNotifications } from '@/hooks/useOrderNotifications';
import { useOrderRequestNotifications } from '@/hooks/useOrderRequestNotifications';

interface Reason {
  _id: string;
  reasonType: 'waiting' | 'rejected' | 'cancelled';
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
  eatTimings?: {
    startTime: string;
    endTime: string;
  };
  takeawayTimings?: {
    startTime: string;
    endTime: string;
  };
  waitingTime?: {
    startTime: string;
    endTime: string;
  };
  cartTotal: number;
  statusUpdatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export default function ConfirmedOrderRequests() {
  const [orders, setOrders] = useState<OrderRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0
  });
  const [showCancelModal, setShowCancelModal] = useState<{show: boolean, orderId: string}>({show: false, orderId: ''});
  const [reasons, setReasons] = useState<Reason[]>([]);
  const [selectedReason, setSelectedReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [orderTypeFilter, setOrderTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const router = useRouter();
  
  // Socket integration for notifications
  const { socket, isConnected } = useSocket();
  const { showNotification } = useNotification();

  // Add order notifications
  useOrderNotifications("Confirmed Order Requests");
  useOrderRequestNotifications("Confirmed Order Requests");

  // Direct socket listener for notifications
  useEffect(() => {
    if (!socket || !isConnected) {
      console.log('📱 Confirmed Orders page: Socket not ready', { socket: !!socket, isConnected });
      return;
    }

    const handleNewOrder = (orderData: any) => {
      const timestamp = new Date().toLocaleString();
      console.log(`🔔 [${timestamp}] CONFIRMED ORDERS PAGE - New order received:`, {
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
        
        // Add to confirmed orders list if on page 1 and status is confirmed
        if (pagination.page === 1 && orderData.status === 'confirmed') {
          console.log(`➕ [${timestamp}] Adding to confirmed orders list`);
          setOrders(prev => [orderData, ...prev]);
          setPagination(prev => ({ ...prev, totalCount: prev.totalCount + 1 }));
        }
      }
    };

    console.log('📱 Confirmed Orders page: Registering socket listener');
    socket.on('new-order', handleNewOrder);

    return () => {
      console.log('📱 Confirmed Orders page: Removing socket listener');
      socket.off('new-order', handleNewOrder);
    };
  }, [socket, isConnected, showNotification, pagination.page]);

  useEffect(() => {
    fetchOrders(1);
  }, [search, orderTypeFilter, startDate, endDate]);

  const fetchOrders = async (page: number = pagination.page, limit: number = pagination.limit) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      
      if (search) params.append('search', search);
      if (orderTypeFilter) params.append('orderType', orderTypeFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await axiosInstance.get(`/api/restaurants/order-requests/confirmed?${params.toString()}`);
      setOrders(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('Failed to fetch confirmed orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchReasons = async () => {
    try {
      const response = await axiosInstance.get(`/api/restaurants/order-requests/active-reasons?reasonType=cancelled`);
      setReasons(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch reasons');
    }
  };

  const handleCancelOrder = async () => {
    if (!selectedReason) {
      toast.error('Please select a reason');
      return;
    }
    setActionLoading(true);
    try {
      const payload = { orderReqId: showCancelModal.orderId, orderReqReasonId: selectedReason };
      const response = await axiosInstance.patch(`/api/restaurants/order-requests/cancel`, payload);
      toast.success(response.data.message || 'Order cancelled successfully');
      fetchOrders(pagination.page, pagination.limit);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    } finally {
      setActionLoading(false);
      setShowCancelModal({show: false, orderId: ''});
      setSelectedReason('');
    }
  };

  const openCancelModal = async (orderId: string) => {
    await fetchReasons();
    setShowCancelModal({show: true, orderId});
  };

  const handlePageChange = (page: number) => {
    fetchOrders(page, pagination.limit);
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Confirmed Order Requests</h1>
        <p className="text-gray-600 dark:text-gray-400">Orders that have been confirmed</p>
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
        {(search || orderTypeFilter || startDate || endDate) && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                setSearch('');
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
                    {order.waitingTime ? `${order.waitingTime.startTime} - ${order.waitingTime.endTime}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Confirmed
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white text-center">
                    ₹{order.cartTotal}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-center">
                    <div>{formatDateTime(order.createdAt).date}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{formatDateTime(order.createdAt).time}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-center">
                    <div>{formatDateTime(order.updatedAt).date}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{formatDateTime(order.updatedAt).time}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                    <div className="flex items-center justify-center gap-3">
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
                      <button
                        onClick={() => openCancelModal(order._id)}
                        className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300 p-1"
                        title="Cancel Order"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {orders.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">No confirmed orders found</p>
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

      {/* Cancel Modal */}
      {showCancelModal.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Cancel Order Request
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
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCancelModal({show: false, orderId: ''});
                    setSelectedReason('');
                  }}
                  disabled={actionLoading}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Close
                </button>
                <button
                  onClick={handleCancelOrder}
                  disabled={actionLoading || !selectedReason}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                  Cancel Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}