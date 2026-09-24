/**
 * Module-lifecycle context for the Processing Cut Off regression module.
 *
 * Holds the Processing Cut Off Day value captured BEFORE the module makes its
 * first change, so `AfterAll` can restore it and other modules keep their
 * expected weekly cycle.
 *
 * Deliberately NOT cleared in a `Before` hook: the captured value must survive
 * every scenario within the module run (each Scenario Outline example would
 * otherwise re-capture the previous example's value instead of the true
 * pre-module baseline). Cleared only after the restore attempt in
 * `steps/processing-cut-off/common.steps.ts` AfterAll.
 */

let priorCutOffDay: string | null = null;

/** Stores the pre-module cut-off day; keeps the FIRST captured value. */
export function setPriorCutOffDay(day: string): void {
  if (priorCutOffDay === null && day.trim()) {
    priorCutOffDay = day.trim();
  }
}

export function getPriorCutOffDay(): string {
  if (priorCutOffDay === null) {
    throw new Error('Prior Processing Cut Off Day was never captured');
  }
  return priorCutOffDay;
}

export function tryGetPriorCutOffDay(): string | null {
  return priorCutOffDay;
}

export function clearPriorCutOffDay(): void {
  priorCutOffDay = null;
}
