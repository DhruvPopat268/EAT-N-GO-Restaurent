"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import axiosInstance from '@/utils/axiosConfig';

const combosApi = {
  getDetail: async (comboId: string) => {
    const response = await axiosInstance.post('/api/combos/detail', {
      comboId
    });
    return response.data;
  }
};

interface ComboDetail {
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
  addons?: Array<{
    _id: string;
    name: string;
    description: string;
    image: string;
    attributes: Array<{
      name: string;
      price: number;
    }>;
    currency: string;
  }>;
  image?: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

const ComboDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const [combo, setCombo] = useState<ComboDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchComboDetail(params.id as string);
    }
  }, [params.id]);

  const fetchComboDetail = async (comboId: string) => {
    try {
      const response = await combosApi.getDetail(comboId);
      if (response.success && response.data) {
        setCombo(response.data);
      }
    } catch (error) {
      console.error('Error fetching combo detail:', error);
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

  if (!combo) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Combo not found</h1>
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{combo.name}</h1>
              <p className="text-gray-600 dark:text-gray-400">Combo Details</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Section */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-2xl overflow-hidden shadow-lg max-w-sm">
              {combo.image ? (
                <Image
                  src={combo.image}
                  alt={combo.name}
                  width={400}
                  height={400}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            {/* Basic Info Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Category</p>
                  <p className="font-medium text-gray-900 dark:text-white">{combo.category}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Price</p>
                  <p className="font-semibold text-gray-900 dark:text-white text-lg">{combo.currency} {combo.price}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                  <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                    combo.isAvailable 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                  }`}>
                    {combo.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Items Count</p>
                  <p className="font-medium text-gray-900 dark:text-white">{combo.items.length} items</p>
                </div>
              </div>
            </div>

            {/* Description */}
            {combo.description && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Description</h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{combo.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Items Section */}
        <div className="mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Items ({combo.items.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {combo.items.map((item, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 relative rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-600">
                      {item.itemId?.images?.[0] ? (
                        <Image
                          src={item.itemId.images[0]}
                          alt={item.itemId.name}
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
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{item.itemId?.name || 'Unknown Item'}</p>
                      {item.attribute?.name && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">Attribute: {item.attribute.name}</p>
                      )}
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Quantity: {item.quantity}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Addons Section */}
        {combo.addons && combo.addons.length > 0 && (
          <div className="mt-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Available Addons ({combo.addons.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {combo.addons.map((addon, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 relative rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-600">
                        {addon.image ? (
                          <Image
                            src={addon.image}
                            alt={addon.name}
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
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{addon.name}</p>
                        {addon.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{addon.description}</p>
                        )}
                        {addon.attributes && addon.attributes.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Pricing Options:</p>
                            {addon.attributes.map((attr, attrIndex) => (
                              <div key={attrIndex} className="text-sm text-gray-600 dark:text-gray-300">
                                {attr.name}: {addon.currency} {attr.price}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
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

export default ComboDetailPage;