import { CHARGEBACK } from '../../test-data/chargeback/validateChargeback';
import { getActiveRcVariant } from '../../utils/chargeback/chargebackContext';
import { Given, When, Then } from '../fixtures';

// ═══ Prep ═════════════════════════════════════════════════════════════

Given('the chargeback NB statement file is prepared from template', async ({ chargebackPage }) => {
  await chargebackPage.prepareNbFile();
});

Given(
  'the chargeback NB Customer UID is incremented and stored in chargeback validation',
  async ({ chargebackPage }) => {
    chargebackPage.storeNbPreparedData();
  },
);

Given('the chargeback NB prepared file is saved with a timestamp suffix', async () => {
  // Timestamped copy is written inside prepareNbFile(); this step documents the contract.
});

Given(
  'the chargeback RC1 statement file is prepared from template in chargeback validation',
  async ({ chargebackPage }) => {
    await chargebackPage.prepareRcFile('RC1');
  },
);

Given(
  'the chargeback RC2 statement file is prepared from template in chargeback validation',
  async ({ chargebackPage }) => {
    await chargebackPage.prepareRcFile('RC2');
  },
);

Given(
  'the chargeback RC3 statement file is prepared from template in chargeback validation',
  async ({ chargebackPage }) => {
    await chargebackPage.prepareRcFile('RC3');
  },
);

Given(
  'the RC file Customer UID is replaced with the stored PolicyNumber in chargeback validation',
  async () => {
    // UID replacement happens inside prepareRcFile(); documents shared-UID contract.
  },
);

// ═══ Upload ═══════════════════════════════════════════════════════════

When('I open the chargeback statement upload page', async ({ chargebackPage }) => {
  await chargebackPage.openStatementUploadPage();
});

When('I upload the prepared chargeback NB file', async ({ chargebackPage }) => {
  await chargebackPage.uploadNbFile();
});

When('I upload the prepared chargeback RC file', async ({ chargebackPage }) => {
  await chargebackPage.uploadActiveRcFile();
});

When(
  'I select the statement type {string} in chargeback validation',
  async ({ chargebackPage }, statementType: string) => {
    await chargebackPage.selectStatementType(statementType);
  },
);

When('I submit the chargeback upload for processing', async ({ chargebackPage }) => {
  await chargebackPage.submitUpload();
});

Then(
  'the uploaded chargeback NB file appears in the recently uploaded grid',
  async ({ chargebackPage }) => {
    await chargebackPage.expectNbFileInGrid();
  },
);

Then(
  'the uploaded chargeback RC file appears in the recently uploaded grid',
  async ({ chargebackPage }) => {
    await chargebackPage.expectActiveRcFileInGrid();
  },
);

Then(
  'the chargeback NB upload extract processing completes and file ID is captured',
  async ({ chargebackPage }) => {
    await chargebackPage.pollNbExtractAndCaptureFileId();
  },
);

Then(
  'the chargeback RC upload extract processing completes and file ID is captured',
  async ({ chargebackPage }) => {
    await chargebackPage.pollActiveRcExtractAndCaptureFileId();
  },
);

Then(
  'the chargeback NB upload row shows status {string} and stage {string}',
  async ({ chargebackPage }, _status: string, _stage: string) => {
    await chargebackPage.expectNbUploadWaitingReview();
  },
);

Then(
  'the chargeback RC upload row shows status {string} and stage {string}',
  async ({ chargebackPage }, _status: string, _stage: string) => {
    await chargebackPage.expectActiveRcUploadWaitingReview();
  },
);

// ═══ Review ═══════════════════════════════════════════════════════════

When(
  'I open the chargeback review page for the stored NB upload',
  async ({ chargebackPage }) => {
    await chargebackPage.openNbReviewPage();
  },
);

When(
  'I open the chargeback review page for the stored RC upload',
  async ({ chargebackPage }) => {
    await chargebackPage.openActiveRcReviewPage();
  },
);

When('I click Complete Review on the chargeback review page', async ({ chargebackPage }) => {
  await chargebackPage.completeReview();
});

Then(
  'the chargeback NB upload stage changes to {string}',
  async ({ chargebackPage }, stage: string) => {
    if (stage === CHARGEBACK.completedStage) {
      await chargebackPage.expectNbUploadStageCompleted();
    } else {
      await chargebackPage.expectStoredUploadStage(stage);
    }
  },
);

Then(
  'the chargeback RC upload stage changes to {string}',
  async ({ chargebackPage }, stage: string) => {
    await chargebackPage.expectActiveRcUploadStage(stage);
  },
);

// ═══ History ══════════════════════════════════════════════════════════

When(
  'I navigate to the commission statement history page in chargeback validation',
  async ({ chargebackPage }) => {
    await chargebackPage.openStatementHistoryPage();
  },
);

When(
  'I search the statement history by stored NB file ID in chargeback validation',
  async ({ chargebackPage }) => {
    await chargebackPage.searchHistoryForNbCompleted();
  },
);

When(
  'I search the statement history by stored RC file ID in chargeback validation',
  async ({ chargebackPage }) => {
    await chargebackPage.searchHistoryForActiveRc();
  },
);

Then(
  'the statement history row stage is {string} for the NB file in chargeback validation',
  async ({ chargebackPage }, stage: string) => {
    await chargebackPage.expectHistoryRowStage(chargebackPage.getNbFileIdForSteps(), stage);
  },
);

Then(
  'the statement history row stage is {string} for the RC file in chargeback validation',
  async ({ chargebackPage }, stage: string) => {
    await chargebackPage.expectHistoryRowStage(
      chargebackPage.getRcFileIdForSteps(getActiveRcVariant()),
      stage,
    );
  },
);

When(
  'I click the record in the statement history grid in chargeback validation',
  async ({ chargebackPage }) => {
    await chargebackPage.clickActiveRcStatementHistoryRecord();
  },
);

Then(
  'the commission details page is displayed in chargeback validation',
  async ({ chargebackPage }) => {
    await chargebackPage.expectCommissionDetailsPageDisplayed();
  },
);

Then(
  'the total chargeback card shows a non-zero value in chargeback validation',
  async ({ chargebackPage }) => {
    await chargebackPage.expectTotalChargebackCardNonZero();
  },
);

When(
  'I click the CHARGEBACK record on the commission details page in chargeback validation',
  async ({ chargebackPage }) => {
    await chargebackPage.clickChargebackRecordOnCommissionDetails();
  },
);

When('I click the RC history record in chargeback validation', async ({ chargebackPage }) => {
  await chargebackPage.clickActiveRcHistoryRecord();
});

// ═══ Chargeback recovery ══════════════════════════════════════════════

Then(
  'the Chargeback Recovery Required heading is displayed in chargeback validation',
  async ({ chargebackPage }) => {
    await chargebackPage.expectChargebackRecoveryHeadingVisible();
  },
);

When(
  'I ensure the recovery option radio is selected for the active RC in chargeback validation',
  async ({ chargebackPage }) => {
    await chargebackPage.ensureRecoveryOptionSelected(getActiveRcVariant());
  },
);

When(
  'I enter the chargeback rationale for the active RC in chargeback validation',
  async ({ chargebackPage }) => {
    const variant = getActiveRcVariant();
    await chargebackPage.fillChargebackRationale(CHARGEBACK.recoveryOptions[variant].rationale);
  },
);

When('I click Reconcile on the chargeback recovery page', async ({ chargebackPage }) => {
  await chargebackPage.clickReconcileAndWait();
});

When('I wait for 2 seconds in chargeback validation', async ({ chargebackPage }) => {
  await chargebackPage.waitMs(2_000);
});

// ═══ Policy Ledger ════════════════════════════════════════════════════

When(
  'I navigate to the Policies page in chargeback validation',
  async ({ chargebackPage }) => {
    await chargebackPage.navigateToPoliciesPage();
  },
);

When(
  'I search the Policies grid by stored Policy Number in chargeback validation',
  async ({ chargebackPage }) => {
    await chargebackPage.searchPoliciesByStoredPolicyNumber();
  },
);

When(
  'I click the policy actions kebab and open Policy Ledger in chargeback validation',
  async ({ chargebackPage }) => {
    await chargebackPage.openPolicyLedger();
  },
);

Then(
  'the Policy Ledger page is displayed in chargeback validation',
  async ({ chargebackPage }) => {
    await chargebackPage.expectPolicyLedgerDisplayed();
  },
);

Then(
  'the Policy Ledger contains a {string} earning type row in chargeback validation',
  async ({ chargebackPage }, earningType: string) => {
    await chargebackPage.expectLedgerContainsEarningType(earningType);
  },
);

When(
  'I click the last CHARGEBACK row in the Policy Ledger in chargeback validation',
  async ({ chargebackPage }) => {
    await chargebackPage.clickLastChargebackRowInLedger();
  },
);

Then(
  'the CHARGEBACK detail row matches the active RC recovery parties in chargeback validation',
  async ({ chargebackPage }) => {
    await chargebackPage.expectActiveRcLedgerDetailParties();
  },
);
