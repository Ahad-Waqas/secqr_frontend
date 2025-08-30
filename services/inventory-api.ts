import api from './axiosInstance';

// Types matching the backend DTOs
export interface BranchInventoryDto {
  branchId: string;
  branchName: string;
  branchCode: string;
  totalAllocated: number;
  available: number;
  issued: number;
  returned: number;
  blocked: number;
  utilizationRate: number;
  lastUpdated: string;
}

export interface ThresholdRequestDto {
  branchId: string;
  currentInventory: number;
  threshold: number;
  requestedAmount: number;
  reason: string;
}

export interface ThresholdRequestResponseDto {
  id: string;
  branchId: string;
  branchName: string;
  currentInventory: number;
  threshold: number;
  requestedAmount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedBy: string;
  approvedBy?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  createdAt: string;
  processedAt?: string;
}

export interface BulkAllocateDto {
  branchId: string;
  count: number;
}

export interface BulkAssignDto {
  sourceBranchId: string;
  targetBranchId: string;
  count: number;
}

export interface RequestApprovalDto {
  rejectionReason?: string;
}

export interface QRCodeResponseDto {
  id: string;
  qrValue: string;
  qrType: string;
  status: string;
  allocatedBranch?: {
    id: string;
    name: string;
  };
  issuedBranch?: {
    id: string;
    name: string;
  };
  createdAt: string;
  allocatedAt?: string;
  issuedAt?: string;
}

export interface PagedResponse<T> {
  content: T[];
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

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

// Inventory API Service
class InventoryApiService {
  
  // Get branch inventory
  async getBranchInventory(branchId?: string): Promise<BranchInventoryDto[]> {
    try {
      const params = branchId ? { branchId } : {};
      const response = await api.get<ApiResponse<BranchInventoryDto[]>>('/inventory/branches', { params });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching branch inventory:', error);
      throw error;
    }
  }

  // Get threshold requests with pagination
  async getThresholdRequests(
    branchId?: string,
    status?: string,
    page: number = 0,
    size: number = 20,
    sortBy: string = 'createdAt',
    sortDir: string = 'desc'
  ): Promise<PagedResponse<ThresholdRequestResponseDto>> {
    try {
      const params: any = {
        page,
        size,
        sortBy,
        sortDir
      };

      if (branchId) params.branchId = branchId;
      if (status) params.status = status;

      const response = await api.get<ApiResponse<PagedResponse<ThresholdRequestResponseDto>>>(
        '/inventory/threshold-requests', 
        { params }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching threshold requests:', error);
      throw error;
    }
  }

  // Create threshold request
  async createThresholdRequest(branchId: string, requestDto: ThresholdRequestDto): Promise<ThresholdRequestResponseDto> {
    try {
      const response = await api.post<ApiResponse<ThresholdRequestResponseDto>>(
        `/inventory/threshold-requests/${branchId}`,
        requestDto
      );
      return response.data.data;
    } catch (error) {
      console.error('Error creating threshold request:', error);
      throw error;
    }
  }

  // Approve threshold request
  async approveThresholdRequest(requestId: string): Promise<ThresholdRequestResponseDto> {
    try {
      const response = await api.post<ApiResponse<ThresholdRequestResponseDto>>(
        `/inventory/threshold-requests/${requestId}/approve`
      );
      return response.data.data;
    } catch (error) {
      console.error('Error approving threshold request:', error);
      throw error;
    }
  }

  // Reject threshold request
  async rejectThresholdRequest(requestId: string, rejectionReason: string): Promise<ThresholdRequestResponseDto> {
    try {
      const approvalDto: RequestApprovalDto = { rejectionReason };
      const response = await api.post<ApiResponse<ThresholdRequestResponseDto>>(
        `/inventory/threshold-requests/${requestId}/reject`,
        approvalDto
      );
      return response.data.data;
    } catch (error) {
      console.error('Error rejecting threshold request:', error);
      throw error;
    }
  }

  // Bulk allocate QR codes
  async bulkAllocateQRs(branchId: string, count: number): Promise<QRCodeResponseDto[]> {
    try {
      const bulkAllocateDto: BulkAllocateDto = { branchId, count };
      const response = await api.post<ApiResponse<QRCodeResponseDto[]>>(
        '/inventory/bulk-allocate',
        bulkAllocateDto
      );
      return response.data.data;
    } catch (error) {
      console.error('Error bulk allocating QRs:', error);
      throw error;
    }
  }

  // Bulk assign QR codes between branches
  async bulkAssignQRs(sourceBranchId: string, targetBranchId: string, count: number): Promise<QRCodeResponseDto[]> {
    try {
      const bulkAssignDto: BulkAssignDto = { sourceBranchId, targetBranchId, count };
      const response = await api.post<ApiResponse<QRCodeResponseDto[]>>(
        '/inventory/bulk-assign',
        bulkAssignDto
      );
      return response.data.data;
    } catch (error) {
      console.error('Error bulk assigning QRs:', error);
      throw error;
    }
  }
}

export const inventoryApiService = new InventoryApiService();
