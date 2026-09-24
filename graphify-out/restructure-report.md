# Restructure & Import Fix Report

## Files Moved

| From | To | Note |
|---|---|---|
| `pages/user-management/UserManagementPage.ts` | `pages/A001_core_pages/m001_user-management/UserManagementPage.ts` | user-management: landing, add, edit, grid |
| `pages/happy-flow/ProductPage.ts` | `pages/A001_core_pages/m004_Products/ProductPage.ts` | products: CRUD + grid |
| `pages/happy-flow/CommissionRulePage.ts` | `pages/A002_ops_pages/m002_commissions/CommissionRulePage.ts` | commissions: rule creation, templates, publish |
| `pages/commission-statements/StatementUploadPage.ts` | `pages/A002_ops_pages/m003_statements/sp001_upload/StatementUploadPage.ts` | statements/upload: base class |
| `pages/transfer-agent/TransferStatementPage.ts` | `pages/A002_ops_pages/m003_statements/sp001_upload/TransferStatementPage.ts` | statements/upload: extends StatementUploadPage |
| `pages/happy-flow/HappyFlowStatementPage.ts` | `pages/A002_ops_pages/m003_statements/sp001_upload/HappyFlowStatementPage.ts` | statements/upload: extends StatementUploadPage |
| `pages/operations/payment-processing/PaymentProcessingPage.ts` | `pages/A002_ops_pages/m004_payment_processing/PaymentProcessingPage.ts` | payment-processing: payables, approval, history base |
| `pages/transfer-agent/TransferPaymentPage.ts` | `pages/A002_ops_pages/m004_payment_processing/TransferPaymentPage.ts` | payment-processing: extends PaymentProcessingPage |
| `pages/transfer-agent/TransferSheetPage.ts` | `pages/A002_ops_pages/m005_settings/TransferSheetPage.ts` | settings/transfer-sheet: CRUD |

## Import Fixes Applied

### `pages/A002_ops_pages/m003_statements/sp001_upload/StatementUploadPage.ts`
- `../appPaths` → `../../../appPaths`
- `../sidebar/IcmSidebarPage` → `../../../sidebar/IcmSidebarPage`
- `../../test-data/commission-statements/statementUpload` → `../../../../test-data/commission-statements/statementUpload`
- `../../utils/excelStatementPrep` → `../../../../utils/excelStatementPrep`
- `../../utils/excelStatementPrep` → `../../../../utils/excelStatementPrep`
- `../../utils/statementUploadContext` → `../../../../utils/statementUploadContext`
- `../../utils/pageLoader` → `../../../../utils/pageLoader`
- `../../utils/smokeTimeouts` → `../../../../utils/smokeTimeouts`

### `pages/A002_ops_pages/m002_commissions/CommissionRulePage.ts`
- `../../utils/pageLoader` → `../../../utils/pageLoader`
- `../../utils/smokeTimeouts` → `../../../utils/smokeTimeouts`

### `pages/A002_ops_pages/m003_statements/sp001_upload/HappyFlowStatementPage.ts`
- `../appPaths` → `../../../appPaths`
- `../commission-statements/StatementUploadPage` → `../../../commission-statements/StatementUploadPage`
- `../../test-data/happy-flow/happyFlow001` → `../../../../test-data/happy-flow/happyFlow001`
- `../../utils/happy-flow/happyFlowContext` → `../../../../utils/happy-flow/happyFlowContext`
- `../../utils/happy-flow/happyFlowUpload` → `../../../../utils/happy-flow/happyFlowUpload`
- `../../utils/pageLoader` → `../../../../utils/pageLoader`
- `../../utils/smokeTimeouts` → `../../../../utils/smokeTimeouts`

### `pages/A001_core_pages/m004_Products/ProductPage.ts`
- `../appPaths` → `../../appPaths`
- `../sidebar/IcmSidebarPage` → `../../sidebar/IcmSidebarPage`
- `../../test-data/happy-flow/happyFlow001` → `../../../test-data/happy-flow/happyFlow001`
- `../../utils/pageLoader` → `../../../utils/pageLoader`
- `../../utils/softSmoke` → `../../../utils/softSmoke`
- `../../utils/smokeTimeouts` → `../../../utils/smokeTimeouts`
- `../smoke/GridSmokePage` → `../../smoke/GridSmokePage`

### `pages/A002_ops_pages/m004_payment_processing/TransferPaymentPage.ts`
- `../../test-data/happy-flow/happyFlow001` → `../../../test-data/happy-flow/happyFlow001`
- `../../utils/happy-flow/happyFlowContext` → `../../../utils/happy-flow/happyFlowContext`
- `../../utils/transfer-agent/transferSheetContext` → `../../../utils/transfer-agent/transferSheetContext`
- `../operations/payment-processing/PaymentProcessingPage` → `../../operations/payment-processing/PaymentProcessingPage`
- `../../utils/pageLoader` → `../../../utils/pageLoader`
- `../../utils/smokeTimeouts` → `../../../utils/smokeTimeouts`

### `pages/A002_ops_pages/m005_settings/TransferSheetPage.ts`
- `../appPaths` → `../../appPaths`
- `../sidebar/IcmSidebarPage` → `../../sidebar/IcmSidebarPage`
- `../../test-data/transfer-agent/transferSheet` → `../../../test-data/transfer-agent/transferSheet`
- `../../utils/pageLoader` → `../../../utils/pageLoader`
- `../../utils/smokeTimeouts` → `../../../utils/smokeTimeouts`

### `pages/A002_ops_pages/m003_statements/sp001_upload/TransferStatementPage.ts`
- `../appPaths` → `../../../appPaths`
- `../commission-statements/StatementUploadPage` → `../../../commission-statements/StatementUploadPage`
- `../../test-data/transfer-agent/transferSheet` → `../../../../test-data/transfer-agent/transferSheet`
- `../../utils/transfer-agent/excelTransferPrep` → `../../../../utils/transfer-agent/excelTransferPrep`
- `../../utils/transfer-agent/excelTransferPrep` → `../../../../utils/transfer-agent/excelTransferPrep`
- `../../utils/transfer-agent/transferSheetContext` → `../../../../utils/transfer-agent/transferSheetContext`
- `../../utils/pageLoader` → `../../../../utils/pageLoader`
- `../../utils/smokeTimeouts` → `../../../../utils/smokeTimeouts`

### `pages/A001_core_pages/m001_user-management/UserManagementPage.ts`
- `../../test-data/user-management/users` → `../../../test-data/user-management/users`
- `../appPaths` → `../../appPaths`
- `../../utils/pageLoader` → `../../../utils/pageLoader`
