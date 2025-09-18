"use client";
import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Image from "next/image";
import { Plus, Edit, Trash2, Search, X } from "lucide-react";

interface AddonItem {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  attributes: { name: string; price: string }[];
  description: string;
  image: string | null;
  status: boolean;
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
    image: null as File | null
  });

  const [currentAttribute, setCurrentAttribute] = useState("");
  const [currentPrice, setCurrentPrice] = useState("");
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingItem, setViewingItem] = useState<AddonItem | null>(null);

  const [addonItems, setAddonItems] = useState<AddonItem[]>([
    {
      id: "1",
      name: "Extra Cheese",
      category: "Veg",
      subcategory: "Pizza",
      attributes: [{ name: "Regular", price: "50" }, { name: "Large", price: "80" }],
      description: "Additional mozzarella cheese topping",
      image: null,
      status: true,
      createdAt: "2024-01-15"
    },
    {
      id: "2",
      name: "Chicken Tikka",
      category: "Non-Veg",
      subcategory: "Pizza",
      attributes: [{ name: "Spicy", price: "80" }, { name: "Medium", price: "60" }],
      description: "Grilled chicken tikka pieces",
      image: null,
      status: true,
      createdAt: "2024-01-14"
    }
  ]);

  const categories = ["Veg", "Non-Veg", "Fixed"];
  const subcategories = ["Pizza", "Burger", "Punjabi", "Chinese", "Beverages", "Desserts"];

  const filteredItems = addonItems.filter(item => {
    return (
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (categoryFilter === "" || item.category === categoryFilter) &&
      (subcategoryFilter === "" || item.subcategory === subcategoryFilter) &&
      (statusFilter === "" || (statusFilter === "active" ? item.status : !item.status))
    );
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.category || !formData.subcategory || formData.attributes.length === 0) return;

    if (editingItem) {
      setAddonItems(items => items.map(item => 
        item.id === editingItem.id 
          ? { ...item, ...formData, image: formData.image ? URL.createObjectURL(formData.image) : item.image }
          : item
      ));
    } else {
      const newItem: AddonItem = {
        id: (addonItems.length + 1).toString(),
        ...formData,
        image: formData.image ? URL.createObjectURL(formData.image) : null,
        status: true,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setAddonItems([...addonItems, newItem]);
    }

    setFormData({ name: "", category: "", subcategory: "", attributes: [], description: "", image: null });
    setCurrentAttribute("");
    setCurrentPrice("");
    setEditingItem(null);
    setShowModal(false);
  };

  const handleEdit = (item: AddonItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      subcategory: item.subcategory,
      attributes: item.attributes,
      description: item.description,
      image: null
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    setAddonItems(items => items.filter(item => item.id !== id));
  };

  const addAttribute = () => {
    if (currentAttribute.trim() && currentPrice.trim() && !formData.attributes.some(attr => attr.name === currentAttribute.trim())) {
      setFormData(prev => ({ ...prev, attributes: [...prev.attributes, { name: currentAttribute.trim(), price: currentPrice.trim() }] }));
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

  const toggleStatus = (id: string) => {
    setAddonItems(items => items.map(item => 
      item.id === id ? { ...item, status: !item.status } : item
    ));
  };

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("");
    setSubcategoryFilter("");
    setStatusFilter("");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Addon Items</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage addon items for your menu</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
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
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors dark:border-gray-700 dark:bg-gray-800 dark:text-white"
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
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors dark:border-gray-700 dark:bg-gray-800 dark:text-white min-w-[120px]"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={subcategoryFilter}
            onChange={(e) => setSubcategoryFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors dark:border-gray-700 dark:bg-gray-800 dark:text-white min-w-[140px]"
          >
            <option value="">All Subcategories</option>
            {subcategories.map(sub => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors dark:border-gray-700 dark:bg-gray-800 dark:text-white min-w-[100px]"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
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
          Showing {filteredItems.length} of {addonItems.length} items
        </p>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
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
                <TableRow key={item.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/20'}`}>
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
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{item.subcategory}</div>
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
                    <button
                      onClick={() => toggleStatus(item.id)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${item.status ? 'bg-blue-600' : 'bg-gray-200'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${item.status ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
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
                        onClick={() => handleDelete(item.id)}
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
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingItem ? "Edit Addon Item" : "Create Addon Item"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingItem(null);
                  setFormData({ name: "", category: "", subcategory: "", attributes: [], description: "", image: null });
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
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <select
                  value={formData.subcategory}
                  onChange={(e) => setFormData(prev => ({ ...prev, subcategory: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Subcategory</option>
                  {subcategories.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.files?.[0] || null }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
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
                        <span className="text-sm font-medium">{attr.name} - ₹{attr.price}</span>
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
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingItem(null);
                    setFormData({ name: "", category: "", subcategory: "", attributes: [], description: "", image: null });
                    setCurrentAttribute("");
                    setCurrentPrice("");
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!formData.name || !formData.category || !formData.subcategory || formData.attributes.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {editingItem ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
                  <p className="text-sm text-gray-600 dark:text-gray-400">{viewingItem.category} - {viewingItem.subcategory}</p>
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
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400">₹{attr.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  viewingItem.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {viewingItem.status ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddonItemsPage;