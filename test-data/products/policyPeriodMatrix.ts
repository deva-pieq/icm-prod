/** U65 ACA policy period defaults — MLB NEW FMO, single product type. */
export const U65_ACA_PERIOD_MATRIX = {
  regular: { toMonths: '12', value: '10.00' },
  renewal: { value: '5.00' },
  ipvSlabs: [
    { regularValue: '10.00', renewalValue: '5.00', agencySplit: '40' },
    { regularValue: '20.00', renewalValue: '8.00', agencySplit: '50' },
  ],
} as const;

export const ALTERNATE_COMMISSION_TEMPLATE_FOR_PERIOD = 'ACA - Carrier - Regular';

export const IPV_SLAB_SPLIT_MATRIX = {
  slab1: { from: '1', to: '100' },
  slab2: { from: '101' },
  regular: { toMonths: '12', value: '10.00' },
  renewal: { value: '7.00' },
  templateKeywords: { aetna: 'Aetna', aca: 'ACA' },
  /** Prefer distinct templates so IPV/period isolation asserts see different LVL1 splits. */
  templateFallbacks: {
    Aetna: 'Aetna',
    ACA: 'ACA - New Test 001 - Regular',
  },
} as const;
