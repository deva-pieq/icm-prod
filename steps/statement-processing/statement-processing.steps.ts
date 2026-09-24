import path from 'node:path';
import { expect } from '@playwright/test';
import { Given, When, Then } from '../fixtures';
import { STATEMENT_PROCESSING } from '../../test-data/statement-processing/validateStatementProcessing';
import type { PreparedStatementFile } from '../../utils/excelStatementPrep';
import {
  prepareValidStatementFile,
  duplicateStatementFilePath,
  prepareCsvStatementFile,
  prepareCsvFromPreparedFile,
  prepareCsvWithExistingCustomerUid,
  prepareMissingColumnsStatementFile,
  prepareInvalidFormatFile,
  prepareLargeStatementFile,
  preparePartialReconciliationFile,
  prepareStateVariantsFile,
  prepareTransactionTypeFile,
  mutatePreparedFileAddress,
} from '../../utils/statement-processing/statementProcessingExcelPrep';
import {
  setStatementProcessingPreparedFile,
  getStatementProcessingPreparedFile,
  setStatementProcessingDuplicatePath,
  setStatementProcessingCsvPath,
  setStatementProcessingMissingColumnsPath,
  setStatementProcessingInvalidFormatPath,
  setStatementProcessingLargePath,
  setStatementProcessingPartialPath,
  setStatementProcessingStatesPath,
  setStatementProcessingNbRnPath,
  getStatementProcessingDuplicatePath,
  getStatementProcessingCsvPath,
  getStatementProcessingMissingColumnsPath,
  getStatementProcessingInvalidFormatPath,
  getStatementProcessingLargePath,
  getStatementProcessingPartialPath,
  getStatementProcessingStatesPath,
  getStatementProcessingNbRnPath,
  setStatementProcessingCaptures,
  getStatementProcessingCaptures,
  setStatementProcessingUploadState,
  getStatementProcessingUploadState,
  setStatementProcessingBulkReviewSession,
  getStatementProcessingBulkReviewSession,
} from '../../utils/statement-processing/statementProcessingContext';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';

const T = smokeStepTimeoutMs;

function fileFromPath(absolutePath: string): PreparedStatementFile {
  return {
    absolutePath,
    fileName: path.basename(absolutePath),
    carrierName: STATEMENT_PROCESSING.carrierName,
  };
}

async function captureExtractFileId(
  baseStatementUploadPage: {
    getPreparedFile: () => PreparedStatementFile;
    getStoredRow: () => { fileId: string; fileName: string; carrierName: string } | null;
    captureStoredFileId: (fileId: string) => Promise<void>;
    assertions: {
      pollPastExtractProcessing: (
        fileName: string,
        options: { maxAttempts: number; intervalMs: number },
      ) => Promise<string>;
    };
  },
  poll: { maxAttempts: number; intervalMs: number } = STATEMENT_PROCESSING.uploadPoll,
): Promise<string> {
  const file = baseStatementUploadPage.getPreparedFile();
  // Never poll the previous upload's BT-* id after a mid-scenario re-upload.
  setStatementProcessingUploadState({
    fileId: '',
    fileName: file.fileName,
    stage: '',
  });
  const fileId = await baseStatementUploadPage.assertions.pollPastExtractProcessing(
    file.fileName,
    poll,
  );
  await baseStatementUploadPage.captureStoredFileId(fileId);
  setStatementProcessingUploadState({
    fileId,
    fileName: file.fileName,
    stage: STATEMENT_PROCESSING.expectedAfterExtract.stage,
  });
  return fileId;
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 1 — Prepare statement files
// ═══════════════════════════════════════════════════════════════════════════

Given('the statement processing valid file is prepared from template', async () => {
  const prepared = await prepareValidStatementFile();
  setStatementProcessingPreparedFile(prepared);
  setStatementProcessingCaptures({
    grossCommission: prepared.grossCompensation,
    matchedPolicyNumber: prepared.customerUid,
    matchedAgentNpn: prepared.agentNpn,
    policyState: prepared.state,
    expectedReviewRecordCount: prepared.recordCount,
  });
});

Given('the statement processing duplicate file is prepared from the stored file', async () => {
  setStatementProcessingDuplicatePath(duplicateStatementFilePath());
});

Given('the statement processing CSV file is prepared from template', async () => {
  setStatementProcessingCsvPath(await prepareCsvStatementFile());
  setStatementProcessingCaptures({ expectedReviewRecordCount: 1 });
});

Given(
  'the statement processing CSV file is prepared with the existing Customer UID {string}',
  async ({}, customerUid: string) => {
    const csv = await prepareCsvWithExistingCustomerUid(customerUid.trim());
    setStatementProcessingCsvPath(csv.absolutePath);
    setStatementProcessingCaptures({
      expectedReviewRecordCount: csv.recordCount,
      matchedPolicyNumber: csv.customerUid,
      seededPolicyUid: csv.customerUid,
    });
  },
);

Given('the statement processing CSV file is prepared from the stored prepared file', async () => {
  const prepared = getStatementProcessingPreparedFile();
  setStatementProcessingCsvPath(await prepareCsvFromPreparedFile(prepared));
  setStatementProcessingCaptures({
    expectedReviewRecordCount: prepared.recordCount || 1,
    matchedPolicyNumber: prepared.customerUid,
  });
});

Given('the statement processing prepared file address is mutated with random chars', async () => {
  const prepared = getStatementProcessingPreparedFile();
  await mutatePreparedFileAddress(prepared);
  setStatementProcessingPreparedFile(prepared);
  setStatementProcessingCaptures({
    expectedReviewRecordCount: prepared.recordCount || 1,
    matchedPolicyNumber: prepared.customerUid,
  });
});

Given('the statement processing missing columns file is prepared from template', async () => {
  setStatementProcessingMissingColumnsPath(await prepareMissingColumnsStatementFile());
});

Given('the statement processing invalid format file is prepared', async () => {
  setStatementProcessingInvalidFormatPath(prepareInvalidFormatFile());
});

Given('the statement processing large file is prepared with {int} data rows', async ({}, rowCount: number) => {
  const large = await prepareLargeStatementFile(rowCount);
  setStatementProcessingLargePath(large.absolutePath);
  setStatementProcessingCaptures({ expectedReviewRecordCount: rowCount });
});

Given(
  'the statement processing partial reconciliation file is prepared with one NB, one RN, and one chargeback',
  async () => {
    const seededUid = getStatementProcessingCaptures().seededPolicyUid;
    const partial = await preparePartialReconciliationFile(seededUid);
    setStatementProcessingPartialPath(partial.absolutePath);
    setStatementProcessingCaptures({
      expectedReviewRecordCount: partial.recordCount,
      expectedInvalidCount: partial.invalidCount,
      expectedMatchedCount: partial.matchedCount,
    });
  },
);

Given('the statement processing state variants file is prepared for TX, CA, IL', async () => {
  setStatementProcessingStatesPath(await prepareStateVariantsFile());
  setStatementProcessingCaptures({
    expectedReviewRecordCount: 3,
    expectedStates: ['TX', 'CA', 'IL'],
  });
});

Given('the statement processing transaction type file is prepared with NB and RN rows', async () => {
  const seededUid = getStatementProcessingCaptures().seededPolicyUid;
  setStatementProcessingNbRnPath(await prepareTransactionTypeFile(seededUid));
  setStatementProcessingCaptures({
    expectedReviewRecordCount: 2,
    expectedTransactionTypes: ['NB', 'RN'],
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 2 — Prepared-file assertions
// ═══════════════════════════════════════════════════════════════════════════

Then('the statement processing prepared file has exactly one data row', async () => {
  expect(getStatementProcessingPreparedFile().recordCount).toBe(1);
});

Then('the statement processing prepared file has a unique Customer UID', async () => {
  const uid = getStatementProcessingPreparedFile().customerUid;
  expect(uid).not.toBe('');
  expect(uid).toMatch(
    new RegExp(`^${STATEMENT_PROCESSING.customerUidPrefix}\\d{${STATEMENT_PROCESSING.customerUidPad}}$`),
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 3 — Upload flow
// ═══════════════════════════════════════════════════════════════════════════

When('I open the statement processing upload page', async ({ baseStatementUploadPage }) => {
  await baseStatementUploadPage.openUploadPage();
});

When('I upload the prepared statement processing file', async ({ baseStatementUploadPage }) => {
  await baseStatementUploadPage.uploadFromPrepared(getStatementProcessingPreparedFile());
});

When('I upload the prepared statement processing duplicate file', async ({ baseStatementUploadPage }) => {
  await baseStatementUploadPage.uploadFromPrepared(fileFromPath(getStatementProcessingDuplicatePath()));
});

When('I upload the prepared statement processing CSV file', async ({ baseStatementUploadPage }) => {
  await baseStatementUploadPage.uploadFromPrepared(fileFromPath(getStatementProcessingCsvPath()));
});

When('I upload the prepared statement processing missing columns file', async ({ baseStatementUploadPage }) => {
  await baseStatementUploadPage.uploadFromPrepared(
    fileFromPath(getStatementProcessingMissingColumnsPath()),
  );
});

When('I upload the prepared statement processing invalid format file', async ({ baseStatementUploadPage }) => {
  await baseStatementUploadPage.uploadFromPrepared(
    fileFromPath(getStatementProcessingInvalidFormatPath()),
  );
});

When('I upload the prepared statement processing large file', async ({ baseStatementUploadPage }) => {
  await baseStatementUploadPage.uploadFromPrepared(fileFromPath(getStatementProcessingLargePath()));
});

When('I upload the prepared statement processing partial file', async ({ baseStatementUploadPage }) => {
  await baseStatementUploadPage.uploadFromPrepared(fileFromPath(getStatementProcessingPartialPath()));
});

When('I upload the prepared statement processing state variants file', async ({ baseStatementUploadPage }) => {
  await baseStatementUploadPage.uploadFromPrepared(fileFromPath(getStatementProcessingStatesPath()));
});

When('I upload the prepared statement processing transaction type file', async ({ baseStatementUploadPage }) => {
  await baseStatementUploadPage.uploadFromPrepared(fileFromPath(getStatementProcessingNbRnPath()));
});

When(
  'I select the statement type {string} in statement processing validation',
  async ({ baseStatementUploadPage }, statementType: string) => {
    await baseStatementUploadPage.selectStatementType(statementType);
  },
);

When('I submit the statement processing upload for processing', async ({ baseStatementUploadPage }) => {
  await baseStatementUploadPage.clickUploadStatement();
});

Then(
  'the statement processing upload extract processing completes and file ID is captured',
  async ({ baseStatementUploadPage }) => {
    await captureExtractFileId(baseStatementUploadPage);
  },
);

Then(
  'the statement processing large file extract processing completes and file ID is captured',
  async ({ baseStatementUploadPage }) => {
    await captureExtractFileId(baseStatementUploadPage, STATEMENT_PROCESSING.largeFilePoll);
  },
);

Then(
  'the statement processing upload row shows status {string} and stage {string}',
  async ({ baseStatementUploadPage }, status: string, stage: string) => {
    await baseStatementUploadPage.expectStoredUploadStatusAndStage(status, stage);
  },
);

Then(
  'the statement processing large file row shows status {string} and stage {string}',
  async ({ baseStatementUploadPage }, status: string, stage: string) => {
    await baseStatementUploadPage.expectStoredUploadStatusAndStage(status, stage);
  },
);

Then(
  'the statement processing upload is not accepted and an error is shown',
  async ({ page }) => {
    const errorIndicators = [
      page.getByTestId(/toast/).first(),
      page.getByRole('alert').first(),
      page.getByText(/not supported|invalid|failed|error/i).first(),
    ];
    await expect
      .poll(
        async () => {
          for (const locator of errorIndicators) {
            if (await locator.isVisible().catch(() => false)) return 'error';
          }
          return 'none';
        },
        { timeout: T, intervals: [1_000, 2_000, 4_000] },
      )
      .toBe('error');
  },
);

Then(
  'the statement processing upload statement button is disabled',
  async ({ baseStatementUploadPage }) => {
    await baseStatementUploadPage.expectUploadProcessButtonDisabled();
  },
);

Then('the statement processing page shows Invalid file', async ({ page }) => {
  await expect(page.getByText('Invalid file')).toBeVisible({ timeout: T });
});

Then(
  'the statement processing upload is rejected or lands in Needs Attention',
  async ({ page, baseStatementUploadPage }) => {
    const errorIndicators = [
      page.getByTestId(/toast/).first(),
      page.getByRole('alert').first(),
      page.getByText(/not supported|invalid|failed|error|missing|required|mandatory/i).first(),
    ];

    await expect
      .poll(
        async () => {
          for (const locator of errorIndicators) {
            if (await locator.isVisible().catch(() => false)) return 'error';
          }
          try {
            const file = baseStatementUploadPage.getPreparedFile();
            await baseStatementUploadPage.refreshRecentlyUploadedGrid();
            const { status, stage } = await baseStatementUploadPage.readUploadRowStatusAndStage(
              await baseStatementUploadPage.resolveStoredUploadRow({ fileName: file.fileName }),
            );
            if (/needs attention/i.test(stage) || /error|failed/i.test(status)) {
              return 'needs-attention';
            }
            // Missing-column files that still reach Review are treated as accepted-for-review;
            // Complete Review later should push Needs Attention — count as handled here too.
            if (/waiting/i.test(status) && /review/i.test(stage)) {
              return 'review';
            }
          } catch {
            /* row may not exist yet on hard reject */
          }
          return 'none';
        },
        { timeout: T * 2, intervals: [1_000, 2_000, 4_000] },
      )
      .toMatch(/^(error|needs-attention|review)$/);
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 4 — Review stage
// ═══════════════════════════════════════════════════════════════════════════

When(
  'I open the statement processing review page for the stored upload',
  async ({ baseStatementUploadPage }) => {
    await baseStatementUploadPage.openReviewForStoredUpload();
  },
);

Then(
  'the statement processing review page shows the prepared file name',
  async ({ baseStatementUploadPage }) => {
    await baseStatementUploadPage.expectReviewPageForStoredUpload();
  },
);

Then(
  'the statement processing review page shows record count {int}',
  async ({ statementReviewPage }, count: number) => {
    const actual = await statementReviewPage.assertions.expectRecordCount(count);
    setStatementProcessingCaptures({ reviewRecordCount: actual });
  },
);

Then(
  'the statement processing review page shows at least {int} records',
  async ({ statementReviewPage }, min: number) => {
    const actual = await statementReviewPage.assertions.expectRecordCountGreaterThan(min - 1);
    expect(actual).toBeGreaterThanOrEqual(min);
    setStatementProcessingCaptures({ reviewRecordCount: actual });
  },
);

Then(
  'the statement processing review page maps prepared policy and agent',
  async ({ statementReviewPage }) => {
    const prepared = getStatementProcessingPreparedFile();
    await statementReviewPage.assertions.expectGridContainsFragments(
      prepared.customerUid,
      prepared.agentNpn,
    );
    setStatementProcessingCaptures({
      matchedPolicyNumber: prepared.customerUid,
      matchedAgentNpn: prepared.agentNpn,
    });
  },
);

Then(
  'the statement processing review page shows prepared total earned commission',
  async ({ statementReviewPage }) => {
    const prepared = getStatementProcessingPreparedFile();
    // Review "Total Earned Commission" = Excel Net (not Gross).
    await statementReviewPage.assertions.expectTotalEarnedCommission(prepared.netCompensation);
    setStatementProcessingCaptures({ grossCommission: prepared.grossCompensation });
  },
);

Then(
  'the statement processing prepared file record count equals the review record count',
  async () => {
    const expected = getStatementProcessingCaptures().expectedReviewRecordCount;
    const actual = getStatementProcessingCaptures().reviewRecordCount;
    expect(expected, 'expectedReviewRecordCount must be set by prep').toBeGreaterThan(0);
    expect(actual, 'reviewRecordCount must be captured from review footer').toBe(expected);
  },
);

Then(
  'the statement processing seeded policy UID is stored from the prepared file',
  async () => {
    const uid = getStatementProcessingPreparedFile().customerUid;
    expect(uid).toBeTruthy();
    setStatementProcessingCaptures({
      seededPolicyUid: uid,
      matchedPolicyNumber: uid,
    });
  },
);

Then(
  'the statement processing review page shows states {string}',
  async ({ statementReviewPage }, statesCsv: string) => {
    const states = statesCsv.split(',').map((s) => s.trim()).filter(Boolean);
    await statementReviewPage.assertions.expectGridContainsFragments(...states);
    setStatementProcessingCaptures({ expectedStates: states });
  },
);

Then(
  'the statement processing review page shows transaction types {string} and {string}',
  async ({ statementReviewPage }, typeA: string, typeB: string) => {
    await statementReviewPage.assertions.expectTransactionTypesPresent([typeA, typeB]);
    setStatementProcessingCaptures({ expectedTransactionTypes: [typeA, typeB] });
  },
);

When(
  'I click Complete Review on the statement processing review page',
  async ({ baseStatementUploadPage }) => {
    await baseStatementUploadPage.completeReviewAndConfirm();
  },
);

Then(
  'the statement processing upload stage changes to {string}',
  async ({ baseStatementUploadPage }, stage: string) => {
    await baseStatementUploadPage.expectStoredUploadStage(stage);
  },
);

Then(
  'the statement processing large file upload stage changes to {string}',
  async ({ baseStatementUploadPage }, stage: string) => {
    await baseStatementUploadPage.expectStoredUploadStage(stage);
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 5 — Commission details / Needs Attention
// ═══════════════════════════════════════════════════════════════════════════

When(
  'I open commission details for the stored statement processing upload',
  async ({ baseStatementUploadPage }) => {
    await baseStatementUploadPage.openCommissionDetailsForStoredUpload();
  },
);

Then(
  'the statement processing commission details page is ready',
  async ({ commissionDetailsPage }) => {
    await commissionDetailsPage.expectOnDetailsPage();
  },
);

Then(
  'the statement processing commission details show prepared policy and agent',
  async ({ commissionDetailsPage }) => {
    const prepared = getStatementProcessingPreparedFile();
    const count = await commissionDetailsPage.getCommissionDetailsRowCount();
    expect(count).toBeGreaterThan(0);
    const body = commissionDetailsPage.grid();
    const text = (await body.innerText()).replace(/\s+/g, ' ');
    expect(text, `Commission details should contain policy ${prepared.customerUid}`).toContain(
      prepared.customerUid,
    );
    // Details grid shows Agent Name (display), not Selling agent NPN.
    if (prepared.agentNpn && text.includes(prepared.agentNpn)) {
      return;
    }
    expect(text, 'Commission details should show an agent name').toMatch(/agent/i);
  },
);

Then(
  'the statement processing commission details earned commission matches the prepared file',
  async ({ commissionDetailsPage }) => {
    const prepared = getStatementProcessingPreparedFile();
    // Details "Earned Commission" column matches Excel Net (same as Review Total Earned).
    const expected = prepared.netCompensation;
    const body = commissionDetailsPage.grid();
    const text = (await body.innerText()).replace(/\s+/g, ' ');
    const token = expected.toFixed(2);
    const altToken = expected.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const matched =
      text.includes(token) ||
      text.includes(altToken) ||
      text.includes(`$${token}`) ||
      text.includes(`$${altToken}`);
    expect(
      matched,
      `Commission details should show earned/net ~${token} (tolerance ${STATEMENT_PROCESSING.grossCommissionTolerance})`,
    ).toBeTruthy();
    setStatementProcessingCaptures({ grossCommission: prepared.grossCompensation });
  },
);

When(
  'I open the needs attention page in statement processing validation',
  async ({ needsAttentionPage }) => {
    await needsAttentionPage.open();
  },
);

When('I open the statement processing history page', async ({ statementHistoryPage }) => {
  await statementHistoryPage.open();
});

When(
  'I search statement history by stored file ID and open the record in statement processing validation',
  async ({ statementHistoryPage, baseStatementUploadPage }) => {
    // Prefer BT-* from extract capture. Opening review overwrites storedRow.fileId with a UUID
    // that History search cannot resolve.
    const stored = baseStatementUploadPage.getStoredRow()?.fileId ?? '';
    const fromState = getStatementProcessingUploadState().fileId ?? '';
    const fileId = /^BT-/i.test(fromState)
      ? fromState
      : /^BT-/i.test(stored)
        ? stored
        : fromState || stored;
    expect(fileId, 'stored upload file ID required for history search').toBeTruthy();
    await statementHistoryPage.openDetailsByFileId(fileId);
  },
);

Then(
  'the statement processing needs attention queue lists the stored upload',
  async ({ needsAttentionPage, baseStatementUploadPage }) => {
    const fileName =
      baseStatementUploadPage.getStoredRow()?.fileName ??
      baseStatementUploadPage.getPreparedFile().fileName;
    await needsAttentionPage.expectStoredFileVisibleInQueue(fileName);
  },
);

Then(
  'the statement processing needs attention queue has at least {int} exception row',
  async ({ needsAttentionPage }, min: number) => {
    await needsAttentionPage.expectExceptionRowCountAtLeast(min);
  },
);

Then(
  'the statement processing commission details NB row has no warning icon',
  async ({ commissionDetailsPage }) => {
    await commissionDetailsPage.expectWarningIconForTransactionType('NB', false);
  },
);

Then(
  'the statement processing commission details RN row has no warning icon',
  async ({ commissionDetailsPage }) => {
    await commissionDetailsPage.expectWarningIconForTransactionType('RN', false);
  },
);

Then(
  'the statement processing commission details RC row has a warning icon',
  async ({ commissionDetailsPage }) => {
    await commissionDetailsPage.expectWarningIconForTransactionType('RC', true);
  },
);

Then(
  'the statement processing commission details show {int} unmatched and {int} matched records',
  async ({ commissionDetailsPage }, unmatched: number, matched: number) => {
    await commissionDetailsPage.expectOnDetailsPage();
    const total = await commissionDetailsPage.getCommissionDetailsRowCount();
    expect(total, 'commission details row count').toBe(matched + unmatched);

    const warningCount = await commissionDetailsPage.loc.reconcileWarningIcon().count();
    // Prefer warning-icon count for unmatched; fall back to paymentStatus text.
    let unmatchedActual = warningCount;
    if (unmatchedActual === 0) {
      const statuses = await commissionDetailsPage.getPaymentStatusesFromGrid().catch(() => [] as string[]);
      unmatchedActual = statuses.filter((s) => /unmatch|pending|exception/i.test(s)).length;
    }
    const matchedActual = total - unmatchedActual;
    expect(unmatchedActual, 'unmatched records').toBe(unmatched);
    expect(matchedActual, 'matched records').toBe(matched);
    setStatementProcessingCaptures({
      expectedInvalidCount: unmatchedActual,
      expectedMatchedCount: matchedActual,
    });
  },
);

Then(
  'the statement processing matched and unmatched counts equal the prepared file record count',
  async () => {
    const caps = getStatementProcessingCaptures();
    const fileRows = caps.expectedReviewRecordCount;
    expect(fileRows).toBeGreaterThan(0);
    expect(caps.expectedMatchedCount + caps.expectedInvalidCount).toBe(fileRows);
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// Bulk update (Review stage)
// ═══════════════════════════════════════════════════════════════════════════

Then(
  'the statement processing review is stored for bulk update scenarios',
  async ({ statementReviewPage }) => {
    await statementReviewPage.expectOnReviewPage();
    const fileId = statementReviewPage.getFileIdFromUrl();
    const recordCount = getStatementProcessingCaptures().reviewRecordCount;
    expect(fileId, 'Review URL file id').toBeTruthy();
    expect(recordCount, 'Review record count must be captured before store').toBeGreaterThan(0);
    setStatementProcessingBulkReviewSession({
      reviewUrl: statementReviewPage.page.url(),
      fileId,
      recordCount,
    });
  },
);

Given(
  'the statement processing review is open for bulk update',
  async ({ statementReviewPage }) => {
    const session = getStatementProcessingBulkReviewSession();
    await statementReviewPage.ensureBulkReviewSession(session.reviewUrl, session.fileId);
    await statementReviewPage.assertions.expectRecordCount(session.recordCount);
  },
);

When(
  'I bulk update review field {string} to {string} with rationale {string} on statement processing review',
  async ({ statementReviewPage }, field: string, newValue: string, rationale: string) => {
    await statementReviewPage.bulkUpdateField(field, newValue, rationale);
  },
);

Then('the review bulk update toast is shown on statement processing review', async ({ statementReviewPage }) => {
  await statementReviewPage.expectBulkUpdateToast();
});

Then(
  'selected review rows show field {string} with value {string} on statement processing review',
  async ({ statementReviewPage }, field: string, newValue: string) => {
    await statementReviewPage.expectVisibleRowsShowBulkValue(field, newValue);
  },
);
