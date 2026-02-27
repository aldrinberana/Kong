/**
 * @file service create.spec.ts
 * @description E2E tests for creating a Gateway Service via Kong Manager UI.
 *
 * Test cases:
 *  ✅ Create a service with all required fields
 *  ✅ Create a service with advanced fields (retries, timeouts, tags)
 *  ✅ Validate that a duplicate name is rejected
 *  ✅ Verify the service is retrievable via the Admin API after UI creation
 */

import { test, expect } from '../fixtures/kong.fixtures';
import { TestData, uniqueSuffix } from '../fixtures/test-data';
import { trackService } from '../utils/entity-tracker';

test.describe('Gateway Service — Create', () => {
  // ── Baseline happy path ───────────────────────────────────────────

  test('creates a service with required fields and confirms via API', async ({
    servicesListPage,
    serviceFormPage,
    serviceDetailPage,
    kongApi,
  }) => {
    const data = TestData.service({ name: `svc-required-${uniqueSuffix()}` });

    // 1. Navigate to services list
    await servicesListPage.navigate();
    await servicesListPage.clickDefaultWorkspace();

    // 2. Open new service form
    await servicesListPage.clickNewService();

    // 3. Fill & submit
    await serviceFormPage.fillAndSubmit(data);

    // 4. Expect success toast
    await serviceFormPage.expectSuccessToast();

    // 5. Verify we land on the detail page
    await serviceDetailPage.waitForDetail();

    // 6. Cross-check with Admin API
    const svc = await kongApi.getService(data.name);
    expect(svc).not.toBeNull();
    expect(svc!.name).toBe(data.name);

    // Track for cleanup
    if (svc) trackService(svc.id);
  });

  // ── Full-field creation ───────────────────────────────────────────

  test('creates a service with all optional fields', async ({
    servicesListPage,
    serviceFormPage,
    serviceDetailPage,
    kongApi,
  }) => {
    const data = TestData.service({
      name: `svc-full-${uniqueSuffix()}`,
      retries: 3,
      connectTimeout: 30000,
      readTimeout: 30000,
      writeTimeout: 30000,
      tags: ['full', 'e2e', 'playwright'],
    });

    await servicesListPage.navigate();
    await servicesListPage.clickDefaultWorkspace();
    await servicesListPage.clickNewService()
    await serviceFormPage.fill(data);
    await serviceFormPage.fillAdvancedFields(data);
    await serviceFormPage.submit();
    await serviceFormPage.expectSuccessToast();
    await serviceDetailPage.waitForDetail();

    const svc = await kongApi.getService(data.name);
    expect(svc).not.toBeNull();
    expect(svc!.name).toBe(data.name);

    if (svc) trackService(svc.id);
  });

  // ── Duplicate name validation ─────────────────────────────────────

  test('rejects a duplicate service name', async ({
    servicesListPage,
    serviceFormPage,
    kongApi,
  }) => {
    const name = `svc-dup-${uniqueSuffix()}`;

    await servicesListPage.navigate();
    await servicesListPage.clickDefaultWorkspace();
    await servicesListPage.clickNewService();

    // Create the first one
    await serviceFormPage.fill({ name, upstreamUrl: 'https://httpbin.org' });
    await serviceFormPage.submit();
    await serviceFormPage.expectSuccessToast();

    // Navigate back and attempt a second one with same name
    await servicesListPage.navigate();
    await servicesListPage.clickDefaultWorkspace();
    await servicesListPage.clickSidebarItem('Gateway Services');
    await servicesListPage.clickNewService();
    await serviceFormPage.fill({ name, upstreamUrl: 'https://httpbin.org' });
    await serviceFormPage.submit();

    // Expect error (either toast or inline field error)
    await Promise.race([
      serviceFormPage.expectErrorToast(),
      serviceFormPage.expectNameError(),
    ]);

    // Cleanup the first successful one
    const svc = await kongApi.getService(name);
    if (svc) trackService(svc.id);
  });

  // ── Visibility in list ────────────────────────────────────────────

  test('newly created service appears in the services list', async ({
    servicesListPage,
    serviceFormPage,
    kongApi,
  }) => {
    const data = TestData.service({ name: `svc-list-${uniqueSuffix()}` });

    await servicesListPage.navigate();
    await servicesListPage.clickDefaultWorkspace();
    await servicesListPage.clickNewService();
    await serviceFormPage.fillAndSubmit(data);
    await serviceFormPage.expectSuccessToast();

    // Go back to list
    await servicesListPage.navigate();
    await servicesListPage.clickDefaultWorkspace();
    await servicesListPage.clickSidebarItem('Gateway Services');
    await servicesListPage.expectServiceVisible(data.name);

    const svc = await kongApi.getService(data.name);
    if (svc) trackService(svc.id);
  });
});