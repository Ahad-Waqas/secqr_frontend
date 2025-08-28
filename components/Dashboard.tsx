import React, { useState, useEffect } from 'react';
import { 
  QrCode, Users, Building, TrendingUp, ArrowUpRight, ArrowDownRight, 
  Calendar, Download, RefreshCw, BarChart3, PieChart, ChevronRight,
  Clock, CheckCircle, XCircle, Activity, AlertTriangle, Shield
} from 'lucide-react';
import { User, DashboardStats } from '../types';
import { apiService } from '../services/api';

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);
  const [detailTitle, setDetailTitle] = useState('');
  const [detailType, setDetailType] = useState<'qr-status' | 'branch-performance' | 'user-performance' | 'activity'>('qr-status');
  
  const isBranchApprover = user.role === 'branch_approver';
  const isBranchUser = user.role === 'branch_manager' || user.role === 'branch_approver' || user.role === 'sales_user';
  const isAuditor = user.role === 'auditor';

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const data = await apiService.getDashboardStats(isBranchUser ? user.branchId : undefined);
      setStats(data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type: 'qr_codes' | 'allocations' | 'issuances') => {
    try {
      const blob = await apiService.exportData(type);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_export.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleCardClick = async (type: string, status?: string) => {
    try {
      let data;
      let title;
      
      switch (type) {
        case 'total-qrs':
          data = await apiService.getQRCodes();
          title = 'All QR Codes';
          setDetailType('qr-status');
          break;
        case 'unallocated':
          data = await apiService.getQRCodes({ status: 'unallocated' });
          title = 'Unallocated QR Codes';
          setDetailType('qr-status');
          break;
        case 'allocated':
          data = await apiService.getQRCodes({ status: 'allocated' });
          title = 'Allocated QR Codes';
          setDetailType('qr-status');
          break;
        case 'issued':
          data = await apiService.getQRCodes({ status: 'issued' });
          title = 'Issued QR Codes';
          setDetailType('qr-status');
          break;
        case 'returned':
          data = await apiService.getQRCodes({ status: 'returned' });
          title = 'Returned QR Codes';
          setDetailType('qr-status');
          break;
        case 'pending-approvals':
          data = await apiService.getAllocationRequests(user.branchId);
          data = data.filter((req: any) => req.status === 'pending');
          title = 'Pending Approval Requests';
          setDetailType('activity');
          break;
        case 'approved-requests':
          data = await apiService.getAllocationRequests(user.branchId);
          data = data.filter((req: any) => req.status === 'approved');
          title = 'Approved Requests';
          setDetailType('activity');
          break;
        case 'rejected-requests':
          data = await apiService.getAllocationRequests(user.branchId);
          data = data.filter((req: any) => req.status === 'rejected');
          title = 'Rejected Requests';
          setDetailType('activity');
          break;
        case 'returned-for-correction':
          data = await apiService.getAllocationRequests(user.branchId);
          data = data.filter((req: any) => req.status === 'pending' && req.notes?.includes('Returned for correction'));
          title = 'Returned for Correction';
          setDetailType('activity');
          break;
        case 'branch-performance':
          data = await apiService.getBranchInventory();
          title = 'Branch Performance Details';
          setDetailType('branch-performance');
          break;
        case 'user-performance':
          data = await apiService.getUsers();
          title = 'User Performance Details';
          setDetailType('user-performance');
          break;
        case 'recent-activity':
          data = stats?.recentActivity || [];
          title = 'Recent Activity Details';
          setDetailType('activity');
          break;
        case 'region-performance':
          data = await apiService.getRegionPerformance(status);
          title = status ? `${status} Region Performance` : 'Region Performance Details';
          setDetailType('region-performance');
          break;
        case 'seller-performance':
          data = await apiService.getSellerPerformance(status);
          title = status ? `${status} - Sales Performance` : 'Sales Performance Details';
          setDetailType('seller-performance');
          break;
        case 'top-branches':
          data = await apiService.getBranchInventory();
          title = 'Top Performing Branches Details';
          setDetailType('branch-performance');
          break;
        case 'top-sellers':
          data = await apiService.getSellerPerformance();
          title = 'Top Sales Performers Details';
          setDetailType('seller-performance');
          break;
        case 'top-regions':
          data = await apiService.getRegionPerformance();
          title = 'Top Performing Regions Details';
          setDetailType('region-performance');
          break;
        default:
          return;
      }
      
      setDetailData(data);
      setDetailTitle(title);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Failed to load detail data:', error);
    }
  };

  const handleBranchClick = (branchName: string) => {
    console.log('Branch clicked:', branchName);
  };

  const handleSellerClick = (sellerName: string) => {
    handleCardClick('seller-performance', sellerName);
  };

  const handleRegionClick = (regionName: string) => {
    handleCardClick('region-performance', regionName);
  };

  const handleActivityClick = () => {
    handleCardClick('recent-activity');
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const StatCard = ({ title, value, icon: Icon, trend, trendValue, color = 'blue', onClick }: any) => (
    <div 
      className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow group"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="flex items-center space-x-2 mt-1">
            <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
            <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
          </div>
          {trend && (
            <div className="flex items-center mt-2 space-x-1">
              {trend === 'up' ? (
                <ArrowUpRight className="h-4 w-4 text-emerald-600" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-600" />
              )}
              <span className={`text-sm font-medium ${
                trend === 'up' ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {trendValue}%
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-${color}-50`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user.name}</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadDashboardData}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          <div className="relative">
            <select 
              onChange={(e) => e.target.value && handleExport(e.target.value as any)}
              className="appearance-none bg-blue-700 text-white px-4 py-2 rounded-lg pr-10 hover:bg-blue-800"
            >
              <option value="">Export Data</option>
              <option value="qr_codes">QR Codes</option>
              <option value="allocations">Allocations</option>
              <option value="issuances">Issuances</option>
            </select>
            <Download className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      {isBranchApprover ? (
        // Branch Approver specific metrics
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Pending Approvals"
            value={stats.pendingApprovals || 0}
            icon={Clock}
            color="yellow"
            onClick={() => handleCardClick('pending-approvals')}
          />
          <StatCard
            title="Approved Requests"
            value={stats.approvedRequests || 0}
            icon={CheckCircle}
            trend="up"
            trendValue="8"
            color="emerald"
            onClick={() => handleCardClick('approved-requests')}
          />
          <StatCard
            title="Rejected Requests"
            value={stats.rejectedRequests || 0}
            icon={XCircle}
            color="red"
            onClick={() => handleCardClick('rejected-requests')}
          />
          <StatCard
            title="Returned for Correction"
            value={stats.returnedForCorrection || 0}
            icon={RefreshCw}
            color="amber"
            onClick={() => handleCardClick('returned-for-correction')}
          />
        </div>
      ) : isAuditor ? (
        // Auditor specific metrics
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="System Activities"
            value={stats.recentActivity?.length || 0}
            icon={Activity}
            trend="up"
            trendValue="5"
            color="blue"
            onClick={() => handleCardClick('recent-activity')}
          />
          <StatCard
            title="High Severity Events"
            value={1}
            icon={AlertTriangle}
            color="red"
            onClick={() => handleCardClick('high-severity')}
          />
          <StatCard
            title="Active Users"
            value={9}
            icon={Users}
            trend="up"
            trendValue="2"
            color="indigo"
            onClick={() => handleCardClick('active-users')}
          />
          <StatCard
            title="Compliance Score"
            value="98.5%"
            icon={CheckCircle}
            trend="up"
            trendValue="2"
            color="emerald"
            onClick={() => handleCardClick('compliance-score')}
          />
        </div>
      ) : (
        // System Admin and other roles metrics
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <StatCard
            title="Total QR Codes"
            value={stats.totalQRs}
            icon={QrCode}
            trend="up"
            trendValue="12"
            color="blue"
            onClick={() => handleCardClick('total-qrs')}
          />
          <StatCard
            title="Unallocated"
            value={stats.unallocated}
            icon={BarChart3}
            color="gray"
            onClick={() => handleCardClick('unallocated')}
          />
          <StatCard
            title="Allocated"
            value={stats.allocated}
            icon={Building}
            trend="up"
            trendValue="8"
            color="emerald"
            onClick={() => handleCardClick('allocated')}
          />
          <StatCard
            title="Issued"
            value={stats.issued}
            icon={TrendingUp}
            trend="up"
            trendValue="15"
            color="indigo"
            onClick={() => handleCardClick('issued')}
          />
          <StatCard
            title="Returned"
            value={stats.returned}
            icon={RefreshCw}
            trend="down"
            trendValue="3"
            color="amber"
            onClick={() => handleCardClick('returned')}
          />
        </div>
      )}

      {/* Charts and Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isBranchApprover ? (
          <>
            {/* Request Status Distribution for Branch Approver */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Request Status Distribution</h2>
                <div className="flex items-center space-x-2">
                  <PieChart className="h-5 w-5 text-gray-400" />
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'Pending Requests', value: stats.pendingApprovals || 0, total: (stats.pendingApprovals || 0) + (stats.approvedRequests || 0) + (stats.rejectedRequests || 0) + (stats.pendingKYC || 0), color: 'bg-yellow-500' },
                  { label: 'Pending KYC', value: stats.pendingKYC || 0, total: (stats.pendingApprovals || 0) + (stats.approvedRequests || 0) + (stats.rejectedRequests || 0) + (stats.pendingKYC || 0), color: 'bg-blue-500' },
                  { label: 'Approved', value: stats.approvedRequests || 0, total: (stats.pendingApprovals || 0) + (stats.approvedRequests || 0) + (stats.rejectedRequests || 0) + (stats.returnedForCorrection || 0), color: 'bg-emerald-500' },
                  { label: 'Rejected', value: stats.rejectedRequests || 0, total: (stats.pendingApprovals || 0) + (stats.approvedRequests || 0) + (stats.rejectedRequests || 0) + (stats.returnedForCorrection || 0), color: 'bg-red-500' },
                ].map((item) => {
                  const percentage = item.total > 0 ? Math.round((item.value / item.total) * 100) : 0;
                  return (
                    <div 
                      key={item.label} 
                      className="space-y-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                      onClick={() => handleCardClick(item.label.toLowerCase().replace(/\s+/g, '-').replace('kyc', 'kyc'))}
                    >
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{item.label}</span>
                        <span className="font-medium">{item.value} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${item.color}`} 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : isAuditor ? (
          <>
            {/* Audit Status Distribution for Auditor */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Audit Status Distribution</h2>
                <div className="flex items-center space-x-2">
                  <PieChart className="h-5 w-5 text-gray-400" />
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'Compliant', value: 6, total: 10, color: 'bg-emerald-500' },
                  { label: 'Requires Action', value: 2, total: 10, color: 'bg-amber-500' },
                  { label: 'Non-Compliant', value: 1, total: 10, color: 'bg-red-500' },
                  { label: 'Pending Review', value: 1, total: 10, color: 'bg-gray-500' }
                ].map((item) => {
                  const percentage = Math.round((item.value / item.total) * 100);
                  return (
                    <div 
                      key={item.label} 
                      className="space-y-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                    >
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{item.label}</span>
                        <span className="font-medium">{item.value} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${item.color}`} 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Risk Assessment for Auditor */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Risk Assessment</h2>
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-gray-400" />
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'Critical Risk', value: 0, color: 'bg-red-500', textColor: 'text-red-600' },
                  { label: 'High Risk', value: 3, color: 'bg-orange-500', textColor: 'text-orange-600' },
                  { label: 'Medium Risk', value: 5, color: 'bg-yellow-500', textColor: 'text-yellow-600' },
                  { label: 'Low Risk', value: 2, color: 'bg-green-500', textColor: 'text-green-600' }
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${item.color}`} />
                      <span className="text-sm text-gray-700">{item.label}</span>
                    </div>
                    <span className={`text-sm font-semibold ${item.textColor}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* QR Status Distribution for other roles */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">QR Status Distribution</h2>
                <div className="flex items-center space-x-2">
                  <PieChart className="h-5 w-5 text-gray-400" />
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'Unallocated', value: stats.unallocated, total: stats.totalQRs, color: 'bg-gray-500' },
                  { label: 'Allocated', value: stats.allocated, total: stats.totalQRs, color: 'bg-emerald-500' },
                  { label: 'Issued', value: stats.issued, total: stats.totalQRs, color: 'bg-blue-500' },
                  { label: 'Returned', value: stats.returned, total: stats.totalQRs, color: 'bg-amber-500' }
                ].map((item) => {
                  const percentage = Math.round((item.value / item.total) * 100);
                  return (
                    <div 
                      key={item.label} 
                      className="space-y-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                      onClick={() => handleCardClick(item.label.toLowerCase().replace(' ', '-'))}
                    >
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{item.label}</span>
                        <span className="font-medium">{item.value} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${item.color}`} 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {!isBranchApprover && (
          /* Top Performing Branches - Only for non-approvers */
          <div 
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Top Performing Branches</h2>
              <div 
                className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                onClick={() => handleCardClick('top-branches')}
              >
                <Building className="h-5 w-5 text-gray-400" />
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
            </div>
            <div className="space-y-4">
              {stats.topBranches.map((branch, index) => (
                <div 
                  key={branch.name} 
                  className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                  onClick={() => handleBranchClick(branch.name)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-100 text-gray-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      <span className="font-medium text-sm">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{branch.name}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{branch.count}</p>
                    <p className="text-sm text-gray-500">QRs issued</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Performing Regions - Only for Admin */}
        {user.role === 'system_admin' && (
          <div 
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Top Performing Regions</h2>
              <div 
                className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                onClick={() => handleCardClick('top-regions')}
              >
                <BarChart3 className="h-5 w-5 text-gray-400" />
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
            </div>
            <div className="space-y-4">
              {stats.topRegions?.map((region, index) => (
                <div 
                  key={region.name} 
                  className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                  onClick={() => handleRegionClick(region.name)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      index === 0 ? 'bg-purple-100 text-purple-800' :
                      index === 1 ? 'bg-indigo-100 text-indigo-800' :
                      'bg-teal-100 text-teal-800'
                    }`}>
                      <span className="font-medium text-sm">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{region.name}</p>
                      <p className="text-sm text-gray-500">{region.branchCount} branches</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{region.count}</p>
                    <p className="text-sm text-gray-500">QRs issued</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Top Sales Users */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {isBranchApprover ? 'Branch Sales Performers' : 'Top Sales Performers'}
            </h2>
            <div 
              className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
              onClick={() => handleCardClick('top-sellers')}
            >
              <Users className="h-5 w-5 text-gray-400" />
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>
          </div>
          <div className="space-y-4">
            {stats.topSellers.map((seller, index) => (
              <div 
                key={seller.name} 
                className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                onClick={() => handleSellerClick(seller.name)}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    index === 0 ? 'bg-blue-100 text-blue-800' :
                    index === 1 ? 'bg-emerald-100 text-emerald-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    <span className="font-medium text-sm">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{seller.name}</p>
                    <p className="text-sm text-gray-500">{seller.branch || 'Multiple Branches'}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{seller.count}</p>
                  <p className="text-sm text-gray-500">QRs sold</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div 
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
          onClick={handleActivityClick}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>
          </div>
          <div className="space-y-4">
            {stats.recentActivity.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${
                  activity.actionType.includes('GENERATED') ? 'bg-blue-500' :
                  activity.actionType.includes('APPROVED') ? 'bg-emerald-500' :
                  activity.actionType.includes('ISSUED') ? 'bg-indigo-500' :
                  'bg-gray-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">
                    {activity.actionType.replace('_', ' ').toLowerCase()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">{detailTitle}</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              {detailType === 'activity' ? (
                // Activity Details
                detailData?.map((activity: any, index: number) => (
                  <div key={activity.id || index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {activity.requestNumber ? (
                          // Request data
                          <>
                            <div className="flex items-center space-x-2 mb-2">
                              <span className={`w-3 h-3 rounded-full ${
                                activity.status === 'pending' ? 'bg-yellow-500' :
                                activity.status === 'approved' ? 'bg-emerald-500' :
                                activity.status === 'rejected' ? 'bg-red-500' :
                                'bg-gray-500'
                              }`} />
                              <h3 className="font-medium text-gray-900">
                                Request {activity.requestNumber}
                              </h3>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              Purpose: {activity.requestedFor}
                            </p>
                            <p className="text-sm text-gray-600 mb-2">
                              QR Count: {activity.requestedQrCount}
                            </p>
                            <p className="text-xs text-gray-500">
                              Created: {new Date(activity.createdAt).toLocaleString()}
                            </p>
                            {activity.approvedAt && (
                              <p className="text-xs text-gray-500">
                                Approved: {new Date(activity.approvedAt).toLocaleString()}
                              </p>
                            )}
                          </>
                        ) : (
                          // Activity log data
                          <>
                            <div className="flex items-center space-x-2 mb-2">
                              <span className={`w-3 h-3 rounded-full ${
                                activity.actionType?.includes('GENERATED') ? 'bg-blue-500' :
                                activity.actionType?.includes('APPROVED') ? 'bg-emerald-500' :
                                activity.actionType?.includes('ISSUED') ? 'bg-indigo-500' :
                                'bg-gray-500'
                              }`} />
                              <h3 className="font-medium text-gray-900">
                                {activity.actionType?.replace('_', ' ').toLowerCase() || 'Activity'}
                              </h3>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              Target: {activity.targetEntity}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(activity.timestamp).toLocaleString()}
                            </p>
                          </>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {activity.status && (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            activity.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                            activity.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {activity.status}
                          </span>
                        )}
                        {activity.actorUserId && (
                          <p className="mt-1">User: {activity.actorUserId}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : detailType === 'region-performance' ? (
                // Region Performance Details
                detailData?.map((region: any, index: number) => (
                  <div key={region.name} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-2">{region.name}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                          <div>
                            <p className="text-sm text-gray-600">Total QRs</p>
                            <p className="font-semibold text-gray-900">{region.totalQRs}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Issued</p>
                            <p className="font-semibold text-gray-900">{region.issued}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Utilization</p>
                            <p className="font-semibold text-gray-900">{Math.round((region.issued / region.totalQRs) * 100)}%</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Branches</p>
                            <p className="font-semibold text-gray-900">{region.branches?.length || 0}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Branches:</p>
                          <p className="text-sm text-gray-900">{region.branches?.join(', ')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : detailType === 'seller-performance' ? (
                // Seller Performance Details
                detailData?.map((seller: any, index: number) => (
                  <div key={seller.userId} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <span className="text-blue-600 font-medium text-sm">
                              {seller.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{seller.name}</h3>
                            <p className="text-sm text-gray-500">{seller.branch}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                          <div>
                            <p className="text-sm text-gray-600">Total Sales</p>
                            <p className="font-semibold text-gray-900">{seller.totalSales}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">This Month</p>
                            <p className="font-semibold text-gray-900">{seller.thisMonth}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Last Month</p>
                            <p className="font-semibold text-gray-900">{seller.lastMonth}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Avg/Week</p>
                            <p className="font-semibold text-gray-900">{seller.avgPerWeek}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Top Merchants:</p>
                          <p className="text-sm text-gray-900">{seller.topMerchants?.join(', ')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : detailType === 'branch-performance' ? (
                // Branch Performance Details
                detailData?.map((branch: any, index: number) => (
                  <div key={branch.branchId} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Building className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{branch.branchName}</h3>
                            <p className="text-sm text-gray-500">{branch.branchCode}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                          <div>
                            <p className="text-sm text-gray-600">Total Allocated</p>
                            <p className="font-semibold text-gray-900">{branch.totalAllocated}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Available</p>
                            <p className="font-semibold text-gray-900">{branch.available}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Issued</p>
                            <p className="font-semibold text-gray-900">{branch.issued}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Utilization</p>
                            <p className="font-semibold text-gray-900">{branch.utilizationRate}%</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Returned</p>
                            <p className="text-sm text-gray-900">{branch.returned}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Blocked</p>
                            <p className="text-sm text-gray-900">{branch.blocked}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                // QR Code Details
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          QR Code
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
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {detailData?.slice(0, 50).map((qr: any) => (
                        <tr key={qr.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <QrCode className="h-5 w-5 text-gray-400 mr-3" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">{qr.qrValue}</div>
                                <div className="text-sm text-gray-500">{qr.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">{qr.qrType}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              qr.status === 'unallocated' ? 'bg-gray-100 text-gray-800' :
                              qr.status === 'allocated' ? 'bg-blue-100 text-blue-800' :
                              qr.status === 'issued' ? 'bg-emerald-100 text-emerald-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {qr.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {qr.allocatedBranchId || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(qr.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {detailData?.length > 50 && (
                    <div className="text-center py-4 text-sm text-gray-500">
                      Showing first 50 of {detailData.length} records
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;