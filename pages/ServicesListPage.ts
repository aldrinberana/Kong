import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../pages/BasePage';

/**
 * ServicesListPage
 * ────────────────
 * Represents the Gateway Services list page in Kong Manager.
 * URL: /default/services
 */
export class ServicesListPage extends BasePage {
  // ── Locators ──────────────────────────────────────────────────────
  readonly newServiceButton: Locator;
  readonly searchInput: Locator;
  readonly serviceTable: Locator;

  constructor(page: Page) {
    super(page);
    this.newServiceButton = page.getByRole('button', { name: 'Add a Gateway Service' }).or(page.getByTestId('toolbar-add-gateway-service'));
    this.searchInput = page.getByPlaceholder(/search/i);
    this.serviceTable = page.locator('table[data-tableid]');
  }

  // ── Navigation ────────────────────────────────────────────────────

  async navigate(): Promise<void> {
    // Kong Manager OSS URL pattern — adjust if using Enterprise workspaces
    await this.page.goto(process.env.KONG_MANAGER_URL ?? 'http://localhost:8002/');
    await this.waitForPageReady();

  }

  async clickDefaultWorkspace(): Promise<void> {
    await this.serviceTable.locator('tbody tr').first().click();
    await this.waitForPageReady();
  }

  // ── Actions ───────────────────────────────────────────────────────
  async clickNewService(): Promise<void> {
    await this.newServiceButton.click();
    await this.waitForPageReady();
  }

  async expectServiceVisible(name: string): Promise<void> {
    await expect(
      this.serviceTable.getByText(name).first()
    ).toBeVisible({ timeout: 10_000 });
  }

}