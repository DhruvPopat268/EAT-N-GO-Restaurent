"use client";
import React from "react";
import { ordersData } from "@/data/ordersData";
import OrdersTable from "@/components/tables/OrdersTable";

const AllOrdersPage = () => {
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
      <OrdersTable orders={ordersData} />
    </div>
  );
};

export default AllOrdersPage;