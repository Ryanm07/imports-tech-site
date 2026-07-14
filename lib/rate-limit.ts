export type D1PreparedLike = {
  bind(...values: unknown[]): D1PreparedLike;
  first<T = unknown>(): Promise<T | null>;
  run(): Promise<unknown>;
};

export type D1DatabaseLike = {
  prepare(query: string): D1PreparedLike;
};

export const RATE_LIMITS = {
  topic: { max: 3, windowMinutes: 60 },
  reply: { max: 12, windowMinutes: 60 },
  report: { max: 10, windowMinutes: 60 },
  admin: { max: 60, windowMinutes: 10 },
  youtubeSync: { max: 6, windowMinutes: 60 },
} as const;

export type RateLimitAction = keyof typeof RATE_LIMITS;
export type RateLimitResult =
  | { allowed: true; remaining: number }
  | { allowed: false; reason: "limited" | "unavailable" };

type RateLimitOptions = {
  db?: D1DatabaseLike;
  now?: Date;
  // Explicit injection for isolated tests and migrations only. Production
  // callers pass a pre-hashed identity and never receive a fallback salt.
  salt?: string;
};

export async function consumeRateLimit(
  identity: string,
  action: RateLimitAction,
  options: RateLimitOptions = {},
): Promise<RateLimitResult> {
  const policy = RATE_LIMITS[action];
  const now = options.now ?? new Date();
  const windowMs = policy.windowMinutes * 60_000;
  const bucketStart = Math.floor(now.getTime() / windowMs) * windowMs;
  const expiresAt = new Date(bucketStart + windowMs);
  // `identity` is already an irreversible hash created with RATE_LIMIT_SALT.
  // Hashing it again is unnecessary and previously encouraged unsafe fallback salts.
  const identityHash = options.salt
    ? await hashIdentityForTest(identity, options.salt)
    : identity;
  if (!/^[a-f0-9]{64}$/u.test(identityHash)) {
    return { allowed: false, reason: "unavailable" };
  }
  const key = `${action}:${identityHash}:${bucketStart}`;

  try {
    const db = options.db ?? (await import("@/db")).getD1();
    await db
      .prepare("DELETE FROM rate_limits WHERE expires_at <= ?")
      .bind(now.toISOString())
      .run();

    const row = await db
      .prepare(
        `INSERT INTO rate_limits
          (key, action, count, window_start, expires_at, updated_at)
         VALUES (?, ?, 1, ?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET
           count = rate_limits.count + 1,
           updated_at = excluded.updated_at
         WHERE rate_limits.count < ?
           AND rate_limits.expires_at > excluded.updated_at
         RETURNING count`,
      )
      .bind(
        key,
        action,
        new Date(bucketStart).toISOString(),
        expiresAt.toISOString(),
        now.toISOString(),
        policy.max,
      )
      .first<{ count: number }>();

    if (!row) return { allowed: false, reason: "limited" };
    return { allowed: true, remaining: Math.max(policy.max - row.count, 0) };
  } catch {
    return { allowed: false, reason: "unavailable" };
  }
}

async function hashIdentityForTest(identity: string, salt: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${salt}:${identity.trim().toLowerCase()}`),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}
