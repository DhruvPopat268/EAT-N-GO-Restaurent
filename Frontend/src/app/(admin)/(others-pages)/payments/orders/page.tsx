"use client";
import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import Link from "next/link";

interface OrderPayment {
  id: string;
  orderId: string;
  customerName: string;
  amount: number;
  paymentMethod: "Cash" | "UPI";
  status: "Paid" | "Pending" | "Failed";
  orderDate: string;
}

const OrdersPaymentPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("");

  const [orders, setOrders] = useState<OrderPayment[]>([
    {
      id: "1",
      orderId: "#ORD001",
      customerName: "John Smith",
      amount: 450,
      paymentMethod: "UPI",
      status: "Paid",
      orderDate: "2024-01-15"
    },
    {
      id: "2",
      orderId: "#ORD002",
      customerName: "Sarah Johnson",
      amount: 320,
      paymentMethod: "Cash",
      status: "Paid",
      orderDate: "2024-01-14"
    },
    {
      id: "3",
      orderId: "#ORD003",
      customerName: "Mike Davis",
      amount: 680,
      paymentMethod: "UPI",
      status: "Pending",
      orderDate: "2024-01-13"
    },
    {
      id: "4",
      orderId: "#ORD004",
      customerName: "Emily Brown",
      amount: 280,
      paymentMethod: "Cash",
      status: "Failed",
      orderDate: "2024-01-12"
    },
    {
      id: "5",
      orderId: "#ORD005",
      customerName: "David Wilson",
      amount: 520,
      paymentMethod: "UPI",
      status: "Paid",
      orderDate: "2024-01-11"
    },
    {
      id: "6",
      orderId: "#ORD006",
      customerName: "Lisa Garcia",
      amount: 390,
      paymentMethod: "Cash",
      status: "Paid",
      orderDate: "2023-12-20"
    }
  ]);

  const getFilteredOrders = () => {
    let filtered = orders.filter(order =>
      (order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
       order.orderId.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (paymentMethodFilter === "" || order.paymentMethod === paymentMethodFilter)
    );

    switch (sortBy) {
      case "amount-high":
        return filtered.sort((a, b) => b.amount - a.amount);
      case "amount-low":
        return filtered.sort((a, b) => a.amount - b.amount);
      case "new-orders":
        return filtered.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
      case "old-orders":
        return filtered.sort((a, b) => new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime());
      default:
        return filtered;
    }
  };

  const filteredOrders = getFilteredOrders();

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case "Paid":
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400`;
      case "Pending":
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400`;
      case "Failed":
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400`;
    }
  };

  const getPaymentMethodBadge = (method: string) => {
    const baseClasses = "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium";
    switch (method) {
      case "UPI":
        return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400`;
      case "Cash":
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400`;
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSortBy("");
    setPaymentMethodFilter("");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Orders Payment Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          View and manage all order payments and transaction details
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search orders or customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 transition-colors dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
            />
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white "
          >
            <option value="">Sort By</option>
            <option value="amount-high">Amount (High to Low)</option>
            <option value="amount-low">Amount (Low to High)</option>
            <option value="new-orders">New Orders</option>
            <option value="old-orders">Old Orders</option>
          </select>

          {/* Payment Method Filter */}
          <select
            value={paymentMethodFilter}
            onChange={(e) => setPaymentMethodFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white "
          >
            <option value="">All Methods</option>
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
          </select>

          {/* Clear Filters Button */}
          {(sortBy || paymentMethodFilter || searchTerm) && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors dark:border-gray-700 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredOrders.length} of {orders.length} orders
        </p>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Index
                </TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Order ID
                </TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Customer Name
                </TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Amount
                </TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Payment Method
                </TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Order Date
                </TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredOrders.map((order, index) => (
                <TableRow 
                  key={order.id} 
                  className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                    index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/20'
                  }`}
                >
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-mono font-semibold text-gray-900 dark:text-white">
                      {index + 1}
                    </span>
                  </TableCell>
                  
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {order.orderId}
                    </span>
                  </TableCell>
                  
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900 dark:text-white">
                      {order.customerName}
                    </span>
                  </TableCell>
                  
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      ₹{order.amount}
                    </span>
                  </TableCell>
                  
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <span className={getPaymentMethodBadge(order.paymentMethod)}>
                      {order.paymentMethod}
                    </span>
                  </TableCell>
                  
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <span className={getStatusBadge(order.status)}>
                      {order.status}
                    </span>
                  </TableCell>
                  
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(order.orderDate).toLocaleDateString()}
                    </span>
                  </TableCell>
                  
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/orders/detail/${order.orderId.replace('#', '')}`}
                      className="inline-flex items-center justify-center w-8 h-8 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
                    >
                      <VisibilityIcon className="w-4 h-4" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default OrdersPaymentPage;