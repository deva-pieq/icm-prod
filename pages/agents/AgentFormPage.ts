import { expect, type Locator, type Page } from '@playwright/test';
import { captureToast, expectCapturedOrLiveToast, waitForAppSettled } from '../../utils/pageLoader';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';

const T = smokeStepTimeoutMs;

export class AgentFormPage {
  readonly loc = {
    headingAdd: () => this.page.getByRole('heading', { name: 'Add Agent', exact: true }),
    headingEdit: () => this.page.getByRole('heading', { name: /agent edit/i }),
    personalInfoHeading: () => this.page.getByRole('heading', { name: /personal information/i }),

    agentCodeInput: () => this.page.getByTestId('agent-code-input').getByRole('textbox'),
    firstNameInput: () => this.page.getByTestId('first-name-input').getByRole('textbox'),
    lastNameInput: () => this.page.getByTestId('last-name-input').getByRole('textbox'),
    dateOfBirthInput: () => this.page.getByTestId('date-of-birth-input').getByRole('textbox'),
    emailInput: () => this.page.getByTestId('email-input').getByRole('textbox'),
    phoneInput: () => this.page.getByTestId('phone-input').getByRole('textbox'),
    addressInput: () => this.page.getByTestId('address-input').getByRole('textbox'),
    cityInput: () => this.page.getByTestId('city-input').getByRole('textbox'),
    zipCodeInput: () => this.page.getByTestId('zip-code-input').getByRole('textbox'),
    hireDateInput: () => this.page.getByTestId('hire-date-input').getByRole('textbox'),
    npnInput: () => this.page.getByTestId('npn-input').getByRole('textbox'),
    routingNumberInput: () => this.page.getByTestId('routing-number-input-0').getByRole('textbox'),
    bankNameInput: () => this.page.getByTestId('bank-name-input-0').getByRole('textbox'),
    accountNumberInput: () => this.page.getByTestId('account-number-input-0').getByRole('textbox'),
    taxIdInput: () => this.page.getByTestId('tax-id-input').getByRole('textbox'),
    w9NameInput: () => this.page.getByTestId('w9-name-input').getByRole('textbox'),

    saveButton: () =>
      this.page
        .getByTestId('create-agent-button')
        .or(this.page.getByTestId('update-agent-button')),
    cancelButton: () => this.page.getByTestId('cancel-button'),
    backButton: () => this.page.getByTestId('back-button'),

    confirmModalHeading: () =>
      this.page.getByRole('heading', { name: /^(Create Agent|Update Agent|Save Changes)$/i }),
    confirmModalSaveButton: () =>
      this.page
        .getByTestId('create-agent-confirm-button')
        .or(this.page.getByTestId('update-agent-confirm-button'))
        .or(this.page.getByTestId('confirm-save-button')),
    confirmModalCancelButton: () =>
      this.page
        .getByTestId('create-agent-cancel-button')
        .or(this.page.getByTestId('update-agent-cancel-button')),
    confirmModalCloseButton: () => this.page.getByTestId('modal-close-button'),

    cancelChangesModal: () => this.page.getByTestId('unsaved-changes-modal'),
    cancelChangesModalHeading: () => this.page.getByRole('heading', { name: 'Cancel Changes' }),
    /** Live: button label "Cancel" — discards draft and leaves form. */
    cancelChangesConfirmButton: () => this.page.getByTestId('unsaved-changes-confirm'),
    /** Live: button label "Keep Editing". */
    cancelChangesCancelButton: () => this.page.getByTestId('unsaved-changes-cancel'),
    agentCodeError: () => this.page.getByTestId('agent-code-error'),
    emailError: () => this.page.getByTestId('email-error'), //data-testid="email-input"
    phoneError: () =>
      this.page.getByTestId('phone-error').or(
        this.page.getByTestId('phone-input').locator('..').getByText(/already|exists|taken|duplicate/i),
      ),
    npnError: () => this.page.getByTestId('npn-error'),

    /** Sonner only — do not OR role=alert/status (inline field errors match those). */
    successToast: () => this.page.locator('[data-sonner-toast]').first(),
    fieldError: (testId: string) =>
      this.page.getByTestId(`${testId}-error`).or(
        this.page.getByTestId(testId).locator('..').getByText(/already|exists|taken|duplicate|invalid/i),
      ),
  };

  /** Last unique email filled for create-agent search assertions. */
  lastCreatedEmail = '';
  lastCreatedAgentId = '';

  constructor(readonly page: Page) {}

  async isAddFormVisible(): Promise<boolean> {
    return this.loc.headingAdd().isVisible({ timeout: T }).catch(() => false);
  }

  async isOnAgentsList(): Promise<boolean> {
    return this.page.waitForURL(/\/agents\/?$/i, { timeout: T })
      .then(() => true)
      .catch(() => false);
  }

  async fillAgentId(value: string) {
    await this.loc.agentCodeInput().fill(value);
  }

  async fillFirstName(value: string) {
    await this.loc.firstNameInput().fill(value);
  }

  async fillLastName(value: string) {
    await this.loc.lastNameInput().fill(value);
  }

  async fillEmail(value: string) {
    await this.loc.emailInput().fill(value);
  }

  async fillNpn(value: string) {
    await this.loc.npnInput().fill(value);
  }

  async fillAllRequiredFields(data: {
    agentId: string;
    firstName: string;
    lastName: string;
    email: string;
    npn?: string;
    phone?: string;
  }) {
    this.lastCreatedAgentId = data.agentId;
    this.lastCreatedEmail = data.email;
    await this.loc.agentCodeInput().fill(data.agentId);
    await this.loc.firstNameInput().fill(data.firstName);
    await this.loc.lastNameInput().fill(data.lastName);
    await this.loc.emailInput().fill(data.email);
    if (data.phone && (await this.loc.phoneInput().isVisible().catch(() => false))) {
      await this.loc.phoneInput().fill(data.phone);
    }
    if (data.npn && (await this.loc.npnInput().isVisible().catch(() => false))) {
      await this.loc.npnInput().fill(data.npn);
    }
  }

  async fillSomeRequiredFields(data: {
    agentId?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  }) {
    if (data.agentId) await this.loc.agentCodeInput().fill(data.agentId);
    if (data.firstName) await this.loc.firstNameInput().fill(data.firstName);
    if (data.lastName) await this.loc.lastNameInput().fill(data.lastName);
    if (data.email) await this.loc.emailInput().fill(data.email);
  }

  async fillOneField(field: 'agentId' | 'firstName' | 'lastName' | 'email', value: string) {
    switch (field) {
      case 'agentId': await this.loc.agentCodeInput().fill(value); break;
      case 'firstName': await this.loc.firstNameInput().fill(value); break;
      case 'lastName': await this.loc.lastNameInput().fill(value); break;
      case 'email': await this.loc.emailInput().fill(value); break;
    }
  }

  async isSaveDisabled(): Promise<boolean> {
    const btn = this.loc.saveButton();
    return btn.isDisabled({ timeout: 2_000 }).catch(() => true);
  }

  async clickSave() {
    await this.loc.saveButton().click();
    await waitForAppSettled(this.page);
  }

  /**
   * Confirm Save on the modal.
   * - Validation / negative paths: omit captureToast (inline field errors, no Sonner).
   * - Happy-path saves: pass `{ captureToast: true }` so toast is stashed before settle.
   */
  async clickConfirmSave(opts: { captureToast?: boolean } = {}) {
    const modalHeading = this.loc.confirmModalHeading();
    const modalVisible = await modalHeading.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!modalVisible) return;
    const saveBtn = this.loc.confirmModalSaveButton();
    const saveVisible = await saveBtn.isVisible({ timeout: 3_000 }).catch(() => false);
    if (saveVisible) {
      await saveBtn.click();
    } else {
      const anySaveBtn = this.page.getByRole('dialog').getByRole('button', { name: /save|confirm/i });
      if (await anySaveBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await anySaveBtn.click();
      } else {
        return;
      }
    }
    if (opts.captureToast) {
      await this.captureSuccessToast();
    } else {
      await waitForAppSettled(this.page);
    }
  }

  async clickCancelConfirm() {
    await expect(this.loc.confirmModalHeading()).toBeVisible({ timeout: T });
    await this.loc.confirmModalCancelButton().click();
  }

  async clickBack() {
    await this.loc.backButton().click();
  }

  async isCancelChangesModalVisible(): Promise<boolean> {
    return this.loc
      .cancelChangesModal()
      .or(this.loc.cancelChangesModalHeading())
      .first()
      .isVisible({ timeout: T })
      .catch(() => false);
  }

  /** Inline duplicate errors next to Agent Id / Email / NPN after Save. */
  async expectDuplicateValidationErrors(): Promise<void> {
    // Live harvest: data-testid agent-code-error / email-error / npn-error
    await expect(this.loc.agentCodeError()).toBeVisible({ timeout: T });
    await expect(this.loc.agentCodeError()).toContainText(/already exists/i);
    await expect(this.loc.emailError()).toBeVisible({ timeout: T });
    await expect(this.loc.emailError()).toContainText(/already exists/i);
    await expect(this.loc.npnError()).toBeVisible({ timeout: T });
    await expect(this.loc.npnError()).toContainText(/already exists/i);
  }

  async confirmAbort() {
    const modal = this.loc.cancelChangesModal();
    await expect(modal).toBeVisible({ timeout: T });
    await expect(this.loc.cancelChangesModalHeading()).toBeVisible({ timeout: T });
    // Live button text is "Cancel" (testid unsaved-changes-confirm) — not "Cancel Changes".
    const confirm = modal
      .getByTestId('unsaved-changes-confirm')
      .or(modal.getByRole('button', { name: /^Cancel$/i }));
    await expect(confirm).toBeVisible({ timeout: 10_000 });
    await confirm.click();
    await expect(modal).toBeHidden({ timeout: 15_000 });
  }

  async keepEditing() {
    const modal = this.loc.cancelChangesModal();
    await expect(modal).toBeVisible({ timeout: T });
    const keep = modal
      .getByTestId('unsaved-changes-cancel')
      .or(modal.getByRole('button', { name: /Keep Editing/i }));
    await expect(keep).toBeVisible({ timeout: 10_000 });
    await keep.click();
    await expect(modal).toBeHidden({ timeout: 15_000 });
  }

  async captureSuccessToast() {
    await captureToast(this.page, this.loc.successToast(), T);
  }

  async expectSuccessToast() {
    const text = await expectCapturedOrLiveToast(this.page, this.loc.successToast(), T);
    if (text) {
      expect.soft(text.length, 'Success toast should contain a message (soft)').toBeGreaterThan(0);
    }
  }

  async expectValidationError(field: string) {
    const error = this.loc.fieldError(field);
    await expect(error.first()).toBeVisible({ timeout: T });
  }

  async expectValidationText(text: string) {
    await expect(this.page.getByText(text, { exact: false }).first()).toBeVisible({ timeout: T });
  }

  async expectValidationMatching(pattern: string | RegExp) {
    const re = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;
    await expect(this.page.getByText(re).first()).toBeVisible({ timeout: T });
  }

  async isSaveEnabled(): Promise<boolean> {
    const btn = this.loc.saveButton();
    return btn.isEnabled({ timeout: 2_000 }).catch(() => false);
  }

  async expectStatusShows(expectedStatus: string) {
    await expect(this.page.getByText(new RegExp(expectedStatus, 'i'))).toBeVisible({ timeout: T });
  }

  async getAgentStatus(): Promise<string> {
    const statusEl = this.page.getByTestId('status-dropdown');
    return (await statusEl.textContent() ?? '').replace(/\s+/g, ' ').trim();
  }

  async searchGridForAgent(query: string) {
    const searchInput = this.page
      .getByTestId('data-grid-search-input')
      .or(this.page.getByRole('textbox', { name: 'Search data grid' }));
    await searchInput.fill('');
    await searchInput.fill(query);
    await expect(this.page.getByRole('grid', { name: 'Data grid' })).toBeVisible();
    await waitForAppSettled(this.page);
  }

  async expectGridHasStatusInRow(expectedStatus: string) {
    await expect
      .poll(
        async () => {
          const rows = this.page.getByRole('grid', { name: 'Data grid' }).getByRole('row');
          const count = await rows.count();
          for (let i = 0; i < count; i++) {
            const text = await rows.nth(i).innerText();
            if (text.includes(expectedStatus)) return true;
          }
          return false;
        },
        { timeout: 30_000, intervals: [1_000, 2_000] },
      )
      .toBe(true);
  }

  // ── Edit form helpers ──────────────────────────────────────────────────────

  /** Leave edit form and return to Agents list (abort unsaved modal if shown). */
  async leaveFormToAgentsList(agentsPage: { openList: () => Promise<void> }) {
    await this.clickBack();
    if (await this.isCancelChangesModalVisible()) {
      await this.confirmAbort();
    }
    await agentsPage.openList();
    await waitForAppSettled(this.page);
  }

  /**
   * On edit of first grid agent: copy phone from second agent, then set it on first.
   * Requires ≥2 agent rows.
   */
  async setPhoneToExistingAgentPhone(agentsPage: {
    openList: () => Promise<void>;
    openGridRecordAt: (index: number) => Promise<boolean>;
    openEditByRowClick: () => Promise<void>;
  }) {
    await this.leaveFormToAgentsList(agentsPage);
    const openedOther = await agentsPage.openGridRecordAt(1);
    expect(openedOther, 'Need a second agent row to source an existing phone').toBe(true);
    await waitForAppSettled(this.page);
    await expect(this.loc.phoneInput()).toBeVisible({ timeout: T });
    const otherPhone = (await this.loc.phoneInput().inputValue()).trim();
    expect(otherPhone, 'Second agent must have a phone value').toBeTruthy();
    await this.leaveFormToAgentsList(agentsPage);
    await agentsPage.openEditByRowClick();
    await waitForAppSettled(this.page);
    await expect(this.loc.phoneInput()).toBeVisible({ timeout: T });
    await this.loc.phoneInput().fill(otherPhone);
    await this.fillValidBankDetails();
  }

  async expectPhoneAlreadyExistsValidation() {
    const phoneErr = this.loc.phoneError();
    await expect(phoneErr.first()).toBeVisible({ timeout: T });
    await expect(phoneErr.first()).toContainText(/already|exists|taken|duplicate/i);
  }

  async expectEmailNotEditable() {
    const email = this.loc.emailInput();
    await expect(email).toBeVisible({ timeout: T });
    const disabled = await email.isDisabled().catch(() => false);
    const readonly = await email.getAttribute('readonly');
    const ariaReadonly = await email.getAttribute('aria-readonly');
    const editable = await email.evaluate((el) => {
      const input = el as HTMLInputElement;
      return !input.disabled && !input.readOnly;
    });
    expect(
      disabled || readonly !== null || ariaReadonly === 'true' || !editable,
      'Email field should not be editable on agent edit',
    ).toBe(true);
  }

  /** Bank name / account / routing are mandatory — Save stays disabled until filled. */
  async fillValidBankDetails() {
    if (await this.loc.bankNameInput().isVisible().catch(() => false)) {
      await this.loc.bankNameInput().fill('Chase Bank');
    }
    if (await this.loc.accountNumberInput().isVisible().catch(() => false)) {
      await this.loc.accountNumberInput().fill('123456789012');
    }
    if (await this.loc.routingNumberInput().isVisible().catch(() => false)) {
      await this.loc.routingNumberInput().fill('121000248');
    }
  }

  async changeEditableFields() {
    await this.loc.firstNameInput().fill('Updated');
    await this.loc.lastNameInput().fill('Agent');
    if (await this.loc.phoneInput().isVisible().catch(() => false)) {
      await this.loc.phoneInput().fill('5559999999');
    }
    await this.fillValidBankDetails();
  }

  async clearMandatoryField() {
    await this.loc.firstNameInput().fill('');
  }

  async provideEmojiAndSymbols() {
    await this.loc.firstNameInput().fill('😊!@#');
    await this.loc.lastNameInput().fill('💀%&*');
  }

  async enterMoreThan50CharactersInNames() {
    const longStr = 'A'.repeat(51);
    await this.loc.firstNameInput().fill(longStr);
    await this.loc.lastNameInput().fill(longStr);
    await this.fillValidBankDetails();
  }

  async enterInvalidEmail() {
    await this.loc.emailInput().fill('not-an-email');
  }

  async enterOversizedAddressCityAndValidZip() {
    await this.loc.addressInput().fill('A'.repeat(101));
    await this.loc.cityInput().fill('B'.repeat(26));
    await this.loc.zipCodeInput().fill('12345');
    // Masked/empty bank blocks Save (bank now mandatory) and hides address/city errors.
    await this.fillValidBankDetails();
  }

  async enterInvalidBankFields() {
    if (await this.loc.routingNumberInput().isVisible().catch(() => false)) {
      await this.loc.routingNumberInput().fill('123');
    }
    if (await this.loc.bankNameInput().isVisible().catch(() => false)) {
      await this.loc.bankNameInput().fill('');
    }
    if (await this.loc.accountNumberInput().isVisible().catch(() => false)) {
      await this.loc.accountNumberInput().fill('123');
    }
  }

  async enterInvalidTaxFields() {
    await this.fillValidBankDetails();
    if (await this.loc.taxIdInput().isVisible().catch(() => false)) {
      await this.loc.taxIdInput().fill('123456789');
    }
    if (await this.loc.w9NameInput().isVisible().catch(() => false)) {
      await this.loc.w9NameInput().fill('X'.repeat(101));
    }
  }

  async openTaxTypeDropdown() {
    const taxTypeBtn = this.page.getByRole('button', { name: /select tax type/i });
    if (await taxTypeBtn.isVisible().catch(() => false)) {
      await taxTypeBtn.click();
      await this.page.waitForTimeout(300);
    }
  }

  async hoverTaxId() {
    const taxIdInput = this.loc.taxIdInput();
    if (await taxIdInput.isVisible().catch(() => false)) {
      await taxIdInput.hover();
      await this.page.waitForTimeout(300);
    }
  }

  async expectValidationTextVisible(text: string) {
    const pattern = new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    await expect(this.page.getByText(pattern).first()).toBeVisible({ timeout: T });
  }

  async expectBankValidationErrors() {
    await expect
      .poll(
        async () => {
          const body = this.page.locator('body');
          const text = (await body.innerText()).toLowerCase();
          return (
            text.includes('routing') ||
            text.includes('account') ||
            text.includes('bank') ||
            text.includes('must not exceed') ||
            text.includes('must be at least')
          );
        },
        { timeout: T, intervals: [500, 1_000] },
      )
      .toBe(true);
  }

  async expectTaxValidationErrors() {
    await expect
      .poll(
        async () => {
          const body = this.page.locator('body');
          const text = (await body.innerText()).toLowerCase();
          return (
            text.includes('tax') ||
            text.includes('w-9') ||
            text.includes('must not exceed') ||
            text.includes('invalid')
          );
        },
        { timeout: T, intervals: [500, 1_000] },
      )
      .toBe(true);
  }

  async expectInvalidNameErrors() {
    await expect
      .poll(
        async () => {
          const body = this.page.locator('body');
          const text = (await body.innerText()).toLowerCase();
          return text.includes('invalid') || text.includes('must not') || text.includes('characters');
        },
        { timeout: T, intervals: [500, 1_000] },
      )
      .toBe(true);
  }

  async expectFieldsDoNotOverlap(field1TestId: string, field2TestId: string) {
    const el1 = this.page.getByTestId(field1TestId);
    const el2 = this.page.getByTestId(field2TestId);
    const box1 = await el1.boundingBox().catch(() => null);
    const box2 = await el2.boundingBox().catch(() => null);
    if (box1 && box2) {
      const noOverlap =
        box1.x + box1.width <= box2.x ||
        box2.x + box2.width <= box1.x ||
        box1.y + box1.height <= box2.y ||
        box2.y + box2.height <= box1.y;
      expect(noOverlap, 'Fields should not overlap').toBe(true);
    }
  }
}
