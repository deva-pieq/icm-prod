/**
 * TEMP discovery steps — dumps exact Add Agent Level dropdown option labels to
 * .generated/discovery/result.json. NOT part of the regression suite. Delete after discovery.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { When } from '../fixtures';
import { AgentsPage } from '../../pages/agents/AgentsPage';
import { AgentEditTabsPage } from '../../pages/agents/AgentEditTabsPage';
import { AppPaths, AppUrlPatterns } from '../../pages/appPaths';

const OUT_DIR = path.join(process.cwd(), '.generated', 'discovery');
const OUT_FILE = path.join(OUT_DIR, 'result.json');

function write(payload: Record<string, unknown>) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(payload, null, 2), 'utf8');
}

When('I dump add agent level dropdown options for discovery', async ({ page }) => {
  const out: Record<string, unknown> = { step: 'start' };
  try {
    // ── Navigate to Agents ────────────────────────────────────────────────
    await page.goto(AppPaths.agents, { waitUntil: 'domcontentloaded' });
    const grid = page.getByTestId('agents-datagrid');
    await grid.waitFor({ state: 'visible', timeout: 60_000 });
    await page.waitForTimeout(6000);
    out.agentsUrl = page.url();

    // ── Open the first agent row's edit page ───────────────────────────────
    const cells = grid.locator('[role="gridcell"][col-id="agent"]');
    const cellCount = await cells.count();
    out.agentCellCount = cellCount;

    // Prove the grid's own level text (baseline label format).
    out.gridAgentCellTexts = await cells.evaluateAll((els) =>
      els.slice(0, 8).map((e) => (e.textContent || '').replace(/\s+/g, ' ').trim()),
    );

    let opened = false;
    // Prefer an agent with NO levels assigned — Add Agent Level is disabled once
    // every level is used (proven: beef2ec7 has all 11 and the button is disabled).
    for (let i = 0; i < cellCount; i++) {
      const text = (await cells.nth(i).innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
      if (!text || !/no level/i.test(text)) continue;
      await cells.nth(i).click();
      try {
        await page.waitForURL(AppUrlPatterns.agentsEdit, { timeout: 20_000 });
        opened = true;
        out.openedAgentCellText = text;
        out.openedAgentWasNoLevel = true;
        break;
      } catch {
        /* row not clickable */
      }
    }
    // Fallback: first clickable row.
    if (!opened) {
      for (let i = 0; i < cellCount; i++) {
        const text = (await cells.nth(i).innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
        if (!text) continue;
        await cells.nth(i).click();
        try {
          await page.waitForURL(AppUrlPatterns.agentsEdit, { timeout: 20_000 });
          opened = true;
          out.openedAgentCellText = text;
          out.openedAgentWasNoLevel = false;
          break;
        } catch {
          /* row not clickable */
        }
      }
    }
    out.openedEdit = opened;
    if (!opened) {
      out.error = 'could not open any agent edit page';
      write(out);
      return;
    }
    out.agentEditUrl = page.url();

    // Mirror AgentsPage.openEditByMatchingRow lock handling.
    const lock = page.getByRole('button', { name: /acquire lock/i });
    if (await lock.isVisible().catch(() => false)) {
      await lock.click();
      out.acquiredLock = true;
    }
    await page.waitForTimeout(4000);

    // ── Level & Hierarchy tab ──────────────────────────────────────────────
    const tabsPage = new AgentEditTabsPage(page);
    await tabsPage.openLevelHierarchyTab();
    out.onLevelHierarchyTab = true;

    // Baseline: levels already assigned to this agent (levelName column).
    out.assignedLevelNames = await tabsPage.getLevelNameCellTexts();
    out.addLevelButtonTestIdCount = await page.getByTestId('add-level-record-button').count();
    out.addLevelButtonVisible = await page.getByTestId('add-level-record-button').isVisible().catch(() => false);
    out.addLevelButtonDisabled = await page.getByTestId('add-level-record-button').isDisabled().catch(() => null);

    // ── Add Agent Level drawer ─────────────────────────────────────────────
    await tabsPage.clickAddLevel();

    const modal = page.getByTestId(/add-level-record-modal/i);
    out.modalTestIds = await page.evaluate(() => {
      const m = document.querySelector('[data-testid*="add-level-record-modal"]');
      if (!m) return null;
      return [...m.querySelectorAll('[data-testid]')].map((e) => e.getAttribute('data-testid'));
    });

    // The POM locator under test: modal.getByRole('button', { name: /select/i })
    const pomDropdown = modal.getByRole('button', { name: /select/i });
    out.pomDropdownMatchCount = await pomDropdown.count();
    out.pomDropdownNodes = await pomDropdown.evaluateAll((els) =>
      els.map((e) => ({
        text: (e.textContent || '').replace(/\s+/g, ' ').trim(),
        testid: e.getAttribute('data-testid'),
        tag: e.tagName,
        ariaExpanded: e.getAttribute('aria-expanded'),
        disabled: e.disabled,
      })),
    );

    await pomDropdown.first().click();
    await page.waitForTimeout(2000);

    // ── EXACT option labels ────────────────────────────────────────────────
    out.pomOptionLocatorCount = await page.getByRole('option').count();
    out.options_role_option = await page.evaluate(() =>
      [...document.querySelectorAll('[role="option"]')].map((e) => ({
        text: (e.textContent || '').replace(/\s+/g, ' ').trim(),
        testid: e.getAttribute('data-testid'),
        id: e.getAttribute('id'),
        ariaSelected: e.getAttribute('aria-selected'),
        ariaDisabled: e.getAttribute('aria-disabled'),
      })),
    );

    // Any listbox/menu container that might hold rows without role=option
    out.potentialOptionContainers = await page.evaluate(() =>
      [...document.querySelectorAll('[role="listbox"],[role="menu"],[data-testid*="option"],[data-testid*="listbox"],[data-testid*="dropdown"],[id*="option"],[id*="listbox"]')]
        .filter((e) => e.offsetParent !== null)
        .slice(0, 30)
        .map((e) => ({
          tag: e.tagName,
          role: e.getAttribute('role'),
          testid: e.getAttribute('data-testid'),
          id: e.id || null,
          childCount: e.children.length,
          scrollH: e.scrollHeight,
          clientH: e.clientHeight,
          text: (e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 400),
        })),
    );

    // If the option list is scrollable/virtualized, scroll to the bottom first
    // and re-read, so no label is missed.
    const scrollInfo = await page.evaluate(() => {
      const first = document.querySelector('[role="option"]');
      if (!first) return null;
      let el: HTMLElement | null = first.parentElement;
      while (el) {
        if (el.scrollHeight > el.clientHeight + 4) {
          const before = { scrollTop: el.scrollTop, scrollHeight: el.scrollHeight, clientHeight: el.clientHeight };
          el.scrollTop = el.scrollHeight;
          return { scrolled: true, tag: el.tagName, testid: el.getAttribute('data-testid'), before, after: { scrollTop: el.scrollTop } };
        }
        el = el.parentElement;
      }
      return { scrolled: false };
    });
    out.dropdownScroll = scrollInfo;
    if (scrollInfo?.scrolled) {
      await page.waitForTimeout(1200);
      out.options_role_option_afterScroll = await page.evaluate(() =>
        [...document.querySelectorAll('[role="option"]')].map((e) =>
          (e.textContent || '').replace(/\s+/g, ' ').trim(),
        ),
      );
      // restore so the full set is comparable
      await page.evaluate(() => {
        const first = document.querySelector('[role="option"]');
        let el: HTMLElement | null = first?.parentElement ?? null;
        while (el) {
          if (el.scrollHeight > el.clientHeight + 4) {
            el.scrollTop = 0;
            break;
          }
          el = el.parentElement;
        }
      });
      await page.waitForTimeout(800);
    }

    // Visible leaf-ish nodes inside the open popup (ground truth markup)
    out.visibleNodes = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll('li, [role="option"], [role="listbox"] li, [role="listbox"] div')]
        .filter((e) => e.offsetParent !== null && (e.textContent || '').trim())
        .slice(0, 40)
        .map((e) => ({
          tag: e.tagName,
          role: e.getAttribute('role'),
          testid: e.getAttribute('data-testid'),
          cls: (e.className || '').toString().slice(0, 60),
          text: (e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60),
        }));
      return nodes;
    });

    out.step = 'complete';
  } catch (err) {
    out.step = 'failed';
    out.fatal = String((err as Error)?.message ?? err);
    out.fatalUrl = page.url();
    out.fatalBodyText = (await page.locator('body').innerText().catch(() => ''))
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 600);
    await page.screenshot({ path: path.join(OUT_DIR, 'failure.png'), fullPage: false }).catch(() => undefined);
  }
  write(out);
});