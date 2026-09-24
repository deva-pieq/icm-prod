import { expect } from '@playwright/test';

export class PolicyCancellationCarrierAdvanceAssertions {
  /**
   * Validate the policy ledger displays correct advance recovery entries
   * after a policy cancellation with carrier advance flow.
   */
  validateCancellationLedgerEntries(ledgerText: string): void {
    expect(ledgerText, 'Ledger should contain ADVANCE_PAYOUT entry').toContain('ADVANCE_PAYOUT');
  }

  /**
   * Validate chargeback entries appear after cancellation.
   */
  validateChargebackEntries(ledgerText: string): void {
    expect(ledgerText, 'Ledger should contain CHARGEBACK entry').toContain('CHARGEBACK');
  }

  /**
   * Validate advance recovery entries after recovery statements.
   */
  validateAdvanceRecoveryEntries(ledgerText: string): void {
    expect(ledgerText, 'Ledger should contain ADVANCE_EARNED entry').toContain('ADVANCE_EARNED');
  }
}
