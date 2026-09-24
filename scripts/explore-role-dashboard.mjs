#!/usr/bin/env node
/**
 * Explore profile role, sidebar nav, dashboard widgets, and ledger for smoke role tests.
 * Usage: node scripts/explore-role-dashboard.mjs [operations|agent|owner]
 */
import { config } from 'dotenv';
import { chromium } from '@playwright/test';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '..', '.env') });

const roleKey = (process.argv[2] || 'operations').toLowerCase();
const emails = {
  operations: process.env.E2E_EMAIL?.trim(),
  agent: process.env.E2E_EMAIL_AGENT?.trim(),
  owner: process.env.E2E_EMAIL_OWNER?.trim(),
};
const email = emails[roleKey];
const password = process.env.E2E_PASSWORD;
const baseURL = process.env.BASE_URL?.trim() || 'https://preprod.app.pieq.ai';

if (!email || !password) {
  console.error('Missing email/password for role', roleKey);
  process.exit(1);
}

async function login(page) {
  await page.goto(new URL('/', baseURL).href, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  const emailBox = page
    .getByRole('textbox', { name: /email address/i })
    .or(page.locator('#username, #email'))
    .first();
  await emailBox.waitFor({ state: 'visible', timeout: 60_000 });
  await emailBox.fill(email);
  await page.getByRole('button', { name: 'Continue' }).click();
  const pwInput = page.getByLabel(/^password$/i).or(page.locator('input[type="password"]')).first();
  await pwInput.waitFor({ state: 'visible', timeout: 60_000 });
  await pwInput.fill(password);
  await page.getByRole('button', { name: /sign in|log in/i }).first().click();
  await page.waitForURL(/\.app\.pieq\.ai/i, { timeout: 120_000 });
  await page.getByRole('navigation', { name: 'Sidebar navigation' }).waitFor({ state: 'visible', timeout: 60_000 });
  await page.locator('main').getByText(/^Loading\.\.\.$/i).waitFor({ state: 'hidden', timeout: 90_000 }).catch(() => {});
  await page.waitForTimeout(2000);
}

async function waitDashboardReady(page) {
  await page.locator('main').getByText(/^Loading\.\.\.$/i).waitFor({ state: 'hidden', timeout: 90_000 }).catch(() => {});
  await page.waitForTimeout(3000);
}

async function dumpTestIds(page, filter) {
  const ids = await page.evaluate(() =>
    [...document.querySelectorAll('[data-testid]')].map((el) => el.getAttribute('data-testid')),
  );
  const unique = [...new Set(ids)].filter((id) => filter.test(id)).sort();
  console.log('testids matching', filter, ':', unique);
  return unique;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    console.log('=== ROLE:', roleKey, email, '===');
    await login(page);
    console.log('URL after login:', page.url());

    const profileBtn = page.getByTestId('profile-dropdown-button');
    const roleText = profileBtn.locator('p').nth(1);
    console.log('profile role visible:', await roleText.isVisible().catch(() => false));
    console.log('profile role text:', (await roleText.innerText().catch(() => '')).trim());

    const sidebar = page.getByRole('navigation', { name: 'Sidebar navigation' });
    const navButtons = await sidebar.getByRole('button').allInnerTexts();
    console.log('sidebar buttons:', navButtons.map((t) => t.trim()).filter(Boolean));

    await dumpTestIds(page, /dashboard|metric|kpi|revenue|commission|ledger|profile|logout|filter|time|card|chart|payment|ageing|exception|performer/i);

    const headings = await page.getByRole('heading').allInnerTexts();
    console.log('headings on landing:', headings.slice(0, 30));

    // Try dashboard nav if present
    const dashNav = page
      .getByTestId('sidebar-nav-item-dashboard')
      .or(sidebar.getByRole('button', { name: /^Dashboard$/i }));
    if (await dashNav.first().isVisible().catch(() => false)) {
      await dashNav.first().click();
      await waitDashboardReady(page);
      console.log('URL on dashboard:', page.url());
      await dumpTestIds(page, /dashboard|metric|kpi|revenue|commission|filter|time|card|chart|payment|ageing|exception|performer|gross|payout|chargeback/i);
      console.log('dashboard headings:', (await page.getByRole('heading').allInnerTexts()).slice(0, 40));
    }

    const ledgerNav = sidebar.getByRole('button', { name: /ledger/i });
    if (await ledgerNav.isVisible().catch(() => false)) {
      await ledgerNav.click();
      await page.waitForTimeout(3000);
      console.log('ledger URL:', page.url());
      console.log('ledger headings:', await page.getByRole('heading').allInnerTexts());
      await dumpTestIds(page, /ledger/i);
    }

    console.log('--- main aria (first 12k) ---');
    const main = page.locator('main');
    if (await main.count()) {
      console.log((await main.ariaSnapshot()).slice(0, 12000));
    }
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
