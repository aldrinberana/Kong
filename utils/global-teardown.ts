import { request } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

interface TrackedEntities {
  services: string[];   // service IDs or names
  routes: string[];     // route IDs or names
}

/**
 * Global Teardown — runs once after the entire test suite.
 *
 * Reads the entity tracking file written by tests and deletes every entity
 * via the Kong Admin API (routes first, then services to avoid FK errors).
 */
async function globalTeardown(): Promise<void> {
  const adminUrl = process.env.KONG_ADMIN_URL ?? 'http://localhost:8001';
  const trackFile = path.resolve(__dirname, '..', 'test-results', 'created-entities.json');

  console.log('\n🧹 Kong Manager Playwright Suite — Global Teardown / Cleanup');

  if (!fs.existsSync(trackFile)) {
    console.log('   No entity tracking file found — nothing to clean up.\n');
    return;
  }

  const entities: TrackedEntities = JSON.parse(fs.readFileSync(trackFile, 'utf-8'));

  const apiContext = await request.newContext({
    baseURL: adminUrl,
    extraHTTPHeaders: process.env.KONG_ADMIN_TOKEN
      ? { 'Kong-Admin-Token': process.env.KONG_ADMIN_TOKEN }
      : {},
  });

  // ── Delete routes first (children before parents) ─────────────────
  for (const routeId of entities.routes) {
    try {
      const res = await apiContext.delete(`/routes/${routeId}`);
      console.log(`   🗑  Route  ${routeId} → ${res.status()}`);
    } catch (err) {
      console.warn(`   ⚠️  Failed to delete route ${routeId}: ${(err as Error).message}`);
    }
  }

  // ── Delete services ───────────────────────────────────────────────
  for (const serviceId of entities.services) {
    try {
      const res = await apiContext.delete(`/services/${serviceId}`);
      console.log(`   🗑  Service ${serviceId} → ${res.status()}`);
    } catch (err) {
      console.warn(`   ⚠️  Failed to delete service ${serviceId}: ${(err as Error).message}`);
    }
  }

  await apiContext.dispose();

  // ── Remove tracking file ──────────────────────────────────────────
  fs.unlinkSync(trackFile);
  console.log('\n✅ Cleanup complete.\n');
}

export default globalTeardown;