import { request } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

/**
 * Global Setup — runs once before the entire test suite.
 *
 * Responsibilities:
 *  1. Verify Kong Admin API is reachable.
 *  2. Write a list of entity IDs created during tests to a tracking file
 *     so the global teardown can clean them up.
 */
async function globalSetup(): Promise<void> {
  const adminUrl = process.env.KONG_ADMIN_URL ?? 'http://localhost:8001';

  console.log('\n🦍 Kong Manager Playwright Suite — Global Setup');
  console.log(`   Admin API : ${adminUrl}`);
  console.log(`   Manager UI: ${process.env.KONG_MANAGER_URL ?? 'http://localhost:8002'}\n`);

  // ── 1. Health-check ───────────────────────────────────────────────
  const apiContext = await request.newContext({ baseURL: adminUrl });
  try {
    const response = await apiContext.get('/');
    if (!response.ok()) {
      throw new Error(`Kong Admin API returned ${response.status()}`);
    }
    const body = await response.json() as { version: string };
    console.log(`✅ Kong ${body.version} is reachable.\n`);
  } catch (err) {
    throw new Error(
      `❌ Cannot reach Kong Admin API at ${adminUrl}.\n` +
      `   Start Kong and retry. Details: ${(err as Error).message}`
    );
  } finally {
    await apiContext.dispose();
  }

  // ── 2. Ensure results dir and tracking file exist ─────────────────
  const resultsDir = path.resolve(__dirname, '..', 'test-results');
  if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

  const trackFile = path.resolve(resultsDir, 'created-entities.json');
  fs.writeFileSync(trackFile, JSON.stringify({ services: [], routes: [] }, null, 2));
  console.log(`📝 Entity tracking file initialised at ${trackFile}\n`);
}

export default globalSetup;