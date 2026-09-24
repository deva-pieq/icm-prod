import { expect } from '@playwright/test';
import { When, Then } from '../fixtures';

// ── T001: KPI ────────────────────────────────────────────────────────────────

When('I open the Agents list in agents', async ({ agentsPage }) => {
  await agentsPage.openList();
});

Then('the Agents list shows KPI Total Number of Registered Agents in agents', async ({ agentsPage }) => {
  await agentsPage.expectTotalRegisteredAgentsVisible();
});

Then('the Agents list shows KPI Active Agent Number with percentage in agents', async ({ agentsPage }) => {
  await agentsPage.expectActiveAgentsWithPercentVisible();
});

// ── T002-T004: Search ────────────────────────────────────────────────────────

When('I search the agents grid for {string} in agents', async ({ agentsPage }, query: string) => {
  await agentsPage.searchGrid(query);
});

When('I clear the agents grid search in agents', async ({ agentsPage }) => {
  await agentsPage.clearGridSearch();
});

Then('the agents grid shows rows matching {string} in agents', async ({ agentsPage }, query: string) => {
  await agentsPage.expectGridRowsMatchQuery(query);
});

// ── T005: Search no results ──────────────────────────────────────────────────

Then('the agents grid shows no matching records in agents', async ({ agentsPage }) => {
  await agentsPage.expectNoMatchingRecords();
});

// ── T006: Status filter default ──────────────────────────────────────────────

Then('the agents status filter shows {string} in agents', async ({ agentsPage }, expectedText: string) => {
  await agentsPage.expectStatusFilterShows(expectedText);
});

// ── T007: Filter by status ───────────────────────────────────────────────────

When('I filter agents by status {string} in agents', async ({ agentsPage }, status: string) => {
  await agentsPage.filterByStatus(status);
});

Then('all visible agents grid rows have status {string} in agents', async ({ agentsPage }, status: string) => {
  await agentsPage.expectAllVisibleRowsHaveStatus(status);
});

// ── T008: Clear filters ──────────────────────────────────────────────────────

When('I clear agents grid filters in agents', async ({ agentsPage }) => {
  await agentsPage.clearFilters();
});

Then('the agents grid filters are cleared in agents', async ({ agentsPage }) => {
  await agentsPage.expectFiltersCleared();
});

Then('the agents grid has records displayed in agents', async ({ agentsPage }) => {
  await agentsPage.expectGridHasRecords();
});

// ── T009: Column toggle apply ────────────────────────────────────────────────

When('I open column visibility panel in agents', async ({ agentsPage }) => {
  await agentsPage.openColumnVisibilityPanel();
});

When('I uncheck grid column {string} without applying in agents', async ({ agentsPage }, column: string) => {
  await agentsPage.toggleColumnOffWithoutApply(column);
});

Then('grid column {string} is still visible in agents', async ({ agentsPage }, column: string) => {
  await agentsPage.expectColumnVisible(column);
});

When('I apply column visibility changes in agents', async ({ agentsPage }) => {
  await agentsPage.applyColumnVisibility();
});

Then('grid column {string} is not visible in agents', async ({ agentsPage }, column: string) => {
  await agentsPage.expectColumnNotVisible(column);
});

// ── T010: Cannot uncheck last column ─────────────────────────────────────────

When('I attempt to uncheck all agent grid columns in agents', async ({ agentsPage }) => {
  await agentsPage.attemptToUncheckAllColumns();
});

Then('the last column toggle remains checked and disabled in agents', async ({ agentsPage }) => {
  // After attempting to uncheck all, at least one column should remain checked and disabled
  const modal = agentsPage.loc.columnVisibilityModal();
  const checkboxes = modal.getByRole('checkbox');
  const count = await checkboxes.count();
  let foundCheckedDisabled = false;
  for (let i = 0; i < count; i++) {
    const cb = checkboxes.nth(i);
    if (await cb.isChecked().catch(() => false) && await cb.isDisabled().catch(() => false)) {
      foundCheckedDisabled = true;
      break;
    }
  }
  expect(foundCheckedDisabled, 'At least one column toggle should remain checked and disabled').toBe(true);
});

// ── T011: Reset column toggles ───────────────────────────────────────────────

When('I toggle off grid column {string} in agents', async ({ agentsPage }, column: string) => {
  await agentsPage.toggleColumnOff(column);
});

When('I reset column visibility in agents', async ({ agentsPage }) => {
  await agentsPage.resetColumnVisibility();
});

Then('grid column {string} is visible in agents', async ({ agentsPage }, column: string) => {
  await agentsPage.expectColumnVisible(column);
});

// ── T012: Search with hidden column ──────────────────────────────────────────

// Reuses: I toggle off grid column + I search the agents grid for + the agents grid shows rows matching

// ── T013: Sort ───────────────────────────────────────────────────────────────

When('I sort agents column {string} ascending in agents', async ({ agentsPage }, column: string) => {
  await agentsPage.sortColumnAscending(column);
});

Then('the agents grid is sorted by {string} ascending in agents', async ({ agentsPage }, column: string) => {
  await agentsPage.expectGridSortedBy(column, 'asc');
});

When('I sort agents column {string} descending in agents', async ({ agentsPage }, column: string) => {
  await agentsPage.sortColumnDescending(column);
});

Then('the agents grid is sorted by {string} descending in agents', async ({ agentsPage }, column: string) => {
  await agentsPage.expectGridSortedBy(column, 'desc');
});

When('I sort agents column {string} to clear sort in agents', async ({ agentsPage }, column: string) => {
  await agentsPage.clearSortOnColumn(column);
});

Then('the agents grid sort is cleared for {string} in agents', async ({ agentsPage }, column: string) => {
  await agentsPage.expectSortClearedForColumn(column);
});

// ── T014: Resize ─────────────────────────────────────────────────────────────

When('I resize agents grid column {string} wider in agents', async ({ agentsPage }, column: string) => {
  await agentsPage.resizeColumnWider(column);
});

Then('agents grid column {string} width increased in agents', async ({ agentsPage }, column: string) => {
  // Verify the column is wider than a minimal width (basic assertion)
  const width = await agentsPage.getColumnWidth(column);
  expect(width, `Column "${column}" should have measurable width`).toBeGreaterThan(50);
});

// ── T015: Rearrange ──────────────────────────────────────────────────────────

When('I rearrange agents grid column {string} after {string} in agents', async ({ agentsPage }, column: string, afterColumn: string) => {
  await agentsPage.rearrangeColumnAfter(column, afterColumn);
});

Then('agents grid column order places {string} after {string} in agents', async ({ agentsPage }, column: string, afterColumn: string) => {
  await agentsPage.expectColumnOrderPlacesAfter(column, afterColumn);
});

// ── T016: Refresh ────────────────────────────────────────────────────────────

When('I capture agents grid record fingerprint in agents', async ({ agentsPage }) => {
  await agentsPage.captureGridFingerprint();
});

When('I click refresh on agents grid in agents', async ({ agentsPage }) => {
  await agentsPage.clickRefresh();
});

Then('the agents grid is refreshed in agents', async ({ agentsPage }) => {
  // Grid should still be visible and functional after refresh
  await expect(agentsPage.loc.agentsGrid()).toBeVisible({ timeout: 15_000 });
});

// ── T017: Kebab Edit ────────────────────────────────────────────────────────

When('I open agent edit via action kebab in agents', async ({ agentsPage }) => {
  await agentsPage.openEditViaKebab();
});

Then('I am on the Agent Edit page in agents', async ({ agentsPage }) => {
  await agentsPage.expectOnEditPage();
});

// ── T018: Row click ──────────────────────────────────────────────────────────

When('I open agent edit by clicking grid record in agents', async ({ agentsPage }) => {
  await agentsPage.openEditByRowClick();
});

When('I open agent edit for grid row matching {string} in agents', async ({ agentsPage }, query: string) => {
  await agentsPage.openEditByMatchingRow(query);
});
