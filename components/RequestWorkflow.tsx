import React, { useState, useEffect } from 'react';
import { 
  FileText, Plus, Clock, CheckCircle, XCircle, AlertCircle,
  User as UserIcon, Calendar, Building, MessageSquare, Edit
} from 'lucide-react';
import { User, AllocationRequest } from '../types';
import { apiService } from '../services/api';

interface RequestWorkflowProps {
  user: User;
}

const RequestWorkflow: React.FC<RequestWorkflowProps> = ({ user }) => {
  const [requests, setRequests] = useState<AllocationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AllocationRequest | null>(null);
  
  // Create request form state
  const [createForm, setCreateForm] = useState({
    requestedQrCount: 10,
    requestedFor: '',
    notes: ''
  });
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  
  // Approval form state
  const [approvalNotes, setApprovalNotes] = useState('');
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | 'return'>('approve');
  const [processing, setProcessing] = useState(false);

  const canCreateRequests = user.role === 'request_initiator' || user.role === 'BRANCH_MANAGER';
  const canApproveRequests = user.role === 'BRANCH_APPROVER' || user.role === 'BRANCH_MANAGER';
  const isApprover = user.role === 'BRANCH_APPROVER';
  const isSalesUser = user.role === 'SALES_USER';

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      // The API will automatically filter based on user role
      const data = await apiService.getAllocationRequests(user.branchId);
      setRequests(data);
    } catch (error) {
      console.error('Failed to load requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    
    try {
      await apiService.createAllocationRequest({
        branchId: user.branchId!,
        ...createForm
      });
      
      setShowCreateModal(false);
      setCreateForm({ requestedQrCount: 10, requestedFor: '', notes: '' });
      loadRequests();
    } catch (error) {
      console.error('Failed to create request:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    
    setUpdating(true);
    try {
      await apiService.updateAllocationRequest(selectedRequest.id, createForm);
      setShowEditModal(false);
      setSelectedRequest(null);
      setCreateForm({ requestedQrCount: 10, requestedFor: '', notes: '' });
      loadRequests();
    } catch (error) {
      console.error('Failed to update request:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handlePrintQR = (request: AllocationRequest) => {
    // Add KYC verification note to print
    // Generate print content for approved QR codes
    const printContent = `
      <html>
        <head>
          <title>QR Code Request - ${request.requestNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .details { margin-bottom: 20px; }
            .kyc-note { 
              background: #10B981; 
              color: white; 
              padding: 10px; 
              border-radius: 5px; 
              margin: 20px 0; 
              text-align: center;
              font-weight: bold;
            }
            .qr-placeholder { 
              width: 200px; 
              height: 200px; 
              border: 2px dashed #ccc; 
              margin: 20px auto; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              font-size: 14px; 
              color: #666; 
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>QR Code Request</h1>
            <h2>${request.requestNumber}</h2>
          </div>
          
          <div class="kyc-note">
            ✓ KYC VERIFICATION REQUIRED FOR QR ISSUANCE
          </div>
          <div class="details">
            <p><strong>Requested QR Count:</strong> ${request.requestedQrCount}</p>
            <p><strong>Purpose:</strong> ${request.requestedFor}</p>
            <p><strong>Status:</strong> ${request.status.toUpperCase()}</p>
            <p><strong>Created:</strong> ${new Date(request.createdAt).toLocaleDateString()}</p>
            ${request.approvedAt ? `<p><strong>Approved:</strong> ${new Date(request.approvedAt).toLocaleDateString()}</p>` : ''}
            <p><strong>Note:</strong> QR codes can only be issued to merchants with verified KYC status.</p>
          </div>
          <div class="qr-placeholder">
            QR Code will be generated here
          </div>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const openEditModal = (request: AllocationRequest) => {
    setSelectedRequest(request);
    setCreateForm({
      requestedQrCount: request.requestedQrCount,
      requestedFor: request.requestedFor,
      notes: request.notes
    });
    setShowEditModal(true);
  };
  const handleApprove = async () => {
    if (!selectedRequest || !approvalNotes.trim()) return;
    
    setProcessing(true);
    try {
      await apiService.approveRequest(selectedRequest.id, approvalNotes);
      setShowApprovalModal(false);
      setSelectedRequest(null);
      setApprovalNotes('');
      loadRequests();
    } catch (error) {
      console.error('Failed to approve request:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !approvalNotes.trim()) return;
    
    setProcessing(true);
    try {
      await apiService.rejectRequest(selectedRequest.id, approvalNotes);
      setShowApprovalModal(false);
      setSelectedRequest(null);
      setApprovalNotes('');
      loadRequests();
    } catch (error) {
      console.error('Failed to reject request:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleReturnForCorrection = async () => {
    if (!selectedRequest || !approvalNotes.trim()) return;
    
    setProcessing(true);
    try {
      await apiService.returnRequestForCorrection(selectedRequest.id, approvalNotes);
      setShowApprovalModal(false);
      setSelectedRequest(null);
      setApprovalNotes('');
      setApprovalAction('approve');
      loadRequests();
    } catch (error) {
      console.error('Failed to return request for correction:', error);
    } finally {
      setProcessing(false);
    }
  };
  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      cancelled: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    
    const icons = {
      pending: Clock,
      approved: CheckCircle,
      rejected: XCircle,
      cancelled: AlertCircle
    };
    
    const Icon = icons[status as keyof typeof icons];
    
    return (
      <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full border ${styles[status as keyof typeof styles]}`}>
        <Icon className="h-3 w-3" />
        <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
      </span>
    );
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'border-l-yellow-400',
      approved: 'border-l-emerald-400',
      rejected: 'border-l-red-400',
      cancelled: 'border-l-gray-400'
    };
    return colors[status as keyof typeof colors];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Request Workflow</h1>
          <p className="text-gray-600">
            {isSalesUser ? 'My Requests' : 'Request Workflow'}
            {isSalesUser
              ? 'Create and manage your QR allocation requests'
              : isApprover
              ? 'Review and approve requests from your branch'
              : canCreateRequests && canApproveRequests 
              ? 'Create and approve QR allocation requests'
              : canCreateRequests 
              ? 'Create QR allocation requests' 
              : 'Review and approve allocation requests'
            }
          </p>
        </div>
        {(canCreateRequests || isSalesUser) && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800"
          >
            <Plus className="h-4 w-4" />
            <span>New Request</span>
          </button>
        )}
      </div>

      {/* Request Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <Clock className="h-8 w-8 text-yellow-600 bg-yellow-100 rounded-lg p-2" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {requests.filter(r => r.status === 'pending').length}
              </p>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-8 w-8 text-emerald-600 bg-emerald-100 rounded-lg p-2" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {requests.filter(r => r.status === 'approved').length}
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
                {requests.filter(r => r.status === 'rejected').length}
              </p>
              <p className="text-sm text-gray-600">Rejected</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <FileText className="h-8 w-8 text-blue-600 bg-blue-100 rounded-lg p-2" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
              <p className="text-sm text-gray-600">Total Requests</p>
            </div>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-medium text-gray-900">
            {isSalesUser ? 'My Allocation Requests' : 'Allocation Requests'}
          </h2>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
            <p className="text-gray-600 mb-4">
              {(canCreateRequests || isSalesUser) ? 'Create your first allocation request to get started.' : 'No requests available for review.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {requests.map((request) => (
              <div key={request.id} className={`p-6 border-l-4 ${getStatusColor(request.status)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {request.requestNumber}
                      </h3>
                      {getStatusBadge(request.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <FileText className="h-4 w-4" />
                        <span>{request.requestedQrCount} QR codes requested</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(request.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Building className="h-4 w-4" />
                        <span>Branch {request.branchId}</span>
                      </div>
                      {request.approvedAt && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <CheckCircle className="h-4 w-4" />
                          <span>Approved {new Date(request.approvedAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-1">Purpose:</p>
                      <p className="text-sm text-gray-600">{request.requestedFor}</p>
                    </div>
                    
                    {request.notes && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-start space-x-2">
                          <MessageSquare className="h-4 w-4 text-gray-500 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">Notes:</p>
                            <p className="text-sm text-gray-600 whitespace-pre-wrap">{request.notes}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-6">
                    {/* Sales User Actions */}
                    {isSalesUser && (
                      <>
                        {request.status === 'approved' && (
                          <button
                            onClick={() => handlePrintQR(request)}
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800"
                          >
                            <FileText className="h-4 w-4" />
                            <span>Print QR</span>
                          </button>
                        )}
                        {request.status === 'rejected' && (
                          <button
                            onClick={() => openEditModal(request)}
                            className="flex items-center space-x-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                          >
                            <Edit className="h-4 w-4" />
                            <span>Edit Request</span>
                          </button>
                        )}
                      </>
                    )}
                    
                    {/* Approver Actions */}
                    {canApproveRequests && request.status === 'pending' && (
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setApprovalAction('approve');
                          setShowApprovalModal(true);
                        }}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800"
                      >
                        <FileText className="h-4 w-4" />
                        <span>Review</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Request Modal */}
      {showCreateModal && (canCreateRequests || isSalesUser) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create Allocation Request</h2>
            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of QR Codes
                </label>
                <input
                  type="number"
                  value={createForm.requestedQrCount}
                  onChange={(e) => setCreateForm({ ...createForm, requestedQrCount: Number(e.target.value) })}
                  min="1"
                  max="500"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purpose/Use Case
                </label>
                <input
                  type="text"
                  value={createForm.requestedFor}
                  onChange={(e) => setCreateForm({ ...createForm, requestedFor: e.target.value })}
                  placeholder="e.g., Monthly merchant acquisition"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                  rows={3}
                  placeholder="Any additional context or requirements..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Request Modal */}
      {showEditModal && selectedRequest && isSalesUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Edit Request {selectedRequest.requestNumber}
            </h2>
            <form onSubmit={handleUpdateRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of QR Codes
                </label>
                <input
                  type="number"
                  value={createForm.requestedQrCount}
                  onChange={(e) => setCreateForm({ ...createForm, requestedQrCount: Number(e.target.value) })}
                  min="1"
                  max="500"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purpose/Use Case
                </label>
                <input
                  type="text"
                  value={createForm.requestedFor}
                  onChange={(e) => setCreateForm({ ...createForm, requestedFor: e.target.value })}
                  placeholder="e.g., Monthly merchant acquisition"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                  rows={3}
                  placeholder="Any additional context or requirements..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedRequest(null);
                    setCreateForm({ requestedQrCount: 10, requestedFor: '', notes: '' });
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
                  {updating ? 'Updating...' : 'Update Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Approval Modal */}
      {showApprovalModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Review Request {selectedRequest.requestNumber}
            </h2>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Requested QRs:</p>
                  <p className="text-sm text-gray-900">{selectedRequest.requestedQrCount}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Branch:</p>
                  <p className="text-sm text-gray-900">{selectedRequest.branchId}</p>
                </div>
              </div>
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700">Purpose:</p>
                <p className="text-sm text-gray-900">{selectedRequest.requestedFor}</p>
              </div>
              {selectedRequest.notes && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Original Notes:</p>
                  <p className="text-sm text-gray-900">{selectedRequest.notes}</p>
                </div>
              )}
            </div>
            
            {isApprover && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Action
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="approvalAction"
                      value="approve"
                      checked={approvalAction === 'approve'}
                      onChange={(e) => setApprovalAction(e.target.value as 'approve' | 'reject' | 'return')}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Approve Request</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="approvalAction"
                      value="reject"
                      checked={approvalAction === 'reject'}
                      onChange={(e) => setApprovalAction(e.target.value as 'approve' | 'reject' | 'return')}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Reject Request</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="approvalAction"
                      value="return"
                      checked={approvalAction === 'return'}
                      onChange={(e) => setApprovalAction(e.target.value as 'approve' | 'reject' | 'return')}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Return for Correction</span>
                  </label>
                </div>
              </div>
            )}
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isApprover 
                  ? `${approvalAction === 'approve' ? 'Approval' : approvalAction === 'reject' ? 'Rejection' : 'Correction'} Notes (Required)`
                  : 'Approval/Rejection Notes'
                }
              </label>
              <textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                rows={3}
                placeholder={`Add ${approvalAction === 'approve' ? 'approval' : approvalAction === 'reject' ? 'rejection' : 'correction'} notes...`}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              {!approvalNotes.trim() && (
                <p className="text-sm text-red-600 mt-1">Notes are required for all actions</p>
              )}
            </div>
            
            <div className={`flex space-x-3 ${isApprover ? 'justify-between' : ''}`}>
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  setApprovalNotes('');
                  setApprovalAction('approve');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              
              {isApprover ? (
                <button
                  onClick={() => {
                    if (approvalAction === 'approve') handleApprove();
                    else if (approvalAction === 'reject') handleReject();
                    else handleReturnForCorrection();
                  }}
                  disabled={processing || !approvalNotes.trim()}
                  className={`flex-1 px-4 py-2 text-white rounded-lg disabled:opacity-50 ${
                    approvalAction === 'approve' 
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : approvalAction === 'reject'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  {processing 
                    ? 'Processing...' 
                    : approvalAction === 'approve' 
                    ? 'Approve' 
                    : approvalAction === 'reject'
                    ? 'Reject'
                    : 'Return for Correction'
                  }
                </button>
              ) : (
                <>
                  <button
                    onClick={handleReject}
                    disabled={processing || !approvalNotes.trim()}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {processing ? 'Processing...' : 'Reject'}
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={processing || !approvalNotes.trim()}
                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {processing ? 'Processing...' : 'Approve'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestWorkflow;