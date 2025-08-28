import React, { useState, useEffect } from 'react';
import { 
  Store, QrCode, User as UserIcon, Phone, Mail, MapPin,
  Plus, Search, Filter, CheckCircle, Clock, AlertTriangle, RotateCcw
} from 'lucide-react';
import { User, QRCode, Merchant } from '../types';
import { apiService } from '../services/api';
import { mockMerchants } from '../services/mockData';

interface SalesManagementProps {
  user: User;
}

const SalesManagement: React.FC<SalesManagementProps> = ({ user }) => {
  const [allocatedQRs, setAllocatedQRs] = useState<QRCode[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>(mockMerchants);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'allocated' | 'issued' | 'returns'>('allocated');
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedQR, setSelectedQR] = useState<QRCode | null>(null);
  
  // Issue form state
  const [issueForm, setIssueForm] = useState({
    merchantId: '',
    newMerchant: {
      legalName: '',
      shopName: '',
      address: '',
      phone: '',
      email: ''
    },
    useExistingMerchant: true
  });
  const [issuing, setIssuing] = useState(false);
  
  // Return form state
  const [returnForm, setReturnForm] = useState({
    reason: '',
    condition: '',
    notes: ''
  });
  const [returning, setReturning] = useState(false);

  const canIssueQRs = user.role === 'sales_user' || user.role === 'branch_manager';

  useEffect(() => {
    loadAllocatedQRs();
  }, [activeTab]);

  const loadAllocatedQRs = async () => {
    setLoading(true);
    try {
      const statusFilter = {
        allocated: 'allocated',
        issued: 'issued', 
        returns: 'returned'
      };
      
      // For sales users, the API will automatically filter to their QRs
      const data = await apiService.getQRCodes({ 
        status: statusFilter[activeTab],
        branchId: user.branchId 
      });
      setAllocatedQRs(data);
    } catch (error) {
      console.error('Failed to load QRs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleIssueQR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQR) return;
    
    let merchantData;
    
    if (issueForm.useExistingMerchant) {
      merchantData = merchants.find(m => m.id === issueForm.merchantId);
      if (merchantData && merchantData.kycStatus !== 'verified') {
        alert(`Cannot issue QR to merchant with KYC status: ${merchantData.kycStatus}. KYC must be verified first.`);
        return;
      }
    }
    
    setIssuing(true);
    try {
      if (issueForm.useExistingMerchant) {
        // merchantData already found above
      } else {
        // Create new merchant
        merchantData = {
          id: `merchant_new_${Date.now()}`,
          ...issueForm.newMerchant,
          kycStatus: 'verified' as const, // New merchants start as verified for demo
          createdAt: new Date().toISOString()
        };
        merchants.push(merchantData);
      }
      
      if (merchantData) {
        await apiService.issueQRToMerchant(selectedQR.id, merchantData);
        setShowIssueModal(false);
        setSelectedQR(null);
        resetIssueForm();
        loadAllocatedQRs();
      }
    } catch (error) {
      console.error('Failed to issue QR:', error);
    } finally {
      setIssuing(false);
    }
  };

  const handleReturnQR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQR) return;
    
    setReturning(true);
    try {
      await apiService.returnQR(selectedQR.id, returnForm.reason, returnForm.condition);
      setShowReturnModal(false);
      setSelectedQR(null);
      setReturnForm({ reason: '', condition: '', notes: '' });
      loadAllocatedQRs();
    } catch (error) {
      console.error('Failed to return QR:', error);
    } finally {
      setReturning(false);
    }
  };

  const handlePrintQR = (qr: QRCode) => {
    const merchant = qr.issuedToMerchantId ? getMerchantInfo(qr.issuedToMerchantId) : null;
    
    if (!merchant || merchant.kycStatus !== 'verified') {
      alert('Cannot print QR code. Merchant KYC must be verified first.');
      return;
    }
    
    // Generate QR code data URL using the actual QR value
    const qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qr.qrValue)}`;
    
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${merchant.shopName}</title>
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
            .kyc-verified {
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
              <h2>${merchant.shopName}</h2>
            </div>
            
            <div class="qr-code">
              <img src="${qrDataUrl}" alt="QR Code" width="200" height="200" />
            </div>
            
            <div class="details">
              <div class="detail-row">
                <span class="label">Merchant:</span>
                <span class="value">${merchant.shopName}</span>
              </div>
              <div class="detail-row">
                <span class="label">Legal Name:</span>
                <span class="value">${merchant.legalName}</span>
              </div>
              <div class="detail-row">
                <span class="label">KYC Status:</span>
                <span class="value kyc-verified">VERIFIED ✓</span>
              </div>
              <div class="detail-row">
                <span class="label">Address:</span>
                <span class="value">${merchant.address}</span>
              </div>
              <div class="detail-row">
                <span class="label">Phone:</span>
                <span class="value">${merchant.phone}</span>
              </div>
              <div class="detail-row">
                <span class="label">Email:</span>
                <span class="value">${merchant.email}</span>
              </div>
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
      newMerchant: {
        legalName: '',
        shopName: '',
        address: '',
        phone: '',
        email: ''
      },
      useExistingMerchant: true
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      allocated: 'bg-blue-100 text-blue-700 border-blue-200',
      issued: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      returned: 'bg-amber-100 text-amber-700 border-amber-200'
    };
    
    const icons = {
      allocated: Clock,
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

  const getMerchantInfo = (merchantId: string) => {
    return merchants.find(m => m.id === merchantId);
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
                  onClick={() => setActiveTab(tab.id as any)}
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
                const merchant = qr.issuedToMerchantId ? getMerchantInfo(qr.issuedToMerchantId) : null;
                
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
                        
                        {merchant && (
                          <div className="bg-gray-50 rounded-lg p-4 mt-4">
                            <div className="flex items-start space-x-3">
                              <Store className="h-5 w-5 text-gray-500 mt-0.5" />
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-medium text-gray-900">{merchant.shopName}</h4>
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    merchant.kycStatus === 'verified' ? 'bg-emerald-100 text-emerald-700' :
                                    merchant.kycStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                    KYC {merchant.kycStatus}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-1">{merchant.legalName}</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-500">
                                  <div className="flex items-center space-x-1">
                                    <MapPin className="h-3 w-3" />
                                    <span className="truncate">{merchant.address}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Phone className="h-3 w-3" />
                                    <span>{merchant.phone}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Mail className="h-3 w-3" />
                                    <span className="truncate">{merchant.email}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
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
                            {merchant.kycStatus === 'verified' ? (
                              <button
                                onClick={() => handlePrintQR(qr)}
                                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm mr-2"
                              >
                                Print QR
                              </button>
                            ) : (
                              <div className="px-3 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm mr-2 cursor-not-allowed">
                                Print Disabled (KYC {merchant.kycStatus})
                              </div>
                            )}
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
      </div>

      {/* Issue QR Modal */}
      {showIssueModal && selectedQR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Issue QR Code: {selectedQR.qrValue}
            </h2>
            
            <form onSubmit={handleIssueQR} className="space-y-4">
              {/* Merchant Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Merchant Selection
                </label>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={issueForm.useExistingMerchant}
                      onChange={() => setIssueForm({ ...issueForm, useExistingMerchant: true })}
                      className="mr-2"
                    />
                    <span>Existing Merchant</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={!issueForm.useExistingMerchant}
                      onChange={() => setIssueForm({ ...issueForm, useExistingMerchant: false })}
                      className="mr-2"
                    />
                    <span>New Merchant</span>
                  </label>
                </div>
              </div>

              {issueForm.useExistingMerchant ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Merchant
                  </label>
                  <select
                    value={issueForm.merchantId}
                    onChange={(e) => setIssueForm({ ...issueForm, merchantId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Choose a merchant...</option>
                    {merchants.map(merchant => (
                      <option key={merchant.id} value={merchant.id}>
                        {merchant.shopName} - {merchant.legalName}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Legal Name
                    </label>
                    <input
                      type="text"
                      value={issueForm.newMerchant.legalName}
                      onChange={(e) => setIssueForm({
                        ...issueForm,
                        newMerchant: { ...issueForm.newMerchant, legalName: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Shop Name
                    </label>
                    <input
                      type="text"
                      value={issueForm.newMerchant.shopName}
                      onChange={(e) => setIssueForm({
                        ...issueForm,
                        newMerchant: { ...issueForm.newMerchant, shopName: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <textarea
                      value={issueForm.newMerchant.address}
                      onChange={(e) => setIssueForm({
                        ...issueForm,
                        newMerchant: { ...issueForm.newMerchant, address: e.target.value }
                      })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={issueForm.newMerchant.phone}
                        onChange={(e) => setIssueForm({
                          ...issueForm,
                          newMerchant: { ...issueForm.newMerchant, phone: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={issueForm.newMerchant.email}
                        onChange={(e) => setIssueForm({
                          ...issueForm,
                          newMerchant: { ...issueForm.newMerchant, email: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}
              
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
                  Return Reason
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
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  QR Code Condition
                </label>
                <select
                  value={returnForm.condition}
                  onChange={(e) => setReturnForm({ ...returnForm, condition: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select condition...</option>
                  <option value="good">Good Condition</option>
                  <option value="damaged">Damaged</option>
                  <option value="lost">Lost/Missing</option>
                  <option value="destroyed">Destroyed</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={returnForm.notes}
                  onChange={(e) => setReturnForm({ ...returnForm, notes: e.target.value })}
                  rows={3}
                  placeholder="Any additional details about the return..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
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