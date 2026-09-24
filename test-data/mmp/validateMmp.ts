import 'dotenv/config';
import path from 'node:path';
import { agency3OpsCredentials } from '../../utils/loadEnv';

const projectRoot = path.resolve(__dirname, '..', '..');

export const MMP = {
  templateFileName: '[MLB]MmpStatement-NB.xlsx',
  templateDir: path.join(projectRoot, 'TestFiles-prod-sanity', 'MmpTemplate'),
  generatedDir: path.join(projectRoot, 'TestFiles-prod-sanity', 'MmpTemplate', '.generated'),
  statementType: 'Aetna ACA',
  carrierName: 'Aetna',
  customerUidPrefix: 'ATENA-MMP-TEST-A',
  /** Pad width → ATENA-MMP-TEST-A000, A001, … Never reuse; prep +1 each run. */
  customerUidPad: 3,
  /** Amount configured on agent Settings in E2E flow (= live max). */
  contributionAmount: 2000,
  contributionPercentage: 100,
  /**
   * Live app max is $2000/mo (UI helper + over-max gate).
   * CSV SNO 6 said $1000 — do not use for T006 assertions.
   */
  maxContributionAmount: 2000,
  /**
   * Product Bonus earning kept at $200.
   * File1 commission + bonus = contributionAmount (1800 + 200 = 2000).
   */
  bonusAmount: 200,
  earningTypes: ['Commission', 'Bonus'] as const,
  allEarningTypes: ['Commission', 'Bonus', 'Override'] as const,
  validationMessages: {
    /** Live red error reuses the helper copy (not "…is $2000 per month"). */
    maxContribution: /maximum contribution:\s*\$2000\/per month/i,
    selectEarningType: /select at least one earning type/i,
    validContributionAmount: /please enter a valid contribution amount/i,
  },
  agentPassword: 'Test@123',
  /** Ops manager email (Agency 3) — env-driven, no hardcoded identity. */
  opsEmail: agency3OpsCredentials().email,
  /** Agency 3 (agency3Ops) levels use LVL1 — not "Level 1" / SA1. */
  levelName: 'LVL1',
  /** Level effective start — pick via calendar only (no manual fill). */
  levelEffectiveStartDate: '01/01/2015',
  mmpHeading: 'Marketing Match Program',
  mmpToggleLabel: /opt for marketing match program/i,
  maxContributionLabel: /maximum contribution:\s*\$2000\/per month/i,
  /**
   * File1: single NB — Commission $1800 + Bonus $200 = $2000 (MMP max).
   * premium 18000 → commission 10% = 1800.
   */
  file1: {
    premium: 18_000,
    grossCompensation: 1800,
    netCompensation: 1800,
    taxWithholding: 0,
  },
  /**
   * File2: enough commission lines at 10% of premium to exceed $2000 MMP cap,
   * plus one surplus row so ledger still shows commission after the cap.
   * 14 × 150 = 2100 (+ surplus 150) → contribution capped at 2000.
   */
  file2: {
    commissionRowCount: 14,
    surplusRowCount: 1,
    premium: 1500,
    grossCompensation: 150,
    netCompensation: 150,
    taxWithholding: 0,
  },
  reviewHeading: 'Review Statement File',
  warningTooltip: {
    newPolicy: 'New Policy',
  },
  uploadPoll: {
    maxAttempts: 30,
    intervalMs: 2_000,
  },
  reviewPoll: {
    maxAttempts: 20,
    intervalMs: 2_000,
  },
  expectedAfterExtract: {
    status: 'Waiting',
    stage: 'Review',
  },
  completedStage: 'Completed',
  columns: {
    customerUid: 'Customer UID',
    agentNpn: 'Selling agent NPN',
    agentFirstName: 'Selling agent first name',
    agentLastName: 'Selling agent last name',
    productName: 'Scale name/adjustment description',
    grossCompensation: 'Gross compensation',
    taxWithholding: 'Tax withholding',
    netCompensation: 'Net compensation',
    premium: 'Premium',
  },
  gridColumns: {
    status: 'Status',
    stage: 'Stage',
    fileName: 'File Name',
    fileId: 'File ID',
  },
  /** Actual product name in Products grid (not the scale name from Excel). */
  productGridName: 'Aetna-Test-Product',
  /**
   * Unique product code shown in the Products grid as "Code: <code>".
   * The grid also contains "Aetna-Test-Product II" (Code: AetnaTestProductIII),
   * which matches a name-only search — use the code to disambiguate.
   */
  productGridCode: 'AetnaTestProduct001',
} as const;

export function mmpTemplatePath(): string {
  return path.join(MMP.templateDir, MMP.templateFileName);
}
