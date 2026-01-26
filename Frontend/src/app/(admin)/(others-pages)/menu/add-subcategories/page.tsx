// subcategory._id

"use client";
import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Image from "next/image";
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useRestaurantDetails } from "@/hooks/useRestaurantDetails";
import { toast } from "@/utils/toast";
import axiosInstance from '@/utils/axiosConfig';
import Pagination from '@/components/tables/Pagination';

const subcategoriesApi = {
  getAll: async (page: number = 1, limit: number = 10) => {
    const response = await axiosInstance.get(`/api/subcategories?page=${page}&limit=${limit}`);
    return response.data;
  },

  create: async (data: { category: string; name: string; image: File; isAvailable: boolean }) => {
    const formData = new FormData();
    formData.append('category', data.category);
    formData.append('name', data.name);
    formData.append('image', data.image);
    formData.append('isAvailable', (data.isAvailable ?? true).toString());

    const response = await axiosInstance.post('/api/subcategories', formData);
    return response.data;
  },

  update: async (data: { id: string; category: string; name: string; image?: File; isAvailable: boolean }) => {
    const formData = new FormData();
    formData.append('id', data.id);
    formData.append('category', data.category);
    formData.append('name', data.name);
    if (data.image) {
      formData.append('image', data.image);
    }
    formData.append('isAvailable', (data.isAvailable ?? true).toString());

    const response = await axiosInstance.put('/api/subcategories/update', formData);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await axiosInstance.delete('/api/subcategories/delete', {
      data: { id }
    });
    return response.data;
  },

  updateStatus: async (id: string, isAvailable: boolean) => {
    const response = await axiosInstance.patch('/api/subcategories/status', 
      { id, isAvailable }
    );
    return response.data;
  }
};

interface Subcategory {
  _id: string;
  name: string;
  category: string;
  image: string | null;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

const AddSubcategoriesPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    category: "",
    subcategoryName: "",
    subcategoryImage: null as File | null,
    isAvailable: true
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [apiLoading, setApiLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0
  });
  const [submitting, setSubmitting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{show: boolean, id: string, name: string}>({show: false, id: '', name: ''});

  const { restaurantDetails, loading } = useRestaurantDetails();

  useEffect(() => {
    fetchSubcategories(1);
  }, []);

  const fetchSubcategories = async (page: number = pagination.page, limit: number = pagination.limit) => {
    try {
      setApiLoading(true);
      const response = await subcategoriesApi.getAll(page, limit);
      if (response.success) {
        setSubcategories(response.data);
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Error fetching subcategories:', error);
    } finally {
      setApiLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    fetchSubcategories(page, pagination.limit);
  };

  const handleLimitChange = (limit: number) => {
    fetchSubcategories(1, limit);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, subcategoryImage: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };



  useEffect(() => {
    if (restaurantDetails?.foodCategory?.length === 1) {
      setFormData(prev => ({ ...prev, category: restaurantDetails.foodCategory[0] }));
    }
  }, [restaurantDetails]);

  const handleEdit = (subcategory: Subcategory) => {
    console.log('Editing subcategory:', subcategory._id);
    setEditingId(subcategory._id);
    setEditingSubcategory(subcategory);
    setFormData({
      category: subcategory.category,
      subcategoryName: subcategory.name,
      subcategoryImage: null,
      isAvailable: subcategory.isAvailable
    });
    setImagePreview(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation: For new items, image is required. For editing, image is optional.
    const isImageRequired = !editingId;
    const hasRequiredImage = isImageRequired ? formData.subcategoryImage : true;
    
    if (formData.category && formData.subcategoryName.trim() && hasRequiredImage) {
      setSubmitting(true);
      try {
        let response;
        if (editingId) {
          response = await subcategoriesApi.update({
            id: editingId,
            category: formData.category,
            name: formData.subcategoryName.trim(),
            image: formData.subcategoryImage || undefined,
            isAvailable: formData.isAvailable
          });
        } else {
          response = await subcategoriesApi.create({
            category: formData.category,
            name: formData.subcategoryName.trim(),
            image: formData.subcategoryImage!,
            isAvailable: formData.isAvailable
          });
        }

        if (response.success) {
          toast.success(editingId ? 'Subcategory updated successfully!' : 'Subcategory created successfully!');
          fetchSubcategories();
          setFormData({ category: "", subcategoryName: "", subcategoryImage: null, isAvailable: true });
          setEditingId(null);
          setEditingSubcategory(null);
          setImagePreview(null);
          setIsModalOpen(false);
        } else {
          toast.error(response.message || 'Error saving subcategory');
        }
      } catch (error) {
        console.error('Error saving subcategory:', error);
        toast.error('Error saving subcategory');
      } finally {
        setSubmitting(false);
      }
    } else {
      const missingFields = [];
      if (!formData.category) missingFields.push('category');
      if (!formData.subcategoryName.trim()) missingFields.push('name');
      if (isImageRequired && !formData.subcategoryImage) missingFields.push('image');
      
      toast.warning(`Please fill all required fields: ${missingFields.join(', ')}`);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await subcategoriesApi.delete(deleteConfirm.id);
      if (response.success) {
        toast.success('Subcategory deleted successfully!');
        fetchSubcategories();
      } else {
        toast.error(response.message || 'Error deleting subcategory');
      }
    } catch (error) {
      console.error('Error deleting subcategory:', error);
      toast.error('Error deleting subcategory');
    } finally {
      setDeleteConfirm({show: false, id: '', name: ''});
    }
  };

  const handleStatusToggle = async (subcategory: Subcategory) => {
    setUpdatingStatus(subcategory._id);
    try {
      const response = await subcategoriesApi.updateStatus(
        subcategory._id,
        !subcategory.isAvailable
      );
      if (response.success) {
        toast.success(`Subcategory ${!subcategory.isAvailable ? 'enabled' : 'disabled'} successfully!`);
        fetchSubcategories();
      } else {
        toast.error(response.message || 'Error updating status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error updating status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  if (apiLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Manage Subcategories
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Add and manage subcategories for your menu items
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Manage Subcategories
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Add and manage subcategories for your menu items
          </p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setEditingSubcategory(null);
            setFormData({ category: restaurantDetails?.foodCategory?.length === 1 ? restaurantDetails.foodCategory[0] : "", subcategoryName: "", subcategoryImage: null, isAvailable: true });
            setImagePreview(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Subcategory
        </button>
      </div>

      {/* Results Count and Records Per Page */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {apiLoading ? 'Loading...' : `Showing ${subcategories.length} of ${pagination.totalCount} subcategories`}
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

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        {subcategories.length === 0 ? (
          <div>
            {/* Table Header - Always visible */}
            <div className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-[80px_60px_1fr_100px_80px_120px_120px_100px] gap-4 px-6 py-3">
                <div className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">ID</div>
                <div className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Image</div>
                <div className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Name</div>
                <div className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Category</div>
                <div className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Status</div>
                <div className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Created</div>
                <div className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Updated</div>
                <div className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Actions</div>
              </div>
            </div>
            {/* Empty State */}
            <div className="px-6 py-12 text-center">
              <div className="flex flex-col items-center">
                <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No subcategories found</h3>
                <p className="text-gray-500 dark:text-gray-400">No subcategories match your current search. Try adjusting your criteria.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow key="header" className="bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <TableCell key="id" isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">ID</TableCell>
                  <TableCell key="image" isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Image</TableCell>
                  <TableCell key="name" isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Name</TableCell>
                  <TableCell key="category" isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Category</TableCell>
                  <TableCell key="status" isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Status</TableCell>
                  <TableCell key="created" isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Created</TableCell>
                  <TableCell key="updated" isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Updated</TableCell>
                  <TableCell key="actions" isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Actions</TableCell>
                </TableRow>
              </TableHeader>

              <TableBody>
                {subcategories.map((subcategory, index) => (
                  <TableRow 
                    key={subcategory._id} 
                    className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                      index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/20'
                    }`}
                  >
                    <TableCell key={`id-${subcategory._id}`} className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono font-semibold text-gray-900 dark:text-white">
                        #{index+1}
                      </span>
                    </TableCell>

                    <TableCell key={`image-${subcategory._id}`} className="px-6 py-4 whitespace-nowrap">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                        {subcategory.image ? (
                          <Image
                            src={subcategory.image}
                            alt={subcategory.name}
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
                    
                    <TableCell key={`name-${subcategory._id}`} className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white font-medium">
                        {subcategory.name}
                      </div>
                    </TableCell>

                    <TableCell key={`category-${subcategory._id}`} className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {subcategory.category}
                      </div>
                    </TableCell>
                    
                    <TableCell key={`status-${subcategory._id}`} className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleStatusToggle(subcategory)}
                          disabled={updatingStatus === subcategory._id}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
                            subcategory.isAvailable ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          {updatingStatus === subcategory._id ? (
                            <svg className="animate-spin h-3 w-3 mx-auto text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                              subcategory.isAvailable ? 'translate-x-5' : 'translate-x-1'
                            }`} />
                          )}
                        </button>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {subcategory.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell key={`created-${subcategory._id}`} className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {new Date(subcategory.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(subcategory.createdAt).toLocaleTimeString()}
                      </div>
                    </TableCell>
                    
                    <TableCell key={`updated-${subcategory._id}`} className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {new Date(subcategory.updatedAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(subcategory.updatedAt).toLocaleTimeString()}
                      </div>
                    </TableCell>
                    
                    <TableCell key={`actions-${subcategory._id}`} className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(subcategory)}
                          className="flex items-center justify-center w-8 h-8 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
                          title="Edit Subcategory"
                        >
                          <EditIcon fontSize="small" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({show: true, id: subcategory._id, name: subcategory.name})}
                          className="flex items-center justify-center w-8 h-8 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                          title="Delete Subcategory"
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
        <div className="flex justify-center mt-6">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-99999">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingId ? "Edit Subcategory" : "Add New Subcategory"}
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingId(null);
                  setEditingSubcategory(null);
                  setFormData({ category: restaurantDetails?.foodCategory?.length === 1 ? restaurantDetails.foodCategory[0] : "", subcategoryName: "", subcategoryImage: null, isAvailable: true });
                  setImagePreview(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  required
                  disabled={loading || restaurantDetails?.foodCategory?.length === 1}
                >
                  <option value="">{loading ? "Loading..." : "Select Category"}</option>
                  {restaurantDetails?.foodCategory?.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subcategory Name *
                </label>
                <input
                  type="text"
                  value={formData.subcategoryName}
                  onChange={(e) => setFormData(prev => ({ ...prev, subcategoryName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Enter subcategory name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subcategory Image {!editingId && '*'}
                </label>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="subcategory-image"
                    />
                    <label
                      htmlFor="subcategory-image"
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg cursor-pointer transition-colors dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
                    >
                      {editingId ? 'Change Image' : 'Choose Image'}
                    </label>
                    {formData.subcategoryImage && (
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {formData.subcategoryImage.name}
                      </span>
                    )}
                  </div>
                  
                  {/* Image Preview */}
                  <div className="flex gap-4">
                    {imagePreview && (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400">New Image:</p>
                        <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden border">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                    
                    {editingSubcategory?.image && !imagePreview && (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Current Image:</p>
                        <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden border">
                          <Image
                            src={editingSubcategory.image}
                            alt={editingSubcategory.name}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, isAvailable: !prev.isAvailable }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      formData.isAvailable ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.isAvailable ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {formData.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingId(null);
                    setEditingSubcategory(null);
                    setFormData({ category: restaurantDetails?.foodCategory?.length === 1 ? restaurantDetails.foodCategory[0] : "", subcategoryName: "", subcategoryImage: null, isAvailable: true });
                    setImagePreview(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting && (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {editingId ? 'Update Subcategory' : 'Add Subcategory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddSubcategoriesPage;