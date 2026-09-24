/**
 * Debug commission-details grid scrolling + row capture without full upload flow.
 * Uses a completed upload file ID (default: latest Oscar commissionTruth Completed row).
 *
 * Run: node scripts/debug-commission-truth-grid.mjs
 * Env: COMMISSION_TRUTH_DEBUG_FILE_ID=BT-JB9HYQ (optional override)
 */
import fsSync from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const projectRoot = path.resolve(import.meta.dirname, '..');

function loadEnv() {
  const envPath = path.join(projectRoot, '.env');
  if (!fsSync.existsSync(envPath)) return;
  for (const line of fsSync.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
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
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnv();

const baseURL = (process.env.BASE_URL ?? 'https://preprod.app.pieq.ai/').replace(/\/?$/, '/');
const email = (process.env.E2E_EMAIL ?? '').trim();
const password = (process.env.E2E_PASSWORD ?? '').trim();
const fileIdOverride = (process.env.COMMISSION_TRUTH_DEBUG_FILE_ID ?? '').trim();

const GRID_SELECTOR = '[role="grid"][aria-label="Data grid"], [role="grid"][aria-label="Data Grid"]';

async function login(page) {
  await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
  const emailInput = page
    .getByRole('textbox', { name: /email address/i })
    .or(page.locator('#username, #email'))
    .first();
  await emailInput.waitFor({ state: 'visible', timeout: 60_000 });
  await emailInput.fill(email);
  await page.getByRole('button', { name: 'Continue' }).click();
  const passwordInput = page.getByLabel(/^password$/i).or(page.locator('#password')).first();
  await passwordInput.waitFor({ state: 'visible', timeout: 30_000 });
  await passwordInput.fill(password);
  await page.getByRole('button', { name: /sign in|log in/i }).first().click();
  await page
    .getByRole('navigation', { name: 'Sidebar navigation' })
    .waitFor({ state: 'visible', timeout: 90_000 });
}

async function openCommissionDetailsFromUploadGrid(page, fileId) {
  const pages = [
    `${baseURL}commission-processing/upload-statement`,
    `${baseURL}commission-processing/statement-history`,
  ];

  for (const url of pages) {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    const grid = page.getByRole('grid', { name: 'Data grid' });
    if (!(await grid.isVisible({ timeout: 15_000 }).catch(() => false))) continue;

    const search = page.getByRole('textbox', { name: 'Search data grid' });
    if (await search.isVisible().catch(() => false)) {
      await search.fill(fileId);
      await page.waitForTimeout(1_500);
    }

    const row = grid
      .getByRole('row')
      .filter({ hasText: fileId })
      .filter({ hasNot: page.getByRole('columnheader') })
      .first();

    if (await row.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await row.scrollIntoViewIfNeeded();
      await row.click();
      await page.waitForTimeout(2_000);
      const heading = page.getByRole('heading', {
        name: /^Commission\s+(?:Details|Reconciliation)$/i,
      });
      if (await heading.isVisible({ timeout: 30_000 }).catch(() => false)) return;
    }
  }

  throw new Error(`Could not open commission details for file ID ${fileId}`);
}

async function findCompletedOscarFileId(page) {
  const search = page.getByRole('textbox', { name: 'Search data grid' });
  if (await search.isVisible().catch(() => false)) {
    await search.fill('Oscar U65 CS');
    await page.waitForTimeout(2_000);
  }

  const viewport = page.locator('.ag-center-cols-viewport').first();
  const maxScroll = await viewport.evaluate((el) => el.scrollHeight - el.clientHeight);

  for (let scrollTop = 0; scrollTop <= maxScroll + 1; scrollTop += 200) {
    await viewport.evaluate((el, top) => {
      el.scrollTop = top;
      el.dispatchEvent(new Event('scroll'));
    }, scrollTop);
    await page.waitForTimeout(300);

    const fileId = await page.evaluate(() => {
      const rows = [...document.querySelectorAll('[role="grid"] [role="row"]')].filter(
        (r) => !r.querySelector('[role="columnheader"]'),
      );
      for (const row of rows) {
        const text = (row.textContent ?? '').replace(/\s+/g, ' ');
        if (!/oscar u65 cs/i.test(text)) continue;
        if (!/completed/i.test(text)) continue;
        const id = text.match(/\bBT-[A-Z0-9]+\b/)?.[0];
        if (id) return id;
      }
      return '';
    });

    if (fileId) return fileId;
  }

  return '';
}

async function resolveCompletedFileId(page) {
  if (fileIdOverride) return fileIdOverride;

  await page.goto(`${baseURL}commission-processing/upload-statement`, {
    waitUntil: 'domcontentloaded',
  });
  await page.getByRole('grid', { name: 'Data grid' }).waitFor({ state: 'visible', timeout: 60_000 });

  let fileId = await findCompletedOscarFileId(page);
  if (fileId) return fileId;

  await page.goto(`${baseURL}commission-processing/statement-history`, {
    waitUntil: 'domcontentloaded',
  });
  await page
    .getByRole('heading', { name: /commission statement history/i })
    .waitFor({ state: 'visible', timeout: 60_000 })
    .catch(() => {});

  fileId = await findCompletedOscarFileId(page);
  if (!fileId) {
    throw new Error(
      'No completed Oscar U65 CS upload found — set COMMISSION_TRUTH_DEBUG_FILE_ID to a Completed file ID',
    );
  }
  return fileId;
}

async function scrollGridToRow(page, rowIndex, totalRows) {
  const gridSelector = GRID_SELECTOR;

  const centerRow = async () =>
    page.evaluate(
      ({ idx, selector }) => {
        const grid = document.querySelector(selector) ?? document.querySelector('[role="grid"]');
        if (!grid) return { ok: false, reason: 'no grid' };

        const hasData = (row) =>
          [...row.querySelectorAll('[role="gridcell"], .ag-cell')].some(
            (c) =>
              c.getAttribute('col-id') !== '__reconcile_warning__' &&
              (c.textContent ?? '').trim().length > 0,
          );

        const target =
          grid.querySelector(`.ag-row[row-index="${idx}"]`) ??
          [...grid.querySelectorAll('[role="row"]')].filter(
            (r) => !r.querySelector('[role="columnheader"]') && hasData(r),
          )[idx];

        if (!target || !hasData(target)) return { ok: false, reason: 'row not rendered' };
        target.scrollIntoView({ block: 'center', inline: 'nearest' });
        const text = (target.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 120);
        return { ok: true, text };
      },
      { idx: rowIndex, selector: gridSelector },
    );

  let result = await centerRow();
  if (result.ok) return result;

  const viewport = page.locator('.ag-center-cols-viewport').first();
  const rowHeight = await page.evaluate(() => {
    const el = document.querySelector('.ag-center-cols-viewport .ag-row');
    return el instanceof HTMLElement ? el.offsetHeight : 52;
  });

  for (let attempt = 0; attempt < 50; attempt++) {
    const scrollTop = Math.max(0, rowIndex * rowHeight - rowHeight * 2);
    await viewport.evaluate((el, top) => {
      el.scrollTop = top;
      el.dispatchEvent(new Event('scroll'));
    }, scrollTop);
    await page.waitForTimeout(250);
    result = await centerRow();
    if (result.ok) return result;

    const ratio = totalRows > 1 ? rowIndex / (totalRows - 1) : 0;
    await viewport.evaluate((el, r) => {
      const max = Math.max(0, el.scrollHeight - el.clientHeight);
      el.scrollTop = max * r;
      el.dispatchEvent(new Event('scroll'));
    }, ratio);
    await page.waitForTimeout(250);
    result = await centerRow();
    if (result.ok) return result;
  }

  return result;
}

async function main() {
  if (!email || !password) {
    throw new Error('Set E2E_EMAIL and E2E_PASSWORD in projects/icm/.env');
  }

  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const page = await browser.newPage();

  try {
    console.log('[debug] logging in…');
    await login(page);

    const fileId = await resolveCompletedFileId(page);
    console.log(`[debug] using file ID: ${fileId}`);

    await openCommissionDetailsFromUploadGrid(page, fileId);
    await page.getByRole('grid', { name: 'Data grid' }).waitFor({ state: 'visible', timeout: 60_000 });

    const footer = page.getByTestId('data-grid-record-count-footer');
    const footerText = await footer.innerText();
    const totalRows = Number.parseInt(footerText.match(/(\d+)\s*records/i)?.[1] ?? '0', 10);
    console.log(`[debug] commission details grid: ${totalRows} row(s)`);

    const results = { ok: 0, fail: 0, rows: [] };

    for (let i = 0; i < totalRows; i++) {
      const scroll = await scrollGridToRow(page, i, totalRows);
      let earningType = '';
      if (scroll.ok) {
        const rowText = scroll.text ?? '';
        const match = rowText.match(/\b(Commission|Bonus|Override|Chargeback)\b/i);
        earningType = match?.[1] ?? '(unknown)';
        results.ok++;
      } else {
        results.fail++;
      }
      const line = {
        row: i + 1,
        scrollOk: scroll.ok,
        earningType,
        preview: scroll.text ?? scroll.reason ?? '',
      };
      results.rows.push(line);
      console.log(
        `[row ${String(i + 1).padStart(2, '0')}/${totalRows}] scroll=${scroll.ok ? 'OK' : 'FAIL'} type=${earningType || '-'} ${(scroll.text ?? scroll.reason ?? '').slice(0, 80)}`,
      );
    }

    console.log('\n[summary]', JSON.stringify({ fileId, totalRows, ...results }, null, 2));
    await page.waitForTimeout(3_000);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error('[debug] failed:', error);
  process.exit(1);
});
