import { and, eq, gt } from "drizzle-orm";
import { getDb } from "@/db";
import { wallBlocks } from "@/db/schema";
import { privateJson } from "@/lib/http";
import { consumeRateLimit, type RateLimitAction } from "@/lib/rate-limit";
import { sameOriginRequest } from "@/lib/security";
import {
  getVisitorIdentity,
  honeypotWasFilled,
  parseLimitedJson,
  verifyTurnstile,
} from "@/lib/visitor-security";

type WallMutationResult =
  | {
      ok: true;
      input: Record<string, unknown>;
      identityHash: string;
    }
  | { ok: false; response: Response };

export function wallIsEnabled() {
  return process.env.COMMUNITY_ENABLED === "true";
}

export async function prepareWallMutation(
  request: Request,
  action: Extract<RateLimitAction, "topic" | "reply" | "report">,
): Promise<WallMutationResult> {
  if (!wallIsEnabled()) {
    return {
      ok: false,
      response: privateJson({ error: "Mural em breve." }, { status: 503 }),
    };
  }
  if (!sameOriginRequest(request)) {
    return {
      ok: false,
      response: privateJson({ error: "Origem inválida." }, { status: 403 }),
    };
  }

  const identity = await getVisitorIdentity(request);
  if (!identity.ok) {
    return {
      ok: false,
      response: unavailableResponse(),
    };
  }

  // The attempt is consumed before body, CAPTCHA and content validation so
  // malformed submissions cannot bypass the documented limits.
  const limit = await consumeRateLimit(identity.hash, action);
  if (!limit.allowed) {
    return {
      ok: false,
      response: privateJson(
        {
          error:
            limit.reason === "unavailable"
              ? "Publicação temporariamente indisponível."
              : "Limite temporário atingido. Tente novamente mais tarde.",
        },
        { status: limit.reason === "unavailable" ? 503 : 429 },
      ),
    };
  }

  const parsed = await parseLimitedJson(request);
  if (!parsed.ok) {
    return {
      ok: false,
      response: privateJson(
        {
          error:
            parsed.reason === "too-large"
              ? "A solicitação excede o tamanho permitido."
              : "Solicitação inválida.",
        },
        { status: parsed.reason === "too-large" ? 413 : 400 },
      ),
    };
  }

  if (!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
    return { ok: false, response: unavailableResponse() };
  }
  const turnstile = await verifyTurnstile(parsed.value.turnstileToken);
  if (!turnstile.ok) {
    return {
      ok: false,
      response: privateJson(
        {
          error:
            turnstile.reason === "unavailable"
              ? "Verificação temporariamente indisponível."
              : "Não foi possível confirmar a verificação anti-spam.",
        },
        { status: turnstile.reason === "unavailable" ? 503 : 400 },
      ),
    };
  }
  if (honeypotWasFilled(parsed.value)) {
    return {
      ok: false,
      response: privateJson(
        { error: "Solicitação inválida." },
        { status: 400 },
      ),
    };
  }
  if (await wallIdentityIsBlocked(identity.hash)) {
    return {
      ok: false,
      response: privateJson(
        { error: "Não foi possível publicar esta solicitação." },
        { status: 403 },
      ),
    };
  }

  return { ok: true, input: parsed.value, identityHash: identity.hash };
}

export async function wallIdentityIsBlocked(identityHash: string) {
  const now = new Date().toISOString();
  const blocked = await getDb()
    .select({ id: wallBlocks.id })
    .from(wallBlocks)
    .where(
      and(
        eq(wallBlocks.identityHash, identityHash),
        eq(wallBlocks.active, true),
        gt(wallBlocks.expiresAt, now),
      ),
    )
    .limit(1);
  return Boolean(blocked[0]);
}

function unavailableResponse() {
  return privateJson(
    { error: "Publicação temporariamente indisponível." },
    { status: 503 },
  );
}
