import type { CarrierFormData } from '../../test-data/carriers/carriers';

let lastSaved: CarrierFormData | null = null;
let lastEditedName: string | null = null;

export function setLastSavedCarrier(data: CarrierFormData): void {
  lastSaved = data;
}

export function getLastSavedCarrier(): CarrierFormData {
  if (!lastSaved) {
    throw new Error('No carrier saved in this scenario yet');
  }
  return lastSaved;
}

export function hasLastSavedCarrier(): boolean {
  return lastSaved !== null;
}

export function setLastEditedCarrierName(name: string): void {
  lastEditedName = name;
}

export function getLastEditedCarrierName(): string {
  if (!lastEditedName) {
    throw new Error('No carrier name edited in this scenario yet');
  }
  return lastEditedName;
}

export function clearCarrierContext(): void {
  lastSaved = null;
  lastEditedName = null;
}
