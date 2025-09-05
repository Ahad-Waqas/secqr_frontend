'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash, 
  Store, 
  CheckCircle, 
  Clock, 
  XCircle, 
  QrCode,
  FileText,
  MapPin,
  Phone,
  Mail,
  Calendar
} from 'lucide-react';
import { Merchant, User, KYCRequest, MerchantRequest } from '@/types';
import { merchantApiService } from '@/services/merchant-api';
import { kycApiService } from '@/services/kyc-api';
import { useDebounce } from '@/hooks/useDebounce';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface MerchantManagementProps {
  user: User;
}

interface PaginatedMerchantResponse {
  content: Merchant[];
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

interface MerchantStats {
  totalMerchants: number;
  verifiedMerchants: number;
  pendingKYC: number;
  rejectedKYC: number;
}

const MerchantManagement: React.FC<MerchantManagementProps> = ({ user }) => {
  const [merchantsData, setMerchantsData] = useState<PaginatedMerchantResponse | null>(null);
  const [stats, setStats] = useState<MerchantStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  
  // Filter and search state
  const [filters, setFilters] = useState({ search: '', kycStatus: '' });
  const debouncedSearch = useDebounce(filters.search, 500);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  
  // Create merchant form
  const [merchantForm, setMerchantForm] = useState({
    legalName: '',
    shopName: '',
    address: '',
    phone: '',
    email: ''
  });
  const [creating, setCreating] = useState(false);
  
  // KYC request form
  const [kycForm, setKYCForm] = useState({
    businessLicense: '',
    taxCertificate: '',
    bankStatement: '',
    ownershipProof: '',
    additionalNotes: ''
  });
  const [submittingKYC, setSubmittingKYC] = useState(false);

  const isSalesUser = user.role === 'SALES_USER';
  const isBranchManager = user.role === 'BRANCH_MANAGER';
  const isAdmin = user.role === 'SUPER_ADMIN';

  // Fetch merchants from backend with pagination
  const fetchMerchants = async () => {
    try {
      setLoading(true);
      
      const response = await merchantApiService.getMerchants({
        page: currentPage,
        size: pageSize,
        sortBy,
        sortDir,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(filters.kycStatus && { kycStatus: filters.kycStatus })
      });
      
      setMerchantsData(response);
    } catch (error) {
      console.error('Failed to load merchants:', error);
      setMerchantsData(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch merchant statistics
  const fetchStats = async () => {
    try {
      const statsData = await merchantApiService.getMerchantStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load merchant stats:', error);
    }
  };

  useEffect(() => {
    fetchMerchants();
  }, [currentPage, pageSize, sortBy, sortDir, debouncedSearch, filters.kycStatus]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleCreateMerchant = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    
    try {
      await merchantApiService.createMerchant(merchantForm);
      setShowCreateModal(false);
      resetMerchantForm();
      fetchMerchants();
      fetchStats();
    } catch (error) {
      console.error('Failed to create merchant:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleSubmitKYC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMerchant) return;
    
    setSubmittingKYC(true);
    try {
      await kycApiService.createKYCRequest({
        merchantId: selectedMerchant.id,
        businessLicense: kycForm.businessLicense,
        taxCertificate: kycForm.taxCertificate,
        bankStatement: kycForm.bankStatement,
        ownershipProof: kycForm.ownershipProof,
        additionalNotes: kycForm.additionalNotes || undefined
      });
      
      setShowKYCModal(false);
      setSelectedMerchant(null);
      resetKYCForm();
      fetchMerchants();
    } catch (error) {
      console.error('Failed to submit KYC request:', error);
      alert(error instanceof Error ? error.message : 'Failed to submit KYC request');
    } finally {
      setSubmittingKYC(false);
    }
  };

  const handleDeleteMerchant = async (merchantId: number) => {
    if (!confirm('Are you sure you want to delete this merchant?')) return;
    
    try {
      await merchantApiService.deleteMerchant(merchantId);
      fetchMerchants();
      fetchStats();
    } catch (error) {
      console.error('Failed to delete merchant:', error);
    }
  };

  const resetMerchantForm = () => {
    setMerchantForm({
      legalName: '',
      shopName: '',
      address: '',
      phone: '',
      email: ''
    });
  };
  
  const resetKYCForm = () => {
    setKYCForm({
      businessLicense: '',
      taxCertificate: '',
      bankStatement: '',
      ownershipProof: '',
      additionalNotes: ''
    });
  };

  const getKYCStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      verified: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      rejected: 'bg-red-100 text-red-800 border-red-200'
    };
    
    const icons = {
      pending: Clock,
      verified: CheckCircle,
      rejected: XCircle
    };
    
    const Icon = icons[status as keyof typeof icons];
    
    return (
      <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full border ${styles[status as keyof typeof styles]}`}>
        <Icon className="h-3 w-3" />
        <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
      </span>
    );
  };

  // Handle page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Generate page numbers for pagination
  const generatePageNumbers = () => {
    if (!merchantsData?.pageInfo) return [];
    
    const { pageNumber, totalPages } = merchantsData.pageInfo;
    const pages = [];
    const maxVisible = 5;
    
    let start = Math.max(0, pageNumber - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages - 1, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(0, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  const filteredMerchants = merchantsData?.content || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Merchant Management</h1>
          <p className="text-gray-600">Manage merchants and their KYC verification status</p>
        </div>
        {(isSalesUser || isBranchManager) && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800"
          >
            <Plus className="h-4 w-4" />
            <span>Add Merchant</span>
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <Store className="h-8 w-8 text-blue-600 bg-blue-100 rounded-lg p-2" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalMerchants || 0}</p>
              <p className="text-sm text-gray-600">Total Merchants</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-8 w-8 text-emerald-600 bg-emerald-100 rounded-lg p-2" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.verifiedMerchants || 0}</p>
              <p className="text-sm text-gray-600">KYC Verified</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <Clock className="h-8 w-8 text-amber-600 bg-amber-100 rounded-lg p-2" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.pendingKYC || 0}</p>
              <p className="text-sm text-gray-600">Pending KYC</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <XCircle className="h-8 w-8 text-red-600 bg-red-100 rounded-lg p-2" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.rejectedKYC || 0}</p>
              <p className="text-sm text-gray-600">Rejected KYC</p>
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
                placeholder="Search merchants..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
              />
            </div>
          </div>
          <select
            value={filters.kycStatus}
            onChange={(e) => setFilters({ ...filters, kycStatus: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All KYC Status</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Merchants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredMerchants.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Store className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No merchants found</h3>
            <p className="text-gray-600">No merchants match your current filters.</p>
          </div>
        ) : (
          filteredMerchants.map((merchant) => (
            <div key={merchant.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{merchant.shopName}</h3>
                  <p className="text-sm text-gray-600 mb-2">{merchant.legalName}</p>
                  {getKYCStatusBadge(merchant.kycStatus)}
                </div>
                <div className="flex space-x-2">
                  {merchant.kycStatus === 'pending' && (
                    <button
                      onClick={() => {
                        setSelectedMerchant(merchant);
                        setShowKYCModal(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Submit KYC"
                    >
                      <FileText className="h-4 w-4" />
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteMerchant(merchant.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Delete merchant"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span className="truncate">{merchant.address}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>{merchant.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{merchant.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Created {new Date(merchant.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {merchantsData && merchantsData.pageInfo && merchantsData.pageInfo.totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (!merchantsData.pageInfo.first) {
                      handlePageChange(currentPage - 1);
                    }
                  }}
                  className={merchantsData.pageInfo.first ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              
              {generatePageNumbers().map((pageNum) => (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(pageNum);
                    }}
                    isActive={pageNum === currentPage}
                  >
                    {pageNum + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (!merchantsData.pageInfo.last) {
                      handlePageChange(currentPage + 1);
                    }
                  }}
                  className={merchantsData.pageInfo.last ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Create Merchant Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Merchant</h2>
            <form onSubmit={handleCreateMerchant} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Legal Name</label>
                <input
                  type="text"
                  value={merchantForm.legalName}
                  onChange={(e) => setMerchantForm({ ...merchantForm, legalName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name</label>
                <input
                  type="text"
                  value={merchantForm.shopName}
                  onChange={(e) => setMerchantForm({ ...merchantForm, shopName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  value={merchantForm.address}
                  onChange={(e) => setMerchantForm({ ...merchantForm, address: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={merchantForm.phone}
                  onChange={(e) => setMerchantForm({ ...merchantForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={merchantForm.email}
                  onChange={(e) => setMerchantForm({ ...merchantForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetMerchantForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Merchant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submit KYC Modal */}
      {showKYCModal && selectedMerchant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Submit KYC for {selectedMerchant.shopName}
            </h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-700">
                Please provide all required documents for KYC verification.
              </p>
            </div>
            
            <form onSubmit={handleSubmitKYC} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business License</label>
                <input
                  type="text"
                  value={kycForm.businessLicense}
                  onChange={(e) => setKYCForm({ ...kycForm, businessLicense: e.target.value })}
                  placeholder="Document reference or upload link"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tax Certificate</label>
                <input
                  type="text"
                  value={kycForm.taxCertificate}
                  onChange={(e) => setKYCForm({ ...kycForm, taxCertificate: e.target.value })}
                  placeholder="Document reference or upload link"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Statement</label>
                <input
                  type="text"
                  value={kycForm.bankStatement}
                  onChange={(e) => setKYCForm({ ...kycForm, bankStatement: e.target.value })}
                  placeholder="Document reference or upload link"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ownership Proof</label>
                <input
                  type="text"
                  value={kycForm.ownershipProof}
                  onChange={(e) => setKYCForm({ ...kycForm, ownershipProof: e.target.value })}
                  placeholder="Document reference or upload link"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                <textarea
                  value={kycForm.additionalNotes}
                  onChange={(e) => setKYCForm({ ...kycForm, additionalNotes: e.target.value })}
                  rows={3}
                  placeholder="Any additional information..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowKYCModal(false);
                    setSelectedMerchant(null);
                    resetKYCForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingKYC}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submittingKYC ? 'Submitting...' : 'Submit KYC'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MerchantManagement;
