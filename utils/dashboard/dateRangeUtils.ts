export interface DateRange {
  start: Date;
  end: Date;
}

export function computeExpectedDateRange(option: string, today = new Date()): DateRange {
  today = new Date(today);
  today.setHours(0, 0, 0, 0);

  const addDays = (date: Date, days: number): Date => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  };

  const startOfMonth = (date: Date): Date =>
    new Date(date.getFullYear(), date.getMonth(), 1);

  const endOfMonth = (date: Date): Date =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0);

  const startOfQuarter = (date: Date): Date => {
    const quarter = Math.floor(date.getMonth() / 3);
    return new Date(date.getFullYear(), quarter * 3, 1);
  };

  const endOfQuarter = (date: Date): Date => {
    const quarter = Math.floor(date.getMonth() / 3);
    return new Date(date.getFullYear(), quarter * 3 + 3, 0);
  };

  const startOfWeek = addDays(today, -today.getDay());
  const endOfWeek = addDays(startOfWeek, 6);

  const lastWeekStart = addDays(startOfWeek, -7);
  const lastWeekEnd = addDays(startOfWeek, -1);

  const last4WeeksStart = addDays(lastWeekStart, -21);
  const last4WeeksEnd = lastWeekEnd;

  const last12WeeksStart = addDays(lastWeekStart, -77);
  const last12WeeksEnd = lastWeekEnd;

  const thisMonthStart = startOfMonth(today);
  const thisMonthEnd = endOfMonth(today);

  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthStart = startOfMonth(lastMonth);
  const lastMonthEnd = endOfMonth(lastMonth);

  const thisQuarterStart = startOfQuarter(today);
  const lastQuarterDate = new Date(
    thisQuarterStart.getFullYear(),
    thisQuarterStart.getMonth() - 3,
    1,
  );
  const lastQuarterStart = startOfQuarter(lastQuarterDate);
  const lastQuarterEnd = endOfQuarter(lastQuarterDate);

  const last6MonthsStart = new Date(today.getFullYear(), today.getMonth() - 6, 1);
  const last6MonthsEnd = new Date(today.getFullYear(), today.getMonth(), 0);

  const yearStart = new Date(today.getFullYear(), 0, 1);

  const lastYearStart = new Date(today.getFullYear() - 1, 0, 1);
  const lastYearEnd = new Date(today.getFullYear() - 1, 11, 31);

  const ranges: Record<string, DateRange> = {
    'This Week': { start: startOfWeek, end: endOfWeek },
    'Last Week': { start: lastWeekStart, end: lastWeekEnd },
    'Last 4 Weeks': { start: last4WeeksStart, end: last4WeeksEnd },
    'Last 12 Weeks': { start: last12WeeksStart, end: last12WeeksEnd },
    'This Month': { start: thisMonthStart, end: thisMonthEnd },
    'Last Month': { start: lastMonthStart, end: lastMonthEnd },
    'Last Quarter': { start: lastQuarterStart, end: lastQuarterEnd },
    'Last 6 Months': { start: last6MonthsStart, end: last6MonthsEnd },
    'Year to Date': { start: yearStart, end: today },
    'Last Year': { start: lastYearStart, end: lastYearEnd },
    'Custom Date Range': { start: thisMonthStart, end: thisMonthEnd },
  };

  const range = ranges[option];
  if (!range) {
    throw new Error(`Unknown time period option: "${option}"`);
  }
  return range;
}

export function formatDateRange(range: DateRange): string {
  const opts: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  };
  const startStr = range.start.toLocaleDateString('en-US', opts);
  const endStr = range.end.toLocaleDateString('en-US', opts);
  return `${startStr} – ${endStr}`;
}
