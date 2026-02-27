import type { ServiceFormData } from '../pages/ServiceFormPage';
import type { RouteFormData } from '../pages/RouteFormPage';

/**
 * Unique suffix based on timestamp — keeps parallel test runs isolated.
 */
export function uniqueSuffix(): string {
  return Date.now().toString(36);
}

/**
 * Factory functions for test data objects.
 * Using factories (vs static constants) means every test gets a fresh name,
 * preventing false failures from leftover state.
 */
export const TestData = {
  service: (overrides: Partial<ServiceFormData> = {}): ServiceFormData => ({
    name: process.env.TEST_SERVICE_NAME ?? `playwright-svc-${uniqueSuffix()}`,
    upstreamUrl: 'https://httpbin.org',
    retries: 5,
    connectTimeout: 60000,
    readTimeout: 60000,
    writeTimeout: 60000,
    tags: ['playwright', 'e2e'],
    ...overrides,
  }),

  route: (overrides: Partial<RouteFormData> = {}): RouteFormData => ({
    name: process.env.TEST_ROUTE_NAME ?? `playwright-route-${uniqueSuffix()}`,
    paths: ['/api/v1/test'],
    stripPath: true,
    preserveHost: false,
    tags: ['playwright', 'e2e'],
    ...overrides,
  }),
};