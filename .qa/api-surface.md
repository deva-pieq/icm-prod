<!-- GENERATED FILE — do not edit by hand.
     Source: .qa/knowledge/*.json
     Regenerate: node ~/.config/opencode/qa-kit/scripts/generate-docs.mjs
     Edit the JSON instead; any change here is lost on the next run. -->

# API Surface

> ICM (pieq.ai)

## Transports

- **REST over HTTPS (JSON)** — Primary transport. Base path /api/v1/. Cited: MmpFlowPage.ts:485, StatementUploadPage.ts:281, PolicyMasterPage.ts:1022.
- **Keycloak OIDC (browser redirect)** — Login via /auth/realms/<realm>; issues Bearer JWT used for /api/v1/*. Detection at appPaths.ts:23-25,38.
- **Runtime app-config object** — SPA reads apiBaseUrl + oidc from a runtime config object (keys: apiBaseUrl, oidc, analytics, umami, maintenance, enabled/message/title). graphify-out/GRAPH_REPORT.md:5493. Value not present in repo.

## Endpoints (27)

| Method | Path | Auth | Evidence |
| --- | --- | --- | --- |
| GET | /api/v1/policy | Bearer | .opencode/scenarios/policy-findings-scratchpad.md:49-52; .opencode/scenarios/commission-report-policy-seed-handoff.md:70 |
| GET | /api/v1/policy/{uuid} | Bearer | policy-findings-scratchpad.md:157; commission-report-policy-seed-handoff.md:73 |
| POST | /api/v1/policy | Bearer | policy-findings-scratchpad.md:121 |
| PUT | /api/v1/policy/{uuid} | Bearer | policy-findings-scratchpad.md:121 |
| DELETE | /api/v1/policy/{uuid} | Bearer | policy-findings-scratchpad.md:144 |
| GET | /api/v1/policy/type | Bearer | policy-findings-scratchpad.md:67 |
| GET | /api/v1/policy/subtype | Bearer | policy-findings-scratchpad.md:73 |
| GET | /api/v1/policy/exists/{policyNumber} | Bearer | policy-findings-scratchpad.md:149 |
| GET | /api/v1/policy/payto | Bearer | policy-findings-scratchpad.md:150 |
| GET | /api/v1/policy/team | Bearer | policy-findings-scratchpad.md:150 |
| POST | /api/v1/policy/data-import | Bearer | policy-findings-scratchpad.md:151 |
| POST | /api/v1/policy/data-import/validate | Bearer | policy-findings-scratchpad.md:151 |
| GET | /api/v1/policy/{uuid}/commissions | Bearer | commission-report-policy-seed-handoff.md:76-78; .opencode/skills/hail-intelligence/SKILL.md:122 |
| POST | /api/v1/policy/commission | Bearer | commission-report-policy-seed-handoff.md:115; scripts/test_runner/app_behavior.json:148 |
| PUT | /api/v1/policy/commission/{uuid} | Bearer | commission-report-policy-seed-handoff.md:94-117; scripts/test_runner/app_behavior.json:148 |
| GET | /api/v1/products | Bearer | policy-findings-scratchpad.md:81 |
| GET | /api/v1/products/by-carrier-type/{carrierId}/{typeId} | Bearer | policy-findings-scratchpad.md:81 |
| GET | /api/v1/users/agents | Bearer | policy-findings-scratchpad.md:88; features/miscellaneous-charges/module.md:180 |
| GET | /api/v1/carrierfiles/ | Bearer | pages/statement-processing/StatementUploadPage.ts:281-295; pages/statement-processing/TransferStatementPage.ts:109-123; scripts/_tmp-live-probe.cjs:42 |
| GET | /api/v1/ledger | Bearer | pages/mmp/MmpFlowPage.ts:483-500 |
| GET | /api/v1/payments/miscellaneous-charges | Bearer | features/miscellaneous-charges/module.md:124,134 |
| GET | /api/v1/payments/miscellaneous-charges/{uuid} | Bearer | features/miscellaneous-charges/module.md:125 |
| POST | /api/v1/payments/miscellaneous-charges | Bearer | features/miscellaneous-charges/module.md:126,132 |
| PUT | /api/v1/payments/miscellaneous-charges/{uuid} | Bearer | features/miscellaneous-charges/module.md:127 |
| POST | /api/v1/payments/miscellaneous-charges/process | Bearer | features/miscellaneous-charges/module.md:128,133,136-139 |
| DELETE | /api/v1/payments/miscellaneous-charges/{uuid} | Bearer | features/miscellaneous-charges/module.md:129 |
| GET | /payments/payout-file | Bearer | pages/payment-processing/DisbursementPage.ts:205-212 |


## Auth model

Keycloak OIDC (authorization-code, browser redirect) -> Bearer JWT on /api/v1/* — Every app route requires an authenticated session (unauthenticated -> Keycloak redirect). API requests carry: authorization: Bearer <token>, accept: application/json, content-type: application/json, x-service-name (pieq-react-app | pieq-insurance-app), x-client-id: pieq-app-dev. Unauthenticated API fetch -> 401 (captured). Per-route RBAC not observable from this black-box repo. Roles are env-keyed: E2E_EMAIL (ops manager), E2E_EMAIL_AGENT (agent), E2E_EMAIL_OWNER (agency owner), E2E_EMAIL_SALES_LEADER (sales leader), password E2E_PASSWORD.

## Error model

Shape: JSON envelope {message: string} for Policy/Payments errors; at least one file endpoint (payout-file) returns plain text · codes: VALIDATION_ERROR, POLICY_NUMBER_EXISTS, MISSING_REQUIRED_FIELD

## Seams

| Seam | Flow | Notes |
| --- | --- | --- |
| Grid hydration | REST list -> AG Grid rows | All list views; server params sent only when filter != 'all' (policy-findings-scratchpad.md:47) |
| Payload-only columns | API field exists but is not in the DOM | carrierfiles.status (StatementUploadPage.ts:268-295); MMP ledger amounts (MmpFlowPage.ts:481-505) |
| React-fiber introspection | Test reads MUI DataGrid rows from React internals | Ops Manager dashboard sums via apiRef.getRowModels()/memoizedState walk (OpsManagerDashboardPage.ts:1093-1198) |
| Route interception (fault injection) | Test stubs /api/v1/policy* to 500 to assert error UI | PolicyMasterPage.ts:1018-1055 |
| Request/response waits | Test blocks on a specific API frame before asserting | /api/v1/ledger (MmpFlowPage.ts:483); /api/v1/carrierfiles/ (StatementUploadPage.ts:282); /payments/payout-file (DisbursementPage.ts:205) |
| Statement upload -> payables | carrierfile upload -> extract -> review -> Completed -> Pending Payments row | UI-only chain; no direct API call in repo (skills statement-processing, payables-search-select) |
| Runtime config | SPA reads apiBaseUrl + oidc from runtime config object | graphify-out/GRAPH_REPORT.md:5493 |
| Polling / status | Client polls carrierfiles list for Stage/Status transitions | StatementUploadAssertions.pollUntilUploadReviewReady / pollPastExtractProcessing |


## Gaps

| Mismatch | Endpoints | Impact |
| --- | --- | --- |
| Two different x-service-name values for the same POST /api/v1/policy | POST /api/v1/policy | pieq-insurance-app vs pieq-react-app - gateway may key on it; wrong value can 403 |
| payout-file path has no observed /api/v1 prefix | GET /payments/payout-file | test matcher could drift if the API is versioned under /api/v1/ |
| Statement status not in DOM | GET /api/v1/carrierfiles/ | assertions depend on transient payload; DOM-only checks false-fail |
| Dashboard / advance / chargeback-ARF APIs unknown |  | cannot test those layers at API level; UI-only, brittle |
| Policy-list commission[] always empty | GET /api/v1/policy | must use detail endpoint; clients reading list commission get nothing |
| No per-route RBAC evidence | /api/v1/* | cannot confirm role filtering at the API tier |
| No ICM API client in repo |  | no request/response schema validation or contract tests; only Slack fetch() exists |
| Prod API origin unrecorded |  | base for prod API unknown |

