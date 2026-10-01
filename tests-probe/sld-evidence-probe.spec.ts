/**
 * TEMPORARY read-only probe (not a scenario). Logs in as Agency 3 Ops, then dumps
 * live-app evidence to .generated/probe-sld-evidence.json:
 *   1. Agents grid rows for NPN 600004, 0987654321, 843401317
 *   2. Recently Uploaded grid rows for today's uploads (stage/status/line items)
 *   3. Detail of the newest Extract/Error row (row click -> error text if any)
 * No writes, no uploads.
 */
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { LoginPage } from '../pages/auth/LoginPage';
import { AgentsPage } from '../pages/agents/AgentsPage';
import { StatementUploadPage } from '../pages/statement-processing/StatementUploadPage';
import { agency3OpsCredentials, loadProjectEnv } from '../utils/loadEnv';
import { IcmSidebarPage } from '../pages/sidebar/IcmSidebarPage';
import { waitForAppSettled } from '../utils/pageLoader';

loadProjectEnv();

const OUT = path.join(process.cwd(), '.generated', 'probe-sld-evidence.json');

async function dumpAgentsGrid(page: import('@playwright/test').Page, npn: string) {
  const agents = new AgentsPage(page);
  await agents.openList();
  await agents.searchGrid(npn);
  const rows = await page
    .getByTestId('agents-datagrid')
    .locator('[role="row"]')
    .evaluateAll((els) =>
      els.slice(0, 12).map((el) => ({
        cells: [...el.querySelectorAll('[role="gridcell"]')].map(
          (c) => (c.textContent || '').replace(/\s+/g, ' ').trim(),
        ),
        colIds: [...el.querySelectorAll('[role="gridcell"]')].map((c) =>
          c.getAttribute('col-id'),
        ),
      })),
    );
  return { npn, rows };
}

async function dumpUploadGrid(page: import('@playwright/test').Page) {
  const upload = new StatementUploadPage(page);
  await upload.openUploadPage();
  const grid = page.getByRole('grid', { name: /data grid/i }).first();
  const rows = await grid.locator('[role="row"]').evaluateAll((els) =>
    els.slice(0, 16).map((el) => ({
      cells: [...el.querySelectorAll('[role="gridcell"]')].map((c) =>
        (c.textContent || '').replace(/\s+/g, ' ').trim(),
      ),
      testids: [...el.querySelectorAll('[data-testid]')].map((n) => n.getAttribute('data-testid')),
      ariaLabel: el.getAttribute('aria-label'),
    })),
  );
  return rows;
}

test('probe SLD-001 live evidence', async ({ page }) => {
  test.setTimeout(900_000);
  const { email, password } = agency3OpsCredentials();
  const login = new LoginPage(page);
  await login.goto();
  await login.loginWithEmailPasswordToApp(email, password);
  await waitForAppSettled(page, 30_000);

  const out: Record<string, unknown> = {};

  // 1. Upload grid first (read-only, cheap).
  out.uploadRows = await dumpUploadGrid(page);

  // 2. Agents
  out.agents = [];
  for (const npn of ['600004', '0987654321', '843401317']) {
    out.agents.push(await dumpAgentsGrid(page, npn));
  }

  // 3. Row-click the newest Extract/Error row and capture any error detail text.
  const upload = new StatementUploadPage(page);
  await upload.openUploadPage();
  const grid = page.getByRole('grid', { name: /data grid/i }).first();
  const row = grid.locator('[role="row"]', { hasText: 'Extract' }).first();
  if (await row.count()) {
    const label = ((await row.getAttribute('aria-label')) ?? '').replace(/\s+/g, ' ').trim();
    try {
      await row.click({ timeout: 8_000 });
      await page.waitForTimeout(4_000);
      await waitForAppSettled(page, 20_000);
      out.errorRowClicked = {
        rowLabel: label,
        urlAfterClick: page.url(),
        bodySnippet: (await page.locator('main').innerText().catch(() => '')).slice(0, 1500),
      };
    } catch (e) {
      out.errorRowClicked = { rowLabel: label, clickError: String(e).slice(0, 300) };
    }
  } else {
    out.errorRowClicked = { found: false };
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');
  expect(true).toBe(true);
});
