export type StatementUploadContext = {
  fileId: string;
  fileName: string;
  carrierName: string;
  uploadedByTag: string;
  preparedFilePath: string;
};

let lastUpload: StatementUploadContext | null = null;

export function setLastStatementUpload(ctx: StatementUploadContext): void {
  lastUpload = ctx;
}

export function getLastStatementUpload(): StatementUploadContext {
  if (!lastUpload) {
    throw new Error('No statement upload context stored — run upload scenario first');
  }
  return lastUpload;
}

export function clearLastStatementUpload(): void {
  lastUpload = null;
}
