'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Filter, Edit, Eye, Trash2, Target, QrCode, 
  TrendingUp, CheckCircle, Clock, Users, Store, Building 
} from 'lucide-react';
import { User, Campaign, Branch } from '../types';
import api from '../services/axiosInstance';
import { useToast } from '../hooks/use-toast';
import { useDebounce } from '../hooks/useDebounce';

// Utility function for handling API errors
const handleApiError = (error: any, defaultMessage: string): string => {
  console.error('API Error:', error);
  
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.message) {
    return error.message;
  }
  return defaultMessage;
};

// Backend Campaign interface matching the API response
interface BackendCampaign {
  id: number;
  name: string;
  description: string;
  sector: Campaign['sector'];
  status: Campaign['status'];
  startDate: string;
  endDate?: string;
  targetQRCount: number;
  allocatedQRCount: number;
  issuedQRCount: number;
  targetBranches: string[];
  notes?: string;
  isActive: boolean;
  utilizationRate: number;
  completionRate: number;
  createdByUserId: number;
  createdByUserName: string;
  createdByUserEmail: string;
  updatedByUserId?: number;
  updatedByUserName?: string;
  createdAt: string;
  updatedAt?: string;
}

// Paginated response interface matching the API response
interface PaginatedCampaignResponse {
  content: BackendCampaign[];
  pageInfo: {
    pageNumber: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// Campaign statistics interface
interface CampaignStatsDto {
  totalCampaigns: number;
  activeCampaigns: number;
  completedCampaigns: number;
  totalTargetQRs: number;
  totalIssuedQRs: number;
}

interface CampaignManagementProps {
  user: User;
}

const CampaignManagement: React.FC<CampaignManagementProps> = ({ user }) => {
  // State management
  const [campaignsData, setCampaignsData] = useState<PaginatedCampaignResponse | null>(null);
  const [campaignStats, setCampaignStats] = useState<CampaignStatsDto | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  // Filter and search state
  const [filters, setFilters] = useState({ search: '', sector: '', status: '' });
  const debouncedSearch = useDebounce(filters.search, 500);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<BackendCampaign | null>(null);
  
  // Form state
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    description: '',
    sector: 'RETAIL' as Campaign['sector'],
    startDate: '',
    endDate: '',
    targetQRCount: 100,
    targetBranches: [] as string[],
    notes: ''
  });
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);

  const { toast } = useToast();
  const canManageCampaigns = user.role === 'SUPER_ADMIN' || user.role === 'BRANCH_MANAGER';

  useEffect(() => {
    if (canManageCampaigns) {
      fetchCampaigns();
      fetchCampaignStats();
      fetchBranches();
    }
  }, [canManageCampaigns, currentPage, pageSize, sortBy, sortDir, debouncedSearch, filters.sector, filters.status]);

  // Fetch campaigns from backend with pagination
  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      
      const response = await api.get('/campaigns/paginated', {
        params: {
          page: currentPage,
          size: pageSize,
          sortBy,
          sortDir,
          ...(debouncedSearch && { q: debouncedSearch }),
          ...(filters.sector && { sector: filters.sector }),
          ...(filters.status && { status: filters.status })
        }
      });
      
      console.log('Paginated API Response:', response.data);
      
      // Handle ApiResponse wrapper structure
      if (response.data && response.data.success && response.data.data) {
        const paginatedData = response.data.data;
        console.log('Paginated campaigns:', paginatedData);
        
        setCampaignsData(paginatedData);
      } else {
        console.warn('Unexpected response structure:', response.data);
        setCampaignsData(null);
      }
    } catch (error: any) {
      console.error('Error fetching campaigns:', error);
      const errorMessage = handleApiError(error, 'Failed to load campaigns');
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      setCampaignsData(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch campaign statistics
  const fetchCampaignStats = async () => {
    try {
      const response = await api.get('/campaigns/statistics');
      
      if (response.data && response.data.success && response.data.data) {
        setCampaignStats(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching campaign stats:', error);
      const errorMessage = handleApiError(error, 'Failed to load campaign statistics');
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Fetch branches
  const fetchBranches = async () => {
    try {
      const response = await api.get('/branches');
      
      if (response.data && response.data.success && response.data.data) {
        setBranches(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching branches:', error);
      const errorMessage = handleApiError(error, 'Failed to load branches');
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Campaigns are already filtered and paginated from server
  const filteredCampaigns = campaignsData?.content || [];

  // Create campaign
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    
    try {
      const createData = {
        name: campaignForm.name,
        description: campaignForm.description,
        sector: campaignForm.sector,
        startDate: new Date(campaignForm.startDate).toISOString(),
        endDate: campaignForm.endDate ? new Date(campaignForm.endDate).toISOString() : null,
        targetQRCount: campaignForm.targetQRCount,
        targetBranches: campaignForm.targetBranches,
        notes: campaignForm.notes
      };

      const response = await api.post('/campaigns', createData);
      
      if (response.status === 201) {
        toast({
          title: "Success",
          description: 'Campaign created successfully',
        });
        setShowCreateModal(false);
        resetForm();
        fetchCampaigns();
      }
    } catch (error: any) {
      const errorMessage = handleApiError(error, 'Failed to create campaign');
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  // Update campaign
  const handleUpdateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign) return;
    
    setUpdating(true);
    try {
      const updateData = {
        name: campaignForm.name,
        description: campaignForm.description,
        sector: campaignForm.sector,
        startDate: new Date(campaignForm.startDate).toISOString(),
        endDate: campaignForm.endDate ? new Date(campaignForm.endDate).toISOString() : null,
        targetQRCount: campaignForm.targetQRCount,
        targetBranches: campaignForm.targetBranches,
        notes: campaignForm.notes
      };

      const response = await api.put(`/campaigns/${selectedCampaign.id}`, updateData);
      
      if (response.status === 200) {
        toast({
          title: "Success",
          description: 'Campaign updated successfully',
        });
        setShowEditModal(false);
        setSelectedCampaign(null);
        resetForm();
        fetchCampaigns();
      }
    } catch (error: any) {
      const errorMessage = handleApiError(error, 'Failed to update campaign');
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setCampaignForm({
      name: '',
      description: '',
      sector: 'RETAIL',
      startDate: '',
      endDate: '',
      targetQRCount: 100,
      targetBranches: [],
      notes: ''
    });
  };

  // Open edit modal
  const openEditModal = (campaign: BackendCampaign) => {
    setSelectedCampaign(campaign);
    setCampaignForm({
      name: campaign.name,
      description: campaign.description,
      sector: campaign.sector,
      startDate: campaign.startDate.split('T')[0],
      endDate: campaign.endDate ? campaign.endDate.split('T')[0] : '',
      targetQRCount: campaign.targetQRCount,
      targetBranches: campaign.targetBranches,
      notes: campaign.notes || ''
    });
    setShowEditModal(true);
  };

  // Open detail modal
  const openDetailModal = (campaign: BackendCampaign) => {
    setSelectedCampaign(campaign);
    setShowDetailModal(true);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      inactive: 'bg-gray-100 text-gray-800 border-gray-200',
      completed: 'bg-blue-100 text-blue-800 border-blue-200',
      draft: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    
    const icons = {
      active: CheckCircle,
      inactive: Clock,
      completed: Target,
      draft: Edit
    };
    
    const Icon = icons[status as keyof typeof icons];
    
    return (
      <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full border ${styles[status as keyof typeof styles]}`}>
        <Icon className="h-3 w-3" />
        <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
      </span>
    );
  };

  const getSectorIcon = (sector: string) => {
    const icons = {
      retail: Store,
      hotel: Building,
      educational: Users,
      clothing: Store,
      food_beverage: Store,
      healthcare: CheckCircle,
      automotive: Target,
      services: Users,
      other: Target
    };
    
    return icons[sector as keyof typeof icons] || Target;
  };

  const getSectorColor = (sector: string) => {
    const colors = {
      retail: 'blue',
      hotel: 'purple',
      educational: 'green',
      clothing: 'pink',
      food_beverage: 'orange',
      healthcare: 'red',
      automotive: 'indigo',
      services: 'teal',
      other: 'gray'
    };
    
    return colors[sector as keyof typeof colors] || 'gray';
  };

  const getBranchNames = (branchIds: string[]) => {
    return branchIds.map(id => {
      const branch = branches.find(b => b.id === id);
      return branch ? branch.name : 'Unknown';
    }).join(', ');
  };

  const uniqueSectors = [...new Set(filteredCampaigns.map(c => c.sector))];

  if (!canManageCampaigns) {
    return (
      <div className="text-center py-12">
        <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">You don't have permission to manage campaigns.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campaign Management</h1>
          <p className="text-gray-600">Create and manage sector-specific QR code campaigns</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800"
        >
          <Plus className="h-4 w-4" />
          <span>Create Campaign</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <Target className="h-8 w-8 text-purple-600 bg-purple-100 rounded-lg p-2" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{campaignStats?.totalCampaigns || 0}</p>
              <p className="text-sm text-gray-600">Total Campaigns</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-8 w-8 text-emerald-600 bg-emerald-100 rounded-lg p-2" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{campaignStats?.activeCampaigns || 0}</p>
              <p className="text-sm text-gray-600">Active Campaigns</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <QrCode className="h-8 w-8 text-blue-600 bg-blue-100 rounded-lg p-2" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{campaignStats?.totalTargetQRs || 0}</p>
              <p className="text-sm text-gray-600">QRs in Campaigns</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <TrendingUp className="h-8 w-8 text-indigo-600 bg-indigo-100 rounded-lg p-2" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {campaignStats?.totalTargetQRs && campaignStats?.totalIssuedQRs 
                  ? Math.round((campaignStats.totalIssuedQRs / campaignStats.totalTargetQRs) * 100)
                  : 0}%
              </p>
              <p className="text-sm text-gray-600">Avg Utilization</p>
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
                placeholder="Search campaigns..."
                value={filters.search}
                onChange={(e) => {
                  setFilters({ ...filters, search: e.target.value });
                  setCurrentPage(0); // Reset to first page when search changes
                }}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
              />
            </div>
          </div>
          <select
            value={filters.sector}
            onChange={(e) => {
              setFilters({ ...filters, sector: e.target.value });
              setCurrentPage(0); // Reset to first page when filter changes
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Sectors</option>
            {uniqueSectors.map(sector => (
              <option key={sector} value={sector}>
                {sector.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(e) => {
              setFilters({ ...filters, status: e.target.value });
              setCurrentPage(0); // Reset to first page when filter changes
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="COMPLETED">Completed</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Campaigns Grid */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading campaigns...</p>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="p-8 text-center">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns found</h3>
            <p className="text-gray-500">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {filteredCampaigns.map((campaign) => {
                const SectorIcon = getSectorIcon(campaign.sector);
                const sectorColor = getSectorColor(campaign.sector);
                
                return (
                  <div key={campaign.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <SectorIcon className={`h-8 w-8 text-${sectorColor}-600 bg-${sectorColor}-100 rounded-lg p-2`} />
                        <div>
                          <h3 className="font-semibold text-gray-900">{campaign.name}</h3>
                          <p className="text-sm text-gray-500">{campaign.sector.replace('_', ' ').toUpperCase()}</p>
                        </div>
                      </div>
                      {getStatusBadge(campaign.status.toLowerCase())}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{campaign.description}</p>
                    
                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{campaign.issuedQRCount}/{campaign.targetQRCount}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full" 
                          style={{ width: `${Math.min((campaign.issuedQRCount / campaign.targetQRCount) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Utilization:</span>
                        <span className="font-medium">{campaign.utilizationRate?.toFixed(1) || 0}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Target Branches:</span>
                        <span className="font-medium">{campaign.targetBranches.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Created:</span>
                        <span className="font-medium">{new Date(campaign.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openDetailModal(campaign)}
                        className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                      >
                        <Eye className="h-4 w-4" />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => openEditModal(campaign)}
                        className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
                      >
                        <Edit className="h-4 w-4" />
                        <span>Edit</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {campaignsData && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-700">
                      Showing {campaignsData.pageInfo.pageNumber * campaignsData.pageInfo.pageSize + 1} to{' '}
                      {Math.min((campaignsData.pageInfo.pageNumber + 1) * campaignsData.pageInfo.pageSize, campaignsData.pageInfo.totalElements)} of{' '}
                      {campaignsData.pageInfo.totalElements} campaigns
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(0);
                      }}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      <option value={5}>5 per page</option>
                      <option value={10}>10 per page</option>
                      <option value={20}>20 per page</option>
                      <option value={50}>50 per page</option>
                    </select>
                    
                    <button
                      onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                      disabled={campaignsData.pageInfo.first}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    <span className="text-sm text-gray-700">
                      Page {campaignsData.pageInfo.pageNumber + 1} of {campaignsData.pageInfo.totalPages}
                    </span>
                    
                    <button
                      onClick={() => setCurrentPage(Math.min(campaignsData.pageInfo.totalPages - 1, currentPage + 1))}
                      disabled={campaignsData.pageInfo.last}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Campaign</h2>
            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Name</label>
                <input
                  type="text"
                  value={campaignForm.name}
                  onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                  placeholder="e.g., Retail Expansion Q1 2024"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={campaignForm.description}
                  onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })}
                  rows={3}
                  placeholder="Describe the campaign objectives and target merchants..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Sector</label>
                <select
                  value={campaignForm.sector}
                  onChange={(e) => setCampaignForm({ ...campaignForm, sector: e.target.value as Campaign['sector'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="retail">Retail</option>
                  <option value="hotel">Hotel & Hospitality</option>
                  <option value="educational">Educational Institutes</option>
                  <option value="clothing">Clothing & Fashion</option>
                  <option value="food_beverage">Food & Beverage</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="automotive">Automotive</option>
                  <option value="services">Services</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={campaignForm.startDate}
                    onChange={(e) => setCampaignForm({ ...campaignForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date (Optional)</label>
                  <input
                    type="date"
                    value={campaignForm.endDate}
                    onChange={(e) => setCampaignForm({ ...campaignForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target QR Count</label>
                <input
                  type="number"
                  value={campaignForm.targetQRCount}
                  onChange={(e) => setCampaignForm({ ...campaignForm, targetQRCount: Number(e.target.value) })}
                  min="1"
                  max="1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Branches</label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {branches.map(branch => (
                    <label key={branch.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={campaignForm.targetBranches.includes(branch.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCampaignForm({
                              ...campaignForm,
                              targetBranches: [...campaignForm.targetBranches, branch.id]
                            });
                          } else {
                            setCampaignForm({
                              ...campaignForm,
                              targetBranches: campaignForm.targetBranches.filter(id => id !== branch.id)
                            });
                          }
                        }}
                        className="mr-2 rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">{branch.name}</span>
                    </label>
                  ))}
                </div>
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
                  className="flex-1 px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Campaign Modal */}
      {showEditModal && selectedCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Campaign</h2>
            <form onSubmit={handleUpdateCampaign} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Name</label>
                <input
                  type="text"
                  value={campaignForm.name}
                  onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={campaignForm.description}
                  onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Sector</label>
                <select
                  value={campaignForm.sector}
                  onChange={(e) => setCampaignForm({ ...campaignForm, sector: e.target.value as Campaign['sector'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="retail">Retail</option>
                  <option value="hotel">Hotel & Hospitality</option>
                  <option value="educational">Educational Institutes</option>
                  <option value="clothing">Clothing & Fashion</option>
                  <option value="food_beverage">Food & Beverage</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="automotive">Automotive</option>
                  <option value="services">Services</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={campaignForm.startDate}
                    onChange={(e) => setCampaignForm({ ...campaignForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date (Optional)</label>
                  <input
                    type="date"
                    value={campaignForm.endDate}
                    onChange={(e) => setCampaignForm({ ...campaignForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target QR Count</label>
                <input
                  type="number"
                  value={campaignForm.targetQRCount}
                  onChange={(e) => setCampaignForm({ ...campaignForm, targetQRCount: Number(e.target.value) })}
                  min="1"
                  max="1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Branches</label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {branches.map(branch => (
                    <label key={branch.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={campaignForm.targetBranches.includes(branch.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCampaignForm({
                              ...campaignForm,
                              targetBranches: [...campaignForm.targetBranches, branch.id]
                            });
                          } else {
                            setCampaignForm({
                              ...campaignForm,
                              targetBranches: campaignForm.targetBranches.filter(id => id !== branch.id)
                            });
                          }
                        }}
                        className="mr-2 rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">{branch.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedCampaign(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 disabled:opacity-50"
                >
                  {updating ? 'Updating...' : 'Update Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Campaign Detail Modal */}
      {showDetailModal && selectedCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">{selectedCampaign.name}</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Campaign Info */}
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Campaign Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sector:</span>
                      <span className="font-medium capitalize">{selectedCampaign.sector.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      {getStatusBadge(selectedCampaign.status)}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Start Date:</span>
                      <span className="font-medium">{new Date(selectedCampaign.startDate).toLocaleDateString()}</span>
                    </div>
                    {selectedCampaign.endDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">End Date:</span>
                        <span className="font-medium">{new Date(selectedCampaign.endDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Target Branches:</span>
                      <span className="font-medium">{getBranchNames(selectedCampaign.targetBranches)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Performance Metrics</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Target QRs:</span>
                      <span className="font-medium">{selectedCampaign.targetQRCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Allocated:</span>
                      <span className="font-medium">{selectedCampaign.allocatedQRCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Issued:</span>
                      <span className="font-medium">{selectedCampaign.issuedQRCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Progress:</span>
                      <span className="font-medium">
                        {Math.round((selectedCampaign.issuedQRCount / selectedCampaign.targetQRCount) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Campaign Description */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                  <p className="text-sm text-gray-600">{selectedCampaign.description}</p>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Campaign Timeline</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                      <span className="text-sm text-gray-700">
                        Created: {new Date(selectedCampaign.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      <span className="text-sm text-gray-700">
                        Started: {new Date(selectedCampaign.startDate).toLocaleDateString()}
                      </span>
                    </div>
                    {selectedCampaign.endDate && (
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                        <span className="text-sm text-gray-700">
                          Ends: {new Date(selectedCampaign.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
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

export default CampaignManagement;