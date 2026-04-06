"use client";
import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Wallet, TrendingUp, TrendingDown, BanknoteIcon as BanknoteArrowDown, Clock } from "lucide-react";
import axiosInstance from '@/utils/axiosConfig';
import Pagination from '@/components/tables/Pagination';
import { formatDateTime } from '@/utils/dateUtils';
import { toast } from "@/utils/toast";

interface Transaction {
  _id: string;
  amount: number;
  transactionType: 'credit' | 'debit';
  source: string;
  description: string;
  status: string;
  currency: {
    symbol: string;
    code: string;
  };
  tableBookingId?: {
    _id: string;
    tableBookingNo: number;
  };
  paymentId?: string;
  orderId?: {
    _id: string;
    orderNo: string;
  };
  commissionPercentage?: number;
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

interface WalletStats {
  balance: number;
  totalEarnings: number;
  totalDebits: number;
  totalWithdrawals: number;
  pendingSettlement: number;
  currency: {
    symbol: string;
    code: string;
    name: string;
  };
}

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [walletStats, setWalletStats] = useState<WalletStats | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0
  });

  const fetchTransactions = async (page: number = pagination.page, limit: number = pagination.limit) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/restaurants/wallet/transactions?page=${page}&limit=${limit}`);
      if (response.data.success) {
        setTransactions(response.data.data);
        setPagination(response.data.pagination);
        
        // Set wallet stats from API response
        if (response.data.wallet) {
          setWalletStats(response.data.wallet);
        }
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Error fetching transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(1);
  }, []);

  const handlePageChange = (page: number) => {
    fetchTransactions(page, pagination.limit);
  };

  const handleLimitChange = (limit: number) => {
    fetchTransactions(1, limit);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Wallet Transactions
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View your wallet transaction history
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Wallet Transactions
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          View your wallet transaction history
        </p>
      </div>

      {/* Wallet Stats Cards */}
      {walletStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {/* Current Balance */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Balance</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {walletStats.currency.symbol}{walletStats.balance.toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Wallet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          {/* Total Earnings */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Earnings</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {walletStats.currency.symbol}{walletStats.totalEarnings.toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          {/* Total Debits */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Debits</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {walletStats.currency.symbol}{walletStats.totalDebits.toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>

          {/* Total Withdrawals */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Withdrawals</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {walletStats.currency.symbol}{walletStats.totalWithdrawals.toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <BanknoteArrowDown className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>

          {/* Pending Settlement */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Settlement</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {walletStats.currency.symbol}{walletStats.pendingSettlement.toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Count and Records Per Page */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing {transactions.length} of {pagination.totalCount} transactions
        </p>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 dark:text-gray-400">Records per page:</label>
          <select
            value={pagination.limit}
            onChange={(e) => handleLimitChange(parseInt(e.target.value))}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        {transactions.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No transactions found</h3>
            <p className="text-gray-500 dark:text-gray-400">No transactions available at the moment.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                  <TableCell isHeader className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">#</TableCell>
                  <TableCell isHeader className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Order No</TableCell>
                  <TableCell isHeader className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Table Booking No</TableCell>
                  <TableCell isHeader className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Transaction Type</TableCell>
                  <TableCell isHeader className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Source</TableCell>
                  <TableCell isHeader className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Commission %</TableCell>
                  <TableCell isHeader className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Amount</TableCell>
                  <TableCell isHeader className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Description</TableCell>
                  <TableCell isHeader className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Created At</TableCell>
                  <TableCell isHeader className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Updated At</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction, index) => (
                  <TableRow key={transaction._id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/20'}`}>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {(pagination.page - 1) * pagination.limit + index + 1}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-mono font-semibold text-gray-900 dark:text-white">
                        {transaction.orderId ? `#${transaction.orderId.orderNo}` : '-'}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-mono font-semibold text-gray-900 dark:text-white">
                        {transaction.tableBookingId ? `#${transaction.tableBookingId.tableBookingNo}` : '-'}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full capitalize ${transaction.transactionType === 'credit' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                        {transaction.transactionType}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm text-gray-900 dark:text-white capitalize">
                        {transaction.source}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {transaction.commissionPercentage ? `${transaction.commissionPercentage}%` : '-'}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`text-sm font-semibold ${transaction.transactionType === 'credit' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {transaction.transactionType === 'credit' ? '+' : '-'}{transaction.currency.symbol}{transaction.amount}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-center">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {transaction.description}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm text-gray-900 dark:text-white">{formatDateTime(transaction.createdAt).date}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{formatDateTime(transaction.createdAt).time}</div>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm text-gray-900 dark:text-white">{formatDateTime(transaction.updatedAt).date}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{formatDateTime(transaction.updatedAt).time}</div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-end mt-6">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
};

export default TransactionsPage;