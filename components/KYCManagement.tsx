import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, Clock, XCircle, FileText, User as UserIcon, 
  Building, Store, Calendar, Eye, Download, Search, Filter,
  AlertTriangle, Mail, Phone, MapPin, Shield
} from 'lucide-react';
import { User, KYCRequest, Merchant } from '../types';
import { apiService } from '../services/api';

interface KYCManagementProps {
  user: User;
}

const KYCManagement: React.FC<KYCManagementProps> = ({ user }) => {
  const [kycRequests, setKYCRequests] = useState<KYCRequest[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<KYCRequest | null>(null);
  const [filters, setFilters] = useState({ search: '', status: '' });
  
  // Review form state
  const [reviewForm, setReviewForm] = useState({
    action: 'approve' as 'approve' | 'reject',
    notes: ''
  });
  const [reviewing, setReviewing] = useState(false);

  const isBranchApprover = user.role === 'BRANCH_APPROVER';
  const isAdmin = user.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (isBranchApprover || isAdmin) {
      loadData();
    }
  }, [isBranchApprover, isAdmin]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [kycData, merchantsData] = await Promise.all([
        apiService.getKYCRequests(isBranchApprover ? user.branchId : undefined),
        apiService.getMerchants(isBranchApprover ? user.branchId : undefined)
      ]);
      
      setKYCRequests(kycData);
      setMerchants(merchantsData);
    } catch (error) {
      console.error('Failed to load KYC data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKYCReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    
    setReviewing(true);
    try {
      if (reviewForm.action === 'approve') {
        await apiService.approveKYCRequest(selectedRequest.id, reviewForm.notes);
      } else {
        await apiService.rejectKYCRequest(selectedRequest.id, reviewForm.notes);
      }
      
      setShowReviewModal(false);
      setSelectedRequest(null);
      resetReviewForm();
      loadData();
    } catch (error) {
      console.error('Failed to review KYC request:', error);
    } finally {
      setReviewing(false);
    }
  };

  const resetReviewForm = () => {
    setReviewForm({
      action: 'approve',
      notes: ''
    });
  };

  const getMerchantInfo = (merchantId: string) => {
    return merchants.find(m => m.id === merchantId);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      rejected: 'bg-red-100 text-red-800 border-red-200'
    };
    
    const icons = {
      pending: Clock,
      approved: CheckCircle,
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

  const filteredRequests = kycRequests.filter(request => {
    const merchant = getMerchantInfo(request.merchantId);
    const matchesSearch = !filters.search || 
      merchant?.shopName.toLowerCase().includes(filters.search.toLowerCase()) ||
      merchant?.legalName.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesStatus = !filters.status || request.status === filters.status;
    
    return matchesSearch && matchesStatus;
  });

  if (!isBranchApprover && !isAdmin) {
    return (
      <div className="text-center py-12">
        <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">You don't have permission to manage KYC verifications.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">KYC Management</h1>
          <p className="text-gray-600">Review and approve merchant KYC verification requests</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <Clock className="h-8 w-8 text-yellow-600 bg-yellow-100 rounded-lg p-2" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {kycRequests.filter(r => r.status === 'pending').length}
              </p>
              <p className="text-sm text-gray-600">Pending Review</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-8 w-8 text-emerald-600 bg-emerald-100 rounded-lg p-2" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {kycRequests.filter(r => r.status === 'approved').length}
              </p>
              <p className="text-sm text-gray-600">Approved</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <XCircle className="h-8 w-8 text-red-600 bg-red-100 rounded-lg p-2" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {kycRequests.filter(r => r.status === 'rejected').length}
              </p>
              <p className="text-sm text-gray-600">Rejected</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <FileText className="h-8 w-8 text-blue-600 bg-blue-100 rounded-lg p-2" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{kycRequests.length}</p>
              <p className="text-sm text-gray-600">Total Requests</p>
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
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* KYC Requests */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-medium text-gray-900">KYC Verification Requests</h2>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No KYC requests found</h3>
            <p className="text-gray-600">No KYC verification requests are currently pending review.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredRequests.map((request) => {
              const merchant = getMerchantInfo(request.merchantId);
              return (
                <div key={request.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Store className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{merchant?.shopName || 'Unknown Merchant'}</h3>
                          <p className="text-sm text-gray-500">{merchant?.legalName}</p>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                      
                      {/* Merchant Details */}
                      {merchant && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-3">Merchant Information</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <MapPin className="h-4 w-4" />
                              <span>{merchant.address}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Phone className="h-4 w-4" />
                              <span>{merchant.phone}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Mail className="h-4 w-4" />
                              <span>{merchant.email}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Calendar className="h-4 w-4" />
                              <span>Created {new Date(merchant.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* KYC Documents */}
                      <div className="bg-blue-50 rounded-lg p-4 mb-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Submitted Documents</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {request.documents.businessLicense && (
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4 text-blue-600" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">Business License</p>
                                <p className="text-xs text-gray-600">{request.documents.businessLicense}</p>
                              </div>
                            </div>
                          )}
                          {request.documents.taxCertificate && (
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4 text-green-600" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">Tax Certificate</p>
                                <p className="text-xs text-gray-600">{request.documents.taxCertificate}</p>
                              </div>
                            </div>
                          )}
                          {request.documents.bankStatement && (
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4 text-purple-600" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">Bank Statement</p>
                                <p className="text-xs text-gray-600">{request.documents.bankStatement}</p>
                              </div>
                            </div>
                          )}
                          {request.documents.ownershipProof && (
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4 text-orange-600" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">Ownership Proof</p>
                                <p className="text-xs text-gray-600">{request.documents.ownershipProof}</p>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {request.documents.additionalDocs && request.documents.additionalDocs.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-blue-200">
                            <p className="text-sm font-medium text-gray-900 mb-2">Additional Documents</p>
                            <div className="space-y-1">
                              {request.documents.additionalDocs.map((doc, index) => (
                                <p key={index} className="text-xs text-gray-600">{doc}</p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Request Timeline */}
                      <div className="flex items-center space-x-6 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>Submitted: {new Date(request.createdAt).toLocaleDateString()}</span>
                        </div>
                        {request.reviewedAt && (
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4" />
                            <span>Reviewed: {new Date(request.reviewedAt).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Review Notes */}
                      {request.reviewNotes && (
                        <div className="mt-4 bg-gray-50 rounded-lg p-3">
                          <p className="text-sm font-medium text-gray-900 mb-1">Review Notes:</p>
                          <p className="text-sm text-gray-600">{request.reviewNotes}</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="ml-6">
                      {request.status === 'pending' && (
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowReviewModal(true);
                          }}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800"
                        >
                          <Eye className="h-4 w-4" />
                          <span>Review KYC</span>
                        </button>
                      )}
                      
                      {request.status !== 'pending' && (
                        <div className="text-center">
                          <p className="text-sm text-gray-500 mb-2">Reviewed by</p>
                          <div className="flex items-center space-x-2">
                            <UserIcon className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-700">
                              {request.reviewedBy || 'System'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* KYC Review Modal */}
      {showReviewModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">KYC Verification Review</h2>
              <button
                onClick={() => setShowReviewModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ×
              </button>
            </div>
            
            {/* Merchant Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-3 mb-3">
                <Store className="h-6 w-6 text-blue-600" />
                <div>
                  <h3 className="font-medium text-blue-900">
                    {getMerchantInfo(selectedRequest.merchantId)?.shopName}
                  </h3>
                  <p className="text-sm text-blue-700">
                    {getMerchantInfo(selectedRequest.merchantId)?.legalName}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2 text-blue-700">
                  <MapPin className="h-4 w-4" />
                  <span>{getMerchantInfo(selectedRequest.merchantId)?.address}</span>
                </div>
                <div className="flex items-center space-x-2 text-blue-700">
                  <Phone className="h-4 w-4" />
                  <span>{getMerchantInfo(selectedRequest.merchantId)?.phone}</span>
                </div>
                <div className="flex items-center space-x-2 text-blue-700">
                  <Mail className="h-4 w-4" />
                  <span>{getMerchantInfo(selectedRequest.merchantId)?.email}</span>
                </div>
                <div className="flex items-center space-x-2 text-blue-700">
                  <Calendar className="h-4 w-4" />
                  <span>Submitted {new Date(selectedRequest.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            {/* Document Review */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-gray-900 mb-4">Document Verification Checklist</h4>
              <div className="space-y-3">
                {[
                  { key: 'businessLicense', label: 'Business License', value: selectedRequest.documents.businessLicense, color: 'blue' },
                  { key: 'taxCertificate', label: 'Tax Certificate', value: selectedRequest.documents.taxCertificate, color: 'green' },
                  { key: 'bankStatement', label: 'Bank Statement', value: selectedRequest.documents.bankStatement, color: 'purple' },
                  { key: 'ownershipProof', label: 'Ownership Proof', value: selectedRequest.documents.ownershipProof, color: 'orange' }
                ].map((doc) => (
                  <div key={doc.key} className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-gray-200">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      doc.value ? `bg-${doc.color}-100` : 'bg-gray-100'
                    }`}>
                      {doc.value ? (
                        <CheckCircle className={`h-4 w-4 text-${doc.color}-600`} />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{doc.label}</p>
                      {doc.value ? (
                        <p className="text-xs text-gray-600 mt-1">{doc.value}</p>
                      ) : (
                        <p className="text-xs text-red-600 mt-1">Not provided</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {selectedRequest.documents.additionalDocs && selectedRequest.documents.additionalDocs.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-900 mb-2">Additional Documents</p>
                  <div className="space-y-1">
                    {selectedRequest.documents.additionalDocs.map((doc, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{doc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Review Form */}
            <form onSubmit={handleKYCReview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Review Decision</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="kycAction"
                      value="approve"
                      checked={reviewForm.action === 'approve'}
                      onChange={(e) => setReviewForm({ ...reviewForm, action: e.target.value as 'approve' | 'reject' })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">✅ Approve KYC - Merchant can receive QR codes</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="kycAction"
                      value="reject"
                      checked={reviewForm.action === 'reject'}
                      onChange={(e) => setReviewForm({ ...reviewForm, action: e.target.value as 'approve' | 'reject' })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">❌ Reject KYC - Documents insufficient or invalid</span>
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review Notes {reviewForm.action === 'reject' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={reviewForm.notes}
                  onChange={(e) => setReviewForm({ ...reviewForm, notes: e.target.value })}
                  rows={4}
                  placeholder={`Add ${reviewForm.action === 'approve' ? 'approval' : 'rejection'} notes and verification details...`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required={reviewForm.action === 'reject'}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {reviewForm.action === 'approve' 
                    ? 'Document verification notes and approval comments'
                    : 'Detailed reason for rejection and required corrections'
                  }
                </p>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowReviewModal(false);
                    setSelectedRequest(null);
                    resetReviewForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewing || (reviewForm.action === 'reject' && !reviewForm.notes.trim())}
                  className={`flex-1 px-4 py-2 text-white rounded-lg disabled:opacity-50 ${
                    reviewForm.action === 'approve' 
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {reviewing 
                    ? 'Processing...' 
                    : reviewForm.action === 'approve' 
                    ? '✅ Approve KYC' 
                    : '❌ Reject KYC'
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

export default KYCManagement;