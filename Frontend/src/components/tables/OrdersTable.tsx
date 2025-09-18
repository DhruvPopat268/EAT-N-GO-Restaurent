"use client";
import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
// import Badge from "../ui/badge/Badge";
import Select from "../form/Select";
import Link from "next/link";
import VisibilityIcon from '@mui/icons-material/Visibility';
import PrintIcon from '@mui/icons-material/Print';

interface Order {
  id: string;
  customerName: string;
  product: string;
  category: string;
  subcategory: string;
  amount: string;
  date: string;
  status: "pending" | "ongoing" | "complete" | "cancelled";
}

interface OrdersTableProps {
  orders: Order[];
}

const OrdersTable: React.FC<OrdersTableProps> = ({ orders }) => {
  const [filteredOrders, setFilteredOrders] = useState(orders);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [subcategoryFilter, setSubcategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Get unique values for filters
  const categories = [...new Set(orders.map(order => order.category))];
  const subcategories = [...new Set(orders.map(order => order.subcategory))];
  const statuses = [...new Set(orders.map(order => order.status))];

  // Filter orders based on selected filters
  React.useEffect(() => {
    let filtered = orders;
    
    if (categoryFilter) {
      filtered = filtered.filter(order => order.category === categoryFilter);
    }
    
    if (subcategoryFilter) {
      filtered = filtered.filter(order => order.subcategory === subcategoryFilter);
    }
    
    if (statusFilter) {
      filtered = filtered.filter(order => order.status === statusFilter);
    }
    
    setFilteredOrders(filtered);
  }, [orders, categoryFilter, subcategoryFilter, statusFilter]);

  // const getBadgeColor = (status: string) => {
  //   switch (status) {
  //     case "complete": return "success";
  //     case "ongoing": return "info";
  //     case "pending": return "warning";
  //     case "cancelled": return "error";
  //     default: return "gray";
  //   }
  // };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Category
          </label>
          <Select
            options={[
              { value: "", label: "All Categories" },
              ...categories.map(cat => ({ value: cat, label: cat }))
            ]}
            placeholder="Select Category"
            onChange={setCategoryFilter}
            defaultValue=""
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Subcategory
          </label>
          <Select
            options={[
              { value: "", label: "All Subcategories" },
              ...subcategories.map(sub => ({ value: sub, label: sub }))
            ]}
            placeholder="Select Subcategory"
            onChange={setSubcategoryFilter}
            defaultValue=""
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Status
          </label>
          <Select
            options={[
              { value: "", label: "All Statuses" },
              ...statuses.map(status => ({ 
                value: status, 
                label: status.charAt(0).toUpperCase() + status.slice(1) 
              }))
            ]}
            placeholder="Select Status"
            onChange={setStatusFilter}
            defaultValue=""
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[800px]">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Order ID
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Customer
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Product
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Category
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Amount
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Date
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Status
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Actions
                  </TableCell>

                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="px-5 py-4 text-start">
                      <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        #{order.id}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {order.customerName}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {order.product}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      <div>
                        <div className="font-medium">{order.category}</div>
                        <div className="text-xs text-gray-400">{order.subcategory}</div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      ${order.amount}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {order.date}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {/* <Badge
                        size="sm"
                        color={getBadgeColor(order.status)}
                      >
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge> */}
                      {order.status}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-start">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/orders/detail/${order.id}`}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <VisibilityIcon className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => window.print()}
                          className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                          title="Print Order"
                        >
                          <PrintIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>

                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
      
      {filteredOrders.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No orders found matching the selected filters.
        </div>
      )}
    </div>
  );
};

export default OrdersTable;