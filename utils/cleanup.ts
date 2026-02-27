import { KongApiHelper } from './kong-api-helper';

/**
 * Deletes any services and routes with names matching the test prefixes.
 * Used by the manual cleanup spec and by fixtures' afterEach hook.
 */
import * as fs from 'fs';
import * as path from 'path';

export async function cleanupTestEntities(kongApi: KongApiHelper, timeoutMs: number = 1000): Promise<void> {
  // Wait before cleanup to allow Kong to process any pending deletions
  if (timeoutMs > 0) {
    await new Promise(resolve => setTimeout(resolve, timeoutMs));
  }

  // List all services whose name starts with the usual test prefixes
  const services = await kongApi.listServices();
  const testServices = services.filter(
    (s) =>
      s.name.startsWith('playwright-') ||
      s.name.startsWith('svc-') ||
      s.name.startsWith('rt-')
  );

  console.log(`\n🧹 Found ${testServices.length} test service(s) to clean up.`);

  for (const svc of testServices) {
    // Delete routes first
    const routes = await kongApi.listRoutesForService(svc.id);
    for (const route of routes) {
      await kongApi.deleteRoute(route.id);
      console.log(`   🗑  Route  ${route.name} (${route.id})`);
    }
    await kongApi.deleteService(svc.id);
    console.log(`   🗑  Service ${svc.name} (${svc.id})`);
  }

  // verify nothing left
  const remaining = await kongApi.listServices();
  const stillPresent = remaining.filter(
    (s) =>
      s.name.startsWith('playwright-') ||
      s.name.startsWith('svc-')
  );
  if (stillPresent.length === 0) {
    console.log('\n✅ Cleanup complete.\n');
  } else {
    console.warn(`\n⚠️  ${stillPresent.length} test services still present`);
  }

  // clear tracking file so later global teardown does nothing
  const trackFile = path.resolve(__dirname, '..', 'test-results', 'created-entities.json');
  if (fs.existsSync(trackFile)) {
    fs.writeFileSync(trackFile, JSON.stringify({ services: [], routes: [] }, null, 2));
  }
}
