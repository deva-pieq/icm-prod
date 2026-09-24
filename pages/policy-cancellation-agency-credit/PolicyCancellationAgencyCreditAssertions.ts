import { expect } from '@playwright/test';

export class PolicyCancellationAgencyCreditAssertions {
  /**
   * Validate the policy ledger displays the AGENCY_CREDIT entry after the
   * advance payout where the agent is NOT eligible for advance — the agency
   * receives the money instead of the agent.
   */
  validateAgencyCreditLedgerEntry(ledgerText: string): void {
    expect(ledgerText, 'Ledger should contain AGENCY_CREDIT entry').toContain('AGENCY_CREDIT');
  }

  /**
   * Validate the AGENCY_DEBIT entries appear after the partial recovery phase.
   */
  validateAgencyDebitLedgerEntries(ledgerText: string): void {
    expect(ledgerText, 'Ledger should contain AGENCY_DEBIT entry').toContain('AGENCY_DEBIT');
  }

  /**
   * Validate the policy cancellation agency info banner states the carrier
   * advance was credited to the agency (agent not eligible).
   */
  validateAgencyInfoBannerText(bannerText: string): void {
    expect(bannerText.toLowerCase(), 'Banner should describe the agency credit').toContain('agency');
    expect(bannerText.toLowerCase(), 'Banner should mention the carrier advance was not paid to the agent')
      .toContain('not paid to the agent');
  }
}
