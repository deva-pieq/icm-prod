export type CarrierFormData = {
  carrierName: string;
  carrierCode: string;
  carrierType: string;
  status: string;
  appointmentDate: string;
  lastReviewDate: string;
  notes?: string;
  email?: string;
  phone?: string;
};

/**
 * Core Carrier Type dropdown categories (harvested live 2026-09: ACA, HEALTH,
 * OVR, SENIOR PRODUCT; rendered uppercase; CSV Dental is not present).
 * The dropdown is EXTENSIBLE — the app may add new types. Assert presence of
 * these known types (case-insensitive) + count > 2, never an exact list match.
 */
export const CARRIER_TYPE_OPTIONS = ['ACA', 'HEALTH', 'OVR', 'SENIOR PRODUCT'] as const;

/** Live Status dropdown + list filter (harvested). CSV Terminated is not present. */
export const CARRIER_STATUS_OPTIONS = ['Active', 'Inactive'] as const;

export const LIST_STATUS_FILTER_OPTIONS = ['All Status', 'Active', 'Inactive'] as const;

export const DEFAULT_CARRIER_TYPE = 'Health';
export const DEFAULT_STATUS = 'Active';
export const DEFAULT_APPOINTMENT_DATE = '01/01/2024';
export const DEFAULT_LAST_REVIEW_DATE = '06/01/2024';

export const LIST_COLUMNS = [
  'Carrier',
  'Code',
  'Type',
  'Line of Business',
  'Product Types',
  'Status',
  'Appointment Date',
  'Last Review',
  'Actions',
] as const;

export const CSV_LIST_COLUMNS = [
  'Carrier',
  'Code',
  'Type',
  'Status',
  'Appointment Date',
  'Last Review',
] as const;

export const EMAIL_ERROR = 'Please enter a valid email address (e.g., user@example.com)';
export const DUPLICATE_CODE_ERROR = 'This carrier code is already in use. Please choose a different code.';
export const NAME_LETTERS_SPACES_ERROR = 'Carrier name can only contain letters and spaces';
export const NAME_MAX_LENGTH_ERROR = 'Carrier name should be 50 characters or less';
export const INVALID_APPOINTMENT_DATE_ERROR = 'Invalid appointment date';
export const INVALID_LAST_REVIEW_DATE_ERROR = 'Invalid last review date';
export const REVIEW_AFTER_APPOINTMENT_ERROR = 'Last review date must be greater than appointment date';
export const NOTES_OVER_MAX_ERROR = 'Notes has exceeded more than 255 characters';
export const NO_RECORDS_TEXT = 'No Records Found';
export const CONFIRM_CREATE_HEADING = 'Create Carrier';
export const CONFIRM_UPDATE_HEADING = 'Save Changes';

export const NOTES_MAX_LENGTH = 250;
export const NAME_MAX_LENGTH = 50;
export const NAME_OVER_MAX_LENGTH = 80;
export const NOTES_OVER_MAX_LENGTH = 260;
export const SORT_SAMPLE_ROWS = 5;
export const INVALID_SEARCH = 'zzz-no-carrier-xyz';

/** Letter stamp so names stay unique without relying on digits. */
export function uniqueLetterStamp(d = new Date()): string {
  return d.getTime().toString().replace(/\d/g, (ch) => 'abcdefghij'[Number(ch)]);
}

/** Invalid name used to trigger carrier-name-error (letters and spaces only). */
export function uniqueSpecialCharName(d = new Date()): string {
  return `Auto & Co-${uniqueLetterStamp(d).slice(-8)}`;
}

export function buildValidCarrier(overrides?: Partial<CarrierFormData>, d = new Date()): CarrierFormData {
  const stamp = uniqueLetterStamp(d);
  const ms = d.getTime().toString().slice(-8);
  return {
    carrierName: `Auto Carrier ${stamp.slice(-8)}`,
    carrierCode: `E2E${ms}`,
    carrierType: DEFAULT_CARRIER_TYPE,
    status: DEFAULT_STATUS,
    appointmentDate: DEFAULT_APPOINTMENT_DATE,
    lastReviewDate: DEFAULT_LAST_REVIEW_DATE,
    ...overrides,
  };
}

export function notesWithinMax(length = NOTES_MAX_LENGTH): string {
  return 'Notes '.repeat(Math.ceil(length / 6)).slice(0, length);
}

export function notesOverMax(length = 260): string {
  return 'N'.repeat(length);
}

export function maxLetterName(length = NAME_MAX_LENGTH): string {
  const stamp = uniqueLetterStamp().slice(-8);
  const prefix = `Auto ${stamp}`;
  if (prefix.length >= length) return prefix.slice(0, length);
  return `${prefix}${'A'.repeat(length - prefix.length)}`;
}
