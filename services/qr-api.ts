import api from './axiosInstance';
import { QRCode } from '../types';

// Backend response interfaces based on the backend DTOs
export interface QRCodeResponseDto {
  id: number;
  qrValue: string;
  qrType: 'STATIC' | 'DYNAMIC';
  status: 'UNALLOCATED' | 'ALLOCATED' | 'ISSUED' | 'RETURNED' | 'BLOCKED';
  
  // Banking Information
  bankName?: string;
  merchantName?: string;
  merchantId?: string;
  terminalId?: string;
  
  // Branch Information
  allocatedBranchId?: number;
  allocatedBranchName?: string;
  allocatedBranchCode?: string;
  issuedBranchId?: number;
  issuedBranchName?: string;
  issuedBranchCode?: string;
  
  // Merchant Assignment
  issuedToMerchantId?: string;
  issuedToMerchantName?: string;
  
  // Status Information
  isActive: boolean;
  blockedReason?: string;
  blockedAt?: string;
  blockedByUserName?: string;
  returnedReason?: string;
  returnedAt?: string;
  returnedByUserName?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  allocatedAt?: string;
  issuedAt?: string;
  
  // Additional Information
  notes?: string;
  kycVerified?: boolean;
}

export interface QRCodeStatsDto {
  totalQRs: number;
  unallocatedQRs: number;
  allocatedQRs: number;
  issuedQRs: number;
  returnedQRs: number;
  blockedQRs: number;
  staticQRs: number;
  dynamicQRs: number;
  kycVerifiedQRs: number;
}

export interface QRCodeCreateDto {
  count: number;
  type: 'STATIC' | 'DYNAMIC';
  bankName: string;
  merchantName?: string;
  merchantId?: string;
  terminalId?: string;
  branchId?: number;
  autoAssign?: boolean;
  notes?: string;
}

export interface QRCodeUpdateDto {
  merchantId?: string;
  terminalId?: string;
  notes?: string;
  merchantName?: string;
  bankName?: string;
  kycVerified?: boolean;
}

export interface QRCodeAllocationDto {
  qrCodeIds: number[];
  branchId: number;
}

export interface QRCodeIssueDto {
  qrCodeId: number;
  merchantId: string;
  merchantName: string;
  notes?: string;
}

export interface QRCodeBlockDto {
  reason: string;
}

export interface QRCodeReturnDto {
  reason: string;
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

// Transform backend QR data to frontend format
const transformQRCode = (backendQR: QRCodeResponseDto): QRCode => {
  return {
    id: backendQR.id.toString(),
    qrValue: backendQR.qrValue,
    qrType: backendQR.qrType.toLowerCase() as 'static' | 'dynamic',
    generationSource: 'system' as const,
    status: backendQR.status.toLowerCase() as QRCode['status'],
    allocatedBranchId: backendQR.allocatedBranchId?.toString(),
    issuedToMerchantId: backendQR.issuedToMerchantId,
    bankName: backendQR.bankName,
    merchantName: backendQR.merchantName,
    merchantId: backendQR.merchantId,
    terminalId: backendQR.terminalId,
    blockedReason: backendQR.blockedReason,
    blockedAt: backendQR.blockedAt,
    blockedBy: backendQR.blockedByUserName,
    returnedReason: backendQR.returnedReason,
    returnedAt: backendQR.returnedAt,
    returnedBy: backendQR.returnedByUserName,
    createdBy: 'system', // Default value since backend doesn't provide this
    createdAt: backendQR.createdAt,
    updatedAt: backendQR.updatedAt,
  };
};

export class QRCodeApiService {
  private basePath = '/qr-codes';

  // Get all QR codes with pagination
  async getAllQRCodes(
    page: number = 0,
    size: number = 20,
    sortBy: string = 'createdAt',
    sortDir: string = 'desc'
  ): Promise<{ qrCodes: QRCode[]; pagination: any }> {
    try {
      const response = await api.get<ApiResponse<PagedResponse<QRCodeResponseDto>>>(
        `${this.basePath}`,
        {
          params: { page, size, sortBy, sortDir }
        }
      );

      if (response.data.success) {
        const pagedData = response.data.data;
        return {
          qrCodes: pagedData.content.map(transformQRCode),
          pagination: pagedData.pageInfo
        };
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      console.error('Failed to fetch QR codes:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch QR codes');
    }
  }

  // Search QR codes
  async searchQRCodes(
    searchTerm?: string,
    status?: string,
    type?: string,
    page: number = 0,
    size: number = 20,
    sortBy: string = 'createdAt',
    sortDir: string = 'desc'
  ): Promise<{ qrCodes: QRCode[]; pagination: any }> {
    try {
      const params: any = { page, size, sortBy, sortDir };
      if (searchTerm) params.q = searchTerm;
      if (status) params.status = status;
      if (type) params.type = type;

      const response = await api.get<ApiResponse<PagedResponse<QRCodeResponseDto>>>(
        `${this.basePath}/search`,
        { params }
      );

      if (response.data.success) {
        const pagedData = response.data.data;
        return {
          qrCodes: pagedData.content.map(transformQRCode),
          pagination: pagedData.pageInfo
        };
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      console.error('Failed to search QR codes:', error);
      throw new Error(error.response?.data?.message || 'Failed to search QR codes');
    }
  }

  // Get QR code by ID
  async getQRCodeById(qrCodeId: string | number): Promise<QRCode> {
    try {
      const response = await api.get<ApiResponse<QRCodeResponseDto>>(
        `${this.basePath}/${qrCodeId}`
      );

      if (response.data.success) {
        return transformQRCode(response.data.data);
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      console.error('Failed to fetch QR code:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch QR code');
    }
  }

  // Generate QR codes
  async generateQRCodes(createData: QRCodeCreateDto): Promise<QRCode[]> {
    try {
      const response = await api.post<ApiResponse<QRCodeResponseDto[]>>(
        `${this.basePath}/generate`,
        createData
      );

      if (response.data.success) {
        return response.data.data.map(transformQRCode);
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      console.error('Failed to generate QR codes:', error);
      throw new Error(error.response?.data?.message || 'Failed to generate QR codes');
    }
  }

  // Upload QR codes from CSV
  async uploadQRCodes(file: File): Promise<QRCode[]> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post<ApiResponse<QRCodeResponseDto[]>>(
        `${this.basePath}/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success) {
        return response.data.data.map(transformQRCode);
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      console.error('Failed to upload QR codes:', error);
      throw new Error(error.response?.data?.message || 'Failed to upload QR codes');
    }
  }

  // Update QR code
  async updateQRCode(qrCodeId: string | number, updateData: QRCodeUpdateDto): Promise<QRCode> {
    try {
      const response = await api.put<ApiResponse<QRCodeResponseDto>>(
        `${this.basePath}/${qrCodeId}`,
        updateData
      );

      if (response.data.success) {
        return transformQRCode(response.data.data);
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      console.error('Failed to update QR code:', error);
      throw new Error(error.response?.data?.message || 'Failed to update QR code');
    }
  }

  // Allocate QR codes to branch
  async allocateQRsToBranch(qrCodeIds: (string | number)[], branchId: string | number): Promise<QRCode[]> {
    try {
      const allocationData: QRCodeAllocationDto = {
        qrCodeIds: qrCodeIds.map(id => Number(id)),
        branchId: Number(branchId)
      };

      const response = await api.post<ApiResponse<QRCodeResponseDto[]>>(
        `${this.basePath}/allocate`,
        allocationData
      );

      if (response.data.success) {
        return response.data.data.map(transformQRCode);
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      console.error('Failed to allocate QR codes:', error);
      throw new Error(error.response?.data?.message || 'Failed to allocate QR codes');
    }
  }

  // Issue QR code to merchant
  async issueQRToMerchant(issueData: QRCodeIssueDto): Promise<QRCode> {
    try {
      const response = await api.post<ApiResponse<QRCodeResponseDto>>(
        `${this.basePath}/issue`,
        issueData
      );

      if (response.data.success) {
        return transformQRCode(response.data.data);
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      console.error('Failed to issue QR code:', error);
      throw new Error(error.response?.data?.message || 'Failed to issue QR code');
    }
  }

  // Block QR code
  async blockQRCode(qrCodeId: string | number, reason: string): Promise<QRCode> {
    try {
      const blockData: QRCodeBlockDto = { reason };

      const response = await api.post<ApiResponse<QRCodeResponseDto>>(
        `${this.basePath}/${qrCodeId}/block`,
        blockData
      );

      if (response.data.success) {
        return transformQRCode(response.data.data);
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      console.error('Failed to block QR code:', error);
      throw new Error(error.response?.data?.message || 'Failed to block QR code');
    }
  }

  // Unblock QR code (optional reason)
  async unblockQRCode(qrCodeId: string | number, reason?: string): Promise<QRCode> {
    try {
      const body = reason ? { reason } : undefined;
      const response = await api.post<ApiResponse<QRCodeResponseDto>>(
        `${this.basePath}/${qrCodeId}/unblock`,
        body
      );

      if (response.data.success) {
        return transformQRCode(response.data.data);
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      console.error('Failed to unblock QR code:', error);
      throw new Error(error.response?.data?.message || 'Failed to unblock QR code');
    }
  }

  // Return QR code from merchant
  async returnQRCode(qrCodeId: string | number, reason: string): Promise<QRCode> {
    try {
      const returnData: QRCodeReturnDto = { reason };

      const response = await api.post<ApiResponse<QRCodeResponseDto>>(
        `${this.basePath}/${qrCodeId}/return`,
        returnData
      );

      if (response.data.success) {
        return transformQRCode(response.data.data);
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      console.error('Failed to return QR code:', error);
      throw new Error(error.response?.data?.message || 'Failed to return QR code');
    }
  }

  // Get QR code statistics
  async getQRCodeStats(): Promise<QRCodeStatsDto> {
    try {
      const response = await api.get<ApiResponse<QRCodeStatsDto>>(
        `${this.basePath}/stats`
      );

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      console.error('Failed to fetch QR code stats:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch QR code stats');
    }
  }

  // Get unallocated QR codes
  async getUnallocatedQRCodes(
    page: number = 0,
    size: number = 20,
    sortBy: string = 'createdAt',
    sortDir: string = 'desc'
  ): Promise<{ qrCodes: QRCode[]; pagination: any }> {
    try {
      const response = await api.get<ApiResponse<PagedResponse<QRCodeResponseDto>>>(
        `${this.basePath}/unallocated`,
        {
          params: { page, size, sortBy, sortDir }
        }
      );

      if (response.data.success) {
        const pagedData = response.data.data;
        return {
          qrCodes: pagedData.content.map(transformQRCode),
          pagination: pagedData.pageInfo
        };
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      console.error('Failed to fetch unallocated QR codes:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch unallocated QR codes');
    }
  }

  // Get allocated QR codes
  async getAllocatedQRCodes(
    page: number = 0,
    size: number = 20,
    sortBy: string = 'createdAt',
    sortDir: string = 'desc'
  ): Promise<{ qrCodes: QRCode[]; pagination: any }> {
    try {
      const response = await api.get<ApiResponse<PagedResponse<QRCodeResponseDto>>>(
        `${this.basePath}/allocated`,
        {
          params: { page, size, sortBy, sortDir }
        }
      );

      if (response.data.success) {
        const pagedData = response.data.data;
        return {
          qrCodes: pagedData.content.map(transformQRCode),
          pagination: pagedData.pageInfo
        };
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      console.error('Failed to fetch allocated QR codes:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch allocated QR codes');
    }
  }

  // Get issued QR codes
  async getIssuedQRCodes(
    page: number = 0,
    size: number = 20,
    sortBy: string = 'createdAt',
    sortDir: string = 'desc'
  ): Promise<{ qrCodes: QRCode[]; pagination: any }> {
    try {
      const response = await api.get<ApiResponse<PagedResponse<QRCodeResponseDto>>>(
        `${this.basePath}/issued`,
        {
          params: { page, size, sortBy, sortDir }
        }
      );

      if (response.data.success) {
        const pagedData = response.data.data;
        return {
          qrCodes: pagedData.content.map(transformQRCode),
          pagination: pagedData.pageInfo
        };
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      console.error('Failed to fetch issued QR codes:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch issued QR codes');
    }
  }

  // Get blocked QR codes
  async getBlockedQRCodes(
    page: number = 0,
    size: number = 20,
    sortBy: string = 'createdAt',
    sortDir: string = 'desc'
  ): Promise<{ qrCodes: QRCode[]; pagination: any }> {
    try {
      const response = await api.get<ApiResponse<PagedResponse<QRCodeResponseDto>>>(
        `${this.basePath}/blocked`,
        {
          params: { page, size, sortBy, sortDir }
        }
      );

      if (response.data.success) {
        const pagedData = response.data.data;
        return {
          qrCodes: pagedData.content.map(transformQRCode),
          pagination: pagedData.pageInfo
        };
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      console.error('Failed to fetch blocked QR codes:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch blocked QR codes');
    }
  }

  // Get QR codes by type
  async getQRCodesByType(
    type: 'static' | 'dynamic',
    page: number = 0,
    size: number = 20,
    sortBy: string = 'createdAt',
    sortDir: string = 'desc'
  ): Promise<{ qrCodes: QRCode[]; pagination: any }> {
    try {
      const response = await api.get<ApiResponse<PagedResponse<QRCodeResponseDto>>>(
        `${this.basePath}/by-type/${type}`,
        {
          params: { page, size, sortBy, sortDir }
        }
      );

      if (response.data.success) {
        const pagedData = response.data.data;
        return {
          qrCodes: pagedData.content.map(transformQRCode),
          pagination: pagedData.pageInfo
        };
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      console.error('Failed to fetch QR codes by type:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch QR codes by type');
    }
  }
}

// Export singleton instance
export const qrCodeApiService = new QRCodeApiService();
export default qrCodeApiService;
