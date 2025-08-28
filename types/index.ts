export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'BRANCH_MANAGER' | 'BRANCH_APPROVER' | 'REQUEST_INITIATOR' | 'SALES_USER' | 'AUDITOR';
  branchId?: string;
  phone: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Branch {
  id: string;
  branchCode: string;
  name: string;
  region: string;
  type: 'domestic' | 'international';
  state?: string;
  country?: string;
  managerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface QRCode {
  id: string;
  qrValue: string;
  qrType: 'static' | 'dynamic';
  generationSource: 'system' | 'upload';
  uploadFileId?: string;
  status: 'unallocated' | 'allocated' | 'issued' | 'returned' | 'retired' | 'blocked';
  allocatedBranchId?: string;
  allocatedToUserId?: string;
  issuedToMerchantId?: string;
  bankName?: string;
  merchantName?: string;
  merchantId?: string;
  terminalId?: string;
  blockedReason?: string;
  blockedAt?: string;
  blockedBy?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Merchant {
  id: string;
  legalName: string;
  shopName: string;
  merchantIdInCore?: string;
  address: string;
  phone: string;
  email: string;
  kycStatus: 'pending' | 'verified' | 'rejected';
  branchId?: string;
  createdAt: string;
}

export interface AllocationRequest {
  id: string;
  requestNumber: string;
  branchId: string;
  initiatorUserId: string;
  requestedQrCount: number;
  requestedFor: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approverUserId?: string;
  notes: string;
  createdAt: string;
  approvedAt?: string;
}

export interface AllocationRecord {
  id: string;
  qrId: string;
  branchId: string;
  allocatedByUserId: string;
  allocatedAt: string;
}

export interface IssuanceRecord {
  id: string;
  qrId: string;
  merchantId: string;
  issuedByUserId: string;
  issuedAt: string;
  issuanceDocument?: string;
}

export interface ReturnRecord {
  id: string;
  qrId: string;
  returnedByUserId: string;
  returnedAt: string;
  reason: string;
  condition: string;
  approvedBy?: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface AuditLog {
  id: string;
  actorUserId: string;
  actionType: string;
  targetEntity: string;
  payload: any;
  timestamp: string;
}

export interface AuditItem {
  id: string;
  category: 'qr_management' | 'user_access' | 'data_protection' | 'process_compliance' | 'security_controls' | 'kyc_verification';
  subcategory: string;
  title: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_review' | 'compliant' | 'non_compliant' | 'requires_action';
  auditedBy?: string;
  auditedAt?: string;
  findings?: string;
  recommendations?: string;
  dueDate: string;
  lastReviewDate?: string;
  evidence?: string[];
  score?: number; // 0-100
  targetEntity: string;
  targetEntityId: string;
  branchId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditChecklist {
  id: string;
  name: string;
  description: string;
  category: string;
  items: AuditItem[];
  overallScore: number;
  completionRate: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditScorecard {
  id: string;
  period: string;
  overallScore: number;
  categoryScores: {
    category: string;
    score: number;
    itemCount: number;
    compliantCount: number;
    nonCompliantCount: number;
    pendingCount: number;
  }[];
  riskAssessment: {
    level: 'low' | 'medium' | 'high' | 'critical';
    score: number;
    issues: number;
    recommendations: string[];
  };
  trends: {
    previousScore: number;
    change: number;
    trend: 'improving' | 'declining' | 'stable';
  };
  generatedAt: string;
  generatedBy: string;
}
export interface DashboardStats {
  totalQRs: number;
  unallocated: number;
  allocated: number;
  issued: number;
  returned: number;
  blocked: number;
  pendingApprovals?: number;
  approvedRequests?: number;
  rejectedRequests?: number;
  returnedForCorrection?: number;
  pendingKYC?: number;
  topBranches?: { name: string; count: number }[];
  topSellers: { name: string; count: number; branch?: string; userId?: string }[];
  topRegions?: { name: string; count: number; branchCount: number }[];
  recentActivity: AuditLog[];
}

export interface BranchInventory {
  branchId: string;
  branchName: string;
  branchCode: string;
  totalAllocated: number;
  issued: number;
  available: number;
  returned: number;
  blocked: number;
  utilizationRate: number;
  lastActivity: string;
}

export interface ThresholdRequest {
  id: string;
  branchId: string;
  currentInventory: number;
  threshold: number;
  requestedAmount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdBy: string;
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface MerchantRequest {
  id: string;
  merchantId: string;
  requestedBy: string;
  branchId: string;
  requestedQrCount: number;
  businessJustification: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  rejectionReason?: string;
  createdAt: string;
  approvedAt?: string;
}

export interface KYCRequest {
  id: string;
  merchantId: string;
  requestedBy: string;
  branchId: string;
  status: 'pending' | 'approved' | 'rejected';
  documents: {
    businessLicense?: string;
    taxCertificate?: string;
    bankStatement?: string;
    ownershipProof?: string;
    additionalDocs?: string[];
  };
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}