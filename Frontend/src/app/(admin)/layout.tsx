"use client";

import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import React, { useEffect, useState } from "react";
import axios from "axios";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { useRouter } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const router = useRouter();
  const [restaurentStatus, setRestaurentStatus] = useState<string | null>(null);
  const [restaurantData, setRestaurantData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Move all useState hooks to the top level
  const [resubmitData, setResubmitData] = useState<Record<string, any>>({});
  const [files, setFiles] = useState<Record<string, File | File[] | null>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    console.log('All cookies:', document.cookie);
    // Check specifically for RestaurantToken
    const cookies = document.cookie.split(';');
    const restaurantToken = cookies.find(cookie => cookie.trim().startsWith('RestaurantToken='));
    console.log('RestaurantToken cookie:', restaurantToken);
    const fetchStatus = async () => {
      try {
        console.log('Making request to:', `${process.env.NEXT_PUBLIC_BASE_URL}/api/restaurants/status`);
        
        // Get token from cookie manually
        const getCookie = (name: string) => {
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) return parts.pop()?.split(';').shift();
          return null;
        };
        
        const token = getCookie('RestaurantToken');
        console.log('Extracted token:', token);
        
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/restaurants/status`,
          { 
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json',
              ...(token && { 'Authorization': `Bearer ${token}` })
            }
          }
        );
        console.log("Fetched Status Response:", response.data?.data?.status);
        setRestaurentStatus(response.data.data.status);
        setRestaurantData(response.data.data);
      } catch (error: any) {
        console.error("Error fetching restaurant status:", error);
        if (error.response?.status === 401) {
          console.log('401 detected - redirecting to signin');
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
      restaurantImages: 'Restaurant Images'
    };
    return labels[field] || field;
  };

  const formFieldSections = {
    'Basic Information': ['restaurantName', 'ownerName', 'foodCategory', 'cuisineTypes'],
    'Contact Details': ['email', 'phone', 'address', 'city', 'state', 'country', 'pincode'],
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

      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/restaurants/resubmit`, {
        method: 'PUT',
        credentials: 'include',
        body: formData
      });

      const result = await response.json();

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
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onChange={(e) => handleInputChange(field, e.target.value)}
          />
        );

      case 'description':
        return (
          <textarea
            placeholder={getFieldLabel(field)}
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onChange={(e) => handleInputChange(field, e.target.value)}
          />
        );

      case 'foodCategory':
        return (
          <select
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          <select
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onChange={(e) => handleInputChange(field, e.target.value)}
          >
            <option value="">Select City</option>
            <option value="Mumbai">Mumbai</option>
            <option value="Delhi">Delhi</option>
            <option value="Bangalore">Bangalore</option>
            <option value="Chennai">Chennai</option>
            <option value="Kolkata">Kolkata</option>
            <option value="Hyderabad">Hyderabad</option>
            <option value="Pune">Pune</option>
          </select>
        );

      case 'state':
        return (
          <select
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onChange={(e) => handleInputChange(field, e.target.value)}
          >
            <option value="">Select State</option>
            <option value="Maharashtra">Maharashtra</option>
            <option value="Delhi">Delhi</option>
            <option value="Karnataka">Karnataka</option>
            <option value="Tamil Nadu">Tamil Nadu</option>
            <option value="West Bengal">West Bengal</option>
            <option value="Telangana">Telangana</option>
            <option value="Gujarat">Gujarat</option>
            <option value="Rajasthan">Rajasthan</option>
          </select>
        );

      case 'country':
        return (
          <select
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onChange={(e) => handleInputChange(field, e.target.value)}
          >
            <option value="">Select Country</option>
            <option value="India">India</option>
            <option value="United States">United States</option>
            <option value="United Kingdom">United Kingdom</option>
            <option value="Canada">Canada</option>
          </select>
        );

      case 'cuisineTypes':
        return (
          <div className="grid grid-cols-3 gap-2">
            {cuisineTypes.map((cuisine) => (
              <label key={cuisine} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="rounded"
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">{children}</div>
      </div>
    </div>
  );
}