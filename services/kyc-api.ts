import api from './axiosInstance';
import { ApiResponse, PagedResponse } from '@/types';

// Backend DTOs
interface CreateKYCRequestDTO {
  merchantId: number;
  businessLicense: string;
  taxCertificate: string;
  bankStatement: string;
  ownershipProof: string;
  additionalNotes?: string;
}

interface KYCReviewRequestDTO {
  action: 'approve' | 'reject';
  notes?: string;
}

interface DocumentsDTO {
  businessLicense: string;
  taxCertificate: string;
  bankStatement: string;
  ownershipProof: string;
  additionalDocs?: string[];
}

interface KYCRequestDTO {
  id: number;
  requestCode: string;
  merchantId: number;
  merchantName: string;
  merchantLegalName: string;
  branchId: number;
  branchName: string;
  branchCode: string;
  submittedById: number;
  submittedByName: string;
  reviewedById?: number;
  reviewedByName?: string;
  status: 'pending' | 'approved' | 'rejected';
  documents: DocumentsDTO;
  additionalNotes?: string;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  isActive: boolean;
}

interface KYCStatsDTO {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
}

export interface KYCFilters {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  search?: string;
  status?: string;
}

class KYCApiService {
  private readonly baseUrl = '/kyc';

  // Create KYC request
  async createKYCRequest(data: CreateKYCRequestDTO): Promise<KYCRequestDTO> {
    const response = await api.post<ApiResponse<KYCRequestDTO>>(`${this.baseUrl}/requests`, data);
    return response.data.data;
  }

  // Get KYC requests with pagination and filters
  async getKYCRequests(filters: KYCFilters = {}): Promise<PagedResponse<KYCRequestDTO>> {
    const params = new URLSearchParams();
    
    if (filters.page !== undefined) params.append('page', filters.page.toString());
    if (filters.size !== undefined) params.append('size', filters.size.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortDir) params.append('sortDir', filters.sortDir);
    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);

    const response = await api.get<ApiResponse<PagedResponse<KYCRequestDTO>>>(
      `${this.baseUrl}/requests?${params.toString()}`
    );
    return response.data.data;
  }

  // Get KYC request by ID
  async getKYCRequest(requestId: number): Promise<KYCRequestDTO> {
    const response = await api.get<ApiResponse<KYCRequestDTO>>(`${this.baseUrl}/requests/${requestId}`);
    return response.data.data;
  }

  // Review KYC request (approve or reject)
  async reviewKYCRequest(requestId: number, reviewData: KYCReviewRequestDTO): Promise<KYCRequestDTO> {
    const response = await api.post<ApiResponse<KYCRequestDTO>>(
      `${this.baseUrl}/requests/${requestId}/review`,
      reviewData
    );
    return response.data.data;
  }

  // Approve KYC request
  async approveKYCRequest(requestId: number, notes?: string): Promise<KYCRequestDTO> {
    const params = notes ? `?notes=${encodeURIComponent(notes)}` : '';
    const response = await api.post<ApiResponse<KYCRequestDTO>>(
      `${this.baseUrl}/requests/${requestId}/approve${params}`
    );
    return response.data.data;
  }

  // Reject KYC request
  async rejectKYCRequest(requestId: number, notes: string): Promise<KYCRequestDTO> {
    const params = `?notes=${encodeURIComponent(notes)}`;
    const response = await api.post<ApiResponse<KYCRequestDTO>>(
      `${this.baseUrl}/requests/${requestId}/reject${params}`
    );
    return response.data.data;
  }

  // Get pending KYC requests for approval
  async getPendingKYCRequests(page = 0, size = 10): Promise<PagedResponse<KYCRequestDTO>> {
    const response = await api.get<ApiResponse<PagedResponse<KYCRequestDTO>>>(
      `${this.baseUrl}/pending?page=${page}&size=${size}`
    );
    return response.data.data;
  }

  // Get KYC statistics
  async getKYCStats(): Promise<KYCStatsDTO> {
    const response = await api.get<ApiResponse<KYCStatsDTO>>(`${this.baseUrl}/stats`);
    return response.data.data;
  }
}

export const kycApiService = new KYCApiService();
export default kycApiService;
