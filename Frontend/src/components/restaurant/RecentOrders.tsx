"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import { useRouter } from "next/navigation";

interface Order {
  id: string;
  customer: string;
  items: string;
  total: string;
  status: "Preparing" | "Ready" | "Delivered" | "Cancelled";
  time: string;
}

const orderData: Order[] = [
  {
    id: "#ORD-001",
    customer: "John Smith",
    items: "Margherita Pizza, Coke",
    total: "$24.50",
    status: "Preparing",
    time: "2 min ago"
  },
  {
    id: "#ORD-002", 
    customer: "Sarah Johnson",
    items: "Chicken Burger, Fries",
    total: "$18.75",
    status: "Ready",
    time: "5 min ago"
  },
  {
    id: "#ORD-003",
    customer: "Mike Wilson",
    items: "Caesar Salad, Iced Tea",
    total: "$15.25",
    status: "Delivered",
    time: "12 min ago"
  },
  {
    id: "#ORD-004",
    customer: "Emma Davis",
    items: "Pasta Carbonara, Wine",
    total: "$32.00",
    status: "Preparing",
    time: "15 min ago"
  },
  {
    id: "#ORD-005",
    customer: "Tom Brown",
    items: "Fish & Chips",
    total: "$19.50",
    status: "Cancelled",
    time: "18 min ago"
  }
];



export default function RecentOrders() {
  const Router = useRouter();
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Recent Orders
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200" onClick={() => {Router.push('/orders/all')}}>
            View All Orders
          </button>
        </div>
      </div>
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
            <TableRow>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Order ID
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Customer
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Items
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Total
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Status
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Time
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {orderData.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="py-3">
                  <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                    {order.id}
                  </span>
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {order.customer}
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {order.items}
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {order.total}
                </TableCell>
                <TableCell className="py-3">
                  <Badge
                    size="sm"
                    color={
                      order.status === "Delivered"
                        ? "success"
                        : order.status === "Ready"
                        ? "success"
                        : order.status === "Preparing"
                        ? "warning"
                        : "error"
                    }
                  >
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {order.time}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}