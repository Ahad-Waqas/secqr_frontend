import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Search, Edit, Trash2, 
  UserCheck, UserX, Building, Mail, Calendar, Key, AlertCircle
} from 'lucide-react';
import { User } from '../types';
import api from '@/services/axiosInstance';

interface UserManagementProps {
  user: User;
}

interface BackendUser {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'AUDITOR' | 'BRANCH_MANAGER' | 'SALES_USER' | 'BRANCH_APPROVER';
  branchId?: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserForm {
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'AUDITOR' | 'BRANCH_MANAGER' | 'SALES_USER' | 'BRANCH_APPROVER';
  branchId: string;
}

const UserManagement: React.FC<UserManagementProps> = ({ user }) => {
  const [users, setUsers] = useState<BackendUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<BackendUser | null>(null);
  const [filters, setFilters] = useState({ search: '', role: '', status: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state
  const [userForm, setUserForm] = useState<UserForm>({
    name: '',
    email: '',
    password: '',
    role: 'SALES_USER',
    branchId: ''
  });

  const [passwordResetForm, setPasswordResetForm] = useState({
    email: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  const canManageUsers = user.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (canManageUsers) {
      loadUsers();
    }
  }, [canManageUsers]);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/users');
      if (response.data.success) {
        setUsers(response.data.data);
      } else {
        setError(response.data.message || 'Failed to load users');
      }
    } catch (error: any) {
      console.error('Failed to load users:', error);
      setError(error.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userForm.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    setCreating(true);
    setError('');
    
    try {
      const response = await api.post('/users', userForm);
      if (response.data.success) {
        setShowCreateModal(false);
        resetForm();
        loadUsers();
        setSuccess('User created successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.data.message || 'Failed to create user');
      }
    } catch (error: any) {
      console.error('Failed to create user:', error);
      setError(error.response?.data?.message || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    setUpdating(true);
    setError('');
    try {
      const updateData = {
        name: userForm.name,
        email: userForm.email,
        role: userForm.role,
        branchId: userForm.branchId || null
      };
      
      const response = await api.put(`/users/${selectedUser.id}`, updateData);
      if (response.data.success) {
        setShowEditModal(false);
        setSelectedUser(null);
        resetForm();
        loadUsers();
        setSuccess('User updated successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.data.message || 'Failed to update user');
      }
    } catch (error: any) {
      console.error('Failed to update user:', error);
      setError(error.response?.data?.message || 'Failed to update user');
    } finally {
      setUpdating(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordResetForm.newPassword !== passwordResetForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (passwordResetForm.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    setResettingPassword(true);
    setError('');
    
    try {
      const response = await api.post('/users/reset-password', {
        email: passwordResetForm.email,
        newPassword: passwordResetForm.newPassword
      });
      
      if (response.data.success) {
        setShowPasswordResetModal(false);
        setPasswordResetForm({ email: '', newPassword: '', confirmPassword: '' });
        setSuccess('Password reset successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.data.message || 'Failed to reset password');
      }
    } catch (error: any) {
      console.error('Failed to reset password:', error);
      setError(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setResettingPassword(false);
    }
  };

  const handleToggleUserStatus = async (userId: number, currentStatus: boolean) => {
    try {
      const endpoint = currentStatus ? `/users/${userId}/disable` : `/users/${userId}/enable`;
      const response = await api.put(endpoint);
      
      if (response.data.success) {
        loadUsers();
        setSuccess(`User ${currentStatus ? 'disabled' : 'enabled'} successfully`);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.data.message || 'Failed to update user status');
      }
    } catch (error: any) {
      console.error('Failed to update user status:', error);
      setError(error.response?.data?.message || 'Failed to update user status');
    }
  };

  const resetForm = () => {
    setUserForm({
      name: '',
      email: '',
      password: '',
      role: 'SALES_USER',
      branchId: ''
    });
  };

  const openEditModal = (userToEdit: BackendUser) => {
    setSelectedUser(userToEdit);
    setUserForm({
      name: userToEdit.name,
      email: userToEdit.email,
      password: '', // Don't populate password for editing
      role: userToEdit.role,
      branchId: userToEdit.branchId || ''
    });
    setShowEditModal(true);
  };

  const openPasswordResetModal = (userToReset: BackendUser) => {
    setSelectedUser(userToReset);
    setPasswordResetForm({
      email: userToReset.email,
      newPassword: '',
      confirmPassword: ''
    });
    setShowPasswordResetModal(true);
  };

  const getRoleDisplayName = (role: string) => {
    const roleMap = {
      'ADMIN': 'Administrator',
      'BRANCH_MANAGER': 'Branch Manager',
      'BRANCH_APPROVER': 'Branch Approver',
      'SALES_USER': 'Sales User',
      'AUDITOR': 'Auditor'
    };
    return roleMap[role as keyof typeof roleMap] || role;
  };

  const getStatusBadge = (isEnabled: boolean) => {
    return (
      <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full ${
        isEnabled 
          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
          : 'bg-red-100 text-red-700 border border-red-200'
      }`}>
        {isEnabled ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
        <span>{isEnabled ? 'Active' : 'Inactive'}</span>
      </span>
    );
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = !filters.search || 
      u.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      u.email.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesRole = !filters.role || u.role === filters.role;
    const matchesStatus = !filters.status || 
      (filters.status === 'active' && u.isEnabled) ||
      (filters.status === 'inactive' && !u.isEnabled);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (!canManageUsers) {
    return (
      <div className="text-center py-12">
        <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">You don't have permission to manage users.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Create and manage system users</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800"
        >
          <Plus className="h-4 w-4" />
          <span>Create User</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <Users className="h-8 w-8 text-blue-600 bg-blue-100 rounded-lg p-2" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              <p className="text-sm text-gray-600">Total Users</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <UserCheck className="h-8 w-8 text-emerald-600 bg-emerald-100 rounded-lg p-2" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.isEnabled).length}
              </p>
              <p className="text-sm text-gray-600">Active Users</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <Building className="h-8 w-8 text-indigo-600 bg-indigo-100 rounded-lg p-2" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.role === 'BRANCH_MANAGER').length}
              </p>
              <p className="text-sm text-gray-600">Branch Managers</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <UserX className="h-8 w-8 text-red-600 bg-red-100 rounded-lg p-2" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => !u.isEnabled).length}
              </p>
              <p className="text-sm text-gray-600">Inactive Users</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
              />
            </div>
          </div>
          <select
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Roles</option>
            <option value="system_admin">System Admin</option>
            <option value="branch_manager">Branch Manager</option>
            <option value="branch_approver">Branch Approver</option>
            <option value="request_initiator">Request Initiator</option>
            <option value="sales_user">Sales User</option>
            <option value="auditor">Auditor</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Branch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((userItem) => (
                  <tr key={userItem.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-blue-600 font-medium text-sm">
                            {userItem.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{userItem.name}</div>
                          <div className="text-sm text-gray-500">{userItem.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{getRoleDisplayName(userItem.role)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {userItem.branchId || 'Head Office'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(userItem.isEnabled)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(userItem.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openEditModal(userItem)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create New User</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={userForm.phone}
                  onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value as 'ADMIN' | 'AUDITOR' | 'BRANCH_MANAGER' | 'SALES_USER' | 'BRANCH_APPROVER' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="SALES_USER">Sales User</option>
                  <option value="BRANCH_MANAGER">Branch Manager</option>
                  <option value="BRANCH_APPROVER">Branch Approver</option>
                  <option value="AUDITOR">Auditor</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Branch ID (Optional)</label>
                <input
                  type="text"
                  value={userForm.branchId}
                  onChange={(e) => setUserForm({ ...userForm, branchId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter branch ID (leave empty for admin roles)"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Edit User</h2>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <input
                  type="text"
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={userForm.phone}
                  onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value as 'ADMIN' | 'AUDITOR' | 'BRANCH_MANAGER' | 'SALES_USER' | 'BRANCH_APPROVER' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="SALES_USER">Sales User</option>
                  <option value="BRANCH_MANAGER">Branch Manager</option>
                  <option value="BRANCH_APPROVER">Branch Approver</option>
                  <option value="AUDITOR">Auditor</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Branch ID (Optional)</label>
                <input
                  type="text"
                  value={userForm.branchId}
                  onChange={(e) => setUserForm({ ...userForm, branchId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter branch ID (leave empty for admin roles)"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:opacity-50"
                >
                  {updating ? 'Updating...' : 'Update User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;