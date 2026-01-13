"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/common/LoadingSpinner";

const cuisineTypes = [
  'Indian', 'Chinese', 'Italian', 'Mexican', 'Thai', 'Japanese', 'American', 'Mediterranean',
  'French', 'Korean', 'Vietnamese', 'Lebanese', 'Greek', 'Spanish', 'Turkish', 'Continental', 'Other'
];

const foodCategories = ['Veg', 'Non-Veg', 'Mixed'];

interface RestaurantData {
  basicInfo: {
    restaurantName: string;
    ownerName: string;
    foodCategory: string;
    cuisineTypes: string[];
    otherCuisine?: string;
    operatingHours: {
      openTime?: string;
      closeTime?: string;
    };
    facilities?: string[];
  };
  contactDetails: {
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };
  businessDetails: {
    licenseNumber: string;
    gstNumber: string;
    bankAccount: string;
    ifscCode: string;
    description: string;
  };
  documents: {
    primaryImage?: string;
    restaurantImages: string[];
  };
}

export default function Profile() {
  const [restaurantData, setRestaurantData] = useState<RestaurantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<RestaurantData | null>(null);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [primaryImageIndex, setPrimaryImageIndex] = useState<number>(-1);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchRestaurantDetails = async () => {
      try {
        const token = localStorage.getItem('RestaurantToken');
        if (!token) {
          router.push('/signin');
          return;
        }

        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/restaurants/details`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        setRestaurantData(response.data.data);
        setFormData(response.data.data);
      } catch (error: any) {
        console.error('Error fetching restaurant details:', error);
        if (error.response?.status === 401) {
          localStorage.removeItem('RestaurantToken');
          router.push('/signin');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantDetails();
  }, [router]);

  const handleInputChange = (section: keyof RestaurantData, field: string, value: string | string[] | object) => {
    if (!formData) return;
    setFormData({
      ...formData,
      [section]: {
        ...formData[section],
        [field]: value
      }
    });
  };

  const handleCuisineChange = (cuisine: string) => {
    if (!formData) return;
    const currentCuisines = formData.basicInfo.cuisineTypes || [];
    const updatedCuisines = currentCuisines.includes(cuisine)
      ? currentCuisines.filter(c => c !== cuisine)
      : [...currentCuisines, cuisine];
    handleInputChange('basicInfo', 'cuisineTypes', updatedCuisines);
  };

  const handleFacilityChange = (facility: string) => {
    if (!formData) return;
    const currentFacilities = formData.basicInfo.facilities || [];
    const updatedFacilities = currentFacilities.includes(facility)
      ? currentFacilities.filter(f => f !== facility)
      : [...currentFacilities, facility];
    handleInputChange('basicInfo', 'facilities', updatedFacilities);
  };

  const handleImageUpload = (files: FileList | null) => {
    if (files) {
      const existingCount = formData?.documents?.restaurantImages?.length || 0;
      const totalCount = existingCount + files.length;
      
      if (totalCount > 10) {
        alert(`Only 10 restaurant images are allowed. You currently have ${existingCount} images and are trying to add ${files.length} more.`);
        return;
      }
      
      setNewImages(Array.from(files));
    }
  };

  const setPrimaryImage = (imageUrl: string, index: number) => {
    if (!formData) return;
    
    // If setting an existing gallery image as primary
    if (index >= 0) {
      const updatedImages = [...formData.documents.restaurantImages];
      updatedImages.splice(index, 1); // Remove from gallery
      
      setFormData({
        ...formData,
        documents: {
          ...formData.documents,
          primaryImage: imageUrl,
          restaurantImages: updatedImages
        }
      });
    } else {
      // Setting primary image directly
      setFormData({
        ...formData,
        documents: {
          ...formData.documents,
          primaryImage: imageUrl
        }
      });
    }
  };

  const removePrimaryImage = () => {
    if (!formData) return;
    setFormData({
      ...formData,
      documents: {
        ...formData.documents,
        primaryImage: undefined
      }
    });
  };
  const moveImage = (fromIndex: number, toIndex: number) => {
    if (!formData) return;
    const updatedImages = [...formData.documents.restaurantImages];
    const [movedImage] = updatedImages.splice(fromIndex, 1);
    updatedImages.splice(toIndex, 0, movedImage);
    
    setFormData({
      ...formData,
      documents: {
        ...formData.documents,
        restaurantImages: updatedImages
      }
    });
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      moveImage(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const removeImage = (index: number) => {
    if (!formData) return;
    const updatedImages = formData.documents.restaurantImages.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      documents: {
        ...formData.documents,
        restaurantImages: updatedImages
      }
    });
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('RestaurantToken');
      const updateFormData = new FormData();
      
      // Add form data
      updateFormData.append('basicInfo', JSON.stringify(formData?.basicInfo));
      updateFormData.append('contactDetails', JSON.stringify(formData?.contactDetails));
      updateFormData.append('businessDetails', JSON.stringify(formData?.businessDetails));
      
      // Add primary image if exists
      if (formData?.documents?.primaryImage) {
        updateFormData.append('primaryImage', formData.documents.primaryImage);
      }
      
      // Add existing gallery images as URLs
      (formData?.documents?.restaurantImages || []).forEach(imageUrl => {
        updateFormData.append('restaurantImages', imageUrl);
      });
      
      // Add new images as files
      newImages.forEach(file => {
        updateFormData.append('restaurantImages', file);
      });
      
      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/restaurants/updateData`,
        updateFormData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      setRestaurantData(response.data.data);
      setFormData(response.data.data);
      setIsEditing(false);
      setNewImages([]);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile');
    }
  };


  if (loading) return <LoadingSpinner />;
  if (!restaurantData) return <div>No data found</div>;

  const data = isEditing ? formData! : restaurantData;
  const totalImages = (data.documents?.restaurantImages?.length || 0) + newImages.length;
  const isImageLimitExceeded = totalImages > 10;

  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="flex justify-between items-center mb-5 lg:mb-7">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Restaurant Profile
          </h3>
          <button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            disabled={isEditing && isImageLimitExceeded}
            className={`px-4 py-2 rounded-lg ${
              isEditing && isImageLimitExceeded
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {isEditing ? 'Save' : 'Edit'}
          </button>
        </div>
        
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold mb-3">Basic Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Restaurant Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={data.basicInfo.restaurantName}
                    onChange={(e) => handleInputChange('basicInfo', 'restaurantName', e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                ) : (
                  <p className="p-2 bg-gray-50 rounded">{data.basicInfo.restaurantName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Owner Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={data.basicInfo.ownerName}
                    onChange={(e) => handleInputChange('basicInfo', 'ownerName', e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                ) : (
                  <p className="p-2 bg-gray-50 rounded">{data.basicInfo.ownerName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Food Category</label>
                {isEditing ? (
                  <select
                    value={data.basicInfo.foodCategory}
                    onChange={(e) => handleInputChange('basicInfo', 'foodCategory', e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="Veg">Vegetarian</option>
                    <option value="Non-Veg">Non-Vegetarian</option>
                    <option value="Mixed">Mixed</option>
                  </select>
                ) : (
                  <p className="p-2 bg-gray-50 rounded">{data.basicInfo.foodCategory}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Cuisine Types</label>
                {isEditing ? (
                  <div className="p-2 border rounded max-h-32 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-2">
                      {cuisineTypes.map((cuisine) => (
                        <label key={cuisine} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={data.basicInfo.cuisineTypes?.includes(cuisine) || false}
                            onChange={() => handleCuisineChange(cuisine)}
                            className="rounded"
                          />
                          <span className="text-sm">{cuisine}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="p-2 bg-gray-50 rounded">{data.basicInfo.cuisineTypes?.join(', ') || 'No cuisine types selected'}</p>
                )}
              </div>
              {data.basicInfo.cuisineTypes?.includes('Other') && (
                <div>
                  <label className="block text-sm font-medium mb-1">Other Cuisine</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={data.basicInfo.otherCuisine || ''}
                      onChange={(e) => handleInputChange('basicInfo', 'otherCuisine', e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder="Specify other cuisine type"
                    />
                  ) : (
                    <p className="p-2 bg-gray-50 rounded">{data.basicInfo.otherCuisine || 'Not specified'}</p>
                  )}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Opening Time</label>
                {isEditing ? (
                  <input
                    type="time"
                    value={data.basicInfo.operatingHours?.openTime || ''}
                    onChange={(e) => handleInputChange('basicInfo', 'operatingHours', {
                      ...data.basicInfo.operatingHours,
                      openTime: e.target.value
                    })}
                    className="w-full p-2 border rounded"
                  />
                ) : (
                  <p className="p-2 bg-gray-50 rounded">
                    {data.basicInfo.operatingHours?.openTime || 'Not set'}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Closing Time</label>
                {isEditing ? (
                  <input
                    type="time"
                    value={data.basicInfo.operatingHours?.closeTime || ''}
                    onChange={(e) => handleInputChange('basicInfo', 'operatingHours', {
                      ...data.basicInfo.operatingHours,
                      closeTime: e.target.value
                    })}
                    className="w-full p-2 border rounded"
                  />
                ) : (
                  <p className="p-2 bg-gray-50 rounded">
                    {data.basicInfo.operatingHours?.closeTime || 'Not set'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold mb-3">Contact Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={data.contactDetails.email}
                    onChange={(e) => handleInputChange('contactDetails', 'email', e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                ) : (
                  <p className="p-2 bg-gray-50 rounded">{data.contactDetails.email}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={data.contactDetails.phone}
                    onChange={(e) => handleInputChange('contactDetails', 'phone', e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                ) : (
                  <p className="p-2 bg-gray-50 rounded">{data.contactDetails.phone}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Address</label>
                {isEditing ? (
                  <textarea
                    value={data.contactDetails.address}
                    onChange={(e) => handleInputChange('contactDetails', 'address', e.target.value)}
                    className="w-full p-2 border rounded"
                    rows={2}
                  />
                ) : (
                  <p className="p-2 bg-gray-50 rounded">{data.contactDetails.address}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">City</label>
                <p className="p-2 bg-gray-50 rounded">{data.contactDetails.city}</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">State</label>
                <p className="p-2 bg-gray-50 rounded">{data.contactDetails.state}</p>
              </div>
            </div>
          </div>

          {/* Business Details */}
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold mb-3">Business Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">License Number</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={data.businessDetails.licenseNumber}
                    onChange={(e) => handleInputChange('businessDetails', 'licenseNumber', e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                ) : (
                  <p className="p-2 bg-gray-50 rounded">{data.businessDetails.licenseNumber}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">GST Number</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={data.businessDetails.gstNumber}
                    onChange={(e) => handleInputChange('businessDetails', 'gstNumber', e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                ) : (
                  <p className="p-2 bg-gray-50 rounded">{data.businessDetails.gstNumber}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Bank Account</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={data.businessDetails.bankAccount}
                    onChange={(e) => handleInputChange('businessDetails', 'bankAccount', e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                ) : (
                  <p className="p-2 bg-gray-50 rounded">{data.businessDetails.bankAccount}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">IFSC Code</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={data.businessDetails.ifscCode}
                    onChange={(e) => handleInputChange('businessDetails', 'ifscCode', e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                ) : (
                  <p className="p-2 bg-gray-50 rounded">{data.businessDetails.ifscCode}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Description</label>
                {isEditing ? (
                  <textarea
                    value={data.businessDetails.description}
                    onChange={(e) => handleInputChange('businessDetails', 'description', e.target.value)}
                    className="w-full p-2 border rounded"
                    rows={3}
                  />
                ) : (
                  <p className="p-2 bg-gray-50 rounded">{data.businessDetails.description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Facilities */}
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold mb-3">Restaurant Facilities</h4>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Available Facilities</label>
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Add facility (e.g., WiFi, Parking, AC)"
                      className="w-full p-2 border rounded"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const facility = e.currentTarget.value.trim();
                          if (facility && !data.basicInfo.facilities?.includes(facility)) {
                            handleFacilityChange(facility);
                            e.currentTarget.value = '';
                          }
                        }
                      }}
                    />
                    <div className="flex flex-wrap gap-2">
                      {data.basicInfo.facilities?.map((facility, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {facility}
                          <button
                            onClick={() => {
                              const updatedFacilities = data.basicInfo.facilities?.filter(f => f !== facility) || [];
                              handleInputChange('basicInfo', 'facilities', updatedFacilities);
                            }}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-2 bg-gray-50 rounded">
                    {data.basicInfo.facilities?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {data.basicInfo.facilities.map((facility, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {facility}
                          </span>
                        ))}
                      </div>
                    ) : (
                      'No facilities added'
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Restaurant Images */}
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold mb-3">Restaurant Images</h4>
            
            {/* Primary Image Section */}
            <div className="mb-6">
              <h5 className="font-medium mb-2">Primary Image</h5>
              {data.documents.primaryImage ? (
                <div className="relative inline-block">
                  <img
                    src={data.documents.primaryImage}
                    alt="Primary Restaurant Image"
                    className="w-48 h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 border-2 border-blue-500"
                    onClick={() => setPreviewImage(data.documents.primaryImage!)}
                  />
                  <div className="absolute top-1 left-1 bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
                    PRIMARY
                  </div>
                  {isEditing && (
                    <button
                      onClick={removePrimaryImage}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  )}
                </div>
              ) : (
                <div className="w-48 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-500">
                  No primary image set
                </div>
              )}
            </div>

            {/* Gallery Images Section */}
            <div>
              <h5 className="font-medium mb-2">Gallery Images</h5>
              {isEditing && (
                <div className="mb-4">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e.target.files)}
                    className="w-full p-2 border rounded"
                  />
                  {newImages.length > 0 && (
                    <p className="text-sm text-gray-600 mt-2">
                      {newImages.length} new image(s) selected
                    </p>
                  )}
                  {isImageLimitExceeded && (
                    <p className="text-sm text-red-600 mt-2">
                      Error: Only 10 restaurant images are allowed. Current total: {totalImages}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-2">
                    💡 Drag and drop images to reorder them
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {data.documents.restaurantImages.map((image, index) => (
                  <div 
                    key={index} 
                    className={`relative ${
                      isEditing ? 'cursor-move' : ''
                    } ${
                      draggedIndex === index ? 'opacity-50' : ''
                    }`}
                    draggable={isEditing}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                  >
                    <img
                      src={image}
                      alt={`Restaurant ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80"
                      onClick={() => setPreviewImage(image)}
                    />
                    {isEditing && (
                      <>
                        <div className="absolute top-1 left-1 bg-gray-800 text-white rounded px-1 py-0.5 text-xs">
                          {index + 1}
                        </div>
                        <button
                          onClick={() => setPrimaryImage(image, index)}
                          className="absolute bottom-1 left-1 bg-blue-500 text-white rounded px-2 py-1 text-xs hover:bg-blue-600"
                        >
                          Set Primary
                        </button>
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black flex items-center justify-center z-50"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative bg-white p-4 rounded-lg max-w-2xl max-h-[80vh]">
            <img
              src={previewImage}
              alt="Restaurant Preview"
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-2 right-2 bg-gray-800 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-700"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
