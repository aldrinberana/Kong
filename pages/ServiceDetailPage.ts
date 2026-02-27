import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * ServiceDetailPage
 * ─────────────────
 * The overview / detail view of a single Gateway Service.
 * From here operators can view routes, edit the service, etc.
 */
export class ServiceDetailPage extends BasePage {
  readonly editButton: Locator;
  readonly addRouteButton: Locator;
  readonly routesTab: Locator;
  readonly routeTable: Locator;
  readonly serviceNameHeading: Locator;

  constructor(page: Page) {
    super(page);
    this.editButton = page.getByRole('button', { name: /edit service/i });
    this.addRouteButton = page.getByRole('button', { name: 'Add a Route' }).or(page.getByRole('button', { name: 'New Route' }));
    this.routesTab = page.getByRole('tab', { name: /routes/i });
    this.routeTable = page.locator('[data-testid="route-list"], table').first();
    this.serviceNameHeading = page.locator('h1, h2, [data-testid="service-name"]').first();
  }

  async waitForDetail(): Promise<void> {
    await expect(this.serviceNameHeading).toBeVisible({ timeout: 15_000 });
  }


  async clickAddRoute(): Promise<void> {
    await this.addRouteButton.click();
    await this.waitForPageReady();
  }

  async expectRouteVisible(name: string): Promise<void> {
    await expect(this.routeTable.getByText(name).first()).toBeVisible({ timeout: 10_000 });
  }

}