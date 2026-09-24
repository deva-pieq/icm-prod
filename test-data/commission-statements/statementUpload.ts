import path from 'node:path';

const projectRoot = path.resolve(__dirname, '..', '..');

export const STATEMENT_UPLOAD = {
  templateFileName: '[MLB NEW]HappyFlowChangeCheckRunDate.xlsx',
  templateDir: path.join(projectRoot, 'TestFiles-prod-sanity', 'StatementUpload'),
  generatedDir: path.join(projectRoot, 'TestFiles-prod-sanity', 'StatementUpload', '.generated'),
  statementType: 'Aetna ACA',
  reviewHeading: 'Review Statement File',
  gridColumns: {
    uploaded: 'Uploaded',
    status: 'Status',
    stage: 'Stage',
    fileName: 'File Name',
    fileId: 'File ID',
    sourceTrace: 'Source Trace',
  },
  sortableGridColumns: {
    fileId: 'File ID',
    fileName: 'File Name',
    statementType: 'Statement Type',
    carrier: 'Carrier',
    uploaded: 'Uploaded',
    updatedAt: 'Updated At',
    stage: 'Stage',
    status: 'Status',
  },
  /** Status soon after upload (pre-prod may skip straight to Waiting). */
  statusAfterUpload: /Extract|Processing|Waiting/i,
  stageAfterUpload: /Processing|Review/i,
  statusAfterRefresh: 'Waiting',
  stageAfterRefresh: 'Review',
  /**
   * Full lifecycle vocabulary of the Recently Uploaded grid. The Stage and
   * Status columns overlap in value space (smoke shows Status "Uploaded",
   * statuses also "Extract"/"Processing"; stages also "Processing"/"Duplicate").
   * Membership checks must accept the complete set the app actually uses.
   */
  lifecycleStages: [
    'Uploaded',
    'Extract',
    'Processing',
    'Review',
    'Reconcile',
    'Needs Attention',
    'Completed',
    'Duplicate',
  ],
  lifecycleStatuses: ['Uploaded', 'Extract', 'Processing', 'Waiting', 'Error'],
} as const;

export function statementUploadTemplatePath(): string {
  return path.join(STATEMENT_UPLOAD.templateDir, STATEMENT_UPLOAD.templateFileName);
}
