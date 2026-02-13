"use client";
import React, { useState, useEffect } from "react";
import { toast } from "@/utils/toast";
import axiosInstance from '@/utils/axiosConfig';

interface StatusSettings {
  percentage: number;
  status: boolean;
}

interface RefundSettings {
  confirmed: StatusSettings;
  preparing: StatusSettings;
  ready: StatusSettings;
  served: StatusSettings;
}

const CancelRefundSettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<RefundSettings>({
    confirmed: { percentage: 0, status: false },
    preparing: { percentage: 0, status: false },
    ready: { percentage: 0, status: false },
    served: { percentage: 0, status: false }
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/restaurants/order-cancel-refund');
      if (response.data.success && response.data.data) {
        const { confirmed, preparing, ready, served } = response.data.data;
        setSettings({ confirmed, preparing, ready, served });
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        toast.error('Error fetching settings');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (status: keyof RefundSettings, field: 'percentage' | 'status', value: number | boolean) => {
    setSettings(prev => ({
      ...prev,
      [status]: {
        ...prev[status],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await axiosInstance.put('/api/restaurants/order-cancel-refund', settings);
      if (response.data.success) {
        toast.success('Settings saved successfully');
      }
    } catch (error) {
      toast.error('Error saving settings');
    } finally {
      setSaving(false);
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

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Order Cancel & Refund Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Configure refund percentage deductions for each order status
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
        <div className="space-y-6">
          {(Object.keys(settings) as Array<keyof RefundSettings>).map((status) => (
            <div key={status} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                  {status} Status
                </h3>
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={settings[status].status}
                      onChange={(e) => handleStatusChange(status, 'status', e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`block w-14 h-8 rounded-full ${settings[status].status ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${settings[status].status ? 'transform translate-x-6' : ''}`}></div>
                  </div>
                  <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {settings[status].status ? 'Enabled' : 'Disabled'}
                  </span>
                </label>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Deduction Percentage
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings[status].percentage}
                      onChange={(e) => handleStatusChange(status, 'percentage', parseInt(e.target.value))}
                      disabled={!settings[status].status}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 disabled:opacity-50"
                    />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={settings[status].percentage}
                      onChange={(e) => handleStatusChange(status, 'percentage', parseInt(e.target.value) || 0)}
                      disabled={!settings[status].status}
                      className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                    />
                    <span className="text-gray-600 dark:text-gray-400">%</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                {settings[status].status ? (
                  <p>Customer will receive {100 - settings[status].percentage}% refund if order is cancelled at this status</p>
                ) : (
                  <p>Cancellation not allowed at this status</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving && (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelRefundSettingsPage;
