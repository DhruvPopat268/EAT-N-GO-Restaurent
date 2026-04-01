"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { toast } from "@/utils/toast";
import axiosInstance from '@/utils/axiosConfig';
import { formatDateTime } from '@/utils/dateUtils';

// Utility function to format time to 12-hour format with AM/PM
const formatTimeTo12Hour = (time24: string): string => {
  if (!time24) return '-';
  const [hours, minutes] = time24.split(':');
  const hour24 = parseInt(hours, 10);
  if (isNaN(hour24) || hour24 < 0 || hour24 > 23) return '-';
  const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
  const ampm = hour24 >= 12 ? 'PM' : 'AM';
  return `${hour12}:${minutes} ${ampm}`;
};

const orderDetailApi = {
  getById: async (orderId: string) => {
    const response = await axiosInstance.get(`/api/restaurants/orders/detail/${orderId}`);
    return response.data;
  },

  updateToConfirmed: async (orderId: string) => {
    const response = await axiosInstance.patch(`/api/restaurants/orders/confirm/${orderId}`);
    return response.data;
  },

  updateToPreparing: async (orderId: string) => {
    const response = await axiosInstance.patch(`/api/restaurants/orders/preparing/${orderId}`);
    return response.data;
  },

  updateToReady: async (orderId: string) => {
    const response = await axiosInstance.patch(`/api/restaurants/orders/ready/${orderId}`);
    return response.data;
  },

  updateToServed: async (orderId: string) => {
    const response = await axiosInstance.patch(`/api/restaurants/orders/served/${orderId}`);
    return response.data;
  },

  updateToCompleted: async (orderId: string) => {
    const response = await axiosInstance.patch(`/api/restaurants/orders/completed/${orderId}`);
    return response.data;
  },

  cancelOrder: async (orderId: string) => {
    const response = await axiosInstance.patch(`/api/restaurants/orders/cancel/${orderId}`);
    return response.data;
  }
};

const getAvailableStatuses = (currentStatus: string, orderType: string) => {
  const statusFlow = {
    'waiting': 'confirmed',
    'confirmed': 'preparing',
    'preparing': 'ready',
    'ready': orderType === 'dine-in' ? 'served' : 'completed',
    'served': 'completed'
  };
  
  const nextStatus = statusFlow[currentStatus as keyof typeof statusFlow];
  
  if (nextStatus) {
    return [currentStatus, nextStatus];
  }
  
  // For final statuses (completed, cancelled, refunded), show only current
  return [currentStatus];
};

interface OrderDetail {
  _id: string;
  orderNo: string;
  userId: {
    _id: string;
    fullName: string;
    phone: string;
  };
  userCurrentLocation?: {
    address: string;
    latitude: number;
    longitude: number;
  };
  distanceToReachRestaurant?: string;
  durationToReachRestaurant?: string;
  orderType: string;
  numberOfGuests?: number;
  dineInstructions?: string;
  paymentMethod: string;
  baseTotalAmount: number;
  totalAmount: number;
  appliedCoupon?: {
    couponId: {
      _id: string;
      name: string;
      couponCode: string;
      discountType: string;
      amount: number;
      maxDiscount?: number;
    };
    savedAmount: number;
  };
  appliedPendingCancellationCharges?: number;
  status: string;
  waitingTime?: {
    startTime: string;
    endTime: string;
  };
  eatTimings?: {
    startTime: string;
    endTime: string;
  };
  takeawayTimings?: {
    startTime: string;
    endTime: string;
  };
  userRatingId?: {
    _id: string;
    restaurantRating: number;
    itemRatings: Array<{
      itemId: {
        _id: string;
        name: string;
      };
      rating: number;
      _id: string;
    }>;
    createdAt: string;
  };
  items: Array<{
    _id: string;
    itemId: {
      _id: string;
      name: string;
      description: string;
      images: string[];
      category: string;
      subcategory: {
        _id: string;
        name: string;
      };
      currency: string;
    };
    quantity: number;
    selectedAttribute: {
      _id: string;
      name: string;
    };
    selectedFoodType: string;
    selectedCustomizations: Array<{
      customizationId: string;
      customizationName: string;
      selectedOptions: Array<{
        optionId: string;
        optionName: string;
        optionPrice: number;
        quantity: number;
        optionUnit: string;
      }>;
    }>;
    selectedAddons: Array<{
      addonId: {
        _id: string;
        name: string;
        category: string;
      };
      selectedAttribute: {
        _id: string;
        name: string;
      };
      quantity: number;
      addonTotal: number;
    }>;
    itemTotal: number;
    customizationTotal: number;
    addonsTotal: number;
  }>;
  createdAt: string;
  updatedAt: string;
  orderTotal: number;
}

const OrderDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusConfirm, setStatusConfirm] = useState<{show: boolean, currentStatus: string, newStatus: string}>({show: false, currentStatus: '', newStatus: ''});

  useEffect(() => {
    if (orderId) {
      fetchOrderDetail();
    }
  }, [orderId]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const response = await orderDetailApi.getById(orderId);
      if (response.success) {
        setOrder(response.data);
      } else {
        toast.error('Order not found');
        router.back();
      }
    } catch (error) {
      console.error('Error fetching order detail:', error);
      toast.error('Error fetching order details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Order not found</h3>
          <p className="text-gray-500 dark:text-gray-400">The requested order could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors dark:border-gray-600 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Order #{order.orderNo}
              </h1>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                order.status === 'preparing' ? 'bg-yellow-100 text-yellow-800' :
                order.status === 'ready' ? 'bg-purple-100 text-purple-800' :
                order.status === 'served' ? 'bg-indigo-100 text-indigo-800' :
                order.status === 'completed' ? 'bg-green-100 text-green-800' :
                order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              } capitalize`}>{order.status}</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Order details and items
            </p>
          </div>
        </div>
        
        {/* Status Update Dropdown - Hide for completed orders */}
        {order.status !== 'completed' && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Update Status To:</span>
            <select
              value={order.status}
              onChange={(e) => {
                if (e.target.value !== order.status) {
                  setStatusConfirm({
                    show: true,
                    currentStatus: order.status,
                    newStatus: e.target.value
                  });
                }
              }}
              disabled={updatingStatus}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              {getAvailableStatuses(order.status, order.orderType).map(status => (
                <option key={status} value={status} className="capitalize">
                  {status}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Info */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">User Info</label>
                <p className="text-sm text-gray-600 dark:text-gray-400">{order.userId.fullName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">{order.userId.phone}</p>
              </div>

              {order.userCurrentLocation && (
                <div>
                  <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">User Location</label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{order.userCurrentLocation.address}</p>
                  {order.distanceToReachRestaurant && (
                    <p className="text-xs text-gray-500 dark:text-gray-500">Distance: {order.distanceToReachRestaurant}</p>
                  )}
                  {order.durationToReachRestaurant && (
                    <p className="text-xs text-gray-500 dark:text-gray-500">Duration: {order.durationToReachRestaurant}</p>
                  )}
                </div>
              )}

              <div>
                <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">Order Type</label>
                <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{order.orderType}</p>
                {order.numberOfGuests != 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-500">Guests: {order.numberOfGuests}</p>
                )}
              </div>

              {(order.eatTimings || order.takeawayTimings) && (
                <div>
                  <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {order.eatTimings ? 'Eat Timings' : 'Takeaway Timings'}
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {order.eatTimings 
                      ? `${formatTimeTo12Hour(order.eatTimings.startTime)} - ${formatTimeTo12Hour(order.eatTimings.endTime)}`
                      : `${formatTimeTo12Hour(order.takeawayTimings.startTime)} - ${formatTimeTo12Hour(order.takeawayTimings.endTime)}`
                    }
                  </p>
                </div>
              )}

              {order.waitingTime && (
                <div>
                  <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">Waiting Time</label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatTimeTo12Hour(order.waitingTime.startTime)} - {formatTimeTo12Hour(order.waitingTime.endTime)}
                  </p>
                </div>
              )}

              {order.dineInstructions && (
                <div>
                  <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">Instructions</label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{order.dineInstructions}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">Payment Method</label>
                <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{order.paymentMethod.replace('_', ' ')}</p>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">Created At</label>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <div>{formatDateTime(order.createdAt).date}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{formatTimeTo12Hour(formatDateTime(order.createdAt).time)}</div>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">Updated At</label>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <div>{formatDateTime(order.updatedAt).date}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{formatTimeTo12Hour(formatDateTime(order.updatedAt).time)}</div>
                </div>
              </div>

              {order.userRatingId && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">Restaurant Rating</label>
                  <div className="flex items-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className={`w-5 h-5 ${star <= (order.userRatingId?.restaurantRating || 0) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">{order.userRatingId.restaurantRating || 0}/5</span>
                  </div>
                  {order.userRatingId.itemRatings && order.userRatingId.itemRatings.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 mb-2">Item Ratings:</p>
                      {order.userRatingId.itemRatings.map((itemRating) => (
                        <div key={itemRating._id} className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-600 dark:text-gray-400">{itemRating.itemId?.name || '-'}</span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg key={star} className={`w-3 h-3 ${star <= (itemRating.rating || 0) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                            <span className="ml-1 text-xs text-gray-600 dark:text-gray-400">{itemRating.rating || 0}/5</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">{order.userRatingId.createdAt ? formatDateTime(order.userRatingId.createdAt).date : '-'}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Items</h2>
            
            <div className="space-y-6">
              {order.items.map((item, index) => (
                <div key={item._id} className={`border-b border-gray-200 dark:border-gray-700 pb-6 last:border-b-0 last:pb-0 ${item.isPostOrder ? 'bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border-l-4 border-l-blue-500' : ''}`}>
                  {item.isPostOrder && (
                    <div className="mb-3 flex items-center gap-2">
                      <span className="text-xs font-semibold bg-blue-600 text-white px-3 py-1 rounded-full">
                        🔄 Post Ordered Item
                      </span>
                    </div>
                  )}
                  <div className="flex gap-4">
                    {/* Item Image */}
                    <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {item.itemId.images?.[0] ? (
                        <Image
                          src={item.itemId.images[0]}
                          alt={item.itemId.name}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{item.itemId.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{item.itemId.description}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {item.itemId.category} • {item.itemId.subcategory.name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600 dark:text-green-400">₹{item.itemTotal}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Qty: {item.quantity}</p>
                        </div>
                      </div>

                      {/* Selected Options */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            {item.selectedAttribute.name}
                          </span>
                          <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            {item.selectedFoodType}
                          </span>
                        </div>

                        {/* Customizations */}
                        {item.selectedCustomizations.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1">Customizations:</p>
                            {item.selectedCustomizations.map((customization, idx) => (
                              <div key={idx} className="ml-2">
                                <p className="text-xs text-gray-600 dark:text-gray-400">{customization.customizationName}:</p>
                                {customization.selectedOptions.map((option, optIdx) => (
                                  <p key={optIdx} className="text-xs text-gray-600 dark:text-gray-400 ml-2">
                                    • {option.optionName} ({option.optionUnit}) x{option.quantity}
                                  </p>
                                ))}
                              </div>
                            ))}
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Customization Total: ₹{item.customizationTotal}
                            </p>
                          </div>
                        )}

                        {/* Addons */}
                        {item.selectedAddons.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1">Addons:</p>
                            {item.selectedAddons.map((addon, idx) => (
                              <div key={idx} className="ml-2">
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  • {addon.addonId.name} ({addon.selectedAttribute.name}) x {addon.quantity} - ₹{addon.addonTotal}
                                </p>
                              </div>
                            ))}
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Addons Total: ₹{item.addonsTotal}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Base Total:</span>
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">₹{order.baseTotalAmount}</span>
                </div>
                
                {order.appliedCoupon && (
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Coupon Discount:</span>
                      <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 px-2 py-0.5 rounded font-medium">
                        {order.appliedCoupon.couponId.couponCode}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-red-600 dark:text-red-400">-₹{order.appliedCoupon.savedAmount}</span>
                  </div>
                )}
                
                {order.appliedPendingCancellationCharges && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Cancellation Charges:</span>
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">+₹{order.appliedPendingCancellationCharges}</span>
                  </div>
                )}
                
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">Final Total:</span>
                    <span className="text-xl font-bold text-green-600 dark:text-green-400">₹{order.totalAmount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Confirmation Modal */}
      {statusConfirm.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999]">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Confirm Status Update</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to update status from <span className="font-semibold capitalize">{statusConfirm.currentStatus}</span> to <span className="font-semibold capitalize">{statusConfirm.newStatus}</span> for order #{order.orderNo}?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setStatusConfirm({show: false, currentStatus: '', newStatus: ''})}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!order) return;
                  
                  setUpdatingStatus(true);
                  try {
                    let response;
                    const { newStatus } = statusConfirm;
                    
                    switch (newStatus) {
                      case 'confirmed':
                        response = await orderDetailApi.updateToConfirmed(order._id);
                        break;
                      case 'preparing':
                        response = await orderDetailApi.updateToPreparing(order._id);
                        break;
                      case 'ready':
                        response = await orderDetailApi.updateToReady(order._id);
                        break;
                      case 'served':
                        response = await orderDetailApi.updateToServed(order._id);
                        break;
                      case 'completed':
                        response = await orderDetailApi.updateToCompleted(order._id);
                        break;
                      case 'cancelled':
                        response = await orderDetailApi.cancelOrder(order._id);
                        break;
                      default:
                        throw new Error('Invalid status update');
                    }
                    
                    if (response.success) {
                      toast.success(`Order status updated to ${statusConfirm.newStatus}`);
                      fetchOrderDetail();
                    } else {
                      toast.error(response.message || 'Error updating status');
                    }
                  } catch (error) {
                    console.error('Error updating status:', error);
                    toast.error('Error updating status');
                  } finally {
                    setUpdatingStatus(false);
                    setStatusConfirm({show: false, currentStatus: '', newStatus: ''});
                  }
                }}
                disabled={updatingStatus}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {updatingStatus && (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailPage;