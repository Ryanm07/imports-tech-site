import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { youtubeChannelState, youtubeSyncRuns } from "@/db/schema";
import { privateJson } from "@/lib/http";
import { ownerRateLimitIdentity } from "@/lib/owner-domain";
import { consumeRateLimit } from "@/lib/rate-limit";
import { sameOriginRequest } from "@/lib/security";
import { requireOwnerApi } from "@/lib/server-auth";
import { getTelegramLinks } from "@/lib/telegram";
import {
  runYouTubeMetricsSync,
  YOUTUBE_CHANNEL_ID,
} from "@/lib/youtube-service";

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
  const state = states[0] ?? null;
  const telegram = getTelegramLinks();
  return privateJson({
    state: state
      ? {
          channelId: state.channelId,
          channelName: state.channelName,
          subscribers: state.subscribers,
          totalViews: state.totalViews,
          videoCount: state.videoCount,
          source: state.metricsSource,
          updatedAt: state.metricsUpdatedAt,
          stale: state.metricsStale,
          syncStatus: state.syncStatus,
          lastAttemptAt: state.lastAttemptAt,
          lastSuccessAt: state.lastSuccessAt,
          lastError: state.lastError,
        }
      : null,
    runs: runs.map((run) => ({
      id: run.id,
      trigger: run.trigger,
      status: run.status,
      startedAt: run.startedAt,
      completedAt: run.completedAt,
      errorCode: run.errorCode,
    })),
    configuration: {
      apiConfigured: Boolean(process.env.YOUTUBE_API_KEY),
      channelFound: Boolean(state?.channelName),
      metricsAvailable: Boolean(state?.metricsUpdatedAt),
      snapshotStale: state?.metricsStale ?? true,
      telegramConfigured: Boolean(telegram.channel || telegram.group),
      introAvailable: true,
      d1Connected: true,
      muralEnabled: process.env.COMMUNITY_ENABLED === "true",
      introEnabled: process.env.INTRO_ENABLED === "true",
    },
  });
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
  const result = await runYouTubeMetricsSync({ trigger: "manual" });
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
