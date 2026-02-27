import { Page, Locator, expect } from '@playwright/test';

/**
 * BasePage
 * ────────
 * Every Page Object inherits shared navigation helpers, toast assertions,
 * and waiting utilities from this class.
 */
export abstract class BasePage {
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ── Navigation ────────────────────────────────────────────────────

  async goto(path: string = '/'): Promise<void> {
    await this.page.goto(path);
    await this.waitForPageReady();
  }

  /** Wait until the network is idle and no spinners are visible */
  async waitForPageReady(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  // ── Toast / notifications ─────────────────────────────────────────

  get successToast(): Locator {
    return this.page.locator('.k-toaster .success, [data-testid="toaster-success"], .toast-success').first();
  }

  get errorToast(): Locator {
    return this.page.locator('.k-toaster .danger, [data-testid="toaster-danger"], .toast-error').first();
  }

  async expectSuccessToast(message?: string): Promise<void> {
    await expect(this.successToast).toBeVisible({ timeout: 10_000 });
    if (message) await expect(this.successToast).toContainText(message);
  }

  async expectErrorToast(message?: string): Promise<void> {
    await expect(this.errorToast).toBeVisible({ timeout: 10_000 });
    if (message) await expect(this.errorToast).toContainText(message);
  }

  // ── Shared UI helpers ─────────────────────────────────────────────

  async clickPrimaryButton(label: string): Promise<void> {
    await this.page.getByRole('button', { name: label, exact: false }).click();
  }

  async fillField(label: string, value: string): Promise<void> {
    const field = this.page.getByLabel(label, { exact: false });
    await field.clear();
    await field.fill(value);
  }

  async selectOption(label: string, value: string): Promise<void> {
    await this.page.getByLabel(label, { exact: false }).selectOption(value);
  }

  /** Dismiss a confirmation / delete modal */
  async confirmDeletion(): Promise<void> {
    const modal = this.page.locator('[data-testid="confirmation-modal"], .modal');
    await modal.getByRole('button', { name: /delete|confirm|yes/i }).click();
  }

  // ── Sidebar Navigation ────────────────────────────────────────────

  /**
   * Click a sidebar menu item by name
   * @param name - Item name: 'Overview', 'Gateway Services', 'Routes', 'Consumers', 'Plugins', etc.
   */
  async clickSidebarItem(name: string): Promise<void> {
    const testId = `sidebar-item-${name.toLowerCase().replace(/\s+/g, '-')}`;
    await this.page.getByTestId(testId).click();
    await this.waitForPageReady();
  }

}