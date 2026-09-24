import { attachSmokeScreenshot } from '../../utils/smokeCapture';
import { Then, When, test } from '../fixtures';

async function capture(page: import('@playwright/test').Page, label: string) {
  await attachSmokeScreenshot(page, test.info(), label);
}

When('I smoke navigate carriers list', async ({ carriersPage, page }) => {
  await carriersPage.openList();
  await capture(page, 'carriers-list');
});

Then('the carriers list page header is visible on smoke', async ({ carriersPage }) => {
  await carriersPage.smokeExpectListHeader();
});

When('I smoke navigate carriers create', async ({ carriersPage, page }) => {
  await carriersPage.openCreate();
  await capture(page, 'carriers-create');
});

Then('the create carrier page header is visible on smoke', async ({ carriersPage }) => {
  await carriersPage.smokeExpectCreateHeader();
});

When('I smoke navigate back to carriers list', async ({ carriersPage, page }) => {
  await carriersPage.backToList();
  await capture(page, 'carriers-list-back');
});

When('I smoke navigate carriers edit from grid', async ({ carriersPage, page }) => {
  await carriersPage.openList();
  await carriersPage.openEditFromGrid();
  await capture(page, 'carriers-edit');
});

When('I smoke open carriers edit by clicking grid record', async ({ carriersPage, page }) => {
  await carriersPage.openEditFromGrid();
  await capture(page, 'carriers-edit-row');
});

When('I smoke open carriers edit via action kebab', async ({ carriersPage, page }) => {
  await carriersPage.smokeOpenEditViaKebab();
  await capture(page, 'carriers-edit-kebab');
});

When('I smoke navigate agents list', async ({ agentsPage, page }) => {
  await agentsPage.openList();
  await capture(page, 'agents-list');
});

Then('the agents list page header is visible on smoke', async ({ agentsPage }) => {
  await agentsPage.smokeExpectListHeader();
});

When('I smoke navigate agents add', async ({ agentsPage, page }) => {
  await agentsPage.openAdd();
  await capture(page, 'agents-add');
});

Then('the add agent page header is visible on smoke', async ({ agentsPage }) => {
  await agentsPage.smokeExpectAddHeader();
});

When('I smoke navigate back to agents list', async ({ agentsPage, page }) => {
  await agentsPage.backToList();
  await capture(page, 'agents-list-back');
});

When('I smoke navigate agents edit from grid', async ({ agentsPage, page }) => {
  await agentsPage.openList();
  await agentsPage.openEditFromGrid();
  await capture(page, 'agents-edit');
});

When('I smoke open agents edit by clicking grid record', async ({ agentsPage, page }) => {
  await agentsPage.smokeOpenEditByRowClick();
  await capture(page, 'agents-edit-row');
});

When('I smoke open agents edit via action kebab', async ({ agentsPage, page }) => {
  await agentsPage.smokeOpenEditViaKebab();
  await capture(page, 'agents-edit-kebab');
});

Then('the edit agent page header is visible on smoke', async ({ agentsPage }) => {
  await agentsPage.smokeExpectEditHeader();
});

When('I smoke navigate products list', async ({ productsPage, page }) => {
  await productsPage.openList();
  await capture(page, 'products-list');
});

Then('the products list page header is visible on products smoke', async ({ productsPage }) => {
  await productsPage.smokeExpectListHeader();
});

When('I smoke navigate products create', async ({ productsPage, page }) => {
  await productsPage.openCreate();
  await capture(page, 'products-create');
});

Then('the create product page header is visible on products smoke', async ({ productsPage }) => {
  await productsPage.smokeExpectCreateHeader();
});

When('I smoke navigate back to products list', async ({ productsPage, page }) => {
  await productsPage.backToList();
  await capture(page, 'products-list-back');
});

When('I smoke navigate products edit from grid', async ({ productsPage, page }) => {
  await productsPage.openList();
  await productsPage.openEditFromGrid();
  await capture(page, 'products-edit');
});

When('I smoke open products edit by clicking grid record', async ({ productsPage, page }) => {
  await productsPage.smokeOpenEditByRowClick();
  await capture(page, 'products-edit-row');
});

When('I smoke open products edit via action kebab', async ({ productsPage, page }) => {
  await productsPage.smokeOpenEditViaKebab();
  await capture(page, 'products-edit-kebab');
});

Then('the edit product page header is visible on products smoke', async ({ productsPage }) => {
  await productsPage.smokeExpectEditHeader();
});

When('I smoke open product commission structure from edit page', async ({ productsPage, page }) => {
  await productsPage.openCommissionStructure();
  await capture(page, 'products-commission-structure');
});

When('I smoke navigate policies list', async ({ policiesPage, page }) => {
  await policiesPage.openList();
  await capture(page, 'policies-list');
});

Then('the policies list page header is visible on smoke', async ({ policiesPage }) => {
  await policiesPage.smokeExpectListHeader();
});

When('I smoke navigate policies create', async ({ policiesPage, page }) => {
  await policiesPage.openCreate();
  await capture(page, 'policies-create');
});

Then('the create policy page header is visible on smoke', async ({ policiesPage }) => {
  await policiesPage.smokeExpectCreateHeader();
});

When('I smoke navigate back to policies list', async ({ policiesPage, page }) => {
  await policiesPage.backToList();
  await capture(page, 'policies-list-back');
});

When('I smoke navigate policies edit from grid', async ({ policiesPage, page }) => {
  await policiesPage.openList();
  await policiesPage.openEditFromGrid();
  await capture(page, 'policies-edit');
});

When('I smoke open policies edit by clicking grid record', async ({ policiesPage, page }) => {
  await policiesPage.smokeOpenEditByRowClick();
  await capture(page, 'policies-edit-row');
});

When('I smoke open policies edit via action kebab', async ({ policiesPage, page }) => {
  await policiesPage.smokeOpenEditViaKebab();
  await capture(page, 'policies-edit-kebab');
});

When('I smoke navigate policy commission configuration', async ({ policiesPage, page }) => {
  await policiesPage.openList();
  await policiesPage.openEditFromGrid();
  await policiesPage.openCommissionConfiguration();
  await capture(page, 'policies-commission-configuration');
});
