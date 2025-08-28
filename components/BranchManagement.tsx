import React, { useState, useEffect } from 'react';
import { 
  Building, Plus, Search, Edit, MapPin, Users, 
  Calendar, UserCheck, BarChart3, AlertCircle, Badge, Mail, Phone
} from 'lucide-react';
import { User } from '../types';
import { useUser } from '@/contexts/user-context';
import { branchApiService, BranchResponseDto, BranchCreateDto, BranchUpdateDto, BackendUser } from '../services/branch-api';
import { apiService } from '../services/api';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface BranchManagementProps {
  user: User;
}

interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
}

const BranchManagement: React.FC<BranchManagementProps> = ({ user }) => {
  const { currentUser, setCurrentUser } = useUser();
  const [branchesData, setBranchesData] = useState<PaginatedResponse<BranchResponseDto> | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<BranchResponseDto | null>(null);
  const [filters, setFilters] = useState({ search: '', region: '' });
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  
  // Form state
  const [branchForm, setBranchForm] = useState<BranchCreateDto>({
    branchCode: '',
    name: '',
    region: '',
    type: 'DOMESTIC',
    state: '',
    country: ''
  });
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);

  const canManageBranches = user.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (canManageBranches) {
      loadBranches();
    }
  }, [canManageBranches, currentPage, pageSize, sortBy, sortDir, filters.search, filters.region]);
  
  const loadBranches = async () => {
    setLoading(true);
    setError(null);
    try {
      let response;
      
      if (filters.search.trim()) {
        // Use search API when there's a search term
        response = await branchApiService.searchBranchesPaginated(
          filters.search.trim(),
          currentPage,
          pageSize,
          sortBy,
          sortDir
        );
      } else {
        // Use regular paginated API
        response = await branchApiService.getBranchesPaginated(
          currentPage,
          pageSize,
          sortBy,
          sortDir
        );
      }
      
      setBranchesData(response);
      
      console.log('Paginated branches loaded:', {
        totalElements: response.totalElements,
        totalPages: response.totalPages,
        currentPage: response.number,
        size: response.size
      });
    } catch (error: any) {
      console.error('Failed to load branches:', error);
      setError(error.message || 'Failed to load branches');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    
    try {
      await branchApiService.createBranch(branchForm);
      setShowCreateModal(false);
      resetForm();
      loadBranches();
    } catch (error: any) {
      console.error('Failed to create branch:', error);
      setError(error.message || 'Failed to create branch');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranch) return;
    
    setUpdating(true);
    setError(null);
    try {
      const updateData: BranchUpdateDto = {
        ...branchForm,
        isActive: selectedBranch.isActive
      };
      
      await branchApiService.updateBranch(selectedBranch.id, updateData);
      setShowEditModal(false);
      setSelectedBranch(null);
      resetForm();
      loadBranches();
    } catch (error: any) {
      console.error('Failed to update branch:', error);
      setError(error.message || 'Failed to update branch');
    } finally {
      setUpdating(false);
    }
  };

  const resetForm = () => {
    setBranchForm({
      branchCode: '',
      name: '',
      region: '',
      type: 'DOMESTIC',
      state: '',
      country: ''
    });
    setError(null);
  };

  const openEditModal = (branch: BranchResponseDto) => {
    setSelectedBranch(branch);
    setBranchForm({
      branchCode: branch.branchCode,
      name: branch.name,
      region: branch.region,
      type: branch.type || 'DOMESTIC',
      state: branch.state || '',
      country: branch.country || ''
    });
    setShowEditModal(true);
  };

  const openDetailsModal = (branch: BranchResponseDto) => {
    setSelectedBranch(branch);
    setShowDetailsModal(true);
  };

  const getManagerName = (branch: BranchResponseDto) => {
    if (branch.manager) {
      return branch.manager.name || 'Unknown Manager';
    }
    return 'Not Assigned';
  };

  const getBranchUserCount = (branch: BranchResponseDto) => {
    return branch.userCount || 0;
  };

  const filteredBranches = branchesData?.content?.filter(branch => {
    // Client-side filtering for region only (search is handled server-side)
    const matchesRegion = !filters.region || branch.region === filters.region;
    return matchesRegion;
  }) || [];

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

  // Load regions for filter dropdown
  const [uniqueRegions, setUniqueRegions] = useState<string[]>([]);

  useEffect(() => {
    const loadRegions = async () => {
      try {
        const regions = await branchApiService.getDistinctRegions();
        setUniqueRegions(regions);
      } catch (error) {
        console.error('Failed to load regions:', error);
      }
    };
    
    if (canManageBranches) {
      loadRegions();
    }
  }, [canManageBranches]);

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
              <p className="text-2xl font-bold text-gray-900">{branchesData?.totalElements || 0}</p>
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
                {branchesData?.content?.filter(b => b.manager).length || 0}
              </p>
              <p className="text-sm text-gray-600">With Managers (Current Page)</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <BarChart3 className="h-8 w-8 text-purple-600 bg-purple-100 rounded-lg p-2" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {branchesData?.content && branchesData.content.length > 0 
                  ? Math.round(branchesData.content.reduce((acc, b) => acc + getBranchUserCount(b), 0) / branchesData.content.length) 
                  : 0}
              </p>
              <p className="text-sm text-gray-600">Avg Users/Branch (Current Page)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <div>
            <p className="text-sm font-medium text-red-800">Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            ×
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4 flex-1">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search branches..."
                  value={filters.search}
                  onChange={(e) => handleSearchChange(e.target.value)}
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
          
          <div className="flex items-center space-x-2 ml-4">
            <label className="text-sm text-gray-600">Show:</label>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-gray-600">per page</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            Showing {Math.min((currentPage * pageSize) + 1, branchesData?.totalElements || 0)} to {Math.min((currentPage + 1) * pageSize, branchesData?.totalElements || 0)} of {branchesData?.totalElements || 0} branches
          </div>
          <div className="flex items-center space-x-2">
            <span>Sort by:</span>
            <button
              onClick={() => handleSortChange('name')}
              className={`px-2 py-1 rounded text-xs ${
                sortBy === 'name' ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'
              }`}
            >
              Name {sortBy === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSortChange('branchCode')}
              className={`px-2 py-1 rounded text-xs ${
                sortBy === 'branchCode' ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'
              }`}
            >
              Code {sortBy === 'branchCode' && (sortDir === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSortChange('region')}
              className={`px-2 py-1 rounded text-xs ${
                sortBy === 'region' ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'
              }`}
            >
              Region {sortBy === 'region' && (sortDir === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSortChange('createdAt')}
              className={`px-2 py-1 rounded text-xs ${
                sortBy === 'createdAt' ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'
              }`}
            >
              Created {sortBy === 'createdAt' && (sortDir === 'asc' ? '↑' : '↓')}
            </button>
          </div>
        </div>
      </div>

      {/* Branches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredBranches.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Building className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No branches found</h3>
            <p className="text-gray-600">
              {filters.search ? 'Try adjusting your search criteria' : 'No branches available'}
            </p>
          </div>
        ) : (
          filteredBranches.map((branch) => (
            <div 
              key={branch.id} 
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => openDetailsModal(branch)}
            >
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
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent card click when editing
                    openEditModal(branch);
                  }}
                  className="p-1 rounded-lg hover:bg-gray-100"
                >
                  <Edit className="h-4 w-4 text-gray-400" />
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{branch.region} Region • {branch.type?.toLowerCase() || 'domestic'}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <UserCheck className="h-4 w-4" />
                  <span>Manager: {getManagerName(branch)}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Users className="h-4 w-4" />
                  <span>{getBranchUserCount(branch)} Users</span>
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

      {/* Pagination Controls */}
      {!loading && branchesData && (
        <div className="flex items-center justify-center mt-8">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => branchesData.number > 0 && handlePageChange(branchesData.number - 1)}
                  className={branchesData.number === 0 ? 'pointer-events-none opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              {/* Page numbers */}
              {Array.from({ length: Math.min(5, branchesData.totalPages) }, (_, i) => {
                let pageNum;
                if (branchesData.totalPages <= 5) {
                  pageNum = i;
                } else if (branchesData.number <= 2) {
                  pageNum = i;
                } else if (branchesData.number >= branchesData.totalPages - 3) {
                  pageNum = branchesData.totalPages - 5 + i;
                } else {
                  pageNum = branchesData.number - 2 + i;
                }
                
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => handlePageChange(pageNum)}
                      isActive={branchesData.number === pageNum}
                      className="cursor-pointer"
                    >
                      {pageNum + 1}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              {branchesData.totalPages > 5 && branchesData.number < branchesData.totalPages - 3 && (
                <>
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink
                      onClick={() => handlePageChange(branchesData.totalPages - 1)}
                      className="cursor-pointer"
                    >
                      {branchesData.totalPages}
                    </PaginationLink>
                  </PaginationItem>
                </>
              )}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => branchesData.number < branchesData.totalPages - 1 && handlePageChange(branchesData.number + 1)}
                  className={branchesData.number === branchesData.totalPages - 1 ? 'pointer-events-none opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Create Branch Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Branch</h2>
            
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}
            
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
                    type: e.target.value as 'DOMESTIC' | 'INTERNATIONAL',
                    // Reset state and country when switching to domestic
                    state: e.target.value === 'DOMESTIC' ? '' : branchForm.state,
                    country: e.target.value === 'DOMESTIC' ? '' : branchForm.country
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="DOMESTIC">Domestic</option>
                  <option value="INTERNATIONAL">International</option>
                </select>
              </div>
              
              {branchForm.type === 'INTERNATIONAL' && (
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
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Branch</h2>
            
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}
            
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Branch Type</label>
                <select
                  value={branchForm.type}
                  onChange={(e) => setBranchForm({ 
                    ...branchForm, 
                    type: e.target.value as 'DOMESTIC' | 'INTERNATIONAL'
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="DOMESTIC">Domestic</option>
                  <option value="INTERNATIONAL">International</option>
                </select>
              </div>
              
              {branchForm.type === 'INTERNATIONAL' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                    <input
                      type="text"
                      value={branchForm.state}
                      onChange={(e) => setBranchForm({ ...branchForm, state: e.target.value })}
                      placeholder="e.g., California"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                    <select
                      value={branchForm.country}
                      onChange={(e) => setBranchForm({ ...branchForm, country: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

      {/* Branch Details Modal */}
      {showDetailsModal && selectedBranch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Building className="h-6 w-6 mr-2 text-blue-600" />
                Branch Details
              </h2>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedBranch(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Branch Name</label>
                    <p className="text-gray-900 font-medium">{selectedBranch.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Branch Code</label>
                    <p className="text-gray-900 font-medium">{selectedBranch.branchCode}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Region</label>
                    <p className="text-gray-900">{selectedBranch.region}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Branch Type</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedBranch.type === 'INTERNATIONAL' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {selectedBranch.type === 'INTERNATIONAL' ? 'International' : 'Domestic'}
                    </span>
                  </div>
                  {selectedBranch.type === 'INTERNATIONAL' && (
                    <>
                      {selectedBranch.state && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">State</label>
                          <p className="text-gray-900">{selectedBranch.state}</p>
                        </div>
                      )}
                      {selectedBranch.country && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Country</label>
                          <p className="text-gray-900">{selectedBranch.country}</p>
                        </div>
                      )}
                    </>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedBranch.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedBranch.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center">
                      <Users className="h-8 w-8 text-blue-600 bg-blue-100 rounded-lg p-2 mr-3" />
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{selectedBranch.userCount || 0}</p>
                        <p className="text-sm text-gray-600">Total Users</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center">
                      <UserCheck className="h-8 w-8 text-emerald-600 bg-emerald-100 rounded-lg p-2 mr-3" />
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{selectedBranch.managerCount || 0}</p>
                        <p className="text-sm text-gray-600">Managers</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center">
                      <Calendar className="h-8 w-8 text-indigo-600 bg-indigo-100 rounded-lg p-2 mr-3" />
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          {new Date(selectedBranch.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600">Created</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Branch Manager Information */}
              {selectedBranch.manager && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Branch Manager</h3>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {selectedBranch.manager.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{selectedBranch.manager.name}</p>
                        <p className="text-sm text-gray-500">{selectedBranch.manager.email}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Branch Users */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Branch Users ({selectedBranch.users?.length || 0})
                </h3>
                {selectedBranch.users && selectedBranch.users.length > 0 ? (
                  <div className="space-y-3">
                    {selectedBranch.users.map((user: BackendUser) => (
                      <div key={user.id} className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-indigo-600">
                                {user.name?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{user.name}</p>
                              <div className="flex items-center space-x-2 text-sm text-gray-500">
                                <Mail className="h-3 w-3" />
                                <span>{user.email}</span>
                              </div>
                              {user.phone && (
                                <div className="flex items-center space-x-2 text-sm text-gray-500">
                                  <Phone className="h-3 w-3" />
                                  <span>{user.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mb-1 ${
                              user.role === 'BRANCH_MANAGER' 
                                ? 'bg-purple-100 text-purple-800' 
                                : user.role === 'SALES_USER'
                                ? 'bg-green-100 text-green-800'
                                : user.role === 'BRANCH_APPROVER'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {user.role?.replace('_', ' ') || 'Unknown Role'}
                            </span>
                            <div className="flex items-center space-x-1">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                user.enabled === true 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {user.enabled ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No users assigned to this branch</p>
                  </div>
                )}
              </div> 

              {/* Recent Activity */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Branch Created</p>
                      <p className="text-xs text-gray-500">
                        {new Date(selectedBranch.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  {selectedBranch.updatedAt && selectedBranch.updatedAt !== selectedBranch.createdAt && (
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Last Updated</p>
                        <p className="text-xs text-gray-500">
                          {new Date(selectedBranch.updatedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  openEditModal(selectedBranch);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Branch
              </button>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedBranch(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchManagement;