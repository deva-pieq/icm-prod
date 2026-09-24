/**
 * Multi-role (Agency / Sales Leader / Agent) line items for
 * @validate-commission-report-all. Kept separate from Agent-only context
 * so @validate-commission-report is unaffected.
 */

export type CommissionHierarchyRole = 'Agency' | 'Sales Leader' | 'Agent';

export const COMMISSION_HIERARCHY_ROLES: CommissionHierarchyRole[] = [
  'Agency',
  'Sales Leader',
  'Agent',
];

export type CommissionReportAllLineItem = {
  lineItem: number;
  policyNumber: string;
  productName: string;
  grossCommission: number;
  totalMembers: number;
  issueDate: string;
  paidToDate: string;
  monthDiff: number;
  commissionAmount: number;
  role: CommissionHierarchyRole;
  roleName: string;
  splitPercentage: number;
  value: number;
  valueTimesMembers: number;
  commissionFromReport: number | null;
  result: 'TRUE' | 'FALSE' | '';
  skipped: boolean;
  skipReason?: string;
};

let lineItems: CommissionReportAllLineItem[] = [];

export function addCommissionReportAllLineItem(item: CommissionReportAllLineItem): void {
  lineItems.push(item);
}

export function getCommissionReportAllLineItems(): CommissionReportAllLineItem[] {
  return [...lineItems];
}

export function getActiveCommissionReportAllLineItems(): CommissionReportAllLineItem[] {
  return lineItems.filter((item) => !item.skipped);
}

export function clearCommissionReportAllLineItems(): void {
  lineItems = [];
}
