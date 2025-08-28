import React, { useState, useEffect } from 'react';
import { 
  Building, QrCode, TrendingUp, AlertTriangle, 
  Send, RefreshCw, BarChart3, Package, Plus
} from 'lucide-react';
import { User, BranchInventory, ThresholdRequest, Branch } from '../types';
import { apiService } from '../services/api';

interface BranchInventoryProps {
  user: User;
}

const BranchInventoryComponent: React.FC<BranchInventoryProps> = ({ user }) => {
  const [inventory, setInventory] = useState<BranchInventory[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [thresholdRequests, setThresholdRequests] = useState<ThresholdRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBulkAllocateModal, setShowBulkAllocateModal] = useState(false);
  const [showThresholdModal, setShowThresholdModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<BranchInventory | null>(null);
  
  // Bulk allocation form
  const [bulkForm, setBulkForm] = useState({
    branchId: '',
    count: 50
  });
  const [allocating, setAllocating] = useState(false);
  
  // Bulk assignment form
  const [bulkAssignForm, setBulkAssignForm] = useState({
    sourceBranch: '',
    targetBranch: '',
    count: 10
  });
  const [assigning, setAssigning] = useState(false);
  
  // Threshold request form
  const [thresholdForm, setThresholdForm] = useState({
    requestedAmount: 100,
    reason: ''
  });
  const [requesting, setRequesting] = useState(false);

  const isAdmin = user.role === 'system_admin';
  const isBranchManager = user.role === 'branch_manager';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [inventoryData, branchesData, requestsData] = await Promise.all([
        apiService.getBranchInventory(isBranchManager ? user.branchId : undefined),
        apiService.getBranches(),
        apiService.getThresholdRequests(isBranchManager ? user.branchId : undefined)
      ]);
      
      setInventory(inventoryData);
      setBranches(branchesData);
      setThresholdRequests(requestsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    setAllocating(true);
    
    try {
      await apiService.bulkAllocateQRs(bulkForm.branchId, bulkForm.count);
      setShowBulkAllocateModal(false);
      setBulkForm({ branchId: '', count: 50 });
      loadData();
    } catch (error) {
      console.error('Failed to allocate QRs:', error);
    } finally {
      setAllocating(false);
    }
  };

  const handleBulkAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssigning(true);
    
    try {
      await apiService.bulkAssignQRs(bulkAssignForm.sourceBranch, bulkAssignForm.targetBranch, bulkAssignForm.count);
      setShowBulkAssignModal(false);
      setBulkAssignForm({ sourceBranch: '', targetBranch: '', count: 10 });
      loadData();
    } catch (error) {
      console.error('Failed to assign QRs:', error);
    } finally {
      setAssigning(false);
    }
  };

  const handleThresholdRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranch) return;
    
    setRequesting(true);
    try {
      await apiService.createThresholdRequest(selectedBranch.branchId, {
        currentInventory: selectedBranch.available,
        threshold: 20, // Default threshold
        requestedAmount: thresholdForm.requestedAmount,
        reason: thresholdForm.reason
      });
      
      setShowThresholdModal(false);
      setThresholdForm({ requestedAmount: 100, reason: '' });
      setSelectedBranch(null);
      loadData();
    } catch (error) {
      console.error('Failed to create threshold request:', error);
    } finally {
      setRequesting(false);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      await apiService.approveThresholdRequest(requestId);
      loadData();
    } catch (error) {
      console.error('Failed to approve request:', error);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await apiService.rejectThresholdRequest(requestId, 'Request rejected by admin');
      loadData();
    } catch (error) {
      console.error('Failed to reject request:', error);
    }
  };

  const getUtilizationColor = (rate: number) => {
    if (rate >= 80) return 'text-red-600 bg-red-100';
    if (rate >= 60) return 'text-amber-600 bg-amber-100';
    return 'text-emerald-600 bg-emerald-100';
  };

  const getInventoryStatus = (branch: BranchInventory) => {
    if (branch.available <= 10) return { status: 'critical', color: 'bg-red-500', text: 'Critical' };
    if (branch.available <= 20) return { status: 'low', color: 'bg-amber-500', text: 'Low' };
    return { status: 'good', color: 'bg-emerald-500', text: 'Good' };
  };

  const getBranchName = (branchId: string) => {
    const branch = branches.find(b => b.id === branchId);
    return branch ? branch.name : 'Unknown Branch';
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      rejected: 'bg-red-100 text-red-800 border-red-200'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[status as keyof typeof styles]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600">
            Monitor and manage QR code inventory across branches
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadData}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          {isAdmin && (
            <button
              onClick={() => setShowBulkAllocateModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800"
            >
              <Send className="h-4 w-4" />
              <span>Bulk Allocate</span>
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => setShowBulkAssignModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-700 text-white rounded-lg hover:bg-indigo-800"
            >
              <Plus className="h-4 w-4" />
              <span>Bulk Assign</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <Package className="h-8 w-8 text-blue-600 bg-blue-100 rounded-lg p-2" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {inventory.reduce((acc, inv) => acc + inv.totalAllocated, 0)}
              </p>
              <p className="text-sm text-gray-600">Total Allocated</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <QrCode className="h-8 w-8 text-emerald-600 bg-emerald-100 rounded-lg p-2" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {inventory.reduce((acc, inv) => acc + inv.available, 0)}
              </p>
              <p className="text-sm text-gray-600">Available</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <TrendingUp className="h-8 w-8 text-indigo-600 bg-indigo-100 rounded-lg p-2" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {inventory.reduce((acc, inv) => acc + inv.issued, 0)}
              </p>
              <p className="text-sm text-gray-600">Issued</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-8 w-8 text-amber-600 bg-amber-100 rounded-lg p-2" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {inventory.filter(inv => inv.available <= 20).length}
              </p>
              <p className="text-sm text-gray-600">Low Stock Branches</p>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-medium text-gray-900">Branch Inventory Status</h2>
        </div>
        
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
                    Branch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Allocated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Available
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issued
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Returned
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilization
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  {isBranchManager && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inventory.map((branch) => {
                  const status = getInventoryStatus(branch);
                  return (
                    <tr key={branch.branchId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Building className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{branch.branchName}</div>
                            <div className="text-sm text-gray-500">{branch.branchCode}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {branch.totalAllocated}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {branch.available}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {branch.issued}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {branch.returned}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className={`h-2 rounded-full ${getUtilizationColor(branch.utilizationRate).replace('text-', 'bg-').replace('bg-', 'bg-').split(' ')[0]}`}
                              style={{ width: `${Math.min(branch.utilizationRate, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-900">{branch.utilizationRate}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${status.color} text-white`}>
                          {status.text}
                        </span>
                      </td>
                      {isBranchManager && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {branch.available <= 20 && (
                            <button
                              onClick={() => {
                                setSelectedBranch(branch);
                                setShowThresholdModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Request More
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Threshold Requests */}
      {(isAdmin || isBranchManager) && thresholdRequests.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-medium text-gray-900">
              {isAdmin ? 'Threshold Requests' : 'My Requests'}
            </h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {thresholdRequests.map((request) => (
              <div key={request.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-sm font-medium text-gray-900">
                        {getBranchName(request.branchId)}
                      </h3>
                      {getStatusBadge(request.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Current Inventory:</span> {request.currentInventory}
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Requested Amount:</span> {request.requestedAmount}
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Created:</span> {new Date(request.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600">{request.reason}</p>
                  </div>
                  
                  {isAdmin && request.status === 'pending' && (
                    <div className="ml-6 flex space-x-2">
                      <button
                        onClick={() => handleRejectRequest(request.id)}
                        className="px-3 py-1 text-sm border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApproveRequest(request.id)}
                        className="px-3 py-1 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                      >
                        Approve
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bulk Allocate Modal */}
      {showBulkAllocateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Bulk Allocate QR Codes</h2>
            <form onSubmit={handleBulkAllocate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Branch</label>
                <select
                  value={bulkForm.branchId}
                  onChange={(e) => setBulkForm({ ...bulkForm, branchId: e.target.value })}
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
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Number of QR Codes</label>
                <input
                  type="number"
                  value={bulkForm.count}
                  onChange={(e) => setBulkForm({ ...bulkForm, count: Number(e.target.value) })}
                  min="1"
                  max="1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBulkAllocateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={allocating}
                  className="flex-1 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:opacity-50"
                >
                  {allocating ? 'Allocating...' : 'Allocate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Assign Modal */}
      {showBulkAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Bulk Assign QR Codes</h2>
            <form onSubmit={handleBulkAssign} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Source Branch</label>
                <select
                  value={bulkAssignForm.sourceBranch}
                  onChange={(e) => setBulkAssignForm({ ...bulkAssignForm, sourceBranch: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Choose source branch...</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name} ({branch.branchCode})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Branch</label>
                <select
                  value={bulkAssignForm.targetBranch}
                  onChange={(e) => setBulkAssignForm({ ...bulkAssignForm, targetBranch: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Choose target branch...</option>
                  {branches.filter(branch => branch.id !== bulkAssignForm.sourceBranch).map(branch => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name} ({branch.branchCode})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Number of QR Codes</label>
                <input
                  type="number"
                  value={bulkAssignForm.count}
                  onChange={(e) => setBulkAssignForm({ ...bulkAssignForm, count: Number(e.target.value) })}
                  min="1"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBulkAssignModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning}
                  className="flex-1 px-4 py-2 bg-indigo-700 text-white rounded-lg hover:bg-indigo-800 disabled:opacity-50"
                >
                  {assigning ? 'Assigning...' : 'Assign QRs'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Threshold Request Modal */}
      {showThresholdModal && selectedBranch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Request More QR Codes</h2>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Low Inventory Alert</p>
                  <p className="text-sm text-amber-700">
                    Current available: {selectedBranch.available} QR codes
                  </p>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleThresholdRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Requested Amount</label>
                <input
                  type="number"
                  value={thresholdForm.requestedAmount}
                  onChange={(e) => setThresholdForm({ ...thresholdForm, requestedAmount: Number(e.target.value) })}
                  min="1"
                  max="500"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Request</label>
                <textarea
                  value={thresholdForm.reason}
                  onChange={(e) => setThresholdForm({ ...thresholdForm, reason: e.target.value })}
                  rows={3}
                  placeholder="Explain why you need more QR codes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowThresholdModal(false);
                    setSelectedBranch(null);
                    setThresholdForm({ requestedAmount: 100, reason: '' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={requesting}
                  className="flex-1 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:opacity-50"
                >
                  {requesting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchInventoryComponent;