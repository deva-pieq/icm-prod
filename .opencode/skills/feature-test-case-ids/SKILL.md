---
name: feature-test-case-ids
description: Require unique test case ID tags on every Gherkin scenario.
---

# Feature Test Case IDs

Every `Scenario` and `Scenario Outline` in ICM `.feature` files must have a unique test case ID tag.

## Format

`@TEST-{NNN}-{Module}-{Area}` — three-digit zero-padded sequence, then module and area slug.

| Feature area | Example ID |
|---|---|
| Product create page | `@TEST-001-Product-Create-Page` |
| Product edit page | `@TEST-001-Product-Edit-Page` |
| Commission structure | `@TEST-001-Product-Commission-Structure` |
| Commission rule edit | `@TEST-001-Product-Commission-Rule` |
| Agency dashboard global filters | `@TEST-001-Agency-Dashboard-Global-Filters` |
| Ops manager dashboard viewing period | `@TEST-001-dashboard-viewing-period` |
| User management | `@TEST-001-User-Page` |
| Smoke | `@TEST-001-smoke` |

## Rules

1. **One ID per scenario** — assign to `Scenario` and `Scenario Outline` only, not `Examples` rows.
2. **Sequential numbering per Module-Area** — restart at `001` per suffix; never reuse or skip numbers.
3. **Tag placement** — append the ID on the tag line immediately above the scenario:
   ```gherkin
   @product-management @product-create-page @positive @TEST-001-Product-Create-Page
   Scenario: Save product with all valid mandatory fields
   ```
4. **New scenarios** — use the next available number for that Module-Area suffix.
5. **Do not rename existing IDs** — IDs are stable traceability links to manual test cases.

## Scenario cleanup

Every `.feature` scenario that opens a modal, popup, or side panel must close it before the scenario ends.

```gherkin
  Scenario: Gross Commission KPI card with breakdown popup
    When I click the Gross Commission card
    Then a "Total Revenue Breakdown" popup is displayed
    And the breakdown popup shows a Category summary table
    When I close the sidebar modal on agency dashboard
```

Guiding principles:
1. Close step is the **last step** in the scenario, after all validation.
2. Use generic close step for single close button matching `getByTestId(/modal-close/i)`.
3. Use named close methods when the scenario must close a specific modal by name.

## Checklist

- [ ] Every scenario has exactly one test case ID tag
- [ ] ID follows `@TEST-{NNN}-{Module}-{Area}` with zero-padded digits
- [ ] Numbers are sequential with no duplicates within each Module-Area suffix
- [ ] Scenario title stays descriptive; ID lives in tags, not duplicated in title
- [ ] Every modal/panel opened has a corresponding close step before scenario ends
