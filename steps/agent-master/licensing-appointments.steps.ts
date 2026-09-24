import { expect } from '@playwright/test';
import { When, Then } from '../fixtures';
import { waitForAppSettled } from '../../utils/pageLoader';
import { setLicensingAgentEditUrl, getLicensingAgentEditUrl } from '../../utils/agents/agentContext';

// ── T051: Search Carrier Appointments by carrier name ───────────────────────

When('I open Licensing and Appointments tab in agents', async ({ agentEditTabsPage }) => {
  await agentEditTabsPage.openLicensingAppointmentsTab();
});

When('I search carrier appointments for an existing carrier name in agents', async ({ agentEditTabsPage }) => {
  await agentEditTabsPage.searchCarrierAppointments('Aetna');
});

Then('the carrier appointments grid shows only matching carrier rows in agents', async ({ agentEditTabsPage }) => {
  await agentEditTabsPage.expectAppointmentGridShowsMatchingRows('Aetna');
});

// ── T052: Sort Carrier Appointments columns asc and desc ────────────────────

When('I sort carrier appointments column {string} ascending in agents', async ({ agentEditTabsPage }, column: string) => {
  await agentEditTabsPage.sortAppointmentGridColumn(column, 'asc');
});

Then(
  'the carrier appointments grid is sorted by {string} ascending in agents',
  async ({ agentEditTabsPage }, column: string) => {
    await agentEditTabsPage.expectAppointmentGridSorted(column, 'asc');
  },
);

When(
  'I sort carrier appointments column {string} descending in agents',
  async ({ agentEditTabsPage }, column: string) => {
    await agentEditTabsPage.sortAppointmentGridColumn(column, 'desc');
  },
);

Then(
  'the carrier appointments grid is sorted by {string} descending in agents',
  async ({ agentEditTabsPage }, column: string) => {
    await agentEditTabsPage.expectAppointmentGridSorted(column, 'desc');
  },
);

// ── T053: Search with nonexistent keyword shows no records ──────────────────

When('I search carrier appointments for {string} in agents', async ({ agentEditTabsPage }, query: string) => {
  const searchInput = agentEditTabsPage.page.getByRole('textbox', { name: 'Search data grid' });
  await expect(searchInput).toBeVisible({ timeout: 10_000 });
  await searchInput.fill(query);
  await waitForAppSettled(agentEditTabsPage.page);
});

When('I clear carrier appointments search in agents', async ({ agentEditTabsPage }) => {
  const searchInput = agentEditTabsPage.page.getByRole('textbox', { name: 'Search data grid' });
  await expect(searchInput).toBeVisible({ timeout: 10_000 });
  await searchInput.fill('');
  await waitForAppSettled(agentEditTabsPage.page);
});

Then('the carrier appointments grid shows no records found in agents', async ({ agentEditTabsPage }) => {
  await agentEditTabsPage.expectAppointmentGridShowsNoRecords();
});

// ── T054: Add Appointments opens drawer ────────────────────────────────────

When('I click Add Appointments in agents', async ({ agentEditTabsPage }) => {
  await agentEditTabsPage.clickAddAppointment();
});

Then('the add appointment drawer is visible in agents', async ({ agentEditTabsPage }) => {
  const visible = await agentEditTabsPage.isAppointmentDrawerVisible();
  expect(visible, 'Add appointment drawer should be visible').toBe(true);
});

// ── T055: Delete appointment via kebab menu ─────────────────────────────────

When('I open kebab on first carrier appointment row in agents', async ({ agentEditTabsPage }) => {
  const grid = agentEditTabsPage.page.getByRole('grid', { name: 'Data grid' });
  const firstRow = grid.getByRole('row').nth(1);
  const kebab = firstRow.locator('button').last();
  await kebab.click();
  await agentEditTabsPage.page.waitForTimeout(300);
});

Then('the appointment action menu includes Delete in agents', async ({ agentEditTabsPage }) => {
  const deleteOption = agentEditTabsPage.page.getByRole('button', { name: 'Delete', exact: true });
  await expect(deleteOption).toBeVisible({ timeout: 5_000 });
});

// ── T056: Edit appointment via kebab menu ───────────────────────────────────

When('I choose Edit from appointment action menu in agents', async ({ agentEditTabsPage }) => {
  const editOption = agentEditTabsPage.page.getByRole('button', { name: 'Edit', exact: true });
  await editOption.click();
  await waitForAppSettled(agentEditTabsPage.page);
});

Then('the edit appointment drawer or page is visible in agents', async ({ agentEditTabsPage }) => {
  const drawer = agentEditTabsPage.page.getByRole('dialog');
  await expect(drawer).toBeVisible({ timeout: 10_000 });
});

// ── T057: Sync refreshes Carrier Appointments table ────────────────────────

When('I click sync on carrier appointments grid in agents', async ({ agentEditTabsPage }) => {
  await agentEditTabsPage.clickAppointmentRefresh();
});

Then('the carrier appointments grid is refreshed in agents', async ({ agentEditTabsPage }) => {
  await agentEditTabsPage.expectAppointmentGridRefreshed();
});

// ── T058: Agent Name field is read-only with lock ──────────────────────────

Then('the appointment Agent Name field is read-only in agents', async ({ agentEditTabsPage }) => {
  await agentEditTabsPage.expectAppointmentAgentNameReadOnly();
});

// ── T059: Save disabled when carrier not selected ──────────────────────────

Then('the appointment Save button is disabled without carrier in agents', async ({ agentEditTabsPage }) => {
  const disabled = await agentEditTabsPage.isAppointmentSaveDisabled();
  expect(disabled, 'Appointment Save button should be disabled without carrier').toBe(true);
});

// ── T060: Carrier dropdown lists active carriers ───────────────────────────

When('I open the appointment Carrier dropdown in agents', async ({ agentEditTabsPage }) => {
  await agentEditTabsPage.openAppointmentCarrierDropdown();
});

Then('the appointment Carrier dropdown lists active carriers in agents', async ({ agentEditTabsPage }) => {
  const options = await agentEditTabsPage.getAppointmentCarrierOptions();
  expect(options.length, 'Expected carrier options in dropdown').toBeGreaterThan(0);
});

// ── T061: Appointment Date calendar picker opens ───────────────────────────

When('I open the appointment date picker in agents', async ({ agentEditTabsPage }) => {
  await agentEditTabsPage.openAppointmentDatePicker();
});

Then('the appointment date picker is visible in agents', async ({ agentEditTabsPage }) => {
  const visible = await agentEditTabsPage.isAppointmentDatePickerVisible();
  expect(visible, 'Appointment date picker should be visible').toBe(true);
});

// ── T062: Close drawer without saving ──────────────────────────────────────

When('I close the add appointment drawer in agents', async ({ agentEditTabsPage }) => {
  await agentEditTabsPage.closeAppointmentDrawer();
});

Then('the add appointment drawer is closed in agents', async ({ agentEditTabsPage }) => {
  const visible = await agentEditTabsPage.isAppointmentDrawerVisible();
  expect(visible, 'Add appointment drawer should be closed').toBe(false);
});

// ── T063: Notes over 255 characters show validation ────────────────────────

When('I enter notes exceeding 255 characters on appointment form in agents', async ({ agentEditTabsPage }) => {
  await agentEditTabsPage.fillAppointmentRequiredFields();
  await agentEditTabsPage.fillAppointmentNotesExceedingMaxLength();
});

When('I attempt to save the appointment in agents', async ({ agentEditTabsPage }) => {
  await agentEditTabsPage.saveAppointmentWithConfirm();
});

// Note: "I see agent validation {string} in agents" is defined in edit-agent.steps.ts

// ── T064: Save carrier appointment successfully ────────────────────────────

When('I capture carrier appointments record count in agents', async ({ agentEditTabsPage }) => {
  const footer = agentEditTabsPage.page.getByText(/showing all \d+ records/i);
  const text = await footer.innerText().catch(() => '0');
  const match = text.match(/\d+/);
  agentEditTabsPage._capturedAppointmentCount = match ? parseInt(match[0], 10) : 0;
});

When('I add a new carrier appointment with required fields in agents', async ({ agentEditTabsPage, agentFormPage }) => {
  await agentEditTabsPage.addCarrierAppointmentWithRequiredFields();
  await agentFormPage.captureSuccessToast();
});

Then('a success notification appears for appointment save in agents', async ({ agentFormPage }) => {
  await agentFormPage.expectSuccessToast();
});

Then('the carrier appointments record count increased by {int} in agents', async ({ agentEditTabsPage }, delta: number) => {
  await waitForAppSettled(agentEditTabsPage.page);
  const footer = agentEditTabsPage.page.getByText(/showing all \d+ records/i);
  const text = await footer.innerText().catch(() => '0');
  const match = text.match(/\d+/);
  const currentCount = match ? parseInt(match[0], 10) : 0;
  expect(
    currentCount,
    `Record count should have increased by ${delta}`,
  ).toBeGreaterThanOrEqual(agentEditTabsPage._capturedAppointmentCount + delta);
});

// ── T065: Already-appointed carrier excluded from dropdown ──────────────────

Then('carriers already in appointments are excluded from Carrier dropdown in agents', async ({
  agentEditTabsPage,
}) => {
  await agentEditTabsPage.expectAppointedCarriersExcludedFromDropdown();
});

// ── Shared agent edit URL for sequential seed → search/sort ────────────────

When('I capture current agent edit URL in agents', async ({ agentsPage }) => {
  setLicensingAgentEditUrl(agentsPage.currentUrl());
});

When('I open captured agent edit URL in agents', async ({ agentsPage }) => {
  const url = getLicensingAgentEditUrl();
  if (url) {
    await agentsPage.gotoUrl(url);
    await agentsPage.expectOnEditPage();
  } else {
    await agentsPage.openList();
    await agentsPage.openEditByRowClick();
  }
});
