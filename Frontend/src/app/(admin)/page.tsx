"use client";
import type { Metadata } from "next";
import React from "react";
import { RestaurantMetrics } from "@/components/restaurant/RestaurantMetrics";
import RecentOrders from "@/components/restaurant/RecentOrders";
import PopularDishes from "@/components/restaurant/PopularDishes";
import OrderStatusChart from "@/components/restaurant/OrderStatusChart";
import MonthlySalesChart from "@/components/ecommerce/MonthlySalesChart";
import { useOrderNotifications } from "@/hooks/useOrderNotifications";

console.log("Rendering Restaurant Dashboard Page");

export default function RestaurantDashboard() {
  // Add order notifications to dashboard
  useOrderNotifications("Dashboard");

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      {/* Metrics Row */}
      <div className="col-span-12">
        <RestaurantMetrics />
      </div>

      {/* Charts Row */}
      <div className="col-span-12 lg:col-span-8">
        <MonthlySalesChart />
      </div>

      <div className="col-span-12 lg:col-span-4">
        <OrderStatusChart />
      </div>

      {/* Tables and Lists Row */}
      <div className="col-span-12 xl:col-span-8">
        <RecentOrders />
      </div>

      <div className="col-span-12 xl:col-span-4">
        <PopularDishes />
      </div>
    </div>
  );
}