"use client";
import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Image from "next/image";
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import { useRestaurantDetails } from "@/hooks/useRestaurantDetails";
import { useRouter } from "next/navigation";
import { toast } from "@/utils/toast";
import axiosInstance from '@/utils/axiosConfig';
import Pagination from '@/components/tables/Pagination';
import { useOrderNotifications } from "@/hooks/useOrderNotifications";

const itemsApi = {
  getAll: async (page: number = 1, limit: number = 10) => {
    const response = await axiosInstance.get(`/api/items?page=${page}&limit=${limit}`);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await axiosInstance.delete('/api/items/delete', {
      data: { itemId: id }
    });
    return response.data;
  },

  updateStatus: async (id: string, isAvailable: boolean, isPopular?: boolean) => {
    const payload: any = { itemId: id, isAvailable };
    if (isPopular !== undefined) {
      payload.isPopular = isPopular;
    }
    const response = await axiosInstance.patch('/api/items/status', payload);
    return response.data;
  }
};

interface MenuItem {
  _id: string;
  name: string;
  category: string;
  subcategory: string;
  price: string;
  currency: string;
  attributes: any[];
  images: string[];
  createdAt: string;
  isAvailable: boolean;
  isPopular: boolean;
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

const ItemListPage = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [subcategoryFilter, setSubcategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Add order notifications
  useOrderNotifications("Menu Items");

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{show: boolean, id: string, name: string}>({show: false, id: '', name: ''});

  useEffect(() => {
    fetchItems(1);
  }, []);

  const fetchItems = async (page: number = pagination.page, limit: number = pagination.limit) => {
    try {
      setLoading(true);
      const response = await itemsApi.getAll(page, limit);
      if (response.success) {
        setMenuItems(response.data);
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    fetchItems(page, pagination.limit);
  };

  const handleDelete = async () => {
    try {
      const response = await itemsApi.delete(deleteConfirm.id);
      if (response.success) {
        toast.success('Item deleted successfully!');
        fetchItems(pagination.page, pagination.limit);
      } else {
        toast.error(response.message || 'Error deleting item');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Error deleting item');
    } finally {
      setDeleteConfirm({show: false, id: '', name: ''});
    }
  };

  const handleTogglePopular = async (id: string, isPopular: boolean) => {
    try {
      const currentItem = menuItems.find(item => item._id === id);
      const response = await itemsApi.updateStatus(id, currentItem?.isAvailable || false, isPopular);
      if (response.success) {
        toast.success(`Item ${isPopular ? 'marked as popular' : 'unmarked as popular'} successfully!`);
        fetchItems(pagination.page, pagination.limit);
      } else {
        toast.error(response.message || 'Error updating popular status');
      }
    } catch (error) {
      console.error('Error updating popular status:', error);
      toast.error('Error updating popular status');
    }
  };

  const handleToggleStatus = async (id: string, isAvailable: boolean) => {
    try {
      const currentItem = menuItems.find(item => item._id === id);
      const response = await itemsApi.updateStatus(id, isAvailable, currentItem?.isPopular);
      if (response.success) {
        toast.success(`Item ${isAvailable ? 'marked as available' : 'marked as unavailable'} successfully!`);
        fetchItems(pagination.page, pagination.limit);
      } else {
        toast.error(response.message || 'Error updating status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error updating status');
    }
  };

  const { restaurantDetails } = useRestaurantDetails();
  
  const filteredByRestaurantCategory = menuItems.filter(item => 
    !restaurantDetails?.foodCategory || restaurantDetails.foodCategory.includes(item.category)
  );
  
  const categories = restaurantDetails?.foodCategory || [...new Set(menuItems.map(item => item.category))];
  const subcategories = [...new Set(filteredByRestaurantCategory.map(item => 
    typeof item.subcategory === 'object' ? item.subcategory?.name || '' : item.subcategory
  ))].filter(Boolean);
  const statuses = ['available', 'unavailable'];

  const filteredItems = filteredByRestaurantCategory.filter(item => {
    return (
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (categoryFilter === "" || item.category === categoryFilter) &&
      (subcategoryFilter === "" || (typeof item.subcategory === 'object' ? item.subcategory?.name === subcategoryFilter : item.subcategory === subcategoryFilter)) &&
      (statusFilter === "" || (statusFilter === 'available' ? item.isAvailable : !item.isAvailable))
    );
  });

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("");
    setSubcategoryFilter("");
    setStatusFilter("");
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Menu Items
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage all menu items in your restaurant
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Menu Items
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          View and manage all menu items in your restaurant
        </p>
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
            placeholder="Search menu items..."
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
          
          {/* Subcategory Filter */}
          <select
            value={subcategoryFilter}
            onChange={(e) => setSubcategoryFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg"
          >
            <option value="">All Subcategories</option>
            {subcategories.map(sub => (
              <option key={sub} value={sub}>{sub}</option>
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
          {(categoryFilter || subcategoryFilter || statusFilter || searchTerm) && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors dark:border-gray-700 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table Controls - Above Table */}
      <div className="flex justify-between items-center">
        {pagination.totalCount > 0 && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of {pagination.totalCount} items
          </p>
        )}
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Show</span>
          <select
            value={pagination.limit}
            onChange={(e) => {
              const newLimit = parseInt(e.target.value);
              setPagination(prev => ({ ...prev, limit: newLimit }));
              fetchItems(1, newLimit);
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
        {filteredItems.length === 0 ? (
          <div>
            {/* Empty State Header */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-[80px_1fr_120px_100px_120px_100px_120px_100px_120px] gap-4 px-6 py-3">
                <div className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Id</div>
                <div className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Image</div>
                <div className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Item Name</div>
                <div className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Category</div>
                <div className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Attributes</div>
                <div className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Price</div>
                <div className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Status</div>
                <div className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Popular</div>
                <div className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Actions</div>
              </div>
            </div>
            {/* Empty State */}
            <div className="px-6 py-12 text-center">
              <div className="flex flex-col items-center">
                <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No menu items found</h3>
                <p className="text-gray-500 dark:text-gray-400">No menu items match your current search. Try adjusting your criteria.</p>
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
                    Item Name
                  </TableCell>
                  <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Category
                  </TableCell>
                  <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Subcategory
                  </TableCell>
                  <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Attributes
                  </TableCell>
                  <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Price
                  </TableCell>
              
                  <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </TableCell>
                  <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Popular
                  </TableCell>
                  <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredItems.map((item, index) => (
                  <TableRow 
                    key={item._id} 
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
                        {item.images && item.images.length > 0 ? (
                          <Image
                            src={item.images[0]}
                            alt={item.name}
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
                        {item.name}
                      </div>
                    </TableCell>
                    
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.category}
                      </div>
                    </TableCell>
                    
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {typeof item.subcategory === 'object' ? item.subcategory?.name || 'N/A' : item.subcategory}
                      </div>
                    </TableCell>

                     <TableCell className="px-6 py-4">
                      <div className="space-y-1">
                        {item.attributes.length > 0 ? (
                          item.attributes.map((attr, attrIndex) => (
                            <div key={attrIndex} className="text-sm text-gray-900 dark:text-white">
                              {attr.name}
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-gray-500 dark:text-gray-400">N/A</div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell className="px-6 py-4">
                      <div className="space-y-1">
                        {item.attributes.length > 0 ? (
                          item.attributes.map((attr, attrIndex) => (
                            <div key={attrIndex} className="text-sm font-semibold text-gray-900 dark:text-white">
                              {item.currency === 'INR' ? '₹' : '$'}{attr.price}
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-gray-500 dark:text-gray-400">N/A</div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.isAvailable}
                            onChange={() => handleToggleStatus(item._id, !item.isAvailable)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            item.isAvailable
                              ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                              : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                          }`}
                        >
                          {item.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.isPopular || false}
                            onChange={() => handleTogglePopular(item._id, !item.isPopular)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 dark:peer-focus:ring-yellow-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-yellow-500"></div>
                        </label>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            item.isPopular
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
                          }`}
                        >
                          {item.isPopular ? 'Popular' : 'Regular'}
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => router.push(`/menu/item-detail/${item._id}`)}
                          className="flex items-center justify-center w-8 h-8 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
                          title="View Details"
                        >
                          <VisibilityIcon fontSize="small" />
                        </button>
                        <button
                          onClick={() => router.push(`/menu/add-item?edit=${item._id}`)}
                          className="flex items-center justify-center w-8 h-8 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-colors dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/20"
                          title="Edit Item"
                        >
                          <EditIcon fontSize="small" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({show: true, id: item._id, name: item.name})}
                          className="flex items-center justify-center w-8 h-8 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                          title="Delete Item"
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

export default ItemListPage;