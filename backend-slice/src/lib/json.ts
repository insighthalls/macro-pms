// Plain JSON serialiser that handles BigInt (used everywhere amounts exist).

/** Pass-through helper — lets callers write res.json(ok(data)) for clarity. */
export function ok<T>(body: T): T { return body; }

export function stringify(v: unknown): string {
  return JSON.stringify(v, (_key, val) => (typeof val === 'bigint' ? val.toString() : val));
}
