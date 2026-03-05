"use client";
import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import Link from "next/link";
import axiosInstance from "@/utils/axiosConfig";
import { toast } from "@/utils/toast";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Pagination from "@/components/tables/Pagination";

interface User {
  _id: string;
  fullName?: string;
  phone: string;
  totalOrderCount: number;
  totalOrderAmount: number;
  createdAt: string;
  status: boolean;
  currency?: {
    code: string;
    name: string;
    symbol: string;
  };
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalUsers: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const UsersPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    hasNext: false,
    hasPrev: false
  });
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get('/api/restaurants/users', {
        params: {
          page: currentPage,
          limit,
          ...(searchTerm && { search: searchTerm }),
          ...(filterType && { filter: filterType }),
          ...(startDate && { startDate }),
          ...(endDate && { endDate })
        }
      });

      if (data.success) {
        setUsers(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchUsers();
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchTerm, filterType, currentPage, limit, startDate, endDate]);

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { data } = await axiosInstance.patch(`/api/restaurants/users/${userId}/status`, {
        status: !currentStatus
      });

      if (data.success) {
        setUsers(prev =>
          prev.map(user =>
            user._id === userId ? { ...user, status: !currentStatus } : user
          )
        );
        toast.success(data.message || "User status updated successfully");
      }
    } catch (error: any) {
      console.error("Error updating user status:", error);
      toast.error(error.response?.data?.message || "Failed to update user status");
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterType("");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Users Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          View and manage all users and their order history
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 transition-colors dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
            />
          </div>

          {/* Filter Dropdown */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 transition-colors dark:border-gray-700 dark:bg-gray-800 dark:text-white min-w-[180px]"
          >
            <option value="">All Users</option>
            <option value="orderCount">By Number of Orders</option>
            <option value="orderAmount">By Total Order Amount</option>
          </select>

          {/* Start Date */}
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 transition-colors dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            placeholder="Start Date"
          />

          {/* End Date */}
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 transition-colors dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            placeholder="End Date"
          />

          {/* Clear Filters Button */}
          {(filterType || searchTerm || startDate || endDate) && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors dark:border-gray-700 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Results Count and Records Per Page */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing {users.length} of {pagination.totalUsers} users
        </p>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 dark:text-gray-400">Records per page:</label>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(parseInt(e.target.value));
              setCurrentPage(1);
            }}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Modern Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <TableCell isHeader className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Index
                </TableCell>
                <TableCell isHeader className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  User Info
                </TableCell>
                <TableCell isHeader className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  No of Orders
                </TableCell>
                <TableCell isHeader className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Total Order Amount
                </TableCell>
                <TableCell isHeader className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Joined At
                </TableCell>
                <TableCell isHeader className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </TableCell>
                <TableCell isHeader className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="px-6 py-8 text-center">
                    <div className="flex justify-center items-center w-full">
                      <LoadingSpinner size="md" text="Loading users..." className="mx-auto" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user, index) => (
                  <TableRow
                    key={user._id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/20'}`}
                  >
                    <TableCell className="px-6 py-4 text-center whitespace-nowrap">
                      <span className="text-sm font-mono font-semibold text-gray-900 dark:text-white">
                        {(currentPage - 1) * 10 + index + 1}
                      </span>
                    </TableCell>

                    <TableCell className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.fullName || 'N/A'}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {user.phone}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="px-6 py-4 text-center whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {user.totalOrderCount}
                      </div>
                    </TableCell>

                    <TableCell className="px-6 py-4 text-center whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {user.currency?.symbol || '₹'}{user.totalOrderAmount.toFixed(2)}
                      </div>
                    </TableCell>

                    <TableCell className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {new Date(user.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(user.createdAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false })}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="px-6 py-4 text-center whitespace-nowrap">
                      <div className="flex justify-center">
                        <button
                          onClick={() => toggleUserStatus(user._id, user.status)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            user.status ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              user.status ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                    </TableCell>

                    <TableCell className="px-6 py-4 text-center whitespace-nowrap">
                      <Link
                        href={`/users/${user._id}`}
                        className="inline-flex items-center justify-center w-8 h-8 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
                        title="View User Details"
                      >
                        <VisibilityIcon className="w-4 h-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-end">
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
};

export default UsersPage;
