"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axiosInstance from '@/utils/axiosConfig';
import { toast } from '@/utils/toast';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { useOrderNotifications } from '@/hooks/useOrderNotifications';

interface Reason {
  _id: string;
  reasonType: 'waiting' | 'rejected';
  reasonText: string;
}

interface OrderDetail {
  _id: string;
  orderRequestNo: number;
  userId: {
    fullName: string;
    phone: string;
  };
  orderType: string;
  status: string;
  numberOfGuests?: number;
  dineInstructions?: string;
  eatTimings?: {
    startTime: string;
    endTime: string;
  };
  cartTotal: number;
  waitingTime?: number;
  statusUpdatedBy?: string;
  items: {
    _id: string;
    itemId: {
      name: string;
      description: string;
      images: string[];
      category: string;
    };
    quantity: number;
    selectedAttribute: {
      name: string;
    };
    selectedFoodType: string;
    selectedAddons: any[];
    selectedCustomizations: any[];
    itemTotal: number;
  }[];
  createdAt: string;
}

export default function OrderRequestDetail() {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState<{show: boolean, orderId: string, action: string}>({show: false, orderId: '', action: ''});
  const [showReasonModal, setShowReasonModal] = useState<{show: boolean, orderId: string, action: 'waiting' | 'reject'}>({show: false, orderId: '', action: 'waiting'});
  const [reasons, setReasons] = useState<Reason[]>([]);
  const [selectedReason, setSelectedReason] = useState('');
  const [waitingMinutes, setWaitingMinutes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  // Add order notifications
  useOrderNotifications("Order Request Detail");

  useEffect(() => {
    if (orderId) {
      fetchOrderDetail();
    }
  }, [orderId]);

  const fetchOrderDetail = async () => {
    try {
      const response = await axiosInstance.get(`/api/restaurants/order-requests/by-id?orderReqId=${orderId}`);
      setOrder(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  const fetchReasons = async (reasonType: 'waiting' | 'reject') => {
    try {
      const apiReasonType = reasonType === 'reject' ? 'rejected' : reasonType;
      const response = await axiosInstance.get(`/api/restaurants/order-requests/active-reasons?reasonType=${apiReasonType}`);
      setReasons(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch reasons');
    }
  };

  const updateOrderStatus = async (status: string, reasonId?: string) => {
    setActionLoading(true);
    try {
      const payload: any = { orderReqId: orderId };
      if (reasonId) payload.orderReqReasonId = reasonId;
      if (status === 'waiting' && waitingMinutes && parseInt(waitingMinutes) > 0) {
        payload.waitingTime = parseInt(waitingMinutes);
      }
      
      console.log('Making API call with payload:', payload);
      const response = await axiosInstance.patch(`/api/restaurants/order-requests/${status}`, payload);
      console.log('API response:', response.data);
      
      if (response.data.message) {
        toast.success(response.data.message);
      } else {
        toast.success(`Order ${status} successfully`);
      }
      fetchOrderDetail();
    } catch (error: any) {
      console.error('Error updating order status:', error);
      console.log('Error response:', error.response);
      console.log('Error response data:', error.response?.data);
      
      const errorMessage = error.response?.data?.message;
      console.log('Extracted error message:', errorMessage);
      
      if (errorMessage) {
        console.log('Calling toast.error with:', errorMessage);
        toast.error(errorMessage);
      } else {
        console.log('Calling toast.error with fallback message');
        toast.error(`Failed to ${status} order`);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmAction = () => {
    updateOrderStatus(showConfirmModal.action);
    setShowConfirmModal({show: false, orderId: '', action: ''});
  };

  const handleReasonAction = () => {
    if (!selectedReason) {
      toast.error('Please select a reason');
      return;
    }
    if (showReasonModal.action === 'waiting' && (!waitingMinutes || parseInt(waitingMinutes) <= 0)) {
      toast.error('Please enter a valid waiting time greater than 0');
      return;
    }
    updateOrderStatus(showReasonModal.action, selectedReason);
    setShowReasonModal({show: false, orderId: '', action: 'waiting'});
    setSelectedReason('');
    setWaitingMinutes('');
  };

  const openConfirmModal = (action: string) => {
    setShowConfirmModal({show: true, orderId, action});
  };

  const openReasonModal = async (action: 'waiting' | 'reject') => {
    await fetchReasons(action);
    setShowReasonModal({show: true, orderId, action});
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'waiting': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Order Not Found</h1>
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors dark:border-gray-600 dark:hover:bg-gray-800 mx-auto"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors dark:border-gray-600 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Order Req #{order.orderRequestNo}</h1>
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400">Order Req details and management</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Req Information</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Customer</label>
                <p className="text-gray-900 dark:text-white">{order.userId.fullName}</p>
                <p className="text-gray-600 dark:text-gray-400">{order.userId.phone}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Order Type</label>
                <p className="text-gray-900 dark:text-white capitalize">{order.orderType}</p>
              </div>
              
              {order.waitingTime && order.waitingTime > 0 && order.status === 'waiting' && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Waiting Time</label>
                  <p className="text-gray-900 dark:text-white">{order.waitingTime} minutes</p>
                </div>
              )}
              
              {order.statusUpdatedBy && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status Updated By</label>
                  <p className="text-gray-900 dark:text-white capitalize">{order.statusUpdatedBy}</p>
                </div>
              )}
              
              {order.numberOfGuests && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Guests</label>
                  <p className="text-gray-900 dark:text-white">{order.numberOfGuests}</p>
                </div>
              )}
              
              {order.eatTimings ? (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Eat Timings</label>
                  <p className="text-gray-900 dark:text-white">{order.eatTimings.startTime} - {order.eatTimings.endTime}</p>
                </div>
              ) : order.orderType === 'takeaway' ? (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Order Type</label>
                  <p className="text-gray-900 dark:text-white">Takeaway Order</p>
                </div>
              ) : null}
              
              {order.dineInstructions && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Instructions</label>
                  <p className="text-gray-900 dark:text-white">{order.dineInstructions}</p>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Order Req Date</label>
                <p className="text-gray-900 dark:text-white">{new Date(order.createdAt).toLocaleDateString('en-GB').replace(/\//g, '/').slice(0, -2) + new Date(order.createdAt).toLocaleDateString('en-GB').slice(-2)} - {new Date(order.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Order Total</label>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">₹{order.cartTotal}</p>
              </div>
            </div>
            
            {order.status === 'pending' && (
              <div className="mt-6 space-y-2">
                <button
                  onClick={() => openConfirmModal('confirm')}
                  disabled={actionLoading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Confirm Order Req'}
                </button>
                <button
                  onClick={() => openReasonModal('waiting')}
                  disabled={actionLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Set Waiting Order Req'}
                </button>
                <button
                  onClick={() => openReasonModal('reject')}
                  disabled={actionLoading}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Reject Order Req'}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Items</h2>
            
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex gap-4">
                    {item.itemId.images && item.itemId.images.length > 0 && (
                      <div className="flex-shrink-0">
                        <Image
                          src={item.itemId.images[0]}
                          alt={item.itemId.name}
                          width={80}
                          height={80}
                          className="rounded-lg object-cover"
                        />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">{item.itemId.name}</h3>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">{item.itemId.description}</p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-lg font-semibold text-green-600">₹{item.itemTotal}</p>
                        </div>
                      </div>
                      
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Category:</span> {item.itemId.category}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Quantity:</span> {item.quantity}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Size:</span> {item.selectedAttribute.name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Food Type:</span> {item.selectedFoodType}
                        </p>
                        
                        {item.selectedAddons && item.selectedAddons.length > 0 && (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Addons:</span>
                            <ul className="ml-4 list-disc">
                              {item.selectedAddons.map((addon, index) => (
                                <li key={index}>
                                  {addon.addonId.name} ({addon.selectedAttribute.name}) x{addon.quantity}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {item.selectedCustomizations && item.selectedCustomizations.length > 0 && (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Customizations:</span>
                            <ul className="ml-4 list-disc">
                              {item.selectedCustomizations.map((custom, index) => (
                                <li key={index}>
                                  {custom.selectedOptions?.map((opt: any, i: number) => (
                                    <span key={i}>{opt.optionName} ({opt.unit}) x{opt.quantity}</span>
                                  ))}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-end">
                <div className="text-right">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Order Request Total</p>
                  <p className="text-2xl font-bold text-green-600">₹{order.cartTotal}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      {showConfirmModal.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Confirm Order Request
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to confirm this order request?
              </p>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal({show: false, orderId: '', action: ''})}
                  disabled={actionLoading}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAction}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reason Modal */}
      {showReasonModal.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {showReasonModal.action === 'waiting' ? 'Set Order to Waiting' : 'Reject Order Request'}
              </h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Reason
                </label>
                <select
                  value={selectedReason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="">Select a reason</option>
                  {reasons.map((reason) => (
                    <option key={reason._id} value={reason._id}>
                      {reason.reasonText}
                    </option>
                  ))}
                </select>
              </div>
              {showReasonModal.action === 'waiting' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Waiting Time (Minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={waitingMinutes}
                    onChange={(e) => setWaitingMinutes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter waiting time in minutes"
                    required
                  />
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowReasonModal({show: false, orderId: '', action: 'waiting'});
                    setSelectedReason('');
                    setWaitingMinutes('');
                  }}
                  disabled={actionLoading}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReasonAction}
                  disabled={actionLoading || !selectedReason || (showReasonModal.action === 'waiting' && !waitingMinutes)}
                  className={`px-4 py-2 text-white rounded-lg disabled:opacity-50 flex items-center gap-2 ${
                    showReasonModal.action === 'waiting' ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {actionLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                  {showReasonModal.action === 'waiting' ? 'Set Waiting' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}