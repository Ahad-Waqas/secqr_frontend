import { User, QRCode, AllocationRequest, DashboardStats, ReturnRecord, AuditLog } from '../types';
import { mockUsers, mockQRCodes, mockAllocationRequests, mockAuditLogs, mockBranches, mockKYCRequests, mockAuditItems, mockAuditChecklists } from './mockData';
import type { Branch, BranchInventory, ThresholdRequest, Merchant, MerchantRequest, KYCRequest } from '../types';
import type { AuditItem, AuditChecklist, AuditScorecard } from '../types';
import { mockMerchants } from './mockData';

class ApiService {
  private currentUser: User | null = null;
  private thresholdRequests: ThresholdRequest[] = [];
  private merchantRequests: MerchantRequest[] = [];
  private merchants: Merchant[] = [...mockMerchants];
  private kycRequests: KYCRequest[] = [...mockKYCRequests];
  private auditItems: AuditItem[] = [...mockAuditItems];
  private auditChecklists: AuditChecklist[] = [...mockAuditChecklists];

  async login(username: string, password: string): Promise<User> {
    // Mock authentication
    const user = mockUsers.find(u => u.username === username);
    if (!user) {
      throw new Error('Invalid credentials');
    }
    this.currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
    return user;
  }

  getCurrentUser(): User | null {
    if (!this.currentUser) {
      const stored = localStorage.getItem('currentUser');
      if (stored) {
        this.currentUser = JSON.parse(stored);
      }
    }
    return this.currentUser;
  }

  logout(): void {
    this.currentUser = null;
    localStorage.removeItem('currentUser');
  }

  private generateQRValue(metadata: any, index: number): string {
    const parts = [metadata.bankName, metadata.merchantName, metadata.merchantId];
    
    if (metadata.terminalId) {
      parts.push(metadata.terminalId);
    }
    
    return parts.join('\n');
  }

  async generateQRCodes(count: number, type: 'static' | 'dynamic', metadata?: {
    bankName?: string;
    merchantName?: string;
    merchantId?: string;
    terminalId?: string;
  }): Promise<QRCode[]> {
    // Validate mandatory fields
    if (!metadata?.bankName) {
      throw new Error('Bank Name is required');
    }
    
    // Mock QR generation
    const newQRs: QRCode[] = Array.from({ length: count }, (_, i) => ({
      id: `qr_gen_${Date.now()}_${i}`,
      qrValue: this.generateQRValue(metadata, i),
      qrType: type,
      generationSource: 'system',
      status: 'unallocated',
      bankName: metadata?.bankName,
      merchantName: metadata?.merchantName || undefined,
      merchantId: metadata?.merchantId || undefined,
      createdBy: 'system',
      createdAt: new Date().toISOString(),
      terminalId: metadata?.terminalId || undefined,
      updatedAt: new Date().toISOString()
    }));
    
    mockQRCodes.push(...newQRs);
    this.logAction('QR_GENERATED', 'qr_code', { count, type });
    return newQRs;
  }

  async uploadQRCodes(file: File): Promise<QRCode[]> {
    // Mock file upload processing
    const count = Math.floor(Math.random() * 50) + 10;
    const newQRs: QRCode[] = Array.from({ length: count }, (_, i) => ({
      id: `qr_upload_${Date.now()}_${i}`,
      qrValue: `UPL${Date.now()}${String(i).padStart(3, '0')}`,
      qrType: 'static',
      generationSource: 'upload',
      status: 'unallocated',
      uploadFileId: `file_${Date.now()}`,
      createdBy: this.currentUser?.id || '1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    
    mockQRCodes.push(...newQRs);
    this.logAction('QR_UPLOADED', 'qr_code', { filename: file.name, count });
    return newQRs;
  }

  async getQRCodes(filters?: { status?: string; branchId?: string }): Promise<QRCode[]> {
    const currentUser = this.getCurrentUser();
    let qrs = [...mockQRCodes];
    
    if (filters?.status) {
      qrs = qrs.filter(qr => qr.status === filters.status);
    }
    
    if (filters?.branchId) {
      qrs = qrs.filter(qr => qr.allocatedBranchId === filters.branchId);
    }
    
    // For sales users, show only their QRs
    if (currentUser?.role === 'SALES_USER') {
      qrs = qrs.filter(qr => qr.allocatedToUserId === currentUser.id);
    }
    
    return qrs;
  }

  async allocateQRsToBranch(qrIds: string[], branchId: string): Promise<void> {
    qrIds.forEach(qrId => {
      const qr = mockQRCodes.find(q => q.id === qrId);
      if (qr) {
        qr.status = 'allocated';
        qr.allocatedBranchId = branchId;
        qr.updatedAt = new Date().toISOString();
      }
    });
    
    this.logAction('QR_ALLOCATED', 'qr_code', { qrIds, branchId });
  }

  async createAllocationRequest(data: Partial<AllocationRequest>): Promise<AllocationRequest> {
    const request: AllocationRequest = {
      id: `req_${Date.now()}`,
      requestNumber: `REQ${String(mockAllocationRequests.length + 1).padStart(3, '0')}`,
      branchId: data.branchId!,
      initiatorUserId: this.currentUser?.id || '1',
      requestedQrCount: data.requestedQrCount!,
      requestedFor: data.requestedFor!,
      status: 'pending',
      notes: data.notes || '',
      createdAt: new Date().toISOString()
    };
    
    mockAllocationRequests.push(request);
    this.logAction('REQUEST_CREATED', 'allocation_request', request);
    return request;
  }

  async approveRequest(requestId: string, notes?: string): Promise<void> {
    const request = mockAllocationRequests.find(r => r.id === requestId);
    if (request) {
      request.status = 'approved';
      request.approverUserId = this.currentUser?.id;
      request.approvedAt = new Date().toISOString();
      if (notes) request.notes += `\nApproval notes: ${notes}`;
    }
    
    this.logAction('REQUEST_APPROVED', 'allocation_request', { requestId, notes });
  }

  async rejectRequest(requestId: string, reason: string): Promise<void> {
    const request = mockAllocationRequests.find(r => r.id === requestId);
    if (request) {
      request.status = 'rejected';
      request.approverUserId = this.currentUser?.id;
      request.notes += `\nRejection reason: ${reason}`;
    }
    
    this.logAction('REQUEST_REJECTED', 'allocation_request', { requestId, reason });
  }

  async returnRequestForCorrection(requestId: string, reason: string): Promise<void> {
    const request = mockAllocationRequests.find(r => r.id === requestId);
    if (request) {
      request.status = 'pending';
      request.approverUserId = this.currentUser?.id;
      request.notes += `\nReturned for correction: ${reason}`;
    }
    
    this.logAction('REQUEST_RETURNED_FOR_CORRECTION', 'allocation_request', { requestId, reason });
  }
  async updateAllocationRequest(requestId: string, updates: Partial<AllocationRequest>): Promise<void> {
    const request = mockAllocationRequests.find(r => r.id === requestId);
    if (request) {
      Object.assign(request, updates);
      request.status = 'pending'; // Reset to pending when edited
    }
    
    this.logAction('REQUEST_UPDATED', 'allocation_request', { requestId, updates });
  }
  async getAllocationRequests(branchId?: string): Promise<AllocationRequest[]> {
    const currentUser = this.getCurrentUser();
    let requests = [...mockAllocationRequests];
    
    if (branchId) {
      requests = requests.filter(r => r.branchId === branchId);
    }
    
    // For sales users, show only their requests
    if (currentUser?.role === 'SALES_USER') {
      requests = requests.filter(r => r.initiatorUserId === currentUser.id);
    }
    
    return requests;
  }

  async issueQRToMerchant(qrId: string, merchantData: any): Promise<void> {
    const qr = mockQRCodes.find(q => q.id === qrId);
    if (qr) {
      qr.status = 'issued';
      qr.issuedToMerchantId = merchantData.id;
      qr.updatedAt = new Date().toISOString();
    }
    
    this.logAction('QR_ISSUED', 'qr_code', { qrId, merchantData });
  }

  async returnQR(qrId: string, reason: string, condition: string): Promise<ReturnRecord> {
    const qr = mockQRCodes.find(q => q.id === qrId);
    if (qr) {
      qr.status = 'returned';
      qr.updatedAt = new Date().toISOString();
    }
    
    const returnRecord: ReturnRecord = {
      id: `ret_${Date.now()}`,
      qrId,
      returnedByUserId: this.currentUser?.id || '1',
      returnedAt: new Date().toISOString(),
      reason,
      condition,
      status: 'pending'
    };
    
    this.logAction('QR_RETURNED', 'qr_code', { qrId, reason, condition });
    return returnRecord;
  }

  async getDashboardStats(branchId?: string): Promise<DashboardStats> {
    const qrs = mockQRCodes;
    const requests = mockAllocationRequests;
    const users = mockUsers;
    const branches = mockBranches;
    
    // Filter data by branch if branchId is provided (for branch approvers)
    const filteredQRs = branchId ? qrs.filter(q => q.allocatedBranchId === branchId) : qrs;
    const filteredRequests = branchId ? requests.filter(r => r.branchId === branchId) : requests;
    const filteredUsers = branchId ? users.filter(u => u.branchId === branchId) : users;
    const filteredActivity = branchId ? mockAuditLogs.filter(log => {
      // Filter activity by branch-related actions
      return log.payload?.branchId === branchId || 
             (log.targetEntity === 'allocation_request' && filteredRequests.some(r => r.id === log.payload?.requestId));
    }) : mockAuditLogs;
    
    // Sync QR codes with users and branches
    this.syncQRCodesWithUsersAndBranches();
    
    // Calculate accurate counts based on role and user context
    const currentUser = this.getCurrentUser();
    let totalQRs, unallocated, allocated, issued, returned, blocked;
    
    if (branchId) {
      // For branch-specific roles (branch managers, approvers, sales users)
      totalQRs = filteredQRs.length;
      unallocated = 0; // Branch users don't see unallocated QRs
      allocated = filteredQRs.filter(q => q.status === 'allocated').length;
      issued = filteredQRs.filter(q => q.status === 'issued').length;
      returned = filteredQRs.filter(q => q.status === 'returned').length;
      blocked = filteredQRs.filter(q => q.status === 'blocked').length;
      
      // For sales users, further filter to show only their issued QRs
      if (currentUser?.role === 'SALES_USER') {
        const userIssuedQRs = filteredQRs.filter(q => q.allocatedToUserId === currentUser.id);
        totalQRs = userIssuedQRs.length;
        allocated = userIssuedQRs.filter(q => q.status === 'allocated').length;
        issued = userIssuedQRs.filter(q => q.status === 'issued').length;
        returned = userIssuedQRs.filter(q => q.status === 'returned').length;
        blocked = userIssuedQRs.filter(q => q.status === 'blocked').length;
      }
    } else {
      // For system admin, show system-wide data
      totalQRs = qrs.length;
      unallocated = qrs.filter(q => q.status === 'unallocated').length;
      allocated = qrs.filter(q => q.status === 'allocated').length;
      issued = qrs.filter(q => q.status === 'issued').length;
      returned = qrs.filter(q => q.status === 'returned').length;
      blocked = qrs.filter(q => q.status === 'blocked').length;
    }
    
    // Branch approver specific stats
    const pendingApprovals = filteredRequests.filter(r => r.status === 'pending').length;
    const approvedRequests = filteredRequests.filter(r => r.status === 'approved').length;
    const rejectedRequests = filteredRequests.filter(r => r.status === 'rejected').length;
    const returnedForCorrection = filteredRequests.filter(r => r.status === 'pending' && r.notes?.includes('Returned for correction')).length;
    
    // Calculate pending KYC requests
    const pendingKYC = branchId ? 
      this.kycRequests.filter(kyc => kyc.branchId === branchId && kyc.status === 'pending').length :
      this.kycRequests.filter(kyc => kyc.status === 'pending').length;
    
    // Top sellers filtered by branch
    const topSellers = branchId ? 
      this.getTopSellersByBranch(branchId, currentUser?.role === 'SALES_USER' ? currentUser.id : undefined) : 
      this.getTopSellersGlobal();
    
    // Top branches and regions - consistent with actual data
    const topBranches = branchId ? 
      [{ name: branches.find(b => b.id === branchId)?.name || 'Current Branch', count: issued }] :
      [
        { name: 'Downtown Branch', count: qrs.filter(q => q.allocatedBranchId === '1' && q.status === 'issued').length },
        { name: 'Uptown Branch', count: qrs.filter(q => q.allocatedBranchId === '2' && q.status === 'issued').length },
        { name: 'Westside Branch', count: qrs.filter(q => q.allocatedBranchId === '3' && q.status === 'issued').length }
      ];
    
    const topRegions = !branchId ? [
      { name: 'Central Region', count: qrs.filter(q => q.allocatedBranchId === '1' && q.status === 'issued').length, branchCount: 1 },
      { name: 'North Region', count: qrs.filter(q => q.allocatedBranchId === '2' && q.status === 'issued').length, branchCount: 1 },
      { name: 'West Region', count: qrs.filter(q => q.allocatedBranchId === '3' && q.status === 'issued').length, branchCount: 1 }
    ] : undefined;
    
    return {
      totalQRs,
      unallocated,
      allocated,
      issued,
      returned,
      blocked,
      pendingApprovals,
      approvedRequests,
      rejectedRequests,
      returnedForCorrection,
      topBranches,
      topSellers,
      topRegions,
      recentActivity: filteredActivity.slice(-10),
      pendingKYC
    };
  }
  
  // Sync QR codes with users and branches to ensure data consistency
  private syncQRCodesWithUsersAndBranches(): void {
    // Update QR codes to reflect current branch and user assignments
    mockQRCodes.forEach(qr => {
      // Ensure allocated QRs have valid branch assignments
      if (qr.status === 'allocated' && qr.allocatedBranchId) {
        const branch = mockBranches.find(b => b.id === qr.allocatedBranchId);
        if (!branch) {
          // Branch no longer exists, reset QR to unallocated
          qr.status = 'unallocated';
          qr.allocatedBranchId = undefined;
          qr.allocatedToUserId = undefined;
        }
      }
      
      // Ensure issued QRs have valid user assignments
      if (qr.status === 'issued' && qr.allocatedToUserId) {
        const user = mockUsers.find(u => u.id === qr.allocatedToUserId);
        if (!user || user.status === 'inactive') {
          // User no longer exists or is inactive, return QR to allocated status
          qr.status = 'allocated';
          qr.allocatedToUserId = undefined;
          qr.issuedToMerchantId = undefined;
        }
      }
    });
    
    // Log sync action
    this.logAction('DATA_SYNC', 'system', { 
      timestamp: new Date().toISOString(),
      qrCount: mockQRCodes.length,
      userCount: mockUsers.length,
      branchCount: mockBranches.length
    });
  }

  private getTopSellersByBranch(branchId: string, currentUserId?: string): { name: string; count: number; branch?: string; userId?: string }[] {
    const branchName = mockBranches.find(b => b.id === branchId)?.name || 'Unknown Branch';
    let branchUsers = mockUsers.filter(u => u.branchId === branchId && u.role === 'SALES_USER');
    
    // If currentUserId is provided (for sales users), show only their data
    if (currentUserId) {
      branchUsers = branchUsers.filter(u => u.id === currentUserId);
    }
    
    return branchUsers.map(user => {
      const issuedCount = mockQRCodes.filter(qr => 
        qr.allocatedBranchId === branchId && 
        qr.status === 'issued' && 
        qr.allocatedToUserId === user.id
      ).length;
      
      return {
        name: user.name,
        count: issuedCount,
        branch: branchName,
        userId: user.id
      };
    }).sort((a, b) => b.count - a.count);
  }

  private getTopSellersGlobal(): { name: string; count: number; branch?: string; userId?: string }[] {
    const salesUsers = mockUsers.filter(u => u.role === 'SALES_USER');
    
    return salesUsers.map(user => {
      const branchName = mockBranches.find(b => b.id === user.branchId)?.name || 'Unknown Branch';
      const issuedCount = mockQRCodes.filter(qr => 
        qr.status === 'issued' && 
        qr.allocatedToUserId === user.id
      ).length;
      
      return {
        name: user.name,
        count: issuedCount,
        branch: branchName,
        userId: user.id
      };
    }).sort((a, b) => b.count - a.count);
  }

  async exportData(type: 'qr_codes' | 'allocations' | 'issuances'): Promise<Blob> {
    // Mock CSV export
    let csvData = '';
    
    switch (type) {
      case 'qr_codes':
        csvData = 'ID,QR Value,Type,Status,Branch,Created At\n';
        mockQRCodes.forEach(qr => {
          csvData += `${qr.id},${qr.qrValue},${qr.qrType},${qr.status},${qr.allocatedBranchId || 'N/A'},${qr.createdAt}\n`;
        });
        break;
      case 'allocations':
        csvData = 'Request ID,Branch,Count,Status,Created At\n';
        mockAllocationRequests.forEach(req => {
          csvData += `${req.requestNumber},${req.branchId},${req.requestedQrCount},${req.status},${req.createdAt}\n`;
        });
        break;
    }
    
    return new Blob([csvData], { type: 'text/csv' });
  }

  // User Management
  async createUser(userData: Partial<User>): Promise<User> {
    const newUser: User = {
      id: `user_${Date.now()}`,
      username: userData.username!,
      email: userData.email!,
      name: userData.name!,
      role: userData.role!,
      branchId: userData.branchId,
      phone: userData.phone!,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    
    mockUsers.push(newUser);
    this.logAction('USER_CREATED', 'user', newUser);
    return newUser;
  }

  async getUsers(): Promise<User[]> {
    return [...mockUsers];
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    if (userIndex === -1) throw new Error('User not found');
    
    mockUsers[userIndex] = { ...mockUsers[userIndex], ...updates };
    this.logAction('USER_UPDATED', 'user', { userId, updates });
    return mockUsers[userIndex];
  }

  // Branch Management
  async createBranch(branchData: Partial<Branch>): Promise<Branch> {
    const newBranch: Branch = {
      id: `branch_${Date.now()}`,
      branchCode: branchData.branchCode!,
      name: branchData.name!,
      region: branchData.region!,
      type: branchData.type!,
      state: branchData.state,
      country: branchData.country,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    mockBranches.push(newBranch);
    this.logAction('BRANCH_CREATED', 'branch', newBranch);
    return newBranch;
  }

  async getBranches(): Promise<Branch[]> {
    return [...mockBranches];
  }

  async updateBranch(branchId: string, updates: Partial<Branch>): Promise<Branch> {
    const branchIndex = mockBranches.findIndex(b => b.id === branchId);
    if (branchIndex === -1) throw new Error('Branch not found');
    
    mockBranches[branchIndex] = { 
      ...mockBranches[branchIndex], 
      ...updates, 
      updatedAt: new Date().toISOString() 
    };
    this.logAction('BRANCH_UPDATED', 'branch', { branchId, updates });
    return mockBranches[branchIndex];
  }

  async deleteBranch(branchId: string): Promise<void> {
    const branchIndex = mockBranches.findIndex(b => b.id === branchId);
    if (branchIndex === -1) throw new Error('Branch not found');
    
    // Check if branch has users
    const branchUsers = mockUsers.filter(u => u.branchId === branchId);
    if (branchUsers.length > 0) {
      throw new Error('Cannot delete branch with existing users. Please reassign users first.');
    }
    
    mockBranches.splice(branchIndex, 1);
    this.logAction('BRANCH_DELETED', 'branch', { branchId });
  }

  async getDistinctRegions(): Promise<string[]> {
    const regions = new Set(mockBranches.map(b => b.region));
    return Array.from(regions);
  }

  async searchBranches(searchTerm: string): Promise<Branch[]> {
    const term = searchTerm.toLowerCase();
    return mockBranches.filter(branch => 
      branch.name.toLowerCase().includes(term) ||
      branch.branchCode.toLowerCase().includes(term) ||
      branch.region.toLowerCase().includes(term)
    );
  }

  // Branch Inventory Management
  async getBranchInventory(branchId?: string): Promise<BranchInventory[]> {
    const currentUser = this.getCurrentUser();
    const branches = branchId ? mockBranches.filter(b => b.id === branchId) : mockBranches;
    
    return branches.map(branch => {
      const branchQRs = mockQRCodes.filter(qr => qr.allocatedBranchId === branch.id);
      
      let totalAllocated, issued, available, returned, blocked;
      
      // For sales users, show only their QRs
      if (currentUser?.role === 'SALES_USER' && currentUser.branchId === branch.id) {
        const userQRs = branchQRs.filter(qr => qr.allocatedToUserId === currentUser.id);
        totalAllocated = userQRs.length;
        issued = userQRs.filter(qr => qr.status === 'issued').length;
        available = userQRs.filter(qr => qr.status === 'allocated').length;
        returned = userQRs.filter(qr => qr.status === 'returned').length;
        blocked = userQRs.filter(qr => qr.status === 'blocked').length;
      } else {
        // For other roles, show branch-wide data
        totalAllocated = branchQRs.length;
        issued = branchQRs.filter(qr => qr.status === 'issued').length;
        available = branchQRs.filter(qr => qr.status === 'allocated').length;
        returned = branchQRs.filter(qr => qr.status === 'returned').length;
        blocked = branchQRs.filter(qr => qr.status === 'blocked').length;
      }
      
      const utilizationRate = totalAllocated > 0 ? Math.round((issued / totalAllocated) * 100) : 0;
      
      return {
        branchId: branch.id,
        branchName: branch.name,
        branchCode: branch.branchCode,
        totalAllocated,
        issued,
        available,
        returned,
        blocked,
        utilizationRate,
        lastActivity: new Date().toISOString()
      };
    });
  }

  // Bulk QR Allocation
  async bulkAllocateQRs(branchId: string, count: number): Promise<void> {
    const unallocatedQRs = mockQRCodes.filter(qr => qr.status === 'unallocated').slice(0, count);
    
    if (unallocatedQRs.length < count) {
      throw new Error(`Only ${unallocatedQRs.length} unallocated QR codes available`);
    }
    
    unallocatedQRs.forEach(qr => {
      qr.status = 'allocated';
      qr.allocatedBranchId = branchId;
      qr.updatedAt = new Date().toISOString();
    });
    
    this.logAction('BULK_QR_ALLOCATED', 'qr_code', { branchId, count, qrIds: unallocatedQRs.map(qr => qr.id) });
  }

  // Bulk QR Assignment between branches
  async bulkAssignQRs(sourceBranchId: string, targetBranchId: string, count: number): Promise<void> {
    const sourceQRs = mockQRCodes.filter(qr => 
      qr.allocatedBranchId === sourceBranchId && qr.status === 'allocated'
    ).slice(0, count);
    
    if (sourceQRs.length < count) {
      throw new Error(`Only ${sourceQRs.length} available QR codes in source branch`);
    }
    
    sourceQRs.forEach(qr => {
      qr.allocatedBranchId = targetBranchId;
      qr.updatedAt = new Date().toISOString();
    });
    
    this.logAction('BULK_QR_ASSIGNED', 'qr_code', { 
      sourceBranchId, 
      targetBranchId, 
      count, 
      qrIds: sourceQRs.map(qr => qr.id) 
    });
  }

  // Threshold Requests
  async createThresholdRequest(branchId: string, data: { currentInventory: number; threshold: number; requestedAmount: number; reason: string }): Promise<ThresholdRequest> {
    const request: ThresholdRequest = {
      id: `thresh_${Date.now()}`,
      branchId,
      currentInventory: data.currentInventory,
      threshold: data.threshold,
      requestedAmount: data.requestedAmount,
      reason: data.reason,
      status: 'pending',
      createdBy: this.currentUser?.id || '1',
      createdAt: new Date().toISOString()
    };
    
    this.thresholdRequests.push(request);
    this.logAction('THRESHOLD_REQUEST_CREATED', 'threshold_request', request);
    return request;
  }

  async getThresholdRequests(branchId?: string): Promise<ThresholdRequest[]> {
    let requests = [...this.thresholdRequests];
    if (branchId) {
      requests = requests.filter(r => r.branchId === branchId);
    }
    return requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async approveThresholdRequest(requestId: string, notes?: string): Promise<void> {
    const request = this.thresholdRequests.find(r => r.id === requestId);
    if (request) {
      request.status = 'approved';
      request.reviewedBy = this.currentUser?.id;
      request.reviewedAt = new Date().toISOString();
      
      // Auto-allocate the requested QRs
      await this.bulkAllocateQRs(request.branchId, request.requestedAmount);
    }
    
    this.logAction('THRESHOLD_REQUEST_APPROVED', 'threshold_request', { requestId, notes });
  }

  async rejectThresholdRequest(requestId: string, reason: string): Promise<void> {
    const request = this.thresholdRequests.find(r => r.id === requestId);
    if (request) {
      request.status = 'rejected';
      request.reviewedBy = this.currentUser?.id;
      request.reviewedAt = new Date().toISOString();
    }
    
    this.logAction('THRESHOLD_REQUEST_REJECTED', 'threshold_request', { requestId, reason });
  }

  // Merchant Management
  async createMerchant(merchantData: Partial<Merchant>): Promise<Merchant> {
    const newMerchant: Merchant = {
      id: `merchant_${Date.now()}`,
      legalName: merchantData.legalName!,
      shopName: merchantData.shopName!,
      address: merchantData.address!,
      phone: merchantData.phone!,
      email: merchantData.email!,
      kycStatus: 'pending', // Always starts as pending
      branchId: this.currentUser?.branchId,
      createdAt: new Date().toISOString()
    };
    
    this.merchants.push(newMerchant);
    this.logAction('MERCHANT_CREATED', 'merchant', newMerchant);
    return newMerchant;
  }

  async getMerchants(branchId?: string): Promise<Merchant[]> {
    // Filter merchants by branch if branchId is provided
    if (branchId) {
      return this.merchants.filter(m => m.branchId === branchId);
    }
    return [...this.merchants];
  }

  async deleteMerchant(merchantId: string): Promise<void> {
    const merchantIndex = this.merchants.findIndex(m => m.id === merchantId);
    if (merchantIndex === -1) throw new Error('Merchant not found');
    
    this.merchants.splice(merchantIndex, 1);
    this.logAction('MERCHANT_DELETED', 'merchant', { merchantId });
  }

  // Merchant QR Requests
  async createMerchantQRRequest(data: {
    merchantId: string;
    requestedQrCount: number;
    businessJustification: string;
  }): Promise<MerchantRequest> {
    const request: MerchantRequest = {
      id: `mer_req_${Date.now()}`,
      merchantId: data.merchantId,
      requestedBy: this.currentUser?.id || '1',
      branchId: this.currentUser?.branchId || '1',
      requestedQrCount: data.requestedQrCount,
      businessJustification: data.businessJustification,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    this.merchantRequests.push(request);
    this.logAction('MERCHANT_QR_REQUEST_CREATED', 'merchant_request', request);
    return request;
  }

  async getMerchantQRRequests(branchId?: string): Promise<MerchantRequest[]> {
    let requests = [...this.merchantRequests];
    if (branchId) {
      requests = requests.filter(r => r.branchId === branchId);
    }
    return requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async approveMerchantQRRequest(requestId: string, notes?: string): Promise<void> {
    const request = this.merchantRequests.find(r => r.id === requestId);
    if (request) {
      request.status = 'approved';
      request.approvedBy = this.currentUser?.id;
      request.approvedAt = new Date().toISOString();
      
      // Auto-allocate QRs to the requesting branch
      await this.bulkAllocateQRs(request.branchId, request.requestedQrCount);
    }
    
    this.logAction('MERCHANT_QR_REQUEST_APPROVED', 'merchant_request', { requestId, notes });
  }

  async rejectMerchantQRRequest(requestId: string, reason: string): Promise<void> {
    const request = this.merchantRequests.find(r => r.id === requestId);
    if (request) {
      request.status = 'rejected';
      request.approvedBy = this.currentUser?.id;
      request.rejectionReason = reason;
    }
    
    this.logAction('MERCHANT_QR_REQUEST_REJECTED', 'merchant_request', { requestId, reason });
  }

  // KYC Management
  async createKYCRequest(data: {
    merchantId: string;
    documents: KYCRequest['documents'];
  }): Promise<KYCRequest> {
    // Check if KYC request already exists for this merchant
    const existingRequest = this.kycRequests.find(r => r.merchantId === data.merchantId && r.status === 'pending');
    if (existingRequest) {
      throw new Error('A KYC request is already pending for this merchant');
    }
    
    const request: KYCRequest = {
      id: `kyc_${Date.now()}`,
      merchantId: data.merchantId,
      requestedBy: this.currentUser?.id || '1',
      branchId: this.currentUser?.branchId || '1',
      status: 'pending',
      documents: data.documents,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.kycRequests.push(request);
    this.logAction('KYC_REQUEST_CREATED', 'kyc_request', request);
    return request;
  }

  async getKYCRequests(branchId?: string): Promise<KYCRequest[]> {
    let requests = [...this.kycRequests];
    if (branchId) {
      requests = requests.filter(r => r.branchId === branchId);
    }
    return requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async approveKYCRequest(requestId: string, notes?: string): Promise<void> {
    const request = this.kycRequests.find(r => r.id === requestId);
    if (request) {
      request.status = 'approved';
      request.reviewedBy = this.currentUser?.id;
      request.reviewedAt = new Date().toISOString();
      request.reviewNotes = notes;
      request.updatedAt = new Date().toISOString();
      
      // Update merchant KYC status
      const merchant = this.merchants.find(m => m.id === request.merchantId);
      if (merchant) {
        merchant.kycStatus = 'verified';
      }
    }
    
    this.logAction('KYC_REQUEST_APPROVED', 'kyc_request', { requestId, notes });
  }

  async rejectKYCRequest(requestId: string, reason: string): Promise<void> {
    const request = this.kycRequests.find(r => r.id === requestId);
    if (request) {
      request.status = 'rejected';
      request.reviewedBy = this.currentUser?.id;
      request.reviewedAt = new Date().toISOString();
      request.reviewNotes = reason;
      request.updatedAt = new Date().toISOString();
      
      // Update merchant KYC status
      const merchant = this.merchants.find(m => m.id === request.merchantId);
      if (merchant) {
        merchant.kycStatus = 'rejected';
      }
    }
    
    this.logAction('KYC_REQUEST_REJECTED', 'kyc_request', { requestId, reason });
  }

  // Audit Management (for Auditor role)
  async getAuditLogs(filters?: { 
    dateFrom?: string; 
    dateTo?: string; 
    actionType?: string; 
    userId?: string; 
    branchId?: string 
  }): Promise<AuditLog[]> {
    let logs = [...mockAuditLogs];
    
    if (filters?.dateFrom) {
      logs = logs.filter(log => new Date(log.timestamp) >= new Date(filters.dateFrom!));
    }
    
    if (filters?.dateTo) {
      logs = logs.filter(log => new Date(log.timestamp) <= new Date(filters.dateTo!));
    }
    
    if (filters?.actionType) {
      logs = logs.filter(log => log.actionType === filters.actionType);
    }
    
    if (filters?.userId) {
      logs = logs.filter(log => log.actorUserId === filters.userId);
    }
    
    if (filters?.branchId) {
      logs = logs.filter(log => log.payload?.branchId === filters.branchId);
    }
    
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async generateAuditReport(type: 'compliance' | 'security' | 'performance' | 'user_activity', filters?: {
    dateFrom?: string;
    dateTo?: string;
    branchId?: string;
  }): Promise<any> {
    const logs = await this.getAuditLogs(filters);
    
    const report = {
      id: `audit_report_${Date.now()}`,
      type,
      generatedBy: this.currentUser?.id,
      generatedAt: new Date().toISOString(),
      filters,
      summary: this.generateAuditSummary(logs, type),
      details: this.generateAuditDetails(logs, type),
      recommendations: this.generateAuditRecommendations(logs, type)
    };
    
    this.logAction('AUDIT_REPORT_GENERATED', 'audit_report', { reportType: type, filters });
    return report;
  }

  // Audit Item Management (for Auditor role)
  async getAuditItems(filters?: {
    category?: string;
    status?: string;
    riskLevel?: string;
    branchId?: string;
    dueDate?: string;
  }): Promise<AuditItem[]> {
    let items = [...this.auditItems];
    
    if (filters?.category) {
      items = items.filter(item => item.category === filters.category);
    }
    
    if (filters?.status) {
      items = items.filter(item => item.status === filters.status);
    }
    
    if (filters?.riskLevel) {
      items = items.filter(item => item.riskLevel === filters.riskLevel);
    }
    
    if (filters?.branchId) {
      items = items.filter(item => item.branchId === filters.branchId);
    }
    
    if (filters?.dueDate) {
      const filterDate = new Date(filters.dueDate);
      items = items.filter(item => new Date(item.dueDate) <= filterDate);
    }
    
    return items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async updateAuditItem(itemId: string, updates: {
    status?: AuditItem['status'];
    findings?: string;
    recommendations?: string;
    score?: number;
    evidence?: string[];
  }): Promise<AuditItem> {
    const itemIndex = this.auditItems.findIndex(item => item.id === itemId);
    if (itemIndex === -1) throw new Error('Audit item not found');
    
    const updatedItem = {
      ...this.auditItems[itemIndex],
      ...updates,
      auditedBy: this.currentUser?.id,
      auditedAt: new Date().toISOString(),
      lastReviewDate: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.auditItems[itemIndex] = updatedItem;
    this.logAction('AUDIT_ITEM_UPDATED', 'audit_item', { itemId, updates });
    return updatedItem;
  }

  async createAuditItem(itemData: Partial<AuditItem>): Promise<AuditItem> {
    const newItem: AuditItem = {
      id: `audit_item_${Date.now()}`,
      category: itemData.category!,
      subcategory: itemData.subcategory!,
      title: itemData.title!,
      description: itemData.description!,
      riskLevel: itemData.riskLevel!,
      status: 'pending',
      dueDate: itemData.dueDate!,
      evidence: [],
      targetEntity: itemData.targetEntity!,
      targetEntityId: itemData.targetEntityId!,
      branchId: itemData.branchId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.auditItems.push(newItem);
    this.logAction('AUDIT_ITEM_CREATED', 'audit_item', newItem);
    return newItem;
  }

  async getAuditChecklists(): Promise<AuditChecklist[]> {
    // Update checklist scores based on current audit items
    return this.auditChecklists.map(checklist => {
      const items = this.auditItems.filter(item => 
        checklist.items.some(checklistItem => checklistItem.id === item.id)
      );
      
      const completedItems = items.filter(item => 
        item.status === 'compliant' || item.status === 'non_compliant' || item.status === 'requires_action'
      );
      
      const totalScore = items.reduce((sum, item) => sum + (item.score || 0), 0);
      const avgScore = items.length > 0 ? totalScore / items.length : 0;
      const completionRate = items.length > 0 ? (completedItems.length / items.length) * 100 : 0;
      
      return {
        ...checklist,
        items,
        overallScore: Math.round(avgScore),
        completionRate: Math.round(completionRate)
      };
    });
  }

  async generateAuditScorecard(period: string = 'current'): Promise<AuditScorecard> {
    const items = this.auditItems;
    const categories = ['qr_management', 'user_access', 'data_protection', 'process_compliance', 'security_controls', 'kyc_verification'];
    
    const categoryScores = categories.map(category => {
      const categoryItems = items.filter(item => item.category === category);
      const compliantCount = categoryItems.filter(item => item.status === 'compliant').length;
      const nonCompliantCount = categoryItems.filter(item => item.status === 'non_compliant').length;
      const pendingCount = categoryItems.filter(item => item.status === 'pending' || item.status === 'in_review').length;
      
      const totalScore = categoryItems.reduce((sum, item) => sum + (item.score || 0), 0);
      const avgScore = categoryItems.length > 0 ? totalScore / categoryItems.length : 100;
      
      return {
        category: category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        score: Math.round(avgScore),
        itemCount: categoryItems.length,
        compliantCount,
        nonCompliantCount,
        pendingCount
      };
    });
    
    const overallScore = Math.round(
      categoryScores.reduce((sum, cat) => sum + cat.score, 0) / categoryScores.length
    );
    
    const highRiskIssues = items.filter(item => 
      item.riskLevel === 'high' || item.riskLevel === 'critical'
    ).filter(item => 
      item.status === 'non_compliant' || item.status === 'requires_action'
    ).length;
    
    const riskLevel = highRiskIssues > 2 ? 'high' : highRiskIssues > 0 ? 'medium' : 'low';
    
    return {
      id: `scorecard_${Date.now()}`,
      period,
      overallScore,
      categoryScores,
      riskAssessment: {
        level: riskLevel,
        score: overallScore,
        issues: highRiskIssues,
        recommendations: this.generateScorcardRecommendations(items)
      },
      trends: {
        previousScore: overallScore - 2.3, // Mock previous score
        change: 2.3,
        trend: 'improving'
      },
      generatedAt: new Date().toISOString(),
      generatedBy: this.currentUser?.id || '9'
    };
  }

  private generateScorcardRecommendations(items: AuditItem[]): string[] {
    const recommendations = [];
    
    const nonCompliantItems = items.filter(item => item.status === 'non_compliant');
    const requiresActionItems = items.filter(item => item.status === 'requires_action');
    const pendingItems = items.filter(item => item.status === 'pending');
    
    if (nonCompliantItems.length > 0) {
      recommendations.push(`Address ${nonCompliantItems.length} non-compliant items immediately`);
    }
    
    if (requiresActionItems.length > 0) {
      recommendations.push(`Take action on ${requiresActionItems.length} items requiring attention`);
    }
    
    if (pendingItems.length > 0) {
      recommendations.push(`Complete review of ${pendingItems.length} pending audit items`);
    }
    
    // Add specific recommendations based on categories
    const kycIssues = items.filter(item => 
      item.category === 'kyc_verification' && 
      (item.status === 'requires_action' || item.status === 'non_compliant')
    );
    
    if (kycIssues.length > 0) {
      recommendations.push('Implement automated KYC review reminders and SLA monitoring');
    }
    
    const securityIssues = items.filter(item => 
      item.category === 'security_controls' && 
      item.score && item.score < 90
    );
    
    if (securityIssues.length > 0) {
      recommendations.push('Enhance security controls and implement additional monitoring');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Maintain current excellent compliance standards');
      recommendations.push('Continue regular monitoring and review processes');
    }
    
    return recommendations;
  }

  private generateAuditSummary(logs: AuditLog[], type: string): any {
    const totalActions = logs.length;
    const uniqueUsers = new Set(logs.map(log => log.actorUserId)).size;
    const actionTypes = new Set(logs.map(log => log.actionType)).size;
    
    switch (type) {
      case 'compliance':
        return {
          totalActions,
          complianceScore: 96.8,
          criticalIssues: 0,
          warningIssues: 2,
          passedChecks: 45,
          failedChecks: 0
        };
      case 'security':
        return {
          totalActions,
          securityScore: 98.2,
          securityEvents: logs.filter(log => log.actionType.includes('BLOCKED') || log.actionType.includes('REJECTED')).length,
          unauthorizedAttempts: 0,
          successfulLogins: logs.filter(log => log.actionType === 'USER_LOGIN').length,
          failedLogins: 0
        };
      case 'performance':
        return {
          totalActions,
          avgResponseTime: '2.3 seconds',
          systemUptime: '99.8%',
          peakUsage: '85%',
          errorRate: '0.2%'
        };
      case 'user_activity':
        return {
          totalActions,
          uniqueUsers,
          actionTypes,
          mostActiveUser: this.getMostActiveUser(logs),
          mostCommonAction: this.getMostCommonAction(logs)
        };
      default:
        return { totalActions, uniqueUsers, actionTypes };
    }
  }

  private generateAuditDetails(logs: AuditLog[], type: string): any[] {
    switch (type) {
      case 'compliance':
        return [
          { check: 'QR Code Generation Process', status: 'Passed', score: 100, details: 'All QR codes generated with proper authorization' },
          { check: 'Approval Workflow', status: 'Passed', score: 98, details: 'All requests follow proper approval chain' },
          { check: 'KYC Verification Process', status: 'Warning', score: 95, details: '2 KYC requests pending review beyond 48 hours' },
          { check: 'Data Retention Policy', status: 'Passed', score: 100, details: 'All audit logs properly maintained' },
          { check: 'User Access Controls', status: 'Passed', score: 99, details: 'Role-based access properly enforced' }
        ];
      case 'security':
        return [
          { event: 'Authentication Events', count: logs.filter(log => log.actionType.includes('LOGIN')).length, severity: 'Info' },
          { event: 'QR Code Blocks', count: logs.filter(log => log.actionType === 'QR_BLOCKED').length, severity: 'Medium' },
          { event: 'Failed Approvals', count: logs.filter(log => log.actionType === 'REQUEST_REJECTED').length, severity: 'Low' },
          { event: 'System Access', count: logs.filter(log => log.actionType.includes('SYSTEM')).length, severity: 'Info' }
        ];
      case 'performance':
        return [
          { metric: 'QR Generation Speed', value: '0.8 seconds', target: '< 2 seconds', status: 'Excellent' },
          { metric: 'Request Processing Time', value: '2.3 hours', target: '< 4 hours', status: 'Good' },
          { metric: 'System Response Time', value: '1.2 seconds', target: '< 3 seconds', status: 'Excellent' },
          { metric: 'Database Query Performance', value: '0.3 seconds', target: '< 1 second', status: 'Excellent' }
        ];
      case 'user_activity':
        return this.getUserActivityBreakdown(logs);
      default:
        return [];
    }
  }

  private generateAuditRecommendations(logs: AuditLog[], type: string): string[] {
    switch (type) {
      case 'compliance':
        return [
          'Implement automated KYC review reminders for requests pending over 24 hours',
          'Consider adding additional approval checkpoints for high-value QR requests',
          'Review and update data retention policies quarterly'
        ];
      case 'security':
        return [
          'Enable two-factor authentication for all administrative users',
          'Implement automated security monitoring for unusual access patterns',
          'Regular security training for all users recommended'
        ];
      case 'performance':
        return [
          'System performance is excellent, maintain current infrastructure',
          'Consider load balancing for future scaling',
          'Monitor database performance during peak usage periods'
        ];
      case 'user_activity':
        return [
          'Provide additional training for users with low activity levels',
          'Recognize high-performing users in monthly reviews',
          'Consider workflow optimization for frequently performed actions'
        ];
      default:
        return [];
    }
  }

  private getMostActiveUser(logs: AuditLog[]): string {
    const userCounts = logs.reduce((acc, log) => {
      acc[log.actorUserId] = (acc[log.actorUserId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostActiveUserId = Object.entries(userCounts).sort(([,a], [,b]) => b - a)[0]?.[0];
    const user = mockUsers.find(u => u.id === mostActiveUserId);
    return user ? user.name : 'Unknown';
  }

  private getMostCommonAction(logs: AuditLog[]): string {
    const actionCounts = logs.reduce((acc, log) => {
      acc[log.actionType] = (acc[log.actionType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(actionCounts).sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';
  }

  private getUserActivityBreakdown(logs: AuditLog[]): any[] {
    const userActivity = logs.reduce((acc, log) => {
      if (!acc[log.actorUserId]) {
        const user = mockUsers.find(u => u.id === log.actorUserId);
        acc[log.actorUserId] = {
          userId: log.actorUserId,
          userName: user?.name || 'Unknown',
          userRole: user?.role || 'Unknown',
          actions: []
        };
      }
      acc[log.actorUserId].actions.push(log);
      return acc;
    }, {} as Record<string, any>);
    
    return Object.values(userActivity).map((user: any) => ({
      ...user,
      totalActions: user.actions.length,
      lastActivity: user.actions[0]?.timestamp,
      actionBreakdown: user.actions.reduce((acc: any, action: AuditLog) => {
        acc[action.actionType] = (acc[action.actionType] || 0) + 1;
        return acc;
      }, {})
    }));
  }

  // Region Performance
  async getRegionPerformance(regionName?: string): Promise<any[]> {
    const regions = [
      { name: 'Central Region', branches: ['Downtown Branch', 'Midtown Branch'], totalQRs: 145, issued: 98 },
      { name: 'North Region', branches: ['Uptown Branch', 'Northside Branch'], totalQRs: 132, issued: 87 },
      { name: 'West Region', branches: ['Westside Branch', 'West End Branch'], totalQRs: 98, issued: 65 }
    ];
    
    if (regionName) {
      return regions.filter(r => r.name === regionName);
    }
    
    return regions;
  }

  // Seller Performance
  async getSellerPerformance(sellerName?: string): Promise<any[]> {
    const sellers = [
      { 
        name: 'Mike Sales', 
        userId: 'sales_001',
        branch: 'Downtown Branch',
        totalSales: 23,
        thisMonth: 8,
        lastMonth: 15,
        avgPerWeek: 5.8,
        topMerchants: ['Shop A', 'Store B', 'Market C']
      },
      { 
        name: 'Sarah Johnson', 
        userId: 'sales_002',
        branch: 'Uptown Branch',
        totalSales: 19,
        thisMonth: 6,
        lastMonth: 13,
        avgPerWeek: 4.8,
        topMerchants: ['Cafe X', 'Restaurant Y', 'Shop Z']
      },
      { 
        name: 'David Chen', 
        userId: 'sales_003',
        branch: 'Westside Branch',
        totalSales: 16,
        thisMonth: 5,
        lastMonth: 11,
        avgPerWeek: 4.0,
        topMerchants: ['Store 1', 'Shop 2', 'Market 3']
      }
    ];
    
    if (sellerName) {
      return sellers.filter(s => s.name === sellerName);
    }
    
    return sellers;
  }

  // Update QR Code
  async updateQRCode(qrId: string, updates: { merchantId?: string; terminalId?: string; notes?: string }): Promise<void> {
    const qr = mockQRCodes.find(q => q.id === qrId);
    if (qr) {
      if (updates.merchantId) qr.merchantId = updates.merchantId;
      if (updates.terminalId) qr.terminalId = updates.terminalId;
      if (updates.notes) qr.notes = updates.notes;
      qr.updatedAt = new Date().toISOString();
    }
    
    this.logAction('QR_UPDATED', 'qr_code', { qrId, updates });
  }

  async updateQRStatus(qrId: string, status: QRCode['status'], reason: string): Promise<void> {
    const qr = mockQRCodes.find(q => q.id === qrId);
    if (qr) {
      const oldStatus = qr.status;
      qr.status = status;
      qr.updatedAt = new Date().toISOString();
      
      // Add status change to notes
      const statusChangeNote = `Status changed from ${oldStatus} to ${status}. Reason: ${reason}`;
      qr.notes = qr.notes ? `${qr.notes}\n${statusChangeNote}` : statusChangeNote;
    }
    
    this.logAction('QR_STATUS_UPDATED', 'qr_code', { qrId, oldStatus: qr?.status, newStatus: status, reason });
  }

  async blockQRCode(qrId: string, reason: string): Promise<void> {
    const qr = mockQRCodes.find(q => q.id === qrId);
    if (qr) {
      qr.status = 'blocked';
      qr.blockedReason = reason;
      qr.blockedAt = new Date().toISOString();
      qr.blockedBy = this.currentUser?.id || 'system';
      qr.updatedAt = new Date().toISOString();
    }
    
    this.logAction('QR_BLOCKED', 'qr_code', { qrId, reason });
  }

  private logAction(action: string, entity: string, payload: any): void {
    const log: AuditLog = {
      id: `log_${Date.now()}_${Math.random()}`,
      actorUserId: this.currentUser?.id || 'system',
      actionType: action,
      targetEntity: entity,
      payload,
      timestamp: new Date().toISOString()
    };
    
    mockAuditLogs.unshift(log);
  }
}

export const apiService = new ApiService();