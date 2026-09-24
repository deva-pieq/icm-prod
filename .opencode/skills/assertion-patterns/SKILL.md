---
name: assertion-patterns
description: Three recurring assertion patterns — known-bug handling, before/after capture, and sidebar/modal heading validation.
---

# Assertion Patterns (ICM)

## 1. Known Bug Handling — assert the spec, not the bug

When the app has a functional bug (spec says X, app does Y), assert the expected (spec) behavior.

```gherkin
  @bug
  Scenario: AGD-YL-051 — Year limits for Custom Date Range
    Then the agency dashboard minimum selectable year should be 1990
    # Known issue: the app currently allows selecting years below 1990
    And the agency dashboard maximum selectable year should be 2100
```

### Rules
1. **Tag `@bug`** — visible in reports, team can filter known-failing tests.
2. **Add `# Known issue` comment** describing the actual vs expected behavior.
3. **Assert the spec's expected value**, not the buggy value.
4. **Do not skip the assertion** — the failure IS the signal.
5. **Distinguish functional bugs from test issues**:
   - Functional bug → `@bug`, assert expected value
   - Test issue → fix the test, not the app

## 2. Before/After Capture Pattern — verify filter changed the data

Capture a value before an action, then assert it changed in the expected direction.

```gherkin
    And I capture the Gross commission initial value
    When I deselect a specific LOB
    Then all dashboard widgets refresh dynamically based on the selected LOBs
    And I validate current Gross commission is lessthan or equals to capture initial one
```

### Implementation

**Capture:**
```typescript
Then('I capture the {word} initial value', async ({ pageObject }) => {
  const value = await pageObject.getSomeMetricNumericValue();
  expect(value).toBeGreaterThan(0);
  setCapturedMetric(value);  // stored in utils/<module>/<module>Context.ts
});
```

**Validate:**
```typescript
Then('I validate current {word} is lessthan or equals to capture initial one', async ({ pageObject }) => {
  const initial = getCapturedMetric();
  const current = await pageObject.getSomeMetricNumericValue();
  expect(current).toBeLessThanOrEqual(initial);
});
```

### Context object
```typescript
let _captured: number | null = null;
export function setCapturedMetric(value: number) { _captured = value; }
export function getCapturedMetric(): number {
  if (_captured === null) throw new Error('Not captured yet');
  return _captured;
}
export function clearModuleContext() { _captured = null; }
```

### Rules
1. Store captured values in `utils/<module>/<module>Context.ts` — never globals.
2. Call `clearModuleContext()` in `Before` hook to reset between scenarios.
3. Validate captured value is reasonable (`> 0`) before storing.
4. Use `toBeLessThanOrEqual` / `toBeGreaterThanOrEqual` for monotonic comparisons.
5. Name capture/validate steps with the metric name for readability.

### Variation reference

| Assertion | Use case |
|---|---|
| `current <= initial` | Filter reduces scope |
| `current === 0` | All items filtered out |
| `current > 0` | Data still exists after filter |
| `current !== previous` | Value changed (direction unknown) |
| `stable for N seconds` | Value should NOT change |

## 3. Sidebar/Modal Heading Validation — verify opened panel matches clicked element

```gherkin
  When I click the first row in the Top Performers list
  Then the details panel heading matches the clicked performer name
  When I close the sidebar modal on agency dashboard
```

### Page object
```typescript
async clickRowAndCaptureHeading(rowIndex: number): Promise<string> {
  const heading = await this.loc.performerName(rowIndex).innerText();
  await this.loc.performerRow(rowIndex).click();
  await waitForAppSettled(this.page);
  await this.loc.detailsPanel().waitFor({ state: 'visible' });
  return heading;
}

async expectDetailsPanelHeadingMatches(expected: string) {
  const panelHeading = await this.loc.detailsPanelHeading().innerText();
  expect(panelHeading.trim().toLowerCase()).toBe(expected.trim().toLowerCase());
}
```

### Rules
1. Capture clicked element's text **before** the click — panel might obscure it.
2. Store captured text in context object.
3. Assert panel heading after panel is fully visible (wait for locator).
4. Use case-insensitive comparison.
5. Every open step must have a corresponding close step (last step in scenario).

## Checklist

- [ ] Known bugs: tagged `@bug`, asserts **expected** value, `# Known issue` comment added
- [ ] Before/after capture: value in context object, cleared in `Before` hook, correct comparison
- [ ] Sidebar/modal: heading validated against clicked element text, close step present
