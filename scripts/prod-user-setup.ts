import 'dotenv/config';
import { chromium, type Page } from '@playwright/test';
import imapSimple from 'imap-simple';
import { simpleParser } from 'mailparser';
import { JSDOM } from 'jsdom';

import { LoginPage } from '../pages/auth/LoginPage';
import { ProfilePage } from '../pages/auth/ProfilePage';
import { AppPaths } from '../pages/appPaths';
import { UserManagementPage } from '../pages/user-management/UserManagementPage';
import { AgentsPage } from '../pages/agents/AgentsPage';
import { AgentFormPage } from '../pages/agents/AgentFormPage';
import { AgentEditTabsPage } from '../pages/agents/AgentEditTabsPage';
import { agency3OpsCredentials } from '../utils/loadEnv';

const ACTIVATE_ONLY = process.argv.includes('--activate-only');

const onlyIdx = process.argv.indexOf('--only');
const ONLY_EMAILS = onlyIdx >= 0 ? new Set(process.argv.slice(onlyIdx + 1).filter((a) => !a.startsWith('--'))) : undefined;

const linkIdx = process.argv.indexOf('--link');
const EXPLICIT_LINKS = new Map<string, string>();
if (linkIdx >= 0) {
  const args = process.argv.slice(linkIdx + 1).filter((a) => !a.startsWith('--'));
  for (let i = 0; i + 1 < args.length; i += 2) {
    EXPLICIT_LINKS.set(args[i], args[i + 1]);
  }
}

const PASSWORD = 'Test@123';
const RM_START_DATE = '09/22/2026';

const OPS_EMAIL = 'deva.r+prod+ops@pieq.ai';
const AGOWN_EMAIL = 'deva.r+prod+agown@pieq.ai';
const SL_EMAIL = 'deva.r+prod+sl@pieq.ai';
const AGENT_EMAIL = 'deva.r+prod+agent@pieq.ai';

const TARGET_AGENT_IDS = [
  '600011',
  '600003',
  '600001',
  '600002',
  '600012',
  '90076',
  '0987654321',
  '120876543',
  '600004',
];

const IMAP_CONFIG = {
  imap: {
    user: process.env.GMAIL_USER!,
    password: process.env.GMAIL_APP_PASSWORD!,
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
    authTimeout: 10000,
  },
};

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function preferEmailHref(url: string): string {
  return decodeHtmlEntities(url.trim());
}

function extractActivationLink(htmlOrText: string): string | null {
  if (!htmlOrText) return null;
  const dom = new JSDOM(htmlOrText);
  const anchors = [
    ...dom.window.document.querySelectorAll(
      'a[href*="action-token"], a[href*="awstrack"], a[href*="login-actions"]',
    ),
  ];
  for (const anchor of anchors) {
    const href = anchor.getAttribute('href');
    if (!href) continue;
    const decoded = preferEmailHref(href);
    if (
      decoded.includes('action-token') ||
      decoded.includes('awstrack') ||
      decoded.includes('login-actions')
    ) {
      return decoded;
    }
  }
  const flattened = htmlOrText
    .replace(/=\r?\n/g, '')
    .replace(/=3D/gi, '=')
    .replace(/\s+/g, ' ');
  const tracking =
    flattened.match(
      /https:\/\/[a-z0-9]+\.r\.[a-z0-9.-]+\.awstrack\.me\/L0\/https[^"'\s>]+/i,
    )?.[0] ?? null;
  if (tracking) return preferEmailHref(tracking);
  const direct = flattened.match(
    /https:\/\/[^\s"'<>]*\/login-actions\/action-token\?key=[^\s"'<>]+/i,
  )?.[0] ?? null;
  if (direct) return preferEmailHref(direct);
  return null;
}

/** Wait for ANY email to a plus-address containing an activation link (recipient filtered in-process). */
async function waitForActivationEmailTo(email: string, maxWaitMs = 300000): Promise<string> {
  const connection = await imapSimple.connect(IMAP_CONFIG);
  await connection.openBox('INBOX');
  const startTime = Date.now();
  const emailLc = email.toLowerCase();
  try {
    while (Date.now() - startTime < maxWaitMs) {
      // Search only messages since yesterday to bound the scan.
      const since = new Date(Date.now() - 48 * 3600 * 1000);
      const messages = await connection.search(
        ['ALL', ['SINCE', since.toISOString().slice(0, 10)]],
        { bodies: [''], markSeen: false },
      );
      for (const msg of [...messages].reverse()) {
        const full = msg.parts.find((p) => p.which === '');
        if (!full?.body) continue;
        const parsed = await simpleParser(full.body);
        const to = parsed.to;
        const toHeader = (
          Array.isArray(to) ? to.map((a) => a.text).join(', ') : (to?.text ?? '')
        ).toLowerCase();
        if (!toHeader.includes(emailLc)) continue;
        const link =
          extractActivationLink(parsed.html || '') ||
          extractActivationLink(parsed.text || '');
        if (link) {
          console.log(`🔗 Link for ${email} (len=${link.length}) head=${link.slice(0, 100)}`);
          return link;
        }
      }
      await new Promise((r) => setTimeout(r, 5000));
    }
  } finally {
    await connection.end();
  }
  throw new Error(`Activation email not received for ${email} within ${maxWaitMs}ms`);
}

function buildAgentIdentity(prefix: string, name: string): {
  agentId: string;
  npn: string;
  firstName: string;
  lastName: string;
  displayName: string;
} {
  const base = `${prefix}${Date.now().toString().slice(-6)}${String(Math.floor(Math.random() * 90 + 10))}`;
  const uniqueId = base.slice(0, 10);
  return {
    agentId: uniqueId,
    npn: uniqueId,
    firstName: name,
    lastName: name,
    displayName: `${name} ${name}`,
  };
}

async function createUserManagementUser(
  page: Page,
  userMgmt: UserManagementPage,
  user: { email: string; firstName: string; lastName: string; role: string },
) {
  await userMgmt.gotoDashboard();
  await userMgmt.clickAddUser();
  await userMgmt.fillNewUserForm(user);
  await userMgmt.saveNewUser();
  console.log(`✅ User Management user created: ${user.email} (${user.role})`);
}

async function createAgentUser(
  page: Page,
  agentsPage: AgentsPage,
  agentFormPage: AgentFormPage,
  identity: ReturnType<typeof buildAgentIdentity>,
  email: string,
) {
  await agentsPage.openList();
  await agentsPage.openAdd();
  await agentFormPage.fillAllRequiredFields({
    agentId: identity.agentId,
    firstName: identity.firstName,
    lastName: identity.lastName,
    email,
    npn: identity.npn,
  });
  await agentFormPage.fillValidBankDetails();
  await agentFormPage.clickSave();
  await agentFormPage.clickConfirmSave({ captureToast: true });
  console.log(`✅ Agent-master user created: ${email} (${identity.displayName})`);
}

async function setReportingManagerOnAgent(
  page: Page,
  agentId: string,
  slDisplayName: string,
): Promise<string> {
  const agentsPage = new AgentsPage(page);
  const editTabs = new AgentEditTabsPage(page);

  await agentsPage.openList();
  await agentsPage.searchGrid(agentId);
  await agentsPage.openEditByMatchingRow(agentId);

  await editTabs.openLevelHierarchyTab();
  await editTabs.clickAddReportingManager();
  await editTabs.searchReportingManager(slDisplayName);

  const optionSpan = editTabs.loc.addManagerDropdownOptionSpans().filter({
    hasText: slDisplayName,
  });
  const count = await optionSpan.count();
  if (count === 0) {
    throw new Error(`Reporting manager "${slDisplayName}" not found in dropdown for agent ${agentId}`);
  }
  await optionSpan.first().click();
  await editTabs.setReportingStartDate(RM_START_DATE);
  await editTabs.saveReportingManager();
  await editTabs.expectReportingManagerInTable(slDisplayName);
  console.log(`✅ Reporting manager → ${slDisplayName} set on agent ${agentId}`);
  return agentId;
}

async function dumpPageState(page: Page, label: string) {
  const url = page.url();
  const title = await page.title().catch(() => '');
  const bodyText = await page.evaluate(() => document.body?.innerText?.slice(0, 1500) ?? '').catch(() => '');
  const html = await page.content().catch(() => '');
  await page.screenshot({ path: `scripts/diag-${label}.png` }).catch(() => undefined);
  console.log(`\n[DIAG:${label}] url=${url}`);
  console.log(`[DIAG:${label}] title=${title}`);
  console.log(`[DIAG:${label}] bodyText=${JSON.stringify(bodyText)}`);
  console.log(`[DIAG:${label}] htmlLen=${html.length}`);
  try {
    const fs = await import('node:fs');
    fs.writeFileSync(`scripts/diag-${label}.html`, html.slice(0, 20000));
  } catch { /* ignore */ }
}

/** Flexible activation: tolerate landings on proceed-interstitial OR direct password form. */
async function activateAccount(
  page: Page,
  activationUrl: string,
  email: string,
  password: string,
): Promise<void> {
  const label = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '-');

  console.log(`🌐 Opening activation link (${email})...`);
  await page.goto(activationUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

  const proceed = page.locator('a', { hasText: /Click here to proceed/i });
  const proceedVisible = proceed.isVisible({ timeout: 65000 }).catch(() => false);

  const pwNew = page.locator('#password-new');
  const pwNewVisible = pwNew.isVisible({ timeout: 65000 }).catch(() => false);

  const which = await Promise.race([
    proceedVisible.then((v) => (v ? 'proceed' : null)),
    pwNewVisible.then((v) => (v ? 'password' : null)),
    new Promise<null>((r) => setTimeout(() => r(null), 70000)),
  ]);

  if (which === 'proceed') {
    console.log('🔘 Clicking "» Click here to proceed"...');
    await proceed.click();
    await page.waitForLoadState('domcontentloaded');
    await pwNew.waitFor({ state: 'visible', timeout: 60000 });
  } else if (which !== 'password') {
    const actionUri = await page
      .evaluate(() => (window as unknown as { kcContext?: { actionUri?: string } }).kcContext?.actionUri ?? '')
      .catch(() => '');
    if (actionUri) {
      console.log('🔗 SPA not mounted — navigating via server-rendered kcContext.actionUri...');
      await page.goto(actionUri, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await pwNew.waitFor({ state: 'visible', timeout: 60000 });
    } else {
      await dumpPageState(page, label);
      throw new Error(`Unknown activation landing for ${email}`);
    }
  }

  console.log('🔐 Setting password...');
  await pwNew.fill(password);
  await page.locator('#password-confirm').fill(password);
  await page.locator('button[type="submit"], input[type="submit"]').first().click();
  await page.waitForLoadState('domcontentloaded');

  console.log('↩️ Clicking "« Back to Application"...');
  const back = page.locator('a', { hasText: /Back to Application/i });
  const backVisible = back.isVisible({ timeout: 65000 }).catch(() => false);
  if (await backVisible) {
    await back.click();
    await page.waitForLoadState('domcontentloaded');
  } else {
    await dumpPageState(page, label);
    throw new Error(`No "Back to Application" after password set for ${email}`);
  }

  console.log('🔑 Logging in with new credentials...');
  const loginPage = new LoginPage(page);
  await page.goto(AppPaths.login, { waitUntil: 'domcontentloaded' });
  const emailInput = page
    .getByRole('textbox', { name: /email address/i })
    .or(page.locator('#username, #email, input[name="username"]'))
    .or(page.getByRole('textbox', { name: /username|email/i }))
    .first();
  await emailInput.waitFor({ state: 'visible', timeout: 60000 });
  await emailInput.fill(email);
  await page.getByRole('button', { name: 'Continue' }).click();

  const passwordInput = page
    .getByLabel(/^password$/i)
    .or(page.locator('#password'))
    .or(page.locator('input[type="password"]'))
    .first();
  await passwordInput.waitFor({ state: 'visible', timeout: 60000 });
  await passwordInput.fill(password);
  await page.getByRole('button', { name: /sign in|log in/i }).first().click();
  await page.waitForLoadState('domcontentloaded');

  const skip = page.locator('[data-testid="profile-skip"]');
  if (await skip.isVisible({ timeout: 10000 }).catch(() => false)) {
    await skip.click();
    await page.waitForLoadState('domcontentloaded');
  }

  await loginPage.waitForSidebarNavigation(60000);
  console.log(`✅ Activated ${email}`);
}

/** Ensure the browser session is signed out (Keycloak refuses activation links otherwise). */
async function forceSignOut(page: Page) {
  await page.goto(AppPaths.login, { waitUntil: 'domcontentloaded' }).catch(() => undefined);
  await page.waitForTimeout(1500);
  const loginPage = new LoginPage(page);
  if (await loginPage.isLoggedIn().catch(() => false)) {
    await new ProfilePage(page).signOut();
  }
}

async function main() {
  const opsCreds = agency3OpsCredentials();
  console.log(`🚀 Bootstrap ops session: ${opsCreds.email}`);

  let slIdentity: ReturnType<typeof buildAgentIdentity>;
  let agentIdentity: ReturnType<typeof buildAgentIdentity>;

  const browser = await chromium.launch({ headless: false, channel: 'chrome' });
  const baseUrl = (process.env.BASE_URL ?? '').trim();
  const context = await browser.newContext({ baseURL: baseUrl || undefined });
  const page = await context.newPage();

  try {
    // ── Bootstrap login as ops (saadiya) ─────────────────────────────────────
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginWithEmailPasswordToApp(opsCreds.email, opsCreds.password);

    // ── 1. Create ops + agency owner via User Management ────────────────────
    if (!ACTIVATE_ONLY) {
      const userMgmt = new UserManagementPage(page);
      await createUserManagementUser(page, userMgmt, {
        email: OPS_EMAIL,
        firstName: 'Prod',
        lastName: 'Ops',
        role: 'Operations Manager',
      });
      await createUserManagementUser(page, userMgmt, {
        email: AGOWN_EMAIL,
        firstName: 'Prod',
        lastName: 'Owner',
        role: 'Agency Owner',
      });

      // ── 2. Create sales leader + regular agent via agent-master ──────────────
      const agentsPage = new AgentsPage(page);
      const agentFormPage = new AgentFormPage(page);
      slIdentity = buildAgentIdentity('8', 'ProdSL');
      agentIdentity = buildAgentIdentity('7', 'ProdAgent');

      await createAgentUser(page, agentsPage, agentFormPage, slIdentity, SL_EMAIL);
      await createAgentUser(page, agentsPage, agentFormPage, agentIdentity, AGENT_EMAIL);
      console.log(`SL agent id=${slIdentity.agentId} name=${slIdentity.displayName}`);
      console.log(`Agent user id=${agentIdentity.agentId} name=${agentIdentity.displayName}`);
    } else {
      slIdentity = buildAgentIdentity('8', 'ProdSL');
      agentIdentity = buildAgentIdentity('7', 'ProdAgent');
      console.log('⏭️ activate-only mode — skipping user/agent creation');
    }

    // ── 3. Collect + activate all four accounts ──────────────────────────────
    const toActivate = [
      { email: SL_EMAIL },
      { email: AGENT_EMAIL },
      { email: OPS_EMAIL },
      { email: AGOWN_EMAIL },
    ].filter((acc) => (ONLY_EMAILS ? ONLY_EMAILS.has(acc.email) : true));
    for (const acc of toActivate) {
      await forceSignOut(page);
      const explicit = EXPLICIT_LINKS.get(acc.email);
      if (explicit) {
        console.log(`🔗 Using explicit activation link for ${acc.email}...`);
        await activateAccount(page, explicit, acc.email, PASSWORD);
        continue;
      }
      console.log(`📧 Waiting activation email for ${acc.email}...`);
      const link = await waitForActivationEmailTo(acc.email);
      await activateAccount(page, link, acc.email, PASSWORD);
    }
    console.log(`🚪 Signing out after final activation...`);
    await forceSignOut(page);

    // ── 4. Restore ops session for RM wiring ─────────────────────────────────
    await loginPage.goto();
    await loginPage.loginWithEmailPasswordToApp(opsCreds.email, opsCreds.password);

    // ── 5. Wire deva.r+prod+sl as reporting manager on all target agents ─────
    const results: { id: string; status: string; msg?: string }[] = [];
    for (const targetId of TARGET_AGENT_IDS) {
      try {
        await setReportingManagerOnAgent(page, targetId, slIdentity.displayName);
        results.push({ id: targetId, status: 'ok' });
      } catch (err) {
        const msg = (err as Error).message;
        const missing = /No Agent column cell matching/i.test(msg) || /timed out/i.test(msg);
        results.push({ id: targetId, status: missing ? 'missing' : 'failed', msg });
        console.warn(`⚠️ Agent ${targetId}: ${msg}`);
      }
    }

    // Also wire the new agent user account itself.
    try {
      await setReportingManagerOnAgent(page, agentIdentity.agentId, slIdentity.displayName);
      results.push({ id: agentIdentity.agentId, status: 'ok' });
    } catch (err) {
      results.push({ id: agentIdentity.agentId, status: 'failed', msg: (err as Error).message });
    }

    console.log('\n══════════ SUMMARY ══════════');
    console.log(`Ops:     ${OPS_EMAIL} (Operations Manager) → password ${PASSWORD}`);
    console.log(`Agency:  ${AGOWN_EMAIL} (Agency Owner) → password ${PASSWORD}`);
    console.log(`Sales L: ${SL_EMAIL} (agent ${slIdentity.agentId}, ${slIdentity.displayName}) → password ${PASSWORD}`);
    console.log(`Agent:   ${AGENT_EMAIL} (agent ${agentIdentity.agentId}, ${agentIdentity.displayName}) → password ${PASSWORD}`);
    console.log('\nReporting-manager wiring (SL):');
    for (const r of results) {
      console.log(`  ${r.status === 'ok' ? '✅' : '❌'} ${r.id}  ${r.status}${r.msg ? ' — ' + r.msg : ''}`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('❌ Driver failed:', err);
  process.exit(1);
});