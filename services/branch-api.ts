import api from './axiosInstance';

// Backend User interface that matches the API response
export interface BackendUser {
  id: number;
  name: string;
  email: string;
  role: 'BRANCH_MANAGER' | 'BRANCH_APPROVER' | 'SALES_USER' | 'REQUEST_INITIATOR' | 'SUPER_ADMIN' | 'AUDITOR';
  branchId: number;
  branchName: string;
  createdAt: string;
  updatedAt: string;
  enabled: boolean;
  phone?: string;
}

// Paginated Response interface
export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
}

export interface BranchCreateDto {
  branchCode: string;
  name: string;
  region: string;
  type: 'DOMESTIC' | 'INTERNATIONAL';
  state?: string;
  country?: string;
}

export interface BranchUpdateDto {
  branchCode: string;
  name: string;
  region: string;
  type: 'DOMESTIC' | 'INTERNATIONAL';
  state?: string;
  country?: string;
  isActive?: boolean;
}

export interface BranchResponseDto {
  id: number;
  branchCode: string;
  name: string;
  region: string;
  type: 'DOMESTIC' | 'INTERNATIONAL';
  state?: string;
  country?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  users?: BackendUser[];
  manager?: BackendUser;
  userCount: number;
  managerCount: number;
}

export class BranchApiService {
  /**
   * Get all branches (legacy method for compatibility)
   */
  async getBranches(): Promise<BranchResponseDto[]> {
    const response = await api.get('/branches');
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch branches');
  }

  /**
   * Get all branches with pagination
   */
  async getBranchesPaginated(page: number = 0, size: number = 20, sortBy: string = 'name', sortDir: string = 'asc'): Promise<PagedResponse<BranchResponseDto>> {
    const response = await api.get('/branches/paginated', {
      params: { page, size, sortBy, sortDir }
    });
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch branches');
  }

  /**
   * Search branches with pagination
   */
  async searchBranchesPaginated(searchTerm: string, page: number = 0, size: number = 20, sortBy: string = 'name', sortDir: string = 'asc'): Promise<PagedResponse<BranchResponseDto>> {
    const response = await api.get('/branches/paginated/search', {
      params: { q: searchTerm, page, size, sortBy, sortDir }
    });
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to search branches');
  }

  /**
   * Get branch by ID
   */
  async getBranchById(branchId: number): Promise<BranchResponseDto> {
    const response = await api.get(`/branches/${branchId}`);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch branch');
  }

  /**
   * Create a new branch
   */
  async createBranch(branchData: BranchCreateDto): Promise<BranchResponseDto> {
    const response = await api.post('/branches', branchData);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to create branch');
  }

  /**
   * Update an existing branch
   */
  async updateBranch(branchId: number, branchData: BranchUpdateDto): Promise<BranchResponseDto> {
    const response = await api.put(`/branches/${branchId}`, branchData);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to update branch');
  }

  /**
   * Delete a branch
   */
  async deleteBranch(branchId: number): Promise<void> {
    const response = await api.delete(`/branches/${branchId}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete branch');
    }
  }

  /**
   * Get distinct regions
   */
  async getDistinctRegions(): Promise<string[]> {
    const response = await api.get('/branches/regions');
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch regions');
  }

  /**
   * Search branches
   */
  async searchBranches(searchTerm: string): Promise<BranchResponseDto[]> {
    const response = await api.get(`/branches/search?q=${encodeURIComponent(searchTerm)}`);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to search branches');
  }
}

export const branchApiService = new BranchApiService();
