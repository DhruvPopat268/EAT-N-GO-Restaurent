"use client";
import React from "react";
import OrdersTable from "@/components/tables/OrdersTable";
import { getPendingOrders } from "@/data/ordersData";

const PendingOrders = () => {
  const pendingOrders = getPendingOrders();



  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Pending Orders</h1>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <OrdersTable orders={pendingOrders} />
      </div>
    </div>
  );
};

export default PendingOrders;