import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, Download, Calendar, Filter,
  Users, QrCode, Building, Store, CheckCircle, Clock,
  XCircle, ArrowUpRight, ArrowDownRight, PieChart, AlertTriangle,
  FileText, Package, Target, Award, Activity
} from 'lucide-react';
import { User } from '../types';
import { apiService } from '../services/api';

interface ReportsProps {
  user: User;
}

const Reports: React.FC<ReportsProps> = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');
  const [reportData, setReportData] = useState<any>(null);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);
  const [detailTitle, setDetailTitle] = useState('');

  const handleDrillDown = async (type: string, data: any) => {
    try {
      let detailInfo;
      let title;
      
      switch (type) {
        case 'stat-card':
          // Handle stat card drill-downs
          const statTitle = data.title.toLowerCase().replace(/\s+/g, '_');
          detailInfo = await generateDetailData(statTitle, data.value);
          title = `${data.title} - Detailed Breakdown`;
          break;
          
        case 'chart-bar':
          // Handle bar chart drill-downs
          detailInfo = await generateDetailData('chart_bar', data);
          title = `${data.name} - Detailed Analysis`;
          break;
          
        case 'chart-line':
          // Handle line chart drill-downs
          detailInfo = await generateDetailData('chart_line', data);
          title = `${data.month || data.week || data.day} - Time Series Data`;
          break;
          
        case 'chart-pie':
          // Handle pie chart drill-downs
          detailInfo = await generateDetailData('chart_pie', data);
          title = `${data.category} - Category Breakdown`;
          break;
          
        case 'table-row':
          // Handle table row drill-downs
          detailInfo = await generateDetailData('table_row', data);
          title = `${data[0]} - Detailed Information`;
          break;
          
        default:
          detailInfo = [{ name: 'No data', value: 'N/A', status: 'Unknown', date: new Date().toLocaleDateString() }];
          title = 'Detail View';
      }
      
      setDetailData(detailInfo);
      setDetailTitle(title);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Failed to load drill-down data:', error);
    }
  };

  const generateDetailData = async (type: string, data: any): Promise<any[]> => {
    // Generate mock detailed data based on the type and input data
    switch (type) {
      case 'total_qrs':
      case 'qr_utilization':
      case 'system_health':
        return Array.from({ length: 10 }, (_, i) => ({
          id: `qr_${i + 1}`,
          name: `QR Code ${i + 1}`,
          value: `QR${String(i + 1).padStart(3, '0')}`,
          status: ['Active', 'Pending', 'Issued'][i % 3],
          branch: ['Downtown', 'Uptown', 'Westside'][i % 3],
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleDateString()
        }));
        
      case 'total_branches':
      case 'total_users':
        return Array.from({ length: 5 }, (_, i) => ({
          id: `item_${i + 1}`,
          name: `${type.includes('branch') ? 'Branch' : 'User'} ${i + 1}`,
          value: `${type.includes('branch') ? 'BR' : 'USR'}${String(i + 1).padStart(3, '0')}`,
          status: 'Active',
          region: ['Central', 'North', 'South', 'East', 'West'][i % 5],
          date: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
        }));
        
      case 'chart_bar':
        return Array.from({ length: 8 }, (_, i) => ({
          id: `detail_${i + 1}`,
          name: `${data.name} - Item ${i + 1}`,
          value: Math.floor(Math.random() * data.value),
          status: ['Completed', 'In Progress', 'Pending'][i % 3],
          category: data.name,
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleDateString()
        }));
        
      case 'chart_line':
        return Object.entries(data).filter(([key]) => 
          key !== 'month' && key !== 'week' && key !== 'day'
        ).map(([key, value], i) => ({
          id: `line_${i + 1}`,
          name: `${key.charAt(0).toUpperCase() + key.slice(1)}`,
          value: value as number,
          status: 'Active',
          period: data.month || data.week || data.day,
          date: new Date().toLocaleDateString()
        }));
        
      case 'chart_pie':
        return Array.from({ length: data.value }, (_, i) => ({
          id: `pie_${i + 1}`,
          name: `${data.category} - Item ${i + 1}`,
          value: 1,
          status: 'Active',
          category: data.category,
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleDateString()
        }));
        
      case 'table_row':
        return Array.from({ length: 5 }, (_, i) => ({
          id: `row_${i + 1}`,
          name: `${data[0]} - Detail ${i + 1}`,
          value: data[1] || 'N/A',
          status: data[2] || 'Active',
          category: data[0],
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleDateString()
        }));
        
      default:
        return [{ 
          id: 'default_1',
          name: 'Sample Data', 
          value: 'N/A', 
          status: 'Unknown', 
          date: new Date().toLocaleDateString() 
        }];
    }
  };

  useEffect(() => {
    loadReportData();
  }, [dateRange]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      // Generate role-specific and branch-filtered data
      const data = await generateReportData(user.role, dateRange, user.branchId);
      setReportData(data);
    } catch (error) {
      console.error('Failed to load report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReportData = async (role: string, range: string, branchId?: string) => {
    const baseData = {
      dateRange: range,
      generatedAt: new Date().toISOString(),
      branchId: branchId,
      branchName: branchId ? await getBranchName(branchId) : null
    };

    switch (role) {
      case 'system_admin':
        return {
          ...baseData,
          title: 'System Administration Report',
          summary: {
            totalQRs: 500,
            totalBranches: 3,
            totalUsers: 8,
            totalMerchants: 120,
            qrUtilization: 60.0,
            systemHealth: 99.2,
            activeRequests: 2,
            completedRequests: 4
          },
          charts: [
            {
              title: 'QR Code Distribution by Branch',
              type: 'bar',
              data: [
                { name: 'Downtown', value: 100, change: 12.5, utilization: 90.0 },
                { name: 'Uptown', value: 100, change: 8.3, utilization: 90.0 },
                { name: 'Westside', value: 100, change: -2.1, utilization: 70.0 }
              ]
            },
            {
              title: 'Monthly QR Generation vs Issuance Trend',
              type: 'line',
              data: [
                { month: 'Jan', generated: 100, issued: 80, returned: 8, blocked: 2 },
                { month: 'Feb', generated: 120, issued: 96, returned: 10, blocked: 3 },
                { month: 'Mar', generated: 150, issued: 120, returned: 15, blocked: 5 },
                { month: 'Apr', generated: 130, issued: 104, returned: 12, blocked: 4 },
                { month: 'May', generated: 0, issued: 0, returned: 0, blocked: 0 }
              ]
            },
            {
              title: 'Regional Performance Distribution',
              type: 'pie',
              data: [
                { category: 'Central Region', value: 40, color: '#3B82F6' },
                { category: 'North Region', value: 40, color: '#10B981' },
                { category: 'West Region', value: 20, color: '#F59E0B' }
              ]
            }
          ],
          tables: [
            {
              title: 'Top Performing Branches (Detailed)',
              headers: ['Branch', 'QRs Allocated', 'QRs Issued', 'Utilization', 'Merchants', 'Status'],
              rows: [
                ['Downtown Branch', '100', '40', '90.0%', '40', 'Active'],
                ['Uptown Branch', '100', '40', '90.0%', '40', 'Active'],
                ['Westside Branch', '100', '20', '70.0%', '20', 'Active']
              ]
            },
            {
              title: 'System Performance Metrics',
              headers: ['Metric', 'Current', 'Target', 'Status'],
              rows: [
                ['QR Utilization Rate', '60.0%', '75%', 'Good'],
                ['Request Approval Time', '2.3 hrs', '4 hrs', 'Excellent'],
                ['System Uptime', '99.2%', '99%', 'Excellent'],
                ['Active Branches', '3', '5', 'Good']
              ]
            }
          ]
        };

      case 'branch_manager':
        return {
          ...baseData,
          title: 'Branch Management Report',
          branchName: baseData.branchName,
          summary: {
            branchQRs: 100,
            activeUsers: 3,
            merchantsServed: 40,
            monthlyIssuance: 40,
            branchUtilization: 90.0,
            customerSatisfaction: 4.7,
            pendingRequests: 1,
            teamPerformance: 92.5
          },
          charts: [
            {
              title: 'Daily QR Issuance vs Returns',
              type: 'line',
              data: [
                { day: 'Mon', issued: 6, returned: 1, available: 50 },
                { day: 'Tue', issued: 8, returned: 0, available: 48 },
                { day: 'Wed', issued: 5, returned: 2, available: 46 },
                { day: 'Thu', issued: 7, returned: 1, available: 45 },
                { day: 'Fri', issued: 9, returned: 1, available: 44 },
                { day: 'Sat', issued: 3, returned: 0, available: 47 },
                { day: 'Sun', issued: 2, returned: 0, available: 49 }
              ]
            },
            {
              title: 'Sales Team Performance vs Targets',
              type: 'bar',
              data: [
                { name: 'Mike Sales', value: 40, target: 35, achievement: 114.3 },
                { name: 'Branch Manager', value: 0, target: 0, achievement: 0 },
                { name: 'Branch Approver', value: 0, target: 0, achievement: 0 }
              ]
            },
            {
              title: 'Merchant Category Distribution',
              type: 'pie',
              data: [
                { category: 'Retail', value: 15, color: '#3B82F6' },
                { category: 'Food & Beverage', value: 12, color: '#10B981' },
                { category: 'Services', value: 8, color: '#F59E0B' },
                { category: 'Others', value: 5, color: '#8B5CF6' }
              ]
            }
          ],
          tables: [
            {
              title: 'Top Merchants This Month',
              headers: ['Merchant', 'QRs Issued', 'Status', 'Last Activity'],
              rows: [
                ['Downtown Shop 1', '1', 'Active', '2024-01-15'],
                ['Downtown Shop 2', '1', 'Active', '2024-01-14'],
                ['Downtown Shop 3', '1', 'Active', '2024-01-13'],
                ['Downtown Shop 4', '1', 'Active', '2024-01-12'],
                ['Downtown Shop 5', '1', 'Active', '2024-01-11']
              ]
            },
            {
              title: 'Branch Operational Metrics',
              headers: ['Metric', 'This Month', 'Last Month', 'Change', 'Target'],
              rows: [
                ['QRs Issued', '40', '35', '+14.3%', '35'],
                ['New Merchants', '40', '35', '+14.3%', '30'],
                ['Customer Satisfaction', '4.7', '4.5', '+4.4%', '4.5'],
                ['Processing Time', '1.2 hrs', '1.5 hrs', '-20%', '2 hrs']
              ]
            }
          ]
        };

      case 'branch_approver':
        return {
          ...baseData,
          title: 'Approval Management Report',
          branchName: baseData.branchName,
          summary: {
            pendingApprovals: 1,
            approvedThisMonth: 2,
            rejectedThisMonth: 0,
            averageApprovalTime: 2.3,
            approvalRate: 100.0,
            workloadScore: 7.2,
            escalatedRequests: 0,
            complianceScore: 98.5
          },
          charts: [
            {
              title: 'Weekly Approval Trends',
              type: 'line',
              data: [
                { week: 'Week 1', approved: 1, rejected: 0, pending: 0, escalated: 0 },
                { week: 'Week 2', approved: 1, rejected: 0, pending: 1, escalated: 0 },
                { week: 'Week 3', approved: 0, rejected: 0, pending: 0, escalated: 0 },
                { week: 'Week 4', approved: 0, rejected: 0, pending: 0, escalated: 0 }
              ]
            },
            {
              title: 'Request Categories Breakdown',
              type: 'pie',
              data: [
                { category: 'New Merchant', value: 1, color: '#3B82F6' },
                { category: 'Additional QRs', value: 1, color: '#10B981' },
                { category: 'Replacement', value: 0, color: '#F59E0B' },
                { category: 'Bulk Request', value: 0, color: '#8B5CF6' }
              ]
            },
            {
              title: 'Approval Time Distribution',
              type: 'bar',
              data: [
                { name: '< 1 hour', value: 2, percentage: 100.0 },
                { name: '1-4 hours', value: 0, percentage: 0.0 },
                { name: '4-24 hours', value: 0, percentage: 0.0 },
                { name: '> 24 hours', value: 0, percentage: 0.0 }
              ]
            }
          ],
          tables: [
            {
              title: 'Recent Approval Activity',
              headers: ['Request ID', 'Type', 'Requestor', 'Amount', 'Status'],
              rows: [
                ['REQ-BR1-001', 'Additional QRs', 'Mike Sales', '25 QRs', 'Pending'],
                ['REQ-BR1-002', 'Small Business', 'Mike Sales', '15 QRs', 'Approved']
              ]
            },
            {
              title: 'Approval Performance Metrics',
              headers: ['Metric', 'This Month', 'Last Month', 'Target', 'Status'],
              rows: [
                ['Approval Rate', '100.0%', '95.0%', '90%', 'Above Target'],
                ['Avg Processing Time', '2.3 hrs', '2.8 hrs', '4 hrs', 'Excellent'],
                ['Compliance Score', '98.5%', '97.1%', '95%', 'Excellent'],
                ['Escalation Rate', '0.0%', '2.1%', '5%', 'Excellent']
              ]
            }
          ]
        };

      case 'sales_user':
        return {
          ...baseData,
          title: 'Sales Performance Report',
          salesPerson: user.name,
          branchName: baseData.branchName,
          summary: {
            qrsSold: 40,
            merchantsAcquired: 40,
            monthlyTarget: 35,
            achievementRate: 114.3,
            avgQRsPerMerchant: 1.0,
            conversionRate: 100.0,
            revenue: 12000,
            ranking: 2
          },
          charts: [
            {
              title: 'Weekly Sales Performance vs Target',
              type: 'bar',
              data: [
                { week: 'Week 1', sold: 10, target: 9, revenue: 3000 },
                { week: 'Week 2', sold: 12, target: 9, revenue: 3600 },
                { week: 'Week 3', sold: 10, target: 9, revenue: 3000 },
                { week: 'Week 4', sold: 8, target: 8, revenue: 2400 }
              ]
            },
            {
              title: 'Merchant Categories Acquired',
              type: 'pie',
              data: [
                { category: 'Retail', value: 15, color: '#3B82F6' },
                { category: 'Food & Beverage', value: 12, color: '#10B981' },
                { category: 'Services', value: 8, color: '#F59E0B' },
                { category: 'Others', value: 5, color: '#8B5CF6' }
              ]
            },
            {
              title: 'Monthly Performance Trend',
              type: 'line',
              data: [
                { month: 'Jan', qrs: 35, merchants: 35, revenue: 10500 },
                { month: 'Feb', qrs: 38, merchants: 38, revenue: 11400 },
                { month: 'Mar', qrs: 40, merchants: 40, revenue: 12000 },
                { month: 'Apr', qrs: 0, merchants: 0, revenue: 0 }
              ]
            }
          ],
          tables: [
            {
              title: 'Recent Merchant Acquisitions',
              headers: ['Merchant Name', 'Category', 'QRs Issued', 'Date', 'Status'],
              rows: [
                ['Downtown Shop 1', 'Retail', '1', '2024-01-15', 'Active'],
                ['Downtown Shop 2', 'F&B', '1', '2024-01-14', 'Active'],
                ['Downtown Shop 3', 'Services', '1', '2024-01-12', 'Active'],
                ['Downtown Shop 4', 'Retail', '1', '2024-01-10', 'Active']
              ]
            },
            {
              title: 'Performance Comparison',
              headers: ['Metric', 'My Performance', 'Branch Average', 'Target'],
              rows: [
                ['QRs Sold', '40', '40', '35'],
                ['Merchants Acquired', '40', '40', '30'],
                ['Conversion Rate', '100.0%', '100.0%', '75%'],
                ['Achievement Rate', '114.3%', '114.3%', '100%']
              ]
            }
          ]
        };

      case 'auditor':
        return {
          ...baseData,
          title: 'Audit & Compliance Report',
          branchName: baseData.branchName,
          summary: {
            auditScore: 96.8,
            complianceIssues: 0,
            resolvedIssues: 2,
            riskLevel: 'Low',
            lastAuditDate: '2024-01-10',
            nextAuditDue: '2024-04-10',
            systemIntegrity: 99.1,
            dataAccuracy: 98.5
          },
          charts: [
            {
              title: 'Compliance Score Trends',
              type: 'line',
              data: [
                { month: 'Jan', score: 94.2, issues: 2, resolved: 1 },
                { month: 'Feb', score: 95.8, issues: 1, resolved: 2 },
                { month: 'Mar', score: 96.8, issues: 0, resolved: 1 },
                { month: 'Apr', score: 97.1, issues: 0, resolved: 0 }
              ]
            },
            {
              title: 'Risk Assessment Distribution',
              type: 'pie',
              data: [
                { category: 'Low Risk', value: 95, color: '#10B981' },
                { category: 'Medium Risk', value: 5, color: '#F59E0B' },
                { category: 'High Risk', value: 0, color: '#EF4444' },
                { category: 'Critical', value: 0, color: '#7C2D12' }
              ]
            },
            {
              title: 'Audit Findings by Category',
              type: 'bar',
              data: [
                { name: 'Process Compliance', value: 0, severity: 'Low' },
                { name: 'Data Integrity', value: 0, severity: 'Low' },
                { name: 'Security Controls', value: 0, severity: 'Low' },
                { name: 'Documentation', value: 0, severity: 'Low' }
              ]
            }
          ],
          tables: [
            {
              title: 'Recent Audit Findings',
              headers: ['Finding ID', 'Category', 'Severity', 'Status', 'Due Date'],
              rows: [
                ['AUD-2024-001', 'Process Compliance', 'Low', 'Resolved', '2024-01-20'],
                ['AUD-2024-002', 'Data Integrity', 'Low', 'Resolved', '2024-01-25']
              ]
            },
            {
              title: 'Compliance Metrics',
              headers: ['Control Area', 'Score', 'Last Review', 'Next Review', 'Status'],
              rows: [
                ['QR Code Management', '99.5%', '2024-01-10', '2024-04-10', 'Excellent'],
                ['User Access Control', '98.2%', '2024-01-08', '2024-04-08', 'Excellent'],
                ['Data Protection', '99.8%', '2024-01-12', '2024-04-12', 'Excellent'],
                ['Audit Trail', '99.1%', '2024-01-15', '2024-04-15', 'Excellent']
              ]
            }
          ]
        };

      default:
        return baseData;
    }
  };

  const getBranchName = async (branchId: string): Promise<string> => {
    const branches = await apiService.getBranches();
    const branch = branches.find(b => b.id === branchId);
    return branch ? branch.name : 'Unknown Branch';
  };

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    const filename = `${reportData.title.replace(/\s+/g, '_')}_${dateRange}days.${format}`;
    console.log(`Exporting report as ${filename}`);
    // In a real app, this would trigger the actual export
  };

  const StatCard = ({ title, value, change, icon: Icon, color = 'blue' }: any) => (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="flex items-center space-x-2 mt-1">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {change && (
              <div className="flex items-center space-x-1">
                {change > 0 ? (
                  <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-600" />
                )}
                <span className={`text-sm font-medium ${
                  change > 0 ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  {Math.abs(change)}%
                </span>
              </div>
            )}
          </div>
        </div>
        <div className={`p-3 rounded-lg bg-${color}-50`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  if (loading || !reportData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{reportData.title}</h1>
          <p className="text-gray-600">
            {reportData.branchName && `${reportData.branchName} • `}
            {reportData.salesPerson && `${reportData.salesPerson} • `}
            Generated on {new Date(reportData.generatedAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <div className="relative">
            <select 
              onChange={(e) => e.target.value && handleExport(e.target.value as any)}
              className="appearance-none bg-blue-700 text-white px-4 py-2 rounded-lg pr-10 hover:bg-blue-800"
            >
              <option value="">Export Report</option>
              <option value="pdf">Export as PDF</option>
              <option value="excel">Export as Excel</option>
              <option value="csv">Export as CSV</option>
            </select>
            <Download className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(reportData.summary).map(([key, value], index) => {
          const icons = [QrCode, Building, Users, Store, TrendingUp, CheckCircle, Package, Target, Award, Activity, AlertTriangle, FileText];
          const colors = ['blue', 'emerald', 'indigo', 'purple', 'amber', 'green', 'red', 'pink', 'cyan', 'orange', 'teal', 'gray'];
          return (
            <StatCard
              key={key}
              title={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              value={typeof value === 'number' ? (value % 1 === 0 ? value.toLocaleString() : value.toFixed(1)) : value}
              icon={icons[index % icons.length]}
              color={colors[index % colors.length]}
            />
          );
        })}
      </div>

      {/* Charts */}
      {reportData.charts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {reportData.charts.map((chart: any, index: number) => (
            <div key={index} className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{chart.title}</h3>
                <div className="flex items-center space-x-2">
                  {chart.type === 'bar' && <BarChart3 className="h-5 w-5 text-gray-400" />}
                  {chart.type === 'line' && <TrendingUp className="h-5 w-5 text-gray-400" />}
                  {chart.type === 'pie' && <PieChart className="h-5 w-5 text-gray-400" />}
                </div>
              </div>
              
              {chart.type === 'bar' && (
                <div className="space-y-4">
                  {chart.data.map((item: any, i: number) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{item.name}</span>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{item.value}</span>
                          {item.target && (
                            <span className="text-xs text-gray-500">/ {item.target}</span>
                          )}
                          {item.change && (
                            <span className={`text-xs ${item.change > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                              {item.change > 0 ? '+' : ''}{item.change}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(item.value / Math.max(...chart.data.map((d: any) => d.value))) * 100}%` }}
                        />
                        {item.target && (
                          <div 
                            className="absolute h-2 w-0.5 bg-red-500 rounded-full -mt-2" 
                            style={{ marginLeft: `${(item.target / Math.max(...chart.data.map((d: any) => d.value))) * 100}%` }}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {chart.type === 'line' && (
                <div className="space-y-4">
                  {chart.data.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">
                        {item.month || item.week || item.day}
                      </span>
                      <div className="flex items-center space-x-4">
                        {Object.entries(item).filter(([key]) => 
                          key !== 'month' && key !== 'week' && key !== 'day'
                        ).map(([key, value]) => (
                          <div key={key} className="text-center">
                            <div className="text-xs text-gray-500 capitalize">{key}</div>
                            <div className="text-sm font-semibold text-gray-900">{value as number}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {chart.type === 'pie' && (
                <div className="space-y-3">
                  {chart.data.map((item: any, i: number) => (
                    <div 
                      key={i} 
                      className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                      onClick={() => handleDrillDown('chart-pie', item)}
                    >
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm text-gray-700">{item.category}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tables */}
      {reportData.tables && (
        <div className="space-y-6">
          {reportData.tables.map((table: any, index: number) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-medium text-gray-900">{table.title}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {table.headers.map((header: string, i: number) => (
                        <th key={i} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {table.rows.map((row: string[], i: number) => (
                      <tr 
                        key={i} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleDrillDown('table-row', row)}
                      >
                        {row.map((cell: string, j: number) => (
                          <td key={j} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {cell.includes('%') && (cell.includes('+') || cell.includes('-')) ? (
                              <span className={`font-medium ${cell.includes('+') ? 'text-emerald-600' : 'text-red-600'}`}>
                                {cell}
                              </span>
                            ) : cell === 'Active' || cell === 'Approved' || cell === 'Compliant' || cell === 'Excellent' ? (
                              <span className="px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-800 rounded-full">
                                {cell}
                              </span>
                            ) : cell === 'Pending' || cell === 'In Progress' ? (
                              <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                                {cell}
                              </span>
                            ) : cell === 'Open' || cell === 'High' ? (
                              <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                                {cell}
                              </span>
                            ) : cell === 'Above Target' ? (
                              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                {cell}
                              </span>
                            ) : cell === 'Good' ? (
                              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                {cell}
                              </span>
                            ) : (
                              cell
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

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
              {Array.isArray(detailData) ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Item
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Value
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {detailData.map((item: any, index: number) => (
                        <tr key={item.id || index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.name || item.category || `Item ${index + 1}`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.value || item.count || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              item.status === 'Active' || item.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                              item.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {item.status || 'Active'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.date || new Date().toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No detailed data available</p>
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

export default Reports;