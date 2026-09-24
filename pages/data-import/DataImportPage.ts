import { expect, type Locator, type Page } from '@playwright/test';
import { AppUrlPatterns } from '../appPaths';
import { IcmSidebarPage } from '../sidebar/IcmSidebarPage';
import { ensurePageReady } from '../../utils/pageLoader';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';
import { GridPage } from '../shared/GridPage';

const T = smokeStepTimeoutMs;

export class DataImportPage extends GridPage {
  private readonly sidebar: IcmSidebarPage;

  readonly loc: {
    heading: () => Locator;
    subtitle: () => Locator;
    importTypeDropdown: () => Locator;
    uploadPanel: () => Locator;
    uploadButton: () => Locator;
    cancelButton: () => Locator;
    historyTable: () => Locator;
  };

  constructor(page: Page) {
    super(page);
    this.sidebar = new IcmSidebarPage(page);
    this.loc = {
      heading: () => this.page.getByRole('heading', { name: 'Data Import' }),
      subtitle: () => this.page.getByText('Import policy, product, or commissions data'),
      importTypeDropdown: () => this.page.getByTestId('data-import-dropdown'),
      uploadPanel: () => this.page.getByTestId('data-import-panel'),
      uploadButton: () => this.page.getByTestId('data-import-upload-button'),
      cancelButton: () => this.page.getByTestId('data-import-cancel-button'),
      historyTable: () => this.page.getByTestId('data-import-history-table'),
    };
  }

  async open() {
    await this.sidebar.openDataImport();
    await expect(this.page).toHaveURL(AppUrlPatterns.settingsDataImport);
    await ensurePageReady(this.page, this.loc.heading(), { timeout: T });
  }

  /** Assert heading is visible — side-effect-free read-only check. */
  async expectHeadingVisible() {
    await expect(this.loc.heading()).toBeVisible({ timeout: T });
  }
}
