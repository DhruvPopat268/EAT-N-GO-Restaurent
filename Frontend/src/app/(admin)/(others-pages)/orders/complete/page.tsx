"use client";
import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Eye } from "lucide-react";
import { toast } from "@/utils/toast";
import axiosInstance from '@/utils/axiosConfig';
import Pagination from '@/components/tables/Pagination';
import Link from 'next/link';
import { formatDateTime } from '@/utils/dateUtils';
import { useOrderNotifications } from '@/hooks/useOrderNotifications';

const ordersApi = {
  getCompleted: async (page: number = 1, limit: number = 10, filters?: any) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    
    if (filters?.search) params.append('search', filters.search);
    if (filters?.orderType) params.append('orderType', filters.orderType);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    
    const response = await axiosInstance.get(`/api/restaurants/orders/completed?${params.toString()}`);
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

const CompletedOrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [apiLoading, setApiLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0
  });
  const [search, setSearch] = useState('');
  const [orderTypeFilter, setOrderTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Add order notifications
  useOrderNotifications("Completed Orders");

  useEffect(() => {
    fetchOrders(1);
  }, [search, orderTypeFilter, startDate, endDate]);

  const fetchOrders = async (page: number = pagination.page, limit: number = pagination.limit) => {
    try {
      setApiLoading(true);
      const filters = {
        search,
        orderType: orderTypeFilter,
        startDate,
        endDate
      };
      const response = await ordersApi.getCompleted(page, limit, filters);
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

  if (apiLoading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Completed Orders
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View completed orders
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
          Completed Orders
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          View completed orders
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

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        {orders.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No completed orders found</h3>
            <p className="text-gray-500 dark:text-gray-400">No completed orders available at the moment.</p>
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
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 capitalize">
                        {order.status}
                      </span>
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

      {pagination.totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
};

export default CompletedOrdersPage;