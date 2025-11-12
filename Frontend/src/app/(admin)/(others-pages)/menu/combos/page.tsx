"use client";
import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Image from "next/image";
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import { useRouter } from "next/navigation";
import { toast } from "@/utils/toast";
import axios from 'axios';

const BASE_URL = `${process.env.NEXT_PUBLIC_BASE_URL}`;

const getAuthHeaders = () => {
  const token = localStorage.getItem('RestaurantToken');
  return {
    'Authorization': `Bearer ${token}`
  };
};

const combosApi = {
  getAll: async () => {
    const response = await axios.get(`${BASE_URL}/api/combos`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  delete: async (comboId: string) => {
    const response = await axios.delete(`${BASE_URL}/api/combos/delete`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      data: { comboId }
    });
    return response.data;
  },

  updateStatus: async (comboId: string, isAvailable: boolean) => {
    const response = await axios.patch(`${BASE_URL}/api/combos/status`, {
      comboId,
      isAvailable
    }, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      }
    });
    return response.data;
  }
};

interface ComboItem {
  _id: string;
  name: string;
  description: string;
  category: string;
  subcategory?: { name: string };
  price: number;
  currency: string;
  items: Array<{
    itemId: { name: string; images: string[] };
    quantity: number;
  }>;
  images: string[];
  isAvailable: boolean;
  createdAt: string;
}

const ComboListPage = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [combos, setCombos] = useState<ComboItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{show: boolean, id: string, name: string}>({show: false, id: '', name: ''});

  useEffect(() => {
    fetchCombos();
  }, []);

  const fetchCombos = async () => {
    try {
      const response = await combosApi.getAll();
      if (response.success) {
        setCombos(response.data);
      }
    } catch (error) {
      console.error('Error fetching combos:', error);
      toast.error('Error loading combos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await combosApi.delete(deleteConfirm.id);
      if (response.success) {
        toast.success('Combo deleted successfully!');
        fetchCombos();
      } else {
        toast.error(response.message || 'Error deleting combo');
      }
    } catch (error) {
      console.error('Error deleting combo:', error);
      toast.error('Error deleting combo');
    } finally {
      setDeleteConfirm({show: false, id: '', name: ''});
    }
  };

  const handleToggleStatus = async (id: string, isAvailable: boolean) => {
    try {
      const response = await combosApi.updateStatus(id, isAvailable);
      if (response.success) {
        toast.success(`Combo ${isAvailable ? 'enabled' : 'disabled'} successfully!`);
        fetchCombos();
      } else {
        toast.error(response.message || 'Error updating status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error updating status');
    }
  };

  const categories = [...new Set(combos.map(combo => combo.category))];
  const statuses = ['available', 'unavailable'];

  const filteredCombos = combos.filter(combo => {
    return (
      combo.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (categoryFilter === "" || combo.category === categoryFilter) &&
      (statusFilter === "" || (statusFilter === 'available' ? combo.isAvailable : !combo.isAvailable))
    );
  });

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("");
    setStatusFilter("");
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Combo Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage all combo offers in your restaurant
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Combo Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage all combo offers in your restaurant
          </p>
        </div>
        <button
          onClick={() => router.push('/menu/combos/add')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add New Combo
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between">
        {/* Search */}
        <div className="w-[30%] relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search combos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg"
          />
        </div>

        {/* Filters on the right */}
        <div className="flex gap-4">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg"
          >
            <option value="">All Status</option>
            {statuses.map(status => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>

          {/* Clear Filters Button */}
          {(categoryFilter || statusFilter || searchTerm) && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>
      
      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredCombos.length} of {combos.length} combos
        </p>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        {filteredCombos.length === 0 ? (
          <div>
            {/* Empty State Header */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-[80px_1fr_120px_100px_120px_100px_120px] gap-4 px-6 py-3">
                <div className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Id</div>
                <div className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Image</div>
                <div className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Combo Name</div>
                <div className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Category</div>
                <div className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Items</div>
                <div className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Price</div>
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
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No combos found</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">No combos match your current search. Try adjusting your criteria.</p>
                <button
                  onClick={() => router.push('/menu/combos/add')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Your First Combo
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Id
                  </TableCell>
                  <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Image
                  </TableCell>
                  <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Combo Name
                  </TableCell>
                  <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Category
                  </TableCell>
                  <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Items
                  </TableCell>
                  <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Price
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
                {filteredCombos.map((combo, index) => (
                  <TableRow 
                    key={combo._id} 
                    className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                      index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/20'
                    }`}
                  >
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white font-medium">
                        #{index + 1}
                      </div>
                    </TableCell>
                    
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                        {combo.images && combo.images.length > 0 ? (
                          <Image
                            src={combo.images[0]}
                            alt={combo.name}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white font-medium">
                        {combo.name}
                      </div>
                      {combo.description && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate max-w-xs">
                          {combo.description}
                        </div>
                      )}
                    </TableCell>
                    
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {combo.category}
                      </div>
                      {combo.subcategory && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {combo.subcategory.name}
                        </div>
                      )}
                    </TableCell>
                    
                    <TableCell className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {combo.items.length} items
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {combo.items.slice(0, 2).map((item, idx) => (
                          <div key={idx}>
                            {item.itemId.name} x{item.quantity}
                          </div>
                        ))}
                        {combo.items.length > 2 && (
                          <div>+{combo.items.length - 2} more</div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {combo.currency === 'INR' ? '₹' : '$'}{combo.price}
                      </div>
                    </TableCell>
                    
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={combo.isAvailable}
                            onChange={() => handleToggleStatus(combo._id, !combo.isAvailable)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            combo.isAvailable
                              ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                              : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                          }`}
                        >
                          {combo.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => router.push(`/menu/combos/detail/${combo._id}`)}
                          className="flex items-center justify-center w-8 h-8 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <VisibilityIcon fontSize="small" />
                        </button>
                        <button
                          onClick={() => router.push(`/menu/combos/add?edit=${combo._id}`)}
                          className="flex items-center justify-center w-8 h-8 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-colors"
                          title="Edit Combo"
                        >
                          <EditIcon fontSize="small" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({show: true, id: combo._id, name: combo.name})}
                          className="flex items-center justify-center w-8 h-8 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors"
                          title="Delete Combo"
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
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
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

export default ComboListPage;