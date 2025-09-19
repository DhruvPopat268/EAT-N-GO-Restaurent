"use client";
import React, { useState } from "react";
import { X, Plus, Edit, Trash2, Users, Key, Shield, Mail, Phone } from "lucide-react";

const RBACManagementPage = () => {
  const [activeTab, setActiveTab] = useState("permissions");
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form states
  const [permissionForm, setPermissionForm] = useState({ name: "", description: "" });
  const [roleForm, setRoleForm] = useState({ name: "", description: "", permissions: [] });
  const [userForm, setUserForm] = useState({ name: "", email: "", phone: "", role: "Viewer", status: "Active" });

  const [permissions, setPermissions] = useState([
    { id: 1, name: "read", description: "View and read data", createdDate: "2024-01-15" },
    { id: 2, name: "user_edit", description: "Edit user information", createdDate: "2024-01-15" },
    { id: 3, name: "user_delete", description: "Delete users", createdDate: "2024-01-15" },
    { id: 4, name: "restaurant_manage", description: "Manage restaurants", createdDate: "2024-01-16" },
    { id: 5, name: "payment_approve", description: "Approve payments", createdDate: "2024-01-16" },
  ]);

  const [roles, setRoles] = useState([
    {
      id: 1,
      name: "Admin",
      description: "Full system access",
      permissions: ["read", "user_edit", "user_delete", "restaurant_manage", "payment_approve"],
      users: 3,
      createdDate: "2024-01-15"
    },
    {
      id: 2,
      name: "Manager",
      description: "Restaurant management access",
      permissions: ["read", "restaurant_manage"],
      users: 8,
      createdDate: "2024-01-16"
    },
    {
      id: 3,
      name: "Viewer",
      description: "Read-only access",
      permissions: ["read"],
      users: 15,
      createdDate: "2024-01-16"
    }
  ]);

  const [users, setUsers] = useState([
    {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      phone: "+1234567890",
      role: "Admin",
      status: "Active",
      lastLogin: "2024-01-20",
      createdDate: "2024-01-15"
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane@example.com",
      phone: "+1234567891",
      role: "Manager",
      status: "Active",
      lastLogin: "2024-01-19",
      createdDate: "2024-01-16"
    },
    {
      id: 3,
      name: "Bob Wilson",
      email: "bob@example.com",
      phone: "+1234567892",
      role: "Viewer",
      status: "Inactive",
      lastLogin: "2024-01-18",
      createdDate: "2024-01-17"
    }
  ]);

  const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getStatusColor = (status) => {
    return status === "Active" 
      ? "bg-green-100 text-green-800" 
      : "bg-red-100 text-red-800";
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "Admin":
        return "bg-red-100 text-red-800";
      case "Manager":
        return "bg-yellow-100 text-yellow-800";
      case "Viewer":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Modal handlers
  const handleAddPermission = () => {
    if (permissionForm.name && permissionForm.description) {
      if (editingItem) {
        setPermissions(permissions.map(p => 
          p.id === editingItem.id 
            ? { ...p, name: permissionForm.name, description: permissionForm.description }
            : p
        ));
      } else {
        const newPermission = {
          id: Math.max(...permissions.map(p => p.id)) + 1,
          name: permissionForm.name,
          description: permissionForm.description,
          createdDate: getCurrentDate()
        };
        setPermissions([...permissions, newPermission]);
      }
      setPermissionForm({ name: "", description: "" });
      setEditingItem(null);
      setShowPermissionModal(false);
    }
  };

  const handleAddRole = () => {
    if (roleForm.name && roleForm.description && roleForm.permissions.length > 0) {
      if (editingItem) {
        setRoles(roles.map(r => 
          r.id === editingItem.id 
            ? { ...r, name: roleForm.name, description: roleForm.description, permissions: roleForm.permissions }
            : r
        ));
      } else {
        const newRole = {
          id: Math.max(...roles.map(r => r.id)) + 1,
          name: roleForm.name,
          description: roleForm.description,
          permissions: roleForm.permissions,
          users: 0,
          createdDate: getCurrentDate()
        };
        setRoles([...roles, newRole]);
      }
      setRoleForm({ name: "", description: "", permissions: [] });
      setEditingItem(null);
      setShowRoleModal(false);
    }
  };

  const handleAddUser = () => {
    if (userForm.name && userForm.email && userForm.phone) {
      if (editingItem) {
        setUsers(users.map(u => 
          u.id === editingItem.id 
            ? { ...u, name: userForm.name, email: userForm.email, phone: userForm.phone, role: userForm.role, status: userForm.status }
            : u
        ));
      } else {
        const newUser = {
          id: Math.max(...users.map(u => u.id)) + 1,
          name: userForm.name,
          email: userForm.email,
          phone: userForm.phone,
          role: userForm.role,
          status: userForm.status,
          lastLogin: "Never",
          createdDate: getCurrentDate()
        };
        setUsers([...users, newUser]);
        
        // Update role user count
        setRoles(roles.map(role => 
          role.name === userForm.role 
            ? { ...role, users: role.users + 1 }
            : role
        ));
      }
      setUserForm({ name: "", email: "", phone: "", role: "Viewer", status: "Active" });
      setEditingItem(null);
      setShowUserModal(false);
    }
  };

  const handlePermissionToggle = (permissionName) => {
    setRoleForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionName)
        ? prev.permissions.filter(p => p !== permissionName)
        : [...prev.permissions, permissionName]
    }));
  };

  const handleEditPermission = (permission) => {
    setEditingItem(permission);
    setPermissionForm({ name: permission.name, description: permission.description });
    setShowPermissionModal(true);
  };

  const handleEditRole = (role) => {
    setEditingItem(role);
    setRoleForm({ name: role.name, description: role.description, permissions: role.permissions });
    setShowRoleModal(true);
  };

  const handleEditUser = (user) => {
    setEditingItem(user);
    setUserForm({ name: user.name, email: user.email, phone: user.phone, role: user.role, status: user.status });
    setShowUserModal(true);
  };

  // Modal component
  const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="p-6">{children}</div>
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "permissions":
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Permissions Management</h2>
                <p className="text-gray-600">Create and manage system permissions</p>
              </div>
              <button 
                onClick={() => setShowPermissionModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Permission
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Permission Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {permissions.map((permission) => (
                    <tr key={permission.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="p-2 bg-blue-100 rounded-lg mr-3">
                            <Key className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                            {permission.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {permission.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {permission.createdDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleEditPermission(permission)}
                            className="text-blue-600 hover:text-blue-900 p-1 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-900 p-1 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "roles":
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Roles Management</h2>
                <p className="text-gray-600">Create roles by combining permissions</p>
              </div>
              <button 
                onClick={() => setShowRoleModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Role
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Permissions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Users
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {roles.map((role) => (
                    <tr key={role.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium mr-3">
                            {role.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{role.name}</div>
                            <div className="text-sm text-gray-500">{role.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {role.permissions.map((permission) => (
                            <span
                              key={permission}
                              className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
                            >
                              {permission}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                          {role.users} users
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {role.createdDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleEditRole(role)}
                            className="text-blue-600 hover:text-blue-900 p-1 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-900 p-1 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "users":
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Users Management</h2>
                <p className="text-gray-600">Assign roles to users and manage access</p>
              </div>
              <button 
                onClick={() => setShowUserModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add User
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium mr-3">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">Created: {user.createdDate}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center gap-1">
                          <Mail className="w-4 h-4 text-gray-400" />
                          {user.email}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Phone className="w-4 h-4 text-gray-400" />
                          {user.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.lastLogin}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleEditUser(user)}
                            className="text-blue-600 hover:text-blue-900 p-1 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-900 p-1 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Users className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
          <p className="text-gray-600">Manage permissions, roles, and user access control</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab("permissions")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "permissions"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                Permissions
              </div>
            </button>
            <button
              onClick={() => setActiveTab("roles")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "roles"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Roles
              </div>
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "users"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Users
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>

      {/* Add Permission Modal */}
      <Modal
        isOpen={showPermissionModal}
        onClose={() => {
          setShowPermissionModal(false);
          setPermissionForm({ name: "", description: "" });
          setEditingItem(null);
        }}
        title={editingItem ? "Edit Permission" : "Add New Permission"}
      >
        <div className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Permission Name"
              value={permissionForm.name}
              onChange={(e) => setPermissionForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <textarea
              placeholder="Description"
              value={permissionForm.description}
              onChange={(e) => setPermissionForm(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => {
                setShowPermissionModal(false);
                setPermissionForm({ name: "", description: "" });
                setEditingItem(null);
              }}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddPermission}
              disabled={!permissionForm.name || !permissionForm.description}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {editingItem ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Role Modal */}
      <Modal
        isOpen={showRoleModal}
        onClose={() => {
          setShowRoleModal(false);
          setRoleForm({ name: "", description: "", permissions: [] });
          setEditingItem(null);
        }}
        title={editingItem ? "Edit Role" : "Create New Role"}
      >
        <div className="space-y-6">
          <div>
            <input
              type="text"
              placeholder="Role Name"
              value={roleForm.name}
              onChange={(e) => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <textarea
              placeholder="Description"
              value={roleForm.description}
              onChange={(e) => setRoleForm(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
            />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Select Permissions</h3>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {permissions.map((permission) => (
                <label key={permission.id} className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={roleForm.permissions.includes(permission.name)}
                    onChange={() => handlePermissionToggle(permission.name)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{permission.name}</div>
                    <div className="text-sm text-gray-500">{permission.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              onClick={() => {
                setShowRoleModal(false);
                setRoleForm({ name: "", description: "", permissions: [] });
                setEditingItem(null);
              }}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddRole}
              disabled={!roleForm.name || !roleForm.description || roleForm.permissions.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {editingItem ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add User Modal */}
      <Modal
        isOpen={showUserModal}
        onClose={() => {
          setShowUserModal(false);
          setUserForm({ name: "", email: "", phone: "", role: "Viewer", status: "Active" });
          setEditingItem(null);
        }}
        title={editingItem ? "Edit User" : "Add New User"}
      >
        <div className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Full Name"
              value={userForm.name}
              onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <input
              type="email"
              placeholder="Email"
              value={userForm.email}
              onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <input
              type="tel"
              placeholder="Phone"
              value={userForm.phone}
              onChange={(e) => setUserForm(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <select
              value={userForm.role}
              onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {roles.map((role) => (
                <option key={role.id} value={role.name}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={userForm.status}
              onChange={(e) => setUserForm(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => {
                setShowUserModal(false);
                setUserForm({ name: "", email: "", phone: "", role: "Viewer", status: "Active" });
                setEditingItem(null);
              }}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddUser}
              disabled={!userForm.name || !userForm.email || !userForm.phone}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {editingItem ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RBACManagementPage;