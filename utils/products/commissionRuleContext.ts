let lastRuleName: string | null = null;
let lastCommissionTemplate: string | null = null;
let lastCommissionSplitSignature: string | null = null;

export function setLastCommissionRuleName(name: string): void {
  lastRuleName = name;
}

export function getLastCommissionRuleName(): string {
  if (!lastRuleName) {
    throw new Error('No commission rule name set in this scenario yet');
  }
  return lastRuleName;
}

export function setLastCommissionTemplate(template: string): void {
  lastCommissionTemplate = template;
}

export function getLastCommissionTemplate(): string {
  if (!lastCommissionTemplate) {
    throw new Error('No commission template selected in this scenario yet');
  }
  return lastCommissionTemplate;
}

export function setLastCommissionSplitSignature(signature: string): void {
  lastCommissionSplitSignature = signature;
}

export function getLastCommissionSplitSignature(): string {
  if (!lastCommissionSplitSignature) {
    throw new Error('No commission split signature stored in this scenario yet');
  }
  return lastCommissionSplitSignature;
}

export function clearCommissionRuleContext(): void {
  lastRuleName = null;
  lastCommissionTemplate = null;
  lastCommissionSplitSignature = null;
}
