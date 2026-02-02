'use client';
import React, { useEffect, useState } from 'react';
import { useNotification } from '@/context/NotificationContext';
import { X, Eye, Clock, Users, CreditCard, ShoppingBag, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';

const NotificationPopup: React.FC = () => {
  const { notifications, dismissNotification } = useNotification();
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState<{[key: string]: number}>({});

  useEffect(() => {
    console.log('🔔 NotificationPopup rendered, notifications:', notifications.length);
    notifications.forEach(n => {
      console.log('📱 Notification:', { id: n.id, orderNo: n.orderNo, customer: n.customerName });
    });
  }, [notifications]);

  useEffect(() => {
    const intervals: {[key: string]: NodeJS.Timeout} = {};
    
    notifications.forEach(notification => {
      if (!timeLeft[notification.id]) {
        setTimeLeft(prev => ({ ...prev, [notification.id]: 60 }));
      }
      
      intervals[notification.id] = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = (prev[notification.id] || 60) - 1;
          if (newTime <= 0) {
            clearInterval(intervals[notification.id]);
            return { ...prev, [notification.id]: 0 };
          }
          return { ...prev, [notification.id]: newTime };
        });
      }, 1000);
    });

    return () => {
      Object.values(intervals).forEach(interval => clearInterval(interval));
    };
  }, [notifications, timeLeft]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
      {notifications.map((notification) => {
        const timings = notification.orderType === 'dine-in' ? notification.eatTimings : notification.takeawayTimings;
        const isOrderRequest = !!notification.orderRequestNo;
        
        return (
          <div
            key={notification.id}
            className={`bg-white dark:bg-gray-900 border-l-4 ${isOrderRequest ? 'border-l-amber-600 dark:border-l-amber-500' : 'border-l-black dark:border-l-white'} rounded-2xl shadow-2xl overflow-hidden w-full max-w-md animate-slide-in relative transform transition-all duration-300 hover:scale-105`}
          >
            {/* Header with pulsing indicator */}
            <div className={`${isOrderRequest ? 'bg-amber-600 dark:bg-amber-500' : 'bg-black dark:bg-white'} px-6 py-4 relative overflow-hidden`}>
              <div className="absolute inset-0 bg-white/10 dark:bg-black/10 animate-pulse"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-white dark:bg-black rounded-full animate-ping"></div>
                  <div className="w-3 h-3 bg-white dark:bg-black rounded-full animate-ping animation-delay-200"></div>
                  <div className="w-3 h-3 bg-white dark:bg-black rounded-full animate-ping animation-delay-400"></div>
                  <h3 className="text-white dark:text-black font-bold text-lg ml-2">
                    {isOrderRequest ? '📋 Order Request!' : '🍽️ New Order Alert!'}
                  </h3>
                </div>
                <button
                  onClick={() => dismissNotification(notification.id)}
                  className="text-white/80 dark:text-black/80 hover:text-white dark:hover:text-black transition-colors p-1 rounded-full hover:bg-white/20 dark:hover:bg-black/20"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Auto-dismiss timer */}
              <div className="absolute bottom-0 left-0 h-1 bg-white/30 dark:bg-black/30 w-full">
                <div 
                  className="h-full bg-white dark:bg-black transition-all duration-1000 ease-linear"
                  style={{ width: `${((timeLeft[notification.id] || 60) / 60) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Order Number - Prominent */}
              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600">
                  <span className="text-black dark:text-white font-semibold text-lg">
                    #{notification.orderRequestNo ? notification.orderRequestNo : notification.orderNo}
                  </span>
                </div>
              </div>

              {/* Customer Info */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center border border-gray-300 dark:border-gray-600">
                  <Users className="w-5 h-5 text-black dark:text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {notification.customerName || notification.customer?.name || notification.customer || 'Guest Customer'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{notification.orderType} Order</p>
                </div>
              </div>

              {/* Order Details Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600">
                  <CreditCard className="w-4 h-4 text-black dark:text-white" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Amount</p>
                    <p className="font-bold text-black dark:text-white">₹{notification.totalAmount}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600">
                  <ShoppingBag className="w-4 h-4 text-black dark:text-white" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Items</p>
                    <p className="font-bold text-black dark:text-white">{notification.itemsCount}</p>
                  </div>
                </div>
              </div>

              {/* Guest Count - Only for dine-in orders */}
              {notification.orderType === 'dine-in' && notification.noOfGuest !== undefined && notification.noOfGuest !== null && notification.noOfGuest > 0 && (
                <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600">
                  <Users className="w-4 h-4 text-black dark:text-white" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Number of Guests</p>
                    <p className="font-semibold text-black dark:text-white text-sm">
                      {notification.noOfGuest} {notification.noOfGuest === 1 ? 'Guest' : 'Guests'}
                    </p>
                  </div>
                </div>
              )}

              {/* Timing Information */}
              {timings && (
                <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600">
                  <Calendar className="w-4 h-4 text-black dark:text-white" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {notification.orderType === 'dine-in' ? 'Dining Time' : 'Pickup Time'}
                    </p>
                    <p className="font-semibold text-black dark:text-white text-sm">
                      {timings.startTime} - {timings.endTime}
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    // Use orderRequestNo field to determine navigation route
                    const detailUrl = notification.orderRequestNo 
                      ? `/order-requests/detail/${notification.id}` 
                      : `/orders/detail/${notification.id}`;
                    router.push(detailUrl);
                    dismissNotification(notification.id);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 ${isOrderRequest ? 'bg-amber-600 dark:bg-amber-500 text-white hover:bg-amber-700 dark:hover:bg-amber-600' : 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200'} rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg`}
                >
                  <Eye className="w-4 h-4" />
                  {isOrderRequest ? 'View Order Req' : 'View Order'}
                </button>
                <button
                  onClick={() => dismissNotification(notification.id)}
                  className="px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 font-medium transition-colors border border-gray-300 dark:border-gray-600"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default NotificationPopup;