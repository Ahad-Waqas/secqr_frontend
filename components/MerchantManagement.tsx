import React, { useState, useEffect } from 'react';
import { 
  Store, Plus, Search, MapPin, Phone, Mail, FileText,
  Calendar, CheckCircle, Clock, XCircle, QrCode, Send, Trash2
} from 'lucide-react';
import { User, Merchant, MerchantRequest, KYCRequest } from '../types';
import { apiService } from '../services/api';

interface MerchantManagementProps {
  user: User;
}

const MerchantManagement: React.FC<MerchantManagementProps> = ({ user }) => {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [merchantRequests, setMerchantRequests] = useState<MerchantRequest[]>([]);
  const [kycRequests, setKYCRequests] = useState<KYCRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [showKYCReviewModal, setShowKYCReviewModal] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [selectedKYCRequest, setSelectedKYCRequest] = useState<KYCRequest | null>(null);
  const [filters, setFilters] = useState({ search: '', kycStatus: '' });
  
  // Create merchant form
  const [merchantForm, setMerchantForm] = useState({
    legalName: '',
    shopName: '',
    address: '',
    phone: '',
    email: ''
  });
  const [creating, setCreating] = useState(false);
  
  // QR request form
  const [requestForm, setRequestForm] = useState({
    requestedQrCount: 1,
    businessJustification: ''
  });
  const [requesting, setRequesting] = useState(false);
  
  // KYC request form
  const [kycForm, setKYCForm] = useState({
    businessLicense: '',
    taxCertificate: '',
    bankStatement: '',
    ownershipProof: '',
    additionalNotes: ''
  });
  const [submittingKYC, setSubmittingKYC] = useState(false);
  
  // KYC review form
  const [kycReviewForm, setKYCReviewForm] = useState({
    action: 'approve' as 'approve' | 'reject',
    notes: ''
  });
  const [reviewingKYC, setReviewingKYC] = useState(false);

  const isSalesUser = user.role === 'sales_user';
  const isBranchManager = user.role === 'branch_manager';
  const isAdmin = user.role === 'system_admin';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [merchantsData, requestsData] = await Promise.all([
        apiService.getMerchants(user.branchId),
        apiService.getMerchantQRRequests(isBranchManager || isAdmin ? undefined : user.branchId),
      ]);
      
      setMerchants(merchantsData);
      setMerchantRequests(requestsData);
      
      // Load KYC requests for branch approvers and managers
      if (user.role === 'branch_approver' || isBranchManager || isAdmin) {
        const kycData = await apiService.getKYCRequests(isBranchManager || isAdmin ? undefined : user.branchId);
        setKYCRequests(kycData);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMerchant = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    
    try {
      await apiService.createMerchant(merchantForm);
      setShowCreateModal(false);
      resetMerchantForm();
      loadData();
    } catch (error) {
      console.error('Failed to create merchant:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleRequestQRs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMerchant) return;
    
    setRequesting(true);
    try {
      await apiService.createMerchantQRRequest({
        merchantId: selectedMerchant.id,
        requestedQrCount: requestForm.requestedQrCount,
        businessJustification: requestForm.businessJustification
      });
      
      setShowRequestModal(false);
      setSelectedMerchant(null);
      resetRequestForm();
      loadData();
    } catch (error) {
      console.error('Failed to create QR request:', error);
    } finally {
      setRequesting(false);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      await apiService.approveMerchantQRRequest(requestId);
      loadData();
    } catch (error) {
      console.error('Failed to approve request:', error);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;
    
    try {
      await apiService.rejectMerchantQRRequest(requestId, reason);
      loadData();
    } catch (error) {
      console.error('Failed to reject request:', error);
    }
  };

  const handleSubmitKYC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMerchant) return;
    
    setSubmittingKYC(true);
    try {
      await apiService.createKYCRequest({
        merchantId: selectedMerchant.id,
        documents: {
          businessLicense: kycForm.businessLicense,
          taxCertificate: kycForm.taxCertificate,
          bankStatement: kycForm.bankStatement,
          ownershipProof: kycForm.ownershipProof,
          additionalDocs: kycForm.additionalNotes ? [kycForm.additionalNotes] : []
        }
      });
      
      setShowKYCModal(false);
      setSelectedMerchant(null);
      resetKYCForm();
      loadData();
    } catch (error) {
      console.error('Failed to submit KYC request:', error);
      alert(error instanceof Error ? error.message : 'Failed to submit KYC request');
    } finally {
      setSubmittingKYC(false);
    }
  };

  const handleKYCReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKYCRequest) return;
    
    setReviewingKYC(true);
    try {
      if (kycReviewForm.action === 'approve') {
        await apiService.approveKYCRequest(selectedKYCRequest.id, kycReviewForm.notes);
      } else {
        await apiService.rejectKYCRequest(selectedKYCRequest.id, kycReviewForm.notes);
      }
      
      setShowKYCReviewModal(false);
      setSelectedKYCRequest(null);
      resetKYCReviewForm();
      loadData();
    } catch (error) {
      console.error('Failed to review KYC request:', error);
    } finally {
      setReviewingKYC(false);
    }
  };

  const handleDeleteMerchant = async (merchantId: string) => {
    if (!confirm('Are you sure you want to delete this merchant?')) return;
    
    try {
      await apiService.deleteMerchant(merchantId);
      loadData();
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

  const resetRequestForm = () => {
    setRequestForm({
      requestedQrCount: 1,
      businessJustification: ''
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
  
  const resetKYCReviewForm = () => {
    setKYCReviewForm({
      action: 'approve',
      notes: ''
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

  const getRequestStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      rejected: 'bg-red-100 text-red-800 border-red-200'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[status as keyof typeof styles]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getMerchantName = (merchantId: string) => {
    const merchant = merchants.find(m => m.id === merchantId);
    return merchant ? merchant.shopName : 'Unknown Merchant';
  };

  const filteredMerchants = merchants.filter(merchant => {
    const matchesSearch = !filters.search || 
      merchant.shopName.toLowerCase().includes(filters.search.toLowerCase()) ||
      merchant.legalName.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesKYC = !filters.kycStatus || merchant.kycStatus === filters.kycStatus;
    
    return matchesSearch && matchesKYC;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Merchant Management</h1>
          <p className="text-gray-600">
            {isSalesUser ? 'Create merchants and request QR codes' : 'Manage merchants and QR requests'}
          </p>
        </div>
        {(isSalesUser || isBranchManager) && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800"
          >
            <Plus className="h-4 w-4" />
            <span>Create Merchant</span>
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <Store className="h-8 w-8 text-blue-600 bg-blue-100 rounded-lg p-2" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{merchants.length}</p>
              <p className="text-sm text-gray-600">Total Merchants</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-8 w-8 text-emerald-600 bg-emerald-100 rounded-lg p-2" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {merchants.filter(m => m.kycStatus === 'verified').length}
              </p>
              <p className="text-sm text-gray-600">KYC Verified</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <Clock className="h-8 w-8 text-amber-600 bg-amber-100 rounded-lg p-2" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {merchantRequests.filter(r => r.status === 'pending').length + kycRequests.filter(r => r.status === 'pending').length}
              </p>
              <p className="text-sm text-gray-600">Pending Requests & KYC</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <QrCode className="h-8 w-8 text-indigo-600 bg-indigo-100 rounded-lg p-2" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {merchantRequests.filter(r => r.status === 'approved').reduce((acc, r) => acc + r.requestedQrCount, 0)}
              </p>
              <p className="text-sm text-gray-600">QRs Requested</p>
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
        ) : (
          filteredMerchants.map((merchant) => (
            <div key={merchant.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Store className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{merchant.shopName}</h3>
                    <p className="text-sm text-gray-500">{merchant.legalName}</p>
                  </div>
                </div>
                {getKYCStatusBadge(merchant.kycStatus)}
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span className="truncate">{merchant.address}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>{merchant.phone}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{merchant.email}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span>Created {new Date(merchant.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="flex space-x-2">
                {(isSalesUser || isBranchManager) && (
                  <>
                    {merchant.kycStatus === 'pending' && (
                      <button
                        onClick={() => {
                          setSelectedMerchant(merchant);
                          setShowKYCModal(true);
                        }}
                        className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm"
                      >
                        <FileText className="h-4 w-4" />
                        <span>Submit KYC</span>
                      </button>
                    )}
                  <button
                    onClick={() => {
                      if (merchant.kycStatus === 'verified') {
                        setSelectedMerchant(merchant);
                        setShowRequestModal(true);
                      } else {
                        alert(`Cannot request QRs for merchant with KYC status: ${merchant.kycStatus}. KYC must be verified first.`);
                      }
                    }}
                    className={`flex-1 flex items-center justify-center space-x-1 px-3 py-2 rounded-lg text-sm ${
                      merchant.kycStatus === 'verified'
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                    disabled={merchant.kycStatus !== 'verified'}
                  >
                    <Send className="h-4 w-4" />
                    <span>
                      {merchant.kycStatus === 'verified' ? 'Request QRs' : `KYC ${merchant.kycStatus}`}
                    </span>
                  </button>
                  </>
                )}
                
                {isAdmin && (
                  <button
                    onClick={() => handleDeleteMerchant(merchant.id)}
                    className="flex items-center space-x-1 px-3 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 text-sm"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* QR Requests */}
      {merchantRequests.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-medium text-gray-900">QR Code Requests</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {merchantRequests.map((request) => (
              <div key={request.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-sm font-medium text-gray-900">
                        {getMerchantName(request.merchantId)}
                      </h3>
                      {getRequestStatusBadge(request.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Requested QRs:</span> {request.requestedQrCount}
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Created:</span> {new Date(request.createdAt).toLocaleDateString()}
                      </div>
                      {request.approvedAt && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Approved:</span> {new Date(request.approvedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Justification:</span> {request.businessJustification}
                    </p>
                    
                    {request.rejectionReason && (
                      <p className="text-sm text-red-600">
                        <span className="font-medium">Rejection Reason:</span> {request.rejectionReason}
                      </p>
                    )}
                  </div>
                  
                  {(isBranchManager || isAdmin) && request.status === 'pending' && (
                    <div className="ml-6 flex space-x-2">
                      <button
                        onClick={() => handleRejectRequest(request.id)}
                        className="px-3 py-1 text-sm border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApproveRequest(request.id)}
                        className="px-3 py-1 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                      >
                        Approve
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KYC Requests Section */}
      {(user.role === 'branch_approver' || isBranchManager || isAdmin) && kycRequests.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-medium text-gray-900">KYC Verification Requests</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {kycRequests.map((request) => {
              const merchant = merchants.find(m => m.id === request.merchantId);
              return (
                <div key={request.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-sm font-medium text-gray-900">
                          {merchant?.shopName || 'Unknown Merchant'}
                        </h3>
                        {getRequestStatusBadge(request.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Legal Name:</span> {merchant?.legalName}
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Submitted:</span> {new Date(request.createdAt).toLocaleDateString()}
                        </div>
                        {request.reviewedAt && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Reviewed:</span> {new Date(request.reviewedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Documents:</span>
                        <div className="mt-1 space-x-2">
                          {request.documents.businessLicense && <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">Business License</span>}
                          {request.documents.taxCertificate && <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Tax Certificate</span>}
                          {request.documents.bankStatement && <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">Bank Statement</span>}
                          {request.documents.ownershipProof && <span className="inline-block px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">Ownership Proof</span>}
                        </div>
                      </div>
                      
                      {request.reviewNotes && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Review Notes:</span> {request.reviewNotes}
                        </p>
                      )}
                    </div>
                    
                    {user.role === 'branch_approver' && request.status === 'pending' && (
                      <div className="ml-6 flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedKYCRequest(request);
                            setShowKYCReviewModal(true);
                          }}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Review KYC
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create Merchant Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Merchant</h2>
            <form onSubmit={handleCreateMerchant} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Legal Name</label>
                <input
                  type="text"
                  value={merchantForm.legalName}
                  onChange={(e) => setMerchantForm({ ...merchantForm, legalName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Shop Name</label>
                <input
                  type="text"
                  value={merchantForm.shopName}
                  onChange={(e) => setMerchantForm({ ...merchantForm, shopName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <textarea
                  value={merchantForm.address}
                  onChange={(e) => setMerchantForm({ ...merchantForm, address: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={merchantForm.phone}
                    onChange={(e) => setMerchantForm({ ...merchantForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={merchantForm.email}
                    onChange={(e) => setMerchantForm({ ...merchantForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
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
                  className="flex-1 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Merchant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request QRs Modal */}
      {showRequestModal && selectedMerchant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Request QR Codes for {selectedMerchant.shopName}
            </h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2">
                <Store className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-800">{selectedMerchant.shopName}</p>
                  <p className="text-sm text-blue-700">{selectedMerchant.legalName}</p>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleRequestQRs} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Number of QR Codes</label>
                <input
                  type="number"
                  value={requestForm.requestedQrCount}
                  onChange={(e) => setRequestForm({ ...requestForm, requestedQrCount: Number(e.target.value) })}
                  min="1"
                  max="50"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Justification</label>
                <textarea
                  value={requestForm.businessJustification}
                  onChange={(e) => setRequestForm({ ...requestForm, businessJustification: e.target.value })}
                  rows={3}
                  placeholder="Explain why this merchant needs QR codes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowRequestModal(false);
                    setSelectedMerchant(null);
                    resetRequestForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={requesting}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  {requesting ? 'Submitting...' : 'Submit Request'}
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
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-800">KYC Document Submission</p>
                  <p className="text-sm text-blue-700">Upload or provide document references for verification</p>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleSubmitKYC} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business License</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Tax Certificate</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Bank Statement</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Ownership Proof</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
                <textarea
                  value={kycForm.additionalNotes}
                  onChange={(e) => setKYCForm({ ...kycForm, additionalNotes: e.target.value })}
                  rows={3}
                  placeholder="Any additional information or document references..."
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

      {/* KYC Review Modal */}
      {showKYCReviewModal && selectedKYCRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Review KYC Request
            </h2>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Merchant:</p>
                  <p className="text-sm text-gray-900">{merchants.find(m => m.id === selectedKYCRequest.merchantId)?.shopName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Submitted:</p>
                  <p className="text-sm text-gray-900">{new Date(selectedKYCRequest.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Submitted Documents:</p>
                <div className="space-y-2">
                  {selectedKYCRequest.documents.businessLicense && (
                    <div className="text-sm">
                      <span className="font-medium">Business License:</span> {selectedKYCRequest.documents.businessLicense}
                    </div>
                  )}
                  {selectedKYCRequest.documents.taxCertificate && (
                    <div className="text-sm">
                      <span className="font-medium">Tax Certificate:</span> {selectedKYCRequest.documents.taxCertificate}
                    </div>
                  )}
                  {selectedKYCRequest.documents.bankStatement && (
                    <div className="text-sm">
                      <span className="font-medium">Bank Statement:</span> {selectedKYCRequest.documents.bankStatement}
                    </div>
                  )}
                  {selectedKYCRequest.documents.ownershipProof && (
                    <div className="text-sm">
                      <span className="font-medium">Ownership Proof:</span> {selectedKYCRequest.documents.ownershipProof}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <form onSubmit={handleKYCReview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Review Decision</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="kycAction"
                      value="approve"
                      checked={kycReviewForm.action === 'approve'}
                      onChange={(e) => setKYCReviewForm({ ...kycReviewForm, action: e.target.value as 'approve' | 'reject' })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Approve KYC</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="kycAction"
                      value="reject"
                      checked={kycReviewForm.action === 'reject'}
                      onChange={(e) => setKYCReviewForm({ ...kycReviewForm, action: e.target.value as 'approve' | 'reject' })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Reject KYC</span>
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review Notes {kycReviewForm.action === 'reject' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={kycReviewForm.notes}
                  onChange={(e) => setKYCReviewForm({ ...kycReviewForm, notes: e.target.value })}
                  rows={3}
                  placeholder={`Add ${kycReviewForm.action === 'approve' ? 'approval' : 'rejection'} notes...`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required={kycReviewForm.action === 'reject'}
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowKYCReviewModal(false);
                    setSelectedKYCRequest(null);
                    resetKYCReviewForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewingKYC || (kycReviewForm.action === 'reject' && !kycReviewForm.notes.trim())}
                  className={`flex-1 px-4 py-2 text-white rounded-lg disabled:opacity-50 ${
                    kycReviewForm.action === 'approve' 
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {reviewingKYC 
                    ? 'Processing...' 
                    : kycReviewForm.action === 'approve' 
                    ? 'Approve KYC' 
                    : 'Reject KYC'
                  }
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