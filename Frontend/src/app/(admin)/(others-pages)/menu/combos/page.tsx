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
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import MultiSelect from "@/components/form/MultiSelect";
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

  create: async (data: any, image?: File) => {
    const formData = new FormData();
    formData.append('data', JSON.stringify(data));
    if (image) {
      formData.append('image', image);
    }
    const response = await axios.post(`${BASE_URL}/api/combos/add`, formData, {
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
    const response = await axios.put(`${BASE_URL}/api/combos/update`, formData, {
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
  },

  getDetail: async (comboId: string) => {
    const response = await axios.post(`${BASE_URL}/api/combos/detail`, {
      comboId
    }, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      }
    });
    return response.data;
  },

  getItemAttributes: async (itemId: string) => {
    const response = await axios.post(`${BASE_URL}/api/combos/item-attributes`, {
      itemId
    }, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      }
    });
    return response.data;
  }
};

const itemsApi = {
  getAll: async () => {
    const response = await axios.get(`${BASE_URL}/api/items`, {
      headers: getAuthHeaders()
    });
    return response.data;
  }
};

const addonItemsApi = {
  getAll: async () => {
    const response = await axios.get(`${BASE_URL}/api/addon-items`, {
      headers: getAuthHeaders()
    });
    return response.data;
  }
};

interface ComboItem {
  _id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  items: Array<{
    itemId: { _id: string; name: string; images: string[] };
    quantity: number;
    attribute?: { _id: string; name: string };
  }>;
  image?: string;
  isAvailable: boolean;
  createdAt: string;
}

interface Item {
  _id: string;
  name: string;
  images: string[];
  attributes: Array<{
    attribute: { _id: string; name: string };
    price: number;
  }>;
}

interface ComboFormData {
  name: string;
  description: string;
  price: string;
  items: Array<{
    itemId: string;
    quantity: number;
    attribute?: string;
  }>;
  addons: string[];
  image?: File;
}

const ComboListPage = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [combos, setCombos] = useState<ComboItem[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [addonItems, setAddonItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean, id: string, name: string }>({ show: false, id: '', name: '' });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState<string | null>(null);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingCombo, setEditingCombo] = useState<ComboItem | null>(null);
  const [formData, setFormData] = useState<ComboFormData>({
    name: '',
    description: '',
    price: '',
    items: [],
    addons: [],
    image: undefined
  });
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [comboItems, setComboItems] = useState<Array<{
    itemId: string;
    quantity: number;
    attribute?: string;
    itemName?: string;
    availableAttributes?: Array<{ _id: string; name: string }>;
  }>>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewingCombo, setViewingCombo] = useState<ComboItem | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [combosRes, itemsRes, addonItemsRes] = await Promise.all([
        combosApi.getAll(),
        itemsApi.getAll(),
        addonItemsApi.getAll()
      ]);

      if (combosRes.success) {
        setCombos(combosRes.data);
      }
      if (itemsRes.success) {
        setItems(itemsRes.data.filter((item: Item) => item.attributes.length > 0));
      }
      if (addonItemsRes.success) {
        setAddonItems(addonItemsRes.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const fetchCombos = async () => {
    try {
      const response = await combosApi.getAll();
      if (response.success) {
        setCombos(response.data);
      }
    } catch (error) {
      console.error('Error fetching combos:', error);
      toast.error('Error loading combos');
    }
  };

  const handleItemSelection = async (selectedItemIds: string[]) => {
    setSelectedItems(selectedItemIds);

    const newComboItems = [];
    for (const itemId of selectedItemIds) {
      const item = items.find(i => i._id === itemId);
      if (item) {
        try {
          const attributesRes = await combosApi.getItemAttributes(itemId);
          const availableAttributes = attributesRes.success ? attributesRes.data : [];

          newComboItems.push({
            itemId,
            quantity: 1,
            itemName: item.name,
            availableAttributes
          });
        } catch (error) {
          console.error('Error fetching attributes for item:', itemId, error);
          newComboItems.push({
            itemId,
            quantity: 1,
            itemName: item.name,
            availableAttributes: []
          });
        }
      }
    }
    setComboItems(newComboItems);
  };

  const updateComboItem = (index: number, field: string, value: any) => {
    setComboItems(prev => prev.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      items: [],
      addons: [],
      image: undefined
    });
    setSelectedItems([]);
    setComboItems([]);
    setImagePreview(null);
    setEditingCombo(null);
  };

  const handleView = async (combo: ComboItem) => {
    try {
      const response = await combosApi.getDetail(combo._id);
      if (response.success) {
        setViewingCombo(response.data);
        setShowViewModal(true);
      } else {
        toast.error('Error loading combo details');
      }
    } catch (error) {
      console.error('Error fetching combo details:', error);
      toast.error('Error loading combo details');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      // Clear preview if no file selected
      setFormData(prev => ({ ...prev, image: undefined }));
      if (editingCombo?.image) {
        setImagePreview(editingCombo.image);
      } else {
        setImagePreview(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.price || comboItems.length === 0) {
      toast.error('Please fill all required fields and add at least one item');
      return;
    }

    if (comboItems.length < 2) {
      toast.error('Select min 2 items for create or update');
      return;
    }

    const hasInvalidItems = comboItems.some(item =>
      !item.attribute || item.quantity < 1
    );

    if (hasInvalidItems) {
      toast.error('Please select attributes and set quantities for all items');
      return;
    }

    setIsSubmitting(true);
    try {
      const comboData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        items: comboItems.map(item => ({
          itemId: item.itemId,
          quantity: item.quantity,
          attribute: item.attribute
        })),
        addons: formData.addons
      };

      if (editingCombo) {
        comboData.comboId = editingCombo._id;
      }

      const response = editingCombo
        ? await combosApi.update(comboData, formData.image)
        : await combosApi.create(comboData, formData.image);

      if (response.success) {
        toast.success(`Combo ${editingCombo ? 'updated' : 'created'} successfully!`);
        setShowForm(false);
        resetForm();
        fetchCombos();
      } else {
        toast.error(response.message || `Error ${editingCombo ? 'updating' : 'creating'} combo`);
      }
    } catch (error) {
      console.error('Error saving combo:', error);
      toast.error(`Error ${editingCombo ? 'updating' : 'creating'} combo`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (combo: ComboItem) => {
    setEditingCombo(combo);
    setFormData({
      name: combo.name,
      description: combo.description || '',
      price: combo.price.toString(),
      items: combo.items.filter(item => item.itemId && item.itemId._id).map(item => ({
        itemId: item.itemId._id,
        quantity: item.quantity,
        attribute: item.attribute?._id || undefined
      })),
      addons: combo.addons || [],
      image: undefined
    });

    const itemIds = combo.items.filter(item => item.itemId && item.itemId._id).map(item => item.itemId._id);
    setSelectedItems(itemIds);

    const comboItemsData = await Promise.all(combo.items.filter(item => item.itemId && item.itemId._id).map(async (item) => {
      try {
        const attributesRes = await combosApi.getItemAttributes(item.itemId._id);
        const availableAttributes = attributesRes.success ? attributesRes.data : [];

        return {
          itemId: item.itemId._id,
          quantity: item.quantity,
          attribute: item.attribute?._id || undefined,
          itemName: item.itemId.name,
          availableAttributes
        };
      } catch (error) {
        console.error('Error fetching attributes for item:', item.itemId._id, error);
        return {
          itemId: item.itemId._id,
          quantity: item.quantity,
          attribute: item.attribute?._id || undefined,
          itemName: item.itemId.name,
          availableAttributes: []
        };
      }
    }));
    setComboItems(comboItemsData);

    if (combo.image) {
      setImagePreview(combo.image);
    }

    setShowForm(true);
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
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
      setDeleteLoading(false);
      setDeleteConfirm({ show: false, id: '', name: '' });
    }
  };

  const handleToggleStatus = async (id: string, isAvailable: boolean) => {
    setStatusLoading(id);
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
    } finally {
      setStatusLoading(null);
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

  const handleCategoryFilter = async (value: string) => {
    setFilterLoading(true);
    setCategoryFilter(value);
    // Simulate filter processing time
    setTimeout(() => setFilterLoading(false), 300);
  };

  const handleStatusFilter = async (value: string) => {
    setFilterLoading(true);
    setStatusFilter(value);
    // Simulate filter processing time
    setTimeout(() => setFilterLoading(false), 300);
  };

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
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
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

        <div className="flex gap-4">
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => handleCategoryFilter(e.target.value)}
              disabled={filterLoading}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-50"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {filterLoading && (
              <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilter(e.target.value)}
              disabled={filterLoading}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-50"
            >
              <option value="">All Status</option>
              {statuses.map(status => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
            {filterLoading && (
              <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>

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

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredCombos.length} of {combos.length} combos
        </p>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        {filteredCombos.length === 0 ? (
          <div>
            <div className="border-b border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-[80px_120px_1fr_150px_120px_100px_150px] gap-4 px-6 py-3">
                <div className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Id</div>
                <div className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Image</div>
                <div className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Combo Details</div>
                <div className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Items</div>
                <div className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Price</div>
                <div className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Status</div>
                <div className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Actions</div>
              </div>
            </div>
            <div className="px-6 py-12 text-center">
              <div className="flex flex-col items-center">
                <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No combos found</h3>
                <p className="text-gray-500 dark:text-gray-400">No combos match your current search. Try adjusting your criteria.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">ID</TableCell>
                  <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Image</TableCell>
                  <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Combo Details</TableCell>
                  <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Items</TableCell>
                  <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Price</TableCell>
                  <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Status</TableCell>
                  <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Actions</TableCell>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredCombos.map((combo, index) => (
                  <TableRow
                    key={combo._id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${index % 2 === 0
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
                      <div className="w-16 h-16 relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                        {combo.image ? (
                          <Image
                            src={combo.image}
                            alt={combo.name}
                            fill
                            className="object-cover"
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
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {combo.name}
                        </div>
                        {combo.description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {combo.description.length > 50
                              ? `${combo.description.substring(0, 50)}...`
                              : combo.description
                            }
                          </div>
                        )}
                        <div className="text-xs text-gray-400 mt-1">
                          {combo.category}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="px-6 py-4">
                      <div className="space-y-1">
                        {combo.items.slice(0, 2).map((item, idx) => (
                          <div key={idx} className="text-sm text-gray-600 dark:text-gray-300">
                            {item.quantity}x {item.itemId?.name || 'Unknown Item'}
                            {item.attribute?.name && (
                              <span className="text-xs text-gray-400 ml-1">({item.attribute.name})</span>
                            )}
                          </div>
                        ))}
                        {combo.items.length > 2 && (
                          <div className="text-xs text-gray-400">
                            +{combo.items.length - 2} more items
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {combo.currency} {combo.price}
                      </div>
                    </TableCell>

                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={combo.isAvailable}
                            onChange={() => handleToggleStatus(combo._id, !combo.isAvailable)}
                            disabled={statusLoading === combo._id}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                          {statusLoading === combo._id && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            </div>
                          )}
                        </label>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${combo.isAvailable
                              ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                              : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                            }`}
                        >
                          {combo.isAvailable ? "Available" : "Unavailable"}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleView(combo)}
                          className="flex items-center justify-center w-8 h-8 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-colors dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/20"
                          title="View Combo"
                        >
                          <VisibilityIcon fontSize="small" />
                        </button>

                        <button
                          onClick={() => handleEdit(combo)}
                          className="flex items-center justify-center w-8 h-8 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
                          title="Edit Combo"
                        >
                          <EditIcon fontSize="small" />
                        </button>

                        <button
                          onClick={() => setDeleteConfirm({ show: true, id: combo._id, name: combo.name })}
                          className="flex items-center justify-center w-8 h-8 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
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

      {/* Combo Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {editingCombo ? 'Edit Combo' : 'Create New Combo'}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Combo Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg  dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter combo name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Items *
                </label>
                <MultiSelect
                  label=""
                  options={items.map(item => ({
                    value: item._id,
                    text: item.name,
                    selected: selectedItems.includes(item._id)
                  }))}
                  defaultSelected={selectedItems}
                  onChange={handleItemSelection}
                />
              </div>



              {comboItems.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                    Configure Selected Items
                  </label>
                  <div className="space-y-4">
                    {comboItems.map((item, index) => (
                      <div key={item.itemId} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                              Item
                            </label>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {item.itemName}
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                              Attribute *
                            </label>
                            <select
                              value={item.attribute || ''}
                              onChange={(e) => updateComboItem(index, 'attribute', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg  dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                              required
                            >
                              <option value="">Select Attribute</option>
                              {item.availableAttributes?.filter(attr => attr && attr._id && attr.name).map(attr => (
                                <option key={attr._id} value={attr._id}>{attr.name}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                              Quantity *
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateComboItem(index, 'quantity', parseInt(e.target.value) || 1)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg  dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <MultiSelect
                  label="Addons"
                  options={addonItems
                    .filter(addon => addon.isAvailable)
                    .map(addon => ({
                      value: addon._id,
                      text: addon.name,
                      selected: formData.addons.includes(addon._id)
                    }))
                  }
                  defaultSelected={formData.addons}
                  onChange={(selectedIds) => {
                    setFormData(prev => ({ ...prev, addons: selectedIds }));
                  }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg  dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg  dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                  {imagePreview && (
                    <div className="mt-2">
                      <div className="w-20 h-20 relative rounded-lg overflow-hidden">
                        <Image
                          src={imagePreview}
                          alt="Preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg  dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter combo description"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || comboItems.length === 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  {editingCombo ? 'Update Combo' : 'Create Combo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewingCombo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Combo Details
                </h2>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setViewingCombo(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Basic Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Name</label>
                      <p className="text-gray-900 dark:text-white">{viewingCombo.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Category</label>
                      <p className="text-gray-900 dark:text-white">{viewingCombo.category}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Price</label>
                      <p className="text-gray-900 dark:text-white font-semibold">{viewingCombo.currency} {viewingCombo.price}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Status</label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${viewingCombo.isAvailable
                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                          : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                        }`}>
                        {viewingCombo.isAvailable ? "Available" : "Unavailable"}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Image</h3>
                  <div className="w-full h-48 relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                    {viewingCombo.image ? (
                      <Image
                        src={viewingCombo.image}
                        alt={viewingCombo.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {viewingCombo.description && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Description</h3>
                  <p className="text-gray-600 dark:text-gray-300">{viewingCombo.description}</p>
                </div>
              )}

              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Items ({viewingCombo.items.length})</h3>
                <div className="space-y-3">
                  {viewingCombo.items.map((item, index) => (
                    <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 relative rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-600">
                            {item.itemId?.images?.[0] ? (
                              <Image
                                src={item.itemId.images[0]}
                                alt={item.itemId.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{item.itemId?.name || 'Unknown Item'}</p>
                            {item.attribute?.name && (
                              <p className="text-sm text-gray-500 dark:text-gray-400">Attribute: {item.attribute.name}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900 dark:text-white">Qty: {item.quantity}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {viewingCombo.addons && viewingCombo.addons.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Addons ({viewingCombo.addons.length})</h3>
                  <div className="space-y-3">
                    {viewingCombo.addons.map((addon, index) => (
                      <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 relative rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-600">
                              {addon.image ? (
                                <Image
                                  src={addon.image}
                                  alt={addon.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{addon.name}</p>
                              {addon.description && (
                                <p className="text-sm text-gray-500 dark:text-gray-400">{addon.description}</p>
                              )}
                              {addon.attributes && addon.attributes.length > 0 && (
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {addon.attributes.map((attr, i) => `${attr.name}: ${addon.currency} ${attr.price}`).join(', ')}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false, id: '', name: '' })}
        onConfirm={handleDelete}
        title="Delete Combo"
        message={`Are you sure you want to delete "${deleteConfirm.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={deleteLoading}
        type="danger"
      />
    </div>
  );
};

export default ComboListPage;