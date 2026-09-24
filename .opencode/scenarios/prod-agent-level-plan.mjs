/**
 * Configure one agent: add level if missing, enable carrier-advance toggle.
 * Usage via Playwright MCP browser_run_code_unsafe — paste helpers as needed.
 * Kept here for resume / debugging.
 */
export const PROD_AGENT_LEVEL_PLAN = [
  { npn: '90065', level: 'LVL1', date: '01/01/2015', note: 'MMP' },
  { npn: '120876543', level: 'LVL1', date: '01/01/2021', note: 'transfer' },
  { npn: '0987654321', level: 'LVL1', date: '01/01/2021', note: 'DevaTest upload' },
  { npn: '600001', level: 'LVL1', date: '01/01/2021', note: 'payment ACH' },
  { npn: '600002', level: 'LVL2', date: '01/01/2021', note: 'payment CHK' },
  { npn: '600003', level: 'LVL3', date: '01/01/2021', note: 'chargeback' },
  { npn: '600011', level: null, date: null, note: 'AgentX existing LVL5 — advance only' },
];
