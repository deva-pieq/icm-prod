import { attachSmokeScreenshot } from '../../utils/smokeCapture';
import { Then, When, test } from '../fixtures';

async function capture(page: import('@playwright/test').Page, label: string) {
  await attachSmokeScreenshot(page, test.info(), label);
}

When('I smoke navigate user management list', async ({ userManagementPage, page }) => {
  await userManagementPage.openViaSidebar();
  await capture(page, 'user-management-list');
});

Then('the user management list page header is visible on smoke', async ({ userManagementPage }) => {
  await userManagementPage.smokeExpectListHeader();
});

When('I smoke navigate user management add user', async ({ userManagementPage, page }) => {
  await userManagementPage.clickAddUser();
  await capture(page, 'user-management-add');
});

Then('the add user page header is visible on smoke', async ({ userManagementPage }) => {
  await userManagementPage.smokeExpectAddHeader();
});

When('I smoke navigate back to user management list', async ({ userManagementPage, page }) => {
  await userManagementPage.openViaSidebar();
  await capture(page, 'user-management-list-back');
});

When('I smoke navigate user management edit from grid', async ({ userManagementPage, page }) => {
  await userManagementPage.openViaSidebar();
  await userManagementPage.openEditForFirstGridRow();
  await capture(page, 'user-management-edit');
});

When('I smoke open user management edit by clicking grid record', async ({ userManagementPage, page }) => {
  await userManagementPage.smokeOpenEditByRowClick();
  await capture(page, 'user-management-edit-row');
});

When('I smoke open user management edit via action kebab', async ({ userManagementPage, page }) => {
  await userManagementPage.openEditForFirstGridRow();
  await capture(page, 'user-management-edit-kebab');
});

Then('the edit user page header is visible on smoke', async ({ userManagementPage }) => {
  await userManagementPage.smokeExpectEditHeader();
});
