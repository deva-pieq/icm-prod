export const GRID_COLUMNS = [
  'Txn Date',
  'Txn ID',
  'Agent',
  'Amount',
  'Payment Batch',
  'Payment Date',
  'Status',
] as const;

export const NO_RECORDS_TEXT = 'No Records Found';
export const SEARCH_PLACEHOLDER = 'Search by agent, amount, date, txn id, status...';
export const SEARCH_HELPER = 'Use this search box to filter the data grid. Results will update as you type.';

export const TXN_ID_REGEX = /^TX-[A-Z0-9]{6}$/;
export const CURRENCY_REGEX = /^\$[\d,]+\.\d{2}$/;

export const TEST_AGENT_CODE = '90058';
export const TEST_AGENT_NAME = 'TestAgent0058';
