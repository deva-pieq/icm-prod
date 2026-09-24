import { HAPPY_FLOW_001 } from '../happy-flow/happyFlow001';
import { productRunStamp } from './products';

export const COMMISSION_TYPES = ['Commission', 'Bonus', 'Override'] as const;
export type CommissionTypeLabel = (typeof COMMISSION_TYPES)[number];

export const RULE_NAME_MAX_LENGTH = 225;
export const SPACES_ONLY_RULE_NAME = '   ';

export const DEFAULT_COMMISSION_TEMPLATE = HAPPY_FLOW_001.commissionTemplate;
export const ALTERNATE_COMMISSION_TEMPLATE = 'ACA - New Test 001 - Regular';

export const COMMISSION_RULE_PUBLISHED_MESSAGE = 'Rule published successfully';
export const COMMISSION_RULE_DRAFT_SAVED_MESSAGE = 'Draft saved successfully';

export function commissionTypeUrlSegment(type: string): string {
  return type.replace(/\s+/g, '_').toUpperCase();
}

export function validUniqueRuleName(): string {
  return `E2E-Rule-${productRunStamp()}`;
}

export function overMaxRuleName(length = RULE_NAME_MAX_LENGTH + 1): string {
  return `R${'A'.repeat(length)}`;
}
