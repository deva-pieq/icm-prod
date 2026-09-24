import path from 'node:path';

const projectRoot = path.resolve(__dirname, '..', '..');

export const SALES_LEADER_DASHBOARD = {
  agentId: '600004',
  /**
   * Sales leader's own NPN — the app resolves THIS selling NPN to the Sales Leader's
   * own Agent role (Jason Hoffmann, ledger/agent id '15278437'). Direct-selling
   * statements with this NPN create the "Agent" role.
   *
   * VERIFIED HARMFUL:
   *   - '600001' → downline L1 (sales-leader subaddress) → another "Sales Leader" override.
   *   - '600004' → downline "Agent Level IV" → "Sales Leader" override.
   *   - '15278437' → not recognized for Aetna ACA → "Needs Attention".
   *
   * VERIFIED BUT NO BOOKING ON JH:
   *   - '0987654321' → "DevaTest Agent" (template default) → Completed but commission
   *     routes to DevaTest Agent's hierarchy, not JH. Use for T001 SL override only.
   */
  salesLeaderAgentId: '0987654321',
  statementType: 'Aetna ACA',
  carrierName: 'Aetna',
  // No TestFiles-prod-sanity/StatementProcessing variant — keeps pre-prod template.
  /** Reuse statement-processing template + generated dir. */
  templateDir: path.join(projectRoot, 'TestFiles', 'StatementProcessing'),
  generatedDir: path.join(projectRoot, 'TestFiles', 'StatementProcessing', '.generated'),
  uploadPoll: {
    maxAttempts: 30,
    intervalMs: 2_000,
  },
  expectedAfterExtract: {
    status: 'Waiting',
    stage: 'Review',
  },
  completedStage: 'Completed',
} as const;
