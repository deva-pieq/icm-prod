/**
 * Calendar month difference between Issue Date and Paid to Date (Paid − Issue).
 * Accepts MM/DD/YYYY or ISO-like strings.
 */
export function calendarMonthsBetween(issueDate: string, paidToDate: string): number {
  const issue = parseUsOrIsoDate(issueDate);
  const paid = parseUsOrIsoDate(paidToDate);
  if (!issue || !paid) {
    throw new Error(`Cannot parse dates issue="${issueDate}" paidTo="${paidToDate}"`);
  }
  return (paid.getUTCFullYear() - issue.getUTCFullYear()) * 12 + (paid.getUTCMonth() - issue.getUTCMonth());
}

/** Month Diff < 13 → M1-12; Month Diff ≥ 13 → M13-No Limit */
export function resolveCommissionPeriodTab(monthDiff: number): 'M1-12' | 'M13-No Limit' {
  return monthDiff < 13 ? 'M1-12' : 'M13-No Limit';
}

function parseUsOrIsoDate(value: string): Date | null {
  const trimmed = value.trim();
  const us = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (us) {
    return new Date(
      Date.UTC(
        Number.parseInt(us[3], 10),
        Number.parseInt(us[1], 10) - 1,
        Number.parseInt(us[2], 10),
      ),
    );
  }
  const iso = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    return new Date(
      Date.UTC(
        Number.parseInt(iso[1], 10),
        Number.parseInt(iso[2], 10) - 1,
        Number.parseInt(iso[3], 10),
      ),
    );
  }
  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed)) return null;
  const d = new Date(parsed);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

export function parseMoney(value: string): number {
  const cleaned = value.replace(/[$,\s]/g, '').trim();
  if (!cleaned || cleaned === '-' || cleaned.toLowerCase() === 'n/a') return 0;
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export function parsePercent(value: string): number {
  const cleaned = value.replace(/%/g, '').replace(/,/g, '').trim();
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}
