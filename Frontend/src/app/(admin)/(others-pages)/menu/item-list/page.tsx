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
import axios from 'axios';

const BASE_URL = `${process.env.NEXT_PUBLIC_BASE_URL}`;

const getAuthHeaders = () => {
  const token = localStorage.getItem('RestaurantToken');
  return {
    'Authorization': `Bearer ${token}`
  };
};

const itemsApi = {
  getAll: async () => {
    const response = await axios.get(`${BASE_URL}/api/items`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  delete: async (id: string) => {
    const response = await axios.delete(`${BASE_URL}/api/items/delete`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      data: { id }
    });
    return response.data;
  },

  updateStatus: async (id: string, isAvailable: boolean) => {
    const response = await axios.patch(`${BASE_URL}/api/items/status`, {
      id,
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
}

const ItemListPage = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [subcategoryFilter, setSubcategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await itemsApi.getAll();
      if (response.success) {
        setMenuItems(response.data);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await itemsApi.delete(id);
      if (response.success) {
        fetchItems();
      } else {
        alert(response.message || 'Error deleting item');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Error deleting item');
    }
  };

  const handleToggleStatus = async (id: string, isAvailable: boolean) => {
    try {
      const response = await itemsApi.updateStatus(id, isAvailable);
      if (response.success) {
        fetchItems();
      } else {
        alert(response.message || 'Error updating status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status');
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
              className="block w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg  "
            />
          </div>

          {/* Filters on the right */}
          <div className="flex gap-4">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg  "
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
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg  "
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
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg "
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
      
      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {loading ? 'Loading...' : `Showing ${filteredItems.length} of ${filteredByRestaurantCategory.length} items`}
          {restaurantDetails?.foodCategory && (
            <span className="ml-2 text-blue-600">({restaurantDetails.foodCategory.join(', ')} categories)</span>
          )}
        </p>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        {filteredItems.length === 0 ? (
          <div>
            {/* Empty State Header */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-[80px_1fr_120px_100px_120px_100px_120px] gap-4 px-6 py-3">
                <div className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Id</div>
                <div className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Image</div>
                <div className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Item Name</div>
                <div className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Category</div>
                <div className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Attributes</div>
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
                          onClick={() => handleDelete(item._id)}
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

    </div>
  );
};

export default ItemListPage;