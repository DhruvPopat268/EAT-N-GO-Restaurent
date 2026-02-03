"use client";

import React, { useState, useEffect } from 'react';
import axiosInstance from '@/utils/axiosConfig';
import { toast } from '@/utils/toast';
import Pagination from '@/components/tables/Pagination';
import { useOrderNotifications } from '@/hooks/useOrderNotifications';
import { useOrderRequestNotifications } from '@/hooks/useOrderRequestNotifications';

interface Reason {
  _id: string;
  reasonType: 'waiting' | 'rejected';
  reasonText: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export default function ReasonManagement() {
  const [reasons, setReasons] = useState<Reason[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0
  });
  const [showModal, setShowModal] = useState(false);
  const [editingReason, setEditingReason] = useState<Reason | null>(null);
  const [formData, setFormData] = useState({
    reasonType: 'waiting' as 'waiting' | 'rejected',
    reasonText: ''
  });

  // Add order notifications
  useOrderNotifications("Reason Management");
  useOrderRequestNotifications("Reason Management");

  useEffect(() => {
    fetchReasons(1);
  }, []);

  const fetchReasons = async (page: number = pagination.page, limit: number = pagination.limit) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/restaurants/order-requests/action-reasons?page=${page}&limit=${limit}`);
      setReasons(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('Failed to fetch reasons');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    fetchReasons(page, pagination.limit);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingReason) {
        await axiosInstance.patch(`/api/restaurants/order-requests/action-reasons/${editingReason._id}`, {
          reasonText: formData.reasonText
        });
        toast.success('Reason updated successfully');
      } else {
        await axiosInstance.post('/api/restaurants/order-requests/action-reasons', formData);
        toast.success('Reason created successfully');
      }
      setShowModal(false);
      setEditingReason(null);
      setFormData({ reasonType: 'waiting', reasonText: '' });
      fetchReasons(pagination.page, pagination.limit);
    } catch (error) {
      toast.error(editingReason ? 'Failed to update reason' : 'Failed to create reason');
    }
  };

  const toggleStatus = async (reasonId: string, currentStatus: boolean) => {
    try {
      await axiosInstance.patch(`/api/restaurants/order-requests/action-reasons/${reasonId}`, {
        isActive: !currentStatus
      });
      toast.success('Status updated successfully');
      fetchReasons(pagination.page, pagination.limit);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const openEditModal = (reason: Reason) => {
    setEditingReason(reason);
    setFormData({
      reasonType: reason.reasonType,
      reasonText: reason.reasonText
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingReason(null);
    setFormData({ reasonType: 'waiting', reasonText: '' });
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Order Request Reason Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage reasons for waiting and rejected orders</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Add New Reason
        </button>
      </div>

      <div className="mb-4 flex justify-between items-center">
        {pagination.totalCount > 0 && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of {pagination.totalCount} reasons
          </p>
        )}
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Show</span>
          <select
            value={pagination.limit}
            onChange={(e) => {
              const newLimit = parseInt(e.target.value);
              setPagination(prev => ({ ...prev, limit: newLimit }));
              fetchReasons(1, newLimit);
            }}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-sm text-gray-600 dark:text-gray-400">entries</span>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="w-20 px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  #
                </th>
                <th className="w-96 px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Reason Text
                </th>
                <th className="w-32 px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Reason Type
                </th>
                <th className="w-24 px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="w-32 px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Created Date
                </th>
                <th className="w-32 px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {reasons.map((reason, index) => (
                <tr key={reason._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white text-center">
                    #{index + 1}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white text-center">
                    {reason.reasonText}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white text-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      reason.reasonType === 'waiting' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {reason.reasonType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-3">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={reason.isActive}
                          onChange={() => toggleStatus(reason._id, reason.isActive)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        reason.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {reason.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-center">
                    <div>{new Date(reason.createdAt).toLocaleDateString('en-GB').replace(/\//g, '/').slice(0, -2) + new Date(reason.createdAt).toLocaleDateString('en-GB').slice(-2)}</div>
                    <div>{new Date(reason.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                    <button
                      onClick={() => openEditModal(reason)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1"
                      title="Edit Reason"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {reasons.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">No reasons found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-6 flex justify-end">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {editingReason ? 'Edit Reason' : 'Add New Reason'}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reason Type
                  </label>
                  <select
                    value={formData.reasonType}
                    onChange={(e) => setFormData({ ...formData, reasonType: e.target.value as 'waiting' | 'rejected' })}
                    disabled={!!editingReason}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="waiting">Waiting</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reason Text
                  </label>
                  <textarea
                    value={formData.reasonText}
                    onChange={(e) => setFormData({ ...formData, reasonText: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    rows={3}
                    maxLength={200}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">{formData.reasonText.length}/200 characters</p>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingReason ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}