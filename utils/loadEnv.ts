import * as fs from 'node:fs';
import * as path from 'node:path';

function isTruthyEnv(value: string | undefined): boolean {
  return /^(1|true|yes)$/i.test((value ?? '').trim());
}

/**
 * In CI: turn off local-dev noise (screenshots + debug step logs).
 * Slack is intentionally left alone — still posts when SLACK_BOT_TOKEN + SLACK_CHANNEL_ID are set.
 *
 * Triggers: GitHub's CI/GITHUB_ACTIONS, or explicit E2E_CI_MODE=1.
 */
export function applyCiEnvOverrides(): void {
  const isCi =
    isTruthyEnv(process.env.CI) ||
    isTruthyEnv(process.env.GITHUB_ACTIONS) ||
    isTruthyEnv(process.env.E2E_CI_MODE);
  if (!isCi) return;

  process.env.TAKE_SCREENSHOTS = 'false';
  process.env.DEBUG_STEPS = 'false';
}

/** Load projects/icm/.env into process.env (Playwright + bddgen). */
export function loadProjectEnv(cwd = process.cwd()): void {
  const envPath = path.join(cwd, '.env');
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }

  applyCiEnvOverrides();
}

export function smokeCredentials(): { email: string; password: string } | null {
  const email = (
    process.env.E2E_EMAIL ??
    process.env.LOGIN_VALID_EMAIL ??
    ''
  ).trim();
  const password = smokePassword();
  if (!email || !password) return null;
  return { email, password };
}

export function smokePassword(): string {
  return process.env.E2E_PASSWORD ?? process.env.LOGIN_VALID_PASSWORD ?? '';
}

/**
 * Canonical Ops Manager email for the whole repo (user-owned, env-driven).
 * Reads E2E_EMAIL (fallback LOGIN_VALID_EMAIL). No hardcoded identity.
 */
export function opsManagerEmail(): string {
  return (process.env.E2E_EMAIL ?? process.env.LOGIN_VALID_EMAIL ?? '').trim();
}

/**
 * Ops Manager credentials for Agency 1 (advance/agent-master modules).
 * Email comes from E2E_EMAIL_ADVANCE, falling back to the repo-wide ops manager
 * (opsManagerEmail()). Password from E2E_PASSWORD (same as other modules).
 *
 * Covers: advance-regression, advance-only, advance-recovery, advance-adjustment,
 * commission-only, policy-cancellation-agency-advance, policy-cancellation-carrier-advance,
 * agent-master.
 */
export function advanceE2ECredentials(): { email: string; password: string } {
  const password = smokePassword();
  if (!password) {
    throw new Error('Add E2E_PASSWORD to projects/icm/.env — see .env.example');
  }
  const email = (process.env.E2E_EMAIL_ADVANCE ?? opsManagerEmail()).trim();
  if (!email) {
    throw new Error(
      'Add E2E_EMAIL (or E2E_EMAIL_ADVANCE) + E2E_PASSWORD to .env — see .env.example',
    );
  }
  return { email, password };
}

/**
 * Ops Manager credentials for Agency 3 (MLB New).
 * Email comes from E2E_EMAIL_AGENCY3, falling back to the repo-wide ops manager
 * (opsManagerEmail()). Password from E2E_PASSWORD (same as other modules).
 *
 * Used by: payment-module, smoke statement processing (@smoke-statement-processing / T092–T096).
 */
export function agency3OpsCredentials(): { email: string; password: string } {
  const password = smokePassword();
  if (!password) {
    throw new Error('Add E2E_PASSWORD to projects/icm/.env — see .env.example');
  }
  const email = (process.env.E2E_EMAIL_AGENCY3 ?? opsManagerEmail()).trim();
  if (!email) {
    throw new Error(
      'Add E2E_EMAIL (or E2E_EMAIL_AGENCY3) + E2E_PASSWORD to .env — see .env.example',
    );
  }
  return { email, password };
}

/** Alias for Agency 3 Ops Manager — payment-module BeforeAll / Background. */
export function paymentModuleCredentials(): { email: string; password: string } {
  return agency3OpsCredentials();
}

/** Credentials for role-based smoke (@smoke-role). */
export function smokeCredentialsForRole(
  envEmailKey: 'E2E_EMAIL' | 'E2E_EMAIL_AGENT' | 'E2E_EMAIL_OWNER' | 'E2E_EMAIL_SALES_LEADER',
): { email: string; password: string } | null {
  const email = (process.env[envEmailKey] ?? '').trim();
  const password = smokePassword();
  if (!email || !password) return null;
  return { email, password };
}

/**
 * Sales Leader credentials for @sales-leader-dashboard regression.
 * Email from E2E_EMAIL_SALES_LEADER; password from E2E_PASSWORD.
 */
export function salesLeaderCredentials(): { email: string; password: string } {
  const creds = smokeCredentialsForRole('E2E_EMAIL_SALES_LEADER');
  if (!creds) {
    throw new Error(
      'Add E2E_EMAIL_SALES_LEADER and E2E_PASSWORD to projects/icm/.env — see .env.example',
    );
  }
  return creds;
}
