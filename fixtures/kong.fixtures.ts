import { test as base, request as playwrightRequest } from '@playwright/test';
import * as dotenv from 'dotenv';
import {
  ServicesListPage,
  ServiceFormPage,
  ServiceDetailPage,
  RouteFormPage,
} from '../pages';
import { KongApiHelper } from '../utils/kong-api-helper';

dotenv.config();

/**
 * Kong fixture interface — every test receives these objects via destructuring.
 *
 * @example
 * test('creates a service', async ({ servicesListPage, serviceFormPage }) => { ... });
 */
export interface KongFixtures {
  servicesListPage: ServicesListPage;
  serviceFormPage: ServiceFormPage;
  serviceDetailPage: ServiceDetailPage;
  routeFormPage: RouteFormPage;
  kongApi: KongApiHelper;
}

/**
 * Extended test object with all Kong fixtures pre-wired.
 * Import `test` and `expect` from this file instead of `@playwright/test`.
 */
import { cleanupTestEntities } from '../utils/cleanup';

export const test = base.extend<KongFixtures>({
  // ── Page Object fixtures ──────────────────────────────────────────

  servicesListPage: async ({ page }, use) => {
    await use(new ServicesListPage(page));
  },

  serviceFormPage: async ({ page }, use) => {
    await use(new ServiceFormPage(page));
  },

  serviceDetailPage: async ({ page }, use) => {
    await use(new ServiceDetailPage(page));
  },

  routeFormPage: async ({ page }, use) => {
    await use(new RouteFormPage(page));
  },

  // ── Admin API fixture ─────────────────────────────────────────────

  kongApi: async ({}, use) => {
    const adminUrl = process.env.KONG_ADMIN_URL ?? 'http://localhost:8001';
    const apiCtx = await playwrightRequest.newContext({
      baseURL: adminUrl,
      extraHTTPHeaders: process.env.KONG_ADMIN_TOKEN
        ? { 'Kong-Admin-Token': process.env.KONG_ADMIN_TOKEN }
        : {},
    });

    const helper = new KongApiHelper(apiCtx);
    await use(helper);
    await apiCtx.dispose();
  },
});

// ── Global hooks (run around every test) ─────────────────────────────

test.afterEach(async ({ kongApi }) => {
  // run manual cleanup after each test so state doesn't leak
  await cleanupTestEntities(kongApi, 1000); // wait 1000ms before cleanup
});

// Ensure any leftover entities from previous runs are removed before each test starts
test.beforeEach(async ({ kongApi }) => {
  await cleanupTestEntities(kongApi, 1000); // wait 1s before cleanup
});

export { expect } from '@playwright/test';