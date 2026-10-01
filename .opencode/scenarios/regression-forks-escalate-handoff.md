# Escalate — remaining regression forks (2026-10-01)

## Fixed in this session (validated green)

| Module | Tags | Fix |
|---|---|---|
| Ops Dashboard | `@TEST-002-dashboard-viewing-period-PROD`, `@TEST-002-dashboard-stage-breakdown-PROD` | Week start = cut-off-driven (not hardcoded Tuesday); stage regex includes `Uploaded` |
| Agency Own Dashboard | `@TEST-057-…`, `@TEST-043-…` | Pie legend = subset of selected carriers; commission role click waits + name fallback |
| Policy Master | `@TEST-077-…`, `@TEST-063-…` | Negative premium: stay-on-create = reject; create retries once on server 500 |
| Agent Master edit | `@TEST-AGT-025-PROD` | Scan agent rows for non-empty phone (row 1 was empty) |

## Escalate — cannot fix with one more POM/Excel pass

### 1. Agent Master list columns — `@TEST-AGT-009-PROD` / `@TEST-AGT-010-PROD`

**Tried:**
1. label-click (not `force: true`) for sr-only checkboxes — checkbox unchecks; Apply still leaves column visible
2. Switched hide target Agent → Contact — **same failure** (column still visible after Apply)
3. T010: after unchecking all via label click, **no** checkbox remains checked+disabled — last-column lock absent in live UI

**Human check:**
1. Agents → Columns picker: does Apply actually hide any column on prod MLB?
2. Is column-visibility Apply broken / needing a different control?
3. Last-column lock removed from product? If yes → tag `@bug` or drop T010 assertion

**Do not:** more force/uncheck/locator variants — not a one-line POM fix.

### 2. Sales Leader KPI — `@TEST-001-Sales-Leader-Dashboard-KPI-PROD` (SLD-001)

**Signal:** `waiting:Error:Extract` (earlier report: Needs Attention). OpenCode reproduce confirmed Extract Error.

**Not a locator bug.** Same class as `.opencode/scenarios/statement-processing-sp-extract-handoff.md` — extract/seed/backend.

**Human check:**
1. Prod extract worker / Aetna ACA statement setup for Agency 3 path SLD uses
2. Excel seed NPN/alias vs Active agent (see excel-statement-extract-fix skill)
3. Do **not** keep rewriting POM for Completed wait

### 3. Transfer Sheet — `@TEST-TS-UC-003-PROD` (T003 RN)

**Signal (live grid 2026-10-01 ~20:20):** `TransferAgent-Renewal-*.xlsx` → Stage=`Extract`, Line Items=`0` (cannot open review). Same pattern as StatementProcessing-Valid rows in the same window.

**Excel fixes applied (skill checklist — keep):**
1. Rebuilt template from StatementUpload golden — **1 data row only**
2. New clean Customer UID (`TRAN001B######`) — removed stamp-append corruption `UID-1790…-1790…`
3. Fixed `utils/transfer-agent/excelTransferPrep.ts`: use `incrementCustomerUid(+1)` (no timestamp append); strip stamp suffixes; keep single row; NPN as string
4. Alias `test-2025-jan-1-aetna-test-001`, Net 48.31, agent NPN `120876543` / `test-Agent Test Transfer`

**Still fails after checklist → escalate (skill §5):**
- Not further Excel rewrites
- Same class as `.opencode/scenarios/statement-processing-sp-extract-handoff.md` — extract worker / statement setup
- Human: why new Aetna ACA uploads sit Extract/0 while older Completed rows from earlier today extracted fine

**Do not:** keep rewriting UID/agent for this symptom.

## Do not retry

Per `escalate-on-stuck.mdc`: one simple pass done; OpenCode extract forks stopped after ~13m with no green path.
