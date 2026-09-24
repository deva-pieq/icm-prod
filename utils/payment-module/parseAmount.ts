/**
 * Strip currency symbols / commas from UI amount text.
 * Example: "$1,234.56" → "1234.56"
 */
export function parseAmount(text: string): string {
  return text.replace(/\$/g, '').replace(/,/g, '').trim();
}

/** Numeric compare helper for settlement / disbursement amounts. */
export function parseAmountNumber(text: string): number {
  const cleaned = parseAmount(text);
  const n = Number.parseFloat(cleaned);
  if (Number.isNaN(n)) {
    throw new Error(`Unable to parse amount from "${text}"`);
  }
  return n;
}
