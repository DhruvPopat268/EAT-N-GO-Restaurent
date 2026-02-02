"use client";
import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Eye } from "lucide-react";
import { toast } from "@/utils/toast";
import axiosInstance from '@/utils/axiosConfig';
import Pagination from '@/components/tables/Pagination';
import Link from 'next/link';
import { formatDateTime } from '@/utils/dateUtils';

const ordersApi = {
  getAll: async (page: number = 1, limit: number = 10, filters?: any) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.orderType) params.append('orderType', filters.orderType);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    
    const response = await axiosInstance.get(`/api/restaurants/orders/all?${params.toString()}`);
    return response.data;
  },

  updateToConfirmed: async (orderId: string) => {
    const response = await axiosInstance.patch(`/api/restaurants/orders/confirm/${orderId}`);
    return response.data;
  },

  updateToPreparing: async (orderId: string) => {
    const response = await axiosInstance.patch(`/api/restaurants/orders/preparing/${orderId}`);
    return response.data;
  },

  updateToReady: async (orderId: string) => {
    const response = await axiosInstance.patch(`/api/restaurants/orders/ready/${orderId}`);
    return response.data;
  },

  updateToServed: async (orderId: string) => {
    const response = await axiosInstance.patch(`/api/restaurants/orders/served/${orderId}`);
    return response.data;
  },

  updateToCompleted: async (orderId: string) => {
    const response = await axiosInstance.patch(`/api/restaurants/orders/completed/${orderId}`);
    return response.data;
  },

  cancelOrder: async (orderId: string) => {
    const response = await axiosInstance.patch(`/api/restaurants/orders/cancel/${orderId}`);
    return response.data;
  }
};

interface Order {
  _id: string;
  orderNo: string;
  userId: {
    _id: string;
    fullName: string;
    phone: string;
  };
  orderType: string;
  paymentMethod: string;
  totalAmount: number;
  status: string;
  items: any[];
  waitingTime?: number;
  eatTimings?: {
    startTime: string;
    endTime: string;
  };
  takeawayTimings?: {
    startTime: string;
    endTime: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

const getAvailableStatuses = (currentStatus: string, orderType: string) => {
  const statusFlow = {
    'waiting': 'confirmed',
    'confirmed': 'preparing',
    'preparing': 'ready',
    'ready': orderType === 'dine-in' ? 'served' : 'completed',
    'served': 'completed'
  };
  
  const nextStatus = statusFlow[currentStatus as keyof typeof statusFlow];
  
  if (nextStatus) {
    return [currentStatus, nextStatus];
  }
  
  // For final statuses (completed, cancelled, refunded), show only current
  return [currentStatus];
};

const statusOptions = ['confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled', 'refunded'];

const AllOrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [apiLoading, setApiLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0
  });
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [statusConfirm, setStatusConfirm] = useState<{show: boolean, orderId: string, orderNo: string, currentStatus: string, newStatus: string}>({show: false, orderId: '', orderNo: '', currentStatus: '', newStatus: ''});
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [orderTypeFilter, setOrderTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchOrders(1);
  }, [search, statusFilter, orderTypeFilter, startDate, endDate]);

  const fetchOrders = async (page: number = pagination.page, limit: number = pagination.limit) => {
    try {
      setApiLoading(true);
      const filters = {
        search,
        status: statusFilter,
        orderType: orderTypeFilter,
        startDate,
        endDate
      };
      const response = await ordersApi.getAll(page, limit, filters);
      if (response.success) {
        setOrders(response.data);
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Error fetching orders');
    } finally {
      setApiLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    fetchOrders(page, pagination.limit);
  };

  const handleLimitChange = (limit: number) => {
    fetchOrders(1, limit);
  };

  const handleStatusChange = (orderId: string, orderNo: string, currentStatus: string, newStatus: string) => {
    setStatusConfirm({
      show: true,
      orderId,
      orderNo,
      currentStatus,
      newStatus
    });
  };

  const confirmStatusUpdate = async () => {
    setUpdatingStatus(statusConfirm.orderId);
    try {
      let response;
      const { newStatus, orderId } = statusConfirm;
      
      switch (newStatus) {
        case 'confirmed':
          response = await ordersApi.updateToConfirmed(orderId);
          break;
        case 'preparing':
          response = await ordersApi.updateToPreparing(orderId);
          break;
        case 'ready':
          response = await ordersApi.updateToReady(orderId);
          break;
        case 'served':
          response = await ordersApi.updateToServed(orderId);
          break;
        case 'completed':
          response = await ordersApi.updateToCompleted(orderId);
          break;
        case 'cancelled':
          response = await ordersApi.cancelOrder(orderId);
          break;
        default:
          throw new Error('Invalid status update');
      }
      
      if (response.success) {
        toast.success(`Order status updated to ${statusConfirm.newStatus}`);
        fetchOrders();
      } else {
        toast.error(response.message || 'Error updating status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error updating status');
    } finally {
      setUpdatingStatus(null);
      setStatusConfirm({show: false, orderId: '', orderNo: '', currentStatus: '', newStatus: ''});
    }
  };

  const handleView = (order: Order) => {
    setViewingOrder(order);
    setShowViewModal(true);
  };

  if (apiLoading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            All Orders
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage all orders from your restaurant
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          All Orders
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          View and manage all orders from your restaurant
        </p>
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
                <option value="confirmed">Confirmed</option>
                <option value="waiting">Waiting</option>
                <option value="preparing">Preparing</option>
                <option value="ready">Ready</option>
                <option value="served">Served</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
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

      {/* Results Count and Records Per Page */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing {orders.length} of {pagination.totalCount} orders
        </p>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 dark:text-gray-400">Records per page:</label>
          <select
            value={pagination.limit}
            onChange={(e) => handleLimitChange(parseInt(e.target.value))}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        {orders.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No orders found</h3>
            <p className="text-gray-500 dark:text-gray-400">No orders available at the moment.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                  <TableCell isHeader className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Order No</TableCell>
                  <TableCell isHeader className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">User Info</TableCell>
                  <TableCell isHeader className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Order Type</TableCell>
                   <TableCell isHeader className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Items Count</TableCell>
                   <TableCell isHeader className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Waiting Time</TableCell>
                  <TableCell isHeader className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Payment Method</TableCell>
                  <TableCell isHeader className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Total Amount</TableCell>
                 
                  <TableCell isHeader className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Status</TableCell>
                  <TableCell isHeader className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Update Status To</TableCell>
                  <TableCell isHeader className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Created At</TableCell>
                  <TableCell isHeader className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Updated At</TableCell>
                  <TableCell isHeader className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order, index) => (
                  <TableRow key={order._id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/20'}`}>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-mono font-semibold text-gray-900 dark:text-white">
                        #{order.orderNo}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-center">
                      <div className="text-sm text-gray-900 dark:text-white font-medium">
                        {order.userId?.fullName || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {order.userId?.phone || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm text-gray-900 dark:text-white capitalize">
                        {order.orderType}
                      </div>
                      {order.eatTimings && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Eat: {order.eatTimings.startTime} - {order.eatTimings.endTime}
                        </div>
                      )}
                      {order.takeawayTimings && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Takeaway: {order.takeawayTimings.startTime} - {order.takeawayTimings.endTime}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {order.items?.length || 0}
                      </span>
                    </TableCell>
                     <TableCell className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {order.waitingTime ? `${order.waitingTime} min` : '-'}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm text-gray-900 dark:text-white capitalize">
                        {order.paymentMethod}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        ₹{order.totalAmount}
                      </span>
                    </TableCell>
                   
                    <TableCell className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'preparing' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'ready' ? 'bg-purple-100 text-purple-800' :
                        order.status === 'served' ? 'bg-indigo-100 text-indigo-800' :
                        order.status === 'completed' ? 'bg-green-100 text-green-800' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        order.status === 'refunded' ? 'bg-gray-100 text-gray-800' :
                        'bg-gray-100 text-gray-800'
                      } capitalize`}>
                        {order.status}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-center">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order._id, order.orderNo, order.status, e.target.value)}
                        disabled={updatingStatus === order._id}
                        className="px-3 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        {getAvailableStatuses(order.status, order.orderType).map(status => (
                          <option key={status} value={status} className="capitalize">
                            {status}
                          </option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-center">
                      <div>{formatDateTime(order.createdAt).date}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{formatDateTime(order.createdAt).time}</div>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-center">
                      <div>{formatDateTime(order.updatedAt).date}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{formatDateTime(order.updatedAt).time}</div>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-center">
                      <Link
                        href={`/orders/detail/${order._id}`}
                        className="inline-flex items-center justify-center w-8 h-8 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors"
                        title="View Order Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination
            currentPage={pagination.page}
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
              Are you sure you want to update status from <span className="font-semibold capitalize">{statusConfirm.currentStatus}</span> to <span className="font-semibold capitalize">{statusConfirm.newStatus}</span> for order #{statusConfirm.orderNo}?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setStatusConfirm({show: false, orderId: '', orderNo: '', currentStatus: '', newStatus: ''})}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusUpdate}
                disabled={updatingStatus === statusConfirm.orderId}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {updatingStatus === statusConfirm.orderId && (
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

      {/* View Order Modal */}
      {showViewModal && viewingOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999]">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Order Details</h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Order No</label>
                  <p className="text-sm font-mono font-semibold text-gray-900 dark:text-white">#{viewingOrder.orderNo}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</label>
                  <p className={`text-sm font-medium capitalize px-2 py-1 rounded-full inline-block ${
                    viewingOrder.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                    viewingOrder.status === 'preparing' ? 'bg-yellow-100 text-yellow-800' :
                    viewingOrder.status === 'ready' ? 'bg-purple-100 text-purple-800' :
                    viewingOrder.status === 'served' ? 'bg-indigo-100 text-indigo-800' :
                    viewingOrder.status === 'completed' ? 'bg-green-100 text-green-800' :
                    viewingOrder.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    viewingOrder.status === 'refunded' ? 'bg-gray-100 text-gray-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>{viewingOrder.status}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Customer</label>
                  <p className="text-sm text-gray-900 dark:text-white">{viewingOrder.userId?.fullName || 'N/A'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{viewingOrder.userId?.phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Order Type</label>
                  <p className="text-sm text-gray-900 dark:text-white capitalize">{viewingOrder.orderType}</p>
                  {viewingOrder.eatTimings && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">Eat Timings: {viewingOrder.eatTimings.startTime} - {viewingOrder.eatTimings.endTime}</p>
                  )}
                  {viewingOrder.takeawayTimings && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">Takeaway Timings: {viewingOrder.takeawayTimings.startTime} - {viewingOrder.takeawayTimings.endTime}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Payment Method</label>
                  <p className="text-sm text-gray-900 dark:text-white capitalize">{viewingOrder.paymentMethod}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Amount</label>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">₹{viewingOrder.totalAmount}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Created At</label>
                  <div className="text-sm text-gray-900 dark:text-white">{formatDateTime(viewingOrder.createdAt).date}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{formatDateTime(viewingOrder.createdAt).time}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Updated At</label>
                  <div className="text-sm text-gray-900 dark:text-white">{formatDateTime(viewingOrder.updatedAt).date}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{formatDateTime(viewingOrder.updatedAt).time}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllOrdersPage;