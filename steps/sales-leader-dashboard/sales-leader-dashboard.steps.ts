import { expect } from '@playwright/test';
import { Given, When, Then } from '../fixtures';
import { SALES_LEADER_DASHBOARD } from '../../test-data/sales-leader-dashboard/validateSalesLeaderDashboard';
import { prepareSalesLeaderDashboardStatementFile } from '../../utils/sales-leader-dashboard/salesLeaderDashboardExcelPrep';
import {
  getSalesLeaderKpiBaseline,
  getSalesLeaderPreparedFile,
  setSalesLeaderKpiBaseline,
  setSalesLeaderPreparedFile,
  setSalesLeaderUploadState,
} from '../../utils/sales-leader-dashboard/salesLeaderDashboardContext';
Given(
  'the sales leader dashboard statement file is prepared for agent {string}',
  async ({}, agentId: string) => {
    expect([SALES_LEADER_DASHBOARD.agentId, SALES_LEADER_DASHBOARD.salesLeaderAgentId]).toContain(
      agentId,
    );
    const prepared = await prepareSalesLeaderDashboardStatementFile(agentId);
    expect(prepared.agentNpn).toBe(agentId);
    setSalesLeaderPreparedFile(prepared);
  },
);

When(
  'I capture Performance Overview KPI baseline on sales leader dashboard',
  async ({ agentDashboardPage }) => {
    const totalGrossCommission = await agentDashboardPage.getMetricNumericValue(
      'total-gross-commission',
    );
    const totalNewPolicies = await agentDashboardPage.getMetricNumericValue('total-new-policies');
    const avgPerPolicy = await agentDashboardPage.getMetricNumericValue('avg-per-policy');
    setSalesLeaderKpiBaseline({
      totalGrossCommission,
      totalNewPolicies,
      avgPerPolicy,
    });
  },
);

When(
  'I open the statement upload page in sales leader dashboard regression',
  async ({ baseStatementUploadPage }) => {
    await baseStatementUploadPage.openUploadPage();
  },
);

When(
  'I upload the prepared sales leader dashboard statement file',
  async ({ baseStatementUploadPage }) => {
    await baseStatementUploadPage.uploadFromPrepared(getSalesLeaderPreparedFile());
  },
);

When(
  'I select the statement type {string} in sales leader dashboard regression',
  async ({ baseStatementUploadPage }, statementType: string) => {
    await baseStatementUploadPage.selectStatementType(statementType);
  },
);

When(
  'I submit the statement upload for processing in sales leader dashboard regression',
  async ({ baseStatementUploadPage }) => {
    await baseStatementUploadPage.clickUploadStatement();
  },
);

Then(
  'the sales leader dashboard upload extract processing completes and file ID is captured',
  async ({ baseStatementUploadPage }) => {
    const file = getSalesLeaderPreparedFile();
    const fileId = await baseStatementUploadPage.assertions.pollPastExtractProcessing(
      file.fileName,
      SALES_LEADER_DASHBOARD.uploadPoll,
    );
    await baseStatementUploadPage.captureStoredFileId(fileId);
    setSalesLeaderUploadState({
      fileId,
      fileName: file.fileName,
      stage: SALES_LEADER_DASHBOARD.expectedAfterExtract.stage,
    });
  },
);

Then(
  'the sales leader dashboard upload row shows status {string} and stage {string}',
  async ({ baseStatementUploadPage }, status: string, stage: string) => {
    await baseStatementUploadPage.expectStoredUploadStatusAndStage(status, stage);
  },
);

When(
  'I open the statement review page for the stored upload in sales leader dashboard regression',
  async ({ baseStatementUploadPage }) => {
    await baseStatementUploadPage.openReviewForStoredUpload();
  },
);

When(
  'I click Complete Review on the statement review page in sales leader dashboard regression',
  async ({ baseStatementUploadPage }) => {
    await baseStatementUploadPage.completeReviewAndConfirm();
  },
);

Then(
  'the sales leader dashboard upload stage changes to {string}',
  async ({ baseStatementUploadPage }, stage: string) => {
    await baseStatementUploadPage.expectStoredUploadStage(stage);
  },
);

Then(
  'the Total Gross Commission is greater than the captured baseline on sales leader dashboard',
  async ({ agentDashboardPage }) => {
    const baseline = getSalesLeaderKpiBaseline();
    const current = await agentDashboardPage.getMetricNumericValue('total-gross-commission');
    expect(
      current,
      `Expected Total Gross Commission (${current}) > baseline (${baseline.totalGrossCommission})`,
    ).toBeGreaterThan(baseline.totalGrossCommission);
  },
);

Then(
  'the Total New Policies is at least the captured baseline on sales leader dashboard',
  async ({ agentDashboardPage }) => {
    // SL Total New Policies may not rise when commission is override-only on a downline NB.
    // Gross increment (prior Then) is the primary KPI proof; New Policies must not regress.
    const baseline = getSalesLeaderKpiBaseline();
    await agentDashboardPage.open();
    await agentDashboardPage.selectTimePeriod('Year to Date');
    await agentDashboardPage.applyFilterChangesIfVisible();
    const current = await agentDashboardPage.getMetricNumericValue('total-new-policies');
    expect(
      current,
      `Expected Total New Policies (${current}) >= baseline (${baseline.totalNewPolicies})`,
    ).toBeGreaterThanOrEqual(baseline.totalNewPolicies);
  },
);

Then(
  'the Total New Policies is greater than the captured baseline on sales leader dashboard',
  async ({ agentDashboardPage }) => {
    const baseline = getSalesLeaderKpiBaseline();
    const current = await agentDashboardPage.getMetricNumericValue('total-new-policies');
    expect(
      current,
      `Expected Total New Policies (${current}) > baseline (${baseline.totalNewPolicies})`,
    ).toBeGreaterThan(baseline.totalNewPolicies);
  },
);

Then('the Avg Per Policy metric is visible on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectKpiCardsVisible(['Avg Per Policy']);
});
