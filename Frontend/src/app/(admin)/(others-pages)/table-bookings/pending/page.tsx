"use client";
import React, { useState, useEffect } from "react";

interface BookingTimings {
  date: string;
  slotTime: string;
}

interface UserInfo {
  _id: string;
  phone: string;
  fullName: string;
}

interface TableBooking {
  _id: string;
  tableBookingNo: number;
  userId: UserInfo;
  bookingTimings: BookingTimings;
  numberOfGuests: number;
  coverCharges: number;
  coverChargePaymentStatus: string;
  status: string;
  allocatedTables: any[];
}

const PendingTableBookings = () => {
  const [bookings, setBookings] = useState<TableBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data based on your API response - filtered for pending status
    const mockData = [
      {
        _id: "69c13aec73fac9fb2919d59c",
        tableBookingNo: 2,
        userId: {
          _id: "691741c36d4378c3f202c3ae",
          phone: "+919157193754",
          fullName: "Dhruv Thakkar"
        },
        bookingTimings: {
          date: "23-03-2026",
          slotTime: "19:00"
        },
        numberOfGuests: 5,
        coverCharges: 250,
        coverChargePaymentStatus: "paid",
        status: "pending",
        allocatedTables: []
      }
    ];
    
    setTimeout(() => {
      setBookings(mockData.filter(booking => booking.status === 'pending'));
      setLoading(false);
    }, 1000);
  }, []);

  const handleView = (bookingId: string) => {
    console.log("View booking:", bookingId);
  };

  const handleAllocateTable = (bookingId: string) => {
    console.log("Allocate table for booking:", bookingId);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pending Table Bookings</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage pending table bookings</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Booking No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  User Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Booking Timings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Guests
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Cover Charges
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Payment Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Allocated Tables
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {bookings.map((booking) => (
                <tr key={booking._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    #{booking.tableBookingNo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <div>
                      <div className="font-medium">{booking.userId.fullName}</div>
                      <div className="text-gray-500 dark:text-gray-400">{booking.userId.phone}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <div>
                      <div className="font-medium">{booking.bookingTimings.date}</div>
                      <div className="text-gray-500 dark:text-gray-400">{booking.bookingTimings.slotTime}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {booking.numberOfGuests}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    ₹{booking.coverCharges}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      booking.coverChargePaymentStatus === 'paid' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                        : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                    }`}>
                      {booking.coverChargePaymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {booking.allocatedTables.length > 0 ? booking.allocatedTables.join(', ') : 'Not Allocated'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleView(booking._id)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleAllocateTable(booking._id)}
                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                      >
                        Allocate Table
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PendingTableBookings;