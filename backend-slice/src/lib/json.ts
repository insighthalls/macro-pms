// Plain JSON serialiser that handles BigInt (used everywhere amounts exist).
import type { Response } from 'express';

export function ok(res: Response, body: unknown, status = 200): void {
  res.status(status).type('application/json').send(stringify(body));
}

export function stringify(v: unknown): string {
  return JSON.stringify(v, (_key, val) => (typeof val === 'bigint' ? val.toString() : val));
}
