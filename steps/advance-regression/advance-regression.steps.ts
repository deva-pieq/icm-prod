import { AdvanceSetupPage } from '../../pages/advance-regression/AdvanceSetupPage';
import { AdvanceOverviewPage } from '../../pages/advance-regression/AdvanceOverviewPage';
import { AgentAdvanceEligibilityPage } from '../../pages/advance-regression/AgentAdvanceEligibilityPage';
import { setCapturedArfId, setCapturedAgentName, getCapturedArfId, getCapturedAgentName } from '../../utils/advance-regression/advanceRegressionContext';
import { When, Then } from '../fixtures';

// ═══════════════════════════════════════════════════════════════════════
// ADVANCE SETUP Steps
// ═══════════════════════════════════════════════════════════════════════

When('I navigate to the Advance Setup page on advance setup regression', async ({ page }) => {
  const advanceSetupPage = new AdvanceSetupPage(page);
  await advanceSetupPage.navigateToAdvanceSetup();
});

When('I click Add Advance Setup on advance setup regression', async ({ page }) => {
  const advanceSetupPage = new AdvanceSetupPage(page);
  await advanceSetupPage.clickAddAdvanceSetup();
});

Then('the Add Advance Setup modal is displayed on advance setup regression', async ({ page }) => {
  const advanceSetupPage = new AdvanceSetupPage(page);
  await advanceSetupPage.expectModalDisplayed();
});

When('I select a product in the Add Advance Setup modal on advance setup regression', async ({ page }) => {
  const advanceSetupPage = new AdvanceSetupPage(page);
  await advanceSetupPage.selectProduct();
});

When('I fill the Default field with value {string} on advance setup regression', async ({ page }, value: string) => {
  const advanceSetupPage = new AdvanceSetupPage(page);
  await advanceSetupPage.fillField('Default', value);
});

When('I fill the Monthly field with value {string} on advance setup regression', async ({ page }, value: string) => {
  const advanceSetupPage = new AdvanceSetupPage(page);
  await advanceSetupPage.fillField('Monthly', value);
});

When('I fill the Quarterly field with value {string} on advance setup regression', async ({ page }, value: string) => {
  const advanceSetupPage = new AdvanceSetupPage(page);
  await advanceSetupPage.fillField('Quarterly', value);
});

When('I fill the Half Yearly field with value {string} on advance setup regression', async ({ page }, value: string) => {
  const advanceSetupPage = new AdvanceSetupPage(page);
  await advanceSetupPage.fillField('Half Yearly', value);
});

When('I fill the Annual field with value {string} on advance setup regression', async ({ page }, value: string) => {
  const advanceSetupPage = new AdvanceSetupPage(page);
  await advanceSetupPage.fillField('Annual', value);
});

When('I click Save in the Add Advance Setup modal on advance setup regression', async ({ page }) => {
  const advanceSetupPage = new AdvanceSetupPage(page);
  await advanceSetupPage.clickSave();
  await advanceSetupPage.clickConfirmSave();
});

When('I click Save button only in the Add Advance Setup modal on advance setup regression', async ({ page }) => {
  const advanceSetupPage = new AdvanceSetupPage(page);
  await advanceSetupPage.clickSaveOnly();
});

Then('the product dropdown shows error text {string} on advance setup regression', async ({ page }, expectedText: string) => {
  const advanceSetupPage = new AdvanceSetupPage(page);
  await advanceSetupPage.expectProductDropdownError(expectedText);
});

Then('the Default field shows error text {string} on advance setup regression', async ({ page }, expectedText: string) => {
  const advanceSetupPage = new AdvanceSetupPage(page);
  await advanceSetupPage.expectDefaultFieldErrorText(expectedText);
});

Then('no confirmation popup appears on advance setup regression', async ({ page }) => {
  const advanceSetupPage = new AdvanceSetupPage(page);
  await advanceSetupPage.expectNoConfirmationPopup();
});

When('I click Cancel in the Add Advance Setup modal on advance setup regression', async ({ page }) => {
  const advanceSetupPage = new AdvanceSetupPage(page);
  await advanceSetupPage.clickCancel();
});

Then('the advance setup grid shows the saved product on advance setup regression', async ({ page }) => {
  const advanceSetupPage = new AdvanceSetupPage(page);
  await advanceSetupPage.expectGridShowsProduct();
});

Then('the advance setup modal is closed on advance setup regression', async ({ page }) => {
  const advanceSetupPage = new AdvanceSetupPage(page);
  await advanceSetupPage.expectModalClosed();
});

Then('the Default field value is {string} on advance setup regression', async ({ page }, value: string) => {
  const advanceSetupPage = new AdvanceSetupPage(page);
  await advanceSetupPage.expectFieldValue('Default', value);
});

Then('the Monthly field value is {string} on advance setup regression', async ({ page }, value: string) => {
  const advanceSetupPage = new AdvanceSetupPage(page);
  await advanceSetupPage.expectFieldValue('Monthly', value);
});

Then('the Quarterly field value is {string} on advance setup regression', async ({ page }, value: string) => {
  const advanceSetupPage = new AdvanceSetupPage(page);
  await advanceSetupPage.expectFieldValue('Quarterly', value);
});

Then('the Half Yearly field value is {string} on advance setup regression', async ({ page }, value: string) => {
  const advanceSetupPage = new AdvanceSetupPage(page);
  await advanceSetupPage.expectFieldValue('Half Yearly', value);
});

Then('the Annual field value is {string} on advance setup regression', async ({ page }, value: string) => {
  const advanceSetupPage = new AdvanceSetupPage(page);
  await advanceSetupPage.expectFieldValue('Annual', value);
});

Then('the Default field rejects value {string} on advance setup regression', async ({ page }, value: string) => {
  const advanceSetupPage = new AdvanceSetupPage(page);
  await advanceSetupPage.expectFieldRejectsZero('Default');
});

Then('the Default field does not contain alphabets on advance setup regression', async ({ page }) => {
  const advanceSetupPage = new AdvanceSetupPage(page);
  await advanceSetupPage.expectFieldDoesNotContainAlphabets('Default');
});

When('I click the edit action on the first row in advance setup regression', async ({ page }) => {
  const advanceSetupPage = new AdvanceSetupPage(page);
  await advanceSetupPage.clickEditFirstRow();
});

When('I click the delete action on the first row in advance setup regression', async ({ page }) => {
  const advanceSetupPage = new AdvanceSetupPage(page);
  await advanceSetupPage.clickDeleteFirstRow();
});

Then('the record is deleted from advance setup grid on advance setup regression', async ({ page }) => {
  const advanceSetupPage = new AdvanceSetupPage(page);
  await advanceSetupPage.expectRecordDeleted();
});

// ═══════════════════════════════════════════════════════════════════════
// ADVANCE OVERVIEW Steps
// ═══════════════════════════════════════════════════════════════════════

When('I navigate to the Advance Overview page on advance overview regression', async ({ page }) => {
  const advanceOverviewPage = new AdvanceOverviewPage(page);
  await advanceOverviewPage.navigateToAdvanceOverview();
});

Then('the Advance Overview page title is displayed on advance overview regression', async ({ page }) => {
  const advanceOverviewPage = new AdvanceOverviewPage(page);
  await advanceOverviewPage.expectPageTitleDisplayed();
});

Then('the Total Advance Payout card is displayed on advance overview regression', async ({ page }) => {
  const advanceOverviewPage = new AdvanceOverviewPage(page);
  await advanceOverviewPage.expectTotalAdvancePayoutCard();
});

Then('the Recovered card is displayed on advance overview regression', async ({ page }) => {
  const advanceOverviewPage = new AdvanceOverviewPage(page);
  await advanceOverviewPage.expectRecoveredCard();
});

Then('the Total Balance card is displayed on advance overview regression', async ({ page }) => {
  const advanceOverviewPage = new AdvanceOverviewPage(page);
  await advanceOverviewPage.expectTotalBalanceCard();
});

Then('Total Balance equals Total Advance Payout minus Recovered on advance overview regression', async ({ page }) => {
  const advanceOverviewPage = new AdvanceOverviewPage(page);
  await advanceOverviewPage.expectTotalBalanceCalculation();
});

When('I click the {string} tab on advance overview regression', async ({ page }, tabName: string) => {
  const advanceOverviewPage = new AdvanceOverviewPage(page);
  await advanceOverviewPage.clickTab(tabName);
});

When('I search the advance overview grid with {string} on advance overview regression', async ({ page }, query: string) => {
  const advanceOverviewPage = new AdvanceOverviewPage(page);
  await advanceOverviewPage.searchGrid(query);
});

Then('the advance overview grid shows filtered results on advance overview regression', async ({ page }) => {
  const advanceOverviewPage = new AdvanceOverviewPage(page);
  await advanceOverviewPage.expectGridFiltered();
});

When('I open the agent filter dropdown on advance overview regression', async ({ page }) => {
  const advanceOverviewPage = new AdvanceOverviewPage(page);
  await advanceOverviewPage.openAgentFilter();
});

Then('the agent filter dropdown displays agent options on advance overview regression', async ({ page }) => {
  const advanceOverviewPage = new AdvanceOverviewPage(page);
  await advanceOverviewPage.expectAgentFilterOptions();
});

When('I open the carrier filter dropdown on advance overview regression', async ({ page }) => {
  const advanceOverviewPage = new AdvanceOverviewPage(page);
  await advanceOverviewPage.openCarrierFilter();
});

Then('the carrier filter dropdown displays carrier options on advance overview regression', async ({ page }) => {
  const advanceOverviewPage = new AdvanceOverviewPage(page);
  await advanceOverviewPage.expectCarrierFilterOptions();
});

When('I open the product filter dropdown on advance overview regression', async ({ page }) => {
  const advanceOverviewPage = new AdvanceOverviewPage(page);
  await advanceOverviewPage.openProductFilter();
});

Then('the product filter dropdown displays product options on advance overview regression', async ({ page }) => {
  const advanceOverviewPage = new AdvanceOverviewPage(page);
  await advanceOverviewPage.expectProductFilterOptions();
});

When('I reset the advance overview search on advance overview regression', async ({ page }) => {
  const advanceOverviewPage = new AdvanceOverviewPage(page);
  await advanceOverviewPage.resetSearch();
});

Then('the advance overview grid shows all records on advance overview regression', async ({ page }) => {
  const advanceOverviewPage = new AdvanceOverviewPage(page);
  await advanceOverviewPage.expectGridShowsAllRecords();
});

When('I click the column visibility toggle on advance overview regression', async ({ page }) => {
  const advanceOverviewPage = new AdvanceOverviewPage(page);
  await advanceOverviewPage.clickColumnToggle();
});

Then('the column visibility menu is displayed on advance overview regression', async ({ page }) => {
  const advanceOverviewPage = new AdvanceOverviewPage(page);
  await advanceOverviewPage.expectColumnMenuDisplayed();
});

When('I click the ARF ID column header to sort on advance overview regression', async ({ page }) => {
  const advanceOverviewPage = new AdvanceOverviewPage(page);
  await advanceOverviewPage.clickArfIdHeader();
});

Then('the advance overview grid is sorted by ARF ID on advance overview regression', async ({ page }) => {
  const advanceOverviewPage = new AdvanceOverviewPage(page);
  await advanceOverviewPage.expectGridSorted();
});

When('I capture the ARF ID and Agent Name from the first row on advance overview regression', async ({ page }) => {
  const advanceOverviewPage = new AdvanceOverviewPage(page);
  const arfId = await advanceOverviewPage.captureArfIdFromGrid();
  const agentName = await advanceOverviewPage.captureAgentNameFromGrid();
  setCapturedArfId(arfId);
  setCapturedAgentName(agentName);
});

Then('the ARF detail title matches the captured ARF ID and Agent Name on advance overview regression', async ({ page }) => {
  const advanceOverviewPage = new AdvanceOverviewPage(page);
  const arfId = getCapturedArfId();
  const agentName = getCapturedAgentName();
  await advanceOverviewPage.expectDetailTitleContainsCapturedValues(arfId, agentName);
});

When('I click the first row in the advance overview grid on advance overview regression', async ({ page }) => {
  const advanceOverviewPage = new AdvanceOverviewPage(page);
  await advanceOverviewPage.clickFirstRow();
});

Then('the ARF detail page is displayed on advance overview regression', async ({ page }) => {
  const advanceOverviewPage = new AdvanceOverviewPage(page);
  await advanceOverviewPage.expectArfDetailPage();
});

Then('the ARF detail page contains Policy Information section on advance overview regression', async ({ page }) => {
  const advanceOverviewPage = new AdvanceOverviewPage(page);
  await advanceOverviewPage.expectArfDetailContainsSection('Policy Details');
});

Then('the ARF detail page contains Advance Details section on advance overview regression', async ({ page }) => {
  const advanceOverviewPage = new AdvanceOverviewPage(page);
  await advanceOverviewPage.expectArfDetailContainsSection('Advance Details');
});

Then('the ARF detail page contains ARF Ledger section on advance overview regression', async ({ page }) => {
  const advanceOverviewPage = new AdvanceOverviewPage(page);
  await advanceOverviewPage.expectArfDetailContainsSection('ARF Ledger');
});

Then('the ARF detail page title contains the ARF ID on advance overview regression', async ({ page }) => {
  const advanceOverviewPage = new AdvanceOverviewPage(page);
  await advanceOverviewPage.expectArfDetailTitleContainsArfId();
});

Then('the ARF detail page title contains the Agent Name on advance overview regression', async ({ page }) => {
  const advanceOverviewPage = new AdvanceOverviewPage(page);
  await advanceOverviewPage.expectArfDetailTitleContainsAgentName();
});

Then('the Policy Information section contains Policy Number on advance overview regression', async ({ page }) => {
  const advanceOverviewPage = new AdvanceOverviewPage(page);
  await advanceOverviewPage.expectPolicyInfoField('Policy Number');
});

Then('the Policy Information section contains Policy Holder Name on advance overview regression', async ({ page }) => {
  const advanceOverviewPage = new AdvanceOverviewPage(page);
  await advanceOverviewPage.expectPolicyInfoField('Policy Holder Name');
});

Then('the Policy Information section contains Agent Name on advance overview regression', async ({ page }) => {
  const advanceOverviewPage = new AdvanceOverviewPage(page);
  await advanceOverviewPage.expectPolicyInfoField('Agent Name');
});

Then('the Policy Information section contains Product on advance overview regression', async ({ page }) => {
  const advanceOverviewPage = new AdvanceOverviewPage(page);
  await advanceOverviewPage.expectPolicyInfoField('Product');
});

Then('the Policy Information section contains Carrier on advance overview regression', async ({ page }) => {
  const advanceOverviewPage = new AdvanceOverviewPage(page);
  await advanceOverviewPage.expectPolicyInfoField('Carrier');
});

Then('the Policy Information section contains Policy Effective Date on advance overview regression', async ({ page }) => {
  const advanceOverviewPage = new AdvanceOverviewPage(page);
  await advanceOverviewPage.expectPolicyInfoField('Policy Effective Date');
});

Then('the Policy Information section contains Premium on advance overview regression', async ({ page }) => {
  const advanceOverviewPage = new AdvanceOverviewPage(page);
  await advanceOverviewPage.expectPolicyInfoField('Premium');
});

Then('the Advance Details section contains Commission Per Month on advance overview regression', async ({ page }) => {
  const advanceOverviewPage = new AdvanceOverviewPage(page);
  await advanceOverviewPage.expectAdvanceDetailsField('Commission Per Month');
});

Then('the Advance Details section contains Number of Months on advance overview regression', async ({ page }) => {
  const advanceOverviewPage = new AdvanceOverviewPage(page);
  await advanceOverviewPage.expectAdvanceDetailsField(/No of Months/i);
});

Then('the Advance Details section contains Advance Amount on advance overview regression', async ({ page }) => {
  const advanceOverviewPage = new AdvanceOverviewPage(page);
  await advanceOverviewPage.expectAdvanceDetailsField('Advance Amount');
});

Then('the ARF Ledger section contains a search bar on advance overview regression', async ({ page }) => {
  const advanceOverviewPage = new AdvanceOverviewPage(page);
  await advanceOverviewPage.expectArfLedgerSearchBar();
});

Then('the ARF Ledger section contains a column visibility button on advance overview regression', async ({ page }) => {
  const advanceOverviewPage = new AdvanceOverviewPage(page);
  await advanceOverviewPage.expectArfLedgerColumnButton();
});

Then('the ARF Ledger section contains a data grid on advance overview regression', async ({ page }) => {
  const advanceOverviewPage = new AdvanceOverviewPage(page);
  await advanceOverviewPage.expectArfLedgerDataGrid();
});

// ═══════════════════════════════════════════════════════════════════════
// AGENT ADVANCE ELIGIBILITY Steps
// ═══════════════════════════════════════════════════════════════════════

When('I navigate to the Agents page on agent advance eligibility regression', async ({ page }) => {
  const agentAdvanceEligibilityPage = new AgentAdvanceEligibilityPage(page);
  await agentAdvanceEligibilityPage.navigateToAgents();
});

When('I search for an agent in the agents grid on agent advance eligibility regression', async ({ page }) => {
  const agentAdvanceEligibilityPage = new AgentAdvanceEligibilityPage(page);
  await agentAdvanceEligibilityPage.searchAgent('AgentX');
});

When('I click the first agent row on agent advance eligibility regression', async ({ page }) => {
  const agentAdvanceEligibilityPage = new AgentAdvanceEligibilityPage(page);
  await agentAdvanceEligibilityPage.clickFirstAgentRow();
});

When('I open agent settings tab on agent advance eligibility regression', async ({ page }) => {
  const agentAdvanceEligibilityPage = new AgentAdvanceEligibilityPage(page);
  await agentAdvanceEligibilityPage.openSettingsTab();
});

Then('the Advance Eligibility toggle is visible on agent advance eligibility regression', async ({ page }) => {
  const agentAdvanceEligibilityPage = new AgentAdvanceEligibilityPage(page);
  await agentAdvanceEligibilityPage.expectAdvanceEligibilityToggleVisible();
});

When('I enable the Advance Eligibility toggle on agent advance eligibility regression', async ({ page }) => {
  const agentAdvanceEligibilityPage = new AgentAdvanceEligibilityPage(page);
  await agentAdvanceEligibilityPage.enableAdvanceEligibilityToggle();
});

Then('the Advance Eligibility toggle is enabled on agent advance eligibility regression', async ({ page }) => {
  const agentAdvanceEligibilityPage = new AgentAdvanceEligibilityPage(page);
  await agentAdvanceEligibilityPage.expectAdvanceEligibilityToggleEnabled();
});
