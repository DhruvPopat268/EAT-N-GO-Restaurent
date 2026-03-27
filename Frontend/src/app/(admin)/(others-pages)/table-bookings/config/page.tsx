"use client";
import React, { useState, useEffect } from "react";
import { toast } from "@/utils/toast";
import axiosInstance from '@/utils/axiosConfig';
import { Clock, Settings, DollarSign, Users, Calendar, ToggleLeft, ToggleRight } from "lucide-react";
import { useTableBookingSocket } from '@/hooks/useTableBookingSocket';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

interface TimeSlot {
  _id?: string;
  time: string;
  status: boolean;
  maxGuests?: number;
  onlineGuests?: number;
  offlineGuests?: number;
}

interface TimeSlotConfig {
  _id?: string;
  restaurantId: string;
  duration: number;
  status: boolean;
  timeSlots: TimeSlot[];
}

interface TokenCharges {
  _id?: string;
  restaurantId: string;
  status: boolean;
  freeBookings: boolean;
  chargesPerPerson: number;
}

interface TableBookingConfig {
  tableReservationBooking: boolean;
  timeSlots: TimeSlotConfig | null;
  tokenCharges: TokenCharges | null;
}

interface Offer {
  _id?: string;
  restaurantId: string;
  name: string;
  description?: string;
  percentage: number;
  status: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface OfferFormData {
  name: string;
  description: string;
  percentage: string;
  status: boolean;
}

const defaultConfig: TableBookingConfig = {
  tableReservationBooking: false,
  timeSlots: null,
  tokenCharges: null
};

const offersApi = {
  create: async (data: {
    name: string;
    description?: string;
    percentage: number;
    status: boolean;
  }) => {
    const response = await axiosInstance.post('/api/restaurants/table-booking/offers', data);
    return response.data;
  },

  update: async (offerId: string, data: {
    name: string;
    description?: string;
    percentage: number;
    status: boolean;
  }) => {
    // Include offerId in the request body as required by backend
    const response = await axiosInstance.patch('/api/restaurants/table-booking/offers', {
      offerId,
      ...data
    });
    return response.data;
  },

  delete: async (offerId?: string) => {
    // Since backend only supports single offer per restaurant, use the existing DELETE endpoint
    const response = await axiosInstance.delete('/api/restaurants/table-booking/offers');
    return response.data;
  }
};

const TableBookingConfigPage = () => {
  const [config, setConfig] = useState<TableBookingConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingSlots, setGeneratingSlots] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [maxGuests, setMaxGuests] = useState<string>('4');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingSlots, setEditingSlots] = useState<{ [key: string]: { status: boolean, maxGuests: string, onlineGuests: string, offlineGuests: string } }>({});
  const [savingSlots, setSavingSlots] = useState(false);
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [addSlotData, setAddSlotData] = useState({
    time: '',
    maxGuests: '4',
    status: true
  });
  const [addingSlot, setAddingSlot] = useState(false);

  // Offers state
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [offerFormData, setOfferFormData] = useState<OfferFormData>({
    name: '',
    description: '',
    percentage: '',
    status: true
  });
  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [viewOfferModal, setViewOfferModal] = useState<{ show: boolean, offer: Offer | null }>({ show: false, offer: null });
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean, id: string, name: string }>({ show: false, id: '', name: '' });
  const [showUpdateSlotsConfirm, setShowUpdateSlotsConfirm] = useState(false);

  // Add table booking socket events
  useTableBookingSocket({
    pageName: "Table Booking Configuration"
  });

  // Get currency from localStorage
  const getCurrency = () => {
    try {
      const currency = JSON.parse(localStorage.getItem('currency') || '{}');
      return currency.symbol;
    } catch {
      return '₹';
    }
  };

  useEffect(() => {
    fetchConfig(); // This now fetches both config and offers
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/restaurants/table-booking');
      const configData = response.data || defaultConfig;
      setConfig(configData);
      setSelectedDuration(configData.timeSlots?.duration || 30);

      // Set offers from the main config response
      if (configData.offers && Array.isArray(configData.offers)) {
        setOffers(configData.offers);
      } else {
        setOffers([]);
      }
    } catch (error) {
      console.error('Error fetching config:', error);
      setConfig(defaultConfig);
      setSelectedDuration(30);
      setOffers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOffers = async () => {
    // No longer needed as offers come from main config API
    // Just refresh the main config
    await fetchConfig();
  };

  const toggleTableBooking = async () => {
    try {
      setSaving(true);
      const response = await axiosInstance.patch('/api/restaurants/table-booking/toggle', {
        tableReservationBooking: !config.tableReservationBooking
      });
      setConfig(prev => ({ ...prev, tableReservationBooking: response.data.tableReservationBooking }));
      toast.success('Table booking status updated successfully');
    } catch (error: any) {
      console.error('Error updating config:', error);
      toast.error(error.response?.data?.message || 'Error updating configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTimeSlots = () => {
    if (config.timeSlots && config.timeSlots.timeSlots.length > 0) {
      setShowUpdateSlotsConfirm(true);
    } else {
      createOrUpdateTimeSlots(selectedDuration, maxGuests);
    }
  };

  const confirmUpdateTimeSlots = () => {
    setShowUpdateSlotsConfirm(false);
    createOrUpdateTimeSlots(selectedDuration, maxGuests);
  };

  const createOrUpdateTimeSlots = async (duration: number, maxGuests: string) => {
    try {
      setSaving(true);
      const endpoint = '/api/restaurants/table-booking/time-slots';
      const method = config.timeSlots ? 'patch' : 'post';

      const response = await axiosInstance[method](endpoint, {
        duration,
        maxGuests: parseInt(maxGuests) || 1
      });

      await fetchConfig(); // Refresh the config
      toast.success(response.data.message);
    } catch (error: any) {
      console.error('Error saving time slots:', error);
      toast.error(error.response?.data?.message || 'Error saving time slots');
    } finally {
      setSaving(false);
    }
  };

  const bulkUpdateSlots = async () => {
    try {
      setSavingSlots(true);

      const timeSlots = Object.entries(editingSlots).map(([timeSlotId, data]) => ({
        timeSlotId,
        status: data.status,
        maxGuests: parseInt(data.maxGuests) || 1,
        onlineGuests: parseInt(data.onlineGuests) || 0,
        offlineGuests: parseInt(data.offlineGuests) || 0
      }));

      const response = await axiosInstance.patch('/api/restaurants/table-booking/time-slots/status', {
        timeSlots
      });

      await fetchConfig(); // Refresh the config
      setIsEditMode(false);
      setEditingSlots({});
      toast.success(response.data.message);
    } catch (error: any) {
      console.error('Error updating slots:', error);
      toast.error(error.response?.data?.message || 'Error updating slots');
    } finally {
      setSavingSlots(false);
    }
  };

  const enterEditMode = () => {
    if (!config.timeSlots?.timeSlots) return;

    const initialEditingSlots: { [key: string]: { status: boolean, maxGuests: string, onlineGuests: string, offlineGuests: string } } = {};
    config.timeSlots.timeSlots.forEach(slot => {
      if (slot._id) {
        initialEditingSlots[slot._id] = {
          status: slot.status,
          maxGuests: (slot.maxGuests || 4).toString(),
          onlineGuests: (slot.onlineGuests || 0).toString(),
          offlineGuests: (slot.offlineGuests || 0).toString()
        };
      }
    });

    setEditingSlots(initialEditingSlots);
    setIsEditMode(true);
  };

  const cancelEditMode = () => {
    setIsEditMode(false);
    setEditingSlots({});
  };

  const updateEditingSlot = (slotId: string, field: 'status' | 'maxGuests' | 'onlineGuests' | 'offlineGuests', value: boolean | string) => {
    setEditingSlots(prev => ({
      ...prev,
      [slotId]: {
        ...prev[slotId],
        [field]: value
      }
    }));
  };

  const createOrUpdateTokenCharges = async (chargesData: { status: boolean; freeBookings: boolean; chargesPerPerson: number }) => {
    try {
      setSaving(true);
      const endpoint = '/api/restaurants/table-booking/token-charges';
      const method = config.tokenCharges ? 'patch' : 'post';

      const response = await axiosInstance[method](endpoint, chargesData);
      await fetchConfig(); // Refresh the config
      toast.success(response.data.message);
    } catch (error: any) {
      console.error('Error saving token charges:', error);
      toast.error(error.response?.data?.message || 'Error saving token charges');
    } finally {
      setSaving(false);
    }
  };

  const addSingleSlot = async () => {
    try {
      setAddingSlot(true);
      const response = await axiosInstance.post('/api/restaurants/table-booking/time-slots/single', {
        time: addSlotData.time,
        maxGuests: parseInt(addSlotData.maxGuests) || 1,
        onlineGuests: 0,
        offlineGuests: 0,
        status: addSlotData.status
      });

      if (response.data.message) {
        await fetchConfig();
        setShowAddSlotModal(false);
        setAddSlotData({
          time: '',
          maxGuests: '4',
          status: true
        });
        toast.success(response.data.message);
      }
    } catch (error: any) {
      console.error('Error adding single slot:', error);
      toast.error(error.response?.data?.message || 'Error adding time slot');
    } finally {
      setAddingSlot(false);
    }
  };

  const handleAddSlotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addSlotData.time) {
      toast.error('Please enter a valid time');
      return;
    }
    addSingleSlot();
  };

  const toggleSlot = async (slotId: string, currentStatus: boolean) => {
    if (isEditMode) {
      updateEditingSlot(slotId, 'status', !currentStatus);
    } else {
      // For backward compatibility, keep individual update functionality
      const currentSlot = config.timeSlots?.timeSlots.find(slot => slot._id === slotId);
      if (!currentSlot) return;

      try {
        const response = await axiosInstance.patch('/api/restaurants/table-booking/time-slots/status', {
          timeSlots: [{
            timeSlotId: slotId,
            status: !currentStatus,
            maxGuests: parseInt(currentSlot.maxGuests?.toString() || '4') || 4
          }]
        });
        await fetchConfig();
        toast.success(response.data.message);
      } catch (error: any) {
        console.error('Error updating slot status:', error);
        toast.error(error.response?.data?.message || 'Error updating slot status');
      }
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Offers functions
  const handleOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingOffer(true);

    try {
      const offerData = {
        name: offerFormData.name,
        description: offerFormData.description,
        percentage: parseFloat(offerFormData.percentage),
        status: offerFormData.status
      };

      let response;
      if (editingOfferId) {
        response = await offersApi.update(editingOfferId, offerData);
        toast.success('Offer updated successfully!');
      } else {
        response = await offersApi.create(offerData);
        toast.success('Offer created successfully!');
      }

      if (response.message) {
        await fetchConfig(); // Refresh to get updated data
        setIsOfferModalOpen(false);
        setEditingOfferId(null);
        setOfferFormData({
          name: '',
          description: '',
          percentage: '',
          status: true
        });
      } else {
        toast.error('Error saving offer');
      }
    } catch (error: any) {
      console.error('Error saving offer:', error);
      toast.error(error.response?.data?.message || 'Error saving offer');
    } finally {
      setSubmittingOffer(false);
    }
  };

  const toggleOfferStatus = async (offerId: string, currentStatus: boolean) => {
    try {
      const offerToUpdate = offers.find(offer => offer._id === offerId);
      if (!offerToUpdate) return;

      const updatedOfferData = {
        name: offerToUpdate.name,
        description: offerToUpdate.description,
        percentage: offerToUpdate.percentage,
        status: !currentStatus
      };

      const response = await offersApi.update(offerId, updatedOfferData);
      if (response.message) {
        await fetchConfig(); // Refresh to get updated data
        toast.success('Offer status updated successfully!');
      } else {
        toast.error('Error updating offer status');
      }
    } catch (error: any) {
      console.error('Error updating offer status:', error);
      toast.error(error.response?.data?.message || 'Error updating offer status');
    }
  };

  const viewOffer = (offer: Offer) => {
    setViewOfferModal({ show: true, offer });
  };

  const editOffer = (offer: Offer) => {
    setEditingOfferId(offer._id!);
    setOfferFormData({
      name: offer.name,
      description: offer.description || '',
      percentage: offer.percentage.toString(),
      status: offer.status
    });
    setIsOfferModalOpen(true);
  };

  const handleDeleteOffer = async () => {
    try {
      const response = await offersApi.delete(deleteConfirm.id);
      if (response.message) {
        await fetchConfig(); // Refresh to get updated data
        toast.success('Offer deleted successfully!');
      } else {
        toast.error('Error deleting offer');
      }
    } catch (error: any) {
      console.error('Error deleting offer:', error);
      toast.error(error.response?.data?.message || 'Error deleting offer');
    } finally {
      setDeleteConfirm({ show: false, id: '', name: '' });
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Table Booking Configuration
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Configure table booking settings, time slots, and charges for your restaurant
        </p>
      </div>

      <div className="space-y-8">
        {/* Main Toggle */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Table Booking System
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Enable or disable table booking functionality for your restaurant
                </p>
              </div>
            </div>
            <button
              onClick={toggleTableBooking}
              disabled={saving}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${config.tableReservationBooking ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${config.tableReservationBooking ? 'translate-x-7' : 'translate-x-1'
                  }`}
              />
            </button>
          </div>
        </div>

        {/* Configuration Sections - Only show if enabled */}
        {config.tableReservationBooking && (
          <>
            {/* Slot Duration Configuration */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center gap-3 mb-6">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Time Slot Configuration
                </h3>
              </div>

              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Tip:</strong> Time slots will be generated based on your restaurant's operating hours with the specified max guests per slot. You can adjust duration, max guests, and regenerate slots as needed.
                </p>
              </div>

              <div className="flex items-center justify-between mb-6">
                <div className="flex gap-4">
                  <div className="w-64">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Slot Duration (minutes)
                    </label>
                    <select
                      value={selectedDuration}
                      onChange={(e) => setSelectedDuration(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      disabled={generatingSlots}
                    >
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={45}>45 minutes</option>
                      <option value={60}>60 minutes</option>
                      <option value={90}>90 minutes</option>
                      <option value={120}>120 minutes</option>
                    </select>
                  </div>
                  <div className="w-48">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Max Guests per Slot
                    </label>
                    <input
                      type="text"
                      value={maxGuests}
                      onChange={(e) => setMaxGuests(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      disabled={generatingSlots}
                      placeholder="e.g., 4, 7, 8"
                    />
                  </div>
                </div>

                <button
                  onClick={handleUpdateTimeSlots}
                  disabled={generatingSlots}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {generatingSlots && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  {config.timeSlots ? 'Update Time Slots' : 'Generate Time Slots'}
                </button>
              </div>
            </div>

            {/* Time Slots Management */}
            {config.timeSlots && config.timeSlots.timeSlots.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Available Time Slots
                    </h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {config.timeSlots.timeSlots.filter(slot => slot.status).length} of {config.timeSlots.timeSlots.length} slots enabled
                    </div>
                    {!isEditMode ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowAddSlotModal(true)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                          </svg>
                          Add Single Slot
                        </button>
                        <button
                          onClick={enterEditMode}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                          Edit Slots
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={cancelEditMode}
                          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={bulkUpdateSlots}
                          disabled={savingSlots}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                          {savingSlots && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          )}
                          Save All
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Tip:</strong> {isEditMode ? 'Make your changes and click "Save All" to update all slots simultaneously.' : 'Click "Edit Slots" to modify multiple slots at once, or click individual dots to toggle status and edit max guests directly.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  {config.timeSlots.timeSlots.map((slot) => {
                    const editingData = isEditMode ? editingSlots[slot._id!] : null;
                    const currentStatus = editingData ? editingData.status : slot.status;
                    const currentMaxGuests = editingData ? editingData.maxGuests : (slot.maxGuests || 4).toString();
                    const currentOnlineGuests = editingData ? editingData.onlineGuests : (slot.onlineGuests || 0).toString();
                    const currentOfflineGuests = editingData ? editingData.offlineGuests : (slot.offlineGuests || 0).toString();

                    return (
                      <div
                        key={slot._id}
                        className={`p-4 rounded-lg border-2 transition-all ${currentStatus
                          ? 'bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20'
                          : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50'
                          } ${isEditMode ? 'ring-2 ring-blue-200 dark:ring-blue-800' : ''}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatTime(slot.time)}
                          </div>
                          <button
                            onClick={() => toggleSlot(slot._id!, currentStatus)}
                            className={`w-4 h-4 rounded-full transition-colors ${currentStatus ? 'bg-green-500' : 'bg-gray-400'
                              }`}
                            title={currentStatus ? 'Click to disable' : 'Click to enable'}
                          />
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                          {config.timeSlots!.duration}min duration
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center">
                            <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">
                              Max
                            </label>
                            <input
                              type="text"
                              value={currentMaxGuests}
                              onChange={(e) => {
                                if (isEditMode) {
                                  updateEditingSlot(slot._id!, 'maxGuests', e.target.value);
                                }
                              }}
                              onBlur={(e) => {
                                if (!isEditMode) {
                                  const newMaxGuests = parseInt(e.target.value) || 1;
                                  if (newMaxGuests !== slot.maxGuests) {
                                    // Individual update for non-edit mode
                                    const updateSlot = async () => {
                                      try {
                                        const response = await axiosInstance.patch('/api/restaurants/table-booking/time-slots/status', {
                                          timeSlots: [{
                                            timeSlotId: slot._id!,
                                            status: slot.status,
                                            maxGuests: newMaxGuests
                                          }]
                                        });
                                        await fetchConfig();
                                        toast.success('Max guests updated successfully');
                                      } catch (error: any) {
                                        console.error('Error updating slot max guests:', error);
                                        toast.error(error.response?.data?.message || 'Error updating slot max guests');
                                      }
                                    };
                                    updateSlot();
                                  }
                                }
                              }}
                              className={`w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center ${isEditMode ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                }`}
                              disabled={!isEditMode && savingSlots}
                              maxLength="2"
                            />
                          </div>
                          <div className="text-center">
                            <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">
                              Online
                            </label>
                            <input
                              type="text"
                              value={currentOnlineGuests}
                              onChange={(e) => {
                                if (isEditMode) {
                                  updateEditingSlot(slot._id!, 'onlineGuests', e.target.value);
                                }
                              }}
                              onBlur={(e) => {
                                if (!isEditMode) {
                                  const newOnlineGuests = parseInt(e.target.value) || 0;
                                  if (newOnlineGuests !== slot.onlineGuests) {
                                    // Individual update for non-edit mode
                                    const updateSlot = async () => {
                                      try {
                                        const response = await axiosInstance.patch('/api/restaurants/table-booking/time-slots/status', {
                                          timeSlots: [{
                                            timeSlotId: slot._id!,
                                            status: slot.status,
                                            onlineGuests: newOnlineGuests
                                          }]
                                        });
                                        await fetchConfig();
                                        toast.success('Online guests updated successfully');
                                      } catch (error: any) {
                                        console.error('Error updating slot online guests:', error);
                                        toast.error(error.response?.data?.message || 'Error updating slot online guests');
                                      }
                                    };
                                    updateSlot();
                                  }
                                }
                              }}
                              className={`w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-green-500 dark:bg-gray-700 dark:text-white text-center ${isEditMode ? 'bg-green-50 dark:bg-green-900/20' : ''
                                }`}
                              disabled={!isEditMode && savingSlots}
                              maxLength="2"
                            />
                          </div>
                          <div className="text-center">
                            <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">
                              Offline
                            </label>
                            <input
                              type="text"
                              value={currentOfflineGuests}
                              onChange={(e) => {
                                if (isEditMode) {
                                  updateEditingSlot(slot._id!, 'offlineGuests', e.target.value);
                                }
                              }}
                              onBlur={(e) => {
                                if (!isEditMode) {
                                  const newOfflineGuests = parseInt(e.target.value) || 0;
                                  if (newOfflineGuests !== slot.offlineGuests) {
                                    // Individual update for non-edit mode
                                    const updateSlot = async () => {
                                      try {
                                        const response = await axiosInstance.patch('/api/restaurants/table-booking/time-slots/status', {
                                          timeSlots: [{
                                            timeSlotId: slot._id!,
                                            status: slot.status,
                                            offlineGuests: newOfflineGuests
                                          }]
                                        });
                                        await fetchConfig();
                                        toast.success('Offline guests updated successfully');
                                      } catch (error: any) {
                                        console.error('Error updating slot offline guests:', error);
                                        toast.error(error.response?.data?.message || 'Error updating slot offline guests');
                                      }
                                    };
                                    updateSlot();
                                  }
                                }
                              }}
                              className={`w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-orange-500 dark:bg-gray-700 dark:text-white text-center ${isEditMode ? 'bg-orange-50 dark:bg-orange-900/20' : ''
                                }`}
                              disabled={!isEditMode && savingSlots}
                              maxLength="2"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Add Single Slot Modal */}
            {showAddSlotModal && (
              <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999]"
                onClick={() => {
                  setShowAddSlotModal(false);
                  setAddSlotData({
                    time: '',
                    maxGuests: '4',
                    status: true
                  });
                }}
              >
                <div
                  className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 shadow-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Add Single Time Slot
                    </h2>
                    <button
                      onClick={() => {
                        setShowAddSlotModal(false);
                        setAddSlotData({
                          time: '',
                          maxGuests: '4',
                          status: true
                        });
                      }}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>

                  <form onSubmit={handleAddSlotSubmit} className="space-y-5">

                    {/* TIME SLOT */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Time Slot *
                      </label>

                      <div className="relative">
                        <input
                          type="time"
                          value={addSlotData.time}
                          onChange={(e) =>
                            setAddSlotData(prev => ({ ...prev, time: e.target.value }))
                          }
                          onClick={(e) => e.target.showPicker()}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 
        bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
        transition-all duration-200 shadow-sm"
                        />
                      </div>

                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Format: HH:MM (e.g., 14:30)
                      </p>
                    </div>

                    {/* MAX GUESTS */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Max Guests *
                      </label>

                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          value={addSlotData.maxGuests}
                          onChange={(e) =>
                            setAddSlotData(prev => ({ ...prev, maxGuests: e.target.value }))
                          }
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 
        bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
        transition-all duration-200 shadow-sm"
                          placeholder="Enter max guests"
                        />
                      </div>
                    </div>

                    {/* STATUS TOGGLE */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Status
                      </label>

                      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {addSlotData.status ? "Active" : "Inactive"}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            setAddSlotData(prev => ({ ...prev, status: !prev.status }))
                          }
                          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 
        ${addSlotData.status ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"}`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300
          ${addSlotData.status ? "translate-x-6" : "translate-x-1"}`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="flex justify-end gap-3 pt-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddSlotModal(false);
                          setAddSlotData({
                            time: "",
                            maxGuests: "4",
                            status: true,
                          });
                        }}
                        className="px-5 py-2 rounded-xl border border-gray-300 dark:border-gray-600
      text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800
      hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={addingSlot}
                        className="px-5 py-2 rounded-xl bg-blue-600 text-white 
      hover:bg-blue-700 transition-all duration-200
      disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md"
                      >
                        {addingSlot && (
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        )}
                        Add Slot
                      </button>
                    </div>

                  </form>
                </div>
              </div>
            )}

            {/* Create Offers Section */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Table Booking Offers
                  </h3>
                </div>
                <button
                  onClick={() => setIsOfferModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Create Offer
                </button>
              </div>

              {/* Offers Table */}
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                {offers.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <DollarSign className="w-12 h-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No offers created</h3>
                      <p className="text-gray-500 dark:text-gray-400">Create your first table booking offer to get started.</p>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-800/50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Offer Name</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Description</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Percentage</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {offers.map((offer, index) => (
                          <tr key={offer._id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/20'
                            }`}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {offer.name}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                                {offer.description || 'No description'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-white">
                                {offer.percentage}%
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => toggleOfferStatus(offer._id!, offer.status)}
                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${offer.status ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                                  }`}
                              >
                                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${offer.status ? 'translate-x-5' : 'translate-x-1'
                                  }`} />
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => viewOffer(offer)}
                                  className="flex items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700"
                                  title="View Offer"
                                >
                                  <VisibilityIcon fontSize="small" />
                                </button>
                                <button
                                  onClick={() => editOffer(offer)}
                                  className="flex items-center justify-center w-8 h-8 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
                                  title="Edit Offer"
                                >
                                  <EditIcon fontSize="small" />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm({ show: true, id: offer._id!, name: offer.name })}
                                  className="flex items-center justify-center w-8 h-8 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                                  title="Delete Offer"
                                >
                                  <DeleteIcon fontSize="small" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Create/Edit Offer Modal */}
            {isOfferModalOpen && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999]">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {editingOfferId ? "Edit Offer" : "Create New Offer"}
                    </h2>
                    <button
                      onClick={() => {
                        setIsOfferModalOpen(false);
                        setEditingOfferId(null);
                        setOfferFormData({
                          name: '',
                          description: '',
                          percentage: '',
                          status: true
                        });
                      }}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>

                  <form onSubmit={handleOfferSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Offer Name *
                      </label>
                      <input
                        type="text"
                        value={offerFormData.name}
                        onChange={(e) => setOfferFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg  dark:bg-gray-700 dark:text-white"
                        placeholder="Enter offer name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Description
                      </label>
                      <textarea
                        value={offerFormData.description}
                        onChange={(e) => setOfferFormData(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                        placeholder="Enter offer description (optional)"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Percentage (%) *
                      </label>
                      <input
                        type="number"
                        value={offerFormData.percentage}
                        onChange={(e) => setOfferFormData(prev => ({ ...prev, percentage: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg  dark:bg-gray-700 dark:text-white"
                        placeholder="Enter percentage (e.g., 10, 15, 20)"
                        min="0"
                        max="100"
                        step="0.01"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Status
                      </label>
                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={() => setOfferFormData(prev => ({ ...prev, status: !prev.status }))}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none  ${offerFormData.status ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                            }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${offerFormData.status ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                        </button>
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {offerFormData.status ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setIsOfferModalOpen(false);
                          setEditingOfferId(null);
                          setOfferFormData({
                            name: '',
                            description: '',
                            percentage: '',
                            status: true
                          });
                        }}
                        className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submittingOffer}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {submittingOffer && (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        )}
                        {editingOfferId ? 'Update Offer' : 'Create Offer'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* View Offer Modal */}
            {viewOfferModal.show && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999]">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Offer Details
                    </h2>
                    <button
                      onClick={() => setViewOfferModal({ show: false, offer: null })}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>

                  {viewOfferModal.offer && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Offer Name
                        </label>
                        <p className="text-gray-900 dark:text-white">{viewOfferModal.offer.name}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Description
                        </label>
                        <p className="text-gray-900 dark:text-white">{viewOfferModal.offer.description || 'No description provided'}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Percentage
                        </label>
                        <p className="text-gray-900 dark:text-white">{viewOfferModal.offer.percentage}%</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Status
                        </label>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${viewOfferModal.offer.status
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          }`}>
                          {viewOfferModal.offer.status ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      <div className="flex justify-end pt-4">
                        <button
                          onClick={() => setViewOfferModal({ show: false, offer: null })}
                          className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm.show && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999]">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Confirm Delete</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Are you sure you want to delete "{deleteConfirm.name}"? This action cannot be undone.
                  </p>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setDeleteConfirm({ show: false, id: '', name: '' })}
                      className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteOffer}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Update Time Slots Confirmation Modal */}
            {showUpdateSlotsConfirm && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999]">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Confirm Update Time Slots</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    By clicking "Update", all existing time slots will be reset and regenerated based on your restaurant's operating hours with the new duration ({selectedDuration} minutes) and max guests ({maxGuests}) settings. This action cannot be undone.
                  </p>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowUpdateSlotsConfirm(false)}
                      className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmUpdateTimeSlots}
                      disabled={saving}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {saving && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      )}
                      Update & Reset Slots
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TableBookingConfigPage;