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
  type: 'DOMESTIC' | 'INTERNATIONAL';
  state?: string;
  country?: string;
  isActive?: boolean;
  managerId?: string;
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
  notes?: string;
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

// Backend Request interfaces
export interface Request {
  id: number;
  requestCode: string;
  title: string;
  description?: string;
  type: RequestType;
  status: RequestStatus;
  priority: RequestPriority;
  requestedAmount?: number;
  approvedAmount?: number;
  requestDate: string;
  approvalDate?: string;
  rejectionDate?: string;
  rejectionReason?: string;
  approvalComments?: string;
  dueDate?: string;
  attachmentPath?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Related entities
  requester?: {
    id: number;
    name: string;
    email: string;
    role: string;
    branchId?: number;
    branchName?: string;
  };
  approver?: {
    id: number;
    name: string;
    email: string;
    role: string;
    branchId?: number;
    branchName?: string;
  };
  branchId: number;
  branchName?: string;
  branchCode?: string;
  // Computed fields
  isOverdue: boolean;
  canBeApproved: boolean;
  canBeRejected: boolean;
  daysSinceRequest: number;
  statusDisplayName: string;
  typeDisplayName: string;
  priorityDisplayName: string;
}

export type RequestType = 
  | 'QR_CODE_REQUEST'
  | 'INVENTORY_REQUEST' 
  | 'PAYMENT_REQUEST'
  | 'MAINTENANCE_REQUEST'
  | 'EQUIPMENT_REQUEST'
  | 'MERCHANT_ONBOARDING'
  | 'BUDGET_REQUEST'
  | 'OTHER';

export type RequestStatus = 
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type RequestPriority = 
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'URGENT';

export interface CreateRequestDto {
  title: string;
  description?: string;
  type: RequestType;
  priority?: RequestPriority;
  requestedAmount?: number;
  dueDate?: string;
  attachmentPath?: string;
}

export interface UpdateRequestDto {
  title?: string;
  description?: string;
  type?: RequestType;
  priority?: RequestPriority;
  requestedAmount?: number;
  dueDate?: string;
  attachmentPath?: string;
}

export interface RequestApprovalDto {
  action: 'APPROVE' | 'REJECT' | 'RETURN';
  comments?: string;
  approvedAmount?: number;
  rejectionReason?: string;
}

export interface PaginatedRequestResponse {
  content: Request[];
  pageInfo: {
    pageNumber: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// Keep the old interface for backward compatibility, but mark as deprecated
/** @deprecated Use Request interface instead */
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