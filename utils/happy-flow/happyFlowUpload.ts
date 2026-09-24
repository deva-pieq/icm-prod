import { HAPPY_FLOW_001 } from '../../test-data/happy-flow/happyFlow001';
import type { PreparedStatementFile } from '../excelStatementPrep';
import { getHappyFlowCsvData } from './happyFlowContext';

export function toHappyFlowPreparedFile(): PreparedStatementFile {
  const csv = getHappyFlowCsvData();
  return {
    absolutePath: csv.absolutePath,
    fileName: csv.fileName,
    carrierName: HAPPY_FLOW_001.carrierName,
  };
}
