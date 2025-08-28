import { Device, DeviceFilterDTO, PagedResponseDTO, ApiResponseDTO, UploadHistoryItem } from '@/types/device';

// Base API URL - adjust based on your deployment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

class ApiClient {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponseDTO<T>> {
    const url = `${API_BASE_URL}/api${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Device CRUD operations
  async getDevices(filters: DeviceFilterDTO): Promise<ApiResponseDTO<PagedResponseDTO<Device>>> {
    const queryParams = new URLSearchParams();
    
    if (filters.searchTerm) queryParams.append('searchTerm', filters.searchTerm);
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.region) queryParams.append('region', filters.region);
    if (filters.branch) queryParams.append('branch', filters.branch);
    if (filters.warrantyStatus) queryParams.append('warrantyStatus', filters.warrantyStatus);
    
    queryParams.append('page', filters.page.toString());
    queryParams.append('size', filters.size.toString());
    queryParams.append('sortBy', filters.sortBy);
    queryParams.append('sortDirection', filters.sortDirection);

    return this.request<PagedResponseDTO<Device>>(`/devices?${queryParams.toString()}`);
  }

  async getDeviceById(id: number): Promise<ApiResponseDTO<Device>> {
    return this.request<Device>(`/devices/${id}`);
  }

  async getDeviceBySerialNumber(serialNumber: string): Promise<ApiResponseDTO<Device>> {
    return this.request<Device>(`/devices/serial/${serialNumber}`);
  }

  async createDevice(device: Omit<Device, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponseDTO<Device>> {
    return this.request<Device>('/devices', {
      method: 'POST',
      body: JSON.stringify(device),
    });
  }

  async updateDevice(id: number, device: Partial<Device>): Promise<ApiResponseDTO<Device>> {
    return this.request<Device>(`/devices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(device),
    });
  }

  async deleteDevice(id: number): Promise<ApiResponseDTO<void>> {
    return this.request<void>(`/devices/${id}`, {
      method: 'DELETE',
    });
  }

  // File operations
  async importDevices(file: File): Promise<ApiResponseDTO<Device[]>> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/api/devices/import`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to import devices');
    }
    
    return data;
  }

  async exportDevices(): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/api/devices/export`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Failed to export devices');
    }

    return response.blob();
  }

  // Filter options
  async getRegions(): Promise<ApiResponseDTO<string[]>> {
    return this.request<string[]>('/devices/regions');
  }

  async getBranches(): Promise<ApiResponseDTO<string[]>> {
    return this.request<string[]>('/devices/branches');
  }

  // Upload history
  async getUploadHistory(page: number = 0, size: number = 10): Promise<ApiResponseDTO<PagedResponseDTO<UploadHistoryItem>>> {
    return this.request<PagedResponseDTO<UploadHistoryItem>>(`/upload-history?page=${page}&size=${size}`);
  }

  async getUploadHistoryById(id: number): Promise<ApiResponseDTO<UploadHistoryItem>> {
    return this.request<UploadHistoryItem>(`/upload-history/${id}`);
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Helper functions for easier use in components
export const deviceApi = {
  // Get all devices with filtering and pagination
  getAll: (filters: DeviceFilterDTO) => apiClient.getDevices(filters),
  
  // Get single device
  getById: (id: number) => apiClient.getDeviceById(id),
  getBySerial: (serialNumber: string) => apiClient.getDeviceBySerialNumber(serialNumber),
  
  // CRUD operations
  create: (device: Omit<Device, 'id' | 'createdAt' | 'updatedAt'>) => apiClient.createDevice(device),
  update: (id: number, device: Partial<Device>) => apiClient.updateDevice(id, device),
  delete: (id: number) => apiClient.deleteDevice(id),
  
  // File operations
  import: (file: File) => apiClient.importDevices(file),
  export: () => apiClient.exportDevices(),
  
  // Filter options
  getRegions: () => apiClient.getRegions(),
  getBranches: () => apiClient.getBranches(),
};

export const uploadHistoryApi = {
  getAll: (page?: number, size?: number) => apiClient.getUploadHistory(page, size),
  getById: (id: number) => apiClient.getUploadHistoryById(id),
};