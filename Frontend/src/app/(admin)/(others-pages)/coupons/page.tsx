"use client";
import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { toast } from "@/utils/toast";
import axiosInstance from '@/utils/axiosConfig';
import Pagination from '@/components/tables/Pagination';
import { useOrderNotifications } from "@/hooks/useOrderNotifications";
import { useOrderRequestNotifications } from "@/hooks/useOrderRequestNotifications";
import { formatDateTime } from '@/utils/dateUtils';

const couponsApi = {
  getAll: async (page: number = 1, limit: number = 10, filters?: any) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    
    const response = await axiosInstance.get(`/api/restaurants/coupons?${params.toString()}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await axiosInstance.post('/api/restaurants/coupons', data);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await axiosInstance.put(`/api/restaurants/coupons/${id}`, data);
    return response.data;
  },
  updateStatus: async (id: string, status: boolean) => {
    const response = await axiosInstance.patch(`/api/restaurants/coupons/${id}/status`, { status });
    return response.data;
  }
};

interface Coupon {
  _id: string;
  name: string;
  description: string;
  couponCode: string;
  discountType: "percentage" | "fixed";
  amount: number;
  maxDiscount?: number;
  minOrderTotal: number;
  usageCount: number;
  totalUsageLimit: number;
  userUsageLimit: number;
  firstOrderOnly: boolean;
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

const CouponsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0
  });
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingCoupon, setViewingCoupon] = useState<Coupon | null>(null);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    couponCode: "",
    discountType: "percentage",
    amount: "",
    maxDiscount: "",
    minOrderTotal: "",
    totalUsageLimit: "-1",
    userUsageLimit: "1",
    firstOrderOnly: false,
    status: true
  });
  useOrderNotifications("Coupons");
  useOrderRequestNotifications("Coupons");

  useEffect(() => {
    fetchCoupons(1);
  }, [searchTerm, statusFilter]);

  const handleSearch = () => {
    setSearchTerm(searchInput);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const fetchCoupons = async (page: number = pagination.page, limit: number = pagination.limit) => {
    try {
      setLoading(true);
      const filters = {
        search: searchTerm,
        status: statusFilter
      };
      const response = await couponsApi.getAll(page, limit, filters);
      if (response.success) {
        setCoupons(response.data);
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast.error('Error fetching coupons');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    fetchCoupons(page, pagination.limit);
  };

  const handleLimitChange = (limit: number) => {
    fetchCoupons(1, limit);
  };

  const handleToggleStatus = async (id: string, status: boolean) => {
    try {
      const response = await couponsApi.updateStatus(id, status);
      if (response.success) {
        toast.success(`Coupon ${status ? 'activated' : 'deactivated'} successfully!`);
        fetchCoupons();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error updating coupon status');
    }
  };

  const openModal = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        name: coupon.name,
        description: coupon.description || "",
        couponCode: coupon.couponCode,
        discountType: coupon.discountType,
        amount: coupon.amount.toString(),
        maxDiscount: coupon.maxDiscount?.toString() || "",
        minOrderTotal: coupon.minOrderTotal.toString(),
        totalUsageLimit: coupon.totalUsageLimit.toString(),
        userUsageLimit: coupon.userUsageLimit.toString(),
        firstOrderOnly: coupon.firstOrderOnly,
        status: coupon.status
      });
    } else {
      setEditingCoupon(null);
      setFormData({
        name: "",
        description: "",
        couponCode: "",
        discountType: "percentage",
        amount: "",
        maxDiscount: "",
        minOrderTotal: "",
        totalUsageLimit: "-1",
        userUsageLimit: "1",
        firstOrderOnly: false,
        status: true
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCoupon(null);
  };

  const openViewModal = (coupon: Coupon) => {
    setViewingCoupon(coupon);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setViewingCoupon(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.couponCode || !formData.amount || !formData.minOrderTotal) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const payload: any = {
        name: formData.name,
        description: formData.description,
        couponCode: formData.couponCode.toUpperCase(),
        discountType: formData.discountType,
        amount: parseFloat(formData.amount),
        minOrderTotal: parseFloat(formData.minOrderTotal),
        totalUsageLimit: parseInt(formData.totalUsageLimit),
        userUsageLimit: parseInt(formData.userUsageLimit),
        firstOrderOnly: formData.firstOrderOnly,
        status: formData.status
      };

      if (formData.discountType === 'percentage' && formData.maxDiscount) {
        payload.maxDiscount = parseFloat(formData.maxDiscount);
      }

      const response = editingCoupon 
        ? await couponsApi.update(editingCoupon._id, payload)
        : await couponsApi.create(payload);

      if (response.success) {
        toast.success(`Coupon ${editingCoupon ? 'updated' : 'created'} successfully!`);
        closeModal();
        fetchCoupons();
      }
    } catch (error: any) {
      console.error('Error saving coupon:', error);
      toast.error(error.response?.data?.message || 'Error saving coupon');
    }
  };



  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Coupons Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage all coupons</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Coupons Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage all coupons</p>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 w-[35%]">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search coupons..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="block w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Search
            </button>
          </div>

          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>

            {(statusFilter || searchTerm) && (
              <button
                onClick={() => { setStatusFilter(""); setSearchTerm(""); setSearchInput(""); }}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                Clear
              </button>
            )}

            <button
              onClick={() => openModal()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Coupon
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing {coupons.length} of {pagination.totalCount} coupons
        </p>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 dark:text-gray-400">Records per page:</label>
          <select
            value={pagination.limit}
            onChange={(e) => handleLimitChange(parseInt(e.target.value))}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        {coupons.length === 0 ? (
          <div>
            <div className="border-b border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-[80px_1fr_120px_120px_120px_100px_120px_120px_120px_100px] gap-4 px-6 py-3">
                <div className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Id</div>
                <div className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Coupon Code</div>
                <div className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Name</div>
                <div className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Discount</div>
                <div className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Min Order</div>
                <div className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Usage</div>
                <div className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Status</div>
                <div className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Created At</div>
                <div className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Updated At</div>
                <div className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Actions</div>
              </div>
            </div>
            <div className="px-6 py-12 text-center">
              <div className="flex flex-col items-center">
                <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No coupons found</h3>
                <p className="text-gray-500 dark:text-gray-400">Create your first coupon to get started.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Id</TableCell>
                  <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Coupon Code</TableCell>
                  <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Name</TableCell>
                  <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Discount</TableCell>
                  <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Min Order</TableCell>
                  <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Usage</TableCell>
                  <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Status</TableCell>
                  <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Created At</TableCell>
                  <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Updated At</TableCell>
                  <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Actions</TableCell>
                </TableRow>
              </TableHeader>

              <TableBody>
                {coupons.map((coupon, index) => (
                  <TableRow key={coupon._id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/20'}`}>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white font-medium">#{(pagination.page - 1) * pagination.limit + index + 1}</div>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-blue-600 dark:text-blue-400">{coupon.couponCode}</div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white font-medium">{coupon.name}</div>
                      {coupon.description && <div className="text-xs text-gray-500 dark:text-gray-400">{coupon.description}</div>}
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {coupon.discountType === 'percentage' ? `${coupon.amount}%` : `₹${coupon.amount}`}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">₹{coupon.minOrderTotal}</div>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {coupon.usageCount} / {coupon.totalUsageLimit === -1 ? '∞' : coupon.totalUsageLimit}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={coupon.status}
                            onChange={() => handleToggleStatus(coupon._id, !coupon.status)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${coupon.status ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"}`}>
                          {coupon.status ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div>{formatDateTime(coupon.createdAt).date}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{formatDateTime(coupon.createdAt).time}</div>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div>{formatDateTime(coupon.updatedAt).date}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{formatDateTime(coupon.updatedAt).time}</div>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openViewModal(coupon)}
                          className="flex items-center justify-center w-8 h-8 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors"
                          title="View Coupon"
                        >
                          <VisibilityIcon fontSize="small" />
                        </button>
                        <button
                          onClick={() => openModal(coupon)}
                          className="flex items-center justify-center w-8 h-8 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-colors"
                          title="Edit Coupon"
                        >
                          <EditIcon fontSize="small" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewingCoupon && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Coupon Details</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Coupon Code</label>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-1">{viewingCoupon.couponCode}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</label>
                  <p className="mt-1">
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${viewingCoupon.status ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"}`}>
                      {viewingCoupon.status ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Name</label>
                <p className="text-base text-gray-900 dark:text-white mt-1">{viewingCoupon.name}</p>
              </div>

              {viewingCoupon.description && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Description</label>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{viewingCoupon.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Discount Type</label>
                  <p className="text-base text-gray-900 dark:text-white mt-1 capitalize">{viewingCoupon.discountType}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Discount Amount</label>
                  <p className="text-base font-semibold text-gray-900 dark:text-white mt-1">
                    {viewingCoupon.discountType === 'percentage' ? `${viewingCoupon.amount}%` : `₹${viewingCoupon.amount}`}
                  </p>
                </div>
              </div>

              {viewingCoupon.discountType === 'percentage' && viewingCoupon.maxDiscount && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Max Discount</label>
                  <p className="text-base text-gray-900 dark:text-white mt-1">₹{viewingCoupon.maxDiscount}</p>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Minimum Order Total</label>
                <p className="text-base text-gray-900 dark:text-white mt-1">₹{viewingCoupon.minOrderTotal}</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Usage Count</label>
                  <p className="text-base text-gray-900 dark:text-white mt-1">{viewingCoupon.usageCount}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Total Limit</label>
                  <p className="text-base text-gray-900 dark:text-white mt-1">{viewingCoupon.totalUsageLimit === -1 ? 'Unlimited' : viewingCoupon.totalUsageLimit}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">User Limit</label>
                  <p className="text-base text-gray-900 dark:text-white mt-1">{viewingCoupon.userUsageLimit === -1 ? 'Unlimited' : viewingCoupon.userUsageLimit}</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">First Order Only</label>
                <p className="text-base text-gray-900 dark:text-white mt-1">{viewingCoupon.firstOrderOnly ? 'Yes' : 'No'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Created At</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">{formatDateTime(viewingCoupon.createdAt).date}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{formatDateTime(viewingCoupon.createdAt).time}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Updated At</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">{formatDateTime(viewingCoupon.updatedAt).date}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{formatDateTime(viewingCoupon.updatedAt).time}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={closeViewModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Coupon Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                    placeholder="e.g., New Year Special"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Coupon Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.couponCode}
                    onChange={(e) => setFormData({ ...formData, couponCode: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm uppercase"
                    placeholder="e.g., NEWYEAR2024"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                    placeholder="Describe the coupon offer"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Discount Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                    required
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {formData.discountType === 'percentage' ? 'Discount Percentage' : 'Discount Amount'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                    placeholder={formData.discountType === 'percentage' ? 'e.g., 10' : 'e.g., 100'}
                    min="0"
                    max={formData.discountType === 'percentage' ? "100" : undefined}
                    required
                  />
                </div>

                {formData.discountType === 'percentage' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Max Discount Amount
                    </label>
                    <input
                      type="number"
                      value={formData.maxDiscount}
                      onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                      placeholder="e.g., 500"
                      min="0"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Cap the maximum discount</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Minimum Order Total <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.minOrderTotal}
                    onChange={(e) => setFormData({ ...formData, minOrderTotal: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                    placeholder="e.g., 500"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Total Usage Limit <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.totalUsageLimit}
                    onChange={(e) => setFormData({ ...formData, totalUsageLimit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                    placeholder="-1 for unlimited"
                    required
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Use -1 for unlimited usage</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    User Usage Limit <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.userUsageLimit}
                    onChange={(e) => setFormData({ ...formData, userUsageLimit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="-1 for unlimited"
                    disabled={formData.firstOrderOnly}
                    required
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formData.firstOrderOnly ? 'Set to 1 for first order only' : 'Use -1 for unlimited per user'}
                  </p>
                </div>

                <div className="md:col-span-2 space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="firstOrderOnly"
                      checked={formData.firstOrderOnly}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setFormData({ 
                          ...formData, 
                          firstOrderOnly: isChecked,
                          userUsageLimit: isChecked ? "1" : formData.userUsageLimit
                        });
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="firstOrderOnly" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      First Order Only
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="status"
                      checked={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="status" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Active Status
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CouponsPage;
