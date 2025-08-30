import React, { useState, useEffect } from 'react';
import { 
  QrCode, Plus, Upload, Download, Search, Filter, 
  Eye, Printer, Edit, Trash2, AlertTriangle, CheckCircle,
  Building, Store, Hash, Terminal, FileText
} from 'lucide-react';
import { User, QRCode } from '../types';
import { qrCodeApiService, QRCodeCreateDto, QRCodeUpdateDto, QRCodeStatsDto } from '../services/qr-api';
import { branchApiService, BranchResponseDto } from '../services/branch-api';
import { toast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Utility function for handling API errors
const handleApiError = (error: any, defaultMessage: string): string => {
  console.error('API Error:', error);
  
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.message) {
    return error.message;
  }
  return defaultMessage;
};

interface QRManagementProps {
  user: User;
}

const QRManagement: React.FC<QRManagementProps> = ({ user }) => {
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [stats, setStats] = useState<QRCodeStatsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showQRDetailsDialog, setShowQRDetailsDialog] = useState(false);
  const [selectedQR, setSelectedQR] = useState<QRCode | null>(null);
  const [filters, setFilters] = useState({ search: '', status: '', type: '' });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  
  // Generate form state
  const [generateForm, setGenerateForm] = useState({
    count: 10,
    type: 'STATIC' as 'STATIC' | 'DYNAMIC',
    branchId: '',
    autoAssign: false,
    bankName: 'Demo Bank Ltd.',
    merchantName: '',
    merchantId: '',
    terminalId: '',
    notes: ''
  });
  const [generating, setGenerating] = useState(false);
  
  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    merchantId: '',
    terminalId: '',
    notes: '',
    merchantName: '',
    bankName: '',
    branchId: '',
    kycVerified: false
  });
  const [updating, setUpdating] = useState(false);

  // Assign form state
  const [assignForm, setAssignForm] = useState({
    branchId: '',
    merchantId: '',
    terminalId: '',
    notes: '',
    merchantName: '',
    bankName: '',
  });
  const [assigning, setAssigning] = useState(false);

  const [branches, setBranches] = useState<BranchResponseDto[]>([]);

  const canManageQRs = user.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (canManageQRs) {
      loadQRCodes();
      loadBranches();
      loadStats();
    }
  }, [canManageQRs, currentPage, pageSize, filters]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (canManageQRs) {
        loadQRCodes();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [filters.search]);

  const loadQRCodes = async () => {
    setLoading(true);
    try {
      let result;
      
      if (filters.search || filters.status || filters.type) {
        // Use search API when filters are applied
        result = await qrCodeApiService.searchQRCodes(
          filters.search || undefined,
          filters.status || undefined,
          filters.type ? filters.type.toUpperCase() : undefined,
          currentPage,
          pageSize
        );
      } else {
        // Use regular get all API
        result = await qrCodeApiService.getAllQRCodes(currentPage, pageSize);
      }
      
      setQrCodes(result.qrCodes);
      setTotalPages(result.pagination.totalPages);
      setTotalElements(result.pagination.totalElements);
    } catch (error) {
      console.error('Failed to load QR codes:', error);
      const errorMessage = handleApiError(error, 'Failed to load QR codes');
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadBranches = async () => {
    try {
      const data = await branchApiService.getBranches();
      setBranches(data);
    } catch (error) {
      console.error('Failed to load branches:', error);
      const errorMessage = handleApiError(error, 'Failed to load branches');
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await qrCodeApiService.getQRCodeStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load QR stats:', error);
    }
  };
  const handleGenerateQRs = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    
    try {
      const createData: QRCodeCreateDto = {
        count: generateForm.count,
        type: generateForm.type,
        bankName: generateForm.bankName,
        merchantName: generateForm.merchantName,
        merchantId: generateForm.merchantId,
        terminalId: generateForm.terminalId || undefined,
        branchId: generateForm.autoAssign && generateForm.branchId ? Number(generateForm.branchId) : undefined,
        autoAssign: generateForm.autoAssign,
        notes: generateForm.notes || undefined
      };

      const newQRs = await qrCodeApiService.generateQRCodes(createData);
      
      setShowGenerateModal(false);
      resetGenerateForm();
      loadQRCodes();
      loadStats();
      toast({
        title: "Success",
        description: `Successfully generated ${newQRs.length} QR codes`,
      });
    } catch (error) {
      console.error('Failed to generate QR codes:', error);
      const errorMessage = handleApiError(error, 'Failed to generate QR codes');
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleUploadQRs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;
    
    setUploading(true);
    try {
      const uploadedQRs = await qrCodeApiService.uploadQRCodes(uploadFile);
      setShowUploadModal(false);
      setUploadFile(null);
      loadQRCodes();
      loadStats();
      toast({
        title: "Success",
        description: `Successfully uploaded ${uploadedQRs.length} QR codes`,
      });
    } catch (error) {
      console.error('Failed to upload QR codes:', error);
      const errorMessage = handleApiError(error, 'Failed to upload QR codes');
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateQR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQR) return;
    
    setUpdating(true);
    try {
      // If branch is changed, allocate QR to new branch
      if (editForm.branchId && editForm.branchId !== selectedQR.allocatedBranchId?.toString()) {
        await qrCodeApiService.allocateQRsToBranch([selectedQR.id], Number(editForm.branchId));
      }
      
      // Update other QR details
      const updateData: QRCodeUpdateDto = {
        merchantId: editForm.merchantId || undefined,
        terminalId: editForm.terminalId || undefined,
        notes: editForm.notes || undefined,
        merchantName: editForm.merchantName || undefined,
        bankName: editForm.bankName || undefined,
        kycVerified: editForm.kycVerified
      };

      await qrCodeApiService.updateQRCode(selectedQR.id, updateData);
      setShowEditModal(false);
      setSelectedQR(null);
      resetEditForm();
      loadQRCodes();
      loadStats();
      toast({
        title: "Success",
        description: "QR code updated successfully",
      });
    } catch (error) {
      console.error('Failed to update QR code:', error);
      const errorMessage = handleApiError(error, 'Failed to update QR code');
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handlePrintQR = (qr: QRCode) => {
    // Check if QR is issued to a merchant and verify KYC status
    if (qr.issuedToMerchantId) {
      // In a real system, we would fetch merchant data here
      // For demo, we'll assume issued QRs have verified merchants
      // But we'll add a visual indicator in the print
    }
    
    // Create QR code data URL using the actual QR value
    const qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qr.qrValue)}`;
    
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${qr.qrValue}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px; 
              margin: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            .qr-container {
              border: 2px solid #333;
              padding: 30px;
              text-align: center;
              background: white;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              max-width: 400px;
            }
            .header { 
              margin-bottom: 20px; 
              border-bottom: 1px solid #ddd;
              padding-bottom: 15px;
            }
            .qr-code { 
              margin: 20px 0; 
            }
            .qr-code img {
              border: 1px solid #ddd;
              padding: 10px;
              background: white;
            }
            .details { 
              text-align: left;
              margin-top: 20px;
              border-top: 1px solid #ddd;
              padding-top: 15px;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
              padding: 4px 0;
            }
            .label { 
              font-weight: bold; 
              color: #333;
            }
            .value { 
              color: #666; 
            }
            .kyc-status {
              color: #10B981;
              font-weight: bold;
            }
            h1 { 
              color: #2563eb; 
              margin: 0 0 10px 0;
              font-size: 24px;
            }
            h2 { 
              color: #666; 
              margin: 0;
              font-size: 16px;
              font-weight: normal;
            }
            @media print {
              body { margin: 0; padding: 20px; }
              .qr-container { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="header">
              <h1>QR Code</h1>
              <h2>${qr.bankName || 'Demo Bank Ltd.'}</h2>
            </div>
            
            <div class="qr-code">
              <img src="${qrDataUrl}" alt="QR Code" width="200" height="200" />
            </div>
            
            <div class="details">
              <div class="detail-row">
                <span class="label">QR Value:</span>
                <span class="value">${qr.qrValue}</span>
              </div>
              <div class="detail-row">
                <span class="label">Type:</span>
                <span class="value">${qr.qrType.toUpperCase()}</span>
              </div>
              <div class="detail-row">
                <span class="label">Status:</span>
                <span class="value">${qr.status.toUpperCase()}</span>
              </div>
              ${qr.issuedToMerchantId ? `
              <div class="detail-row">
                <span class="label">KYC Status:</span>
                <span class="value kyc-status">VERIFIED ✓</span>
              </div>
              ` : ''}
              ${qr.bankName ? `
              <div class="detail-row">
                <span class="label">Bank Name:</span>
                <span class="value">${qr.bankName}</span>
              </div>
              ` : ''}
              ${qr.merchantName ? `
              <div class="detail-row">
                <span class="label">Merchant Name:</span>
                <span class="value">${qr.merchantName}</span>
              </div>
              ` : ''}
              ${qr.merchantId ? `
              <div class="detail-row">
                <span class="label">Merchant ID:</span>
                <span class="value">${qr.merchantId}</span>
              </div>
              ` : ''}
              ${qr.terminalId ? `
              <div class="detail-row">
                <span class="label">Terminal ID:</span>
                <span class="value">${qr.terminalId}</span>
              </div>
              ` : ''}
              <div class="detail-row">
                <span class="label">Generated:</span>
                <span class="value">${new Date(qr.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // Wait for image to load then print
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 1000);
    }
  };

  const handleBlockQR = async (qrId: string) => {
    const reason = prompt('Please provide a reason for blocking this QR code:');
    if (!reason) return;
    
    try {
      await qrCodeApiService.blockQRCode(qrId, reason);
      loadQRCodes();
      loadStats();
      toast({
        title: "Success",
        description: "QR code blocked successfully",
      });
    } catch (error) {
      console.error('Failed to block QR code:', error);
      const errorMessage = handleApiError(error, 'Failed to block QR code');
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleUnblockQR = async (qrId: string) => {
    // Ask for an optional reason for audit purposes
    const reason = prompt('Please provide a reason for unblocking this QR code (optional):');
    try {
      await qrCodeApiService.unblockQRCode(qrId, reason || undefined);
      loadQRCodes();
      loadStats();
      toast({
        title: "Success",
        description: "QR code unblocked successfully",
      });
    } catch (error) {
      console.error('Failed to unblock QR code:', error);
      const errorMessage = handleApiError(error, 'Failed to unblock QR code');
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleAssignQR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQR) return;
    
    setAssigning(true);
    try {
      // Use the allocate API to assign QR to branch - fix parameter order
      await qrCodeApiService.allocateQRsToBranch([selectedQR.id], Number(assignForm.branchId));
      
      // If merchant details are provided, also update the QR
      if (assignForm.merchantId || assignForm.merchantName || assignForm.terminalId || assignForm.notes || assignForm.bankName) {
        const updateData: QRCodeUpdateDto = {
          merchantId: assignForm.merchantId || undefined,
          terminalId: assignForm.terminalId || undefined,
          notes: assignForm.notes || undefined,
          merchantName: assignForm.merchantName || undefined,
          bankName: assignForm.bankName || undefined,
          kycVerified: false
        };
        await qrCodeApiService.updateQRCode(selectedQR.id, updateData);
      }
      
      setShowAssignModal(false);
      setSelectedQR(null);
      resetAssignForm();
      loadQRCodes();
      loadStats();
      toast({
        title: "Success",
        description: "QR code assigned successfully",
      });
    } catch (error) {
      console.error('Failed to assign QR code:', error);
      const errorMessage = handleApiError(error, 'Failed to assign QR code');
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setAssigning(false);
    }
  };

  const showQRDetails = (qr: QRCode) => {
    setSelectedQR(qr);
    setShowQRDetailsDialog(true);
  };

  const resetAssignForm = () => {
    setAssignForm({
      branchId: '',
      merchantId: '',
      terminalId: '',
      notes: '',
      merchantName: '',
      bankName: '',
    });
  };

  const openAssignModal = (qr: QRCode) => {
    setSelectedQR(qr);
    setAssignForm({
      branchId: '',
      merchantId: qr.merchantId || '',
      terminalId: qr.terminalId || '',
      notes: qr.notes || '',
      merchantName: qr.merchantName || '',
      bankName: qr.bankName || '',
    });
    setShowAssignModal(true);
  };

  const resetGenerateForm = () => {
    setGenerateForm({
      count: 10,
      type: 'STATIC',
      branchId: '',
      autoAssign: false,
      bankName: 'Demo Bank Ltd.',
      merchantName: '',
      merchantId: '',
      terminalId: '',
      notes: ''
    });
  };

  const resetEditForm = () => {
    setEditForm({
      merchantId: '',
      terminalId: '',
      notes: '',
      merchantName: '',
      bankName: '',
      branchId: '',
      kycVerified: false
    });
  };

  const openEditModal = (qr: QRCode) => {
    setSelectedQR(qr);
    setEditForm({
      merchantId: qr.merchantId || '',
      terminalId: qr.terminalId || '',
      notes: qr.notes || '',
      merchantName: qr.merchantName || '',
      bankName: qr.bankName || '',
      branchId: qr.allocatedBranchId?.toString() || '',
      kycVerified: false // Will be updated based on backend data
    });
    setShowEditModal(true);
  };

  // Helper function to handle filter changes
  const handleFilterChange = (filterType: string, value: string) => {
    setFilters({ ...filters, [filterType]: value });
    setCurrentPage(0); // Reset to first page when filter changes
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      unallocated: 'bg-gray-100 text-gray-700 border-gray-200',
      allocated: 'bg-blue-100 text-blue-700 border-blue-200',
      issued: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      returned: 'bg-amber-100 text-amber-700 border-amber-200',
      blocked: 'bg-red-100 text-red-700 border-red-200'
    };
    
    const icons = {
      unallocated: QrCode,
      allocated: Building,
      issued: CheckCircle,
      returned: AlertTriangle,
      blocked: Trash2
    };
    
    const Icon = icons[status as keyof typeof icons];
    
    return (
      <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full border ${styles[status as keyof typeof styles]}`}>
        <Icon className="h-3 w-3" />
        <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
      </span>
    );
  };

  if (!canManageQRs) {
    return (
      <div className="text-center py-12">
        <QrCode className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">You don't have permission to manage QR codes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">QR Code Management</h1>
          <p className="text-gray-600">Generate, upload, and manage QR codes</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Upload className="h-4 w-4" />
            <span>Upload QRs</span>
          </button>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800"
          >
            <Plus className="h-4 w-4" />
            <span>Generate QRs</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <QrCode className="h-8 w-8 text-blue-600 bg-blue-100 rounded-lg p-2" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalQRs || 0}</p>
              <p className="text-sm text-gray-600">Total QRs</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <Building className="h-8 w-8 text-gray-600 bg-gray-100 rounded-lg p-2" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.unallocatedQRs || 0}</p>
              <p className="text-sm text-gray-600">Unallocated</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <Building className="h-8 w-8 text-blue-600 bg-blue-100 rounded-lg p-2" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.allocatedQRs || 0}</p>
              <p className="text-sm text-gray-600">Allocated</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-8 w-8 text-emerald-600 bg-emerald-100 rounded-lg p-2" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.issuedQRs || 0}</p>
              <p className="text-sm text-gray-600">Issued</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-8 w-8 text-red-600 bg-red-100 rounded-lg p-2" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.blockedQRs || 0}</p>
              <p className="text-sm text-gray-600">Blocked</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search QR codes..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
              />
            </div>
          </div>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="unallocated">Unallocated</option>
            <option value="allocated">Allocated</option>
            <option value="issued">Issued</option>
            <option value="returned">Returned</option>
            <option value="blocked">Blocked</option>
          </select>
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            <option value="static">Static</option>
            <option value="dynamic">Dynamic</option>
          </select>
        </div>
      </div>

      {/* QR Codes Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      QR Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Banking Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Branch
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {qrCodes.map((qr) => (
                    <tr key={qr.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => showQRDetails(qr)}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <QrCode className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{qr.qrValue}</div>
                            <div className="text-sm text-gray-500">ID: {qr.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {qr.bankName && (
                            <div className="flex items-center space-x-1 mb-1">
                              <Building className="h-3 w-3 text-gray-400" />
                              <span>{qr.bankName}</span>
                            </div>
                          )}
                          {qr.merchantName && (
                            <div className="flex items-center space-x-1 mb-1">
                              <Store className="h-3 w-3 text-gray-400" />
                              <span>{qr.merchantName}</span>
                            </div>
                          )}
                          {qr.merchantId && (
                            <div className="flex items-center space-x-1 mb-1">
                              <Hash className="h-3 w-3 text-gray-400" />
                              <span>{qr.merchantId}</span>
                            </div>
                          )}
                          {qr.terminalId && (
                            <div className="flex items-center space-x-1">
                              <Terminal className="h-3 w-3 text-gray-400" />
                              <span>{qr.terminalId}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 capitalize">{qr.qrType}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(qr.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {qr.allocatedBranchId || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(qr.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                          {qr.status === 'unallocated' && (
                            <button
                              onClick={() => openAssignModal(qr)}
                              className="text-green-600 hover:text-green-900"
                              title="Assign QR Code to Branch"
                            >
                              <Building className="h-4 w-4" />
                            </button>
                          )}
                          {qr.status !== 'blocked' ? (
                            <>
                              <button
                                onClick={() => handlePrintQR(qr)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Print QR Code"
                              >
                                <Printer className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => openEditModal(qr)}
                                className="text-indigo-600 hover:text-indigo-900"
                                title="Edit QR Code"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleBlockQR(qr.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Block QR Code"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleUnblockQR(qr.id)}
                                className="text-emerald-600 hover:text-emerald-900"
                                title="Unblock QR Code"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => openEditModal(qr)}
                                className="text-indigo-600 hover:text-indigo-900"
                                title="Edit QR Code"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {qrCodes.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex justify-center">
                  <nav className="inline-flex items-center space-x-1">
                    <button
                      onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                      disabled={currentPage === 0}
                      className="inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 7) {
                        pageNum = i;
                      } else if (currentPage < 3) {
                        pageNum = i;
                      } else if (currentPage > totalPages - 4) {
                        pageNum = totalPages - 7 + i;
                      } else {
                        pageNum = currentPage - 3 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`inline-flex items-center px-4 py-2 text-sm font-medium border ${
                            currentPage === pageNum
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum + 1}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                      disabled={currentPage >= totalPages - 1}
                      className="inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
                
                {/* Page Size Selector */}
                <div className="flex justify-center mt-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-700">Rows per page:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(0); // Reset to first page when page size changes
                      }}
                      className="border border-gray-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>
                
                {/* Results info */}
                <div className="flex justify-center mt-2">
                  <span className="text-sm text-gray-700">
                    Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, totalElements)} of {totalElements} QR codes
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Generate QR Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Generate QR Codes</h2>
            <form onSubmit={handleGenerateQRs} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of QR Codes
                </label>
                <input
                  type="number"
                  value={generateForm.count}
                  onChange={(e) => setGenerateForm({ ...generateForm, count: Number(e.target.value) })}
                  min="1"
                  max="1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">QR Type</label>
                <select
                  value={generateForm.type}
                  onChange={(e) => setGenerateForm({ ...generateForm, type: e.target.value as 'STATIC' | 'DYNAMIC' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="STATIC">Static</option>
                  <option value="DYNAMIC">Dynamic</option>
                </select>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Banking Information</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bank Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={generateForm.bankName}
                      onChange={(e) => setGenerateForm({ ...generateForm, bankName: e.target.value })}
                      placeholder="e.g., Demo Bank Ltd."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Merchant Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={generateForm.merchantName}
                      onChange={(e) => setGenerateForm({ ...generateForm, merchantName: e.target.value })}
                      placeholder="e.g., Coffee Corner"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Merchant ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={generateForm.merchantId}
                      onChange={(e) => setGenerateForm({ ...generateForm, merchantId: e.target.value })}
                      placeholder="e.g., MCH001"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Terminal ID <span className="text-gray-500">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={generateForm.terminalId}
                      onChange={(e) => setGenerateForm({ ...generateForm, terminalId: e.target.value })}
                      placeholder="e.g., T001"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes <span className="text-gray-500">(Optional)</span>
                    </label>
                    <textarea
                      value={generateForm.notes}
                      onChange={(e) => setGenerateForm({ ...generateForm, notes: e.target.value })}
                      placeholder="Add any additional notes..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Branch Assignment</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="autoAssign"
                      checked={generateForm.autoAssign}
                      onChange={(e) => setGenerateForm({ ...generateForm, autoAssign: e.target.checked })}
                      className="mr-2"
                    />
                    <label htmlFor="autoAssign" className="text-sm text-gray-700">
                      Auto-assign QR codes to branch
                    </label>
                  </div>
                  
                  {generateForm.autoAssign && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Branch <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={generateForm.branchId}
                        onChange={(e) => setGenerateForm({ ...generateForm, branchId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required={generateForm.autoAssign}
                      >
                        <option value="">Choose a branch...</option>
                        {branches.map(branch => (
                          <option key={branch.id} value={branch.id}>
                            {branch.name} ({branch.branchCode})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowGenerateModal(false);
                    resetGenerateForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="flex-1 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:opacity-50"
                >
                  {generating ? 'Generating...' : 'Generate QRs'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload QR Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Upload QR Codes</h2>
            <form onSubmit={handleUploadQRs} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select CSV File
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Upload a CSV file with QR code data
                </p>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !uploadFile}
                  className="flex-1 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit QR Modal */}
      {showEditModal && selectedQR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Edit QR Code: {selectedQR.qrValue}
            </h2>
            <form onSubmit={handleUpdateQR} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={editForm.bankName}
                  onChange={(e) => setEditForm({ ...editForm, bankName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigned Branch
                </label>
                <select
                  value={editForm.branchId}
                  onChange={(e) => setEditForm({ ...editForm, branchId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">No Branch Assigned</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name} ({branch.branchCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Merchant Name
                </label>
                <input
                  type="text"
                  value={editForm.merchantName}
                  onChange={(e) => setEditForm({ ...editForm, merchantName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Merchant ID
                </label>
                <input
                  type="text"
                  value={editForm.merchantId}
                  onChange={(e) => setEditForm({ ...editForm, merchantId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Terminal ID
                </label>
                <input
                  type="text"
                  value={editForm.terminalId}
                  onChange={(e) => setEditForm({ ...editForm, terminalId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="kycVerified"
                  checked={editForm.kycVerified}
                  onChange={(e) => setEditForm({ ...editForm, kycVerified: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="kycVerified" className="text-sm text-gray-700">
                  KYC Verified
                </label>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedQR(null);
                    resetEditForm();
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
                  {updating ? 'Updating...' : 'Update QR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign QR Modal */}
      {showAssignModal && selectedQR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Assign QR Code: {selectedQR.qrValue}
            </h2>
            <form onSubmit={handleAssignQR} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign to Branch <span className="text-red-500">*</span>
                </label>
                <select
                  value={assignForm.branchId}
                  onChange={(e) => setAssignForm({ ...assignForm, branchId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Choose a branch...</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name} ({branch.branchCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Merchant Information (Optional)</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={assignForm.bankName}
                      onChange={(e) => setAssignForm({ ...assignForm, bankName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Merchant Name
                    </label>
                    <input
                      type="text"
                      value={assignForm.merchantName}
                      onChange={(e) => setAssignForm({ ...assignForm, merchantName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Merchant ID
                    </label>
                    <input
                      type="text"
                      value={assignForm.merchantId}
                      onChange={(e) => setAssignForm({ ...assignForm, merchantId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Terminal ID
                    </label>
                    <input
                      type="text"
                      value={assignForm.terminalId}
                      onChange={(e) => setAssignForm({ ...assignForm, terminalId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={assignForm.notes}
                      onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedQR(null);
                    resetAssignForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {assigning ? 'Assigning...' : 'Assign QR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Details Alert Dialog */}
      <AlertDialog open={showQRDetailsDialog} onOpenChange={setShowQRDetailsDialog}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <QrCode className="h-5 w-5 text-blue-600" />
              <span>QR Code Details</span>
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                {selectedQR && (
                  <>
                    {/* QR Code Image */}
                    <div className="flex justify-center py-4 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(selectedQR.qrValue)}`}
                          alt="QR Code"
                          className="w-48 h-48 border border-gray-200 rounded-lg bg-white p-2 mx-auto"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fallback = document.createElement('div');
                            fallback.className = 'w-48 h-48 border border-gray-200 rounded-lg bg-white p-2 mx-auto flex items-center justify-center text-gray-500';
                            fallback.innerHTML = '<span>QR Code Preview<br/>Not Available</span>';
                            target.parentNode?.appendChild(fallback);
                          }}
                        />
                        <p className="text-xs text-gray-500 mt-2">Scan to view QR content</p>
                      </div>
                    </div>
                    
                    {/* QR Details */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="font-medium text-gray-700">QR Value:</div>
                      <div className="text-gray-900 break-all">{selectedQR.qrValue}</div>
                      
                      <div className="font-medium text-gray-700">ID:</div>
                      <div className="text-gray-900">{selectedQR.id}</div>
                      
                      <div className="font-medium text-gray-700">Type:</div>
                      <div className="text-gray-900 capitalize">{selectedQR.qrType}</div>
                      
                      <div className="font-medium text-gray-700">Status:</div>
                      <div>{getStatusBadge(selectedQR.status)}</div>
                      
                      {selectedQR.bankName && (
                        <>
                          <div className="font-medium text-gray-700">Bank:</div>
                          <div className="text-gray-900">{selectedQR.bankName}</div>
                        </>
                      )}
                      
                      {selectedQR.merchantName && (
                        <>
                          <div className="font-medium text-gray-700">Merchant:</div>
                          <div className="text-gray-900">{selectedQR.merchantName}</div>
                        </>
                      )}
                      
                      {selectedQR.merchantId && (
                        <>
                          <div className="font-medium text-gray-700">Merchant ID:</div>
                          <div className="text-gray-900">{selectedQR.merchantId}</div>
                        </>
                      )}
                      
                      {selectedQR.terminalId && (
                        <>
                          <div className="font-medium text-gray-700">Terminal ID:</div>
                          <div className="text-gray-900">{selectedQR.terminalId}</div>
                        </>
                      )}
                      
                      <div className="font-medium text-gray-700">Branch:</div>
                      <div className="text-gray-900">{selectedQR.allocatedBranchId || 'Not Assigned'}</div>
                      
                      <div className="font-medium text-gray-700">Created:</div>
                      <div className="text-gray-900">{new Date(selectedQR.createdAt).toLocaleDateString()}</div>
                      
                      {selectedQR.notes && (
                        <>
                          <div className="font-medium text-gray-700 col-span-2">Notes:</div>
                          <div className="text-gray-900 col-span-2 bg-gray-50 p-2 rounded">{selectedQR.notes}</div>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowQRDetailsDialog(false)}>
              Close
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => selectedQR && handlePrintQR(selectedQR)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Print QR
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default QRManagement;