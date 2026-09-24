let _currentPeriod: string | null = null;

export function setFixtureTimePeriod(period: string): void {
  _currentPeriod = period;
}

export function getFixtureTimePeriod(): string {
  return _currentPeriod ?? 'This Week';
}

export function clearAgentDashboardFixtureContext(): void {
  _currentPeriod = null;
}
