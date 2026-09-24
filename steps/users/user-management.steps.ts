import { expect } from '@playwright/test';
import { attachSmokeScreenshot } from '../../utils/smokeCapture';
import { When, Then, test } from '../fixtures';

When('I open the User Management dashboard', async ({ userManagementPage }) => {
  await userManagementPage.gotoDashboard();
  await userManagementPage.expectDashboardReady();
});

When('I click add user', async ({ userManagementPage }) => {
  await userManagementPage.clickAddUser();
});

When('I fill mandatory fields only', async ({ userManagementPage }) => {
  await userManagementPage.fillMandatoryFieldsOnly();
});

When('I select role {string}', async ({ userManagementPage }, role: string) => {
  await userManagementPage.selectRole(role);
});

When('I click save button', async ({ userManagementPage }) => {
  await userManagementPage.clickSaveButton();
});

Then('the user is saved and I am on the User Management dashboard', async ({ userManagementPage }) => {
  await userManagementPage.expectOnDashboard();
});

When('I fill email with invalid value', async ({ userManagementPage }) => {
  await userManagementPage.fillEmailField('invalid-email');
});

When('I fill email with long valid format', async ({ userManagementPage }) => {
  await userManagementPage.fillLongValidFormatEmail();
});

When('I fill valid email', async ({ userManagementPage }) => {
  await userManagementPage.fillValidEmail();
});

When('I fill valid firstname and lastname', async ({ userManagementPage }) => {
  await userManagementPage.fillValidFirstAndLastName();
});

Then('I see email validation error', async ({ userManagementPage }) => {
  await userManagementPage.expectAddUserEmailValidationError();
});

Then('I see name validation errors', async ({ userManagementPage }) => {
  await userManagementPage.expectAddUserNameValidationErrors();
});

When('I fill name with special characters', async ({ userManagementPage }) => {
  await userManagementPage.fillNameWithSpecialCharacters();
});

When('I fill mandatory fields with duplicate email', async ({ userManagementPage }) => {
  await userManagementPage.fillMandatoryFieldsOnly({ email: 'existing@pieq.ai' });
});

Then('I see duplicate email error', async ({ userManagementPage }) => {
  await userManagementPage.expectDuplicateEmailError();
});

When('I search the grid for {string}', async ({ userManagementPage }, query: string) => {
  await userManagementPage.searchGrid(query);
});

Then('the grid search response is {string}', async ({ userManagementPage }, result: string) => {
  await userManagementPage.expectGridSearchResult(
    result === 'has matches' ? 'has matches' : 'no matches',
  );
});

When('I filter the grid by {string} with value {string}', async (
  { userManagementPage },
  column: string,
  value: string,
) => {
  await userManagementPage.filterGridByColumn(column, value);
});

When('I filter by {string} with value {string}', async (
  { userManagementPage },
  column: string,
  value: string,
) => {
  await userManagementPage.filterGridByColumn(column, value);
});

Then('all visible grid rows have status {string}', async ({ userManagementPage }, status: string) => {
  await userManagementPage.expectAllVisibleRowsHaveStatus(status);
});

Then('all visible rows have status {string}', async ({ userManagementPage }, status: string) => {
  await userManagementPage.expectAllVisibleRowsHaveStatus(status);
});

Then('all visible grid rows have role {string}', async ({ userManagementPage }, role: string) => {
  await userManagementPage.expectAllVisibleRowsHaveRole(role);
});

When('I clear all grid filters', async ({ userManagementPage }) => {
  await userManagementPage.clearAllFilters();
});

Then('the grid has records displayed', async ({ userManagementPage }) => {
  await userManagementPage.expectGridHasRecords();
});

Then('grid filters are cleared', async ({ userManagementPage }) => {
  await userManagementPage.expectFiltersCleared();
});

Then('registered users KPI matches total records count', async ({ userManagementPage }) => {
  await userManagementPage.expectKpiMatchesTotalRecords();
});

Then('active users KPI is consistent with registered users', async ({ userManagementPage }) => {
  await userManagementPage.expectActiveUsersKpiConsistent();
});

Then('the grid shows zero total records', async ({ userManagementPage }) => {
  await userManagementPage.expectZeroTotalRecords();
});

Then('the grid displays no records found', async ({ userManagementPage }) => {
  await userManagementPage.expectNoRecordsFoundVisible();
});

When('I toggle off grid column {string}', async ({ userManagementPage }, column: string) => {
  await userManagementPage.toggleColumnOff(column);
});

Then('grid column {string} is not visible', async ({ userManagementPage }, column: string) => {
  await userManagementPage.expectColumnNotVisible(column);
});

Then('Reset the column', async ({ userManagementPage }) => {
  await userManagementPage.resetColumn();
});

When('I sort column {string} ascending', async ({ userManagementPage }, column: string) => {
  await userManagementPage.sortColumnAscending(column);
});

When('I sort column {string} descending', async ({ userManagementPage }, column: string) => {
  await userManagementPage.sortColumnDescending(column);
});

Then('the grid is sorted by {string} ascending', async ({ userManagementPage }, column: string) => {
  await userManagementPage.expectGridSortedBy(column, 'asc');
});

Then('the grid is sorted by {string} descending', async ({ userManagementPage }, column: string) => {
  await userManagementPage.expectGridSortedBy(column, 'desc');
});

When('I search for user to edit', async ({ userManagementPage }) => {
  await userManagementPage.searchForUserToEditWithFallback();
});

When('I open edit for the first user from active search', async ({ userManagementPage }) => {
  await userManagementPage.openEditForFirstUserFromActiveSearch();
});

When('I apply conditional edit form updates', async ({ userManagementPage }) => {
  await userManagementPage.applyConditionalEditFormUpdates();
});

When('I save edited user', async ({ userManagementPage }) => {
  await userManagementPage.saveEditedUser();
});

Then('I see validation errors', async ({ userManagementPage }) => {
  await userManagementPage.expectAddUserValidationErrors();
});

Then('I capture a screenshot of the add user validation errors', async ({ page }) => {
  await attachSmokeScreenshot(page, test.info(), 'add-user-validation-errors');
});

Then('I capture a screenshot of the user management page', async ({ page }) => {
  await attachSmokeScreenshot(page, test.info(), 'user-management-dashboard');
});
