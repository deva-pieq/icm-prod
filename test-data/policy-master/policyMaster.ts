export const POLICY_STATUS_OPTIONS = ['Active', 'Lapsed', 'Cancelled', 'Expired'] as const;
export const POLICY_STATUS_FILTER_OPTIONS = ['All Status', 'Active', 'Lapsed', 'Cancelled', 'Expired'] as const;
export const ENROLLMENT_TYPE_OPTIONS = [
  'Not Applicable',
  'New to Medicare',
  'Not New to Medicare',
  'New to Advantage with Drug Plan',
] as const;
export const MEMBER_TYPE_OPTIONS = ['Individual', 'Group', 'Worksite'] as const;
export const LIST_COLUMNS = [
  'Policy Information',
  'Member',
  'Agent',
  'Carrier & Product',
  'Status',
  'Actions',
] as const;

export const NO_RECORDS_TEXT = 'No Records Found';
export const SEARCH_PLACEHOLDER = 'Search policies by number, member, agent or carrier...';
export const SEARCH_HELPER = 'Use this search box to filter the data grid. Results will update as you type.';

export function uniquePolicyNo(): string {
  const ts = Date.now().toString(36).toUpperCase().slice(-6);
  return `E2E${ts}`;
}
