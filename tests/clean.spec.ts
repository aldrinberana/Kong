/**
 * @file cleanup.spec.ts
 * @description  @cleanup — run this explicitly to wipe all test entities.
 *
 * Usage:
 *   npx playwright test --grep @cleanup
 *
 * This spec is intentionally separate so it is NOT included in normal CI runs
 * (which use globalTeardown instead). It is useful for manual cleanup when
 * a test run crashed before teardown could execute.
 */

import { test, expect } from '../fixtures/kong.fixtures';
import { cleanupTestEntities } from '../utils/cleanup';

// reuse the shared cleanup logic so tests/fixtures can call it as well

test.describe.skip('@cleanup Manual Entity Cleanup', () => {
  test('deletes all tracked test services and their routes @cleanup', async ({ kongApi }) => {
    await cleanupTestEntities(kongApi, 2000); // wait 2s before cleanup
    // after running the helper, verify there are none left
    const remaining = await kongApi.listServices();
    const stillPresent = remaining.filter(
      (s) => s.name.startsWith('playwright-') || s.name.startsWith('svc-')
    );
    expect(stillPresent).toHaveLength(0);
  });
});