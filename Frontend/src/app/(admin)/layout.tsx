"use client";

import { useGlobalOrderSocket } from "@/hooks/useGlobalOrderSocket";
import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import ToastProvider from "@/components/common/ToastProvider";
import { SocketProvider } from "@/context/SocketContext";
import { NotificationProvider } from "@/context/NotificationContext";
import NotificationPopup from "@/components/notifications/NotificationPopup";
import React, { useEffect, useState, useRef } from "react";
import axiosInstance from "@/utils/axiosConfig";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { useRouter, usePathname } from "next/navigation";
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname?.includes('/signin') || pathname?.includes('/signup');
  
  if (isAuthPage) {
    return <>{children}</>;
  }
  
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const router = useRouter();
  const [restaurentStatus, setRestaurentStatus] = useState<string | null>(null);
  const [restaurantData, setRestaurantData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Global order socket hook - works across all pages
  useGlobalOrderSocket();
  
  // Log current page for debugging
  useEffect(() => {
    console.log(`🏠 [${new Date().toLocaleString()}] Current page: ${pathname}`);
    console.log(`🌐 Global socket hook active on: ${pathname}`);
  }, [pathname]);
  
  // Move all useState hooks to the top level
  const [resubmitData, setResubmitData] = useState<Record<string, any>>({});
  const [files, setFiles] = useState<Record<string, File | File[] | null>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 23.0225, lng: 72.5714 });
  const [markerPosition, setMarkerPosition] = useState(null);
  const autocompleteRef = useRef(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await axiosInstance.get('/api/restaurants/status');
        
        setRestaurentStatus(response.data.data.status);
        setRestaurantData(response.data.data);
      } catch (error: any) {
        console.error("Error fetching restaurant status:", error);
        if (error.response?.status === 401) {
          router.push('/signin');
          return;
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [router]);

  // Dynamic class for main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
      ? "lg:ml-[290px]"
      : "lg:ml-[90px]";

  const getFieldLabel = (field: string) => {
    const labels = {
      restaurantName: 'Restaurant Name',
      ownerName: 'Owner Name',
      foodCategory: 'Food Category',
      cuisineTypes: 'Cuisine Types',
      email: 'Email Address',
      phone: 'Phone Number',
      address: 'Address',
      city: 'City',
      state: 'State',
      country: 'Country',
      pincode: 'Pincode',
      licenseNumber: 'License Number',
      gstNumber: 'GST Number',
      bankAccount: 'Bank Account',
      ifscCode: 'IFSC Code',
      description: 'Description',
      businessLicense: 'Business License',
      gstCertificate: 'GST Certificate',
      panCard: 'PAN Card',
      bankStatement: 'Bank Statement',
      foodLicense: 'Food License',
      restaurantImages: 'Restaurant Images',
      addressInfo: 'Address Information'
    };
    return labels[field] || field;
  };

  const formFieldSections = {
    'Basic Information': ['restaurantName', 'ownerName', 'foodCategory', 'cuisineTypes'],
    'Contact Details': ['email', 'phone', 'address', 'city', 'state', 'country', 'pincode'],
    'Address Information': ['addressInfo'],
    'Business Details': ['licenseNumber', 'gstNumber', 'bankAccount', 'ifscCode', 'description'],
    'Documents': ['businessLicense', 'gstCertificate', 'panCard', 'bankStatement', 'foodLicense', 'restaurantImages']
  };

  const cuisineTypes = ['Indian', 'Chinese', 'Italian', 'Mexican', 'Thai', 'Japanese', 'American', 'Mediterranean', 'French', 'Korean', 'Vietnamese', 'Lebanese', 'Greek', 'Spanish', 'Turkish', 'Continental', 'Other'];

  const handleInputChange = (field: string, value: any) => {
    setResubmitData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (field: string, file: File | File[] | null) => {
    setFiles(prev => ({ ...prev, [field]: file }));
  };

  const handlePlaceSelect = (autocomplete: google.maps.places.Autocomplete) => {
    const place = autocomplete.getPlace();
    console.log('Selected place:', place);
    
    if (place && place.geometry) {
      const location = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      };
      
      console.log('Location:', location);
      setMapCenter(location);
      setMarkerPosition(location);
      
      const addressComponents = place.address_components || [];
      let city = '', state = '', country = '', pincode = '';
      
      addressComponents.forEach(component => {
        const types = component.types;
        
        // For city - check multiple type possibilities
        if (types.includes('locality') || types.includes('administrative_area_level_2') || types.includes('sublocality_level_1')) {
          if (!city) city = component.long_name;
        }
        // For state
        if (types.includes('administrative_area_level_1')) {
          state = component.long_name;
        }
        // For country
        if (types.includes('country')) {
          country = component.long_name;
        }
        // For pincode
        if (types.includes('postal_code')) {
          pincode = component.long_name;
        }
      });
      
      console.log('Parsed address:', { city, state, country, pincode });
      
      // Get the full formatted address
      const fullAddress = place.formatted_address || place.name || '';
      
      // Update all fields including the search location
      setResubmitData(prev => ({
        ...prev,
        searchLocation: fullAddress,  // Add this to store the search location
        address: fullAddress,
        city: city,
        state: state,
        country: country,
        pincode: pincode,
        latitude: location.lat,
        longitude: location.lng
      }));
    }
  };

  const handleMapClick = async (event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    const location = { lat, lng };
    
    setMarkerPosition(location);
    
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      
      if (data.results[0]) {
        const result = data.results[0];
        const addressComponents = result.address_components;
        let city = '', state = '', country = '', pincode = '';
        
        addressComponents.forEach(component => {
          const types = component.types;
          if (types.includes('locality')) city = component.long_name;
          if (types.includes('administrative_area_level_1')) state = component.long_name;
          if (types.includes('country')) country = component.long_name;
          if (types.includes('postal_code')) pincode = component.long_name;
        });
        
        setResubmitData(prev => ({
          ...prev,
          address: result.formatted_address,
          city: city,
          state: state,
          country: country,
          pincode: pincode,
          latitude: lat,
          longitude: lng
        }));
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();

      // Add form data as JSON string
      formData.append('data', JSON.stringify(resubmitData));

      // Add files
      Object.entries(files).forEach(([key, file]) => {
        if (file) {
          if (Array.isArray(file)) {
            file.forEach((f: File) => formData.append(key, f));
          } else if (file instanceof File) {
            formData.append(key, file);
          }
        }
      });

      const response = await axiosInstance.put('/api/restaurants/resubmit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const result = response.data;

      if (result.success) {
        alert('Application resubmitted successfully! Please wait for admin review.');
        window.location.reload();
      } else {
        alert(result.message || 'Error resubmitting application');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error resubmitting application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: string) => {
    switch (field) {
      case 'restaurantName':
      case 'ownerName':
      case 'email':
      case 'phone':
      case 'address':
      case 'pincode':
      case 'licenseNumber':
      case 'gstNumber':
      case 'bankAccount':
      case 'ifscCode':
        return (
          <input
            type="text"
            placeholder={getFieldLabel(field)}
            value={resubmitData[field] || ''}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onChange={(e) => handleInputChange(field, e.target.value)}
          />
        );

      case 'description':
        return (
          <textarea
            placeholder={getFieldLabel(field)}
            rows={3}
            value={resubmitData[field] || ''}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onChange={(e) => handleInputChange(field, e.target.value)}
          />
        );

      case 'foodCategory':
        return (
          <select
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={resubmitData[field] || ''}
            onChange={(e) => handleInputChange(field, e.target.value)}
          >
            <option value="">Select Food Category</option>
            <option value="Veg">Vegetarian</option>
            <option value="Non-Veg">Non-Vegetarian</option>
            <option value="Mixed">Mixed</option>
          </select>
        );

      case 'city':
        return (
          <input
            type="text"
            value={resubmitData.city || ''}
            onChange={(e) => handleInputChange('city', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Vadodara"
          />
        );

      case 'state':
        return (
          <input
            type="text"
            value={resubmitData.state || ''}
            onChange={(e) => handleInputChange('state', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Gujarat"
          />
        );

      case 'country':
        return (
          <input
            type="text"
            value={resubmitData.country || ''}
            onChange={(e) => handleInputChange('country', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="India"
          />
        );

      case 'cuisineTypes':
        return (
          <div className="grid grid-cols-3 gap-2">
            {cuisineTypes.map((cuisine) => (
              <label key={cuisine} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={(resubmitData.cuisineTypes || []).includes(cuisine)}
                  onChange={(e) => {
                    const current = resubmitData.cuisineTypes || [];
                    const updated = e.target.checked
                      ? [...current, cuisine]
                      : current.filter(c => c !== cuisine);
                    handleInputChange('cuisineTypes', updated);
                  }}
                />
                <span className="text-sm">{cuisine}</span>
              </label>
            ))}
          </div>
        );

      case 'businessLicense':
      case 'gstCertificate':
      case 'panCard':
      case 'bankStatement':
      case 'foodLicense':
        return (
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onChange={(e) => handleFileChange(field, e.target.files?.[0])}
          />
        );

      case 'restaurantImages':
        return (
          <input
            type="file"
            multiple
            accept=".jpg,.jpeg,.png"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onChange={(e) => handleFileChange(field, e.target.files ? Array.from(e.target.files) : [])}
          />
        );

      case 'addressInfo':
        return (
          <LoadScript
            googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
            libraries={['places']}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Location *</label>
                <input
                  ref={(ref) => {
                    autocompleteRef.current = ref;
                    if (ref && window.google?.maps?.places) {
                      const autocomplete = new window.google.maps.places.Autocomplete(ref, {
                        types: ['establishment', 'geocode'],
                        componentRestrictions: { country: 'in' }
                      });
                      autocomplete.addListener('place_changed', () => handlePlaceSelect(autocomplete));
                    }
                  }}
                  type="text"
                  value={resubmitData.searchLocation || ''}
                  onChange={(e) => handleInputChange('searchLocation', e.target.value)}
                  placeholder="Start typing to search for your restaurant location"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Start typing to search for your restaurant location</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                  <input
                    type="text"
                    value={resubmitData.city || ''}
                    readOnly
                    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    placeholder="Vadodara"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                  <input
                    type="text"
                    value={resubmitData.state || ''}
                    readOnly
                    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    placeholder="Gujarat"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
                  <input
                    type="text"
                    value={resubmitData.country || ''}
                    readOnly
                    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    placeholder="India"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
                <input
                  type="text"
                  value={resubmitData.pincode || ''}
                  readOnly
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  placeholder="391101"
                />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Restaurant Location</h3>
                <p className="text-sm text-gray-600 mb-4">Click on the map or drag the marker to adjust your exact location</p>
                <div className="h-80 w-full border border-gray-300 rounded-lg overflow-hidden">
                  <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '100%' }}
                    center={mapCenter}
                    zoom={15}
                    onClick={handleMapClick}
                    options={{
                      streetViewControl: false,
                      mapTypeControl: false,
                      fullscreenControl: true,
                      zoomControl: true
                    }}
                  >
                    {markerPosition && (
                      <Marker
                        position={markerPosition}
                        draggable={true}
                        onDragEnd={handleMapClick}
                      />
                    )}
                  </GoogleMap>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                  <input
                    type="text"
                    value={resubmitData.latitude || ''}
                    readOnly
                    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    placeholder="22.3147489084207775"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                  <input
                    type="text"
                    value={resubmitData.longitude || ''}
                    readOnly
                    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    placeholder="73.1203701259033334"
                  />
                </div>
              </div>
            </div>
          </LoadScript>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" fullScreen />;
  }

  if (restaurentStatus === "pending") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-100 to-indigo-200">
        <div className="bg-white shadow-xl rounded-2xl p-10 max-w-lg text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Application Pending</h1>
          <p className="text-gray-600 mb-6">
            Your application is currently under review. Please wait for admin approval.
          </p>
          <p className="text-gray-500 mb-8">
            Once approved, you will gain access to the admin panel.
          </p>
        </div>
      </div>
    );
  }

  if (restaurentStatus === "rejected") {
    const rejectedFields = restaurantData?.rejectedFormFields || [];

    return (
      <div className="min-h-screen bg-gradient-to-r from-red-100 to-pink-200 py-8">
        <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Application Rejected</h1>
            <p className="text-gray-600 mb-4">
              Please correct the following fields and resubmit your application.
            </p>
          </div>

          {restaurantData?.rejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
              <p className="text-red-700 font-semibold mb-1">Rejection Reason:</p>
              <p className="text-red-600">{restaurantData.rejectionReason}</p>
            </div>
          )}

          <div className="space-y-8">
            {Object.entries(formFieldSections).map(([sectionName, fields]) => {
              const sectionRejectedFields = fields.filter(field => rejectedFields.includes(field));

              if (sectionRejectedFields.length === 0) return null;

              return (
                <div key={sectionName} className="border border-red-200 rounded-lg p-6 bg-red-50">
                  <h3 className="text-xl font-semibold text-red-800 mb-4 flex items-center">
                    <span className="w-3 h-3 bg-red-500 rounded-full mr-3"></span>
                    {sectionName}
                    <span className="ml-3 bg-red-200 text-red-800 text-sm px-3 py-1 rounded-full">
                      {sectionRejectedFields.length} field{sectionRejectedFields.length > 1 ? 's' : ''}
                    </span>
                  </h3>

                  <div className="grid grid-cols-1 gap-4">
                    {sectionRejectedFields.map((field) => (
                      <div key={field} className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          {getFieldLabel(field)} *
                        </label>
                        {renderField(field)}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-4 px-8 rounded-lg transition duration-200 text-lg"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Submitting...</span>
                </div>
              ) : (
                'Resubmit Application'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <NotificationProvider>
      <SocketProvider restaurantId={restaurantData?._id || ''}>
        <div className="min-h-screen xl:flex">
          {/* Sidebar and Backdrop */}
          <AppSidebar />
          <Backdrop />

          {/* Main Content Area */}
          <div
            className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}
          >
            {/* Header */}
            <AppHeader />

            {/* Page Content */}
            <div className="p-4 mx-auto  md:p-6">{children}</div>
          </div>
          
          {/* Toast Provider */}
          <ToastProvider />
          
          {/* Global Notification Popup */}
          <NotificationPopup />
        </div>
      </SocketProvider>
    </NotificationProvider>
  );
}