"use client";
import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import Link from "next/link";

interface Customer {
  id: string;
  name: string;
  numberOfOrders: number;
  totalOrderAmount: number;
  joinedAt: string;
  status: "active" | "inactive";
}

const CustomersPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [customers, setCustomers] = useState<Customer[]>([
    {
      id: "1",
      name: "John Smith",
      numberOfOrders: 25,
      totalOrderAmount: 2450,
      joinedAt: "2023-06-15",
      status: "active"
    },
    {
      id: "2",
      name: "Sarah Johnson",
      numberOfOrders: 18,
      totalOrderAmount: 1890,
      joinedAt: "2023-08-22",
      status: "active"
    },
    {
      id: "3",
      name: "Mike Davis",
      numberOfOrders: 42,
      totalOrderAmount: 4200,
      joinedAt: "2023-03-10",
      status: "inactive"
    },
    {
      id: "4",
      name: "Emily Brown",
      numberOfOrders: 8,
      totalOrderAmount: 650,
      joinedAt: "2024-01-05",
      status: "active"
    },
    {
      id: "5",
      name: "David Wilson",
      numberOfOrders: 35,
      totalOrderAmount: 3150,
      joinedAt: "2023-05-18",
      status: "active"
    },
    {
      id: "6",
      name: "Lisa Garcia",
      numberOfOrders: 12,
      totalOrderAmount: 980,
      joinedAt: "2023-11-30",
      status: "inactive"
    },
    {
      id: "7",
      name: "Tom Anderson",
      numberOfOrders: 3,
      totalOrderAmount: 245,
      joinedAt: "2024-01-20",
      status: "active"
    },
    {
      id: "8",
      name: "Anna Martinez",
      numberOfOrders: 28,
      totalOrderAmount: 2800,
      joinedAt: "2023-07-12",
      status: "active"
    }
  ]);

  const toggleCustomerStatus = (customerId: string) => {
    setCustomers(prev =>
      prev.map(customer =>
        customer.id === customerId
          ? { ...customer, status: customer.status === "active" ? "inactive" : "active" }
          : customer
      )
    );
  };

  const getFilteredCustomers = () => {
    let filtered = customers.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (statusFilter === "" || customer.status === statusFilter)
    );

    switch (filterType) {
      case "old":
        return filtered.filter(customer => new Date(customer.joinedAt) < new Date("2024-01-01"));
      case "new":
        return filtered.filter(customer => new Date(customer.joinedAt) >= new Date("2024-01-01"));
      case "high-orders":
        return filtered.sort((a, b) => b.numberOfOrders - a.numberOfOrders);
      case "high-amount":
        return filtered.sort((a, b) => b.totalOrderAmount - a.totalOrderAmount);
      default:
        return filtered;
    }
  };

  const filteredCustomers = getFilteredCustomers();

  const clearFilters = () => {
    setSearchTerm("");
    setFilterType("");
    setStatusFilter("");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Customer Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          View and manage all customers and their order history
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
              placeholder="Search customers..."
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
            <option value="">All Customers</option>
            <option value="old">Old Customers</option>
            <option value="new">New Customers</option>
            <option value="high-orders">By Number of Orders</option>
            <option value="high-amount">By Total Order Amount</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 transition-colors dark:border-gray-700 dark:bg-gray-800 dark:text-white min-w-[100px]"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Clear Filters Button */}
          {(filterType || statusFilter || searchTerm) && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors dark:border-gray-700 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredCustomers.length} of {customers.length} customers
        </p>
      </div>

      {/* Modern Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Index
                </TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Customer Name
                </TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  No of Orders
                </TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Total Order Amount
                </TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  ORDER DATE
                </TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredCustomers.map((customer, index) => (
                <TableRow
                  key={customer.id}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/20'
                    }`}
                >
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-mono font-semibold text-gray-900 dark:text-white">
                      {index + 1}
                    </span>
                  </TableCell>

                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white font-medium">
                      {customer.name}
                    </div>
                  </TableCell>

                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {customer.numberOfOrders}
                    </div>
                  </TableCell>

                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      ₹{customer.totalOrderAmount.toLocaleString()}
                    </div>
                  </TableCell>

                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(customer.joinedAt).toLocaleDateString()}
                    </div>
                  </TableCell>

                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleCustomerStatus(customer.id)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${customer.status === "active" ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${customer.status === "active" ? "translate-x-6" : "translate-x-1"
                          }`}
                      />
                    </button>
                  </TableCell>

                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/customers/${customer.id}`}
                      className="inline-flex items-center justify-center w-8 h-8 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
                      title="View Customer Details"
                    >
                      <VisibilityIcon className="w-4 h-4" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {filteredCustomers.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full dark:bg-gray-800 mb-4">
            <SearchIcon className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No customers found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No customers match your current filters. Try adjusting your search criteria.
          </p>
          {(filterType || statusFilter || searchTerm) && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center px-4 py-2"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomersPage;