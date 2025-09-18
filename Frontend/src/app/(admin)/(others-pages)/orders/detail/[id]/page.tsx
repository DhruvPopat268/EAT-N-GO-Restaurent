"use client";
import React from "react";
import { useParams } from "next/navigation";
import { ordersData } from "@/data/ordersData";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Link from "next/link";
import Image from "next/image";

const OrderDetailPage = () => {
  const params = useParams();
  const orderId = params.id as string;
  
  const order = ordersData.find(o => o.id === orderId);

  if (!order) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Order Not Found</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">The order you&apos;re looking for doesn&apos;t exist.</p>
          <Link
            href="/orders/detail"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowBackIcon className="w-4 h-4" />
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/orders/detail"
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowBackIcon className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Order Details</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">View comprehensive order information</p>
        </div>
      </div>

      {/* Order Header Card */}
      <div className="bg-slate-600 text-white rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">#{order.id}</h2>
            <p className="text-sm opacity-90">{order.date} at 12:15</p>
          </div>
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            Delivered
          </span>
        </div>
      </div>

      {/* Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Customer Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Customer Information</h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{order.customerName}</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              +91 9876543213
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              {order.customerName.toLowerCase().replace(' ', '.')}@email.com
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              654 Pine Road, Chennai, Tamil Nadu
            </div>
          </div>
        </div>

        {/* Restaurant Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm3 5a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Restaurant Information</h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Food Palace</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              123 Food Street, Chennai, Tamil Nadu
            </div>
          </div>
        </div>
      </div>

      {/* Order Items Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Order Items</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Image</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Name</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Attributes</th>
                <th className="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Quantity</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Price</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                <td className="py-4 px-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg overflow-hidden">
                    <Image
                      src="/images/product/product-03.jpg"
                      alt="Margherita Pizza"
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </td>
                <td className="py-4 px-4">
                  <p className="font-medium text-gray-900 dark:text-white">Margherita Pizza</p>
                </td>
                <td className="py-4 px-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Large size, Extra cheese</p>
                </td>
                <td className="py-4 px-4 text-center">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">1</span>
                </td>
                <td className="py-4 px-4 text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">$12.99</p>
                </td>
              </tr>
              <tr>
                <td className="py-4 px-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg overflow-hidden">
                    <Image
                      src="/images/product/product-04.jpg"
                      alt="Chicken Burger"
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </td>
                <td className="py-4 px-4">
                  <p className="font-medium text-gray-900 dark:text-white">Chicken Burger</p>
                </td>
                <td className="py-4 px-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Grilled chicken, Lettuce, Tomato</p>
                </td>
                <td className="py-4 px-4 text-center">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">1</span>
                </td>
                <td className="py-4 px-4 text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">$8.99</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-6">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-900 dark:text-white">Total Order Value</span>
            <span className="text-xl font-bold text-gray-900 dark:text-white">$21.98</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;