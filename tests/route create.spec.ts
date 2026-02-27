/**
 * @file route-create.spec.ts
 * @description E2E tests for creating a Route under a Gateway Service.
 *
 * Test cases:
 *  ✅ Create a route under a pre-existing service (full UI flow)
 *  ✅ Route is retrievable via Admin API after creation
 *  ✅ Route appears in the service detail Routes tab
 */

import { test, expect } from '../fixtures/kong.fixtures';
import { TestData, uniqueSuffix } from '../fixtures/test-data';
import { trackService, trackRoute } from '../utils/entity-tracker';

test.describe.serial('Route — Create', () => {

  // ── Full UI flow: service + route ──

  test('creates a route via the service detail', async ({
    servicesListPage,
    serviceFormPage,
    serviceDetailPage,
    routeFormPage,
    kongApi,
  }) => {
    // Step 1 — create a service
    const svcData = TestData.service({ name: `svc-rt-${uniqueSuffix()}` });
    await servicesListPage.navigate();
    await servicesListPage.clickDefaultWorkspace();
    await servicesListPage.clickNewService();
    await serviceFormPage.fillAndSubmit(svcData);
    await serviceFormPage.expectSuccessToast();
    await serviceDetailPage.waitForDetail();

    // Track service
    const svc = await kongApi.getService(svcData.name);
    expect(svc).not.toBeNull();
    trackService(svc!.id);

    // Step 2 — add a route from the service detail page
    const routeData = TestData.route({ name: `rt-${uniqueSuffix()}`, paths: ['/e2e/test'] });
    await serviceDetailPage.clickAddRoute();

    // Step 3 — fill and submit route form
    await routeFormPage.fillAndSubmit(routeData);

    await routeFormPage.expectSuccessToast();

    // Step 4 — route appears in service detail
    await servicesListPage.clickSidebarItem('Routes');
    await serviceDetailPage.expectRouteVisible(routeData.name);

    // Step 5 — cross-check via Admin API
    const route = await kongApi.getRoute(routeData.name);
    expect(route).not.toBeNull();
    expect(route!.name).toBe(routeData.name);
    trackRoute(route!.id);
  });

  // ── Route with multiple paths and methods ─────────────────────────

  test('creates a route with multiple paths and HTTP methods', async ({
    servicesListPage,
    serviceFormPage,
    serviceDetailPage,
    routeFormPage,
    kongApi,
  }) => {
    const svcData = TestData.service({ name: `svc-multi-rt-${uniqueSuffix()}` });
    await servicesListPage.navigate();
    await servicesListPage.clickDefaultWorkspace();
    await servicesListPage.clickNewService();
    await serviceFormPage.fillAndSubmit(svcData);
    await serviceFormPage.expectSuccessToast();
    await serviceDetailPage.waitForDetail();


    const svc = await kongApi.getService(svcData.name);
    if (svc) trackService(svc.id);

    const routeData = TestData.route({
      name: `rt-multi-${uniqueSuffix()}`,
      paths: ['/v1/resource', '/v2/resource'],
      stripPath: true,
    });
    await serviceDetailPage.clickAddRoute();
    await routeFormPage.fillAndSubmit(routeData);
        
    await routeFormPage.expectSuccessToast();
    await serviceDetailPage.clickAddRoute();

    // Add a second route to test multiple routes under one service
    const routeData2 = TestData.route({
      name: `rt-multi2-${uniqueSuffix()}`
    });
    await routeFormPage.fill(routeData2);
    await routeFormPage.selectFromMultiselect('GET');
    await routeFormPage.submit();
    await routeFormPage.expectSuccessToast();

    // Verify both routes appear in the service detail
    const route = await kongApi.getRoute(routeData.name);
    expect(route).not.toBeNull();
    if (route) trackRoute(route.id);
    const route2 = await kongApi.getRoute(routeData2.name);
    expect(route2).not.toBeNull();
    if (route2) trackRoute(route2.id);
  });
});