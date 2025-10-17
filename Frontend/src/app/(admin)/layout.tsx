"use client";

import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import React, { useEffect, useState } from "react";
import axios from "axios";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const [restaurentStatus, setRestaurentStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/restaurants/status`,
          { withCredentials: true }
        );
        console.log("Fetched Status Response:", response.data?.data?.status);
        setRestaurentStatus(response.data.data.status);

      } catch (error) {
        console.error("Error fetching restaurant status:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  // Dynamic class for main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
      ? "lg:ml-[290px]"
      : "lg:ml-[90px]";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (restaurentStatus === "pending") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-100 to-indigo-200">
        <div className="bg-white shadow-xl rounded-2xl p-10 max-w-lg text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Application Pending</h1>
          <p className="text-gray-600 mb-6">
            Your application is currently under review. Please wait for admin approval.
          </p>
          <p className="text-gray-500 mb-8">
            Once approved, you will gain access to the admin panel.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen xl:flex">
      {/* Sidebar and Backdrop */}
      <AppSidebar />
      <Backdrop />

      {/* Main Content Area */}
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}
      >
        {/* Header */}
        <AppHeader />

        {/* Page Content */}
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">{children}</div>
      </div>
    </div>
  );
}
