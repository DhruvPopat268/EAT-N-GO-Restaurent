"use client";
import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import axios from 'axios';

const BASE_URL = `${process.env.NEXT_PUBLIC_BASE_URL}`;

const getAuthHeaders = () => {
  const token = localStorage.getItem('RestaurantToken');
  return {
    'Authorization': `Bearer ${token}`
  };
};

const attributesApi = {
  getAll: async () => {
    const response = await axios.get(`${BASE_URL}/api/attributes`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  create: async (data: { name: string }) => {
    const response = await axios.post(`${BASE_URL}/api/attributes`, data, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      }
    });
    return response.data;
  },

  update: async (data: { id: string; name: string; isAvailable: boolean }) => {
    const response = await axios.put(`${BASE_URL}/api/attributes/update`, data, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      }
    });
    return response.data;
  },

  delete: async (id: string) => {
    const response = await axios.delete(`${BASE_URL}/api/attributes/delete`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      data: { id }
    });
    return response.data;
  }
};

interface Attribute {
  id: string;
  name: string;
  isAvailable: boolean;
  createdAt: string;
}

const AddAttributesPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [attributeName, setAttributeName] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchAttributes();
  }, []);

  const fetchAttributes = async () => {
    try {
      const response = await attributesApi.getAll();
      if (response.success) {
        setAttributes(response.data);
      }
    } catch (error) {
      console.error('Error fetching attributes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (attribute: Attribute) => {
    setEditingId(attribute._id);
    setAttributeName(attribute.name);
    setIsAvailable(attribute.isAvailable);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await attributesApi.delete(id);
      if (response.success) {
        fetchAttributes();
      } else {
        alert(response.message || 'Error deleting attribute');
      }
    } catch (error) {
      console.error('Error deleting attribute:', error);
      alert('Error deleting attribute');
    }
  };

  const handleToggleStatus = async (id: string, newStatus: boolean) => {
    try {
      const attribute = attributes.find(attr => attr._id === id);
      if (!attribute) return;
      
      const response = await attributesApi.update({
        id,
        name: attribute.name,
        isAvailable: newStatus
      });
      
      if (response.success) {
        fetchAttributes();
      } else {
        alert(response.message || 'Error updating status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status');
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
          fetchAttributes();
          setAttributeName("");
          setIsAvailable(true);
          setEditingId(null);
          setIsModalOpen(false);
        } else {
          alert(response.message || 'Error saving attribute');
        }
      } catch (error) {
        console.error('Error saving attribute:', error);
        alert('Error saving attribute');
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
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >
          <option value="all">All Status</option>
          <option value="available">Available</option>
          <option value="unavailable">Unavailable</option>
        </select>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {loading ? 'Loading...' : `Showing ${filteredAttributes.length} of ${attributes.length} attributes`}
        </p>
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
                          onClick={() => handleDelete(attribute._id)}
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
    </div>
  );
};

export default AddAttributesPage;