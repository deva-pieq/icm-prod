#!/usr/bin/env node
import { config } from 'dotenv';
import { chromium } from '@playwright/test';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '..', '.env') });

const baseURL = process.env.BASE_URL?.trim() || 'https://preprod.app.pieq.ai';
const email = process.env.E2E_EMAIL?.trim();
const password = process.env.E2E_PASSWORD;

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
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await login(page);
    await page.getByTestId('sidebar-nav-item-user-management').click();
    await page.waitForURL(/user-management/i, { timeout: 60_000 });
    await page.waitForTimeout(5000);

    const testIds = await page.evaluate(() =>
      [...document.querySelectorAll('[data-testid]')].map((el) => el.getAttribute('data-testid')),
    );
    console.log('testids (sample):', [...new Set(testIds)].filter((id) => /user|grid|column|kpi|record|total|active/i.test(id)).sort());

    const footer = page.getByTestId('data-grid-record-count-footer');
    console.log('footer visible:', await footer.isVisible().catch(() => false));
    if (await footer.isVisible().catch(() => false)) {
      console.log('footer text:', await footer.innerText());
    }

    for (const id of ['total-users-card', 'active-users-card']) {
      const card = page.getByTestId(id);
      console.log(id, 'visible:', await card.isVisible().catch(() => false), 'text:', await card.innerText().catch(() => ''));
    }

    const search = page.getByRole('textbox', { name: 'Search data grid' });
    await search.fill('zzz-invalid-no-match-xyz');
    await page.waitForTimeout(2000);
    console.log('after invalid search footer:', await footer.innerText().catch(() => 'n/a'));
    console.log('no records:', await page.getByText(/No [Rr]ecords/i).count());

    await search.fill('');
    await page.waitForTimeout(2000);

    const colBtn = page.getByTestId('column-visibility-button');
    console.log('column-visibility-button visible:', await colBtn.isVisible().catch(() => false));
    if (await colBtn.isVisible().catch(() => false)) {
      await colBtn.click();
      await page.waitForTimeout(500);
      const panelTestIds = await page.evaluate(() =>
        [...document.querySelectorAll('[data-testid]')]
          .map((el) => el.getAttribute('data-testid'))
          .filter((id) => /column/i.test(id)),
      );
      console.log('column testids in panel:', panelTestIds);
      const checkboxes = await page.getByRole('checkbox').allInnerTexts();
      console.log('checkbox labels:', checkboxes);
      await page.keyboard.press('Escape');
    }

    console.log('--- aria snippet ---');
    console.log((await page.locator('main').ariaSnapshot()).slice(0, 8000));
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
