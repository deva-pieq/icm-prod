import { Given, When, Then } from '../fixtures';
import { MMP } from '../../test-data/mmp/validateMmp';

// ── Shared agent (once per @validate-mmp module run) ────────────────────────

Given(
  'the shared mmp agent is ready with LVL1 and MMP enabled in mmp validation',
  async ({ mmpFlowPage }) => {
    await mmpFlowPage.ensureSharedAgentReady();
  },
);

When('I create and activate a new agent for mmp validation', async ({ mmpFlowPage }) => {
  await mmpFlowPage.createAndActivateAgent();
});

When('I create a new agent for mmp validation', async ({ mmpFlowPage }) => {
  await mmpFlowPage.createAgentOnly();
});

When('I log out of PieQ ICM for mmp validation', async ({ mmpFlowPage }) => {
  await mmpFlowPage.logout();
});

When('I activate the created agent via gmail for mmp validation', async ({ mmpFlowPage }) => {
  await mmpFlowPage.activateCreatedAgentViaGmail();
});

When('I log in as ops manager for mmp validation', async ({ mmpFlowPage }) => {
  await mmpFlowPage.loginAsOpsManager();
});

When('I open the created agent edit page in mmp validation', async ({ mmpFlowPage }) => {
  await mmpFlowPage.openCreatedAgentEdit();
});

When(
  'I add LVL1 level with effective start date {string} in mmp validation',
  async ({ mmpFlowPage }, dateStr: string) => {
    await mmpFlowPage.addLevel1WithStartDate(dateStr);
  },
);

When(
  'I enable MMP with amount 2000 percentage 100 and earning types Commission and Bonus in mmp validation',
  async ({ mmpFlowPage }) => {
    await mmpFlowPage.configureMmpOnSettings();
  },
);

When(
  'I enable MMP with amount 2000 percentage 100 and earning type Bonus only in mmp validation',
  async ({ mmpFlowPage }) => {
    await mmpFlowPage.mmpSettingsPage.configureMmpProgram({
      amount: MMP.contributionAmount,
      percentage: MMP.contributionPercentage,
      earningTypes: ['Bonus'],
    });
  },
);

// ── Statement file 1 ────────────────────────────────────────────────────────

Given('the mmp single-row statement file is prepared in mmp validation', async ({ mmpFlowPage }) => {
  await mmpFlowPage.prepareFile1();
});

Then(
  'the mmp product name and ops manager email are reported for human config in mmp validation',
  async ({ mmpFlowPage }) => {
    mmpFlowPage.reportProductAndOpsEmail();
  },
);

When(
  'I configure the mmp product Bonus earning type in mmp validation',
  async ({ mmpFlowPage }) => {
    await mmpFlowPage.configureProductBonusEarningType();
  },
);

When('I open the statement upload page in mmp validation', async ({ mmpFlowPage }) => {
  await mmpFlowPage.openUpload();
});

When('I upload the prepared mmp file 1 in mmp validation', async ({ mmpFlowPage }) => {
  await mmpFlowPage.uploadFile1();
});

When('I select the mmp statement type in mmp validation', async ({ mmpFlowPage }) => {
  await mmpFlowPage.selectMmpStatementType();
});

When('I submit the mmp upload for processing in mmp validation', async ({ mmpFlowPage }) => {
  await mmpFlowPage.submitUpload();
});

Then(
  'the mmp file 1 extract processing completes and file ID is captured in mmp validation',
  async ({ mmpFlowPage }) => {
    await mmpFlowPage.pollExtractAndCaptureFileId(1);
  },
);

Then(
  'the mmp file 1 upload row shows Waiting and Review in mmp validation',
  async ({ mmpFlowPage }) => {
    await mmpFlowPage.expectWaitingReview(1);
  },
);

When('I open the mmp file 1 review page in mmp validation', async ({ mmpFlowPage }) => {
  await mmpFlowPage.openReview(1);
});

Then('every transaction type is {string} in mmp validation', async ({ mmpFlowPage }, type: string) => {
  await mmpFlowPage.assertEveryTransactionType(type);
});

When('I complete review on the mmp review page in mmp validation', async ({ mmpFlowPage }) => {
  await mmpFlowPage.completeReview();
});

When(
  'I process the mmp file 1 until Completed in mmp validation',
  async ({ mmpFlowPage }) => {
    await mmpFlowPage.processUntilCompleted(1);
  },
);

When(
  'I open the mmp commission details for file 1 in mmp validation',
  async ({ mmpFlowPage }) => {
    await mmpFlowPage.openCommissionDetails(1);
  },
);

Then(
  'the MMP table is visible on the reconciliation page in mmp validation',
  async ({ mmpFlowPage }) => {
    await mmpFlowPage.expectMmpTableVisible();
  },
);

// ── Statement file 2 / renewal ──────────────────────────────────────────────

Given(
  'the mmp multi-row statement file is prepared to exceed MMP cap in mmp validation',
  async ({ mmpFlowPage }) => {
    await mmpFlowPage.prepareFile2();
  },
);

When('I upload the prepared mmp file 2 in mmp validation', async ({ mmpFlowPage }) => {
  await mmpFlowPage.uploadFile2();
});

Then(
  'the mmp file 2 extract processing completes and file ID is captured in mmp validation',
  async ({ mmpFlowPage }) => {
    await mmpFlowPage.pollExtractAndCaptureFileId(2);
  },
);

Then(
  'the mmp file 2 upload row shows Waiting and Review in mmp validation',
  async ({ mmpFlowPage }) => {
    await mmpFlowPage.expectWaitingReview(2);
  },
);

When('I open the mmp file 2 review page in mmp validation', async ({ mmpFlowPage }) => {
  await mmpFlowPage.openReview(2);
});

When(
  'I process the mmp file 2 until Completed in mmp validation',
  async ({ mmpFlowPage }) => {
    await mmpFlowPage.processUntilCompleted(2);
  },
);

Given(
  'the mmp renewal statement file is prepared from stored policy in mmp validation',
  async ({ mmpFlowPage }) => {
    await mmpFlowPage.prepareRenewalFile();
  },
);

When('I upload the prepared mmp renewal file in mmp validation', async ({ mmpFlowPage }) => {
  await mmpFlowPage.uploadFile2();
});

Then(
  'the mmp renewal extract processing completes and file ID is captured in mmp validation',
  async ({ mmpFlowPage }) => {
    await mmpFlowPage.pollExtractAndCaptureFileId(2);
  },
);

When('I open the mmp renewal review page in mmp validation', async ({ mmpFlowPage }) => {
  await mmpFlowPage.openReview(2);
});

When(
  'I process the mmp renewal until Completed in mmp validation',
  async ({ mmpFlowPage }) => {
    await mmpFlowPage.processUntilCompleted(2);
  },
);

// ── Agent ledger ────────────────────────────────────────────────────────────

When('I log out and log in as the created agent in mmp validation', async ({ mmpFlowPage }) => {
  await mmpFlowPage.logoutAndLoginAsAgent();
});

When('I open the agent Ledger in mmp validation', async ({ mmpFlowPage }) => {
  await mmpFlowPage.openAgentLedger();
});

Then(
  'the sum of MMP ledger amounts equals the configured max contribution in mmp validation',
  async ({ mmpFlowPage }) => {
    await mmpFlowPage.expectMmpLedgerSumEqualsMax();
  },
);

Then(
  'the agent ledger shows MMP deduction rows in mmp validation',
  async ({ mmpFlowPage }) => {
    await mmpFlowPage.expectMmpLedgerRowsPresent();
  },
);

Then(
  'the agent ledger shows Bonus credit and MMP debit in mmp validation',
  async ({ mmpFlowPage }) => {
    await mmpFlowPage.expectLedgerTypesPresent(['Bonus', 'MMP']);
  },
);
