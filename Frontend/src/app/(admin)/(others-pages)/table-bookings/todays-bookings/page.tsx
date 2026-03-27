"use client";
import React, { useState, useEffect } from "react";
import { toast } from "@/utils/toast";
import axiosInstance from '@/utils/axiosConfig';
import { Clock, Users, Calendar, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTableBookingSocket } from '@/hooks/useTableBookingSocket';

interface ActiveSlot {
  slotId: string;
  time: string;
  maxGuests: number;
  onlineGuests: number;
  offlineGuests: number;
  availableCapacity: number;
  status: boolean;
}

interface ActiveSlotsResponse {
  restaurantId: string;
  totalActiveSlots: number;
  slots: ActiveSlot[];
  slotDuration: number;
}

const TodaysBookingsPage = () => {
  const [activeSlots, setActiveSlots] = useState<ActiveSlotsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  // Add table booking socket events
  useTableBookingSocket({
    pageName: "Today's Bookings"
  });

  useEffect(() => {
    fetchActiveSlots();
  }, []);

  const fetchActiveSlots = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/restaurants/table-booking/active-slots');
      setActiveSlots(response.data.data);
    } catch (error: any) {
      console.error('Error fetching active slots:', error);
      if (error.response?.status === 404) {
        toast.error('No time slots configured for this restaurant');
      } else {
        toast.error(error.response?.data?.message || 'Error fetching active slots');
      }
      setActiveSlots(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchActiveSlots();
      toast.success('Active slots refreshed successfully');
    } catch (error) {
      // Error handling is done in fetchActiveSlots
    } finally {
      setRefreshing(false);
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSlotClick = (slotTime: string) => {
    const todayDate = getTodayDate();
    // Create URL with query parameters for slot, date filters, and active bookings only
    const params = new URLSearchParams({
      slot: slotTime,
      startDate: todayDate,
      endDate: todayDate,
      activeBookings: 'true'
    });
    
    router.push(`/table-bookings/all?${params.toString()}`);
  };

  const getCapacityColor = (availableCapacity: number, maxGuests: number) => {
    const percentage = (availableCapacity / maxGuests) * 100;
    if (percentage > 50) return 'text-green-600 dark:text-green-400';
    if (percentage > 20) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Today's Active Bookings
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              View active time slots with online bookings for today
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {activeSlots && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Today's Active Bookings</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {activeSlots.totalActiveBookings}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Today's Active Slots</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {activeSlots.totalActiveSlots}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Today's Active Online Guests</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {activeSlots.totalOnlineGuests}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Slots */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Active Time Slots with Online Bookings
          </h3>
        </div>

        {!activeSlots || activeSlots.slots.length === 0 ? (
          <div className="text-center py-12">
            <div className="flex flex-col items-center">
              <Clock className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Active Slots Found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md">
                {!activeSlots 
                  ? "No time slots are configured for this restaurant. Please configure time slots first."
                  : "No active time slots with online bookings found for today."
                }
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Info:</strong> Showing only active time slots that have online bookings. 
                Click on any slot to view active bookings for that time slot today (excludes completed/cancelled bookings).
                Capacity is calculated as: Max Guests - (Online Guests + Offline Guests)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {activeSlots.slots.map((slot) => (
                <div
                  key={slot.slotId}
                  onClick={() => handleSlotClick(slot.time)}
                  className={`p-4 rounded-lg border-2 transition-all cursor-pointer transform hover:scale-105 bg-blue-100 ${(slot.availableCapacity, slot.maxGuests)}`}
                  title="Click to view all bookings for this slot today"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatTime(slot.time)}
                    </div>
                    <div className="w-3 h-3 rounded-full bg-green-500" title="Active slot" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Max Guests:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {slot.maxGuests}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Online:</span>
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        {slot.onlineGuests}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Offline:</span>
                      <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                        {slot.offlineGuests}
                      </span>
                    </div>

                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Available:
                        </span>
                        <span className={`text-sm font-bold ${getCapacityColor(slot.availableCapacity, slot.maxGuests)}`}>
                          {slot.availableCapacity}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TodaysBookingsPage;