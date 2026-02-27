import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export interface RouteFormData {
  name: string;
  paths: string[];          // e.g. ['/api/v1']
  hosts?: string[];
  headers?: Record<string, string>;
  stripPath?: boolean;
  preserveHost?: boolean;
  tags?: string[];
}

/**
 * RouteFormPage
 * ─────────────
 * Handles the New / Edit Route form within a Service's context.
 */
export class RouteFormPage extends BasePage {
  readonly nameInput: Locator;
  readonly pathsInput: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    this.nameInput = page.locator('[data-testid="route-form-name"]').first();
    // Paths is often a tag-style multi-value input
    this.pathsInput = page.locator('[data-testid="route-form-paths-input-1"]').first();
    this.saveButton = page.getByRole('button', { name: /save|create route|submit/i });
    this.cancelButton = page.getByRole('button', { name: /cancel/i });
  }

  async waitForForm(): Promise<void> {
    await expect(this.nameInput).toBeVisible({ timeout: 15_000 });
  }

  // ── Individual field helpers ──────────────────────────────────────

  async fillName(name: string): Promise<void> {
    await this.nameInput.clear();
    await this.nameInput.fill(name);
  }

  /**
   * Adds a path to the multi-value paths input.
   * Kong Manager uses an Enter-separated tag input for paths.
   */
  async addPath(path: string): Promise<void> {
    await this.pathsInput.fill(path);
  }

  async addPaths(paths: string[]): Promise<void> {
    for (const p of paths) await this.addPath(p);
  }


  async selectFromMultiselect(value: string): Promise<void> {
    const trigger = this.page.getByTestId('multiselect-trigger');
    if (await trigger.count() === 0) {
      throw new Error('multiselect trigger not found');
    }
    await trigger.click();
    const item = this.page.getByTestId(`multiselect-item-${value}`);
    await item.click();
  }


  // ── Composite fill ────────────────────────────────────────────────

  async fill(data: RouteFormData): Promise<void> {
    await this.waitForForm();
    await this.fillName(data.name);
    await this.addPaths(data.paths);
  }

  async submit(): Promise<void> {
    await this.saveButton.click();
  }

  async fillAndSubmit(data: RouteFormData): Promise<void> {
    await this.fill(data);
    await this.submit();
  }
}