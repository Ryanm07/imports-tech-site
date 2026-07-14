const MIN_RATE_LIMIT_SALT_LENGTH = 24;
const DEFAULT_MAX_BODY_BYTES = 12_000;

export type VisitorIdentityResult =
  | { ok: true; hash: string }
  | { ok: false; reason: "missing-origin" | "missing-salt" };

export type TurnstileResult =
  | { ok: true }
  | { ok: false; reason: "invalid" | "unavailable" };

export async function getVisitorIdentity(
  request: Request,
  options: { salt?: string; address?: string } = {},
): Promise<VisitorIdentityResult> {
  const salt = options.salt ?? process.env.RATE_LIMIT_SALT;
  if (!salt || salt.length < MIN_RATE_LIMIT_SALT_LENGTH) {
    return { ok: false, reason: "missing-salt" };
  }

  // Cloudflare writes this header at the edge. X-Forwarded-For is intentionally
  // ignored because a visitor can forge it before the request reaches the app.
  const address =
    options.address ?? request.headers.get("cf-connecting-ip")?.trim();
  if (!address) return { ok: false, reason: "missing-origin" };

  const bytes = new TextEncoder().encode(`${salt}:${address.toLowerCase()}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hash = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  return { ok: true, hash };
}

export async function verifyTurnstile(
  token: unknown,
  options: { secret?: string; fetcher?: typeof fetch } = {},
): Promise<TurnstileResult> {
  const secret = options.secret ?? process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: false, reason: "unavailable" };
  if (typeof token !== "string" || token.length < 10 || token.length > 2_048) {
    return { ok: false, reason: "invalid" };
  }

  const body = new URLSearchParams({ secret, response: token });
  try {
    const response = await (options.fetcher ?? fetch)(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body,
        signal: AbortSignal.timeout(5_000),
      },
    );
    if (!response.ok) return { ok: false, reason: "unavailable" };
    const result = (await response.json()) as { success?: boolean };
    return result.success ? { ok: true } : { ok: false, reason: "invalid" };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}

export async function parseLimitedJson(
  request: Request,
  maxBytes = DEFAULT_MAX_BODY_BYTES,
): Promise<
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; reason: "invalid" | "too-large" }
> {
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    return { ok: false, reason: "too-large" };
  }
  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > maxBytes) {
      return { ok: false, reason: "too-large" };
    }
    const value = JSON.parse(text) as unknown;
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return { ok: false, reason: "invalid" };
    }
    return { ok: true, value: value as Record<string, unknown> };
  } catch {
    return { ok: false, reason: "invalid" };
  }
}

export function honeypotWasFilled(input: Record<string, unknown>) {
  return typeof input.website === "string" && input.website.trim().length > 0;
}
