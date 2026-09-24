import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { simpleParser } from 'mailparser';
import imapSimple from 'imap-simple';
import { chromium, type Page } from '@playwright/test';
import { JSDOM } from 'jsdom';
import { AgentFormPage } from '../../pages/agents/AgentFormPage';
import { AgentsPage } from '../../pages/agents/AgentsPage';
import { LoginPage } from '../../pages/auth/LoginPage';
import { ProfilePage } from '../../pages/auth/ProfilePage';
import { AppPaths } from '../../pages/appPaths';
import { agency3OpsCredentials } from '../loadEnv';

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

const COUNTER_FILE = path.join(process.cwd(), 'utils/agent-activation/counter.json');

export interface AgentData {
  agentId: string;
  npn: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  counter: number;
}

function loadCounter(): number {
  try {
    const data = JSON.parse(fs.readFileSync(COUNTER_FILE, 'utf-8'));
    return data.counter ?? 1;
  } catch {
    return 1;
  }
}

function saveCounter(counter: number): void {
  fs.writeFileSync(COUNTER_FILE, JSON.stringify({ counter }, null, 2));
}

function buildAgentData(counter: number): AgentData {
  const suffix = String(counter).padStart(4, '0');
  const uniqueId = `9${suffix}`.slice(0, 10);
  const name = `TestAgent${suffix}`;
  return {
    agentId: uniqueId,
    npn: uniqueId,
    firstName: name,
    lastName: name,
    displayName: `${name} ${name}`,
    email: `deva.r+test+a+${counter}@pieq.ai`,
    counter,
  };
}

/** Decode HTML entities commonly found in email hrefs. */
function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

/**
 * SES click-tracking wraps the real Keycloak URL:
 *   https://…awstrack.me/L0/{urlencoded_target}/1/{id}/{sig}
 * Keep the full tracking URL from the email — do not unwrap.
 */
function preferEmailHref(url: string): string {
  return decodeHtmlEntities(url.trim());
}

/**
 * Extract full activation link from email HTML/text.
 * Must use mailparser-decoded bodies — raw IMAP TEXT is quoted-printable
 * soft-wrapped (`=\r\n`), which truncates regex matches mid-URL.
 */
export function extractActivationLink(htmlOrText: string): string | null {
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

  // Fallback: unwrap QP soft breaks, then regex on flattened text
  const flattened = htmlOrText
    .replace(/=\r?\n/g, '')
    .replace(/=3D/gi, '=')
    .replace(/\s+/g, ' ');

  const tracking =
    flattened.match(
      /https:\/\/[a-z0-9]+\.r\.[a-z0-9.-]+\.awstrack\.me\/L0\/https[^"'\s>]+/i,
    )?.[0] ?? null;
  if (tracking) return preferEmailHref(tracking);

  const direct =
    flattened.match(
      /https:\/\/[^\s"'<>]*\/login-actions\/action-token\?key=[^\s"'<>]+/i,
    )?.[0] ?? null;
  if (direct) return preferEmailHref(direct);

  return null;
}

async function waitForActivationEmail(email: string, maxWaitMs = 180000): Promise<string> {
  const connection = await imapSimple.connect(IMAP_CONFIG);
  await connection.openBox('INBOX');

  const startTime = Date.now();
  // Do NOT use IMAP TO — Gmail often misses plus-address recipients.
  // Filter To header in-process after mailparser decode.
  const searchCriteria = [
    'ALL',
    ['FROM', 'techadmin@pieq.ai'],
    ['SUBJECT', 'Welcome to pieq-sso'],
  ];
  // Fetch full RFC822 so mailparser can decode QP / multipart correctly
  const fetchOptions = { bodies: [''], markSeen: false };
  const emailLc = email.toLowerCase();

  try {
    while (Date.now() - startTime < maxWaitMs) {
      const messages = await connection.search(searchCriteria, fetchOptions);
      console.log(`🔍 Search: ${messages.length} welcome email(s); looking for ${email}`);

      // Newest first — imap-simple usually returns oldest→newest
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
          console.log(`🔗 Activation link length=${link.length}`);
          console.log(`🔗 Activation link head=${link.slice(0, 100)}…`);
          console.log(`🔗 Activation link tail=…${link.slice(-60)}`);
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

/**
 * Complete Keycloak activation on the given page (ops must already be logged out).
 * Ends logged in as the agent (password set + profile-skip).
 */
export async function activateAgentOnPage(
  page: Page,
  activationUrl: string,
  email: string,
  password: string,
): Promise<void> {
  console.log('🌐 Opening activation link...');
  await page.goto(activationUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

  console.log('🔘 Clicking "» Click here to proceed"...');
  const proceed = page.locator('a', { hasText: /Click here to proceed/i });
  await proceed.waitFor({ state: 'visible', timeout: 60000 });
  await proceed.click();
  await page.waitForLoadState('domcontentloaded');

  console.log('🔐 Filling password fields...');
  await page.locator('#password-new').waitFor({ state: 'visible', timeout: 60000 });
  await page.locator('#password-new').fill(password);
  await page.locator('#password-confirm').waitFor({ state: 'visible', timeout: 30000 });
  await page.locator('#password-confirm').fill(password);

  console.log('📤 Submitting password form...');
  await page.locator('button[type="submit"], input[type="submit"]').first().click();
  await page.waitForLoadState('domcontentloaded');

  console.log('↩️ Clicking "« Back to Application"...');
  const back = page.locator('a', { hasText: /Back to Application/i });
  await back.waitFor({ state: 'visible', timeout: 60000 });
  await back.click();
  await page.waitForLoadState('domcontentloaded');

  console.log('🔑 Logging in with agent credentials...');
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

  console.log('⏭️ Clicking profile-skip...');
  const skip = page.locator('[data-testid="profile-skip"]');
  await skip.waitFor({ state: 'visible', timeout: 60000 });
  await skip.click();
  await page.waitForLoadState('domcontentloaded');

  await loginPage.waitForSidebarNavigation(60000);
  console.log('✅ Agent activated successfully!');
}

async function activateAgentInBrowser(
  activationUrl: string,
  email: string,
  password: string,
): Promise<void> {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await activateAgentOnPage(page, activationUrl, email, password);
  } finally {
    await browser.close();
  }
}

/** Create agent only (ops session). Does not activate. */
export async function createAgentOnly(page: Page): Promise<AgentData> {
  const counter = loadCounter();
  const agentData = buildAgentData(counter);
  saveCounter(counter + 1);

  console.log(`📝 Creating agent: ${agentData.displayName} (${agentData.email})`);

  const agentsPage = new AgentsPage(page);
  const agentFormPage = new AgentFormPage(page);

  await agentsPage.openList();
  await agentsPage.openAdd();

  await agentFormPage.fillAllRequiredFields({
    agentId: agentData.agentId,
    firstName: agentData.firstName,
    lastName: agentData.lastName,
    email: agentData.email,
    npn: agentData.npn,
  });

  await agentFormPage.fillValidBankDetails();
  await agentFormPage.clickSave();
  await agentFormPage.clickConfirmSave({ captureToast: true });

  return agentData;
}

/**
 * Full cycle on shared page:
 * create (ops) → logout → gmail activate + agent login → logout → login ops.
 */
export async function createAndActivateAgent(page: Page): Promise<AgentData> {
  const agentData = await createAgentOnly(page);

  console.log('📧 Waiting for activation email...');
  const activationUrl = await waitForActivationEmail(agentData.email);

  console.log('🚪 Logging out ops before activation...');
  await new ProfilePage(page).signOut();

  await activateAgentOnPage(page, activationUrl, agentData.email, 'Test@123');

  console.log('🚪 Logging out agent; restoring ops session...');
  await new ProfilePage(page).signOut();
  const { email, password } = agency3OpsCredentials();
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.loginWithEmailPasswordToApp(email, password);

  return agentData;
}

export { loadCounter, saveCounter, buildAgentData, waitForActivationEmail, activateAgentInBrowser };
