import axiosInstance from '@/utils/axiosConfig';

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
    const response = await axiosInstance.get('/api/permissions');
    return response.data.data;
  },

  // Create permission
  createPermission: async (data: CreatePermissionData): Promise<Permission> => {
    const response = await axiosInstance.post('/api/permissions', data);
    return response.data.data;
  },

  // Update permission
  updatePermission: async (id: string, data: Partial<CreatePermissionData>): Promise<Permission> => {
    const response = await axiosInstance.put(`/api/permissions/${id}`, data);
    return response.data.data;
  },

  // Delete permission
  deletePermission: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/api/permissions/${id}`);
  }
};