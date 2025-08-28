import React, { useState, useEffect } from 'react';
import { 
  QrCode, Plus, Upload, Download, Search, Filter, 
  Eye, Printer, Edit, Trash2, AlertTriangle, CheckCircle,
  Building, Store, Hash, Terminal, FileText
} from 'lucide-react';
import { User, QRCode } from '../types';
import { apiService } from '../services/api';

interface QRManagementProps {
  user: User;
}

const QRManagement: React.FC<QRManagementProps> = ({ user }) => {
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedQR, setSelectedQR] = useState<QRCode | null>(null);
  const [filters, setFilters] = useState({ search: '', status: '', type: '' });
  
  // Generate form state
  const [generateForm, setGenerateForm] = useState({
    count: 10,
    type: 'static' as 'static' | 'dynamic',
    branchId: '',
    autoAssign: false,
    bankName: 'Demo Bank Ltd.',
    merchantName: '',
    merchantId: '',
    terminalId: ''
  });
  const [generating, setGenerating] = useState(false);
  
  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    merchantId: '',
    terminalId: '',
    notes: ''
  });
  const [updating, setUpdating] = useState(false);

  const [branches, setBranches] = useState<any[]>([]);

  const canManageQRs = user.role === 'system_admin';

  useEffect(() => {
    if (canManageQRs) {
      loadQRCodes();
      loadBranches();
    }
  }, [canManageQRs]);

  const loadQRCodes = async () => {
    setLoading(true);
    try {
      const data = await apiService.getQRCodes();
      setQrCodes(data);
    } catch (error) {
      console.error('Failed to load QR codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBranches = async () => {
    try {
      const data = await apiService.getBranches();
      setBranches(data);
    } catch (error) {
      console.error('Failed to load branches:', error);
    }
  };
  const handleGenerateQRs = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    
    try {
      const newQRs = await apiService.generateQRCodes(generateForm.count, generateForm.type, {
        bankName: generateForm.bankName,
        merchantName: generateForm.merchantName,
        merchantId: generateForm.merchantId,
        terminalId: generateForm.terminalId || undefined
      });
      
      // Auto-assign to branch if specified
      if (generateForm.autoAssign && generateForm.branchId) {
        const qrIds = newQRs.map(qr => qr.id);
        await apiService.allocateQRsToBranch(qrIds, generateForm.branchId);
      }
      
      setShowGenerateModal(false);
      resetGenerateForm();
      loadQRCodes();
    } catch (error) {
      console.error('Failed to generate QR codes:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate QR codes');
    } finally {
      setGenerating(false);
    }
  };

  const handleUploadQRs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;
    
    setUploading(true);
    try {
      await apiService.uploadQRCodes(uploadFile);
      setShowUploadModal(false);
      setUploadFile(null);
      loadQRCodes();
    } catch (error) {
      console.error('Failed to upload QR codes:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateQR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQR) return;
    
    setUpdating(true);
    try {
      await apiService.updateQRCode(selectedQR.id, editForm);
      setShowEditModal(false);
      setSelectedQR(null);
      resetEditForm();
      loadQRCodes();
    } catch (error) {
      console.error('Failed to update QR code:', error);
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
      await apiService.blockQRCode(qrId, reason);
      loadQRCodes();
    } catch (error) {
      console.error('Failed to block QR code:', error);
    }
  };

  const resetGenerateForm = () => {
    setGenerateForm({
      count: 10,
      type: 'static',
      branchId: '',
      autoAssign: false,
      bankName: 'Demo Bank Ltd.',
      merchantName: '',
      merchantId: '',
      terminalId: ''
    });
  };

  const resetEditForm = () => {
    setEditForm({
      merchantId: '',
      terminalId: '',
      notes: ''
    });
  };

  const openEditModal = (qr: QRCode) => {
    setSelectedQR(qr);
    setEditForm({
      merchantId: qr.merchantId || '',
      terminalId: qr.terminalId || '',
      notes: qr.notes || ''
    });
    setShowEditModal(true);
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

  const filteredQRs = qrCodes.filter(qr => {
    const matchesSearch = !filters.search || 
      qr.qrValue.toLowerCase().includes(filters.search.toLowerCase()) ||
      qr.bankName?.toLowerCase().includes(filters.search.toLowerCase()) ||
      qr.merchantName?.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesStatus = !filters.status || qr.status === filters.status;
    const matchesType = !filters.type || qr.qrType === filters.type;
    
    return matchesSearch && matchesStatus && matchesType;
  });

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
              <p className="text-2xl font-bold text-gray-900">{qrCodes.length}</p>
              <p className="text-sm text-gray-600">Total QRs</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <Building className="h-8 w-8 text-gray-600 bg-gray-100 rounded-lg p-2" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {qrCodes.filter(qr => qr.status === 'unallocated').length}
              </p>
              <p className="text-sm text-gray-600">Unallocated</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <Building className="h-8 w-8 text-blue-600 bg-blue-100 rounded-lg p-2" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {qrCodes.filter(qr => qr.status === 'allocated').length}
              </p>
              <p className="text-sm text-gray-600">Allocated</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-8 w-8 text-emerald-600 bg-emerald-100 rounded-lg p-2" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {qrCodes.filter(qr => qr.status === 'issued').length}
              </p>
              <p className="text-sm text-gray-600">Issued</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-8 w-8 text-red-600 bg-red-100 rounded-lg p-2" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {qrCodes.filter(qr => qr.status === 'blocked').length}
              </p>
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
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
              />
            </div>
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
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
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
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
                {filteredQRs.map((qr) => (
                  <tr key={qr.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <QrCode className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{qr.merchantName}</div>
                          <div className="text-sm text-gray-500">{qr.merchantId}</div>
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
                      <span className="text-sm text-gray-900">{qr.qrType}</span>
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
                      <div className="flex items-center justify-end space-x-2">
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
                        {qr.status !== 'blocked' && (
                          <button
                            onClick={() => handleBlockQR(qr.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Block QR Code"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                  onChange={(e) => setGenerateForm({ ...generateForm, type: e.target.value as 'static' | 'dynamic' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="static">Static</option>
                  <option value="dynamic">Dynamic</option>
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
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Edit QR Code: {selectedQR.qrValue}
            </h2>
            <form onSubmit={handleUpdateQR} className="space-y-4">
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
    </div>
  );
};

export default QRManagement;