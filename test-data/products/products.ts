import { happyFlowRunDateStamp } from '../happy-flow/happyFlow001';

export type ProductFormData = {
  carrierName: string;
  lineOfBusiness: string;
  productType: string;
  productName: string;
  productCode: string;
  status: string;
  carrierProductName?: string;
  description?: string;
  effectiveDate?: string;
  expiryDate?: string;
};

export const DEFAULT_CARRIER = 'Aetna';
export const DEFAULT_LOB = 'Health';
export const ALTERNATE_LOB = 'life';
export const DEFAULT_PRODUCT_TYPE = 'ACA';
export const DEFAULT_STATUS = 'Active';
export const INACTIVE_STATUS = 'Inactive';
export const DEFAULT_EFFECTIVE_DATE = '01/01/2021';
export const DEFAULT_EXPIRY_DATE = '01/01/2026';

export const SPACES_ONLY_NAME = '   ';
export const SPECIAL_CHARS_NAME = 'E2E-Test@#$%Product!';
export const PRODUCT_NAME_MAX_LENGTH = 255-13;
export const PRODUCT_DESCRIPTION_MAX_LENGTH = 255-13;

export const DUPLICATE_ALIAS_MESSAGE = 'This carrier product name has already been added.';

export function productRunStamp(d = new Date()): string {
  return happyFlowRunDateStamp(d);
}

export function buildValidProduct(overrides?: Partial<ProductFormData>, d = new Date()): ProductFormData {
  const stamp = productRunStamp(d);
  return {
    carrierName: DEFAULT_CARRIER,
    lineOfBusiness: DEFAULT_LOB,
    productType: DEFAULT_PRODUCT_TYPE,
    productName: `E2E-Product-${stamp}`,
    productCode: `E2E-CODE-${stamp}`,
    status: DEFAULT_STATUS,
    effectiveDate: DEFAULT_EFFECTIVE_DATE,
    ...overrides,
  };
}

export function atMaxProductName(length = PRODUCT_NAME_MAX_LENGTH): string {
  return 'A'.repeat(length)+Date.now().toString();
}

export function overMaxProductName(length = PRODUCT_NAME_MAX_LENGTH + 1): string {
  return 'A'.repeat(length)+Date.now().toString();
}

export function overMaxProductCode(length = PRODUCT_NAME_MAX_LENGTH + 1): string {
  return 'C'.repeat(length)+Date.now().toString();
}

export function overMaxCarrierProductName(length = PRODUCT_NAME_MAX_LENGTH + 1): string {
  return 'X'.repeat(length)+Date.now().toString();
}

export function overMaxDescription(length = PRODUCT_DESCRIPTION_MAX_LENGTH + 1): string {
  return 'D'.repeat(length)+Date.now().toString();
}

export type MandatoryFieldKey =
  | 'carrier'
  | 'line of business'
  | 'product type'
  | 'product name'
  | 'product code';

export const MANDATORY_FIELD_KEYS: MandatoryFieldKey[] = [
  'carrier',
  'line of business',
  'product type',
  'product name',
  'product code',
];
