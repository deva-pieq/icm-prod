function parseDebugStepsFlag(): boolean {
  const raw = process.env.DEBUG_STEPS?.trim().toLowerCase();
  return raw === 'true' || raw === '1' || raw === 'yes';
}

export function isDebugStepsEnabled(): boolean {
  return parseDebugStepsFlag();
}

function formatDebugValue(value: unknown): string {
  if (value instanceof RegExp) return value.toString();
  return String(value);
}

export function debugLogFileIdCaptured(fileId: string, source?: string): void {
  if (!isDebugStepsEnabled() || !fileId.trim()) return;
  const tag = source ? `[capture:${source}]` : '[capture]';
  console.log(`[debug_steps] ${tag} fileId=${fileId}`);
}

export function debugLogFileIdClick(fileId: string): void {
  if (!isDebugStepsEnabled() || !fileId.trim()) return;
  console.log(`[debug_steps] [click] fileId=${fileId}`);
}

export function debugLogAssertion(
  label: string,
  actual: unknown,
  expected: unknown,
  passed: boolean,
): void {
  if (!isDebugStepsEnabled()) return;
  console.log(
    `[debug_steps] [assert] ${label} | actual=${formatDebugValue(actual)} | expected=${formatDebugValue(expected)} | status=${passed ? 'pass' : 'fail'}`,
  );
}
