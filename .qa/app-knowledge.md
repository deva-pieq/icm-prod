<!-- GENERATED FILE — do not edit by hand.
     Source: .qa/knowledge/*.json
     Regenerate: node ~/.config/opencode/qa-kit/scripts/generate-docs.mjs
     Edit the JSON instead; any change here is lost on the next run. -->

# App Knowledge

> ICM (pieq.ai) — Playwright BDD (Cucumber) TypeScript

## Commands

| Purpose | Command |
| --- | --- |
| test | yarn test |
| test_p0 | yarn test -g @sanity |


## Environments

| Name | Base URL | Auth required |
| --- | --- | --- |
| local | https://icm.pieq.ai/ | yes |
| prod | https://icm.pieq.ai/ | no |


## Credentials (names only — no values are ever stored)

| Variable | Source |
| --- | --- |
| email_var | E2E_EMAIL_OWNER |
| password_var | E2E_PASSWORD |


## Modules

_none recorded_


## State management

_not recorded_

## Existing test surface

_none recorded_


## Weak spots

_none recorded_


## UI map

### Routes

| Route | Purpose | Auth |
| --- | --- | --- |
| /dashboard/agency-owner | Agency owner dashboard | yes |
| /user-management | System users/roles | yes |
| /carriers | Carrier master | yes |
| /agents | Agent master | yes |
| /product | Product master | yes |
| /policy | Policy master | yes |
| /commissions | Commission structure/rules | yes |
| /advance/overview | Advance overview | yes |
| /advance/advance-setup | Advance setup | yes |
| /commission-processing/upload-statement | Statement upload | yes |
| /commission-processing/statement-history | Statement history (canonical) | yes |
| /commission-processing/statements/history | Statement history (legacy) | yes |
| /commission-processing/needs-attention | Exceptions queue | yes |
| /payment-processing/payable-line-items | Payables / Pending Payments | yes |
| /payment-processing/pending-authorization | Payment batch list | yes |
| /payment-processing/disbursement-history | Disbursement history | yes |
| /payment-processing/miscellaneous-charges | Miscellaneous charges | yes |
| /commission-statement-processing/transfer-sheet | Transfer sheet | yes |
| /commission-statement-processing/commission-templates | Commission templates | yes |
| /commission-statement-processing/prompts-library | AI prompts library | yes |
| /agency-configuration | Agency settings (ACH) | yes |
| /agency-configuration/data-import | Data import | yes |


### Selectors

| Element | Selector | Quality | Stable |
| --- | --- | --- | --- |
| Sidebar nav root | nav[aria-label="Sidebar navigation"] | role | yes |
| Sidebar item | [data-testid="sidebar-nav-item-*"] | testid | yes |
| Profile menu button | [data-testid="profile-dropdown-button"] | testid | yes |
| Logout | [data-testid="profile-dropdown-logout"] | testid | yes |
| Grid search input (Payables) | getByPlaceholder('Search Statements...') | placeholder | yes |
| Grid record count | [data-testid="data-grid-record-count-footer"] | testid | yes |
| Select-all (Payables) | [data-testid="header-select-all-checkbox"] input[type=checkbox] | testid | yes |
| Row checkbox | #checkbox-row-checkbox-<uuid> | id-with-uuid | **no** |
| Create Payment (Payment Ready) | [data-testid="create-payment-button"] | testid | yes |
| Login email | getByRole('textbox', { name: /email/i }) | role | yes |
| Login continue | getByRole('button', { name: /continue/i }) | role | yes |
| Login password | input[type=password] | css | yes |
| Login submit | getByRole('button', { name: /sign in\|log in/i }) | role | yes |
| Advance Setup heading (loaded) | getByRole('heading', { name: 'Advance Setup' }) [level 4] | role | yes |
| Error fallback heading | getByRole('heading', { name: 'Failed to load module' }) | role | yes |
| Error fallback retry | getByRole('button', { name: 'Reload Page' }) | role | yes |
| Statement History heading (canonical) | getByRole('heading', { name: 'Commission Statement History' }) | role | yes |
| 404 heading | getByRole('heading', { name: 'Page Not Found' }) | role | yes |
| Advance Setup grid | [data-testid="advance-setup-datagrid"] | testid | yes |
| Advance Setup page root | [data-testid="advance-setup-page"] | testid | yes |


### State transitions

| From | Action | To |
| --- | --- | --- |
| unauthenticated / | goto | Keycloak SSO login |
| SSO login | email+continue+password+signin | /dashboard/agency-owner |
| advance/advance-setup | first direct load | Failed to load module + 2 console errors |
| advance/advance-setup | reload | page loads (metrics + grid) |
| commission-processing/statements/history | direct load | blank main |
| payables search | type 430042979 | Showing 2 of 1377 total records |
| payables selection | select row | create-payment-button appears (disabled in sample) |
| advance/advance-setup | cold page.goto (hard load) | Failed to load module + RemoteRouteErrorBoundary React #185 (repro x2) |
| advance/advance-setup (error fallback) | click "Reload Page" (soft re-mount) | page loads: heading Advance Setup + grid 50 rows (repro x2) |
| commission-processing/statements/history | direct load (current tab AND fresh tab, 6-8s wait) | blank main (HTML len 26, no 404, no redirect, 0 console errors) |
| any unknown path | direct load | Page Not Found 404 page (control) |


## Confirmed facts (2)

| ID | Claim | Evidence | By |
| --- | --- | --- | --- |
| ADHOC-CFG-001 | The root .env BASE_URL targets preprod while the agency-owner credentials are PROD; because loadProjectEnv does not override an already-set env var, the adhoc prod sweep must be run with BASE_URL pinned to https://icm.pieq.ai/ (otherwise login hangs at LoginPage.waitForAppHost). | .qa/runs/adhoc-prod-20261014-160630/report.md | grimmjow |
| ADHOC-UI-001 | As agency owner on PROD, dashboard, statement history, payables, advance overview, commissions, agency configuration, products and agents all render; 9/9 read-only sweep scenarios pass in ~55s with no mutations. | features/adhoc/adhoc-icm-prod-sweep.feature<br>.qa/runs/adhoc-prod-20261014-160630/report.md | grimmjow |


## Hypotheses — NOT verified (0)

_none recorded_


## Refuted — investigated, not real (0)

_none recorded_


## Constraints

- use Playwright MCP for live discovery (not cli)
- use only credential names, never values


## Not yet covered

- Chargeback recovery flow (requires chargeback file upload)
- Statement/advance upload processing (destructive)
- Payment creation / approval / disbursement execution (destructive)
- Agent ledger / book of business / agent-insights
- Ops manager and agent dashboards

