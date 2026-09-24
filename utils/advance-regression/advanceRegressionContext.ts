let _capturedProductName = '';
let _capturedArfId = '';
let _capturedAgentName = '';
let _capturedTabValue = '';

export function setCapturedProductName(value: string) {
  _capturedProductName = value;
}
export function getCapturedProductName(): string {
  return _capturedProductName;
}

export function setCapturedArfId(value: string) {
  _capturedArfId = value;
}
export function getCapturedArfId(): string {
  return _capturedArfId;
}

export function setCapturedAgentName(value: string) {
  _capturedAgentName = value;
}
export function getCapturedAgentName(): string {
  return _capturedAgentName;
}

export function setCapturedTabValue(value: string) {
  _capturedTabValue = value;
}
export function getCapturedTabValue(): string {
  return _capturedTabValue;
}

export function clearAdvanceRegressionContext(): void {
  _capturedProductName = '';
  _capturedArfId = '';
  _capturedAgentName = '';
  _capturedTabValue = '';
}
