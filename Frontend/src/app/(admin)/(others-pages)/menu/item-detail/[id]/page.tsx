"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import axiosInstance from '@/utils/axiosConfig';

const itemDetailApi = {
  getDetail: async (itemId: string) => {
    const response = await axiosInstance.post('/api/items/detail', {
      itemId
    });
    return response.data;
  }
};

interface ItemDetail {
  _id: string;
  name: string;
  description: string;
  category: string;
  subcategory: {
    _id: string;
    name: string;
  };
  images: string[];
  attributes: {
    attribute: {
      _id: string;
      name: string;
    };
    price: number;
  }[];
  foodTypes: string[];
  customizations: {
    name: string;
    options: {
      label: string;
      quantity: number;
      unit: string;
      price: number;
    }[];
  }[];
  addons: {
    _id: string;
    name: string;
    description?: string;
    image: string;
    category: string;
    attributes: {
      attribute: {
        _id: string;
        name: string;
      };
      price: number;
    }[];
    currency: string;
    isAvailable: boolean;
  }[];
  currency: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

const ItemDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    if (params.id) {
      fetchItemDetail(params.id as string);
    }
  }, [params.id]);

  const fetchItemDetail = async (itemId: string) => {
    try {
      const response = await itemDetailApi.getDetail(itemId);
      if (response.success && response.data) {
        setItem(response.data);
      }
    } catch (error) {
      console.error('Error fetching item detail:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Item not found</h1>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
            >
              <ArrowBackIcon className="text-gray-600 dark:text-gray-300" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{item.name}</h1>
              <p className="text-gray-600 dark:text-gray-400">Item Details</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Images Section */}
          <div className="space-y-4">
            {item.images && item.images.length > 0 && (
              <>
                {/* Main Image */}
                <div className="aspect-square bg-white rounded-2xl overflow-hidden shadow-lg max-w-sm">
                  <Image
                    src={item.images[selectedImage]}
                    alt={item.name}
                    width={300}
                    height={300}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Thumbnail Images */}
                {item.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-3">
                    {item.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                          selectedImage === index 
                            ? 'border-blue-500 ring-2 ring-blue-200' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Image
                          src={image}
                          alt={`${item.name} ${index + 1}`}
                          width={150}
                          height={150}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            {/* Basic Info Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Category</p>
                  <p className="font-medium text-gray-900 dark:text-white">{item.category}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Subcategory</p>
                  <p className="font-medium text-gray-900 dark:text-white">{item.subcategory.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Currency</p>
                  <p className="font-medium text-gray-900 dark:text-white">{item.currency}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                  <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                    item.isAvailable 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                  }`}>
                    {item.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            {item.description && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Description</h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{item.description}</p>
              </div>
            )}

            {/* Food Types */}
            {item.foodTypes && item.foodTypes.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Food Types</h2>
                <div className="flex flex-wrap gap-2">
                  {item.foodTypes.map((type, index) => (
                    <span key={index} className="px-4 py-2 bg-blue-100 text-blue-800 text-sm font-medium rounded-full dark:bg-blue-900/20 dark:text-blue-400">
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Attributes & Pricing */}
            {item.attributes && item.attributes.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Attributes & Pricing</h2>
                <div className="space-y-3">
                  {item.attributes.map((attr, index) => (
                    <div key={index} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <span className="font-medium text-gray-900 dark:text-white">{attr.attribute.name}</span>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {item.currency === 'INR' ? '₹' : '$'}{attr.price}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Addons */}
        {item.addons && item.addons.length > 0 && (
          <div className="mt-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Available Addons</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {item.addons.map((addon) => (
                  <div key={addon._id} className="border border-gray-200 dark:border-gray-600 rounded-xl p-5">
                    <div className="flex items-start gap-4 mb-4">
                      {addon.image && (
                        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={addon.image}
                            alt={addon.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{addon.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{addon.category}</p>
                        {addon.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{addon.description}</p>
                        )}
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full mt-2 ${
                          addon.isAvailable 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {addon.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Pricing Options:</h4>
                      {addon.attributes.map((attr, attrIndex) => (
                        <div key={attrIndex} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <span className="font-medium text-gray-900 dark:text-white">{attr.attribute.name}</span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {addon.currency === 'INR' ? '₹' : '$'}{attr.price}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Customizations */}
        {item.customizations && item.customizations.length > 0 && (
          <div className="mt-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Customizations</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {item.customizations.map((custom, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-xl p-5">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{custom.name}</h3>
                    <div className="space-y-3">
                      {custom.options.map((option, optIndex) => (
                        <div key={optIndex} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div>
                            <span className="font-medium text-gray-900 dark:text-white">{option.label}</span>
                            {option.quantity > 0 && option.unit && (
                              <span className="text-gray-500 dark:text-gray-400 ml-2 text-sm">
                                ({option.quantity} {option.unit})
                              </span>
                            )}
                          </div>
                          <span className={`font-semibold ${
                            option.price > 0 
                              ? 'text-gray-900 dark:text-white' 
                              : 'text-green-600 dark:text-green-400'
                          }`}>
                            {option.price > 0 
                              ? `${item.currency === 'INR' ? '₹' : '$'}${option.price}`
                              : 'Free'
                            }
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemDetailPage;