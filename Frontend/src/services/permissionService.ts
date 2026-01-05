import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem('RestaurantToken');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export interface Permission {
  _id: string;
  name: string;
  description: string;
  module: string;
  action: string;
  restaurantId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePermissionData {
  name: string;
  description: string;
  module: string;
  action: string;
}

export const permissionService = {
  // Get all permissions
  getPermissions: async (): Promise<Permission[]> => {
    const response = await axios.get(`${API_BASE_URL}/api/permissions`, {
      headers: getAuthHeaders()
    });
    return response.data.data;
  },

  // Create permission
  createPermission: async (data: CreatePermissionData): Promise<Permission> => {
    const response = await axios.post(`${API_BASE_URL}/api/permissions`, data, {
      headers: getAuthHeaders()
    });
    return response.data.data;
  },

  // Update permission
  updatePermission: async (id: string, data: Partial<CreatePermissionData>): Promise<Permission> => {
    const response = await axios.put(`${API_BASE_URL}/api/permissions/${id}`, data, {
      headers: getAuthHeaders()
    });
    return response.data.data;
  },

  // Delete permission
  deletePermission: async (id: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/api/permissions/${id}`, {
      headers: getAuthHeaders()
    });
  }
};