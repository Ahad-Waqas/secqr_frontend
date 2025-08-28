import { User, Branch, QRCode, Merchant, AllocationRequest, IssuanceRecord, ReturnRecord, AuditLog } from '../types';
import type { AuditItem, AuditChecklist } from '../types';

export const mockUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@demobank.com',
    name: 'System Administrator',
    role: 'system_admin',
    phone: '+1-555-0001',
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    username: 'branch_mgr_001',
    email: 'john.manager@demobank.com',
    name: 'John Manager',
    role: 'branch_manager',
    branchId: '1',
    phone: '+1-555-0002',
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    username: 'approver_001',
    email: 'sarah.approver@demobank.com',
    name: 'Sarah Approver',
    role: 'branch_approver',
    branchId: '1',
    phone: '+1-555-0003',
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '4',
    username: 'sales_001',
    email: 'mike.sales@demobank.com',
    name: 'Mike Sales',
    role: 'sales_user',
    branchId: '1',
    phone: '+1-555-0004',
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '5',
    username: 'branch_mgr_002',
    email: 'lisa.manager@demobank.com',
    name: 'Lisa Manager',
    role: 'branch_manager',
    branchId: '2',
    phone: '+1-555-0005',
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '6',
    username: 'sales_002',
    email: 'david.sales@demobank.com',
    name: 'David Sales',
    role: 'sales_user',
    branchId: '2',
    phone: '+1-555-0006',
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '7',
    username: 'approver_002',
    email: 'emma.approver@demobank.com',
    name: 'Emma Approver',
    role: 'branch_approver',
    branchId: '2',
    phone: '+1-555-0007',
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '8',
    username: 'sales_003',
    email: 'robert.sales@demobank.com',
    name: 'Robert Sales',
    role: 'sales_user',
    branchId: '3',
    phone: '+1-555-0008',
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '9',
    username: 'auditor_001',
    email: 'alex.auditor@demobank.com',
    name: 'Alex Auditor',
    role: 'auditor',
    phone: '+1-555-0009',
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z'
  }
];

export const mockBranches: Branch[] = [
  {
    id: '1',
    branchCode: 'BR001',
    name: 'Downtown Branch',
    region: 'Central',
    type: 'domestic',
    managerId: '2',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    branchCode: 'BR002',
    name: 'Uptown Branch',
    region: 'North',
    type: 'domestic',
    managerId: '5',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    branchCode: 'BR003',
    name: 'Westside Branch',
    region: 'West',
    type: 'domestic',
    managerId: '8',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

// PERFECTLY SYNCHRONIZED QR CODES - TOTAL: 500
export const mockQRCodes: QRCode[] = [
  // UNALLOCATED QRs: 200 total
  ...Array.from({ length: 200 }, (_, i) => ({
    id: `qr_unalloc_${i + 1}`,
    qrValue: `Demo Bank Ltd\nGeneral Merchant\nGEN${String(i + 1).padStart(3, '0')}`,
    qrType: i % 2 === 0 ? 'static' : 'dynamic' as 'static' | 'dynamic',
    generationSource: 'system' as 'system' | 'upload',
    status: 'unallocated' as const,
    bankName: 'Demo Bank Ltd',
    merchantName: 'General Merchant',
    merchantId: `GEN${String(i + 1).padStart(3, '0')}`,
    createdBy: '1',
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  })),

  // ALLOCATED QRs: 150 total (50 per branch)
  // Downtown Branch - 50 Allocated
  ...Array.from({ length: 50 }, (_, i) => ({
    id: `qr_br1_alloc_${i + 1}`,
    qrValue: `Demo Bank Ltd\nDowntown Merchant ${i + 1}\nDT${String(i + 1).padStart(3, '0')}`,
    qrType: i % 2 === 0 ? 'static' : 'dynamic' as 'static' | 'dynamic',
    generationSource: 'system' as 'system' | 'upload',
    status: 'allocated' as const,
    allocatedBranchId: '1',
    bankName: 'Demo Bank Ltd',
    merchantName: `Downtown Merchant ${i + 1}`,
    merchantId: `DT${String(i + 1).padStart(3, '0')}`,
    createdBy: '1',
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  })),
  // Uptown Branch - 50 Allocated
  ...Array.from({ length: 50 }, (_, i) => ({
    id: `qr_br2_alloc_${i + 1}`,
    qrValue: `Demo Bank Ltd\nUptown Merchant ${i + 1}\nUP${String(i + 1).padStart(3, '0')}`,
    qrType: i % 2 === 0 ? 'static' : 'dynamic' as 'static' | 'dynamic',
    generationSource: 'system' as 'system' | 'upload',
    status: 'allocated' as const,
    allocatedBranchId: '2',
    bankName: 'Demo Bank Ltd',
    merchantName: `Uptown Merchant ${i + 1}`,
    merchantId: `UP${String(i + 1).padStart(3, '0')}`,
    createdBy: '1',
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  })),
  // Westside Branch - 50 Allocated
  ...Array.from({ length: 50 }, (_, i) => ({
    id: `qr_br3_alloc_${i + 1}`,
    qrValue: `Demo Bank Ltd\nWestside Merchant ${i + 1}\nWS${String(i + 1).padStart(3, '0')}`,
    qrType: i % 2 === 0 ? 'static' : 'dynamic' as 'static' | 'dynamic',
    generationSource: 'system' as 'system' | 'upload',
    status: 'allocated' as const,
    allocatedBranchId: '3',
    bankName: 'Demo Bank Ltd',
    merchantName: `Westside Merchant ${i + 1}`,
    merchantId: `WS${String(i + 1).padStart(3, '0')}`,
    createdBy: '1',
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  })),

  // ISSUED QRs: 120 total (40 per branch)
  // Downtown Branch - 40 Issued (to Mike Sales)
  ...Array.from({ length: 40 }, (_, i) => ({
    id: `qr_br1_issued_${i + 1}`,
    qrValue: `Demo Bank Ltd\nDowntown Shop ${i + 1}\nDTS${String(i + 1).padStart(3, '0')}\nT${String(i + 1).padStart(3, '0')}`,
    qrType: i % 2 === 0 ? 'static' : 'dynamic' as 'static' | 'dynamic',
    generationSource: 'system' as 'system' | 'upload',
    status: 'issued' as const,
    allocatedBranchId: '1',
    allocatedToUserId: '4', // Mike Sales
    issuedToMerchantId: `merchant_br1_${i + 1}`,
    bankName: 'Demo Bank Ltd',
    merchantName: `Downtown Shop ${i + 1}`,
    merchantId: `DTS${String(i + 1).padStart(3, '0')}`,
    terminalId: `T${String(i + 1).padStart(3, '0')}`,
    createdBy: '1',
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  })),
  // Uptown Branch - 40 Issued (to David Sales)
  ...Array.from({ length: 40 }, (_, i) => ({
    id: `qr_br2_issued_${i + 1}`,
    qrValue: `Demo Bank Ltd\nUptown Store ${i + 1}\nUPS${String(i + 1).padStart(3, '0')}`,
    qrType: i % 2 === 0 ? 'static' : 'dynamic' as 'static' | 'dynamic',
    generationSource: 'system' as 'system' | 'upload',
    status: 'issued' as const,
    allocatedBranchId: '2',
    allocatedToUserId: '6', // David Sales
    issuedToMerchantId: `merchant_br2_${i + 1}`,
    bankName: 'Demo Bank Ltd',
    merchantName: `Uptown Store ${i + 1}`,
    merchantId: `UPS${String(i + 1).padStart(3, '0')}`,
    createdBy: '1',
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  })),
  // Westside Branch - 40 Issued (to Robert Sales)
  ...Array.from({ length: 40 }, (_, i) => ({
    id: `qr_br3_issued_${i + 1}`,
    qrValue: `Demo Bank Ltd\nWestside Market ${i + 1}\nWSM${String(i + 1).padStart(3, '0')}\nT${String(i + 100).padStart(3, '0')}`,
    qrType: i % 2 === 0 ? 'static' : 'dynamic' as 'static' | 'dynamic',
    generationSource: 'system' as 'system' | 'upload',
    status: 'issued' as const,
    allocatedBranchId: '3',
    allocatedToUserId: '8', // Robert Sales
    issuedToMerchantId: `merchant_br3_${i + 1}`,
    bankName: 'Demo Bank Ltd',
    merchantName: `Westside Market ${i + 1}`,
    merchantId: `WSM${String(i + 1).padStart(3, '0')}`,
    terminalId: `T${String(i + 100).padStart(3, '0')}`,
    createdBy: '1',
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  })),

  // RETURNED QRs: 30 total (10 per branch)
  // Downtown Branch - 10 Returned
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `qr_br1_returned_${i + 1}`,
    qrValue: `Demo Bank Ltd\nReturned Merchant ${i + 1}\nRTN${String(i + 1).padStart(3, '0')}`,
    qrType: i % 2 === 0 ? 'static' : 'dynamic' as 'static' | 'dynamic',
    generationSource: 'system' as 'system' | 'upload',
    status: 'returned' as const,
    allocatedBranchId: '1',
    bankName: 'Demo Bank Ltd',
    merchantName: `Returned Merchant ${i + 1}`,
    merchantId: `RTN${String(i + 1).padStart(3, '0')}`,
    createdBy: '1',
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  })),
  // Uptown Branch - 10 Returned
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `qr_br2_returned_${i + 1}`,
    qrValue: `Demo Bank Ltd\nReturned Store ${i + 1}\nRTS${String(i + 1).padStart(3, '0')}`,
    qrType: i % 2 === 0 ? 'static' : 'dynamic' as 'static' | 'dynamic',
    generationSource: 'system' as 'system' | 'upload',
    status: 'returned' as const,
    allocatedBranchId: '2',
    bankName: 'Demo Bank Ltd',
    merchantName: `Returned Store ${i + 1}`,
    merchantId: `RTS${String(i + 1).padStart(3, '0')}`,
    createdBy: '1',
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  })),
  // Westside Branch - 10 Returned
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `qr_br3_returned_${i + 1}`,
    qrValue: `Demo Bank Ltd\nReturned Market ${i + 1}\nRTM${String(i + 1).padStart(3, '0')}`,
    qrType: i % 2 === 0 ? 'static' : 'dynamic' as 'static' | 'dynamic',
    generationSource: 'system' as 'system' | 'upload',
    status: 'returned' as const,
    allocatedBranchId: '3',
    bankName: 'Demo Bank Ltd',
    merchantName: `Returned Market ${i + 1}`,
    merchantId: `RTM${String(i + 1).padStart(3, '0')}`,
    createdBy: '1',
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  }))
];

// Synchronized Merchants by Branch - Total: 120 (matching issued QRs)
export const mockMerchants: Merchant[] = [
  // Downtown Branch Merchants - 40 (matching issued QRs)
  ...Array.from({ length: 40 }, (_, i) => ({
    id: `merchant_br1_${i + 1}`,
    legalName: `Downtown Legal Entity ${i + 1} LLC`,
    shopName: `Downtown Shop ${i + 1}`,
    address: `${100 + i} Downtown Street, Central City, NY 10001`,
    phone: `+1-555-1${String(i + 1).padStart(3, '0')}`,
    email: `downtown${i + 1}@business.com`,
    kycStatus: i < 2 ? 'pending' : i === 2 ? 'rejected' : 'verified' as any,
    branchId: '1',
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
  })),
  // Uptown Branch Merchants - 40 (matching issued QRs)
  ...Array.from({ length: 40 }, (_, i) => ({
    id: `merchant_br2_${i + 1}`,
    legalName: `Uptown Business ${i + 1} Inc`,
    shopName: `Uptown Store ${i + 1}`,
    address: `${200 + i} Uptown Avenue, North City, NY 10002`,
    phone: `+1-555-2${String(i + 1).padStart(3, '0')}`,
    email: `uptown${i + 1}@business.com`,
    kycStatus: i < 2 ? 'pending' : i === 2 ? 'rejected' : 'verified' as any,
    branchId: '2',
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
  })),
  // Westside Branch Merchants - 40 (matching issued QRs)
  ...Array.from({ length: 40 }, (_, i) => ({
    id: `merchant_br3_${i + 1}`,
    legalName: `Westside Enterprise ${i + 1} Corp`,
    shopName: `Westside Market ${i + 1}`,
    address: `${300 + i} Westside Road, West City, NY 10003`,
    phone: `+1-555-3${String(i + 1).padStart(3, '0')}`,
    email: `westside${i + 1}@business.com`,
    kycStatus: i < 2 ? 'pending' : i === 2 ? 'rejected' : 'verified' as any,
    branchId: '3',
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
  }))
];

// Synchronized KYC Requests - Aligned with merchant KYC status
export const mockKYCRequests: any[] = [
  // Downtown Branch - Pending KYC requests (2 pending merchants)
  {
    id: 'kyc_br1_001',
    merchantId: 'merchant_br1_1',
    requestedBy: '4', // Mike Sales
    branchId: '1',
    status: 'pending',
    documents: {
      businessLicense: 'BL-DT001-2024.pdf',
      taxCertificate: 'TC-DT001-2024.pdf',
      bankStatement: 'BS-DT001-2024.pdf',
      ownershipProof: 'OP-DT001-2024.pdf',
      additionalDocs: ['Additional-ID-DT001.pdf']
    },
    createdAt: '2024-01-20T10:30:00Z',
    updatedAt: '2024-01-20T10:30:00Z'
  },
  {
    id: 'kyc_br1_002',
    merchantId: 'merchant_br1_2',
    requestedBy: '4', // Mike Sales
    branchId: '1',
    status: 'pending',
    documents: {
      businessLicense: 'BL-DT002-2024.pdf',
      taxCertificate: 'TC-DT002-2024.pdf',
      bankStatement: 'BS-DT002-2024.pdf',
      ownershipProof: 'OP-DT002-2024.pdf'
    },
    createdAt: '2024-01-19T14:15:00Z',
    updatedAt: '2024-01-19T14:15:00Z'
  },
  // Downtown Branch - Rejected KYC (1 rejected merchant)
  {
    id: 'kyc_br1_003',
    merchantId: 'merchant_br1_3',
    requestedBy: '4', // Mike Sales
    branchId: '1',
    status: 'rejected',
    documents: {
      businessLicense: 'BL-DT003-2024.pdf',
      taxCertificate: 'TC-DT003-2024.pdf',
      bankStatement: 'BS-DT003-2024.pdf'
    },
    reviewedBy: '3', // Sarah Approver
    reviewedAt: '2024-01-17T11:20:00Z',
    reviewNotes: 'Ownership proof missing. Bank statement is outdated (older than 3 months). Please resubmit with current documents.',
    createdAt: '2024-01-17T08:45:00Z',
    updatedAt: '2024-01-17T11:20:00Z'
  },
  
  // Uptown Branch - Pending KYC requests (2 pending merchants)
  {
    id: 'kyc_br2_001',
    merchantId: 'merchant_br2_1',
    requestedBy: '6', // David Sales
    branchId: '2',
    status: 'pending',
    documents: {
      businessLicense: 'BL-UP001-2024.pdf',
      taxCertificate: 'TC-UP001-2024.pdf',
      bankStatement: 'BS-UP001-2024.pdf',
      ownershipProof: 'OP-UP001-2024.pdf'
    },
    createdAt: '2024-01-21T09:15:00Z',
    updatedAt: '2024-01-21T09:15:00Z'
  },
  {
    id: 'kyc_br2_002',
    merchantId: 'merchant_br2_2',
    requestedBy: '6', // David Sales
    branchId: '2',
    status: 'pending',
    documents: {
      businessLicense: 'BL-UP002-2024.pdf',
      taxCertificate: 'TC-UP002-2024.pdf',
      bankStatement: 'BS-UP002-2024.pdf',
      ownershipProof: 'OP-UP002-2024.pdf',
      additionalDocs: ['Partnership-Agreement-UP002.pdf']
    },
    createdAt: '2024-01-20T16:30:00Z',
    updatedAt: '2024-01-20T16:30:00Z'
  },
  // Uptown Branch - Rejected KYC (1 rejected merchant)
  {
    id: 'kyc_br2_003',
    merchantId: 'merchant_br2_3',
    requestedBy: '6', // David Sales
    branchId: '2',
    status: 'rejected',
    documents: {
      businessLicense: 'BL-UP003-2024.pdf',
      taxCertificate: 'TC-UP003-2024.pdf'
    },
    reviewedBy: '7', // Emma Approver
    reviewedAt: '2024-01-18T13:45:00Z',
    reviewNotes: 'Incomplete documentation. Missing bank statement and ownership proof. Tax certificate appears to be expired.',
    createdAt: '2024-01-18T10:20:00Z',
    updatedAt: '2024-01-18T13:45:00Z'
  },
  
  // Westside Branch - Pending KYC requests (2 pending merchants)
  {
    id: 'kyc_br3_001',
    merchantId: 'merchant_br3_1',
    requestedBy: '8', // Robert Sales
    branchId: '3',
    status: 'pending',
    documents: {
      businessLicense: 'BL-WS001-2024.pdf',
      taxCertificate: 'TC-WS001-2024.pdf',
      bankStatement: 'BS-WS001-2024.pdf',
      ownershipProof: 'OP-WS001-2024.pdf'
    },
    createdAt: '2024-01-22T11:45:00Z',
    updatedAt: '2024-01-22T11:45:00Z'
  },
  {
    id: 'kyc_br3_002',
    merchantId: 'merchant_br3_2',
    requestedBy: '8', // Robert Sales
    branchId: '3',
    status: 'pending',
    documents: {
      businessLicense: 'BL-WS002-2024.pdf',
      taxCertificate: 'TC-WS002-2024.pdf',
      bankStatement: 'BS-WS002-2024.pdf',
      ownershipProof: 'OP-WS002-2024.pdf',
      additionalDocs: ['Insurance-Certificate-WS002.pdf', 'Trade-License-WS002.pdf']
    },
    createdAt: '2024-01-21T15:20:00Z',
    updatedAt: '2024-01-21T15:20:00Z'
  },
  // Westside Branch - Rejected KYC (1 rejected merchant)
  {
    id: 'kyc_br3_003',
    merchantId: 'merchant_br3_3',
    requestedBy: '8', // Robert Sales
    branchId: '3',
    status: 'rejected',
    documents: {
      businessLicense: 'BL-WS003-2024.pdf',
      bankStatement: 'BS-WS003-2024.pdf'
    },
    reviewedBy: '1', // System Admin (acting as approver)
    reviewedAt: '2024-01-19T14:30:00Z',
    reviewNotes: 'Missing tax certificate and ownership proof. Business license format is not acceptable. Please provide official government-issued documents.',
    createdAt: '2024-01-19T09:15:00Z',
    updatedAt: '2024-01-19T14:30:00Z'
  }
];

// Synchronized Allocation Requests by Branch
export const mockAllocationRequests: AllocationRequest[] = [
  // Downtown Branch Requests
  {
    id: '1',
    requestNumber: 'REQ-BR1-001',
    branchId: '1',
    initiatorUserId: '4', // Mike Sales
    requestedQrCount: 25,
    requestedFor: 'Monthly merchant acquisition campaign',
    status: 'pending',
    notes: 'Need QRs for upcoming market expansion in downtown area. Targeting 25 new retail merchants.',
    createdAt: '2024-01-22T10:00:00Z'
  },
  {
    id: '2',
    requestNumber: 'REQ-BR1-002',
    branchId: '1',
    initiatorUserId: '4', // Mike Sales
    requestedQrCount: 15,
    requestedFor: 'Small business onboarding initiative',
    status: 'approved',
    approverUserId: '3', // Sarah Approver
    notes: 'Approved for Q1 target achievement. Focus on small retail establishments.',
    createdAt: '2024-01-19T14:30:00Z',
    approvedAt: '2024-01-19T16:45:00Z'
  },
  
  // Uptown Branch Requests
  {
    id: '3',
    requestNumber: 'REQ-BR2-001',
    branchId: '2',
    initiatorUserId: '6', // David Sales
    requestedQrCount: 20,
    requestedFor: 'Restaurant and cafe partnership program',
    status: 'pending',
    notes: 'Focus on food & beverage establishments in uptown district. High potential market.',
    createdAt: '2024-01-21T11:00:00Z'
  },
  {
    id: '4',
    requestNumber: 'REQ-BR2-002',
    branchId: '2',
    initiatorUserId: '6', // David Sales
    requestedQrCount: 30,
    requestedFor: 'Retail merchant expansion',
    status: 'approved',
    approverUserId: '7', // Emma Approver
    notes: 'Approved for retail sector expansion. Excellent business case provided.',
    createdAt: '2024-01-18T13:20:00Z',
    approvedAt: '2024-01-18T15:45:00Z'
  },
  
  // Westside Branch Requests
  {
    id: '5',
    requestNumber: 'REQ-BR3-001',
    branchId: '3',
    initiatorUserId: '8', // Robert Sales
    requestedQrCount: 15,
    requestedFor: 'Service sector outreach program',
    status: 'rejected',
    approverUserId: '1', // System Admin (acting as approver)
    notes: 'Rejected due to insufficient business justification. Please provide detailed market analysis and merchant pipeline.',
    createdAt: '2024-01-20T16:00:00Z'
  },
  {
    id: '6',
    requestNumber: 'REQ-BR3-002',
    branchId: '3',
    initiatorUserId: '8', // Robert Sales
    requestedQrCount: 10,
    requestedFor: 'Local market vendor program',
    status: 'pending',
    notes: 'Targeting local market vendors and small businesses in westside area.',
    createdAt: '2024-01-22T09:30:00Z'
  }
];

// Comprehensive Audit Logs - Synchronized with all activities
export const mockAuditLogs: AuditLog[] = [
  // Recent System Activities
  {
    id: 'log_001',
    actorUserId: '1',
    actionType: 'QR_GENERATED',
    targetEntity: 'qr_code',
    payload: { count: 500, type: 'bulk_generation', bankName: 'Demo Bank Ltd' },
    timestamp: '2024-01-22T09:00:00Z'
  },
  
  // KYC Activities
  {
    id: 'log_002',
    actorUserId: '4',
    actionType: 'KYC_REQUEST_CREATED',
    targetEntity: 'kyc_request',
    payload: { kycId: 'kyc_br1_001', merchantId: 'merchant_br1_1', branchId: '1', merchantName: 'Downtown Shop 1' },
    timestamp: '2024-01-20T10:30:00Z'
  },
  {
    id: 'log_003',
    actorUserId: '6',
    actionType: 'KYC_REQUEST_CREATED',
    targetEntity: 'kyc_request',
    payload: { kycId: 'kyc_br2_001', merchantId: 'merchant_br2_1', branchId: '2', merchantName: 'Uptown Store 1' },
    timestamp: '2024-01-21T09:15:00Z'
  },
  {
    id: 'log_004',
    actorUserId: '3',
    actionType: 'KYC_REQUEST_REJECTED',
    targetEntity: 'kyc_request',
    payload: { kycId: 'kyc_br1_003', merchantId: 'merchant_br1_3', branchId: '1', reason: 'Incomplete documentation' },
    timestamp: '2024-01-17T11:20:00Z'
  },
  
  // Request Activities
  {
    id: 'log_005',
    actorUserId: '3',
    actionType: 'REQUEST_APPROVED',
    targetEntity: 'allocation_request',
    payload: { requestId: '2', requestNumber: 'REQ-BR1-002', count: 15, branchId: '1' },
    timestamp: '2024-01-19T16:45:00Z'
  },
  {
    id: 'log_006',
    actorUserId: '7',
    actionType: 'REQUEST_APPROVED',
    targetEntity: 'allocation_request',
    payload: { requestId: '4', requestNumber: 'REQ-BR2-002', count: 30, branchId: '2' },
    timestamp: '2024-01-18T15:45:00Z'
  },
  {
    id: 'log_007',
    actorUserId: '1',
    actionType: 'REQUEST_REJECTED',
    targetEntity: 'allocation_request',
    payload: { requestId: '5', requestNumber: 'REQ-BR3-001', branchId: '3', reason: 'Insufficient justification' },
    timestamp: '2024-01-20T16:30:00Z'
  },
  
  // QR Activities
  {
    id: 'log_008',
    actorUserId: '4',
    actionType: 'QR_ISSUED',
    targetEntity: 'qr_code',
    payload: { qrId: 'qr_br1_issued_1', merchantId: 'merchant_br1_4', branchId: '1', merchantName: 'Downtown Shop 4' },
    timestamp: '2024-01-21T11:30:00Z'
  },
  {
    id: 'log_009',
    actorUserId: '6',
    actionType: 'QR_ISSUED',
    targetEntity: 'qr_code',
    payload: { qrId: 'qr_br2_issued_1', merchantId: 'merchant_br2_4', branchId: '2', merchantName: 'Uptown Store 4' },
    timestamp: '2024-01-20T10:15:00Z'
  },
  {
    id: 'log_010',
    actorUserId: '8',
    actionType: 'QR_ISSUED',
    targetEntity: 'qr_code',
    payload: { qrId: 'qr_br3_issued_1', merchantId: 'merchant_br3_4', branchId: '3', merchantName: 'Westside Market 4' },
    timestamp: '2024-01-19T15:45:00Z'
  },
  
  // Bulk Operations
  {
    id: 'log_011',
    actorUserId: '2',
    actionType: 'BULK_QR_ALLOCATED',
    targetEntity: 'qr_code',
    payload: { branchId: '1', count: 50, allocationType: 'branch_allocation' },
    timestamp: '2024-01-18T11:30:00Z'
  },
  {
    id: 'log_012',
    actorUserId: '5',
    actionType: 'BULK_QR_ALLOCATED',
    targetEntity: 'qr_code',
    payload: { branchId: '2', count: 50, allocationType: 'branch_allocation' },
    timestamp: '2024-01-18T11:35:00Z'
  },
  
  // Merchant Activities
  {
    id: 'log_013',
    actorUserId: '4',
    actionType: 'MERCHANT_CREATED',
    targetEntity: 'merchant',
    payload: { merchantId: 'merchant_br1_1', branchId: '1', shopName: 'Downtown Shop 1', legalName: 'Downtown Legal Entity 1 LLC' },
    timestamp: '2024-01-20T09:00:00Z'
  },
  {
    id: 'log_014',
    actorUserId: '6',
    actionType: 'MERCHANT_CREATED',
    targetEntity: 'merchant',
    payload: { merchantId: 'merchant_br2_1', branchId: '2', shopName: 'Uptown Store 1', legalName: 'Uptown Business 1 Inc' },
    timestamp: '2024-01-21T08:30:00Z'
  },
  
  // Return Activities
  {
    id: 'log_015',
    actorUserId: '4',
    actionType: 'QR_RETURNED',
    targetEntity: 'qr_code',
    payload: { qrId: 'qr_br1_returned_1', reason: 'Merchant closed business', condition: 'good', branchId: '1' },
    timestamp: '2024-01-18T14:20:00Z'
  },
  {
    id: 'log_016',
    actorUserId: '8',
    actionType: 'QR_RETURNED',
    targetEntity: 'qr_code',
    payload: { qrId: 'qr_br3_returned_1', reason: 'Merchant relocated', condition: 'good', branchId: '3' },
    timestamp: '2024-01-17T16:15:00Z'
  },
  
  // Audit Activities
  {
    id: 'log_017',
    actorUserId: '9',
    actionType: 'AUDIT_REPORT_GENERATED',
    targetEntity: 'audit_report',
    payload: { reportType: 'compliance_audit', dateRange: '30_days', branchId: 'all', reportId: 'RPT-001' },
    timestamp: '2024-01-15T14:30:00Z'
  },
  {
    id: 'log_018',
    actorUserId: '9',
    actionType: 'SYSTEM_AUDIT_PERFORMED',
    targetEntity: 'system',
    payload: { auditType: 'security_review', findings: 0, score: 98.5, duration: '2_hours' },
    timestamp: '2024-01-10T11:00:00Z'
  },
  
  // User Management Activities
  {
    id: 'log_019',
    actorUserId: '1',
    actionType: 'USER_CREATED',
    targetEntity: 'user',
    payload: { userId: '9', username: 'auditor_001', role: 'auditor', name: 'Alex Auditor' },
    timestamp: '2024-01-05T10:00:00Z'
  },
  {
    id: 'log_020',
    actorUserId: '1',
    actionType: 'BRANCH_CREATED',
    targetEntity: 'branch',
    payload: { branchId: '3', branchCode: 'BR003', name: 'Westside Branch', region: 'West' },
    timestamp: '2024-01-03T15:30:00Z'
  }
];

// Comprehensive Audit Items for Auditor Workflow
export const mockAuditItems: AuditItem[] = [
  // QR Management Audit Items
  {
    id: 'audit_qr_001',
    category: 'qr_management',
    subcategory: 'generation_process',
    title: 'QR Code Generation Authorization',
    description: 'Verify that all QR code generation follows proper authorization protocols',
    riskLevel: 'high',
    status: 'compliant',
    auditedBy: '9',
    auditedAt: '2024-01-20T10:30:00Z',
    findings: 'All QR code generation properly authorized by system administrators. 500 QR codes generated with proper metadata.',
    recommendations: 'Continue current authorization process. Consider implementing automated approval for small batches.',
    dueDate: '2024-02-20T00:00:00Z',
    lastReviewDate: '2024-01-20T10:30:00Z',
    evidence: ['QR_GENERATED audit logs', 'Authorization records', 'System admin confirmations'],
    score: 98,
    targetEntity: 'qr_code',
    targetEntityId: 'all',
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-20T10:30:00Z'
  },
  {
    id: 'audit_qr_002',
    category: 'qr_management',
    subcategory: 'allocation_process',
    title: 'Branch QR Allocation Compliance',
    description: 'Review QR code allocation process to branches and verify proper distribution',
    riskLevel: 'medium',
    status: 'compliant',
    auditedBy: '9',
    auditedAt: '2024-01-21T14:15:00Z',
    findings: 'QR allocation evenly distributed across 3 branches (50 QRs each). Proper branch assignment protocols followed.',
    recommendations: 'Allocation process is working well. Consider implementing automated threshold alerts.',
    dueDate: '2024-02-21T00:00:00Z',
    lastReviewDate: '2024-01-21T14:15:00Z',
    evidence: ['Branch allocation records', 'Distribution reports', 'Manager confirmations'],
    score: 95,
    targetEntity: 'branch',
    targetEntityId: 'all',
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-21T14:15:00Z'
  },
  {
    id: 'audit_qr_003',
    category: 'qr_management',
    subcategory: 'issuance_tracking',
    title: 'QR Issuance to Merchants',
    description: 'Audit QR code issuance process and merchant verification requirements',
    riskLevel: 'high',
    status: 'requires_action',
    auditedBy: '9',
    auditedAt: '2024-01-22T11:45:00Z',
    findings: '120 QRs issued to merchants. Found 6 pending KYC verifications that need immediate attention.',
    recommendations: 'Implement stricter KYC verification before QR issuance. Set up automated KYC status checks.',
    dueDate: '2024-01-30T00:00:00Z',
    lastReviewDate: '2024-01-22T11:45:00Z',
    evidence: ['Issuance records', 'KYC status reports', 'Merchant verification logs'],
    score: 85,
    targetEntity: 'merchant',
    targetEntityId: 'all',
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-22T11:45:00Z'
  },

  // User Access Control Audit Items
  {
    id: 'audit_user_001',
    category: 'user_access',
    subcategory: 'role_permissions',
    title: 'Role-Based Access Control Review',
    description: 'Verify that user roles and permissions are properly configured and enforced',
    riskLevel: 'high',
    status: 'compliant',
    auditedBy: '9',
    auditedAt: '2024-01-19T16:20:00Z',
    findings: '9 users across 6 roles. All role permissions properly configured. No unauthorized access detected.',
    recommendations: 'Access control is excellent. Consider implementing periodic access reviews.',
    dueDate: '2024-02-19T00:00:00Z',
    lastReviewDate: '2024-01-19T16:20:00Z',
    evidence: ['User role assignments', 'Permission matrices', 'Access logs'],
    score: 99,
    targetEntity: 'user',
    targetEntityId: 'all',
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-19T16:20:00Z'
  },
  {
    id: 'audit_user_002',
    category: 'user_access',
    subcategory: 'session_management',
    title: 'User Session Security',
    description: 'Review user session management and timeout policies',
    riskLevel: 'medium',
    status: 'pending',
    dueDate: '2024-01-25T00:00:00Z',
    evidence: [],
    targetEntity: 'system',
    targetEntityId: 'session_config',
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-15T09:00:00Z'
  },

  // Data Protection Audit Items
  {
    id: 'audit_data_001',
    category: 'data_protection',
    subcategory: 'encryption',
    title: 'Data Encryption Standards',
    description: 'Verify that sensitive data is properly encrypted at rest and in transit',
    riskLevel: 'critical',
    status: 'compliant',
    auditedBy: '9',
    auditedAt: '2024-01-18T13:30:00Z',
    findings: 'All sensitive data properly encrypted. QR codes, merchant data, and user information secured.',
    recommendations: 'Encryption standards are excellent. Continue current practices.',
    dueDate: '2024-02-18T00:00:00Z',
    lastReviewDate: '2024-01-18T13:30:00Z',
    evidence: ['Encryption certificates', 'Security configurations', 'Data flow diagrams'],
    score: 100,
    targetEntity: 'system',
    targetEntityId: 'encryption',
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-18T13:30:00Z'
  },
  {
    id: 'audit_data_002',
    category: 'data_protection',
    subcategory: 'backup_recovery',
    title: 'Data Backup and Recovery Procedures',
    description: 'Audit backup procedures and disaster recovery capabilities',
    riskLevel: 'high',
    status: 'in_review',
    auditedBy: '9',
    auditedAt: '2024-01-22T09:15:00Z',
    findings: 'Backup procedures in place. Testing recovery process for completeness.',
    recommendations: 'Pending completion of recovery testing. Initial assessment positive.',
    dueDate: '2024-01-28T00:00:00Z',
    lastReviewDate: '2024-01-22T09:15:00Z',
    evidence: ['Backup logs', 'Recovery test results'],
    score: 88,
    targetEntity: 'system',
    targetEntityId: 'backup_system',
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-22T09:15:00Z'
  },

  // Process Compliance Audit Items
  {
    id: 'audit_process_001',
    category: 'process_compliance',
    subcategory: 'approval_workflow',
    title: 'Request Approval Process Compliance',
    description: 'Review the request approval workflow for compliance with internal policies',
    riskLevel: 'medium',
    status: 'compliant',
    auditedBy: '9',
    auditedAt: '2024-01-21T15:45:00Z',
    findings: '6 allocation requests reviewed. All follow proper approval workflow. Average approval time: 2.3 hours.',
    recommendations: 'Approval process is efficient and compliant. Consider documenting best practices.',
    dueDate: '2024-02-21T00:00:00Z',
    lastReviewDate: '2024-01-21T15:45:00Z',
    evidence: ['Approval workflow logs', 'Timing analysis', 'Process documentation'],
    score: 96,
    targetEntity: 'allocation_request',
    targetEntityId: 'all',
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-21T15:45:00Z'
  },
  {
    id: 'audit_process_002',
    category: 'process_compliance',
    subcategory: 'documentation',
    title: 'Process Documentation Review',
    description: 'Verify that all processes are properly documented and up to date',
    riskLevel: 'low',
    status: 'non_compliant',
    auditedBy: '9',
    auditedAt: '2024-01-20T14:20:00Z',
    findings: 'Some process documentation is outdated. KYC process documentation needs updates.',
    recommendations: 'Update KYC process documentation to reflect current workflow. Schedule quarterly reviews.',
    dueDate: '2024-01-27T00:00:00Z',
    lastReviewDate: '2024-01-20T14:20:00Z',
    evidence: ['Process documents', 'Version control logs', 'Review schedules'],
    score: 72,
    targetEntity: 'system',
    targetEntityId: 'documentation',
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-20T14:20:00Z'
  },

  // Security Controls Audit Items
  {
    id: 'audit_security_001',
    category: 'security_controls',
    subcategory: 'authentication',
    title: 'User Authentication Security',
    description: 'Review user authentication mechanisms and security controls',
    riskLevel: 'high',
    status: 'compliant',
    auditedBy: '9',
    auditedAt: '2024-01-17T12:10:00Z',
    findings: 'Strong authentication in place. No failed login attempts detected. Session management proper.',
    recommendations: 'Consider implementing 2FA for enhanced security.',
    dueDate: '2024-02-17T00:00:00Z',
    lastReviewDate: '2024-01-17T12:10:00Z',
    evidence: ['Authentication logs', 'Security configurations', 'Session records'],
    score: 92,
    targetEntity: 'system',
    targetEntityId: 'authentication',
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-17T12:10:00Z'
  },
  {
    id: 'audit_security_002',
    category: 'security_controls',
    subcategory: 'audit_logging',
    title: 'Audit Trail Completeness',
    description: 'Verify that all system activities are properly logged for audit purposes',
    riskLevel: 'critical',
    status: 'compliant',
    auditedBy: '9',
    auditedAt: '2024-01-22T16:30:00Z',
    findings: 'Comprehensive audit logging in place. All critical actions logged with proper detail.',
    recommendations: 'Audit logging is excellent. Maintain current standards.',
    dueDate: '2024-02-22T00:00:00Z',
    lastReviewDate: '2024-01-22T16:30:00Z',
    evidence: ['Audit log samples', 'Logging configuration', 'Retention policies'],
    score: 100,
    targetEntity: 'system',
    targetEntityId: 'audit_system',
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-22T16:30:00Z'
  },

  // KYC Verification Audit Items
  {
    id: 'audit_kyc_001',
    category: 'kyc_verification',
    subcategory: 'document_verification',
    title: 'KYC Document Verification Process',
    description: 'Review KYC document verification procedures and compliance',
    riskLevel: 'high',
    status: 'requires_action',
    auditedBy: '9',
    auditedAt: '2024-01-22T11:00:00Z',
    findings: '6 KYC requests pending review. 2 requests pending over 48 hours.',
    recommendations: 'Implement automated reminders for KYC reviews. Set SLA for 24-hour review completion.',
    dueDate: '2024-01-25T00:00:00Z',
    lastReviewDate: '2024-01-22T11:00:00Z',
    evidence: ['KYC request logs', 'Review timelines', 'Document checklists'],
    score: 78,
    targetEntity: 'kyc_request',
    targetEntityId: 'all',
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-22T11:00:00Z'
  },
  {
    id: 'audit_kyc_002',
    category: 'kyc_verification',
    subcategory: 'approval_authority',
    title: 'KYC Approval Authority Verification',
    description: 'Verify that only authorized personnel can approve KYC requests',
    riskLevel: 'critical',
    status: 'compliant',
    auditedBy: '9',
    auditedAt: '2024-01-19T10:45:00Z',
    findings: 'Only branch approvers can approve KYC requests. Proper role-based access enforced.',
    recommendations: 'Authority controls are properly implemented. Continue current practices.',
    dueDate: '2024-02-19T00:00:00Z',
    lastReviewDate: '2024-01-19T10:45:00Z',
    evidence: ['Role permission matrix', 'Approval logs', 'Access control tests'],
    score: 100,
    targetEntity: 'user',
    targetEntityId: 'approvers',
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-19T10:45:00Z'
  },

  // Branch-Specific Audit Items
  {
    id: 'audit_branch_001',
    category: 'process_compliance',
    subcategory: 'branch_operations',
    title: 'Downtown Branch Operations Audit',
    description: 'Comprehensive audit of Downtown Branch operations and compliance',
    riskLevel: 'medium',
    status: 'compliant',
    auditedBy: '9',
    auditedAt: '2024-01-20T13:30:00Z',
    findings: 'Downtown Branch: 100 QRs allocated, 40 issued, 90% utilization. Excellent performance.',
    recommendations: 'Branch operations are exemplary. Use as best practice model for other branches.',
    dueDate: '2024-02-20T00:00:00Z',
    lastReviewDate: '2024-01-20T13:30:00Z',
    evidence: ['Branch performance reports', 'Utilization metrics', 'Manager interviews'],
    score: 94,
    targetEntity: 'branch',
    targetEntityId: '1',
    branchId: '1',
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-20T13:30:00Z'
  },
  {
    id: 'audit_branch_002',
    category: 'process_compliance',
    subcategory: 'branch_operations',
    title: 'Uptown Branch Operations Audit',
    description: 'Comprehensive audit of Uptown Branch operations and compliance',
    riskLevel: 'medium',
    status: 'compliant',
    auditedBy: '9',
    auditedAt: '2024-01-21T10:15:00Z',
    findings: 'Uptown Branch: 100 QRs allocated, 40 issued, 90% utilization. Strong performance.',
    recommendations: 'Branch operations are solid. Continue current practices.',
    dueDate: '2024-02-21T00:00:00Z',
    lastReviewDate: '2024-01-21T10:15:00Z',
    evidence: ['Branch performance reports', 'Utilization metrics', 'Staff interviews'],
    score: 93,
    targetEntity: 'branch',
    targetEntityId: '2',
    branchId: '2',
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-21T10:15:00Z'
  },
  {
    id: 'audit_branch_003',
    category: 'process_compliance',
    subcategory: 'branch_operations',
    title: 'Westside Branch Operations Audit',
    description: 'Comprehensive audit of Westside Branch operations and compliance',
    riskLevel: 'medium',
    status: 'requires_action',
    auditedBy: '9',
    auditedAt: '2024-01-22T14:45:00Z',
    findings: 'Westside Branch: 100 QRs allocated, 20 issued, 70% utilization. Below target performance.',
    recommendations: 'Investigate low utilization rate. Provide additional sales training and support.',
    dueDate: '2024-01-29T00:00:00Z',
    lastReviewDate: '2024-01-22T14:45:00Z',
    evidence: ['Branch performance reports', 'Utilization analysis', 'Sales team feedback'],
    score: 76,
    targetEntity: 'branch',
    targetEntityId: '3',
    branchId: '3',
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-22T14:45:00Z'
  },

  // System-Level Audit Items
  {
    id: 'audit_system_001',
    category: 'security_controls',
    subcategory: 'system_integrity',
    title: 'System Integrity and Performance',
    description: 'Overall system health, performance, and integrity assessment',
    riskLevel: 'medium',
    status: 'compliant',
    auditedBy: '9',
    auditedAt: '2024-01-22T17:00:00Z',
    findings: 'System running at 99.2% uptime. All components functioning properly. No integrity issues detected.',
    recommendations: 'System performance is excellent. Schedule regular maintenance windows.',
    dueDate: '2024-02-22T00:00:00Z',
    lastReviewDate: '2024-01-22T17:00:00Z',
    evidence: ['System monitoring logs', 'Performance metrics', 'Health check reports'],
    score: 97,
    targetEntity: 'system',
    targetEntityId: 'infrastructure',
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-22T17:00:00Z'
  },
  {
    id: 'audit_system_002',
    category: 'data_protection',
    subcategory: 'data_retention',
    title: 'Data Retention Policy Compliance',
    description: 'Verify compliance with data retention policies and regulations',
    riskLevel: 'medium',
    status: 'pending',
    dueDate: '2024-01-26T00:00:00Z',
    evidence: [],
    targetEntity: 'system',
    targetEntityId: 'data_retention',
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-15T09:00:00Z'
  }
];

// Audit Checklists for Structured Reviews
export const mockAuditChecklists: AuditChecklist[] = [
  {
    id: 'checklist_001',
    name: 'Monthly Compliance Review',
    description: 'Comprehensive monthly compliance audit checklist',
    category: 'compliance',
    items: mockAuditItems.filter(item => 
      item.category === 'process_compliance' || 
      item.category === 'kyc_verification'
    ),
    overallScore: 87.5,
    completionRate: 75,
    createdBy: '9',
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-22T17:00:00Z'
  },
  {
    id: 'checklist_002',
    name: 'Security Assessment',
    description: 'Quarterly security controls and data protection audit',
    category: 'security',
    items: mockAuditItems.filter(item => 
      item.category === 'security_controls' || 
      item.category === 'data_protection' ||
      item.category === 'user_access'
    ),
    overallScore: 95.8,
    completionRate: 83,
    createdBy: '9',
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-22T17:00:00Z'
  },
  {
    id: 'checklist_003',
    name: 'QR Management Audit',
    description: 'Specialized audit for QR code management processes',
    category: 'qr_management',
    items: mockAuditItems.filter(item => item.category === 'qr_management'),
    overallScore: 92.7,
    completionRate: 100,
    createdBy: '9',
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-22T17:00:00Z'
  }
];

// Merchant Requests - Aligned with KYC workflow
export const mockMerchantRequests: any[] = [
  // Downtown Branch - Mike Sales requests
  {
    id: 'mer_req_001',
    merchantId: 'merchant_br1_4', // Verified merchant
    requestedBy: '4', // Mike Sales
    branchId: '1',
    requestedQrCount: 2,
    businessJustification: 'Expanding payment options for high-volume retail store. Customer demand for QR payments increasing.',
    status: 'approved',
    approvedBy: '3', // Sarah Approver
    approvedAt: '2024-01-21T14:30:00Z',
    createdAt: '2024-01-21T10:15:00Z'
  },
  {
    id: 'mer_req_002',
    merchantId: 'merchant_br1_5', // Verified merchant
    requestedBy: '4', // Mike Sales
    branchId: '1',
    requestedQrCount: 1,
    businessJustification: 'New coffee shop opening, needs QR payment solution for modern customer experience.',
    status: 'pending',
    createdAt: '2024-01-22T09:45:00Z'
  },
  
  // Uptown Branch - David Sales requests
  {
    id: 'mer_req_003',
    merchantId: 'merchant_br2_4', // Verified merchant
    requestedBy: '6', // David Sales
    branchId: '2',
    requestedQrCount: 3,
    businessJustification: 'Restaurant chain expansion requiring multiple QR codes for different locations.',
    status: 'approved',
    approvedBy: '7', // Emma Approver
    approvedAt: '2024-01-20T16:20:00Z',
    createdAt: '2024-01-20T11:30:00Z'
  },
  {
    id: 'mer_req_004',
    merchantId: 'merchant_br2_5', // Verified merchant
    requestedBy: '6', // David Sales
    branchId: '2',
    requestedQrCount: 1,
    businessJustification: 'Boutique store modernizing payment systems to attract younger customers.',
    status: 'pending',
    createdAt: '2024-01-22T08:20:00Z'
  },
  
  // Westside Branch - Robert Sales requests
  {
    id: 'mer_req_005',
    merchantId: 'merchant_br3_4', // Verified merchant
    requestedBy: '8', // Robert Sales
    branchId: '3',
    requestedQrCount: 2,
    businessJustification: 'Local market vendor requiring QR payment for weekend farmers market and permanent stall.',
    status: 'rejected',
    approvedBy: '1', // System Admin
    rejectionReason: 'Insufficient transaction volume projection. Please provide 3-month sales forecast.',
    createdAt: '2024-01-19T13:45:00Z'
  },
  {
    id: 'mer_req_006',
    merchantId: 'merchant_br3_5', // Verified merchant
    requestedBy: '8', // Robert Sales
    branchId: '3',
    requestedQrCount: 1,
    businessJustification: 'Auto repair shop implementing digital payment solutions for customer convenience.',
    status: 'pending',
    createdAt: '2024-01-21T16:10:00Z'
  }
];