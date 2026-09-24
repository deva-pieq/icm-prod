import type { PreparedStatementFile } from '../excelStatementPrep';
import { getCommissionReportPreparedFile } from './commissionReportContext';

export function toCommissionReportPreparedFile(): PreparedStatementFile {
  const prepared = getCommissionReportPreparedFile();
  return {
    absolutePath: prepared.absolutePath,
    fileName: prepared.fileName,
    carrierName: prepared.carrierName,
  };
}
