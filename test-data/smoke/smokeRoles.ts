export type SmokeRoleKey = 'operations manager' | 'agent' | 'agency owner';

export type SmokeRoleSpec = {
  key: SmokeRoleKey;
  /** Label shown under the profile dropdown (second line). */
  profileLabel: string;
  envEmailKey: 'E2E_EMAIL' | 'E2E_EMAIL_AGENT' | 'E2E_EMAIL_OWNER';
};

export const SMOKE_ROLES: Record<SmokeRoleKey, SmokeRoleSpec> = {
  'operations manager': {
    key: 'operations manager',
    profileLabel: 'Operations Manager',
    envEmailKey: 'E2E_EMAIL',
  },
  agent: {
    key: 'agent',
    profileLabel: 'Agent',
    envEmailKey: 'E2E_EMAIL_AGENT',
  },
  'agency owner': {
    key: 'agency owner',
    profileLabel: 'Agency Owner',
    envEmailKey: 'E2E_EMAIL_OWNER',
  },
};

export function normalizeSmokeRoleKey(raw: string): SmokeRoleKey | null {
  const key = raw.trim().toLowerCase();
  if (key === 'operations manager' || key === 'operation manager' || key === 'ops manager') {
    return 'operations manager';
  }
  if (key === 'agent') return 'agent';
  if (key === 'agency owner' || key === 'owner') return 'agency owner';
  return null;
}
