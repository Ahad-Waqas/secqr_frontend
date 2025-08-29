import api from './axiosInstance';
import type { 
  Request, 
  CreateRequestDto, 
  UpdateRequestDto, 
  RequestApprovalDto, 
  PaginatedRequestResponse,
  RequestType,
  RequestStatus,
  RequestPriority
} from '../types';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

// Utility function to format date for backend LocalDateTime
const formatDateForBackend = (dateString: string | undefined): string | undefined => {
  if (!dateString) return undefined;
  // If it's already in ISO format with time, return as is
  if (dateString.includes('T') || dateString.includes(' ')) {
    return dateString;
  }
  // Convert YYYY-MM-DD to YYYY-MM-DDTHH:mm:ss format
  return `${dateString}T00:00:00`;
};

class RequestApiService {
  
  // Get all requests (with role-based filtering handled by backend)
  async getAllRequests(): Promise<Request[]> {
    const response = await api.get<ApiResponse<Request[]>>('/requests');
    return response.data.data;
  }

  // Get paginated requests
  async getAllRequestsPaginated(
    page: number = 0,
    size: number = 20,
    sortBy: string = 'requestDate',
    sortDir: string = 'desc'
  ): Promise<PaginatedRequestResponse> {
    const response = await api.get<ApiResponse<PaginatedRequestResponse>>('/requests/paginated', {
      params: { page, size, sortBy, sortDir }
    });
    return response.data.data;
  }

  // Get request by ID
  async getRequestById(requestId: number): Promise<Request> {
    const response = await api.get<ApiResponse<Request>>(`/requests/${requestId}`);
    return response.data.data;
  }

  // Create new request
  async createRequest(createDto: CreateRequestDto): Promise<Request> {
    const formattedDto = {
      ...createDto,
      dueDate: formatDateForBackend(createDto.dueDate)
    };
    const response = await api.post<ApiResponse<Request>>('/requests', formattedDto);
    return response.data.data;
  }

  // Update request
  async updateRequest(requestId: number, updateDto: UpdateRequestDto): Promise<Request> {
    const formattedDto = {
      ...updateDto,
      dueDate: formatDateForBackend(updateDto.dueDate)
    };
    const response = await api.put<ApiResponse<Request>>(`/requests/${requestId}`, formattedDto);
    return response.data.data;
  }

  // Process request approval (approve/reject)
  async processRequestApproval(requestId: number, approvalDto: RequestApprovalDto): Promise<Request> {
    const response = await api.post<ApiResponse<Request>>(`/requests/${requestId}/process`, approvalDto);
    return response.data.data;
  }

  // Quick approve request
  async approveRequest(requestId: number, comments?: string, approvedAmount?: number): Promise<Request> {
    const approvalDto: RequestApprovalDto = {
      action: 'APPROVE',
      comments,
      approvedAmount
    };
    const response = await api.post<ApiResponse<Request>>(`/requests/${requestId}/approve`, approvalDto);
    return response.data.data;
  }

  // Quick reject request
  async rejectRequest(requestId: number, rejectionReason: string): Promise<Request> {
    const approvalDto: RequestApprovalDto = {
      action: 'REJECT',
      rejectionReason
    };
    const response = await api.post<ApiResponse<Request>>(`/requests/${requestId}/reject`, approvalDto);
    return response.data.data;
  }

  // Delete request
  async deleteRequest(requestId: number): Promise<void> {
    await api.delete<ApiResponse<void>>(`/requests/${requestId}`);
  }

  // Search requests with pagination
  async searchRequestsPaginated(
    searchTerm: string,
    page: number = 0,
    size: number = 20,
    sortBy: string = 'requestDate',
    sortDir: string = 'desc'
  ): Promise<PaginatedRequestResponse> {
    const response = await api.get<ApiResponse<PaginatedRequestResponse>>('/requests/paginated/search', {
      params: { q: searchTerm, page, size, sortBy, sortDir }
    });
    return response.data.data;
  }

  // Get requests by status
  async getRequestsByStatus(
    status: RequestStatus,
    page: number = 0,
    size: number = 20,
    sortBy: string = 'requestDate',
    sortDir: string = 'desc'
  ): Promise<PaginatedRequestResponse> {
    const response = await api.get<ApiResponse<PaginatedRequestResponse>>(`/requests/paginated/status/${status}`, {
      params: { page, size, sortBy, sortDir }
    });
    return response.data.data;
  }

  // Get requests by branch (admin only)
  async getRequestsByBranch(
    branchId: number,
    page: number = 0,
    size: number = 20,
    sortBy: string = 'requestDate',
    sortDir: string = 'desc'
  ): Promise<PaginatedRequestResponse> {
    const response = await api.get<ApiResponse<PaginatedRequestResponse>>(`/requests/paginated/branch/${branchId}`, {
      params: { page, size, sortBy, sortDir }
    });
    return response.data.data;
  }

  // Get overdue requests
  async getOverdueRequests(
    page: number = 0,
    size: number = 20,
    sortBy: string = 'dueDate',
    sortDir: string = 'asc'
  ): Promise<PaginatedRequestResponse> {
    const response = await api.get<ApiResponse<PaginatedRequestResponse>>('/requests/paginated/overdue', {
      params: { page, size, sortBy, sortDir }
    });
    return response.data.data;
  }

  // Get requests with advanced filters
  async getRequestsWithFilters(
    filters: {
      branchId?: number;
      status?: RequestStatus;
      type?: RequestType;
      priority?: RequestPriority;
      search?: string;
      startDate?: string;
      endDate?: string;
    },
    page: number = 0,
    size: number = 20,
    sortBy: string = 'requestDate',
    sortDir: string = 'desc'
  ): Promise<PaginatedRequestResponse> {
    const formattedFilters = {
      ...filters,
      startDate: formatDateForBackend(filters.startDate),
      endDate: formatDateForBackend(filters.endDate)
    };
    const params = {
      ...formattedFilters,
      page,
      size,
      sortBy,
      sortDir
    };
    const response = await api.get<ApiResponse<PaginatedRequestResponse>>('/requests/paginated/filter', {
      params
    });
    return response.data.data;
  }

  // Get pending requests
  async getPendingRequests(
    page: number = 0,
    size: number = 20,
    sortBy: string = 'requestDate',
    sortDir: string = 'asc'
  ): Promise<PaginatedRequestResponse> {
    const response = await api.get<ApiResponse<PaginatedRequestResponse>>('/requests/pending', {
      params: { page, size, sortBy, sortDir }
    });
    return response.data.data;
  }

  // Get approved requests
  async getApprovedRequests(
    page: number = 0,
    size: number = 20,
    sortBy: string = 'approvalDate',
    sortDir: string = 'desc'
  ): Promise<PaginatedRequestResponse> {
    const response = await api.get<ApiResponse<PaginatedRequestResponse>>('/requests/approved', {
      params: { page, size, sortBy, sortDir }
    });
    return response.data.data;
  }

  // Get rejected requests
  async getRejectedRequests(
    page: number = 0,
    size: number = 20,
    sortBy: string = 'rejectionDate',
    sortDir: string = 'desc'
  ): Promise<PaginatedRequestResponse> {
    const response = await api.get<ApiResponse<PaginatedRequestResponse>>('/requests/rejected', {
      params: { page, size, sortBy, sortDir }
    });
    return response.data.data;
  }

  // Get request types
  async getRequestTypes(): Promise<RequestType[]> {
    const response = await api.get<ApiResponse<RequestType[]>>('/requests/types');
    return response.data.data;
  }

  // Get request statuses
  async getRequestStatuses(): Promise<RequestStatus[]> {
    const response = await api.get<ApiResponse<RequestStatus[]>>('/requests/statuses');
    return response.data.data;
  }

  // Get request priorities
  async getRequestPriorities(): Promise<RequestPriority[]> {
    const response = await api.get<ApiResponse<RequestPriority[]>>('/requests/priorities');
    return response.data.data;
  }

  // Search requests (non-paginated for backward compatibility)
  async searchRequests(searchTerm: string): Promise<Request[]> {
    const response = await api.get<ApiResponse<Request[]>>('/requests/search', {
      params: { q: searchTerm }
    });
    return response.data.data;
  }
}

export const requestApiService = new RequestApiService();
