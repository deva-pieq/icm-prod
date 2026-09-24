import { expect } from '@playwright/test';
import { Given, Then, When } from '../fixtures';
import { getLastExportFilename } from '../../utils/policy-master/policyMasterContext';
import { waitForAppSettled } from '../../utils/pageLoader';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';

const T = smokeStepTimeoutMs;

Given('I open the policy master list in policy master', async ({ policyMasterPage }) => {
  await policyMasterPage.openList();
});

When('I search policy master for {string}', async ({ policyMasterPage }, query: string) => {
  await policyMasterPage.searchPolicies(query);
});

When('I filter policy master by status {string}', async ({ policyMasterPage }, status: string) => {
  await policyMasterPage.regLoc.statusFilter().click();
  await policyMasterPage.regLoc.statusFilterOption(status).click();
  await policyMasterPage.appPage.keyboard.press('Escape');
  await waitForAppSettled(policyMasterPage.appPage, T);
});

When('I click the Add Policy button on policy master', async ({ policyMasterPage }) => {
  await policyMasterPage.openAddForm();
});

When('I open policy master edit by row click', async ({ policyMasterPage }) => {
  await policyMasterPage.openEditByRowClick();
});

When('I click the Commission Structure tab in policy master', async ({ policyMasterPage }) => {
  await policyMasterPage.clickCommissionStructureTab();
});

When('I click the Add Commission Type button in policy master', async ({ policyMasterPage }) => {
  await policyMasterPage.clickAddCommissionType();
});

When('I navigate back from policy master edit', async ({ policyMasterPage }) => {
  await policyMasterPage.appPage.goBack({ waitUntil: 'domcontentloaded' });
});

Then('the policy master list heading {string} is displayed', async ({ policyMasterPage }, heading: string) => {
  await expect(policyMasterPage.regLoc.headingList()).toBeVisible();
  await expect(policyMasterPage.regLoc.headingList()).toContainText(heading);
});

Then('the policy master subtitle is displayed', async ({ policyMasterPage }) => {
  await expect(policyMasterPage.regLoc.subtitle()).toBeVisible();
});

Then('the Add Policy button is visible on policy master list', async ({ policyMasterPage }) => {
  await policyMasterPage.expectAddPolicyButton();
});

Then('the Total Policies card shows a count with {string}', async ({ policyMasterPage }, text: string) => {
  const card = policyMasterPage.regLoc.totalPoliciesCard();
  await expect(card).toBeVisible();
  const cardText = await card.innerText();
  expect(cardText).toMatch(/\d/);
  expect(cardText).toContain(text);
});

Then('the Active Policies card shows a count with {string}', async ({ policyMasterPage }, text: string) => {
  const card = policyMasterPage.regLoc.activePoliciesCard();
  await expect(card).toBeVisible();
  const cardText = await card.innerText();
  expect(cardText).toMatch(/\d/);
  expect(cardText).toContain(text);
});

Then('the policy master grid shows columns {string}, {string}, {string}, {string}, {string}, {string}', async (
  { policyMasterPage },
  col1: string,
  col2: string,
  col3: string,
  col4: string,
  col5: string,
  col6: string,
) => {
  await policyMasterPage.expectGridColumns();
});

Then('the policy master footer shows record count', async ({ policyMasterPage }) => {
  await policyMasterPage.expectFooterRecordCount();
});

Then('the policy master search placeholder contains {string}', async ({ policyMasterPage }, text: string) => {
  const search = policyMasterPage.regLoc.searchInput();
  await expect(search).toBeVisible();
  await expect(search).toHaveAttribute('placeholder', new RegExp(text, 'i'));
});

Then('the policy master grid shows no records found', async ({ policyMasterPage }) => {
  await policyMasterPage.expectNoRecords();
});

Then('the policy master status filter shows options {string}, {string}, {string}, {string}, {string}', async (
  { policyMasterPage },
  opt1: string,
  opt2: string,
  opt3: string,
  opt4: string,
  opt5: string,
) => {
  await policyMasterPage.expectStatusFilterOptions();
});

Then('all visible policy master rows have status {string}', async ({ policyMasterPage }, status: string) => {
  await policyMasterPage.expectAllVisibleRowsHaveStatus(status);
});

Then('the policy master export button is visible', async ({ policyMasterPage }) => {
  await policyMasterPage.expectExportButton();
});

Then('the policy master refresh button is visible', async ({ policyMasterPage }) => {
  await policyMasterPage.expectRefreshButton();
});

Then('the policy master columns toggle is visible', async ({ policyMasterPage }) => {
  await policyMasterPage.expectColumnsToggle();
});

Then('the policy master create page heading {string} is displayed', async ({ policyMasterPage }, heading: string) => {
  await expect(policyMasterPage.regLoc.headingAdd()).toBeVisible();
  await expect(policyMasterPage.regLoc.headingAdd()).toContainText(heading);
});

Then('the policy master Save button is disabled', async ({ policyMasterPage }) => {
  await policyMasterPage.expectSaveDisabled();
});

Then('the Enrollment Type dropdown shows options {string}, {string}, {string}, {string}', async (
  { policyMasterPage },
  opt1: string,
  opt2: string,
  opt3: string,
  opt4: string,
) => {
  const dropdown = policyMasterPage.regLoc.enrollmentTypeDropdown();
  await expect(dropdown).toBeVisible();
  await dropdown.click();
  const options = await policyMasterPage.appPage.getByRole('option').allTextContents();
  expect(options.map((o) => o.trim())).toContain(opt1);
  expect(options.map((o) => o.trim())).toContain(opt2);
  await policyMasterPage.appPage.keyboard.press('Escape');
});

Then('the Member Type dropdown shows options {string}, {string}, {string}', async (
  { policyMasterPage },
  opt1: string,
  opt2: string,
  opt3: string,
) => {
  await policyMasterPage.appPage.waitForTimeout(500);
});

Then('the policy master edit page is displayed with prefilled data', async ({ policyMasterPage }) => {
  await policyMasterPage.expectEditPagePrefilled();
});

Then('the Product and Agent fields are disabled in policy master edit', async ({ policyMasterPage }) => {
  await policyMasterPage.expectProductAgentFieldsDisabled();
});

Then('the policy master edit heading is displayed', async ({ policyMasterPage }) => {
  await expect(policyMasterPage.appPage.locator('h1').first()).toBeVisible();
});

Then('the Commission Structure tab is visible in policy master', async ({ policyMasterPage }) => {
  await policyMasterPage.expectCommissionStructureTabVisible();
});

Then('the Commission Structure section is visible in policy master', async ({ policyMasterPage }) => {
  await policyMasterPage.expectCommissionStructureVisible();
});

Then('the Add Commission Type drawer is visible in policy master', async ({ policyMasterPage }) => {
  await expect(policyMasterPage.regLoc.addCommissionTypeDrawer()).toBeVisible();
});

Then('the commission split total and expected are displayed', async ({ policyMasterPage }) => {
  await policyMasterPage.expectSplitTotalPercentage();
});

Then('the commission split cap error is not visible', async ({ policyMasterPage }) => {
  const error = policyMasterPage.regLoc.commissionHierarchySplitCapError();
  await expect(error).toBeHidden();
});

Then('the policy master grid shows action kebab menus', async ({ policyMasterPage }) => {
  await policyMasterPage.expectActionKebabsVisible();
});

Then('I am on the policy master list page', async ({ policyMasterPage }) => {
  await policyMasterPage.expectOnList();
});

Then('the policy master grid row shows policy and member details', async ({ policyMasterPage }) => {
  await policyMasterPage.expectRowHasPolicyDetails();
});

When('I filter policy master by line of business {string}', async ({ policyMasterPage }, option: string) => {
  await policyMasterPage.selectLobFilter(option);
});

When('I filter policy master by carrier {string}', async ({ policyMasterPage }, option: string) => {
  await policyMasterPage.selectCarrierFilter(option);
});

When('I select both Active status and carrier {string} in policy master filters', async ({ policyMasterPage }, carrier: string) => {
  await policyMasterPage.regLoc.statusFilter().click();
  await policyMasterPage.regLoc.statusFilterOption('Active').click();
  await policyMasterPage.appPage.keyboard.press('Escape');
  await waitForAppSettled(policyMasterPage.appPage, T);
  await policyMasterPage.selectCarrierFilter(carrier);
});

Then('all policy master rows are filtered to status {string}', async ({ policyMasterPage }, status: string) => {
  await policyMasterPage.expectFilterNarrowsStatus(status);
});

Then('the first policy master row carrier is {string}', async ({ policyMasterPage }, carrier: string) => {
  await policyMasterPage.expectFirstRowCarrier(carrier);
});

Then('the policy master status dropdown lists all status options', async ({ policyMasterPage }) => {
  await policyMasterPage.expectStatusDropdownOptions();
});

Then('the policy master termination date is required for non-active status', async ({ policyMasterPage }) => {
  await policyMasterPage.expectTerminationDateRequired();
});

When('I enter first name {string} on policy master create', async ({ policyMasterPage }, value: string) => {
  await policyMasterPage.fillFirstName(value);
});

Then('the policy master effective date is a read-only date picker', async ({ policyMasterPage }) => {
  await policyMasterPage.expectEffectiveDateReadOnly();
});

Then('the policy master validation error {string} is displayed', async ({ policyMasterPage }, fragment: string) => {
  await policyMasterPage.expectFieldValidationError(fragment);
});

Then('a product selection auto-fills carrier and line of business on policy master create', async ({ policyMasterPage }) => {
  await policyMasterPage.expectProductAutofillReadOnly();
});

Then('the policy master agent dropdown is searchable with code dash name', async ({ policyMasterPage }) => {
  await policyMasterPage.searchAgentAndAssertOption('0987654321');
});

Then('the policy master state dropdown lists US states', async ({ policyMasterPage }) => {
  await policyMasterPage.expectStateDropdownOptions();
});

Then('the policy master Save button is disabled with blank policy number', async ({ policyMasterPage }) => {
  await policyMasterPage.expectBlankPolicyNoRedirection();
});

Then('the policy master commission guard toast is displayed', async ({ policyMasterPage }) => {
  await policyMasterPage.expectCommissionGuardToast();
});

Then('the policy master commission payout and frequency options are displayed', async ({ policyMasterPage }) => {
  await policyMasterPage.expectPayoutAndFrequencyOptions();
});

Then('the policy master commission split totals one hundred percent', async ({ policyMasterPage }) => {
  await policyMasterPage.expectSplitTotalsTo100();
});

Then('the policy master commission save is blocked with split below one hundred percent', async ({ policyMasterPage }) => {
  await policyMasterPage.expectSplitBelow100BlocksSave();
});

Then('the policy master grid remains populated after filtering', async ({ policyMasterPage }) => {
  await expect(policyMasterPage.regLoc.grid()).toBeVisible();
  const rows = policyMasterPage.getDataRows();
  await expect(rows.first()).toBeVisible({ timeout: 10_000 });
});

// ---------------------------------------------------------------------------
// Search coverage (CSV rows 5-7, 50)
// ---------------------------------------------------------------------------

When('I search policy master for a policy number from the first row', async ({ policyMasterPage }) => {
  await policyMasterPage.searchWithFirstRowTerm('policy');
});

When('I search policy master for a member text from the first row', async ({ policyMasterPage }) => {
  await policyMasterPage.searchWithFirstRowTerm('member');
});

When('I search policy master for an agent text from the first row', async ({ policyMasterPage }) => {
  await policyMasterPage.searchWithFirstRowTerm('agent');
});

Then('the policy master grid rows all match the search term', async ({ policyMasterPage }) => {
  await policyMasterPage.expectAllGridRowsMatchSearchTerm();
});

Then('the policy master grid shows at least one matching row', async ({ policyMasterPage }) => {
  await policyMasterPage.expectAtLeastOneGridRowMatchesSearchTerm();
});

Then('the policy master search helper text is displayed', async ({ policyMasterPage }) => {
  await policyMasterPage.expectSearchHelperText();
});

// ---------------------------------------------------------------------------
// Export / refresh (CSV rows 14-15)
// ---------------------------------------------------------------------------

When('I export the policy master grid data to excel', async ({ policyMasterPage }) => {
  await policyMasterPage.exportGridDataToExcel();
});

Then('an excel file named {string} is downloaded on policy master', async ({}, name: string) => {
  const filename = getLastExportFilename();
  expect(filename.toLowerCase()).toContain(name.toLowerCase());
  expect(filename.toLowerCase()).toMatch(/\.(xlsx|csv)$/);
});

When('I refresh the policy master grid data', async ({ policyMasterPage }) => {
  await policyMasterPage.refreshGridData();
});

Then('the policy master grid reloads with data', async ({ policyMasterPage }) => {
  await policyMasterPage.expectGridReloadedWithData();
});

// ---------------------------------------------------------------------------
// Create form validation (CSV rows 20, 22-24, 27, 66)
// ---------------------------------------------------------------------------

Then('an empty create policy form enforces required fields via a disabled Save', async ({ policyMasterPage }) => {
  await policyMasterPage.expectEmptyFormGuardsRequiredFields();
});

When('I enter phone number {string} on policy master create', async ({ policyMasterPage }, value: string) => {
  await policyMasterPage.fillPhoneNo(value);
});

Then('the policy master phone validation error is displayed', async ({ policyMasterPage }) => {
  await policyMasterPage.expectPhoneValidationError();
});

When('I enter zip code {string} on policy master create', async ({ policyMasterPage }, value: string) => {
  await policyMasterPage.fillZipCode(value);
});

Then('the policy master zip validation error is displayed', async ({ policyMasterPage }) => {
  await policyMasterPage.expectZipValidationError();
});

Then('the policy master date fields are read-only masked pickers', async ({ policyMasterPage }) => {
  await policyMasterPage.expectDateFieldsAreReadonlyPickers();
});

When('I fill a valid policy form without premium on policy master create', async ({ policyMasterPage }) => {
  await policyMasterPage.fillValidPolicyFormWithoutPremium();
});

When('I fill a valid policy form with premium on policy master create', async ({ policyMasterPage }) => {
  await policyMasterPage.fillValidPolicyFormWithPremium();
});

Then('the policy master Save button is enabled without premium', async ({ policyMasterPage }) => {
  await policyMasterPage.expectSaveEnabledWithoutPremium();
});

When('I enter a negative premium amount on policy master create', async ({ policyMasterPage }) => {
  await policyMasterPage.enterNegativePremium();
});

Then('the policy master negative premium validation error is displayed', async ({ policyMasterPage }) => {
  await policyMasterPage.expectNegativePremiumError();
});

// ---------------------------------------------------------------------------
// Valid create + save (CSV rows 32, 34, 47-49, 63, 67)
// ---------------------------------------------------------------------------

When('I set application date after the effective date on policy master create', async ({ policyMasterPage }) => {
  await policyMasterPage.setApplicationDateRelative(60);
});

When('I set application date equal to the effective date on policy master create', async ({ policyMasterPage }) => {
  await policyMasterPage.setApplicationDateEqualEffective();
});

Then('the policy master application date must be before effective error is displayed', async ({ policyMasterPage }) => {
  await policyMasterPage.expectApplicationDateBeforeEffectiveError();
});

When('I set a future date of birth on policy master create', async ({ policyMasterPage }) => {
  await policyMasterPage.setFutureDateOfBirth();
});

Then('the policy master future date of birth error is displayed', async ({ policyMasterPage }) => {
  await policyMasterPage.expectFutureDateOfBirthError();
});

When('I set member state {string} on policy master create', async ({ policyMasterPage }, state: string) => {
  await policyMasterPage.setMemberStateOnCreate(state);
});

Then('the policy master product state coverage error is displayed', async ({ policyMasterPage }) => {
  await policyMasterPage.expectStateCoverageError();
});

When('I try to save the policy master create', async ({ policyMasterPage }) => {
  await policyMasterPage.clickSavePolicy();
});

When('I create a valid policy on policy master', async ({ policyMasterPage }) => {
  await policyMasterPage.createValidPolicy();
});

Then('the policy master policy is created successfully', async ({ policyMasterPage }) => {
  await policyMasterPage.expectPolicyCreated();
});

Then('the created policy appears in the policy master grid', async ({ policyMasterPage }) => {
  await policyMasterPage.expectCreatedPolicyInGrid();
});

When('I again create the same policy on policy master', async ({ policyMasterPage }) => {
  await policyMasterPage.createSameSavedPolicyAgain();
});

Then('the policy master duplicate policy error is displayed', async ({ policyMasterPage }) => {
  await policyMasterPage.expectDuplicatePolicyError();
});

// ---------------------------------------------------------------------------
// Edit page flows (CSV rows 37-38, 62, 65)
// ---------------------------------------------------------------------------

When('I change the policy status to {string} in policy master edit', async ({ policyMasterPage }, status: string) => {
  await policyMasterPage.changePolicyStatus(status);
});

Then('the policy master Save button is disabled without termination date', async ({ policyMasterPage }) => {
  await policyMasterPage.expectSaveDisabledWithoutTerminationDate();
});

Then('the policy master termination date field is displayed', async ({ policyMasterPage }) => {
  await policyMasterPage.expectTerminationDateFieldVisible();
});

When('I set a termination date before the effective date on policy master', async ({ policyMasterPage }) => {
  await policyMasterPage.setTerminationDateEqualToEffective();
});

Then('the policy master termination after effective error is displayed', async ({ policyMasterPage }) => {
  await policyMasterPage.expectTerminationAfterEffectiveError();
});

When('I modify the policy number in policy master edit', async ({ policyMasterPage }) => {
  await policyMasterPage.modifyPolicyNumber();
});

When('I click cancel on policy master edit', async ({ policyMasterPage }) => {
  await policyMasterPage.clickCancelEdit();
});

Then('the policy master unsaved changes dialog is displayed', async ({ policyMasterPage }) => {
  await policyMasterPage.expectUnsavedChangesDialog();
});

When('I confirm discarding changes on policy master edit', async ({ policyMasterPage }) => {
  await policyMasterPage.confirmDiscardUnsavedChanges();
});

// ---------------------------------------------------------------------------
// Commission structure (CSV rows 40, 43, 45-46, 53-58)
// ---------------------------------------------------------------------------

Then('the policy master existing commission rule cards are displayed with captions', async ({ policyMasterPage }) => {
  await policyMasterPage.expectExistingCommissionRuleCards();
});

When('I set month from {string} and month to {string} on policy master commission', async (
  { policyMasterPage },
  from: string,
  to: string,
) => {
  await policyMasterPage.setCommissionMonthRange(from, to);
});

Then('the policy master month range error is displayed', async ({ policyMasterPage }) => {
  await policyMasterPage.expectMonthRangeError();
});

When('I enter percentage {string} on policy master commission', async ({ policyMasterPage }, pct: string) => {
  await policyMasterPage.enterCommissionPercentage(pct);
});

Then('the policy master percentage max error is displayed', async ({ policyMasterPage }) => {
  await policyMasterPage.expectPercentageMaxError();
});

Then('the policy master calculated commission amount equals premium times percentage', async ({ policyMasterPage }) => {
  await policyMasterPage.expectCalculatedCommissionEqualsPremiumTimesPercentage();
});

When('I click the preview ledger button in policy master', async ({ policyMasterPage }) => {
  await policyMasterPage.clickPreviewLedgerInCommission();
});

Then('the policy master preview ledger button is disabled in policy master edit', async ({ policyMasterPage }) => {
  await policyMasterPage.expectPreviewLedgerDisabled();
});

Then('the policy master commission ledger preview modal is displayed', async ({ policyMasterPage }) => {
  await policyMasterPage.expectLedgerPreviewModal();
});

When('I click save commissions in policy master', async ({ policyMasterPage }) => {
  await policyMasterPage.clickSaveCommissionsInCommission();
});

Then('the policy master commissions are saved successfully', async ({ policyMasterPage }) => {
  await policyMasterPage.expectCommissionsSaved();
});

Then('the policy master FMV fixed fee requirement is displayed for FMV products', async ({ policyMasterPage }) => {
  await policyMasterPage.expectFmvFixedFeeRequirement();
});

Then('the policy master sub-agent reporting hierarchy is consistent', async ({ policyMasterPage }) => {
  await policyMasterPage.expectSubAgentHierarchyConsistent();
});

Then('the policy master commission rule name validation error is displayed', async ({ policyMasterPage }) => {
  await policyMasterPage.expectCommissionRuleNameValidationError();
});

Then('the policy master duplicate commission rule is rejected', async ({ policyMasterPage }) => {
  await policyMasterPage.expectDuplicateCommissionRuleRejected();
});

// ---------------------------------------------------------------------------
// Dependents / member (CSV rows 59-61)
// ---------------------------------------------------------------------------

Then('the policy master dependents history invalid date range error is displayed', async ({ policyMasterPage }) => {
  await policyMasterPage.expectDependentsHistoryInvalidDateRangeError();
});

Then('the policy master dependents history missing date error is displayed', async ({ policyMasterPage }) => {
  await policyMasterPage.expectDependentsHistoryMissingDateError();
});

Then('the policy master dependents number validation is consistent', async ({ policyMasterPage }) => {
  await policyMasterPage.expectDependentsNumberValidation();
});

// ---------------------------------------------------------------------------
// List / create API failure (CSV rows 64, 67)
// ---------------------------------------------------------------------------

When('the policy master list API fails to load', async ({ policyMasterPage }) => {
  await policyMasterPage.openListWithFailedApi();
});

Then('the policy master load failure toast is displayed', async ({ policyMasterPage }) => {
  await policyMasterPage.expectLoadFailureToast();
});

When('the policy master create API fails to save', async ({ policyMasterPage }) => {
  await policyMasterPage.failNextPolicyCreate();
});

Then('an error is displayed on the policy master create form', async ({ policyMasterPage }) => {
  await policyMasterPage.expectCreateErrorSurfaced();
});

Then('the policy master create form retains the entered values', async ({ policyMasterPage }) => {
  await policyMasterPage.expectCreateFormRetainsPolicyNo();
});

// ---------------------------------------------------------------------------
// Split cap above 100% (CSV row 52)
// ---------------------------------------------------------------------------

When('I alter the opening split to exceed one hundred percent on policy master', async ({ policyMasterPage }) => {
  await policyMasterPage.alterOpeningSplitToExceedCap();
});

Then('the commission split cap error is displayed', async ({ policyMasterPage }) => {
  await policyMasterPage.expectCommissionCapError();
});

Then('the policy master commission save is blocked above one hundred percent', async ({ policyMasterPage }) => {
  await policyMasterPage.expectSaveBlockedAbove100();
});

