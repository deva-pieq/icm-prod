import { expect } from '@playwright/test';
import { Given, Then, When } from '../fixtures';

Given('I open the miscellaneous charges page in misc charges', async ({ miscellaneousChargesPage }) => {
  await miscellaneousChargesPage.open();
});

When('I click the Add Miscellaneous Charge button in misc charges', async ({ miscellaneousChargesPage }) => {
  await miscellaneousChargesPage.openAddModal();
});

When('I fill misc charges amount with {string}', async ({ miscellaneousChargesPage }, amount: string) => {
  await miscellaneousChargesPage.fillAmount(amount);
});

When('I fill misc charges description with {string}', async ({ miscellaneousChargesPage }, description: string) => {
  await miscellaneousChargesPage.fillDescription(description);
});

When('I click the modal close button in misc charges', async ({ miscellaneousChargesPage }) => {
  await miscellaneousChargesPage.clickClose();
});

When('I click the modal Cancel button in misc charges', async ({ miscellaneousChargesPage }) => {
  await miscellaneousChargesPage.clickCancel();
});

When('I click Keep Editing in the Cancel Changes dialog', async ({ miscellaneousChargesPage }) => {
  await miscellaneousChargesPage.clickKeepEditing();
});

When('I click Cancel in the Cancel Changes dialog', async ({ miscellaneousChargesPage }) => {
  await miscellaneousChargesPage.clickCancelConfirm();
});

When('I save a miscellaneous charge for agent {string} with amount {string} and description {string}', async (
  { miscellaneousChargesPage },
  agentCode: string,
  amount: string,
  description: string,
) => {
  await miscellaneousChargesPage.saveCharge(agentCode, amount, description);
});

When('I select the first row in miscellaneous charges grid', async ({ miscellaneousChargesPage }) => {
  await miscellaneousChargesPage.selectFirstRow();
});

When('I click the select-all checkbox in miscellaneous charges', async ({ miscellaneousChargesPage }) => {
  await miscellaneousChargesPage.expectSelectAllWorks();
});

Then('the miscellaneous charges heading {string} is displayed', async ({ miscellaneousChargesPage }, heading: string) => {
  await expect(miscellaneousChargesPage.loc.heading()).toBeVisible();
  await expect(miscellaneousChargesPage.loc.heading()).toContainText(heading);
});

Then('the Add Miscellaneous Charge button is visible in misc charges', async ({ miscellaneousChargesPage }) => {
  await expect(miscellaneousChargesPage.loc.addButton()).toBeVisible();
});

Then('the miscellaneous charges grid shows all expected columns', async ({ miscellaneousChargesPage }) => {
  await miscellaneousChargesPage.expectGridColumns();
});

Then('the miscellaneous charges grid shows the empty state or has records', async ({ miscellaneousChargesPage }) => {
  const grid = miscellaneousChargesPage.loc.grid();
  await expect(grid).toBeVisible();
  const footer = await miscellaneousChargesPage.loc.footer().innerText();
  if (footer.includes('0 records')) {
    await expect(miscellaneousChargesPage.loc.noRecords()).toBeVisible();
  }
});

Then('the miscellaneous charges search placeholder contains {string}', async ({ miscellaneousChargesPage }, text: string) => {
  const search = miscellaneousChargesPage.loc.searchInput();
  await expect(search).toBeVisible();
  await expect(search).toHaveAttribute('placeholder', new RegExp(text, 'i'));
});

Then('the miscellaneous charges modal heading is displayed', async ({ miscellaneousChargesPage }) => {
  await miscellaneousChargesPage.expectModalHeading();
});

Then('the miscellaneous charges Save button is disabled', async ({ miscellaneousChargesPage }) => {
  await miscellaneousChargesPage.expectSaveDisabled();
});

Then('the miscellaneous charges transaction date defaults to today', async ({ miscellaneousChargesPage }) => {
  await miscellaneousChargesPage.expectTransactionDateDefaultsToToday();
});

Then('the miscellaneous charges modal is not visible', async ({ miscellaneousChargesPage }) => {
  await expect(miscellaneousChargesPage.modal.dialog()).toBeHidden();
});

Then('the Cancel Changes confirmation dialog is displayed', async ({ miscellaneousChargesPage }) => {
  await miscellaneousChargesPage.expectCancelChangesDialog();
});

Then('the miscellaneous charges modal is still visible', async ({ miscellaneousChargesPage }) => {
  await expect(miscellaneousChargesPage.modal.dialog()).toBeVisible();
});

Then('the miscellaneous charges grid shows records with agent {string}', async ({ miscellaneousChargesPage }, agentName: string) => {
  await expect(miscellaneousChargesPage.loc.grid()).toBeVisible();
  const gridText = await miscellaneousChargesPage.loc.grid().innerText();
  expect(gridText.toLowerCase()).toContain(agentName.toLowerCase());
});

Then('the Process button is disabled in misc charges', async ({ miscellaneousChargesPage }) => {
  await miscellaneousChargesPage.expectProcessDisabled();
});

Then('the Cancel batch button is disabled in misc charges', async ({ miscellaneousChargesPage }) => {
  await miscellaneousChargesPage.expectCancelBatchDisabled();
});

Then('the Process button is enabled in misc charges', async ({ miscellaneousChargesPage }) => {
  await miscellaneousChargesPage.expectProcessEnabled();
});

Then('the Cancel batch button is enabled in misc charges', async ({ miscellaneousChargesPage }) => {
  await miscellaneousChargesPage.expectCancelBatchEnabled();
});

Then('the miscellaneous charges export button is visible', async ({ miscellaneousChargesPage }) => {
  await miscellaneousChargesPage.expectExportButton();
});

Then('the miscellaneous charges refresh button is visible', async ({ miscellaneousChargesPage }) => {
  await miscellaneousChargesPage.expectRefreshButton();
});

Then('the miscellaneous charges columns toggle is visible', async ({ miscellaneousChargesPage }) => {
  await miscellaneousChargesPage.expectColumnsToggle();
});

Then('the miscellaneous charges footer shows record count', async ({ miscellaneousChargesPage }) => {
  await miscellaneousChargesPage.expectFooterRecordCount();
});

Then('the miscellaneous charges grid shows saved charge', async ({ miscellaneousChargesPage }) => {
  await expect(miscellaneousChargesPage.loc.grid()).toBeVisible();
  const footer = await miscellaneousChargesPage.loc.footer().innerText();
  expect(footer).not.toMatch(/0 records/i);
});

When('I click the Delete button on the first row in misc charges', async ({ miscellaneousChargesPage }) => {
  await miscellaneousChargesPage.clickDeleteFirstRow();
});

Then('the miscellaneous charge is deleted', async ({ miscellaneousChargesPage }) => {
  const footer = await miscellaneousChargesPage.loc.footer().innerText();
  expect(footer).not.toMatch(/250/);
});

When('I fill misc charges search with {string}', async ({ miscellaneousChargesPage }, query: string) => {
  const search = miscellaneousChargesPage.loc.searchInput();
  await expect(search).toBeVisible();
  await search.fill(query);
});

Then('the miscellaneous charges grid shows filtered results for agent {string}', async ({ miscellaneousChargesPage }, agentName: string) => {
  await expect(miscellaneousChargesPage.loc.grid()).toBeVisible();
  const gridText = await miscellaneousChargesPage.loc.grid().innerText();
  expect(gridText.toLowerCase()).toContain(agentName.toLowerCase());
});

When('I filter misc charges status by {string}', async ({ miscellaneousChargesPage }, status: string) => {
  const statusFilter = miscellaneousChargesPage.loc.statusFilter();
  await expect(statusFilter).toBeVisible();
  await statusFilter.click();
  const option = miscellaneousChargesPage.loc.statusFilterOption(status);
  await expect(option).toBeVisible();
  await option.click();
});
