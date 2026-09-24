let capturedGrossCommission: number | null = null;

export function setCapturedGrossCommission(value: number): void {
  capturedGrossCommission = value;
}

export function getCapturedGrossCommission(): number {
  if (capturedGrossCommission === null) {
    throw new Error('Gross commission not captured yet — capture it first');
  }
  return capturedGrossCommission;
}

export function clearDashboardContext(): void {
  capturedGrossCommission = null;
}
