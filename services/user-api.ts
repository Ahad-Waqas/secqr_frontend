import api from './axiosInstance';

// Backend User interface
export interface BackendUser {
  id: number;
  name: string;
  email: string;
  role: string;
  enabled: boolean;
  branchId?: number;
  createdAt: string;
}

// Paginated response interface
export interface PaginatedUserResponse {
  content: BackendUser[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// User creation/update DTO
export interface UserCreateDto {
  name: string;
  email: string;
  password: string;
  role: string;
  branchId?: number;
}

export interface UserUpdateDto {
  name: string;
  email: string;
  password?: string;
  role: string;
  branchId?: number;
}

export interface PagedRequest {
  page: number;
  size: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  search?: string;
  role?: string;
  status?: string;
  branchId?: string;
}

class UserApiService {
  // Get paginated users
  async getUsersPaginated(params: PagedRequest): Promise<PaginatedUserResponse> {
    const response = await api.get('/users/paginated', { params });
    
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error('Invalid response format');
  }

  // Create user
  async createUser(userData: UserCreateDto): Promise<BackendUser> {
    const response = await api.post('/users', userData);
    
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error('Failed to create user');
  }

  // Update user
  async updateUser(userId: number, userData: UserUpdateDto): Promise<BackendUser> {
    const response = await api.put(`/users/${userId}`, userData);
    
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error('Failed to update user');
  }

  // Delete user
  async deleteUser(userId: number): Promise<void> {
    await api.delete(`/users/${userId}`);
  }

  // Enable/Disable user
  async toggleUserStatus(userId: number, enable: boolean): Promise<void> {
    const endpoint = enable ? `/users/${userId}/enable` : `/users/${userId}/disable`;
    await api.put(endpoint);
  }

  // Reset password
  async resetPassword(email: string, newPassword: string): Promise<void> {
    await api.post('/users/reset-password', { 
      email, 
      newPassword 
    });
  }

  // Get all users (legacy method for compatibility)
  async getUsers(): Promise<BackendUser[]> {
    const response = await api.get('/users');
    
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }
    
    return [];
  }
}

export const userApiService = new UserApiService();
export default userApiService;
