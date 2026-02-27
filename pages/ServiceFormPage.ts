import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export interface ServiceFormData {
  name: string;
  /** Full upstream URL, e.g. https://httpbin.org */
  upstreamUrl: string;
  retries?: number;
  connectTimeout?: number;
  readTimeout?: number;
  writeTimeout?: number;
  tags?: string[];
}

/**
 * ServiceFormPage
 * ───────────────
 * Handles both the "New Service" and "Edit Service" forms in Kong Manager.
 */
export class ServiceFormPage extends BasePage {
  // ── Locators ──────────────────────────────────────────────────────
  readonly nameInput: Locator;
  readonly upstreamUrlInput: Locator;
  readonly retriesInput: Locator;
  readonly connectTimeoutInput: Locator;
  readonly readTimeoutInput: Locator;
  readonly writeTimeoutInput: Locator;
  readonly tagsInput: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly viewAdvancedFieldsButton: Locator;

  constructor(page: Page) {
    super(page);
    // Field locators — Kong Manager uses both label-based and data-testid patterns
    this.nameInput = page
      .locator('[data-testid="gateway-service-name-input"], input[name="name"]')
      .first();
    this.upstreamUrlInput = page
      .locator('[data-testid="gateway-service-url-input"], input[name="url"]')
      .first();
    this.retriesInput = page.locator('input[data-testid="gateway-service-retries-input"]').first();
    this.connectTimeoutInput = page.locator('input[data-testid="gateway-service-connTimeout-input"]').first();
    this.readTimeoutInput = page.locator('input[data-testid="gateway-service-readTimeout-input"]').first();
    this.writeTimeoutInput = page.locator('input[data-testid="gateway-service-writeTimeout-input"]').first();
    this.tagsInput = page.locator('[data-testid="tags-input"], input[name="tags"]').first();
    this.saveButton = page.getByRole('button', { name: /save|create service|submit/i });
    this.cancelButton = page.getByRole('button', { name: /cancel/i });
    this.viewAdvancedFieldsButton = page.getByRole('button', { name: "View advanced fields" });
  }

  // ── Waiting ───────────────────────────────────────────────────────

  async waitForForm(): Promise<void> {
    await expect(this.nameInput).toBeVisible({ timeout: 15_000 });
  }

  // ── Filling ───────────────────────────────────────────────────────

  async fillName(name: string): Promise<void> {
    await this.nameInput.clear();
    await this.nameInput.fill(name);
  }

  async fillUpstreamUrl(url: string): Promise<void> {
    await this.upstreamUrlInput.clear();
    await this.upstreamUrlInput.fill(url);
  }

  async fillRetries(retries: number): Promise<void> {
    await this.retriesInput.clear();
    await this.retriesInput.fill(retries.toString());
  }

  async fillConnectTimeout(ms: number): Promise<void> {
    await this.connectTimeoutInput.clear();
    await this.connectTimeoutInput.fill(ms.toString());
  }

  async fillReadTimeout(ms: number): Promise<void> {
    await this.readTimeoutInput.clear();
    await this.readTimeoutInput.fill(ms.toString());
  }

  async fillWriteTimeout(ms: number): Promise<void> {
    await this.writeTimeoutInput.clear();
    await this.writeTimeoutInput.fill(ms.toString());
  }


  /**
   * Fill the entire form from a data object in one call.
   */
  async fill(data: ServiceFormData): Promise<void> {
    await this.waitForForm();
    await this.fillName(data.name);
    await this.fillUpstreamUrl(data.upstreamUrl);

  }

  async fillAdvancedFields(data: ServiceFormData): Promise<void> {
    await this.viewAdvancedFieldsButton.click();
    await this.fillRetries(data.retries ?? 5);
    await this.fillConnectTimeout(data.connectTimeout ?? 30000);
    await this.fillReadTimeout(data.readTimeout ?? 30000);
    await this.fillWriteTimeout(data.writeTimeout ?? 30000);

  }

  // ── Submission ────────────────────────────────────────────────────

  async submit(): Promise<void> {
    await this.saveButton.click();
  }

  async fillAndSubmit(data: ServiceFormData): Promise<void> {
    await this.fill(data);
    await this.submit();
  }

  // ── Assertions ────────────────────────────────────────────────────

  async expectNameError(message?: string): Promise<void> {
    const error = this.page.locator('[data-testid="form-error"]').first();
    await expect(error).toBeVisible();
    if (message) await expect(error).toContainText(message);
  }
}