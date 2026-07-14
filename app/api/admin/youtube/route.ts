import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { youtubeChannelState, youtubeSyncRuns } from "@/db/schema";
import { privateJson } from "@/lib/http";
import { ownerRateLimitIdentity } from "@/lib/owner-domain";
import { consumeRateLimit } from "@/lib/rate-limit";
import { sameOriginRequest } from "@/lib/security";
import { requireOwnerApi } from "@/lib/server-auth";
import { runYouTubeSync, YOUTUBE_CHANNEL_ID } from "@/lib/youtube-service";

export async function GET() {
  if (process.env.ADMIN_ENABLED !== "true") {
    return privateJson({ error: "Painel desativado." }, { status: 503 });
  }
  const auth = await requireOwnerApi();
  if (auth.kind === "error") return auth.error;
  const db = getDb();
  const [states, runs] = await Promise.all([
    db
      .select()
      .from(youtubeChannelState)
      .where(eq(youtubeChannelState.channelId, YOUTUBE_CHANNEL_ID))
      .limit(1),
    db
      .select()
      .from(youtubeSyncRuns)
      .orderBy(desc(youtubeSyncRuns.startedAt))
      .limit(20),
  ]);
  return privateJson({ state: states[0] ?? null, runs });
}

export async function POST(request: Request) {
  if (process.env.ADMIN_ENABLED !== "true") {
    return privateJson({ error: "Painel desativado." }, { status: 503 });
  }
  if (!sameOriginRequest(request)) {
    return privateJson({ error: "Origem inválida." }, { status: 403 });
  }
  const auth = await requireOwnerApi();
  if (auth.kind === "error") return auth.error;
  const limit = await consumeRateLimit(
    await ownerRateLimitIdentity(auth.owner.id),
    "youtubeSync",
  );
  if (!limit.allowed) {
    return privateJson(
      {
        error:
          limit.reason === "unavailable"
            ? "Sincronização temporariamente indisponível."
            : "Limite de sincronizações manuais atingido.",
      },
      { status: limit.reason === "unavailable" ? 503 : 429 },
    );
  }
  const input = (await request.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  const mode = input.mode === "full" ? "full" : "incremental";
  const result = await runYouTubeSync({ trigger: "manual", mode });
  return privateJson(
    { result },
    {
      status:
        result.status === "failed"
          ? 502
          : result.status === "skipped"
            ? 409
            : 200,
    },
  );
}
