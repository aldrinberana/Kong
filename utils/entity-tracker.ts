import * as fs from 'fs';
import * as path from 'path';

const TRACK_FILE = path.resolve(__dirname, '..', 'test-results', 'created-entities.json');

interface TrackedEntities {
  services: string[];
  routes: string[];
}

function read(): TrackedEntities {
  if (!fs.existsSync(TRACK_FILE)) return { services: [], routes: [] };
  return JSON.parse(fs.readFileSync(TRACK_FILE, 'utf-8')) as TrackedEntities;
}

function write(data: TrackedEntities): void {
  fs.writeFileSync(TRACK_FILE, JSON.stringify(data, null, 2));
}

export function trackService(id: string): void {
  const data = read();
  if (!data.services.includes(id)) data.services.push(id);
  write(data);
}

export function trackRoute(id: string): void {
  const data = read();
  if (!data.routes.includes(id)) data.routes.push(id);
  write(data);
}

export function getTracked(): TrackedEntities {
  return read();
}