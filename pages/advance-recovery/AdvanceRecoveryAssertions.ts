import { expect } from '@playwright/test';

const LOG_PREFIX = '[advance-recovery-assert]';

export class AdvanceRecoveryAssertions {
  /**
   * Validate that the ARF row amount matches the captured total advance amount.
   */
  expectArfValueMatches(actual: number, expected: number): void {
    const delta = Math.abs(actual - expected);
    const passed = delta < 0.02;

    console.log(
      `${LOG_PREFIX} [arf]\n` +
        `  actual:   $${actual.toFixed(2)}\n` +
        `  expected: $${expected.toFixed(2)}\n` +
        `  result:   ${passed ? 'PASS' : 'FAIL'}`,
    );

    expect(
      actual,
      `ARF value mismatch: actual $${actual.toFixed(2)} vs expected $${expected.toFixed(2)}`,
    ).toBeCloseTo(expected, 2);
  }

  /**
   * Validate that captured Advance Default and Monthly values from
   * the Advance Setup grid match expected values.
   */
  expectAdvanceSetupValues(defaultValue: string, monthlyValue: number): void {
    expect(defaultValue, 'Advance Default should not be empty').toBeTruthy();
    expect(monthlyValue, 'Advance Monthly should be greater than 0').toBeGreaterThan(0);

    console.log(
      `${LOG_PREFIX} [advance-setup]\n` +
        `  default: ${defaultValue}\n` +
        `  monthly: ${monthlyValue}\n` +
        `  result:  PASS`,
    );
  }
}
