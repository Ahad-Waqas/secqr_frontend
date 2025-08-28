import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Search, Edit, Trash2, 
  UserCheck, UserX, Building, Mail, Calendar, Key, AlertCircle,
  ArrowUpDown, ChevronUp, ChevronDown
} from 'lucide-react';
import { User } from '../types';
import { useDebounce } from '@/hooks/useDebounce';
import api from '../services/axiosInstance';
import { branchApiService, BranchResponseDto } from '../services/branch-api';

// Backend User interface
interface BackendUser {
  id: number;
  name: string;
  email: string;
  role: string;
  enabled: boolean;
  branchId?: number;
  createdAt: string;
}

// Paginated response interface
interface PaginatedUserResponse {
  content: BackendUser[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export default function UserManagement() {
  // State management
  const [users, setUsers] = useState<BackendUser[]>([]);
  const [branches, setBranches] = useState<BranchResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState('asc');

  // Filter and search state
  const [filters, setFilters] = useState({ search: '', role: '', status: '', branch: '' });
  const debouncedSearch = useDebounce(filters.search, 500);

  // Form states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<BackendUser | null>(null);
  
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'USER',
    branchId: ''
  });

  const [passwordResetForm, setPasswordResetForm] = useState({
    email: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Clear alerts
  const clearAlerts = () => {
    setError('');
    setSuccess('');
  };

  // Fetch users from backend with pagination
  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      const response = await api.get('/users/paginated', {
        params: {
          page: currentPage,
          size: pageSize,
          sortBy,
          sortDir,
          ...(debouncedSearch && { search: debouncedSearch }),
          ...(filters.role && { role: filters.role }),
          ...(filters.status && { status: filters.status }),
          ...(filters.branch && { branchId: filters.branch })
        }
      });
      
      console.log('Paginated API Response:', response.data);
      
      // Handle ApiResponse wrapper structure
      if (response.data && response.data.success && response.data.data) {
        const paginatedData = response.data.data;
        console.log('Paginated users:', paginatedData);
        
        setUsers(paginatedData.content || []);
        setTotalElements(paginatedData.totalElements || 0);
        setTotalPages(paginatedData.totalPages || 0);
      } else {
        console.warn('Unexpected response structure:', response.data);
        setUsers([]);
      }
    } catch (error: any) {
      console.error('Error fetching users:', error);
      setError('Failed to load users: ' + (error.response?.data?.message || error.message));
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch branches
  const fetchBranches = async () => {
    try {
      const branchesData = await branchApiService.getBranches();
      setBranches(branchesData);
    } catch (error: any) {
      console.error('Error fetching branches:', error);
      setError('Failed to load branches');
    }
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(0); // Reset to first page when changing page size
  };

  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
    setCurrentPage(0); // Reset to first page when sorting changes
  };

  const handleSearchChange = (searchValue: string) => {
    setFilters({ ...filters, search: searchValue });
    setCurrentPage(0); // Reset to first page when search changes
  };

  useEffect(() => {
    fetchUsers();
    fetchBranches();
  }, [currentPage, pageSize, sortBy, sortDir, debouncedSearch, filters.role, filters.status, filters.branch]);

  // Users are already filtered and paginated from server
  const filteredUsers = users || [];

  // Get role display name
  const getRoleDisplayName = (role: string) => {
    const roleMap = {
      'SUPER_ADMIN': 'Super Administrator',
      'ADMIN': 'Administrator',
      'BRANCH_MANAGER': 'Branch Manager',
      'USER': 'User'
    };
    return roleMap[role as keyof typeof roleMap] || role;
  };

  // Get branch name
  const getBranchName = (branchId: number) => {
    const branch = branches.find(b => b.id === branchId);
    return branch ? branch.name : `Branch ${branchId}`;
  };

  // Reset form
  const resetForm = () => {
    setUserForm({
      name: '',
      email: '',
      password: '',
      role: 'USER',
      branchId: ''
    });
    setPasswordResetForm({
      email: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  // Create user
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();
    
    try {
      const response = await api.post('/users', {
        name: userForm.name,
        email: userForm.email,
        password: userForm.password,
        role: userForm.role,
        branchId: userForm.branchId ? parseInt(userForm.branchId) : null
      });
      
      if (response.status === 201) {
        setSuccess('User created successfully');
        setShowCreateModal(false);
        resetForm();
        fetchUsers();
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to create user');
    }
  };

  // Update user
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    try {
      const updateData: any = {
        name: userForm.name,
        email: userForm.email,
        role: userForm.role,
        branchId: userForm.branchId ? parseInt(userForm.branchId) : null
      };
      
      if (userForm.password.trim()) {
        updateData.password = userForm.password;
      }
      
      const response = await api.put(`/users/${selectedUser.id}`, updateData);
      
      if (response.status === 200) {
        setSuccess('User updated successfully');
        setShowEditModal(false);
        setSelectedUser(null);
        resetForm();
        fetchUsers();
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update user');
    }
  };

  // Delete user
  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      const response = await api.delete(`/users/${userId}`);
      if (response.status === 200) {
        setSuccess('User deleted successfully');
        fetchUsers();
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to delete user');
    }
  };

  // Toggle user status
  const handleToggleUserStatus = async (userId: number, currentStatus: boolean) => {
    try {
      const endpoint = currentStatus ? `/users/${userId}/disable` : `/users/${userId}/enable`;
      const response = await api.put(endpoint);
      
      if (response.status === 200) {
        setSuccess(`User ${currentStatus ? 'disabled' : 'enabled'} successfully`);
        fetchUsers();
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update user status');
    }
  };

  // Open edit modal
  const openEditModal = (userToEdit: BackendUser) => {
    setSelectedUser(userToEdit);
    setUserForm({
      name: userToEdit.name,
      email: userToEdit.email,
      password: '', // Don't populate password for editing
      role: userToEdit.role,
      branchId: userToEdit.branchId ? userToEdit.branchId.toString() : ''
    });
    setShowEditModal(true);
  };

  // Open password reset modal
  const openPasswordResetModal = (userToReset: BackendUser) => {
    setSelectedUser(userToReset);
    setPasswordResetForm({
      email: userToReset.email,
      newPassword: '',
      confirmPassword: ''
    });
    setShowPasswordResetModal(true);
  };

  // Reset password
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    if (passwordResetForm.newPassword !== passwordResetForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      const response = await api.put(`/users/${selectedUser.id}/reset-password`, {
        newPassword: passwordResetForm.newPassword
      });
      
      if (response.status === 200) {
        setSuccess('Password reset successfully');
        setShowPasswordResetModal(false);
        setSelectedUser(null);
        resetForm();
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to reset password');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage system users and their permissions</p>
        </div>
        <button
          onClick={() => {
            clearAlerts();
            setShowCreateModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Add User
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search users..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <select
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Roles</option>
            <option value="SUPER_ADMIN">Super Administrator</option>
            <option value="ADMIN">Administrator</option>
            <option value="BRANCH_MANAGER">Branch Manager</option>
            <option value="USER">User</option>
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
          
          <select
            value={filters.branch}
            onChange={(e) => setFilters({ ...filters, branch: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Branches</option>
            {branches.map(branch => (
              <option key={branch.id} value={branch.id.toString()}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-500">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSortChange('name')}
                    >
                      <div className="flex items-center">
                        User
                        {sortBy === 'name' && (
                          sortDir === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSortChange('role')}
                    >
                      <div className="flex items-center">
                        Role
                        {sortBy === 'role' && (
                          sortDir === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Branch
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSortChange('enabled')}
                    >
                      <div className="flex items-center">
                        Status
                        {sortBy === 'enabled' && (
                          sortDir === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSortChange('createdAt')}
                    >
                      <div className="flex items-center">
                        Created
                        {sortBy === 'createdAt' && (
                          sortDir === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                        )}
                      </div>
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
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {userItem.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {userItem.name}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <Mail className="h-4 w-4 mr-1" />
                              {userItem.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getRoleDisplayName(userItem.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {userItem.branchId ? getBranchName(userItem.branchId) : 'No Branch'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          userItem.enabled 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {userItem.enabled ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(userItem.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => openEditModal(userItem)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit User"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openPasswordResetModal(userItem)}
                          className="text-green-600 hover:text-green-800"
                          title="Reset Password"
                        >
                          <Key className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleUserStatus(userItem.id, userItem.enabled)}
                          className={`${userItem.enabled ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}
                          title={userItem.enabled ? 'Disable User' : 'Enable User'}
                        >
                          {userItem.enabled ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(userItem.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete User"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">
                    Showing {Math.min((currentPage * pageSize) + 1, totalElements)} to{' '}
                    {Math.min((currentPage + 1) * pageSize, totalElements)} of {totalElements} results
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 0}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i;
                    } else if (currentPage < 3) {
                      pageNum = i;
                    } else if (currentPage > totalPages - 4) {
                      pageNum = totalPages - 5 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-1 text-sm border rounded-md ${
                          currentPage === pageNum
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum + 1}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages - 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                  
                  <select
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className="px-2 py-1 text-sm border border-gray-300 rounded-md"
                  >
                    <option value={10}>10 per page</option>
                    <option value={25}>25 per page</option>
                    <option value={50}>50 per page</option>
                    <option value={100}>100 per page</option>
                  </select>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals would go here - Create, Edit, Password Reset */}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  minLength={6}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="USER">User</option>
                  <option value="BRANCH_MANAGER">Branch Manager</option>
                  <option value="ADMIN">Administrator</option>
                  <option value="SUPER_ADMIN">Super Administrator</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
                <select
                  value={userForm.branchId}
                  onChange={(e) => setUserForm({ ...userForm, branchId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a branch (optional)</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id.toString()}>
                      {branch.name} ({branch.branchCode}) - {branch.region}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty for admin roles that don't require a specific branch
                </p>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create User
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
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password (optional)</label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Leave empty to keep current password"
                  minLength={6}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="USER">User</option>
                  <option value="BRANCH_MANAGER">Branch Manager</option>
                  <option value="ADMIN">Administrator</option>
                  <option value="SUPER_ADMIN">Super Administrator</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
                <select
                  value={userForm.branchId}
                  onChange={(e) => setUserForm({ ...userForm, branchId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a branch (optional)</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id.toString()}>
                      {branch.name} ({branch.branchCode}) - {branch.region}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty for admin roles that don't require a specific branch
                </p>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordResetModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Reset Password</h2>
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">User Email</label>
                <input
                  type="email"
                  value={passwordResetForm.email}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  disabled
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  value={passwordResetForm.newPassword}
                  onChange={(e) => setPasswordResetForm({ ...passwordResetForm, newPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  minLength={6}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordResetForm.confirmPassword}
                  onChange={(e) => setPasswordResetForm({ ...passwordResetForm, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  minLength={6}
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordResetModal(false);
                    setSelectedUser(null);
                    setPasswordResetForm({ email: '', newPassword: '', confirmPassword: '' });
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
