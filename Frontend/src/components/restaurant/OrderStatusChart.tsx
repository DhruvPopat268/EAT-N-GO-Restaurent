"use client";
import React from "react";
import dynamic from "next/dynamic";

const ApexCharts = dynamic(() => import("react-apexcharts"), { ssr: false });

const OrderStatusChart = () => {
  const options = {
    chart: {
      type: "donut" as const,
      height: 300,
      toolbar: {
        show: false,
      },
    },
    colors: ["#10B981", "#EF4444", "#F59E0B"],
    labels: ["Veg", "Non-Veg", "Mixed"],
    legend: {
      show: true,
      position: "bottom" as const,
      horizontalAlign: "center" as const,
      fontSize: "14px",
      fontFamily: "Inter, sans-serif",
      labels: {
        colors: ["#374151"],
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: "70%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Total Items",
              fontSize: "16px",
              fontWeight: 600,
              color: "#374151",
            },
          },
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            height: 250,
          },
          legend: {
            fontSize: "12px",
          },
        },
      },
    ],
  };

  const series = [65, 45, 30]; // Veg, Non-Veg, Mixed

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Food Category Distribution
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Today&apos;s menu breakdown
        </p>
      </div>
      
      <div className="h-[300px]">
        <ApexCharts
          options={options}
          series={series}
          type="donut"
          height={300}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <p className="text-2xl font-bold text-gray-800 dark:text-white/90">140</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Items</p>
        </div>
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">46.4%</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Veg Items</p>
        </div>
      </div>
    </div>
  );
};

export default OrderStatusChart;