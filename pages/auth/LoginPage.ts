import { expect, type Page } from '@playwright/test';
import { AppPaths, AppUrlPatterns, isAppHostUrl, isKeycloakLoginUrl } from '../appPaths';
import { ProfilePage } from './ProfilePage';
import { waitForLoaderHidden } from '../../utils/pageLoader';
import type { SmokeRoleKey } from '../../test-data/smoke/smokeRoles';
import { SMOKE_ROLES } from '../../test-data/smoke/smokeRoles';
import { smokeCredentialsForRole } from '../../utils/loadEnv';

export class LoginPage {
  private readonly loc = {
    sidebar: () => this.page.getByRole('navigation', { name: 'Sidebar navigation' }),
    emailInput: () =>
      this.page
        .getByRole('textbox', { name: /email address/i })
        .or(this.page.locator('#username, #email, input[name="username"]'))
        .or(this.page.getByRole('textbox', { name: /username|email/i }))
        .first(),
    continueButton: () => this.page.getByRole('button', { name: 'Continue' }),
    passwordInput: () =>
      this.page
        .getByLabel(/^password$/i)
        .or(this.page.locator('#password'))
        .or(this.page.locator('input[type="password"]'))
        .first(),
    signInButton: () => this.page.getByRole('button', { name: /sign in|log in/i }).first(),
  };

  constructor(private readonly page: Page) {}

  private entryPath(): string {
    const fromEnv = process.env.LOGIN_PATH?.trim();
    if (fromEnv) return fromEnv.startsWith('/') ? fromEnv : `/${fromEnv}`;
    return AppPaths.login;
  }

  async isLoggedIn(): Promise<boolean> {
    if (isKeycloakLoginUrl(this.page.url())) return false;
    return this.loc.sidebar().isVisible({ timeout: 5_000 }).catch(() => false);
  }

  async goto() {
    await this.page.goto(this.entryPath(), { waitUntil: 'domcontentloaded' });
    await this.waitForLoginPageOrApp();
  }

  private async waitForLoginPageOrApp() {
    const email = this.loc.emailInput();
    await Promise.race([
      this.page.waitForURL(AppUrlPatterns.authOrOpenId),
      this.loc.sidebar().waitFor({ state: 'visible' }),
      email.waitFor({ state: 'visible' }),
    ]).catch(() => undefined);
  }

  async waitForAppHost(timeout = 60_000) {
    await expect
      .poll(() => isAppHostUrl(this.page.url()) && !isKeycloakLoginUrl(this.page.url()), {
        timeout,
        intervals: [500, 1000, 2000, 5000, 10000, 15000],
      })
      .toBe(true);
    await this.page.waitForLoadState('domcontentloaded').catch(() => undefined);
  }

  async loginWithEmailPasswordToApp(email: string, password: string) {
    await this.waitForLoginPageOrApp();
    await expect(this.loc.emailInput()).toBeVisible({ timeout: 30_000 });
    await this.loc.emailInput().fill(email);
    await this.loc.continueButton().click();
    await expect(this.loc.passwordInput()).toBeVisible();
    await this.loc.passwordInput().fill(password);
    await this.loc.signInButton().click();
    await this.waitForSidebarNavigation();
  }

  /**
   * After Keycloak redirect, the app shell can land before the sidebar mounts.
   * Poll for navigation, then reload or re-navigate once before failing.
   */
  async waitForSidebarNavigation(timeout = 60_000) {
    await this.waitForAppHost(timeout);

    const sidebar = this.loc.sidebar();
    const sidebarVisible = () => sidebar.isVisible().catch(() => false);

    // Sidebar may already be visible — skip loader wait entirely.
    if (await sidebarVisible()) return;

    // Wait for loader, but don't fail if sidebar appears before loader clears
    // (false-positive spinner detection on SPA pages).
    await waitForLoaderHidden(this.page).catch(() => undefined);

    if (await sidebarVisible()) return;

    await expect
      .poll(sidebarVisible, {
        timeout: Math.min(timeout, 20_000),
        intervals: [500, 1000, 2000, 3000, 5000],
      })
      .toBe(true)
      .catch(() => undefined);

    if (await sidebarVisible()) return;

    await this.page.reload({ waitUntil: 'domcontentloaded' });
    await this.waitForAppHost(timeout);
    await waitForLoaderHidden(this.page).catch(() => undefined);

    if (await sidebarVisible()) return;

    await this.page.goto(AppPaths.login, { waitUntil: 'domcontentloaded' });
    await this.waitForAppHost(timeout);
    await waitForLoaderHidden(this.page).catch(() => undefined);

    await expect(sidebar).toBeVisible({ timeout: Math.max(10_000, timeout - 20_000) });
  }

  async ensureSession() {
    await this.waitForSidebarNavigation();
  }

  async ensureLoggedInAsRole(roleKey: SmokeRoleKey) {
    const spec = SMOKE_ROLES[roleKey];
    const creds = smokeCredentialsForRole(spec.envEmailKey);
    if (!creds) {
      throw new Error(`Missing ${spec.envEmailKey} and E2E_PASSWORD in .env for role ${roleKey}`);
    }
    await this.ensureLoggedInAs(creds.email, creds.password, spec.profileLabel);
  }

  async ensureLoggedInAs(email: string, password: string, expectedRoleLabel?: string) {
    if (await this.isLoggedIn()) {
      if (expectedRoleLabel) {
        const profile = new ProfilePage(this.page);
        const current = await profile.readRoleLabel().catch(() => '');
        if (current.toLowerCase() === expectedRoleLabel.toLowerCase()) {
          await this.ensureSession();
          return;
        }
        await profile.signOut();
      } else {
        await this.ensureSession();
        return;
      }
    }
    await this.goto();
    await this.loginWithEmailPasswordToApp(email, password);
    if (expectedRoleLabel) {
      await new ProfilePage(this.page).expectRoleLabel(expectedRoleLabel);
    }
  }
}
