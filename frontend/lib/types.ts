/**
 * MACRO PMS API contract types — mirrors backend-slice/prisma/schema.prisma.
 */

export type UserRole =
  | 'PROJECT_OFFICER' | 'HEAD_OF_PROGRAMS' | 'GRANT_FINANCE_OFFICER'
  | 'FINANCE_MANAGER' | 'EXECUTIVE_DIRECTOR' | 'PROCUREMENT_OFFICER'
  | 'ADMINISTRATOR' | 'VENDOR';

export type ArStage =
  | 'DRAFT' | 'PO_SUBMITTED' | 'HOP_RECOMMENDED' | 'FM_APPROVED' | 'ED_APPROVED'
  | 'DISBURSED' | 'LIQUIDATION_PENDING' | 'LIQUIDATED' | 'RETURNED' | 'REJECTED';

export type PvStage =
  | 'DRAFT' | 'PO_SUBMITTED' | 'GFO_REVIEWED' | 'FM_APPROVED' | 'ED_APPROVED'
  | 'SCHEDULED' | 'PAID' | 'RETURNED' | 'REJECTED';

export type PrStage =
  | 'DRAFT' | 'PR_SUBMITTED' | 'RFQ_OPEN' | 'RFQ_EVALUATED'
  | 'LPO_ISSUED' | 'GRN_RECEIVED' | 'CLOSED' | 'CANCELLED';

export type ApStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED' | 'REOPENED';
export type ApPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ActStage = 'CONCEPT' | 'SOW' | 'ADVANCE' | 'EXECUTE' | 'LIQUIDATE' | 'CLOSED';
export type WatchLevel = 'GREEN' | 'AMBER' | 'RED';
export type EntityKind = 'AR' | 'PV' | 'PR' | 'AP' | 'ACT' | 'VENDOR' | 'BR' | 'EFT';

export interface User {
  id: string; fullName: string; role: UserRole;
  email: string; region: string | null; initials: string; projects: string[];
}

export interface AuthResponse { accessToken: string; refreshToken: string; user: User; }

export interface AdvanceRequest {
  id: string; activityId: string; projId: string; dipCode: string; title: string;
  amount: string; requestedById: string; stage: ArStage; nextApproverRole: UserRole | null;
  submittedAt: string | null; disbursedOn: string | null; dueLiqDate: string | null;
  spentAmount: string | null; varianceNote: string | null; returnReason: string | null;
  eftRef: string | null; createdAt: string; updatedAt: string;
}

export interface PaymentVoucher {
  id: string; projId: string; dipCode: string; arId: string | null; vendorId: string | null;
  title: string; grossAmount: string; whtAmount: string; netAmount: string;
  itemsJson: Array<{ description: string; qty: number; unitPrice: number | string }>;
  attachmentsJson: string[];
  stage: PvStage; nextApproverRole: UserRole | null;
  raisedById: string; paidOn: string | null; eftRef: string | null;
  returnReason: string | null; threeWayMatchOk: boolean;
  createdAt: string; updatedAt: string;
}

export interface PurchaseRequisition {
  id: string; projId: string; dipCode: string; title: string;
  estimatedAmount: string; vendorId: string | null;
  rfqDeadline: string | null; lpoRef: string | null; grnRef: string | null;
  grnReceivedOn: string | null; stage: PrStage; raisedById: string;
  createdAt: string; updatedAt: string;
}

export interface Vendor {
  id: string; name: string; tin: string | null; bankName: string | null; bankAccount: string | null;
  wtecValid: boolean; wtecExpiry: string | null;
  ceiling: string | null; spent: string; active: boolean;
}

export interface ActionPoint {
  id: string; title: string; description: string | null;
  ownerId: string; raisedById: string;
  priority: ApPriority; status: ApStatus;
  dueDate: string | null; closedAt: string | null; closedNote: string | null;
  linkedEntity: EntityKind | null; linkedEntityId: string | null;
  projId: string | null; createdAt: string; updatedAt: string;
}

export interface Activity {
  id: string; projId: string; dipCode: string; title: string; officerId: string;
  stage: ActStage; budgetAmount: string; advanceAmount: string; spentAmount: string;
  startDate: string; dueLiqDate: string;
}

export interface DipLine {
  code: string; projId: string; label: string;
  budgetAmount: string; committed: string; spent: string; watchLevel: WatchLevel;
}

export interface ApiError { error: string; message: string; details?: Record<string, unknown>; }
