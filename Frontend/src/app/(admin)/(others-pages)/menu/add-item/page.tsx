"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { useRestaurantDetails } from "@/hooks/useRestaurantDetails";
import { toast } from "@/utils/toast";
import MultiSelect from "@/components/form/MultiSelect";
import axiosInstance from '@/utils/axiosConfig';
import { useOrderNotifications } from '@/hooks/useOrderNotifications';
import { useOrderRequestNotifications } from '@/hooks/useOrderRequestNotifications';

const itemsApi = {
  create: async (data: any, images: File[]) => {
    const formData = new FormData();
    formData.append('data', JSON.stringify(data));
    images.forEach(image => {
      formData.append('images', image);
    });

    const response = await axiosInstance.post('/api/items', formData);
    return response.data;
  },
  update: async (data: any, newImages: File[], existingImages: string[]) => {
    const formData = new FormData();
    formData.append('data', JSON.stringify({ ...data, existingImages }));
    newImages.forEach(image => {
      formData.append('images', image);
    });

    const response = await axiosInstance.put('/api/items/update', formData);
    return response.data;
  },
  bulkImport: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axiosInstance.post('/api/items/bulk-import', formData);
    return response.data;
  },
  getById: async (id: string) => {
    const response = await axiosInstance.post('/api/items/detail', {
      itemId: id
    });
    return response.data;
  }
};

const subcategoriesApi = {
  getAll: async () => {
    const response = await axiosInstance.get('/api/subcategories');
    return response.data;
  }
};

const attributesApi = {
  getAll: async () => {
    const response = await axiosInstance.get('/api/attributes');
    return response.data;
  }
};

const addonItemsApi = {
  getAll: async () => {
    const response = await axiosInstance.get('/api/addon-items');
    console.log('Addon Items Response:', response.data?.data); // Debug log
    return response.data;
  }
};

const AddItemPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const editId = searchParams.get('edit');
  const isEditMode = !!editId;
  
  const [selectedOption, setSelectedOption] = useState<"individual" | "bulk" | null>(isEditMode ? "individual" : null);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkResults, setBulkResults] = useState<any>(null);
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

  const [formData, setFormData] = useState({
    category: "",
    subcategory: "",
    productName: "",
    description: "",
    productImages: [] as File[],
    isAvailable: true,
    attributes: [] as { attribute: string; price: number; name?: string }[],
    foodTypes: [] as string[],
    customizations: [] as { name: string; MaxSelection: number; options: { label: string; price: number }[] }[],
    addons: [] as string[]
  });

  // Separate states for managing images in edit mode
  const [newImages, setNewImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  const [currentAttribute, setCurrentAttribute] = useState({
    attribute: "",
    name: "",
    price: ""
  });

  const [customizationsEnabled, setCustomizationsEnabled] = useState(false);
  const [currentCustomization, setCurrentCustomization] = useState({
    name: "",
    MaxSelection: "",
    options: [] as { label: string; price: number }[]
  });
  const [currentOption, setCurrentOption] = useState({ label: "", quantity: "", unit: "unit", price: "" });
  const [editingOptionIndex, setEditingOptionIndex] = useState<number | null>(null);

  const { restaurantDetails, loading } = useRestaurantDetails();
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [attributeOptions, setAttributeOptions] = useState<any[]>([]);
  const [addonItems, setAddonItems] = useState<any[]>([]);
  const [apiLoading, setApiLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [editItem, setEditItem] = useState<any>(null);

  // Add order notifications
  useOrderNotifications("Add Menu Item");
  useOrderRequestNotifications("Add Menu Item");

  useEffect(() => {
    fetchData();
    if (isEditMode && editId) {
      fetchItemData(editId);
    }
  }, [isEditMode, editId]);

  const fetchData = async () => {
    try {
      const [subcategoriesRes, attributesRes, addonItemsRes] = await Promise.all([
        subcategoriesApi.getAll(),
        attributesApi.getAll(),
        addonItemsApi.getAll()
      ]);

      if (subcategoriesRes.success) {
        setSubcategories(subcategoriesRes.data);
      }
      if (attributesRes.success) {
        setAttributeOptions(attributesRes.data);
      }
      if (addonItemsRes.success) {
        console.log('Fetched Addon Items:', addonItemsRes.data); // Debug log
        setAddonItems(addonItemsRes.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setApiLoading(false);
    }
  };

  const fetchItemData = async (itemId: string) => {
    try {
      const response = await itemsApi.getById(itemId);
      if (response.success) {
        const item = response.data;
        console.log('Item addons:', item.addons); // Debug log
        const selectedAddonIds = item.addons ? item.addons.map((addon: any) => addon._id) : [];
        console.log('Selected addon IDs:', selectedAddonIds); // Debug log
        setEditItem(item);
        setFormData({
          category: item.category,
          subcategory: item.subcategory._id,
          productName: item.name,
          description: item.description || '',
          productImages: [],
          isAvailable: item.isAvailable,
          attributes: item.attributes.map((attr: any) => ({
            attribute: attr.attribute._id,
            price: attr.price,
            name: attr.attribute.name
          })),
          foodTypes: item.foodTypes || [],
          customizations: item.customizations || [],
          addons: selectedAddonIds
        });
        if (item.customizations && item.customizations.length > 0) {
          setCustomizationsEnabled(true);
        }
        if (item.images && item.images.length > 0) {
          setExistingImages(item.images);
          setImagePreviews(item.images);
        }
      }
    } catch (error) {
      console.error('Error fetching item:', error);
      toast.error('Error loading item data');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (imagePreviews.length + files.length > 5) {
      toast.error('You can only upload up to 5 images');
      return;
    }
    
    if (isEditMode) {
      // In edit mode, add to newImages state
      setNewImages(prev => [...prev, ...files]);
    } else {
      // In create mode, add to formData.productImages
      setFormData(prev => ({ ...prev, productImages: [...prev.productImages, ...files] }));
    }
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;
    
    const newPreviews = [...imagePreviews];
    const draggedPreview = newPreviews[draggedIndex];
    
    newPreviews.splice(draggedIndex, 1);
    newPreviews.splice(dropIndex, 0, draggedPreview);
    
    if (isEditMode) {
      // In edit mode, handle both existing and new images
      const totalExistingCount = existingImages.length;
      const allImages = [...newImages, ...formData.productImages];
      
      if (draggedIndex < totalExistingCount && dropIndex < totalExistingCount) {
        // Both are existing images
        const newExisting = [...existingImages];
        const draggedExisting = newExisting[draggedIndex];
        newExisting.splice(draggedIndex, 1);
        newExisting.splice(dropIndex, 0, draggedExisting);
        setExistingImages(newExisting);
      } else if (draggedIndex >= totalExistingCount && dropIndex >= totalExistingCount) {
        // Both are new images
        const newImagesArray = [...newImages];
        const draggedNew = newImagesArray[draggedIndex - totalExistingCount];
        newImagesArray.splice(draggedIndex - totalExistingCount, 1);
        newImagesArray.splice(dropIndex - totalExistingCount, 0, draggedNew);
        setNewImages(newImagesArray);
      }
    } else {
      // In create mode, handle productImages
      const newImagesArray = [...formData.productImages];
      const draggedImage = newImagesArray[draggedIndex];
      newImagesArray.splice(draggedIndex, 1);
      newImagesArray.splice(dropIndex, 0, draggedImage);
      setFormData(prev => ({ ...prev, productImages: newImagesArray }));
    }
    
    setImagePreviews(newPreviews);
    setDraggedIndex(null);
  };

  const addAttribute = () => {
    if (!currentAttribute.attribute || !currentAttribute.price) {
      toast.error('Please select an attribute and enter a price');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      attributes: [...prev.attributes, {
        attribute: currentAttribute.attribute,
        price: parseFloat(currentAttribute.price),
        name: currentAttribute.name // Keep name for display purposes
      }]
    }));
    
    setCurrentAttribute({
      attribute: "",
      name: "",
      price: ""
    });
  };

  const removeAttribute = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attributes: prev.attributes.filter((_, i) => i !== index)
    }));
  };



  useEffect(() => {
    if (restaurantDetails) {
      const updates: any = {};
      if (restaurantDetails.foodCategory?.length === 1) {
        updates.category = restaurantDetails.foodCategory[0];
      }
      // Remove currency setting as it's now handled globally
      if (Object.keys(updates).length > 0) {
        setFormData(prev => ({ ...prev, ...updates }));
      }
    }
  }, [restaurantDetails]);

  const resetForm = () => {
    const defaultCurrency = restaurantDetails?.country ? getDefaultCurrency(restaurantDetails.country) : "INR";
    setFormData({
      category: restaurantDetails?.foodCategory?.length === 1 ? restaurantDetails.foodCategory[0] : "",
      subcategory: "",
      productName: "",
      description: "",
      productImages: [],
      isAvailable: true,
      attributes: [],
      foodTypes: [],
      customizations: [],
      addons: []
    });
    setCurrentAttribute({
      attribute: "",
      name: "",
      price: ""
    });
    setImagePreviews([]);
    setNewImages([]);
    setExistingImages([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (imagePreviews.length === 0) {
      toast.error('Please select at least one product image');
      return;
    }
    
    if (formData.attributes.length === 0) {
      toast.error('Please add at least one attribute with pricing');
      return;
    }

    // Validate MaxSelection for customizations
    for (const customization of formData.customizations) {
      if (customization.MaxSelection !== -1 && customization.MaxSelection <= 0) {
        toast.error('MaxSelection must be -1 or a number greater than 0');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const itemData = {
        name: formData.productName,
        description: formData.description,
        category: formData.category,
        subcategory: formData.subcategory,
        isAvailable: formData.isAvailable,
        currency: restaurantDetails?.country ? getDefaultCurrency(restaurantDetails.country) : 'INR',
        attributes: formData.attributes.map(attr => ({
          attribute: attr.attribute,
          price: attr.price
        })),
        foodTypes: formData.foodTypes,
        customizations: formData.customizations,
        addons: formData.addons
      };

      let response;
      if (isEditMode && editId) {
        itemData.itemId = editId;
        response = await itemsApi.update(itemData, newImages, existingImages);
      } else {
        response = await itemsApi.create(itemData, formData.productImages);
      }

      if (response.success) {
        toast.success(isEditMode ? "Item updated successfully!" : "Item added successfully!");
        if (isEditMode) {
          router.push('/menu/item-list');
        } else {
          resetForm();
        }
      } else {
        toast.error(response.message || (isEditMode ? 'Error updating item' : 'Error adding item'));
      }
    } catch (error) {
      console.error(isEditMode ? 'Error updating item:' : 'Error adding item:', error);
      toast.error(isEditMode ? 'Error updating item' : 'Error adding item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) {
      toast.error('Please select a file first');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await itemsApi.bulkImport(bulkFile);
      if (response.success) {
        toast.success(response.message);
        setBulkFile(null);
        setBulkResults(response.results);
        
        // Show additional toast for errors if any
        if (response.results?.errors?.length > 0) {
          toast.error(`${response.results.errors.length} items failed to import. Check details below.`);
        }
      } else {
        toast.error(response.message || 'Error importing file');
      }
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast.error(error.response?.data?.message || 'Error importing file');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Add Menu Item
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Add new items to your restaurant menu
        </p>
      </div>

      {/* Option Selection - Hidden in edit mode */}
      {!isEditMode && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Choose how you want to add items
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setSelectedOption("individual")}
              className={`p-6 border-2 rounded-lg transition-all ${selectedOption === "individual"
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                }`}
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Add Individual Item</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Add items one by one with detailed information</p>
              </div>
            </button>

            <button
              onClick={() => setSelectedOption("bulk")}
              className={`p-6 border-2 rounded-lg transition-all ${selectedOption === "bulk"
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                }`}
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Upload Menu (Bulk Import)</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Upload CSV or Excel file to add multiple items</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Individual Item Form */}
      {(selectedOption === "individual" || isEditMode) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Add Individual Item
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value, subcategory: "" }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg "
                  required
                  disabled={loading || restaurantDetails?.foodCategory?.length === 1}
                >
                  <option value="">{loading ? "Loading..." : "Select Category"}</option>
                  {restaurantDetails?.foodCategory?.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Subcategory */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subcategory *
                </label>
                <select
                  value={formData.subcategory}
                  onChange={(e) => setFormData(prev => ({ ...prev, subcategory: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg "
                  required
                  disabled={!formData.category || apiLoading}
                >
                  <option value="">{apiLoading ? 'Loading...' : 'Select Subcategory'}</option>
                  {subcategories
                    .filter(sub => sub.category === formData.category && sub.isAvailable)
                    .map(sub => (
                      <option key={sub.id} value={sub._id}>{sub.name}</option>
                    ))
                  }
                </select>
              </div>
            </div>

            {/* Product Image and Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Product Images (Max 5)
                </label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-4">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      id="product-image"
                      disabled={imagePreviews.length >= 5}
                    />
                    <label
                      htmlFor="product-image"
                      className={`px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                        imagePreviews.length >= 5
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
                      }`}
                    >
                      {imagePreviews.length >= 5 ? "Max Images Reached" : "Choose Images"}
                    </label>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {imagePreviews.length}/5 images selected
                    </span>
                  </div>
                  {imagePreviews.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        First image will be primary
                      </p>
                      <div className="grid grid-cols-5 gap-2">
                        {imagePreviews.map((preview, index) => (
                          <div
                            key={index}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, index)}
                            className={`relative w-20 h-20 border-2 rounded-lg overflow-hidden cursor-move transition-all ${
                              index === 0 
                                ? "border-blue-500 ring-2 ring-blue-200" 
                                : "border-gray-300 hover:border-gray-400"
                            } ${draggedIndex === index ? "opacity-50" : ""}`}
                          >
                            {index === 0 && (
                              <div className="absolute top-0 left-0 bg-blue-500 text-white text-xs px-1 rounded-br">
                                PRIMARY
                              </div>
                            )}
                            <Image
                              src={preview}
                              alt={`Product preview ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newPreviews = imagePreviews.filter((_, i) => i !== index);
                                setImagePreviews(newPreviews);
                                
                                if (isEditMode) {
                                  const totalExistingCount = existingImages.length;
                                  if (index < totalExistingCount) {
                                    // Remove from existing images
                                    setExistingImages(prev => prev.filter((_, i) => i !== index));
                                  } else {
                                    // Remove from new images
                                    setNewImages(prev => prev.filter((_, i) => i !== (index - totalExistingCount)));
                                  }
                                } else {
                                  // Remove from productImages in create mode
                                  setFormData(prev => ({ 
                                    ...prev, 
                                    productImages: prev.productImages.filter((_, i) => i !== index) 
                                  }));
                                }
                              }}
                              className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Product Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={formData.productName}
                  onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg "
                  placeholder="Enter product name"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg "
                placeholder="Enter product description"
                rows={3}
              />
            </div>



            {/* Attributes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                Attributes & Pricing *
              </label>
              
              {/* Add Attribute Form */}
              <div className="flex items-center gap-3 mb-4">
                <select
                  value={currentAttribute.attribute}
                  onChange={(e) => {
                    const selectedAttr = attributeOptions.find(attr => attr._id === e.target.value);
                    setCurrentAttribute(prev => ({ 
                      ...prev, 
                      attribute: e.target.value,
                      name: selectedAttr?.name || ""
                    }));
                  }}
                  className="w-1/3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  disabled={apiLoading}
                >
                  <option value="">{apiLoading ? 'Loading...' : 'Select Attribute'}</option>
                  {attributeOptions
                    .filter(attr => attr.isAvailable && !formData.attributes.some(a => a.attribute === attr._id))
                    .map(option => (
                      <option key={option._id} value={option._id}>{option.name}</option>
                    ))
                  }
                </select>

                <input
                  type="number"
                  step="0.01"
                  value={currentAttribute.price}
                  onChange={(e) => setCurrentAttribute(prev => ({ ...prev, price: e.target.value }))}
                  className="w-1/3 px-3 py-2 border border-gray-300 rounded-lg "
                  placeholder="0.00"
                />

                <div className="w-1/4 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 flex items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {restaurantDetails?.country ? getDefaultCurrency(restaurantDetails.country) : 'INR'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={addAttribute}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add
                </button>
              </div>

              {/* Added Attributes List */}
              {formData.attributes.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Added Attributes:</h4>
                  {formData.attributes.map((attr, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                      <div className="flex items-center gap-4">
                        <span className="font-medium text-gray-900 dark:text-white">{attr.name}</span>
                        <span className="text-gray-600 dark:text-gray-300">
                          {attr.price} {restaurantDetails?.country ? getDefaultCurrency(restaurantDetails.country) : 'INR'} 
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttribute(index)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors dark:hover:bg-red-900/20"
                        title="Remove attribute"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Food Types */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Food Types
              </label>
              <div className="flex flex-wrap gap-3">
                {['Regular', 'Jain', 'Swaminarayan'].map(type => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.foodTypes.includes(type)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({ ...prev, foodTypes: [...prev.foodTypes, type] }));
                        } else {
                          setFormData(prev => ({ ...prev, foodTypes: prev.foodTypes.filter(t => t !== type) }));
                        }
                      }}
                      className="mr-2 rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Addons */}
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
                disabled={apiLoading}
              />
            </div>

            {/* Customizations Toggle */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Customizations
                </label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={customizationsEnabled}
                    onChange={(e) => setCustomizationsEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {customizationsEnabled && (
                <div className="space-y-4 p-4 border border-gray-200 rounded-lg dark:border-gray-600">
                  {/* Add Customization */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={currentCustomization.name}
                        onChange={(e) => setCurrentCustomization(prev => ({ ...prev, name: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Customization name (e.g., Breads)"
                      />
                      <input
                        type="number"
                        value={currentCustomization.MaxSelection}
                        onChange={(e) => setCurrentCustomization(prev => ({ ...prev, MaxSelection: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Max selections (e.g., 2) ( -1 for unlimited )"
                        min="-1"
                      />
                    </div>
                    
                    {/* Add Options */}
                    <div className="space-y-3">
                      {/* Single Option */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={currentOption.label}
                          onChange={(e) => setCurrentOption(prev => ({ ...prev, label: e.target.value }))}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="Option name (e.g., Tawa Roti)"
                        />
                        <input
                          type="number"
                          value={currentOption.quantity}
                          onChange={(e) => setCurrentOption(prev => ({ ...prev, quantity: e.target.value }))}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="Qty"
                        />
                        <select
                          value={currentOption.unit}
                          onChange={(e) => setCurrentOption(prev => ({ ...prev, unit: e.target.value }))}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="unit">Unit</option>
                          <option value="GM">GM</option>
                          <option value="ML">ML</option>
                        </select>
                        <input
                          type="number"
                          step="0.01"
                          value={currentOption.price}
                          onChange={(e) => setCurrentOption(prev => ({ ...prev, price: e.target.value }))}
                          className="w-24 px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="Price"
                        />
                        <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 flex items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {restaurantDetails?.country ? getDefaultCurrency(restaurantDetails.country) : 'INR'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (currentOption.label) {
                              if (editingOptionIndex !== null) {
                                // Update existing option
                                setCurrentCustomization(prev => ({
                                  ...prev,
                                  options: prev.options.map((opt, i) => 
                                    i === editingOptionIndex 
                                      ? {
                                          label: currentOption.label,
                                          quantity: parseFloat(currentOption.quantity) || 0,
                                          unit: currentOption.unit,
                                          price: parseFloat(currentOption.price) || 0
                                        }
                                      : opt
                                  )
                                }));
                                setEditingOptionIndex(null);
                              } else {
                                // Add new option
                                setCurrentCustomization(prev => ({
                                  ...prev,
                                  options: [...prev.options, { 
                                    label: currentOption.label, 
                                    quantity: parseFloat(currentOption.quantity) || 0,
                                    unit: currentOption.unit,
                                    price: parseFloat(currentOption.price) || 0 
                                  }]
                                }));
                              }
                              setCurrentOption({ label: "", quantity: "", unit: "unit", price: "" });
                            }
                          }}
                          className={`px-3 py-2 text-white text-sm rounded-lg ${
                            editingOptionIndex !== null 
                              ? "bg-blue-600 hover:bg-blue-700" 
                              : "bg-green-600 hover:bg-green-700"
                          }`}
                        >
                          {editingOptionIndex !== null ? "Update Option" : "Add Option"}
                        </button>
                        {editingOptionIndex !== null && (
                          <button
                            type="button"
                            onClick={() => {
                              setCurrentOption({ label: "", quantity: "", unit: "unit", price: "" });
                              setEditingOptionIndex(null);
                            }}
                            className="px-3 py-2 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        )}
                      </div>


                    </div>

                    {/* Current Options */}
                    {currentCustomization.options.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Options:</p>
                        {currentCustomization.options.map((option, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded">
                              <div className="text-sm">
                                <span>{option.label}</span>
                                {option.quantity > 0 && option.unit && (
                                  <span className="text-gray-500 ml-2">({option.quantity} {option.unit})</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {option.price > 0 && (
                                  <span className="text-sm text-gray-600 dark:text-gray-300">
                                    {option.price} {restaurantDetails?.country ? getDefaultCurrency(restaurantDetails.country) : 'INR'} 
                                  </span>
                                )}
                                {option.price === 0 && (
                                  <span className="text-sm text-green-600 dark:text-green-400">Free</span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCurrentOption({
                                      label: option.label,
                                      quantity: option.quantity?.toString() || "",
                                      unit: option.unit || "unit",
                                      price: option.price?.toString() || ""
                                    });
                                    setEditingOptionIndex(index);
                                  }}
                                  className="text-blue-600 hover:bg-blue-100 rounded p-1"
                                  title="Edit option"
                                >
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCurrentCustomization(prev => ({
                                      ...prev,
                                      options: prev.options.filter((_, i) => i !== index)
                                    }));
                                  }}
                                  className="text-red-600 hover:bg-red-100 rounded p-1"
                                  title="Delete option"
                                >
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          if (currentCustomization.name && currentCustomization.options.length > 0) {
                            setFormData(prev => ({
                              ...prev,
                              customizations: [...prev.customizations, {
                                name: currentCustomization.name,
                                MaxSelection: parseInt(currentCustomization.MaxSelection) || 0,
                                options: currentCustomization.options
                              }]
                            }));
                          }
                          setCurrentCustomization({ name: "", MaxSelection: "", options: [] });
                        }}
                        className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                      >
                        Add Customization
                      </button>
                    </div>
                  </div>

                  {/* Added Customizations */}
                  {formData.customizations.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Added Customizations:</h4>
                      {formData.customizations.map((custom, index) => (
                        <div key={index} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <span className="font-medium text-gray-900 dark:text-white">{custom.name}</span>
                              {custom.MaxSelection !== undefined && custom.MaxSelection !== null && (
                                <span className="text-xs text-gray-500 ml-2">(Max: {custom.MaxSelection === -1 ? 'Unlimited' : custom.MaxSelection})</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setCurrentCustomization({
                                    name: custom.name,
                                    MaxSelection: custom.MaxSelection?.toString() || "",
                                    options: custom.options
                                  });
                                  setFormData(prev => ({
                                    ...prev,
                                    customizations: prev.customizations.filter((_, i) => i !== index)
                                  }));
                                }}
                                className="text-blue-600 hover:bg-blue-100 rounded p-1"
                                title="Edit customization"
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData(prev => ({
                                    ...prev,
                                    customizations: prev.customizations.filter((_, i) => i !== index)
                                  }));
                                }}
                                className="text-red-600 hover:bg-red-100 rounded p-1"
                                title="Delete customization"
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                          </div>
                          <div className="space-y-1">
                            {custom.options.map((option, optIndex) => (
                              <div key={optIndex} className="flex items-center justify-between text-sm">
                                <span>{option.label}</span>
                                <span className={option.price > 0 ? "text-gray-600 dark:text-gray-300" : "text-green-600 dark:text-green-400"}>
                                  {option.price > 0 
                                    ? `${restaurantDetails?.country ? getDefaultCurrency(restaurantDetails.country) : 'INR'} ${option.price}`
                                    : 'Free'
                                  }
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Status Toggle */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status
                </label>
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isAvailable}
                      onChange={(e) => setFormData(prev => ({ ...prev, isAvailable: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                  <span className={`text-sm font-medium ${formData.isAvailable ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                    }`}>
                    {formData.isAvailable ? "Available" : "Unavailable"}
                  </span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg "
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  </>
                ) : (
                  isEditMode ? "Update Item" : "Add Item"
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bulk Import */}
      {selectedOption === "bulk" && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Upload Menu (Bulk Import)
            </h2>
            <a
              href="/files/sample_items (3).xlsx"
              download="sample_items.xlsx"
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Download Sample File
            </a>
          </div>

          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Upload your menu file
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Drag and drop your CSV or Excel file here, or click to browse
            </p>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
              className="hidden"
              id="bulk-upload-file"
            />
            <label
              htmlFor="bulk-upload-file"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Choose File
            </label>
            {bulkFile && (
              <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                Selected: {bulkFile.name} ({(bulkFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Supported formats: CSV, XLSX (Max size: 10MB)
            </p>
          </div>

          {bulkFile && (
            <div className="mt-6">
              <button
                onClick={handleBulkUpload}
                disabled={isSubmitting}
                className="w-full px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Importing...
                  </>
                ) : (
                  'Upload File'
                )}
              </button>
            </div>
          )}

          {/* Import Results */}
          {bulkResults && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                Import Results:
              </h4>
              <div className="space-y-2">
                {bulkResults.success.length > 0 && (
                  <div className="text-sm text-green-600 dark:text-green-400">
                    ✓ {bulkResults.success.length} items imported successfully
                  </div>
                )}
                {bulkResults.errors.length > 0 && (
                  <div className="text-sm text-red-600 dark:text-red-400">
                    ✗ {bulkResults.errors.length} errors occurred
                    <details className="mt-2">
                      <summary className="cursor-pointer">View errors</summary>
                      <div className="mt-2 space-y-1 text-xs">
                        {bulkResults.errors.map((error: any, index: number) => (
                          <div key={index} className="bg-red-50 dark:bg-red-900/20 p-2 rounded">
                            Row {error.row}: {error.error}
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                )}
              </div>
              <button
                onClick={() => setBulkResults(null)}
                className="mt-3 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Clear results
              </button>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              File Format Requirements:
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Required columns: name, category, subcategory, attributes</li>
              <li>• Attributes format: "name:price,name:price" (e.g., "Small:10.99,Large:15.99")</li>
              <li>• Customizations format: "name:option,qty,unit,price;option,qty,unit,price|name:options"</li>
              <li>• Food types: comma-separated (e.g., "Regular,Jain")</li>
              <li>• Currency: INR, USD, etc. (optional, defaults to INR)</li>
              <li>• isAvailable: true/false (optional, defaults to true)</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddItemPage;