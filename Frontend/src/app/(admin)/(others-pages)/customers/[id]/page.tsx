"use client";
import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";

interface CustomerDetail {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  numberOfOrders: number;
  totalOrderAmount: number;
  avgOrderValue: number;
  completedOrders: number;
  joinedAt: string;
  status: "active" | "inactive";
  customerType: string;
}

interface Order {
  id: string;
  orderId: string;
  status: string;
  amount: number;
  date: string;
}

const CustomerDetailPage = () => {
  const params = useParams();
  const customerId = params.id as string;

  // Mock customer data based on screenshot
  const customerData: CustomerDetail = {
    id: customerId,
    name: "Alice Brown",
    email: "alice.brown@email.com",
    phone: "+91 9876543213",
    address: "654 Pine Road, Chennai, Tamil Nadu",
    numberOfOrders: 5,
    totalOrderAmount: 1450,
    avgOrderValue: 290,
    completedOrders: 2,
    joinedAt: "2023-06-15",
    status: "active",
    customerType: "Premium Customer"
  };

  // Mock order history based on screenshot
  const orderHistory: Order[] = [
    {
      id: "1",
      orderId: "#ORD004",
      status: "Delivered",
      amount: 280,
      date: "2024-01-15"
    },
    {
      id: "2",
      orderId: "#ORD013",
      status: "Pending",
      amount: 350,
      date: "2024-01-14"
    },
    {
      id: "3",
      orderId: "#ORD014",
      status: "Preparing",
      amount: 420,
      date: "2024-01-13"
    },
    {
      id: "4",
      orderId: "#ORD021",
      status: "Delivered",
      amount: 180,
      date: "2024-01-12"
    },
    {
      id: "5",
      orderId: "#ORD022",
      status: "Cancelled",
      amount: 220,
      date: "2024-01-11"
    }
  ];

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium";
    switch (status.toLowerCase()) {
      case "delivered":
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400`;
      case "cancelled":
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400`;
      case "pending":
        return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400`;
      case "preparing":
        return `${baseClasses} bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400`;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Back Arrow and Profile Header */}
      <div className="flex items-center gap-4 mb-4">
        <Link
          href="/customers"
          className="inline-flex items-center justify-center w-10 h-10 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
        >
          <ArrowBackIcon className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customer Details</h1>
      </div>
      
      {/* Profile Header */}
      <div className="bg-slate-700 dark:bg-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
            <PersonIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">{customerData.name}</h1>
            <p className="text-gray-300">{customerData.customerType}</p>
          </div>
        </div>
      </div>

      {/* Contact Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Phone */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <PhoneIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
              <p className="font-medium text-gray-900 dark:text-white">{customerData.phone}</p>
            </div>
          </div>
        </div>

        {/* Email */}
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <EmailIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
              <p className="font-medium text-gray-900 dark:text-white">{customerData.email}</p>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
              <LocationOnIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Location</p>
              <p className="font-medium text-gray-900 dark:text-white">{customerData.address}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Orders */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{customerData.numberOfOrders}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Orders</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">All time</p>
            </div>
          </div>
        </div>

        {/* Total Amount */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">₹{customerData.totalOrderAmount}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Amount</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">Lifetime value</p>
            </div>
          </div>
        </div>

        {/* Avg Order Value */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">₹{customerData.avgOrderValue}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Order Value</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">Per order</p>
            </div>
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{customerData.completedOrders}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">Successful orders</p>
            </div>
          </div>
        </div>
      </div>

      {/* Order History */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Order History</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Track all customer orders</p>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{orderHistory.length} total orders</p>
        </div>
        
        <div className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  INDEX
                </TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  ORDER ID
                </TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  STATUS
                </TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  AMOUNT
                </TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  ORDER DATE
                </TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  ACTIONS
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody>
              {orderHistory.map((order, index) => (
                <TableRow 
                  key={order.id} 
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-200 dark:border-gray-700"
                >
                  <TableCell className="px-4 py-4">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {order.id}
                    </span>
                  </TableCell>
                  
                  <TableCell className="px-4 py-4">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {order.orderId}
                    </span>
                  </TableCell>
                  
                  <TableCell className="px-4 py-4">
                    <span className={getStatusBadge(order.status)}>
                      {order.status}
                    </span>
                  </TableCell>
                  
                  <TableCell className="px-4 py-4">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      ₹{order.amount}
                    </span>
                  </TableCell>
                  
                  <TableCell className="px-4 py-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {order.date}
                    </span>
                  </TableCell>
                  
                  <TableCell className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/orders/detail/${order.orderId.replace('#', '')}`}
                        className="inline-flex items-center justify-center w-8 h-8 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
                      >
                        <VisibilityIcon className="w-4 h-4" />
                      </Link>
                    </div>
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

export default CustomerDetailPage;