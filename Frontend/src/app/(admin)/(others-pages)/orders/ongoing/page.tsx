"use client";
import React from "react";
import OrdersTable from "@/components/tables/OrdersTable";
import { getOngoingOrders } from "@/data/ordersData";

const OngoingOrders = () => {
  const ongoingOrders = getOngoingOrders();



  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Ongoing Orders</h1>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <OrdersTable orders={ongoingOrders} />
      </div>
    </div>
  );
};

export default OngoingOrders;