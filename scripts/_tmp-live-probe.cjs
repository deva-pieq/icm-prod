/* eslint-disable no-console */
/**
 * TEMP live-app probe (delete after use).
 * Dumps carrierfiles lifecycle rows (status/stage/error) from prod ICM.
 * Usage: node scripts/_tmp-live-probe.cjs list [filterSubstring] [limit]
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');

function envVal(key) {
  const txt = fs.readFileSync(path.join(ROOT, '.env'), 'utf8');
  const m = txt.match(new RegExp('^' + key + '=(.*)$', 'm'));
  return m ? m[1].trim() : '';
}

async function login() {
  const BASE = envVal('BASE_URL') || 'https://icm.pieq.ai/';
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1680, height: 1050 } });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.locator('#username, #email, input[name="username"]').first().fill(envVal('E2E_EMAIL'));
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.locator('#password, input[type="password"]').first().waitFor({ timeout: 30000 });
  await page.locator('#password, input[type="password"]').first().fill(envVal('E2E_PASSWORD'));
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/icm\.pieq\.ai/i, { timeout: 60000 });
  await page.waitForTimeout(6000);
  return { browser, page, base: BASE.replace(/\/$/, '') };
}

module.exports = { login };

if (require.main === module) {
  (async () => {
    const { browser, page, base } = await login();
    const payloads = [];
    page.on('response', (r) => {
      if (/\/api\/v1\/carrierfiles\//i.test(r.url())) payloads.push(r);
    });
    await page.goto(base + '/commission-processing/upload-statement', {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForTimeout(10000);
    await page
      .getByTestId('data-grid-refresh-button')
      .or(page.getByRole('button', { name: /refresh grid data/i }))
      .first()
      .click()
      .catch(() => {});
    await page.waitForTimeout(6000);

    const rows = [];
    for (const r of payloads) {
      const json = await r.json().catch(() => null);
      const arr = json && (json.data || json.results || json);
      if (!Array.isArray(arr)) continue;
      for (const row of arr) {
        rows.push({
          id: row.uuid ?? '',
          name: row.name ?? '',
          status: row.status ?? '',
          stage: row.stage ?? '',
          totalRows: row.totalRows ?? '',
          recordCount: row.recordCount ?? '',
          setup: row.commissionStatementSetupName ?? '',
          createdAt: row.createdAt ?? '',
          error: row.error ?? '',
        });
      }
    }
    const uniq = [];
    const seen = new Set();
    for (const h of rows) {
      if (seen.has(h.id)) continue;
      seen.add(h.id);
      uniq.push(h);
    }
    uniq.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    const filter = process.argv[3] || '';
    const limit = Number(process.argv[4] || 30);
    const out = uniq.filter((x) => !filter || x.name.includes(filter)).slice(0, limit);
    console.log(JSON.stringify({ total: uniq.length, shown: out.length, rows: out }, null, 1));
    await browser.close();
  })().catch((e) => {
    console.error('PROBE_ERROR', e && e.message);
    process.exit(1);
  });
}
