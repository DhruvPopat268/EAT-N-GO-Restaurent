"use client";
import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { toast } from "@/utils/toast";
import axiosInstance from '@/utils/axiosConfig';
import Pagination from '@/components/tables/Pagination';
import { useOrderNotifications } from '@/hooks/useOrderNotifications';

const attributesApi = {
  getAll: async (page: number = 1, limit: number = 10) => {
    const response = await axiosInstance.get(`/api/attributes?page=${page}&limit=${limit}`, { withCredentials: true });
    return response.data;
  },

  create: async (data: { name: string }) => {
    const response = await axiosInstance.post('/api/attributes', data, { withCredentials: true });
    return response.data;
  },

  update: async (data: { id: string; name: string; isAvailable: boolean }) => {
    const response = await axiosInstance.put('/api/attributes/update', data, { withCredentials: true });
    return response.data;
  },

  updateStatus: async (data: { id: string; isAvailable: boolean }) => {
    const response = await axiosInstance.patch('/api/attributes/status', data, { withCredentials: true });
    return response.data;
  },

  delete: async (id: string) => {
    const response = await axiosInstance.delete('/api/attributes/delete', {
      data: { id },
      withCredentials: true
    });
    return response.data;
  }
};

interface Attribute {
  _id: string;
  name: string;
  isAvailable: boolean;
  createdAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

const AddAttributesPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [attributeName, setAttributeName] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteConfirm, setDeleteConfirm] = useState<{show: boolean, id: string, name: string}>({show: false, id: '', name: ''});

  // Add order notifications
  useOrderNotifications("Add Attributes");

  useEffect(() => {
    fetchAttributes(1);
  }, []);

  const fetchAttributes = async (page: number = pagination.page, limit: number = pagination.limit) => {
    try {
      setLoading(true);
      const response = await attributesApi.getAll(page, limit);
      if (response.success) {
        setAttributes(response.data);
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Error fetching attributes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    fetchAttributes(page, pagination.limit);
  };

  const handleEdit = (attribute: Attribute) => {
    setEditingId(attribute._id);
    setAttributeName(attribute.name);
    setIsAvailable(attribute.isAvailable);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      const response = await attributesApi.delete(deleteConfirm.id);
      if (response.success) {
        toast.success('Attribute deleted successfully!');
        fetchAttributes(pagination.page, pagination.limit);
      } else {
        toast.error(response.message || 'Error deleting attribute');
      }
    } catch (error) {
      console.error('Error deleting attribute:', error);
      toast.error('Error deleting attribute');
    } finally {
      setDeleteConfirm({show: false, id: '', name: ''});
    }
  };

  const handleToggleStatus = async (id: string, newStatus: boolean) => {
    try {
      const response = await attributesApi.updateStatus({
        id,
        isAvailable: newStatus
      });
      
      if (response.success) {
        toast.success(`Attribute ${newStatus ? 'enabled' : 'disabled'} successfully!`);
        fetchAttributes(pagination.page, pagination.limit);
      } else {
        toast.error(response.message || 'Error updating status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error updating status');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (attributeName.trim()) {
      try {
        let response;
        if (editingId) {
          response = await attributesApi.update({
            id: editingId,
            name: attributeName.trim(),
            isAvailable
          });
        } else {
          response = await attributesApi.create({
            name: attributeName.trim()
          });
        }

        if (response.success) {
          toast.success(editingId ? 'Attribute updated successfully!' : 'Attribute created successfully!');
          fetchAttributes(pagination.page, pagination.limit);
          setAttributeName("");
          setIsAvailable(true);
          setEditingId(null);
          setIsModalOpen(false);
        } else {
          toast.error(response.message || 'Error saving attribute');
        }
      } catch (error) {
        console.error('Error saving attribute:', error);
        toast.error('Error saving attribute');
      }
    }
  };

  // Filter attributes based on search and status
  const filteredAttributes = attributes.filter(attr => {
    const matchesSearch = attr.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "available" && attr.isAvailable) ||
                         (statusFilter === "unavailable" && !attr.isAvailable);
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Manage Attributes
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Add and manage product attributes for your menu items
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Manage Attributes
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Add and manage product attributes for your menu items
          </p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setAttributeName("");
            setIsAvailable(true);
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          Add Attribute
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center justify-between mb-4">
        <div className="w-[30%] relative">
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search attributes..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >
          <option value="all">All Status</option>
          <option value="available">Available</option>
          <option value="unavailable">Unavailable</option>
        </select>
      </div>

      {/* Table Controls - Above Table */}
      <div className="flex justify-between items-center mb-4">
        {pagination.totalCount > 0 && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of {pagination.totalCount} attributes
          </p>
        )}
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Show</span>
          <select
            value={pagination.limit}
            onChange={(e) => {
              const newLimit = parseInt(e.target.value);
              setPagination(prev => ({ ...prev, limit: newLimit }));
              fetchAttributes(1, newLimit);
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

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        {filteredAttributes.length === 0 ? (
          <div>
            {/* Table Header - Always visible */}
            <div className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-[150px_1fr_150px_150px] gap-4 px-6 py-3">
                <div className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">ID</div>
                <div className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Attribute Name</div>
                <div className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Status</div>
                <div className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Actions</div>
              </div>
            </div>
            {/* Empty State */}
            <div className="px-6 py-12 text-center">
              <div className="flex flex-col items-center">
                <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No attributes found</h3>
                <p className="text-gray-500 dark:text-gray-400">No attributes match your current search. Try adjusting your criteria.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">ID</TableCell>
                  <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Attribute Name</TableCell>
                  <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Status</TableCell>
                  <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Actions</TableCell>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredAttributes.map((attribute, index) => (
                  <TableRow
                    key={attribute._id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                      index % 2 === 0
                        ? "bg-white dark:bg-gray-900"
                        : "bg-gray-50/50 dark:bg-gray-800/20"
                    }`}
                  >
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono font-semibold text-gray-900 dark:text-white">
                        #{index + 1}
                      </span>
                    </TableCell>

                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white font-medium">
                        {attribute.name}
                      </div>
                    </TableCell>

                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={attribute.isAvailable}
                            onChange={() => handleToggleStatus(attribute._id, !attribute.isAvailable)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            attribute.isAvailable
                              ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                              : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                          }`}
                        >
                          {attribute.isAvailable ? "Available" : "Unavailable"}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(attribute)}
                          className="flex items-center justify-center w-8 h-8 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
                          title="Edit Attribute"
                        >
                          <EditIcon fontSize="small" />
                        </button>

                        <button
                          onClick={() => setDeleteConfirm({show: true, id: attribute._id, name: attribute.name})}
                          className="flex items-center justify-center w-8 h-8 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                          title="Delete Attribute"
                        >
                          <DeleteIcon fontSize="small" />
                        </button>
                      </div>
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
        <div className="mt-6 flex justify-end">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[99999]">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingId ? "Edit Attribute" : "Add New Attribute"}
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingId(null);
                  setAttributeName("");
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Attribute Name *
                </label>
                <input
                  type="text"
                  value={attributeName}
                  onChange={(e) => setAttributeName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg "
                  placeholder="Enter attribute name"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAvailable}
                      onChange={(e) => setIsAvailable(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                  <span className={`text-sm font-medium ${
                    isAvailable ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                  }`}>
                    {isAvailable ? "Available" : "Unavailable"}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingId(null);
                    setAttributeName("");
                    setIsAvailable(true);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingId ? "Update Attribute" : "Add Attribute"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999]">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Confirm Delete</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete "{deleteConfirm.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm({show: false, id: '', name: ''})}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddAttributesPage;