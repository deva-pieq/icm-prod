import { expect } from '@playwright/test';
import { STATEMENT_UPLOAD } from '../../test-data/commission-statements/statementUpload';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';
import type { PayablesPage } from './PayablesPage';

const T = smokeStepTimeoutMs;

export class PayablesAssertions {
  constructor(private readonly payablesPage: PayablesPage) {}

  async expectSourceTraceContainsFileId(fileId: string): Promise<void> {
    await expect(this.payablesPage.grid()).toBeVisible({ timeout: T });
    await expect
      .poll(
        async () => {
          const rows = this.payablesPage.getDataRows();
          const count = await rows.count();
          for (let i = 0; i < count; i++) {
            const row = rows.nth(i);
            const trace = await this.payablesPage.readCellText(
              row,
              STATEMENT_UPLOAD.gridColumns.sourceTrace,
            );
            const rowText = (await row.innerText()).replace(/\s+/g, ' ');
            if (trace.includes(fileId) || rowText.includes(fileId)) return true;
          }
          const gridText = (await this.payablesPage.grid().innerText()).replace(/\s+/g, ' ');
          return gridText.includes(fileId);
        },
        { timeout: T * 3, intervals: [2_000, 3_000, 5_000, 8_000] },
      )
      .toBe(true);
  }
}
