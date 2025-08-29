import React, { useState, useEffect } from 'react';
import { 
  FileText, Plus, Clock, CheckCircle, XCircle, AlertCircle,
  User as UserIcon, Calendar, Building, MessageSquare, Edit, Search
} from 'lucide-react';
import { 
  User, 
  Request, 
  CreateRequestDto, 
  UpdateRequestDto, 
  RequestApprovalDto,
  PaginatedRequestResponse,
  RequestType,
  RequestStatus,
  RequestPriority
} from '../types';
import { requestApiService } from '../services/request-api';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from './ui/pagination';
import { useToast } from '../hooks/use-toast';
import { useDebounce } from '../hooks/useDebounce';

interface RequestWorkflowProps {
  user: User;
}

const RequestWorkflow: React.FC<RequestWorkflowProps> = ({ user }) => {
  const { toast } = useToast();
  
  // Helper function to check if request type should show monetary amounts
  const isMonetaryRequestType = (type: RequestType): boolean => {
    return ['PAYMENT_REQUEST', 'MAINTENANCE_REQUEST', 'BUDGET_REQUEST'].includes(type);
  };
  
  // Pagination and data state
  const [requestsData, setRequestsData] = useState<PaginatedRequestResponse | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('requestDate');
  const [sortDir, setSortDir] = useState('desc');
  
  // Filter and search state
  const [filters, setFilters] = useState({ 
    search: '', 
    status: '', 
    type: '', 
    priority: '' 
  });
  const debouncedSearch = useDebounce(filters.search, 500);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  
    // Form state
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    type: 'QR_CODE_REQUEST' as RequestType,
    priority: 'MEDIUM' as RequestPriority,
    requestedAmount: 0,
    dueDate: ''
  });
  
  // Edit form state (separate from create form)
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    type: 'QR_CODE_REQUEST' as RequestType,
    priority: 'MEDIUM' as RequestPriority,
    requestedAmount: 0,
    dueDate: ''
  });
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  
  // Approval form state
  const [approvalForm, setApprovalForm] = useState({
    action: 'APPROVE' as 'APPROVE' | 'REJECT' | 'RETURN',
    comments: '',
    approvedAmount: 0,
    rejectionReason: ''
  });
  const [processing, setProcessing] = useState(false);

  // Role-based permissions
  const canCreateRequests = ['BRANCH_MANAGER', 'SALES_USER'].includes(user.role);
  const canApproveRequests = ['BRANCH_APPROVER', 'BRANCH_MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(user.role);
  const isApprover = user.role === 'BRANCH_APPROVER';
  const isSalesUser = user.role === 'SALES_USER';

  useEffect(() => {
    fetchRequests();
  }, [currentPage, pageSize, sortBy, sortDir, debouncedSearch, filters.status, filters.type, filters.priority]);

  // Fetch requests from backend with pagination
  const fetchRequests = async () => {
    try {
      setLoading(true);
      
      let response: PaginatedRequestResponse;
      
      // Use different endpoints based on filters
      if (debouncedSearch) {
        response = await requestApiService.searchRequestsPaginated(
          debouncedSearch, currentPage, pageSize, sortBy, sortDir
        );
      } else if (filters.status || filters.type || filters.priority) {
        response = await requestApiService.getRequestsWithFilters(
          {
            status: filters.status as RequestStatus || undefined,
            type: filters.type as RequestType || undefined,
            priority: filters.priority as RequestPriority || undefined
          },
          currentPage, pageSize, sortBy, sortDir
        );
      } else {
        response = await requestApiService.getAllRequestsPaginated(
          currentPage, pageSize, sortBy, sortDir
        );
      }
      
      setRequestsData(response);
    } catch (error: any) {
      console.error('Error fetching requests:', error);
      toast({
        title: "Error",
        description: "Failed to load requests",
        variant: "destructive",
      });
      setRequestsData(null);
    } finally {
      setLoading(false);
    }
  };

  // Get requests from the paginated response
  const requests = requestsData?.content || [];

  // Reset form
  const resetForm = () => {
    setCreateForm({
      title: '',
      description: '',
      type: 'QR_CODE_REQUEST',
      priority: 'MEDIUM',
      requestedAmount: 0,
      dueDate: ''
    });
    setEditForm({
      title: '',
      description: '',
      type: 'QR_CODE_REQUEST',
      priority: 'MEDIUM',
      requestedAmount: 0,
      dueDate: ''
    });
    setApprovalForm({
      action: 'APPROVE',
      comments: '',
      approvedAmount: 0,
      rejectionReason: ''
    });
  };

  // Create request
  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    
    try {
      const createDto: CreateRequestDto = {
        title: createForm.title,
        description: createForm.description,
        type: createForm.type,
        priority: createForm.priority,
        requestedAmount: createForm.requestedAmount || undefined,
        dueDate: createForm.dueDate || undefined
      };
      
      await requestApiService.createRequest(createDto);
      
      toast({
        title: "Success",
        description: 'Request created successfully',
      });
      
      setShowCreateModal(false);
      resetForm();
      fetchRequests();
    } catch (error: any) {
      console.error('Failed to create request:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || 'Failed to create request',
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  // Update request
  const handleUpdateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    
    setUpdating(true);
    try {
      const updateDto: UpdateRequestDto = {
        title: editForm.title,
        description: editForm.description,
        type: editForm.type,
        priority: editForm.priority,
        requestedAmount: editForm.requestedAmount || undefined,
        dueDate: editForm.dueDate || undefined
      };
      
      await requestApiService.updateRequest(selectedRequest.id, updateDto);
      
      toast({
        title: "Success",
        description: 'Request updated successfully',
      });
      
      setShowEditModal(false);
      setSelectedRequest(null);
      resetForm();
      fetchRequests();
    } catch (error: any) {
      console.error('Failed to update request:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || 'Failed to update request',
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  // Process approval (approve or reject)
  const handleProcessApproval = async () => {
    if (!selectedRequest) return;
    
    setProcessing(true);
    try {
      const approvalDto: RequestApprovalDto = {
        action: approvalForm.action,
        comments: approvalForm.comments || undefined,
        approvedAmount: approvalForm.approvedAmount || undefined,
        rejectionReason: approvalForm.rejectionReason || undefined
      };
      
      await requestApiService.processRequestApproval(selectedRequest.id, approvalDto);
      
      toast({
        title: "Success",
        description: `Request ${approvalForm.action.toLowerCase()}d successfully`,
      });
      
      setShowApprovalModal(false);
      setSelectedRequest(null);
      resetForm();
      fetchRequests();
    } catch (error: any) {
      console.error('Failed to process approval:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || 'Failed to process request',
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  // Open edit modal
  const openEditModal = (request: Request) => {
    setSelectedRequest(request);
    setEditForm({
      title: request.title,
      description: request.description || '',
      type: request.type,
      priority: request.priority,
      requestedAmount: request.requestedAmount || 0,
      dueDate: request.dueDate ? request.dueDate.split('T')[0] : ''
    });
    setShowEditModal(true);
  };

  // Open approval modal
  const openApprovalModal = (request: Request) => {
    setSelectedRequest(request);
    setApprovalForm({
      action: 'APPROVE',
      comments: '',
      approvedAmount: request.requestedAmount || 0,
      rejectionReason: ''
    });
    setShowApprovalModal(true);
  };

  // Handle print request
  const handlePrintRequest = (request: Request) => {
    try {
      const printContent = `
        <html>
          <head>
            <title>Request - ${request.requestCode}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .details { margin-bottom: 20px; }
              .status-badge { 
                background: ${request.status === 'APPROVED' ? '#10B981' : request.status === 'REJECTED' ? '#EF4444' : '#F59E0B'}; 
                color: white; 
                padding: 5px 10px; 
                border-radius: 5px; 
                display: inline-block;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Request Details</h1>
              <h2>${request.requestCode}</h2>
              <span class="status-badge">${request.statusDisplayName}</span>
            </div>
            
            <div class="details">
              <p><strong>Title:</strong> ${request.title}</p>
              <p><strong>Type:</strong> ${request.typeDisplayName}</p>
              <p><strong>Priority:</strong> ${request.priorityDisplayName}</p>
              ${request.description ? `<p><strong>Description:</strong> ${request.description}</p>` : ''}
              ${request.requestedAmount ? `<p><strong>${isMonetaryRequestType(request.type) ? 'Requested Amount:' : 'Requested Quantity:'}</strong> ${isMonetaryRequestType(request.type) ? '$' + request.requestedAmount.toFixed(2) : request.requestedAmount}</p>` : ''}
              ${request.approvedAmount ? `<p><strong>${isMonetaryRequestType(request.type) ? 'Approved Amount:' : 'Approved Quantity:'}</strong> ${isMonetaryRequestType(request.type) ? '$' + request.approvedAmount.toFixed(2) : request.approvedAmount}</p>` : ''}
              <p><strong>Requested Date:</strong> ${new Date(request.requestDate).toLocaleDateString()}</p>
              ${request.approvalDate ? `<p><strong>Approval Date:</strong> ${new Date(request.approvalDate).toLocaleDateString()}</p>` : ''}
              ${request.dueDate ? `<p><strong>Due Date:</strong> ${new Date(request.dueDate).toLocaleDateString()}</p>` : ''}
              <p><strong>Requester:</strong> ${request.requester?.name || 'Unknown'}</p>
              ${request.approver ? `<p><strong>Approver:</strong> ${request.approver.name}</p>` : ''}
              ${request.approvalComments ? `<p><strong>Approval Comments:</strong> ${request.approvalComments}</p>` : ''}
              ${request.rejectionReason ? `<p><strong>Rejection Reason:</strong> ${request.rejectionReason}</p>` : ''}
            </div>
            
            <div style="margin-top: 30px; border-top: 1px solid #ccc; padding-top: 10px;">
              <p><small>Printed on ${new Date().toLocaleString()}</small></p>
            </div>
          </body>
        </html>
      `;
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
        
        toast({
          title: "Success",
          description: `Request ${request.requestCode} sent to printer`,
        });
      } else {
        throw new Error('Unable to open print window');
      }
    } catch (error) {
      console.error('Failed to print request:', error);
      toast({
        title: "Error",
        description: "Failed to print request. Please try again.",
        variant: "destructive",
      });
    }
  };
  // Get status badge with proper styling
  const getStatusBadge = (status: RequestStatus) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      APPROVED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      REJECTED: 'bg-red-100 text-red-800 border-red-200',
      CANCELLED: 'bg-gray-100 text-gray-800 border-gray-200',
      IN_PROGRESS: 'bg-blue-100 text-blue-800 border-blue-200',
      COMPLETED: 'bg-green-100 text-green-800 border-green-200'
    };
    
    const icons = {
      PENDING: Clock,
      APPROVED: CheckCircle,
      REJECTED: XCircle,
      CANCELLED: AlertCircle,
      IN_PROGRESS: Clock,
      COMPLETED: CheckCircle
    };
    
    const Icon = icons[status];
    
    return (
      <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full border ${styles[status]}`}>
        <Icon className="h-3 w-3" />
        <span>{status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}</span>
      </span>
    );
  };

  // Get priority badge
  const getPriorityBadge = (priority: RequestPriority) => {
    const styles = {
      LOW: 'bg-gray-100 text-gray-800',
      MEDIUM: 'bg-blue-100 text-blue-800',
      HIGH: 'bg-orange-100 text-orange-800',
      URGENT: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${styles[priority]}`}>
        {priority}
      </span>
    );
  };

  const getStatusColor = (status: RequestStatus) => {
    const colors = {
      PENDING: 'border-l-yellow-400',
      APPROVED: 'border-l-emerald-400',
      REJECTED: 'border-l-red-400',
      CANCELLED: 'border-l-gray-400',
      IN_PROGRESS: 'border-l-blue-400',
      COMPLETED: 'border-l-green-400'
    };
    return colors[status];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Request Workflow</h1>
          <p className="text-gray-600">
            {isSalesUser 
              ? 'Create and manage your requests'
              : canApproveRequests
              ? 'Review and manage requests'
              : 'View requests'
            }
          </p>
        </div>
        {canCreateRequests && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800"
          >
            <Plus className="h-4 w-4" />
            <span>New Request</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search requests..."
                value={filters.search}
                onChange={(e) => {
                  setFilters({ ...filters, search: e.target.value });
                  setCurrentPage(0);
                }}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <select
            value={filters.status}
            onChange={(e) => {
              setFilters({ ...filters, status: e.target.value });
              setCurrentPage(0);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          
          <select
            value={filters.type}
            onChange={(e) => {
              setFilters({ ...filters, type: e.target.value });
              setCurrentPage(0);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            <option value="QR_CODE_REQUEST">QR Code Request</option>
            <option value="INVENTORY_REQUEST">Inventory Request</option>
            <option value="PAYMENT_REQUEST">Payment Request</option>
            <option value="MAINTENANCE_REQUEST">Maintenance Request</option>
            <option value="EQUIPMENT_REQUEST">Equipment Request</option>
            <option value="MERCHANT_ONBOARDING">Merchant Onboarding</option>
            <option value="BUDGET_REQUEST">Budget Request</option>
            <option value="OTHER">Other</option>
          </select>
          
          <select
            value={filters.priority}
            onChange={(e) => {
              setFilters({ ...filters, priority: e.target.value });
              setCurrentPage(0);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
      </div>

      {/* Request Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <Clock className="h-8 w-8 text-yellow-600 bg-yellow-100 rounded-lg p-2" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {requests.filter(r => r.status === 'PENDING').length}
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
                {requests.filter(r => r.status === 'APPROVED').length}
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
                {requests.filter(r => r.status === 'REJECTED').length}
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
            Requests
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
              {canCreateRequests ? 'Create your first request to get started.' : 'No requests available for review.'}
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-200">
              {requests.map((request) => (
                <div key={request.id} className={`p-6 border-l-4 ${getStatusColor(request.status)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {request.requestCode}
                        </h3>
                        {getStatusBadge(request.status)}
                        {getPriorityBadge(request.priority)}
                      </div>
                      
                      <div className="mb-3">
                        <h4 className="text-base font-medium text-gray-800">{request.title}</h4>
                        <p className="text-sm text-gray-600">{request.typeDisplayName}</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>Requested: {new Date(request.requestDate).toLocaleDateString()}</span>
                        </div>
                        {request.dueDate && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span>Due: {new Date(request.dueDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <UserIcon className="h-4 w-4" />
                          <span>By: {request.requester?.name || 'Unknown'}</span>
                        </div>
                        {request.requestedAmount && request.requestedAmount > 0 && isMonetaryRequestType(request.type) && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <FileText className="h-4 w-4" />
                            <span>Amount: ${request.requestedAmount.toFixed(2)}</span>
                          </div>
                        )}
                        {request.requestedAmount && request.requestedAmount > 0 && !isMonetaryRequestType(request.type) && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <FileText className="h-4 w-4" />
                            <span>Quantity: {request.requestedAmount}</span>
                          </div>
                        )}
                        {request.approver && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>Approved by: {request.approver.name}</span>
                          </div>
                        )}
                        {request.daysSinceRequest > 0 && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span>{request.daysSinceRequest} days ago</span>
                          </div>
                        )}
                      </div>
                      
                      {request.description && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700 mb-1">Description:</p>
                          <p className="text-sm text-gray-600">{request.description}</p>
                        </div>
                      )}
                      
                      {(request.approvalComments || request.rejectionReason) && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-start space-x-2">
                            <MessageSquare className="h-4 w-4 text-gray-500 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-gray-700">
                                {request.approvalComments ? 'Approval Comments:' : 'Rejection Reason:'}
                              </p>
                              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                {request.approvalComments || request.rejectionReason}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-6 flex flex-col space-y-2">
                      {/* Print action for approved requests */}
                      {request.status === 'APPROVED' && (
                        <button
                          onClick={() => handlePrintRequest(request)}
                          className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                        >
                          <FileText className="h-4 w-4" />
                          <span>Print</span>
                        </button>
                      )}
                      
                      {/* Edit action for own pending requests */}
                      {request.status === 'PENDING' && 
                       request.requester?.id === Number(user.id) && (
                        <button
                          onClick={() => openEditModal(request)}
                          className="flex items-center space-x-2 px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm"
                        >
                          <Edit className="h-4 w-4" />
                          <span>Edit</span>
                        </button>
                      )}
                      
                      {/* Approval actions for approvers */}
                      {canApproveRequests && request.status === 'PENDING' && (
                        <button
                          onClick={() => openApprovalModal(request)}
                          className="flex items-center space-x-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm"
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span>Review</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {requestsData && requestsData.pageInfo.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                          className={currentPage === 0 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: Math.min(5, requestsData.pageInfo.totalPages) }, (_, i) => {
                        const pageNumber = i;
                        return (
                          <PaginationItem key={pageNumber}>
                            <PaginationLink
                              onClick={() => setCurrentPage(pageNumber)}
                              isActive={currentPage === pageNumber}
                              className="cursor-pointer"
                            >
                              {pageNumber + 1}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(Math.min(requestsData.pageInfo.totalPages - 1, currentPage + 1))}
                          className={currentPage >= requestsData.pageInfo.totalPages - 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
                
                {/* Page Size Selector */}
                <div className="flex justify-center mt-4">
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(0);
                    }}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md"
                  >
                    <option value={5}>5 per page</option>
                    <option value={10}>10 per page</option>
                    <option value={20}>20 per page</option>
                    <option value={50}>50 per page</option>
                  </select>
                </div>
                
                {/* Results info */}
                <div className="flex justify-center mt-2">
                  <span className="text-sm text-gray-700">
                    Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, requestsData.pageInfo.totalElements)} of {requestsData.pageInfo.totalElements} results
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Request Modal */}
      {showCreateModal && canCreateRequests && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Request</h2>
            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="Enter request title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Request Type *
                </label>
                <select
                  value={createForm.type}
                  onChange={(e) => setCreateForm({ ...createForm, type: e.target.value as RequestType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="QR_CODE_REQUEST">QR Code Request</option>
                  <option value="INVENTORY_REQUEST">Inventory Request</option>
                  <option value="PAYMENT_REQUEST">Payment Request</option>
                  <option value="MAINTENANCE_REQUEST">Maintenance Request</option>
                  <option value="EQUIPMENT_REQUEST">Equipment Request</option>
                  <option value="MERCHANT_ONBOARDING">Merchant Onboarding</option>
                  <option value="BUDGET_REQUEST">Budget Request</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={createForm.priority}
                  onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value as RequestPriority })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  rows={3}
                  placeholder="Describe your request in detail..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {createForm.type && isMonetaryRequestType(createForm.type) ? 'Requested Amount' : 'Requested Quantity'}
                </label>
                <input
                  type="number"
                  value={createForm.requestedAmount}
                  onChange={(e) => setCreateForm({ ...createForm, requestedAmount: Number(e.target.value) })}
                  min="0"
                  step={createForm.type && isMonetaryRequestType(createForm.type) ? "0.01" : "1"}
                  placeholder={createForm.type && isMonetaryRequestType(createForm.type) ? "0.00" : "0"}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={createForm.dueDate}
                  onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
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
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Request Modal */}
      {showEditModal && selectedRequest && 
       selectedRequest.status === 'PENDING' && 
       selectedRequest.requester?.id === Number(user.id) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Edit Request {selectedRequest.requestCode}
            </h2>
            <form onSubmit={handleUpdateRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder="Enter request title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Request Type *
                </label>
                <select
                  value={editForm.type}
                  onChange={(e) => setEditForm({ ...editForm, type: e.target.value as RequestType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="QR_CODE_REQUEST">QR Code Request</option>
                  <option value="INVENTORY_REQUEST">Inventory Request</option>
                  <option value="PAYMENT_REQUEST">Payment Request</option>
                  <option value="MAINTENANCE_REQUEST">Maintenance Request</option>
                  <option value="EQUIPMENT_REQUEST">Equipment Request</option>
                  <option value="MERCHANT_ONBOARDING">Merchant Onboarding</option>
                  <option value="BUDGET_REQUEST">Budget Request</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={editForm.priority}
                  onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as RequestPriority })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                  placeholder="Describe your request in detail..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Requested Amount
                </label>
                <input
                  type="number"
                  value={editForm.requestedAmount}
                  onChange={(e) => setEditForm({ ...editForm, requestedAmount: Number(e.target.value) })}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={editForm.dueDate}
                  onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedRequest(null);
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
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Review Request {selectedRequest.requestCode}
            </h2>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Request Type:</p>
                  <p className="text-sm text-gray-900">{selectedRequest.type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Priority:</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    selectedRequest.priority === 'URGENT' 
                      ? 'bg-red-100 text-red-800'
                      : selectedRequest.priority === 'HIGH'
                      ? 'bg-orange-100 text-orange-800'
                      : selectedRequest.priority === 'MEDIUM'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedRequest.priority}
                  </span>
                </div>
              </div>
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700">Title:</p>
                <p className="text-sm text-gray-900">{selectedRequest.title}</p>
              </div>
              {selectedRequest.description && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700">Description:</p>
                  <p className="text-sm text-gray-900">{selectedRequest.description}</p>
                </div>
              )}
              {selectedRequest.requestedAmount && selectedRequest.requestedAmount > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700">
                    {isMonetaryRequestType(selectedRequest.type) ? 'Requested Amount:' : 'Requested Quantity:'}
                  </p>
                  <p className="text-sm text-gray-900">
                    {isMonetaryRequestType(selectedRequest.type) 
                      ? `$${selectedRequest.requestedAmount.toFixed(2)}`
                      : selectedRequest.requestedAmount.toString()
                    }
                  </p>
                </div>
              )}
              {selectedRequest.dueDate && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700">Due Date:</p>
                  <p className="text-sm text-gray-900">{new Date(selectedRequest.dueDate).toLocaleDateString()}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Requested By:</p>
                  <p className="text-sm text-gray-900">{selectedRequest.requester?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Request Date:</p>
                  <p className="text-sm text-gray-900">{new Date(selectedRequest.requestDate).toLocaleDateString()}</p>
                </div>
              </div>
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
                      value="APPROVE"
                      checked={approvalForm.action === 'APPROVE'}
                      onChange={(e) => setApprovalForm({ ...approvalForm, action: e.target.value as 'APPROVE' | 'REJECT' })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Approve Request</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="approvalAction"
                      value="REJECT"
                      checked={approvalForm.action === 'REJECT'}
                      onChange={(e) => setApprovalForm({ ...approvalForm, action: e.target.value as 'APPROVE' | 'REJECT' })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Reject Request</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="approvalAction"
                      value="RETURN"
                      checked={approvalForm.action === 'RETURN'}
                      onChange={(e) => setApprovalForm({ ...approvalForm, action: e.target.value as 'APPROVE' | 'REJECT' | 'RETURN' })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Return for Correction</span>
                  </label>
                </div>
              </div>
            )}
            
            {approvalForm.action === 'APPROVE' && selectedRequest.requestedAmount && selectedRequest.requestedAmount > 0 && isMonetaryRequestType(selectedRequest.type) && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Approved Amount
                </label>
                <input
                  type="number"
                  value={approvalForm.approvedAmount}
                  onChange={(e) => setApprovalForm({ ...approvalForm, approvedAmount: Number(e.target.value) })}
                  min="0"
                  max={selectedRequest.requestedAmount}
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter approved amount"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum: ${selectedRequest.requestedAmount.toFixed(2)}
                </p>
              </div>
            )}
            
            {approvalForm.action === 'APPROVE' && selectedRequest.requestedAmount && selectedRequest.requestedAmount > 0 && !isMonetaryRequestType(selectedRequest.type) && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Approved Quantity
                </label>
                <input
                  type="number"
                  value={approvalForm.approvedAmount}
                  onChange={(e) => setApprovalForm({ ...approvalForm, approvedAmount: Number(e.target.value) })}
                  min="0"
                  max={selectedRequest.requestedAmount}
                  step="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter approved quantity"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum: {selectedRequest.requestedAmount}
                </p>
              </div>
            )}
            
            {approvalForm.action === 'REJECT' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason *
                </label>
                <textarea
                  value={approvalForm.rejectionReason}
                  onChange={(e) => setApprovalForm({ ...approvalForm, rejectionReason: e.target.value })}
                  rows={3}
                  placeholder="Please provide a reason for rejection..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            )}
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isApprover 
                  ? `${approvalForm.action === 'APPROVE' ? 'Approval' : approvalForm.action === 'REJECT' ? 'Rejection' : 'Correction'} Comments`
                  : 'Comments'
                }
              </label>
              <textarea
                value={approvalForm.comments}
                onChange={(e) => setApprovalForm({ ...approvalForm, comments: e.target.value })}
                rows={3}
                placeholder={`Add ${approvalForm.action === 'APPROVE' ? 'approval' : approvalForm.action === 'REJECT' ? 'rejection' : 'correction'} comments...`}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className={`flex space-x-3 ${isApprover ? 'justify-between' : ''}`}>
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  setApprovalForm({
                    action: 'APPROVE',
                    comments: '',
                    approvedAmount: 0,
                    rejectionReason: ''
                  });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              
              {isApprover ? (
                <button
                  onClick={() => {
                    if (approvalForm.action === 'APPROVE') handleProcessApproval();
                    else if (approvalForm.action === 'REJECT') handleProcessApproval();
                    else handleProcessApproval(); // Return for correction
                  }}
                  disabled={processing || (approvalForm.action === 'REJECT' && !approvalForm.rejectionReason.trim())}
                  className={`flex-1 px-4 py-2 text-white rounded-lg disabled:opacity-50 ${
                    approvalForm.action === 'APPROVE' 
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : approvalForm.action === 'REJECT'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  {processing 
                    ? 'Processing...' 
                    : approvalForm.action === 'APPROVE' 
                    ? 'Approve' 
                    : approvalForm.action === 'REJECT'
                    ? 'Reject'
                    : 'Return for Correction'
                  }
                </button>
              ) : (
                <>
                  <button
                    onClick={handleProcessApproval}
                    disabled={processing}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {processing ? 'Processing...' : 'Reject'}
                  </button>
                  <button
                    onClick={handleProcessApproval}
                    disabled={processing}
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