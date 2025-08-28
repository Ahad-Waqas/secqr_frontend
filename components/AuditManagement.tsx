import React, { useState, useEffect } from 'react';
import { 
  Shield, Search, Filter, Calendar, Download, FileText, 
  User as UserIcon, Building, Activity, AlertTriangle, 
  CheckCircle, Clock, BarChart3, TrendingUp, Eye, Plus,
  Edit, Save, RefreshCw, Target, Award, XCircle, ChevronRight,
  PieChart, Clipboard, Star, Flag
} from 'lucide-react';
import { User, AuditLog, AuditItem, AuditChecklist, AuditScorecard } from '../types';
import { apiService } from '../services/api';

interface AuditManagementProps {
  user: User;
}

const AuditManagement: React.FC<AuditManagementProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'items' | 'checklists' | 'logs' | 'reports'>('dashboard');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditItems, setAuditItems] = useState<AuditItem[]>([]);
  const [auditChecklists, setAuditChecklists] = useState<AuditChecklist[]>([]);
  const [scorecard, setScorecard] = useState<AuditScorecard | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showReportModal, setShowReportModal] = useState(false);
  const [showLogDetailModal, setShowLogDetailModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showCreateItemModal, setShowCreateItemModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [selectedItem, setSelectedItem] = useState<AuditItem | null>(null);
  const [generatedReport, setGeneratedReport] = useState<any>(null);
  
  // Filters
  const [logFilters, setLogFilters] = useState({
    dateFrom: '',
    dateTo: '',
    actionType: '',
    userId: '',
    branchId: ''
  });
  
  const [itemFilters, setItemFilters] = useState({
    category: '',
    status: '',
    riskLevel: '',
    branchId: '',
    dueDate: ''
  });
  
  // Forms
  const [reportForm, setReportForm] = useState({
    type: 'compliance' as 'compliance' | 'security' | 'performance' | 'user_activity',
    dateFrom: '',
    dateTo: '',
    branchId: ''
  });
  
  const [itemForm, setItemForm] = useState({
    status: 'pending' as AuditItem['status'],
    findings: '',
    recommendations: '',
    score: 0,
    evidence: [] as string[]
  });
  
  const [createItemForm, setCreateItemForm] = useState({
    category: 'process_compliance' as AuditItem['category'],
    subcategory: '',
    title: '',
    description: '',
    riskLevel: 'medium' as AuditItem['riskLevel'],
    targetEntity: '',
    targetEntityId: '',
    branchId: '',
    dueDate: ''
  });
  
  const [generating, setGenerating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [creating, setCreating] = useState(false);

  const isAuditor = user.role === 'auditor';
  const isAdmin = user.role === 'system_admin';

  useEffect(() => {
    if (isAuditor || isAdmin) {
      loadAllData();
    }
  }, [isAuditor, isAdmin]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [logsData, itemsData, checklistsData, scorecardData] = await Promise.all([
        apiService.getAuditLogs(logFilters),
        apiService.getAuditItems(itemFilters),
        apiService.getAuditChecklists(),
        apiService.generateAuditScorecard('current')
      ]);
      
      setAuditLogs(logsData);
      setAuditItems(itemsData);
      setAuditChecklists(checklistsData);
      setScorecard(scorecardData);
    } catch (error) {
      console.error('Failed to load audit data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAuditItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    
    setUpdating(true);
    try {
      await apiService.updateAuditItem(selectedItem.id, itemForm);
      setShowItemModal(false);
      setSelectedItem(null);
      resetItemForm();
      loadAllData();
    } catch (error) {
      console.error('Failed to update audit item:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleCreateAuditItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    
    try {
      await apiService.createAuditItem(createItemForm);
      setShowCreateItemModal(false);
      resetCreateItemForm();
      loadAllData();
    } catch (error) {
      console.error('Failed to create audit item:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    
    try {
      const report = await apiService.generateAuditReport(reportForm.type, {
        dateFrom: reportForm.dateFrom,
        dateTo: reportForm.dateTo,
        branchId: reportForm.branchId
      });
      
      setGeneratedReport(report);
      setShowReportModal(false);
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setGenerating(false);
    }
  };

  const resetItemForm = () => {
    setItemForm({
      status: 'pending',
      findings: '',
      recommendations: '',
      score: 0,
      evidence: []
    });
  };

  const resetCreateItemForm = () => {
    setCreateItemForm({
      category: 'process_compliance',
      subcategory: '',
      title: '',
      description: '',
      riskLevel: 'medium',
      targetEntity: '',
      targetEntityId: '',
      branchId: '',
      dueDate: ''
    });
  };

  const openItemModal = (item: AuditItem) => {
    setSelectedItem(item);
    setItemForm({
      status: item.status,
      findings: item.findings || '',
      recommendations: item.recommendations || '',
      score: item.score || 0,
      evidence: item.evidence || []
    });
    setShowItemModal(true);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-gray-100 text-gray-800 border-gray-200',
      in_review: 'bg-blue-100 text-blue-800 border-blue-200',
      compliant: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      non_compliant: 'bg-red-100 text-red-800 border-red-200',
      requires_action: 'bg-amber-100 text-amber-800 border-amber-200'
    };
    
    const icons = {
      pending: Clock,
      in_review: Eye,
      compliant: CheckCircle,
      non_compliant: XCircle,
      requires_action: AlertTriangle
    };
    
    const Icon = icons[status as keyof typeof icons];
    
    return (
      <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full border ${styles[status as keyof typeof styles]}`}>
        <Icon className="h-3 w-3" />
        <span>{status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
      </span>
    );
  };

  const getRiskBadge = (riskLevel: string) => {
    const styles = {
      low: 'bg-green-100 text-green-800 border-green-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      critical: 'bg-red-100 text-red-800 border-red-200'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[riskLevel as keyof typeof styles]}`}>
        {riskLevel.toUpperCase()}
      </span>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 95) return 'text-emerald-600';
    if (score >= 85) return 'text-blue-600';
    if (score >= 75) return 'text-amber-600';
    return 'text-red-600';
  };

  const getActionTypeIcon = (actionType: string) => {
    if (actionType.includes('GENERATED')) return <BarChart3 className="h-4 w-4 text-blue-600" />;
    if (actionType.includes('APPROVED')) return <CheckCircle className="h-4 w-4 text-emerald-600" />;
    if (actionType.includes('REJECTED')) return <AlertTriangle className="h-4 w-4 text-red-600" />;
    if (actionType.includes('BLOCKED')) return <Shield className="h-4 w-4 text-red-600" />;
    if (actionType.includes('CREATED')) return <FileText className="h-4 w-4 text-indigo-600" />;
    if (actionType.includes('KYC')) return <UserIcon className="h-4 w-4 text-purple-600" />;
    return <Activity className="h-4 w-4 text-gray-600" />;
  };

  const getUserName = (userId: string) => {
    const userMap: Record<string, string> = {
      '1': 'System Administrator',
      '2': 'John Manager',
      '3': 'Sarah Approver',
      '4': 'Mike Sales',
      '5': 'Lisa Manager',
      '6': 'David Sales',
      '7': 'Emma Approver',
      '8': 'Robert Sales',
      '9': 'Alex Auditor'
    };
    return userMap[userId] || 'Unknown User';
  };

  if (!isAuditor) {
    return (
      <div className="text-center py-12">
        <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">You don't have permission to access audit management.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Management</h1>
          <p className="text-gray-600">Comprehensive audit workflow and compliance monitoring</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadAllData}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowCreateItemModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800"
          >
            <Plus className="h-4 w-4" />
            <span>New Audit Item</span>
          </button>
          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            <FileText className="h-4 w-4" />
            <span>Generate Report</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'dashboard', name: 'Audit Dashboard', icon: BarChart3 },
              { id: 'items', name: 'Audit Items', icon: Clipboard },
              { id: 'checklists', name: 'Checklists', icon: CheckCircle },
              { id: 'logs', name: 'Audit Trail', icon: Activity },
              { id: 'reports', name: 'Reports', icon: FileText }
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

        {/* Tab Content */}
        <div className="p-6">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Audit Scorecard */}
              {scorecard && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Audit Scorecard</h2>
                      <p className="text-gray-600">Overall compliance and risk assessment</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-4xl font-bold ${getScoreColor(scorecard.overallScore)}`}>
                        {scorecard.overallScore}%
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm text-emerald-600 font-medium">
                          +{scorecard.trends.change}% from last period
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center space-x-3">
                        <Target className="h-8 w-8 text-blue-600 bg-blue-100 rounded-lg p-2" />
                        <div>
                          <p className="text-lg font-bold text-gray-900">{scorecard.overallScore}%</p>
                          <p className="text-sm text-gray-600">Overall Score</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className={`h-8 w-8 ${
                          scorecard.riskAssessment.level === 'low' ? 'text-emerald-600 bg-emerald-100' :
                          scorecard.riskAssessment.level === 'medium' ? 'text-amber-600 bg-amber-100' :
                          'text-red-600 bg-red-100'
                        } rounded-lg p-2`} />
                        <div>
                          <p className="text-lg font-bold text-gray-900 capitalize">{scorecard.riskAssessment.level}</p>
                          <p className="text-sm text-gray-600">Risk Level</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center space-x-3">
                        <Flag className="h-8 w-8 text-red-600 bg-red-100 rounded-lg p-2" />
                        <div>
                          <p className="text-lg font-bold text-gray-900">{scorecard.riskAssessment.issues}</p>
                          <p className="text-sm text-gray-600">Open Issues</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Category Performance */}
              {scorecard && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Performance</h3>
                  <div className="space-y-4">
                    {scorecard.categoryScores.map((category) => (
                      <div key={category.category} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">{category.category}</span>
                          <div className="flex items-center space-x-4">
                            <span className="text-xs text-gray-500">
                              {category.compliantCount}/{category.itemCount} compliant
                            </span>
                            <span className={`text-sm font-bold ${getScoreColor(category.score)}`}>
                              {category.score}%
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              category.score >= 95 ? 'bg-emerald-500' :
                              category.score >= 85 ? 'bg-blue-500' :
                              category.score >= 75 ? 'bg-amber-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${category.score}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <Clipboard className="h-8 w-8 text-blue-600 bg-blue-100 rounded-lg p-2" />
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{auditItems.length}</p>
                      <p className="text-sm text-gray-600">Total Audit Items</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-8 w-8 text-amber-600 bg-amber-100 rounded-lg p-2" />
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {auditItems.filter(item => item.status === 'pending' || item.status === 'in_review').length}
                      </p>
                      <p className="text-sm text-gray-600">Pending Review</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-8 w-8 text-red-600 bg-red-100 rounded-lg p-2" />
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {auditItems.filter(item => item.status === 'requires_action' || item.status === 'non_compliant').length}
                      </p>
                      <p className="text-sm text-gray-600">Requires Action</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <Activity className="h-8 w-8 text-indigo-600 bg-indigo-100 rounded-lg p-2" />
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{auditLogs.length}</p>
                      <p className="text-sm text-gray-600">System Activities</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Audit Items Tab */}
          {activeTab === 'items' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <select
                    value={itemFilters.category}
                    onChange={(e) => setItemFilters({ ...itemFilters, category: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Categories</option>
                    <option value="qr_management">QR Management</option>
                    <option value="user_access">User Access</option>
                    <option value="data_protection">Data Protection</option>
                    <option value="process_compliance">Process Compliance</option>
                    <option value="security_controls">Security Controls</option>
                    <option value="kyc_verification">KYC Verification</option>
                  </select>
                  
                  <select
                    value={itemFilters.status}
                    onChange={(e) => setItemFilters({ ...itemFilters, status: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="in_review">In Review</option>
                    <option value="compliant">Compliant</option>
                    <option value="non_compliant">Non-Compliant</option>
                    <option value="requires_action">Requires Action</option>
                  </select>
                  
                  <select
                    value={itemFilters.riskLevel}
                    onChange={(e) => setItemFilters({ ...itemFilters, riskLevel: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Risk Levels</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                  
                  <select
                    value={itemFilters.branchId}
                    onChange={(e) => setItemFilters({ ...itemFilters, branchId: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Branches</option>
                    <option value="1">Downtown Branch</option>
                    <option value="2">Uptown Branch</option>
                    <option value="3">Westside Branch</option>
                  </select>
                  
                  <input
                    type="date"
                    value={itemFilters.dueDate}
                    onChange={(e) => setItemFilters({ ...itemFilters, dueDate: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Due date filter"
                  />
                </div>
              </div>

              {/* Audit Items List */}
              <div className="space-y-4">
                {auditItems.map((item) => (
                  <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="text-lg font-medium text-gray-900">{item.title}</h3>
                          {getStatusBadge(item.status)}
                          {getRiskBadge(item.riskLevel)}
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-4">{item.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                          <div className="text-sm">
                            <span className="font-medium text-gray-700">Category:</span>
                            <p className="text-gray-600 capitalize">{item.category.replace('_', ' ')}</p>
                          </div>
                          <div className="text-sm">
                            <span className="font-medium text-gray-700">Due Date:</span>
                            <p className="text-gray-600">{new Date(item.dueDate).toLocaleDateString()}</p>
                          </div>
                          <div className="text-sm">
                            <span className="font-medium text-gray-700">Last Review:</span>
                            <p className="text-gray-600">
                              {item.lastReviewDate ? new Date(item.lastReviewDate).toLocaleDateString() : 'Not reviewed'}
                            </p>
                          </div>
                          <div className="text-sm">
                            <span className="font-medium text-gray-700">Score:</span>
                            <p className={`font-bold ${getScoreColor(item.score || 0)}`}>
                              {item.score || 'Not scored'}
                            </p>
                          </div>
                        </div>
                        
                        {item.findings && (
                          <div className="bg-blue-50 rounded-lg p-3 mb-3">
                            <p className="text-sm font-medium text-blue-900 mb-1">Findings:</p>
                            <p className="text-sm text-blue-800">{item.findings}</p>
                          </div>
                        )}
                        
                        {item.recommendations && (
                          <div className="bg-amber-50 rounded-lg p-3">
                            <p className="text-sm font-medium text-amber-900 mb-1">Recommendations:</p>
                            <p className="text-sm text-amber-800">{item.recommendations}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-6">
                        <button
                          onClick={() => openItemModal(item)}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800"
                        >
                          <Edit className="h-4 w-4" />
                          <span>Review</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Checklists Tab */}
          {activeTab === 'checklists' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {auditChecklists.map((checklist) => (
                  <div key={checklist.id} className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Clipboard className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{checklist.name}</h3>
                        <p className="text-sm text-gray-500">{checklist.category}</p>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4">{checklist.description}</p>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Overall Score</span>
                        <span className={`text-lg font-bold ${getScoreColor(checklist.overallScore)}`}>
                          {checklist.overallScore}%
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Completion</span>
                        <span className="text-sm font-medium text-gray-900">
                          {checklist.completionRate}%
                        </span>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${checklist.completionRate}%` }}
                        />
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        {checklist.items.length} items • Updated {new Date(checklist.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audit Trail Tab */}
          {activeTab === 'logs' && (
            <div className="space-y-6">
              {/* Log Filters */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <input
                    type="date"
                    value={logFilters.dateFrom}
                    onChange={(e) => setLogFilters({ ...logFilters, dateFrom: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Date From"
                  />
                  <input
                    type="date"
                    value={logFilters.dateTo}
                    onChange={(e) => setLogFilters({ ...logFilters, dateTo: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Date To"
                  />
                  <select
                    value={logFilters.actionType}
                    onChange={(e) => setLogFilters({ ...logFilters, actionType: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Actions</option>
                    <option value="QR_GENERATED">QR Generated</option>
                    <option value="QR_ISSUED">QR Issued</option>
                    <option value="REQUEST_APPROVED">Request Approved</option>
                    <option value="KYC_REQUEST_APPROVED">KYC Approved</option>
                    <option value="AUDIT_ITEM_UPDATED">Audit Updated</option>
                  </select>
                  <select
                    value={logFilters.userId}
                    onChange={(e) => setLogFilters({ ...logFilters, userId: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Users</option>
                    <option value="1">System Administrator</option>
                    <option value="4">Mike Sales</option>
                    <option value="3">Sarah Approver</option>
                    <option value="9">Alex Auditor</option>
                  </select>
                  <select
                    value={logFilters.branchId}
                    onChange={(e) => setLogFilters({ ...logFilters, branchId: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Branches</option>
                    <option value="1">Downtown Branch</option>
                    <option value="2">Uptown Branch</option>
                    <option value="3">Westside Branch</option>
                  </select>
                </div>
              </div>

              {/* Audit Logs */}
              <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-6 hover:bg-gray-50 cursor-pointer" onClick={() => {
                    setSelectedLog(log);
                    setShowLogDetailModal(true);
                  }}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="mt-1">
                          {getActionTypeIcon(log.actionType)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-sm font-medium text-gray-900">
                              {log.actionType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                            </h3>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <UserIcon className="h-4 w-4" />
                              <span>{getUserName(log.actorUserId)}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Building className="h-4 w-4" />
                              <span>{log.targetEntity.replace('_', ' ')}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(log.timestamp).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <button className="ml-4 p-1 rounded-lg hover:bg-gray-100">
                        <Eye className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              {generatedReport && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                          {generatedReport.type.charAt(0).toUpperCase() + generatedReport.type.slice(1)} Audit Report
                        </h2>
                        <p className="text-sm text-gray-600">
                          Generated on {new Date(generatedReport.generatedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="relative">
                          <select 
                            onChange={(e) => e.target.value && console.log(`Exporting as ${e.target.value}`)}
                            className="appearance-none bg-emerald-600 text-white px-4 py-2 rounded-lg pr-10 hover:bg-emerald-700"
                          >
                            <option value="">Export Report</option>
                            <option value="pdf">Export as PDF</option>
                            <option value="excel">Export as Excel</option>
                            <option value="csv">Export as CSV</option>
                          </select>
                          <Download className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white pointer-events-none" />
                        </div>
                        <button
                          onClick={() => setGeneratedReport(null)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    {/* Report Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      {Object.entries(generatedReport.summary).map(([key, value]) => (
                        <div key={key} className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </p>
                          <p className="text-lg font-bold text-gray-900">{value as string}</p>
                        </div>
                      ))}
                    </div>
                    
                    {/* Report Details */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Analysis</h3>
                      <div className="space-y-3">
                        {generatedReport.details.map((detail: any, index: number) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              {Object.entries(detail).map(([key, value]) => (
                                <div key={key}>
                                  <p className="text-xs text-gray-500 uppercase tracking-wider">
                                    {key.replace(/([A-Z])/g, ' $1')}
                                  </p>
                                  <p className="text-sm font-medium text-gray-900">{value as string}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Recommendations */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
                      <div className="space-y-2">
                        {generatedReport.recommendations.map((recommendation: string, index: number) => (
                          <div key={index} className="flex items-start space-x-2">
                            <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5" />
                            <p className="text-sm text-gray-700">{recommendation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Generate Audit Report</h3>
                <p className="text-gray-600 mb-4">Create comprehensive audit reports for compliance and analysis</p>
                <button
                  onClick={() => setShowReportModal(true)}
                  className="px-6 py-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800"
                >
                  Generate New Report
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Audit Item Review Modal */}
      {showItemModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Audit Item Review</h2>
              <button
                onClick={() => setShowItemModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ×
              </button>
            </div>
            
            {/* Item Details */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-3 mb-3">
                <h3 className="text-lg font-medium text-gray-900">{selectedItem.title}</h3>
                {getStatusBadge(selectedItem.status)}
                {getRiskBadge(selectedItem.riskLevel)}
              </div>
              <p className="text-sm text-gray-600 mb-3">{selectedItem.description}</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Category:</span>
                  <span className="ml-2 text-gray-600 capitalize">{selectedItem.category.replace('_', ' ')}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Due Date:</span>
                  <span className="ml-2 text-gray-600">{new Date(selectedItem.dueDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleUpdateAuditItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Audit Status</label>
                <select
                  value={itemForm.status}
                  onChange={(e) => setItemForm({ ...itemForm, status: e.target.value as AuditItem['status'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="pending">Pending Review</option>
                  <option value="in_review">In Review</option>
                  <option value="compliant">Compliant</option>
                  <option value="non_compliant">Non-Compliant</option>
                  <option value="requires_action">Requires Action</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Compliance Score (0-100)</label>
                <input
                  type="number"
                  value={itemForm.score}
                  onChange={(e) => setItemForm({ ...itemForm, score: Number(e.target.value) })}
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Audit Findings</label>
                <textarea
                  value={itemForm.findings}
                  onChange={(e) => setItemForm({ ...itemForm, findings: e.target.value })}
                  rows={4}
                  placeholder="Document your audit findings and observations..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Recommendations</label>
                <textarea
                  value={itemForm.recommendations}
                  onChange={(e) => setItemForm({ ...itemForm, recommendations: e.target.value })}
                  rows={3}
                  placeholder="Provide recommendations for improvement or compliance..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Evidence/Documentation</label>
                <textarea
                  value={itemForm.evidence.join('\n')}
                  onChange={(e) => setItemForm({ ...itemForm, evidence: e.target.value.split('\n').filter(line => line.trim()) })}
                  rows={3}
                  placeholder="List evidence and documentation (one per line)..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowItemModal(false);
                    setSelectedItem(null);
                    resetItemForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>{updating ? 'Saving...' : 'Save Audit Review'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Audit Item Modal */}
      {showCreateItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Audit Item</h2>
            <form onSubmit={handleCreateAuditItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={createItemForm.category}
                  onChange={(e) => setCreateItemForm({ ...createItemForm, category: e.target.value as AuditItem['category'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="qr_management">QR Management</option>
                  <option value="user_access">User Access</option>
                  <option value="data_protection">Data Protection</option>
                  <option value="process_compliance">Process Compliance</option>
                  <option value="security_controls">Security Controls</option>
                  <option value="kyc_verification">KYC Verification</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory</label>
                <input
                  type="text"
                  value={createItemForm.subcategory}
                  onChange={(e) => setCreateItemForm({ ...createItemForm, subcategory: e.target.value })}
                  placeholder="e.g., approval_workflow"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={createItemForm.title}
                  onChange={(e) => setCreateItemForm({ ...createItemForm, title: e.target.value })}
                  placeholder="Brief title for the audit item"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={createItemForm.description}
                  onChange={(e) => setCreateItemForm({ ...createItemForm, description: e.target.value })}
                  rows={3}
                  placeholder="Detailed description of what needs to be audited..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Risk Level</label>
                  <select
                    value={createItemForm.riskLevel}
                    onChange={(e) => setCreateItemForm({ ...createItemForm, riskLevel: e.target.value as AuditItem['riskLevel'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                  <input
                    type="date"
                    value={createItemForm.dueDate}
                    onChange={(e) => setCreateItemForm({ ...createItemForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Target Entity</label>
                  <input
                    type="text"
                    value={createItemForm.targetEntity}
                    onChange={(e) => setCreateItemForm({ ...createItemForm, targetEntity: e.target.value })}
                    placeholder="e.g., qr_code, user, branch"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Target Entity ID</label>
                  <input
                    type="text"
                    value={createItemForm.targetEntityId}
                    onChange={(e) => setCreateItemForm({ ...createItemForm, targetEntityId: e.target.value })}
                    placeholder="e.g., all, specific_id"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Branch (Optional)</label>
                <select
                  value={createItemForm.branchId}
                  onChange={(e) => setCreateItemForm({ ...createItemForm, branchId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Branches</option>
                  <option value="1">Downtown Branch</option>
                  <option value="2">Uptown Branch</option>
                  <option value="3">Westside Branch</option>
                </select>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateItemModal(false);
                    resetCreateItemForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Audit Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Generate Audit Report</h2>
            <form onSubmit={handleGenerateReport} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
                <select
                  value={reportForm.type}
                  onChange={(e) => setReportForm({ ...reportForm, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="compliance">Compliance Audit</option>
                  <option value="security">Security Audit</option>
                  <option value="performance">Performance Audit</option>
                  <option value="user_activity">User Activity Audit</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
                  <input
                    type="date"
                    value={reportForm.dateFrom}
                    onChange={(e) => setReportForm({ ...reportForm, dateFrom: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date To</label>
                  <input
                    type="date"
                    value={reportForm.dateTo}
                    onChange={(e) => setReportForm({ ...reportForm, dateTo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Branch (Optional)</label>
                <select
                  value={reportForm.branchId}
                  onChange={(e) => setReportForm({ ...reportForm, branchId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Branches</option>
                  <option value="1">Downtown Branch</option>
                  <option value="2">Uptown Branch</option>
                  <option value="3">Westside Branch</option>
                </select>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="flex-1 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:opacity-50"
                >
                  {generating ? 'Generating...' : 'Generate Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Detail Modal */}
      {showLogDetailModal && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Audit Log Details</h2>
              <button
                onClick={() => setShowLogDetailModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Action Type</p>
                  <p className="text-sm text-gray-900">{selectedLog.actionType}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Target Entity</p>
                  <p className="text-sm text-gray-900">{selectedLog.targetEntity}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Performed By</p>
                  <p className="text-sm text-gray-900">{getUserName(selectedLog.actorUserId)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Timestamp</p>
                  <p className="text-sm text-gray-900">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                </div>
              </div>
              
              {selectedLog.payload && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Payload Details</p>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <pre className="text-sm text-gray-900 whitespace-pre-wrap">
                      {JSON.stringify(selectedLog.payload, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowLogDetailModal(false)}
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

export default AuditManagement;