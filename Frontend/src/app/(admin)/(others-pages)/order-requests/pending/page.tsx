"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/utils/axiosConfig';
import { toast } from '@/utils/toast';
import Pagination from '@/components/tables/Pagination';

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
  statusUpdatedBy?: string;
  createdAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export default function PendingOrderRequests() {
  const [orders, setOrders] = useState<OrderRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0
  });
  const [showConfirmModal, setShowConfirmModal] = useState<{show: boolean, orderId: string, action: string}>({show: false, orderId: '', action: ''});
  const [showReasonModal, setShowReasonModal] = useState<{show: boolean, orderId: string, action: 'waiting' | 'reject'}>({show: false, orderId: '', action: 'waiting'});
  const [reasons, setReasons] = useState<Reason[]>([]);
  const [selectedReason, setSelectedReason] = useState('');
  const [waitingMinutes, setWaitingMinutes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [orderTypeFilter, setOrderTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const router = useRouter();

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
      
      const response = await axiosInstance.get(`/api/restaurants/order-requests/pending?${params.toString()}`);
      setOrders(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('Failed to fetch pending orders');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    fetchOrders(page, pagination.limit);
  };

  const fetchReasons = async (reasonType: 'waiting' | 'reject') => {
    try {
      const apiReasonType = reasonType === 'reject' ? 'rejected' : reasonType;
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
      
      const response = await axiosInstance.patch(`/api/restaurants/order-requests/${action}`, payload);
      if (response.data.message) {
        toast.success(response.data.message);
      } else {
        toast.success(`Order ${action} successfully`);
      }
      fetchOrders(pagination.page, pagination.limit);
    } catch (error: any) {
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error(`Failed to ${action} order`);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmAction = () => {
    updateOrderStatus(showConfirmModal.orderId, showConfirmModal.action);
    setShowConfirmModal({show: false, orderId: '', action: ''});
  };

  const handleReasonAction = () => {
    if (!selectedReason) {
      toast.error('Please select a reason');
      return;
    }
    if (showReasonModal.action === 'waiting' && !waitingMinutes) {
      toast.error('Please enter waiting time in minutes');
      return;
    }
    updateOrderStatus(showReasonModal.orderId, showReasonModal.action, selectedReason);
    setShowReasonModal({show: false, orderId: '', action: 'waiting'});
    setSelectedReason('');
    setWaitingMinutes('');
  };

  const openConfirmModal = (orderId: string, action: string) => {
    setShowConfirmModal({show: true, orderId, action});
  };

  const openReasonModal = async (orderId: string, action: 'waiting' | 'reject') => {
    await fetchReasons(action);
    setShowReasonModal({show: true, orderId, action});
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pending Order Requests</h1>
        <p className="text-gray-600 dark:text-gray-400">Orders waiting for approval</p>
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
    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 table-fixed">
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
            
            {/* Order No */}
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white text-center">
              #{order.orderRequestNo}
            </td>

            {/* User Info */}
            <td className="px-6 py-4 whitespace-nowrap text-center">
              <div className="text-sm text-gray-900 dark:text-white">
                {order.userId.fullName}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {order.userId.phone}
              </div>
            </td>

            {/* Order Type */}
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white capitalize text-center">
              {order.orderType}
            </td>

            {/* Items Count */}
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-center">
              {order.items?.length || 0}
            </td>

            {/* Timings */}
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

            {/* Waiting Time */}
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-center">
              {order.waitingTime && order.waitingTime > 0 ? `${order.waitingTime} min` : '-'}
            </td>

            {/* Status */}
            <td className="px-6 py-4 whitespace-nowrap text-center">
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                Pending
              </span>
            </td>

            {/* Total */}
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white text-center">
              ₹{order.cartTotal}
            </td>

            {/* Created At */}
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-center">
              {order.createdAt}
            </td>

            {/* Updated At */}
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-center">
              {order.updatedAt}
            </td>

            {/* Actions */}
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
              <div className="flex items-center justify-center gap-3">

                {/* View */}
                <button
                  onClick={() => router.push(`/order-requests/detail/${order._id}`)}
                  className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                  title="View Details"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                </button>

                {/* Confirm */}
                <button
                  onClick={() => openConfirmModal(order._id, 'confirm')}
                  className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                  title="Confirm Order"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>

                {/* Waiting */}
                <button
                  onClick={() => openReasonModal(order._id, 'waiting')}
                  className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300"
                  title="Set Waiting"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </button>

                {/* Reject */}
                <button
                  onClick={() => openReasonModal(order._id, 'reject')}
                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                  title="Reject Order"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
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
      <p className="text-gray-500 dark:text-gray-400">No pending orders found</p>
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
          {showReasonModal.action === 'waiting' ? 'Set Order to Waiting' : 'Reject Order Request'}
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
              showReasonModal.action === 'waiting' ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {actionLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
            {showReasonModal.action === 'waiting' ? 'Set Waiting' : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  </div>
)}

    </div>
  );
}