import api from './axiosInstance';
import { Campaign } from '../types';

// Campaign API Response interfaces
export interface CampaignResponseDto {
  id: number;
  name: string;
  description: string;
  sector: Campaign['sector'];
  status: Campaign['status'];
  startDate: string;
  endDate?: string;
  targetQRCount: number;
  allocatedQRCount: number;
  issuedQRCount: number;
  targetBranches: string[];
  notes?: string;
  isActive: boolean;
  utilizationRate: number;
  completionRate: number;
  createdByUserId: number;
  createdByUserName: string;
  createdByUserEmail: string;
  updatedByUserId?: number;
  updatedByUserName?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CampaignCreateDto {
  name: string;
  description: string;
  sector: Campaign['sector'];
  startDate: string;
  endDate?: string;
  targetQRCount: number;
  targetBranches: string[];
  notes?: string;
}

export interface CampaignUpdateDto extends CampaignCreateDto {
  status?: Campaign['status'];
  isActive?: boolean;
}

export interface CampaignStatsDto {
  totalCampaigns: number;
  activeCampaigns: number;
  completedCampaigns: number;
  totalTargetQRs: number;
  totalIssuedQRs: number;
}

export interface PaginatedCampaignResponse {
  content: CampaignResponseDto[];
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

// Campaign API service
export const campaignApi = {
  // Get all campaigns with pagination
  getAllCampaigns: async (params?: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
    q?: string;
    sector?: Campaign['sector'];
    status?: Campaign['status'];
  }) => {
    const response = await api.get('/campaigns/paginated', { params });
    return response.data;
  },

  // Get campaign by ID
  getCampaignById: async (campaignId: number) => {
    const response = await api.get(`/campaigns/${campaignId}`);
    return response.data;
  },

  // Create new campaign
  createCampaign: async (campaignData: CampaignCreateDto) => {
    const response = await api.post('/campaigns', campaignData);
    return response.data;
  },

  // Update campaign
  updateCampaign: async (campaignId: number, campaignData: CampaignUpdateDto) => {
    const response = await api.put(`/campaigns/${campaignId}`, campaignData);
    return response.data;
  },

  // Delete campaign
  deleteCampaign: async (campaignId: number) => {
    const response = await api.delete(`/campaigns/${campaignId}`);
    return response.data;
  },

  // Search campaigns
  searchCampaigns: async (params: {
    q?: string;
    sector?: Campaign['sector'];
    status?: Campaign['status'];
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
  }) => {
    const response = await api.get('/campaigns/search', { params });
    return response.data;
  },

  // Get campaigns by sector
  getCampaignsBySector: async (sector: Campaign['sector']) => {
    const response = await api.get(`/campaigns/sector/${sector}`);
    return response.data;
  },

  // Get campaigns by status
  getCampaignsByStatus: async (status: Campaign['status']) => {
    const response = await api.get(`/campaigns/status/${status}`);
    return response.data;
  },

  // Get campaign statistics
  getCampaignStatistics: async () => {
    const response = await api.get('/campaigns/statistics');
    return response.data;
  },

  // Activate campaign
  activateCampaign: async (campaignId: number) => {
    const response = await api.put(`/campaigns/${campaignId}/activate`);
    return response.data;
  },

  // Complete campaign
  completeCampaign: async (campaignId: number) => {
    const response = await api.put(`/campaigns/${campaignId}/complete`);
    return response.data;
  },

  // Get campaign performance data
  getCampaignPerformance: async () => {
    const response = await api.get('/campaigns/performance');
    return response.data;
  },

  // QR Code management for campaigns
  assignQRCodesToCampaign: async (campaignId: number, qrCodeIds: number[]) => {
    const response = await api.post(`/campaigns/${campaignId}/qr-codes`, qrCodeIds);
    return response.data;
  },

  removeQRCodesFromCampaign: async (campaignId: number, qrCodeIds: number[]) => {
    const response = await api.delete(`/campaigns/${campaignId}/qr-codes`, { data: qrCodeIds });
    return response.data;
  },

  getCampaignQRCodes: async (campaignId: number, params?: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
  }) => {
    const response = await api.get(`/campaigns/${campaignId}/qr-codes`, { params });
    return response.data;
  }
};

export default campaignApi;
