import React, { useState, useEffect } from 'react';
import { 
  Store, QrCode, User as UserIcon, Phone, Mail, MapPin,
  Plus, Search, Filter, CheckCircle, Clock, AlertTriangle, RotateCcw, Building,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { User, QRCode, Merchant } from '../types';
import { qrCodeApiService, QRCodeIssueDto } from '../services/qr-api';
import { branchApiService, BranchResponseDto } from '../services/branch-api';
import { useToast } from '../hooks/use-toast';

interface SalesManagementProps {
  user: User;
}

const SalesManagement: React.FC<SalesManagementProps> = ({ user }) => {
  const [allocatedQRs, setAllocatedQRs] = useState<QRCode[]>([]);
  const [branches, setBranches] = useState<BranchResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'allocated' | 'issued' | 'returns'>('allocated');
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedQR, setSelectedQR] = useState<QRCode | null>(null);
  const { toast } = useToast();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  
  // Issue form state
  const [issueForm, setIssueForm] = useState({
    merchantId: '',
    merchantName: '',
    notes: ''
  });
  const [issuing, setIssuing] = useState(false);
  
  // Return form state
  const [returnForm, setReturnForm] = useState({
    reason: ''
  });
  const [returning, setReturning] = useState(false);

  const canIssueQRs = user.role === 'SALES_USER' || user.role === 'BRANCH_MANAGER';

  useEffect(() => {
    loadAllocatedQRs();
    loadBranches();
  }, [activeTab, currentPage, pageSize]);

  const loadBranches = async () => {
    try {
      const data = await branchApiService.getBranches();
      setBranches(data);
    } catch (error) {
      console.error('Failed to load branches:', error);
      toast({
        title: "Error",
        description: "Failed to load branches",
        variant: "destructive",
      });
    }
  };

  const loadAllocatedQRs = async () => {
    setLoading(true);
    try {
      let result;
      
      switch (activeTab) {
        case 'allocated':
          result = await qrCodeApiService.getAllocatedQRCodes(currentPage, pageSize);
          break;
        case 'issued':
          result = await qrCodeApiService.getIssuedQRCodes(currentPage, pageSize);
          break;
        case 'returns':
          result = await qrCodeApiService.searchQRCodes(undefined, 'RETURNED', undefined, undefined, currentPage, pageSize);
          break;
        default:
          result = await qrCodeApiService.getAllocatedQRCodes(currentPage, pageSize);
      }
      
      // Filter by user's branch if they're not a super admin
      let qrCodes = result.qrCodes;
      if (user.role !== 'SUPER_ADMIN' && user.branchId) {
        qrCodes = qrCodes.filter(qr => 
          qr.allocatedBranchId === user.branchId || 
          qr.allocatedBranchId === user.branchId?.toString()
        );
      }
      
      setAllocatedQRs(qrCodes);
      setTotalPages(result.pagination?.totalPages || 0);
      setTotalElements(result.pagination?.totalElements || qrCodes.length);
    } catch (error) {
      console.error('Failed to load QRs:', error);
      toast({
        title: "Error",
        description: "Failed to load QR codes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleIssueQR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQR) return;
    
    setIssuing(true);
    try {
      const issueData: QRCodeIssueDto = {
        qrCodeId: Number(selectedQR.id),
        merchantId: issueForm.merchantId,
        merchantName: issueForm.merchantName,
        notes: issueForm.notes || undefined
      };

      await qrCodeApiService.issueQRToMerchant(issueData);
      
      setShowIssueModal(false);
      setSelectedQR(null);
      resetIssueForm();
      setCurrentPage(0);
      loadAllocatedQRs();
      toast({
        title: "Success",
        description: "QR code issued to merchant successfully",
      });
    } catch (error) {
      console.error('Failed to issue QR:', error);
      toast({
        title: "Error",
        description: "Failed to issue QR code",
        variant: "destructive",
      });
    } finally {
      setIssuing(false);
    }
  };

  const handleReturnQR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQR) return;
    
    setReturning(true);
    try {
      await qrCodeApiService.returnQRCode(selectedQR.id, returnForm.reason);
      setShowReturnModal(false);
      setSelectedQR(null);
      setReturnForm({ reason: '' });
      setCurrentPage(0);
      loadAllocatedQRs();
      toast({
        title: "Success",
        description: "QR code returned successfully",
      });
    } catch (error) {
      console.error('Failed to return QR:', error);
      toast({
        title: "Error",
        description: "Failed to return QR code",
        variant: "destructive",
      });
    } finally {
      setReturning(false);
    }
  };

  const handlePrintQR = (qr: QRCode) => {
    // For issued QRs, we can print them directly
    if (qr.status !== 'issued') {
      toast({
        title: "Warning",
        description: "Only issued QR codes can be printed",
        variant: "destructive",
      });
      return;
    }
    
    // Generate QR code data URL using the actual QR value
    const qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qr.qrValue)}`;
    
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${qr.merchantName || qr.qrValue}</title>
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
            .status-issued {
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
              <h2>${qr.merchantName || qr.bankName || 'Demo Bank Ltd.'}</h2>
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
                <span class="value status-issued">ISSUED ✓</span>
              </div>
              ${qr.merchantName ? `
              <div class="detail-row">
                <span class="label">Merchant:</span>
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
              ${qr.bankName ? `
              <div class="detail-row">
                <span class="label">Bank:</span>
                <span class="value">${qr.bankName}</span>
              </div>
              ` : ''}
              <div class="detail-row">
                <span class="label">Generated:</span>
                <span class="value">${new Date().toLocaleDateString()}</span>
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

  const resetIssueForm = () => {
    setIssueForm({
      merchantId: '',
      merchantName: '',
      notes: ''
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      allocated: 'bg-blue-100 text-blue-700 border-blue-200',
      issued: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      returned: 'bg-amber-100 text-amber-700 border-amber-200'
    };
    
    const icons = {
      allocated: Building,
      issued: CheckCircle,
      returned: RotateCcw
    };
    
    const Icon = icons[status as keyof typeof icons];
    
    return (
      <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full border ${styles[status as keyof typeof styles]}`}>
        <Icon className="h-3 w-3" />
        <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
      </span>
    );
  };

  const getBranchName = (branchId: string | undefined) => {
    if (!branchId) return 'Not Assigned';
    const branch = branches.find(b => b.id.toString() === branchId);
    return branch ? branch.name : `Branch ${branchId}`;
  };

  const handleTabChange = (newTab: 'allocated' | 'issued' | 'returns') => {
    setActiveTab(newTab);
    setCurrentPage(0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Management</h1>
          <p className="text-gray-600">Issue QR codes to merchants and manage returns</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <Clock className="h-8 w-8 text-blue-600 bg-blue-100 rounded-lg p-2" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {allocatedQRs.filter(qr => qr.status === 'allocated').length}
              </p>
              <p className="text-sm text-gray-600">Ready to Issue</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-8 w-8 text-emerald-600 bg-emerald-100 rounded-lg p-2" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {allocatedQRs.filter(qr => qr.status === 'issued').length}
              </p>
              <p className="text-sm text-gray-600">Issued</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <RotateCcw className="h-8 w-8 text-amber-600 bg-amber-100 rounded-lg p-2" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {allocatedQRs.filter(qr => qr.status === 'returned').length}
              </p>
              <p className="text-sm text-gray-600">Returned</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'allocated', name: 'Ready to Issue', icon: Clock },
              { id: 'issued', name: 'Issued QRs', icon: CheckCircle },
              { id: 'returns', name: 'Returns', icon: RotateCcw }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : allocatedQRs.length === 0 ? (
            <div className="text-center py-12">
              <QrCode className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No QR codes found</h3>
              <p className="text-gray-600">
                {activeTab === 'allocated' 
                  ? 'No QR codes are currently allocated for issuance.'
                  : activeTab === 'issued'
                  ? 'No QR codes have been issued yet.'
                  : 'No QR codes have been returned.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {allocatedQRs.map((qr) => {
                return (
                  <div key={qr.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <QrCode className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{qr.qrValue}</h3>
                            <p className="text-sm text-gray-500">
                              {qr.qrType} • Created {new Date(qr.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          {getStatusBadge(qr.status)}
                        </div>
                        
                        {/* QR Details */}
                        <div className="bg-gray-50 rounded-lg p-4 mt-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">Branch:</span>
                              <span className="ml-2 text-gray-600">{getBranchName(qr.allocatedBranchId)}</span>
                            </div>
                            {qr.merchantName && (
                              <div>
                                <span className="font-medium text-gray-700">Merchant:</span>
                                <span className="ml-2 text-gray-600">{qr.merchantName}</span>
                              </div>
                            )}
                            {qr.merchantId && (
                              <div>
                                <span className="font-medium text-gray-700">Merchant ID:</span>
                                <span className="ml-2 text-gray-600">{qr.merchantId}</span>
                              </div>
                            )}
                            {qr.terminalId && (
                              <div>
                                <span className="font-medium text-gray-700">Terminal ID:</span>
                                <span className="ml-2 text-gray-600">{qr.terminalId}</span>
                              </div>
                            )}
                            {qr.bankName && (
                              <div>
                                <span className="font-medium text-gray-700">Bank:</span>
                                <span className="ml-2 text-gray-600">{qr.bankName}</span>
                              </div>
                            )}
                            {qr.notes && (
                              <div className="md:col-span-3">
                                <span className="font-medium text-gray-700">Notes:</span>
                                <span className="ml-2 text-gray-600">{qr.notes}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="ml-6 flex flex-col space-y-2">
                        {activeTab === 'allocated' && canIssueQRs && (
                          <button
                            onClick={() => {
                              setSelectedQR(qr);
                              setShowIssueModal(true);
                            }}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm"
                          >
                            Issue to Merchant
                          </button>
                        )}
                        
                        {activeTab === 'issued' && canIssueQRs && (
                          <>
                            <button
                              onClick={() => handlePrintQR(qr)}
                              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                            >
                              Print QR
                            </button>
                            <button
                              onClick={() => {
                                setSelectedQR(qr);
                                setShowReturnModal(true);
                              }}
                              className="px-4 py-2 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 text-sm"
                            >
                              Process Return
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, totalElements)} of {totalElements} results
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-gray-700">
                Page {currentPage + 1} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage === totalPages - 1}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Issue QR Modal */}
      {showIssueModal && selectedQR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Issue QR Code: {selectedQR.qrValue}
            </h2>
            
            <form onSubmit={handleIssueQR} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Merchant ID *
                </label>
                <input
                  type="text"
                  value={issueForm.merchantId}
                  onChange={(e) => setIssueForm({ ...issueForm, merchantId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter merchant ID"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Merchant Name *
                </label>
                <input
                  type="text"
                  value={issueForm.merchantName}
                  onChange={(e) => setIssueForm({ ...issueForm, merchantName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter merchant name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={issueForm.notes}
                  onChange={(e) => setIssueForm({ ...issueForm, notes: e.target.value })}
                  rows={3}
                  placeholder="Any additional notes about this issuance..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowIssueModal(false);
                    resetIssueForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={issuing}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  {issuing ? 'Issuing...' : 'Issue QR Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return QR Modal */}
      {showReturnModal && selectedQR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Return QR Code: {selectedQR.qrValue}
            </h2>
            
            <form onSubmit={handleReturnQR} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Return Reason *
                </label>
                <select
                  value={returnForm.reason}
                  onChange={(e) => setReturnForm({ ...returnForm, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select reason...</option>
                  <option value="merchant_closed">Merchant Closed</option>
                  <option value="damaged_qr">Damaged QR Code</option>
                  <option value="merchant_request">Merchant Request</option>
                  <option value="compliance_issue">Compliance Issue</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={returning}
                  className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
                >
                  {returning ? 'Processing...' : 'Process Return'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesManagement;