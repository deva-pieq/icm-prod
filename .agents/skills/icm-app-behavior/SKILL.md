---
name: icm-app-behavior
description: >-
  Proven ICM live-app behavior facts from regression fix campaigns.
  Use when writing or fixing scenarios for agency/ops/agent dashboards,
  edit-transaction, payment-module, product-management — avoid re-asserting
  removed or known-broken product behaviors.
---

# ICM App Behavior Map

Updated: 2026-09-08 (version 1)

Facts are MCP/fix-history proven. Do not contradict high-confidence entries without new live proof.

## agency-dashboard

### `carrier-filter-cannot-deselect-all` (high)
- **Fact:** Unchecking all carriers restores default selection; does not zero gross commission
- **Implication:** Do not assert zero after deselect-all; scenario T056 removed
- **Source:** REGRESSION_FIX_PLAN Task 4

### `athena-carrier-unselect-cors` (high)
- **Fact:** Unselecting carrier on Athena console throws CORS
- **Implication:** app_bug escalate; do not weaken filter refresh assert
- **Source:** REGRESSION_FIX_PLAN Task 4 T022

## ops-manager-dashboard

### `side-panel-ag-grid-scroll` (high)
- **Fact:** Statement side panel is AG Grid; scroll .ag-body-vertical-scroll-viewport not MUI
- **Implication:** Pattern L — sum/count must scroll AG viewport
- **Source:** Task 5 T008/T003

### `exception-count-not-red` (high)
- **Fact:** Exception Tracking Count column is black; red only on Carrier Ageing 16-30d/30d+
- **Implication:** app_bug or product decision for T002-ET
- **Source:** Task 5

## agent-dashboard

### `kpi-volatile-use-ytd-dynamic` (high)
- **Fact:** KPI amounts volatile; Last Quarter may be empty; prefer YTD + toBeGreaterThan(0)
- **Implication:** Pattern N — no hardcoded fixtures
- **Source:** Task 6

## edit-transaction

### `save-dirty-tracks-set-not-count` (high)
- **Fact:** Save enabled tracks set of selected rows, not count
- **Implication:** Pattern T — add+remove distinct rows keeps Save enabled
- **Source:** Task 8 MCP

## payment-module

### `create-payment-min-threshold` (medium)
- **Fact:** Create Payment may stay disabled below amount threshold (~$25)
- **Implication:** data_env / product rule — do not force-enable
- **Source:** Task 10

## product-management

### `outline-needs-fresh-product` (high)
- **Fact:** Shared seed product across Outline examples pollutes drafts
- **Implication:** Pattern M — use @needs-fresh-product per example when empty state required
- **Source:** Task 3 T005

### `advance-setup-product-missing` (high)
- **Fact:** Product not found in Advance Setup usually means purged/missing product or missing commission+advance config — not a locator bug
- **Implication:** Hail Intelligence HI-P: create product matching Excel product name alias, add commission template, verify Advance Setup row; do not weaken assert
- **Source:** sanity 20260908T052755Z product-missing class

### `purged-product-team-data` (high)
- **Fact:** Some e2e-commission-statements fixtures depend on product-team data that gets purged
- **Implication:** Reseed with simple E2E product + template; validate upload→review→payables flow; escalate only unreseedable team fixtures
- **Source:** Hail Intelligence — operator guidance

## transfer-sheet

### `config-mirror-working-suite` (high)
- **Fact:** Transfer Sheet regression + smoke cover working config/setup paths
- **Implication:** Hail Intelligence HI-C: when config missing, mirror features/transfer-sheet and smoke settings flows to add config before chasing locators
- **Source:** Hail Intelligence — operator guidance

## UI patterns

- **readonly_date:** Never .fill(); use calendar popup helpers
- **sr_only_checkbox:** Click label; never input.uncheck({ force: true })
- **filter_apply:** After radio/checkbox change, click Apply if bar visible
- **ag_grid_scroll:** Use .ag-body-vertical-scroll-viewport / .ag-body-viewport, not .MuiDataGrid-virtualScroller

Playbook for HI-P / HI-C: skill `hail-intelligence`.
