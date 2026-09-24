function resolveHost(): string {
  const fromEnv = (process.env.BASE_URL ?? '').trim();
  if (fromEnv) {
    try {
      return new URL(fromEnv).hostname;
    } catch {
      // fall through
    }
  }
  return 'preprod.app.pieq.ai';
}

const APP_HOST = resolveHost();

export function isAppHostUrl(url: string): boolean {
  try {
    return new URL(url).hostname === APP_HOST;
  } catch {
    return false;
  }
}

export function isKeycloakLoginUrl(url: string): boolean {
  return /\/auth\/realms\//i.test(url) || /\/auth\/admin\//i.test(url) || /keycloak/i.test(url);
}

export const AppPaths = {
  login: '/',
  home: '/user-management',
  userManagement: '/user-management',
  products: '/product',
  agents: '/agents',
  commissionUpload: '/commission-processing/upload-statement',
  commissionSettings: '/commission-processing/statements/settings',
};

export const AppUrlPatterns = {
  authOrOpenId: /\/auth\/|\/openid\//i,

  userManagement: /\/user-management\/?$/i,
  userManagementAdd: /\/user-management\/add\/?$/i,
  userManagementEdit: /\/user-management\/edit\//i,

  carriers: /\/carriers\/?$/i,
  carriersCreate: /\/carriers\/create\/?$/i,
  carriersEdit: /\/carriers\/edit\//i,

  agents: /\/agents\/?$/i,
  agentsAdd: /\/agents\/add\/?$/i,
  agentsEdit: /\/agents\/edit\//i,

  products: /\/product\/?$/i,
  productsCreate: /\/product\/create\/?$/i,
  productsEdit: /\/product\/edit\//i,
  productCommissionStructure: /commission-structure\/?$/i,

  policies: /\/policy\/?$/i,
  policiesCreate: /\/policy\/create\/?$/i,
  policiesEdit: /\/policy\/edit\//i,

  ///commissions (Commission Setup / Commission Management tree)
  commissionManagement: /\/commissions\/?$/i,

  ///commissions/statement-setup
  statementSetup: /\/commissions\/statement-setup\/?$/i,
  statementSetupCreate: /commissions\/statement-setup\/?$/i,
  statementSetupEdit: /commissions\/statement-setup\/edit\//i,

  commissionUpload: /commission-processing\/upload-statement|commission-processing\/statements\/upload/i,
  commissionHistory: /commission-processing\/statement-history|commission-processing\/statements\/history/i,
  commissionDetails: /commission-processing\/(commission-details|review|reconciliation)\//i,
  commissionReview: /commission-processing\/review\//i,
  commissionNeedsAttention: /commission-processing\/needs-attention|commission-processing\/statements\/needs-attention/i,
  commissionReconciliation: /commission-processing\/reconciliation\//i,

  paymentPayables: /\/payment-processing\/payable-line-items/i,
  paymentApproval: /\/payment-processing\/pending-authorization/i,
  paymentHistory: /\/payment-processing\/disbursement-history/i,

  settingsPrompts: /\/commission-statement-processing\/prompts-library/i,
  settingsCommissionTemplates: /commission.*template|\/settings\/commission-templates/i,
  settingsTransferSheet: /transfer.*sheet|\/settings\/transfer-sheet/i,
  settingsAgency: /agency.*config|\/settings\/agency/i,
  settingsAgencySettings: /\/agency-configuration\/?$/i,
  settingsDataImport: /\/agency-configuration\/data-import\/?$/i,

  dashboardAgencyOwner: /\/dashboard\/agency-owner\/?$/i,
  dashboardOpsManager: /\/dashboard\/ops-manager\/?$/i,
  dashboardAgent: /\/dashboard\/agent\/?$/i,

  agentInsights: /\/agent-insights\/?$/i,
  bookOfBusiness: /\/book-of-business\/?$/i,
  ledger: /\/ledger\/?$/i,

  advanceOverview: /\/advance\/overview\/?$/i,
  advanceSetup: /\/advance\/advance-setup\/?$/i,

  policyMaster: /\/policy\/?$/i,
  policyMasterCreate: /\/policy\/create\/?$/i,
  policyMasterEdit: /\/policy\/edit\//i,

  miscellaneousCharges: /\/payment-processing\/miscellaneous-charges\/?$/i,
};
