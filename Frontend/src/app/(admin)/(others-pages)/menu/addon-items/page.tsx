"use client";
import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Image from "next/image";
import { Plus, Edit, Trash2, Search, X } from "lucide-react";
import { useRestaurantDetails } from "@/hooks/useRestaurantDetails";
import { toast } from "@/utils/toast";
import axios from 'axios';

const BASE_URL = `${process.env.NEXT_PUBLIC_BASE_URL}`;

const getAuthHeaders = () => {
  const token = localStorage.getItem('RestaurantToken');
  return {
    'Authorization': `Bearer ${token}`
  };
};

const addonItemsApi = {
  getAll: async () => {
    const response = await axios.get(`${BASE_URL}/api/addon-items`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  create: async (data: any, image: File) => {
    const formData = new FormData();
    formData.append('data', JSON.stringify(data));
    formData.append('image', image);

    const response = await axios.post(`${BASE_URL}/api/addon-items`, formData, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  update: async (data: any, image?: File) => {
    const formData = new FormData();
    formData.append('data', JSON.stringify(data));
    if (image) {
      formData.append('image', image);
    }

    const response = await axios.put(`${BASE_URL}/api/addon-items/update`, formData, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  delete: async (id: string) => {
    const response = await axios.delete(`${BASE_URL}/api/addon-items/delete`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      data: { id }
    });
    return response.data;
  }
};

const subcategoriesApi = {
  getAll: async () => {
    const response = await axios.get(`${BASE_URL}/api/subcategories`, {
      headers: getAuthHeaders()
    });
    return response.data;
  }
};

interface AddonItem {
  _id: string;
  name: string;
  category: string;
  subcategory: string | { _id: string; name: string; category: string };
  attributes: { name: string; price: string; currency?: string }[];
  description: string;
  image: string | null;
  isAvailable: boolean;
  createdAt: string;
}

const AddonItemsPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<AddonItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [subcategoryFilter, setSubcategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    subcategory: "",
    attributes: [] as { name: string; price: string }[],
    description: "",
    image: null as File | null,
    isAvailable: true
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [currentAttribute, setCurrentAttribute] = useState("");
  const [currentPrice, setCurrentPrice] = useState("");
  const [currentCurrency, setCurrentCurrency] = useState("INR");

  const getDefaultCurrency = (country: string) => {
    const currencyMap: { [key: string]: string } = {
      "India": "INR",
      "United States": "USD",
      "United Kingdom": "GBP",
      "Canada": "CAD",
      "Australia": "AUD",
      "Germany": "EUR",
      "France": "EUR",
      "Japan": "JPY"
    };
    return currencyMap[country] || "USD";
  };
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingItem, setViewingItem] = useState<AddonItem | null>(null);

  const [addonItems, setAddonItems] = useState<AddonItem[]>([]);
  const [apiLoading, setApiLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{show: boolean, id: string, name: string}>({show: false, id: '', name: ''});

  const { restaurantDetails, loading } = useRestaurantDetails();
  const [subcategories, setSubcategories] = useState<any[]>([]);
  
  // Filter subcategories based on selected category
  const filteredSubcategories = subcategories.filter(sub => 
    !formData.category || (typeof sub === 'object' ? sub.category === formData.category : true)
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [addonRes, subcategoriesRes] = await Promise.all([
        addonItemsApi.getAll(),
        subcategoriesApi.getAll()
      ]);
      
      if (addonRes.success) {
        setAddonItems(addonRes.data);
      }
      if (subcategoriesRes.success) {
        setSubcategories(subcategoriesRes.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setApiLoading(false);
    }
  };

  const filteredItems = addonItems.filter(item => {
    return (
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (categoryFilter === "" || item.category === categoryFilter) &&
      (subcategoryFilter === "" || (typeof item.subcategory === 'object' ? item.subcategory.name === subcategoryFilter : item.subcategory === subcategoryFilter)) &&
      (statusFilter === "" || (statusFilter === "active" ? item.isAvailable : !item.isAvailable))
    );
  });

  const handleSubmit = async () => {
    const isImageRequired = !editingItem;
    const hasRequiredImage = isImageRequired ? formData.image : true;
    
    if (!formData.name || !formData.category || !formData.subcategory || formData.attributes.length === 0 || !hasRequiredImage) {
      const missingFields = [];
      if (!formData.name) missingFields.push('name');
      if (!formData.category) missingFields.push('category');
      if (!formData.subcategory) missingFields.push('subcategory');
      if (formData.attributes.length === 0) missingFields.push('attributes');
      if (isImageRequired && !formData.image) missingFields.push('image');
      
      toast.warning(`Please fill all required fields: ${missingFields.join(', ')}`);
      return;
    }

    setSubmitting(true);
    try {
      const addonData = {
        name: formData.name,
        category: formData.category,
        subcategory: formData.subcategory,
        attributes: formData.attributes,
        description: formData.description,
        isAvailable: formData.isAvailable
      };

      let response;
      if (editingItem) {
        response = await addonItemsApi.update({ ...addonData, id: editingItem._id }, formData.image || undefined);
      } else {
        response = await addonItemsApi.create(addonData, formData.image!);
      }

      if (response.success) {
        toast.success(editingItem ? 'Addon item updated successfully!' : 'Addon item created successfully!');
        fetchData();
        setFormData({ name: "", category: "", subcategory: "", attributes: [], description: "", image: null, isAvailable: true });
        setImagePreview(null);
        setCurrentAttribute("");
        setCurrentPrice("");
        setEditingItem(null);
        setShowModal(false);
      } else {
        toast.error(response.message || 'Error saving addon item');
      }
    } catch (error) {
      console.error('Error saving addon item:', error);
      toast.error('Error saving addon item');
    } finally {
      setSubmitting(false);
    }
  };



  useEffect(() => {
    if (restaurantDetails) {
      const updates: any = {};
      if (restaurantDetails.foodCategory?.length === 1) {
        updates.category = restaurantDetails.foodCategory[0];
      }
      if (restaurantDetails.country) {
        const defaultCurrency = getDefaultCurrency(restaurantDetails.country);
        setCurrentCurrency(defaultCurrency);
      }
      if (Object.keys(updates).length > 0) {
        setFormData(prev => ({ ...prev, ...updates }));
      }
    }
  }, [restaurantDetails]);

  const handleEdit = (item: AddonItem) => {
    setEditingItem(item);
    // Find subcategory ID from name or object
    const subcategoryId = typeof item.subcategory === 'object' ? item.subcategory._id : item.subcategory;
    
    setFormData({
      name: item.name,
      category: item.category,
      subcategory: subcategoryId,
      attributes: item.attributes,
      description: item.description,
      image: null,
      isAvailable: item.isAvailable
    });
    setImagePreview(null);
    setShowModal(true);
  };

  const handleDelete = async () => {
    try {
      const response = await addonItemsApi.delete(deleteConfirm.id);
      if (response.success) {
        toast.success('Addon item deleted successfully!');
        fetchData();
      } else {
        toast.error(response.message || 'Error deleting addon item');
      }
    } catch (error) {
      console.error('Error deleting addon item:', error);
      toast.error('Error deleting addon item');
    } finally {
      setDeleteConfirm({show: false, id: '', name: ''});
    }
  };

  const addAttribute = () => {
    if (currentAttribute.trim() && currentPrice.trim() && !formData.attributes.some(attr => attr.name === currentAttribute.trim())) {
      setFormData(prev => ({ ...prev, attributes: [...prev.attributes, { name: currentAttribute.trim(), price: currentPrice.trim(), currency: currentCurrency }] }));
      setCurrentAttribute("");
      setCurrentPrice("");
    }
  };

  const removeAttribute = (index: number) => {
    setFormData(prev => ({ ...prev, attributes: prev.attributes.filter((_, i) => i !== index) }));
  };

  const handleView = (item: AddonItem) => {
    setViewingItem(item);
    setShowViewModal(true);
  };

  const toggleStatus = async (item: AddonItem) => {
    setUpdatingStatus(item._id);
    try {
      const response = await addonItemsApi.update({
        id: item._id,
        name: item.name,
        category: item.category,
        subcategory: typeof item.subcategory === 'object' ? item.subcategory._id : item.subcategory,
        attributes: item.attributes,
        description: item.description,
        isAvailable: !item.isAvailable
      });
      if (response.success) {
        toast.success(`Addon item ${!item.isAvailable ? 'enabled' : 'disabled'} successfully!`);
        fetchData();
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

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("");
    setSubcategoryFilter("");
    setStatusFilter("");
  };

  if (apiLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Addon Items</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage addon items for your menu</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Addon Items</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage addon items for your menu</p>
        </div>
        <button
          onClick={() => {
            setFormData({ name: "", category: restaurantDetails?.foodCategory?.length === 1 ? restaurantDetails.foodCategory[0] : "", subcategory: "", attributes: [], description: "", image: null });
            setShowModal(true);
          }}
          className="inline-flex items-center px-4 py-2 "
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Addon
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search addon items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg  transition-colors "
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            {/* <FilterList className="w-4 h-4 text-gray-500" /> */}
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters:</span>
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white "
          >
            <option value="">All Categories</option>
            {restaurantDetails?.foodCategory?.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={subcategoryFilter}
            onChange={(e) => setSubcategoryFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 transition-colors dark:border-gray-700 dark:bg-gray-800 dark:text-white min-w-[140px]"
          >
            <option value="">All Subcategories</option>
            {subcategories.map(sub => (
              <option key={typeof sub === 'object' ? sub._id || sub.id : sub} value={typeof sub === 'object' ? sub.name : sub}>
                {typeof sub === 'object' ? sub.name : sub}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 transition-colors dark:border-gray-700 dark:bg-gray-800 dark:text-white min-w-[100px]"
          >
            <option value="">All Status</option>
            <option value="active">Available</option>
            <option value="inactive">Unavailable</option>
          </select>

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

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {apiLoading ? 'Loading...' : `Showing ${filteredItems.length} of ${addonItems.length} items`}
        </p>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        {filteredItems.length === 0 ? (
          <div>
            {/* Table Header - Always visible */}
            <div className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-[80px_1fr_120px_150px_100px_120px] gap-4 px-6 py-3">
                <div className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Image</div>
                <div className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Name</div>
                <div className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Category</div>
                <div className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Attribute</div>
                <div className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Status</div>
                <div className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Actions</div>
              </div>
            </div>
            {/* Empty State */}
            <div className="px-6 py-12 text-center">
              <div className="flex flex-col items-center">
                <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No addon items found</h3>
                <p className="text-gray-500 dark:text-gray-400">No addon items match your current search. Try adjusting your criteria.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                  <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Image</TableCell>
                  <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Name</TableCell>
                  <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Category</TableCell>
                  <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Attribute</TableCell>
                  <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Status</TableCell>
                  <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item, index) => (
                  <TableRow key={item._id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/20'}`}>
                    <TableCell className="px-6 py-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                        {item.image ? (
                          <Image src={item.image} alt={item.name} width={48} height={48} className="w-full h-full object-cover" />
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
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{item.description}</div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {typeof item.subcategory === 'object' ? item.subcategory.name : item.subcategory}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{item.category}</div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {item.attributes.slice(0, 2).map((attr, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {attr.name}
                          </span>
                        ))}
                        {item.attributes.length > 2 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            +{item.attributes.length - 2} more
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleStatus(item)}
                          disabled={updatingStatus === item._id}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
                            item.isAvailable ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          {updatingStatus === item._id ? (
                            <svg className="animate-spin h-3 w-3 mx-auto text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                              item.isAvailable ? 'translate-x-5' : 'translate-x-1'
                            }`} />
                          )}
                        </button>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {item.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleView(item)}
                          className="inline-flex items-center justify-center w-8 h-8 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="inline-flex items-center justify-center w-8 h-8 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setDeleteConfirm({show: true, id: item._id, name: item.name})}
                          className="inline-flex items-center justify-center w-8 h-8 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
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
      {showModal && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-99999">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingItem ? "Edit Addon Item" : "Create Addon Item"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingItem(null);
                  setFormData({ name: "", category: restaurantDetails?.foodCategory?.length === 1 ? restaurantDetails.foodCategory[0] : "", subcategory: "", attributes: [], description: "", image: null });
                  setCurrentAttribute("");
                  setCurrentPrice("");
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <select
                  value={formData.category}
                  onChange={(e) => {
                    const newCategory = e.target.value;
                    setFormData(prev => ({ ...prev, category: newCategory, subcategory: "" }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading || restaurantDetails?.foodCategory?.length === 1}
                >
                  <option value="">{loading ? "Loading..." : "Select Category"}</option>
                  {restaurantDetails?.foodCategory?.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <select
                  value={formData.subcategory}
                  onChange={(e) => setFormData(prev => ({ ...prev, subcategory: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Subcategory</option>
                  {filteredSubcategories.map(sub => (
                    <option key={typeof sub === 'object' ? sub.id || sub._id : sub} value={typeof sub === 'object' ? sub.id || sub._id : sub}>
                      {typeof sub === 'object' ? sub.name : sub}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Addon Image {!editingItem && '*'}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setFormData(prev => ({ ...prev, image: file }));
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setImagePreview(reader.result as string);
                        reader.readAsDataURL(file);
                      } else {
                        setImagePreview(null);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                {/* Image Preview */}
                <div className="flex gap-4">
                  {imagePreview && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">New Image:</p>
                      <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden border">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  )}
                  
                  {editingItem?.image && !imagePreview && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Current Image:</p>
                      <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden border">
                        <Image src={editingItem.image} alt={editingItem.name} width={80} height={80} className="w-full h-full object-cover" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <input
                type="text"
                placeholder="Addon Name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Attributes & Prices</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Attribute name"
                    value={currentAttribute}
                    onChange={(e) => setCurrentAttribute(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    value={currentPrice}
                    onChange={(e) => setCurrentPrice(e.target.value)}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={currentCurrency}
                    onChange={(e) => setCurrentCurrency(e.target.value)}
                    className="w-20 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!!restaurantDetails?.country}
                  >
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="CAD">CAD</option>
                  </select>
                  <button
                    type="button"
                    onClick={addAttribute}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Add
                  </button>
                </div>
                {formData.attributes.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {formData.attributes.map((attr, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium">{attr.name} - {attr.currency || 'INR'} {attr.price}</span>
                        <button
                          type="button"
                          onClick={() => removeAttribute(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
              />
              
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
                  onClick={() => {
                    setShowModal(false);
                    setEditingItem(null);
                    setFormData({ name: "", category: restaurantDetails?.foodCategory?.length === 1 ? restaurantDetails.foodCategory[0] : "", subcategory: "", attributes: [], description: "", image: null });
                    setCurrentAttribute("");
                    setCurrentPrice("");
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !formData.name || !formData.category || !formData.subcategory || formData.attributes.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {submitting && (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {editingItem ? "Update Addon" : "Create Addon"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewingItem && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-99999">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">View Addon Item</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                  {viewingItem.image ? (
                    <Image src={viewingItem.image} alt={viewingItem.name} width={64} height={64} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{viewingItem.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{viewingItem.category} - {typeof viewingItem.subcategory === 'object' ? viewingItem.subcategory.name : viewingItem.subcategory}</p>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{viewingItem.description}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Attributes & Prices</h4>
                <div className="space-y-2">
                  {viewingItem.attributes.map((attr, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{attr.name}</span>
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400">{attr.currency || 'INR'} {attr.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  viewingItem.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {viewingItem.isAvailable ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
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

export default AddonItemsPage;