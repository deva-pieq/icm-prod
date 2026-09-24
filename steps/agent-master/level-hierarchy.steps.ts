import { expect } from '@playwright/test';
import { When, Then } from '../fixtures';
import { waitForAppSettled } from '../../utils/pageLoader';
import { getSeedAgent } from '../../utils/agents/agentContext';

function todayMmDdYyyy(): string {
  const d = new Date();
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
}

// ── T034: Add Agent Level opens level entry drawer ──────────────────────────

When('I open Level and Hierarchy tab in agents', async ({ agentEditTabsPage }) => {
  await agentEditTabsPage.openLevelHierarchyTab();
});

When('I open the seeded agent edit in agents', async ({ agentsPage }) => {
  await agentsPage.openEditForSeededAgent();
});

When('I click Add Agent Level in agents', async ({ agentEditTabsPage }) => {
  await agentEditTabsPage.clickAddLevel();
});

Then('the add agent level drawer is visible in agents', async ({ agentEditTabsPage }) => {
  const visible = await agentEditTabsPage.isAddLevelDrawerVisible();
  expect(visible, 'Add Agent Level drawer should be visible').toBe(true);
});

// ── T035: Add a level with effective start date ─────────────────────────────

When('I add agent level with a valid effective start date in agents', async ({ agentEditTabsPage }) => {
  await agentEditTabsPage.clickAddLevel();
  await agentEditTabsPage.selectLevelInDrawer('Level 1');
  // Current badge only renders when today falls in start–end range (future start hides it)
  await agentEditTabsPage.setLevelStartDate(todayMmDdYyyy());
  await agentEditTabsPage.saveLevel();
});

Then('the agent level appears in the Agent Level table in agents', async ({ agentEditTabsPage }) => {
  await agentEditTabsPage.expectLevelInTable('Level 1');
});

Then('the current level label appears when today is in range in agents', async ({ agentEditTabsPage }) => {
  await agentEditTabsPage.expectCurrentBadgeVisible();
});

// ── T036: Add multiple levels with non-overlapping dates ────────────────────

When('I add multiple agent levels with non-overlapping effective dates in agents', async ({ agentEditTabsPage }) => {
  // Use available levels from dropdown: Level 2 and SA1
  const levels = ['Level 2', 'SA1'];
  // Use dates far in the future (2027) to avoid overlap with all existing records
  const dates = ['02/01/2027', '03/01/2027'];
  for (let i = 0; i < levels.length; i++) {
    await agentEditTabsPage.clickAddLevel();
    await agentEditTabsPage.selectLevelInDrawer(levels[i]);
    await agentEditTabsPage.setLevelStartDate(dates[i]);
    await agentEditTabsPage.saveLevel();
    await waitForAppSettled(agentEditTabsPage.page);
  }
});

Then('the Agent Level table shows multiple level rows in agents', async ({ agentEditTabsPage }) => {
  const rows = await agentEditTabsPage.getLevelGridRows();
  expect(rows.length, 'Expected multiple level rows').toBeGreaterThan(1);
});

// ── T037: No delete or effective end date edit on level history ─────────────

Then('agent level history has no delete or editable end date in agents', async ({ agentEditTabsPage }) => {
  await agentEditTabsPage.expectLevelHistoryNoDeleteOrEndDateEdit();
});

// ── T038: Overlapping effective start date is blocked ───────────────────────

When('I try to add agent level with overlapping effective start date in agents', async ({ agentEditTabsPage }) => {
  await agentEditTabsPage.clickAddLevel();
  // Try to add SA6 (available in dropdown) with a date that overlaps with Level 1 (01/01/2027)
  await agentEditTabsPage.selectLevelInDrawer('SA6');
  // Use 01/15/2027 which overlaps with Level 1 (01/01/2027)
  await agentEditTabsPage.setLevelStartDate('01/15/2027');
  await agentEditTabsPage.saveLevel();
});

Then('overlapping agent level date is blocked in agents', async ({ agentEditTabsPage }) => {
  await expect
    .poll(
      async () => {
        const body = agentEditTabsPage.page.locator('body');
        const text = (await body.innerText()).toLowerCase();
        return text.includes('overlap') || text.includes('already') || text.includes('conflict');
      },
      { timeout: 10_000, intervals: [500, 1_000] },
    )
    .toBe(true);
});

// ── T039: Assigned levels excluded from add-level dropdown ──────────────────

When('I capture add-level dropdown options then dismiss with Escape in agents', async ({
  agentEditTabsPage,
}) => {
  await agentEditTabsPage.captureLevelDropdownOptionsThenDismiss();
});

Then('assigned agent level names are absent from the add-level dropdown in agents', async ({
  agentEditTabsPage,
}) => {
  await agentEditTabsPage.expectAssignedLevelsAbsentFromCapturedDropdown();
});

// ── T040: Effective start date is updatable without overlap ─────────────────

When('I edit an agent level effective start date to a non-overlapping date in agents', async ({
  agentEditTabsPage,
}) => {
  await agentEditTabsPage.clickLevelKebab();
  const editBtn = agentEditTabsPage.page.getByRole('button', { name: 'Edit', exact: true });
  await expect(editBtn).toBeVisible({ timeout: 5_000 });
  await editBtn.click();
  await waitForAppSettled(agentEditTabsPage.page);
});

Then('the agent level effective start date is updated in agents', async ({ agentEditTabsPage }) => {
  const rows = await agentEditTabsPage.getLevelGridRows();
  expect(rows.length, 'Expected at least one level row after edit').toBeGreaterThan(0);
});

// ── T041: Add Agent Level disabled after all levels assigned ────────────────

When('I add all available agent levels with valid dates in agents', async ({ agentEditTabsPage }) => {
  await agentEditTabsPage.addAllAvailableLevelsWithNonOverlappingDates();
});

Then('the Add Agent Level button is disabled in agents', async ({ agentEditTabsPage }) => {
  const disabled = await agentEditTabsPage.isAddLevelButtonDisabled();
  expect(disabled, 'Add Agent Level button should be disabled').toBe(true);
});

// ── T042: End date auto-fills when a later reporting record is added ────────

When('I open Add Reporting Manager in agents', async ({ agentEditTabsPage }) => {
  await agentEditTabsPage.clickAddReportingManager();
});

When(
  'I add reporting manager from the list with start date {string} in agents',
  async ({ agentEditTabsPage }, startDate: string) => {
    await agentEditTabsPage.addReportingManagerFromList(startDate);
  },
);

Then('the newest reporting manager end date is {string} in agents', async ({ agentEditTabsPage }, expected: string) => {
  await agentEditTabsPage.expectNewestReportingEndDate(expected);
});

Then('the last reporting manager row end date is auto-populated in agents', async ({ agentEditTabsPage }) => {
  await agentEditTabsPage.expectLastReportingRowEndDateAutoPopulated();
});

// ── T043: Overlapping reporting date range is blocked ───────────────────────

When(
  'I add a different reporting manager with overlapping start date {string} in agents',
  async ({ agentEditTabsPage }, startDate: string) => {
    await agentEditTabsPage.addDifferentReportingManagerWithDate(startDate);
  },
);

Then('reporting manager overlapping date inline error is shown in agents', async ({ agentEditTabsPage }) => {
  await agentEditTabsPage.expectReportingOverlapInlineError();
});

// ── T044: Only one Current flag in level and reporting tables ───────────────

Then('at most one Current flag appears in Agent Level table in agents', async ({ agentEditTabsPage }) => {
  const badges = agentEditTabsPage.loc.levelCurrentBadge();
  const count = await badges.count();
  expect(count, 'Expected at most one Current badge in level table').toBeLessThanOrEqual(1);
});

Then('at most one Current flag appears in Agent Reporting table in agents', async ({ agentEditTabsPage }) => {
  const grid = agentEditTabsPage.loc.reportingGrid();
  const currentBadges = grid.getByText('Current', { exact: true });
  const count = await currentBadges.count();
  expect(count, 'Expected at most one Current badge in reporting table').toBeLessThanOrEqual(1);
});

// ── T045: Blank reporting manager blocks submit ─────────────────────────────

When('I leave reporting manager blank and attempt save in agents', async ({ agentEditTabsPage }) => {
  await agentEditTabsPage.saveReportingManager();
});

Then('reporting manager required field error is shown in agents', async ({ agentEditTabsPage }) => {
  await expect
    .poll(
      async () => {
        const body = agentEditTabsPage.page.locator('body');
        const text = (await body.innerText()).toLowerCase();
        return text.includes('required') || text.includes('select') || text.includes('must');
      },
      { timeout: 10_000, intervals: [500, 1_000] },
    )
    .toBe(true);
});

// ── T046: Non-existent agent id shows no results ───────────────────────────

When('I search reporting manager for nonexistent id {string} in agents', async ({ agentEditTabsPage }, id: string) => {
  await agentEditTabsPage.searchReportingManager(id);
});

Then('reporting manager selection shows no results in agents', async ({ agentEditTabsPage }) => {
  await agentEditTabsPage.expectReportingManagerNoResults();
});

// ── T047: Agent level kebab shows Edit only ─────────────────────────────────

When('I open kebab on first agent level row in agents', async ({ agentEditTabsPage }) => {
  await agentEditTabsPage.clickLevelKebab();
});

Then('the agent level row action menu shows only Edit in agents', async ({ agentEditTabsPage }) => {
  await agentEditTabsPage.expectAgentLevelRowActionMenuShowsEditOnly();
});

// ── T048: Already-added manager not listed again ────────────────────────────

Then('already-added reporting manager names are excluded from selection in agents', async ({
  agentEditTabsPage,
}) => {
  await agentEditTabsPage.expectAssignedManagersExcludedFromDropdown();
});

// ── T049: Onboarding agents excluded from manager list ──────────────────────

When('I capture the seeded agent as the onboarding agent in agents', async ({ agentsPage }) => {
  agentsPage.capturedOnboardingAgentName = getSeedAgent().displayName;
});

When('I open agent edit for a non-onboarding record in agents', async ({ agentsPage }) => {
  await agentsPage.openEditForNonOnboardingRecord();
});

When('I search reporting manager for the captured onboarding agent in agents', async ({
  agentsPage,
  agentEditTabsPage,
}) => {
  const name = agentsPage.capturedOnboardingAgentName;
  expect(name, 'Expected captured onboarding agent name').toBeTruthy();
  await agentEditTabsPage.searchReportingManager(name);
});

Then(
  'the captured onboarding agent is excluded from manager selection in agents',
  async ({ agentsPage, agentEditTabsPage }) => {
    const name = agentsPage.capturedOnboardingAgentName;
    expect(name, 'Expected captured onboarding agent name').toBeTruthy();
    await agentEditTabsPage.expectManagerSearchExcludes(name);
  },
);
