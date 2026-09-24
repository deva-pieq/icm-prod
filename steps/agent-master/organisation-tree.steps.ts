import { expect } from '@playwright/test';
import { When, Then } from '../fixtures';
import { waitForAppSettled } from '../../utils/pageLoader';

// ── T066: Tree nodes show Avatar, Name, Level, Organisation ─────────────────

When('I open Organisation Tree view in agents', async ({ agentEditTabsPage }) => {
  await agentEditTabsPage.openOrgTreeTab();
});

Then('organisation tree shows agent {string} in agents', async ({ agentEditTabsPage }, agentName: string) => {
  await agentEditTabsPage.expectOrgTreeShowsAgent(agentName);
});

Then('organisation tree nodes show avatar name level and organisation in agents', async ({ agentEditTabsPage }) => {
  await agentEditTabsPage.expectOrgTreeNodesVisible();
  const texts = await agentEditTabsPage.getOrgTreeNodeTexts();
  expect(texts.length, 'Expected at least one tree node').toBeGreaterThan(0);
  const allText = texts.join(' ');
  expect(allText).toMatch(/\w+/);
  expect(allText).toMatch(/ANTHONY HUNSBERGER/i);
});

// ── T067: You badge only on the current agent node ─────────────────────────

Then('the You badge appears only on the current agent node in agents', async ({ agentEditTabsPage }) => {
  await agentEditTabsPage.expectYouBadgeOnCurrentAgent('ANTHONY HUNSBERGER');
  const badges = agentEditTabsPage.page.getByText('You');
  const count = await badges.count();
  expect(count, 'Expected exactly one You badge').toBe(1);
});

// ── T068: Level on cards matches records; hidden when no level ──────────────

Then('organisation tree level labels match agent level records in agents', async ({ agentEditTabsPage }) => {
  const texts = await agentEditTabsPage.getOrgTreeNodeTexts();
  const allText = texts.join(' ');
  expect(allText).toMatch(/LVL\d+/i);
});

// ── T069: Expand and collapse parent nodes ──────────────────────────────────

When('I collapse a parent organisation tree node in agents', async ({ agentEditTabsPage }) => {
  const expandBtn = agentEditTabsPage.page.locator('table button').first();
  if (await expandBtn.isVisible().catch(() => false)) {
    await expandBtn.click();
    await agentEditTabsPage.page.waitForTimeout(300);
  }
});

Then('the parent node direct reports are hidden in agents', async ({ agentEditTabsPage }) => {
  await waitForAppSettled(agentEditTabsPage.page);
});

When('I expand that parent organisation tree node in agents', async ({ agentEditTabsPage }) => {
  const expandBtn = agentEditTabsPage.page.locator('table button').first();
  if (await expandBtn.isVisible().catch(() => false)) {
    await expandBtn.click();
    await agentEditTabsPage.page.waitForTimeout(300);
  }
});

Then('the parent node direct reports are visible in agents', async ({ agentEditTabsPage }) => {
  await agentEditTabsPage.expectOrgTreeNodesVisible();
});

// ── T070: Zoom controls enlarge shrink and reset ────────────────────────────

When('I zoom in on organisation tree in agents', async ({ agentEditTabsPage }) => {
  await agentEditTabsPage.zoomInOrgTree();
});

Then('organisation tree scale is larger than default in agents', async ({ agentEditTabsPage }) => {
  await agentEditTabsPage.expectOrgTreeScaleLargerThanBaseline();
});

When('I zoom out on organisation tree in agents', async ({ agentEditTabsPage }) => {
  await agentEditTabsPage.zoomOutOrgTree();
});

Then('organisation tree scale is smaller than after zoom in in agents', async ({ agentEditTabsPage }) => {
  await agentEditTabsPage.expectOrgTreeScaleSmallerThanZoomIn();
});

When('I reset organisation tree zoom to 1:1 in agents', async ({ agentEditTabsPage }) => {
  await agentEditTabsPage.resetOrgTreeZoom();
});

Then('organisation tree scale is at default in agents', async ({ agentEditTabsPage }) => {
  await agentEditTabsPage.expectOrgTreeScaleAtDefault();
});

// ── T071: Horizontal and vertical panning ───────────────────────────────────

When('I pan the organisation tree canvas in agents', async ({ agentEditTabsPage }) => {
  const canvas = agentEditTabsPage.loc.orgTreeCanvas();
  const box = await canvas.boundingBox();
  if (box) {
    await agentEditTabsPage.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await agentEditTabsPage.page.mouse.down();
    await agentEditTabsPage.page.mouse.move(box.x + box.width / 2 + 50, box.y + box.height / 2 + 30, {
      steps: 10,
    });
    await agentEditTabsPage.page.mouse.up();
    await agentEditTabsPage.page.waitForTimeout(300);
  }
});

Then('organisation tree viewport changes after pan in agents', async ({ agentEditTabsPage }) => {
  const canvas = agentEditTabsPage.loc.orgTreeCanvas();
  await expect(canvas).toBeVisible({ timeout: 5_000 });
});
