import api from './axiosInstance';
import { ApiResponse, PagedResponse } from '@/types';

// Backend DTOs
interface CreateMerchantRequestDTO {
  legalName: string;
  shopName: string;
  address: string;
  phone: string;
  email: string;
}

interface MerchantDTO {
  id: number;
  legalName: string;
  shopName: string;
  address: string;
  phone: string;
  email: string;
  kycStatus: 'pending' | 'verified' | 'rejected';
  branchId: number;
  branchName: string;
  branchCode: string;
  createdById: number;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

interface MerchantStatsDTO {
  totalMerchants: number;
  verifiedMerchants: number;
  pendingKYC: number;
  rejectedKYC: number;
}

export interface MerchantFilters {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  search?: string;
  kycStatus?: string;
}

class MerchantApiService {
  private readonly baseUrl = '/merchants';

  // Create merchant
  async createMerchant(data: CreateMerchantRequestDTO): Promise<MerchantDTO> {
    const response = await api.post<ApiResponse<MerchantDTO>>(this.baseUrl, data);
    return response.data.data;
  }

  // Get merchants with pagination and filters
  async getMerchants(filters: MerchantFilters = {}): Promise<PagedResponse<MerchantDTO>> {
    const params = new URLSearchParams();
    
    if (filters.page !== undefined) params.append('page', filters.page.toString());
    if (filters.size !== undefined) params.append('size', filters.size.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortDir) params.append('sortDir', filters.sortDir);
    if (filters.search) params.append('search', filters.search);
    if (filters.kycStatus) params.append('kycStatus', filters.kycStatus);

    const response = await api.get<ApiResponse<PagedResponse<MerchantDTO>>>(
      `${this.baseUrl}?${params.toString()}`
    );
    return response.data.data;
  }

  // Get merchant by ID
  async getMerchant(merchantId: number): Promise<MerchantDTO> {
    const response = await api.get<ApiResponse<MerchantDTO>>(`${this.baseUrl}/${merchantId}`);
    return response.data.data;
  }

  // Update merchant
  async updateMerchant(merchantId: number, data: CreateMerchantRequestDTO): Promise<MerchantDTO> {
    const response = await api.put<ApiResponse<MerchantDTO>>(`${this.baseUrl}/${merchantId}`, data);
    return response.data.data;
  }

  // Delete merchant (soft delete)
  async deleteMerchant(merchantId: number): Promise<void> {
    await api.delete<ApiResponse<void>>(`${this.baseUrl}/${merchantId}`);
  }

  // Get merchant statistics
  async getMerchantStats(): Promise<MerchantStatsDTO> {
    const response = await api.get<ApiResponse<MerchantStatsDTO>>(`${this.baseUrl}/stats`);
    return response.data.data;
  }
}

export const merchantApiService = new MerchantApiService();
export default merchantApiService;
