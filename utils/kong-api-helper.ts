import { APIRequestContext } from '@playwright/test';

export interface ServicePayload {
  name: string;
  url: string;
  retries?: number;
  connect_timeout?: number;
  read_timeout?: number;
  write_timeout?: number;
}

export interface RoutePayload {
  name: string;
  paths: string[];
  methods?: string[];
  strip_path?: boolean;
  preserve_host?: boolean;
}

export interface KongService {
  id: string;
  name: string;
  [key: string]: unknown;
}

export interface KongRoute {
  id: string;
  name: string;
  [key: string]: unknown;
}

/**
 * Thin wrapper around the Kong Admin API for programmatic assertions
 * and cleanup — used alongside the UI-driven Page Objects.
 */
export class KongApiHelper {
  constructor(private readonly api: APIRequestContext) {}

  // ── Services ──────────────────────────────────────────────────────

  async getService(nameOrId: string): Promise<KongService | null> {
    const res = await this.api.get(`/services/${nameOrId}`);
    if (res.status() === 404) return null;
    return (await res.json()) as KongService;
  }

  async deleteService(nameOrId: string): Promise<void> {
    await this.api.delete(`/services/${nameOrId}`);
  }

  async listServices(): Promise<KongService[]> {
    const res = await this.api.get('/services?size=100');
    const body = await res.json() as { data: KongService[] };
    return body.data;
  }

  // ── Routes ────────────────────────────────────────────────────────

  async getRoute(nameOrId: string): Promise<KongRoute | null> {
    const res = await this.api.get(`/routes/${nameOrId}`);
    if (res.status() === 404) return null;
    return (await res.json()) as KongRoute;
  }

  async deleteRoute(nameOrId: string): Promise<void> {
    await this.api.delete(`/routes/${nameOrId}`);
  }

  async listRoutesForService(serviceNameOrId: string): Promise<KongRoute[]> {
    const res = await this.api.get(`/services/${serviceNameOrId}/routes?size=100`);
    const body = await res.json() as { data: KongRoute[] };
    return body.data;
  }
}