# Handoff — Statement Processing SP extract / seed (2026-10-01 update)

Resume here when continuing `@statement-processing` / SP-00{n} on **prod** (`https://icm.pieq.ai/`).

## Status (one line)

**ESCALATE — backend extract queue.** Excel seed + Active agent verified; uploads stay Stage=`Uploaded`, Status empty, **0 line items**. Not an Excel/agent seed bug.

## What we proved (2026-10-01 PM)

| Check | Result |
|---|---|
| Agent `0987654321` | LVL1, **Onboarding in Progress**; status dropdown **locked** (email activation) for Ops + Owner |
| Agent `600011` (`test-AgentX Test`, `deva.r+prod+agent@pieq.ai`) | **Active** LVL5 — confirmed in UI + used as SP seed |
| Template rebuild | Copied StatementUpload golden → SP template; plain Gross/Net 54.9/48.31; alias `test-2025-jan-1-aetna-test-001`; UID `IANG12370001IL200`+ |
| SP-001 after Active seed | Fail: `processing:(empty):Uploaded` (300s poll) |
| SP-001 after golden rebuild | Fail: same |
| Same-day history (upload grid) | ~13:29–13:34 Valid/Partial/States **did extract** (Completed / Needs Attention, line items >0). From ~13:40 **all Valid stuck Uploaded / 0 lines** |

**Verdict:** Extract worker / statement setup broke ~13:40. Agent Onboarding was a red herring for current failures — Active `600011` still stuck Uploaded.

## Human blocker (backend)

1. Prod statement extract queue / worker for agency uploading as Deva Prod Ops
2. Why files sit `Uploaded` with empty Status and 0 line items (never enter Extract)
3. Optional: email-activate `0987654321` so Payment ACH / smoke can keep using DevaTest — **not** required to unblock extract (600011 already Active)

Do **not** keep rewriting Excel agent/alias/Net for this symptom.

## Seed now in repo (until DevaTest activated)

```text
Agent:  first=test-AgentX  last=Test  NPN=600011  (Active)
Email:  deva.r+prod+agent@pieq.ai
Product alias: test-2025-jan-1-aetna-test-001
Product display: test-Aetna-Test-Product
Statement type: Aetna ACA
Template: TestFiles-prod-sanity/StatementProcessing/[MLB NEW]HappyFlowChangeCheckRunDate.xlsx
```

`test-data/statement-processing/validateStatementProcessing.ts` → `seed` uses 600011.
Feature tag fixed: `@validate-statement-processing` added so Before/BeforeAll hooks fire.

## Code fixes already in tree (keep)

1. Feature tag `@validate-statement-processing` (hooks were dead with only `@statement-processing`)
2. Address mutate append-only `[run:…]` (not mid-string splice)
3. Net = gross×0.88 (not premium×0.88)
4. PROD_SEED / applyProdAgentAndAlias on real-processing prep paths
5. Seed switched Onboarding DevaTest → Active 600011

## Commands after backend fix

```powershell
yarn test -g "@TEST-001-Statement-Processing-PROD" --retries=0 --reporter=line
yarn test -g "@statement-processing" --retries=0 --reporter=line
```

Expect Stage `Review` / Status `Waiting` (not stuck `Uploaded`).
