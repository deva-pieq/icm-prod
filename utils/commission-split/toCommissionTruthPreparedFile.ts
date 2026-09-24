import type { PreparedStatementFile } from '../excelStatementPrep';
import { getCommissionTruthPreparedFile } from './commissionTruthContext';

export function toCommissionTruthPreparedFile(): PreparedStatementFile {
  const prepared = getCommissionTruthPreparedFile();
  return {
    absolutePath: prepared.absolutePath,
    fileName: prepared.fileName,
    carrierName: prepared.carrierName,
  };
}
