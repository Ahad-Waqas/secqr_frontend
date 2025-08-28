import React, { useState, useEffect } from 'react';
import { 
  Building, Plus, Search, Edit, MapPin, Users, 
  Calendar, UserCheck, BarChart3
} from 'lucide-react';
import { User, Branch } from '../types';
import { apiService } from '../services/api';
import { useUser } from '@/contexts/user-context';

interface BranchManagementProps {
  user: User;
}

const BranchManagement: React.FC<BranchManagementProps> = ({ user }) => {
  const { currentUser, setCurrentUser } = useUser();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [filters, setFilters] = useState({ search: '', region: '' });
  console.log('Current User in BranchManagement:', currentUser);
  
  // Form state
  const [branchForm, setBranchForm] = useState({
    branchCode: '',
    name: '',
    region: '',
    type: 'domestic' as 'domestic' | 'international',
    state: '',
    country: '',
    managerId: ''
   
  });
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);

  const canManageBranches = user.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (canManageBranches) {
      loadBranches();
      loadUsers();
    }
  }, [canManageBranches]);

  const loadBranches = async () => {
    setLoading(true);
    try {
      const data = await apiService.getBranches();
      setBranches(data);
    } catch (error) {
      console.error('Failed to load branches:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await apiService.getUsers();
      setUsers(data.filter(u => u.role === 'BRANCH_MANAGER'));
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    
    try {
      await apiService.createBranch(branchForm);
      setShowCreateModal(false);
      resetForm();
      loadBranches();
    } catch (error) {
      console.error('Failed to create branch:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranch) return;
    
    setUpdating(true);
    try {
      await apiService.updateBranch(selectedBranch.id, branchForm);
      setShowEditModal(false);
      setSelectedBranch(null);
      resetForm();
      loadBranches();
    } catch (error) {
      console.error('Failed to update branch:', error);
    } finally {
      setUpdating(false);
    }
  };

  const resetForm = () => {
    setBranchForm({
      branchCode: '',
      name: '',
      region: '',
      type: 'domestic',
      state: '',
      country: '',
      managerId: ''
    });
  };

  const openEditModal = (branch: Branch) => {
    setSelectedBranch(branch);
    setBranchForm({
      branchCode: branch.branchCode,
      name: branch.name,
      region: branch.region,
      type: branch.type || 'domestic',
      state: branch.state || '',
      country: branch.country || '',
      managerId: branch.managerId || ''
    });
    setShowEditModal(true);
  };

  const getManagerName = (managerId: string) => {
    const manager = users.find(u => u.id === managerId);
    return manager ? manager.name : 'Not Assigned';
  };

  const getBranchUserCount = (branchId: string) => {
    return users.filter(u => u.branchId === branchId).length;
  };

  const filteredBranches = branches.filter(branch => {
    const matchesSearch = !filters.search || 
      branch.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      branch.branchCode.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesRegion = !filters.region || branch.region === filters.region;
    
    return matchesSearch && matchesRegion;
  });

  const uniqueRegions = [...new Set(branches.map(b => b.region))];

  if (!canManageBranches) {
    return (
      <div className="text-center py-12">
        <Building className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">You don't have permission to manage branches.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Branch Management</h1>
          <p className="text-gray-600">Create and manage bank branches</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800"
        >
          <Plus className="h-4 w-4" />
          <span>Create Branch</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <Building className="h-8 w-8 text-blue-600 bg-blue-100 rounded-lg p-2" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{branches.length}</p>
              <p className="text-sm text-gray-600">Total Branches</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <MapPin className="h-8 w-8 text-emerald-600 bg-emerald-100 rounded-lg p-2" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{uniqueRegions.length}</p>
              <p className="text-sm text-gray-600">Regions</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <UserCheck className="h-8 w-8 text-indigo-600 bg-indigo-100 rounded-lg p-2" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {branches.filter(b => b.managerId).length}
              </p>
              <p className="text-sm text-gray-600">With Managers</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <BarChart3 className="h-8 w-8 text-purple-600 bg-purple-100 rounded-lg p-2" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(branches.reduce((acc, b) => acc + getBranchUserCount(b.id), 0) / branches.length) || 0}
              </p>
              <p className="text-sm text-gray-600">Avg Users/Branch</p>
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
                placeholder="Search branches..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
              />
            </div>
          </div>
          <select
            value={filters.region}
            onChange={(e) => setFilters({ ...filters, region: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Regions</option>
            {uniqueRegions.map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Branches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          filteredBranches.map((branch) => (
            <div key={branch.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{branch.name}</h3>
                    <p className="text-sm text-gray-500">{branch.branchCode}</p>
                  </div>
                </div>
                <button
                  onClick={() => openEditModal(branch)}
                  className="p-1 rounded-lg hover:bg-gray-100"
                >
                  <Edit className="h-4 w-4 text-gray-400" />
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{branch.region} Region • {branch.type || 'domestic'}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <UserCheck className="h-4 w-4" />
                  <span>Manager: {getManagerName(branch.managerId)}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Users className="h-4 w-4" />
                  <span>{getBranchUserCount(branch.id)} Users</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span>Created {new Date(branch.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Branch Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Branch</h2>
            <form onSubmit={handleCreateBranch} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Branch Code</label>
                <input
                  type="text"
                  value={branchForm.branchCode}
                  onChange={(e) => setBranchForm({ ...branchForm, branchCode: e.target.value })}
                  placeholder="e.g., BR001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Branch Name</label>
                <input
                  type="text"
                  value={branchForm.name}
                  onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                  placeholder="e.g., Downtown Branch"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
                <input
                  type="text"
                  value={branchForm.region}
                  onChange={(e) => setBranchForm({ ...branchForm, region: e.target.value })}
                  placeholder="e.g., Central"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Branch Type</label>
                <select
                  value={branchForm.type}
                  onChange={(e) => setBranchForm({ 
                    ...branchForm, 
                    type: e.target.value as 'domestic' | 'international',
                    // Reset state and country when switching to domestic
                    state: e.target.value === 'domestic' ? '' : branchForm.state,
                    country: e.target.value === 'domestic' ? '' : branchForm.country
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="domestic">Domestic</option>
                  <option value="international">International</option>
                </select>
              </div>
              
              {branchForm.type === 'international' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                    <input
                      type="text"
                      value={branchForm.state}
                      onChange={(e) => setBranchForm({ ...branchForm, state: e.target.value })}
                      placeholder="e.g., California"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                    <select
                      value={branchForm.country}
                      onChange={(e) => setBranchForm({ ...branchForm, country: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select a country...</option>
                      <option value="United States">United States</option>
                      <option value="Canada">Canada</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Germany">Germany</option>
                      <option value="France">France</option>
                      <option value="Japan">Japan</option>
                      <option value="Australia">Australia</option>
                      <option value="Singapore">Singapore</option>
                      <option value="Hong Kong">Hong Kong</option>
                      <option value="Switzerland">Switzerland</option>
                      <option value="Netherlands">Netherlands</option>
                      <option value="Sweden">Sweden</option>
                      <option value="Norway">Norway</option>
                      <option value="Denmark">Denmark</option>
                      <option value="Belgium">Belgium</option>
                      <option value="Austria">Austria</option>
                      <option value="Ireland">Ireland</option>
                      <option value="New Zealand">New Zealand</option>
                      <option value="South Korea">South Korea</option>
                      <option value="Taiwan">Taiwan</option>
                    </select>
                  </div>
                </>
              )}
              
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
                  {creating ? 'Creating...' : 'Create Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Branch Modal */}
      {showEditModal && selectedBranch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Branch</h2>
            <form onSubmit={handleUpdateBranch} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Branch Code</label>
                <input
                  type="text"
                  value={branchForm.branchCode}
                  onChange={(e) => setBranchForm({ ...branchForm, branchCode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Branch Name</label>
                <input
                  type="text"
                  value={branchForm.name}
                  onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
                <input
                  type="text"
                  value={branchForm.region}
                  onChange={(e) => setBranchForm({ ...branchForm, region: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Branch Manager</label>
                <select
                  value={branchForm.managerId}
                  onChange={(e) => setBranchForm({ ...branchForm, managerId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a manager...</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.username})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedBranch(null);
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
                  {updating ? 'Updating...' : 'Update Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchManagement;