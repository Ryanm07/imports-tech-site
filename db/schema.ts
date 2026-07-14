import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const profiles = sqliteTable(
  "profiles",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    displayName: text("display_name").notNull(),
    role: text("role", { enum: ["user", "moderator", "admin"] })
      .notNull()
      .default("user"),
    status: text("status", {
      enum: ["active", "blocked", "banned", "deleted"],
    })
      .notNull()
      .default("active"),
    blockType: text("block_type", { enum: ["temporary", "permanent"] }),
    blockedUntil: text("blocked_until"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    deletedAt: text("deleted_at"),
  },
  (table) => [
    uniqueIndex("profiles_email_unique").on(table.email),
    index("profiles_role_status_idx").on(table.role, table.status),
  ],
);

// Legacy community identities are retained for migration safety only. New
// visitor posts never create profile rows; only the private owner surface uses
// the dedicated table below.
export const ownerAccounts = sqliteTable(
  "owner_accounts",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    displayName: text("display_name").notNull(),
    protected: integer("protected", { mode: "boolean" })
      .notNull()
      .default(true),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [uniqueIndex("owner_accounts_email_unique").on(table.email)],
);

export const wallCategories = sqliteTable(
  "wall_categories",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    status: text("status", { enum: ["active", "archived"] })
      .notNull()
      .default("active"),
    position: integer("position").notNull().default(0),
    createdByOwnerId: text("created_by_owner_id").references(
      () => ownerAccounts.id,
      { onDelete: "set null" },
    ),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("wall_categories_name_unique").on(table.name),
    index("wall_categories_status_position_idx").on(
      table.status,
      table.position,
    ),
  ],
);

export const wallTopics = sqliteTable(
  "wall_topics",
  {
    id: text("id").primaryKey(),
    categoryId: text("category_id")
      .notNull()
      .references(() => wallCategories.id, { onDelete: "restrict" }),
    displayName: text("display_name").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    status: text("status", {
      enum: ["pending", "published", "hidden", "removed", "spam"],
    })
      .notNull()
      .default("published"),
    isOfficial: integer("is_official", { mode: "boolean" })
      .notNull()
      .default(false),
    identityHash: text("identity_hash"),
    contentHash: text("content_hash").notNull(),
    replyCount: integer("reply_count").notNull().default(0),
    closedAt: text("closed_at"),
    pinnedAt: text("pinned_at"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    deletedAt: text("deleted_at"),
  },
  (table) => [
    index("wall_topics_status_pinned_created_idx").on(
      table.status,
      table.pinnedAt,
      table.createdAt,
    ),
    index("wall_topics_category_status_idx").on(table.categoryId, table.status),
    index("wall_topics_identity_created_idx").on(
      table.identityHash,
      table.createdAt,
    ),
    index("wall_topics_content_hash_idx").on(
      table.contentHash,
      table.createdAt,
    ),
  ],
);

export const wallReplies = sqliteTable(
  "wall_replies",
  {
    id: text("id").primaryKey(),
    topicId: text("topic_id")
      .notNull()
      .references(() => wallTopics.id, { onDelete: "cascade" }),
    displayName: text("display_name").notNull(),
    body: text("body").notNull(),
    status: text("status", {
      enum: ["pending", "published", "hidden", "removed", "spam"],
    })
      .notNull()
      .default("published"),
    isOfficial: integer("is_official", { mode: "boolean" })
      .notNull()
      .default(false),
    identityHash: text("identity_hash"),
    contentHash: text("content_hash").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    deletedAt: text("deleted_at"),
  },
  (table) => [
    index("wall_replies_topic_status_created_idx").on(
      table.topicId,
      table.status,
      table.createdAt,
    ),
    index("wall_replies_identity_created_idx").on(
      table.identityHash,
      table.createdAt,
    ),
    index("wall_replies_content_hash_idx").on(
      table.contentHash,
      table.createdAt,
    ),
  ],
);

export const wallReports = sqliteTable(
  "wall_reports",
  {
    id: text("id").primaryKey(),
    reporterHash: text("reporter_hash").notNull(),
    targetType: text("target_type", { enum: ["topic", "reply"] }).notNull(),
    targetId: text("target_id").notNull(),
    reason: text("reason").notNull(),
    status: text("status", {
      enum: ["open", "reviewing", "resolved", "dismissed"],
    })
      .notNull()
      .default("open"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    resolvedAt: text("resolved_at"),
    resolvedByOwnerId: text("resolved_by_owner_id").references(
      () => ownerAccounts.id,
      { onDelete: "set null" },
    ),
  },
  (table) => [
    index("wall_reports_status_created_idx").on(table.status, table.createdAt),
    index("wall_reports_target_idx").on(table.targetType, table.targetId),
    uniqueIndex("wall_reports_open_identity_target_unique")
      .on(table.reporterHash, table.targetType, table.targetId)
      .where(sql`${table.status} in ('open', 'reviewing')`),
  ],
);

export const wallBlocks = sqliteTable(
  "wall_blocks",
  {
    id: text("id").primaryKey(),
    identityHash: text("identity_hash").notNull(),
    reason: text("reason").notNull(),
    expiresAt: text("expires_at").notNull(),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    createdByOwnerId: text("created_by_owner_id").references(
      () => ownerAccounts.id,
      { onDelete: "set null" },
    ),
    createdAt: text("created_at").notNull(),
    liftedAt: text("lifted_at"),
  },
  (table) => [
    index("wall_blocks_identity_active_expires_idx").on(
      table.identityHash,
      table.active,
      table.expiresAt,
    ),
  ],
);

export const communityTopics = sqliteTable(
  "community_topics",
  {
    id: text("id").primaryKey(),
    category: text("category").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    authorId: text("author_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "restrict" }),
    status: text("status", {
      enum: ["pending", "published", "hidden", "removed"],
    })
      .notNull()
      .default("published"),
    replyCount: integer("reply_count").notNull().default(0),
    likeCount: integer("like_count").notNull().default(0),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    deletedAt: text("deleted_at"),
  },
  (table) => [
    index("topics_category_idx").on(table.category),
    index("topics_status_created_idx").on(table.status, table.createdAt),
    index("topics_author_idx").on(table.authorId, table.createdAt),
  ],
);

export const communityReplies = sqliteTable(
  "community_replies",
  {
    id: text("id").primaryKey(),
    topicId: text("topic_id")
      .notNull()
      .references(() => communityTopics.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    authorId: text("author_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "restrict" }),
    status: text("status", {
      enum: ["pending", "published", "hidden", "removed"],
    })
      .notNull()
      .default("published"),
    likeCount: integer("like_count").notNull().default(0),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    deletedAt: text("deleted_at"),
  },
  (table) => [
    index("replies_topic_status_created_idx").on(
      table.topicId,
      table.status,
      table.createdAt,
    ),
    index("replies_author_idx").on(table.authorId, table.createdAt),
  ],
);

export const communityReports = sqliteTable(
  "community_reports",
  {
    id: text("id").primaryKey(),
    reporterId: text("reporter_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "restrict" }),
    targetType: text("target_type", { enum: ["topic", "reply"] }).notNull(),
    targetId: text("target_id").notNull(),
    reason: text("reason").notNull(),
    status: text("status", {
      enum: ["open", "reviewing", "resolved", "dismissed"],
    })
      .notNull()
      .default("open"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    resolvedAt: text("resolved_at"),
    resolvedById: text("resolved_by_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    index("reports_status_created_idx").on(table.status, table.createdAt),
    index("reports_target_idx").on(table.targetType, table.targetId),
    uniqueIndex("reports_open_reporter_target_unique")
      .on(table.reporterId, table.targetType, table.targetId)
      .where(sql`${table.status} in ('open', 'reviewing')`),
  ],
);

export const moderationActions = sqliteTable(
  "moderation_actions",
  {
    id: text("id").primaryKey(),
    actorId: text("actor_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    actorRole: text("actor_role", {
      enum: ["moderator", "admin", "system"],
    }).notNull(),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    reason: text("reason"),
    metadata: text("metadata"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("moderation_target_idx").on(table.targetType, table.targetId),
    index("moderation_actor_created_idx").on(table.actorId, table.createdAt),
    index("moderation_created_idx").on(table.createdAt),
  ],
);

export const ownerActions = sqliteTable(
  "owner_actions",
  {
    id: text("id").primaryKey(),
    actorOwnerId: text("actor_owner_id").references(() => ownerAccounts.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    reason: text("reason"),
    metadata: text("metadata"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("owner_actions_target_idx").on(table.targetType, table.targetId),
    index("owner_actions_created_idx").on(table.createdAt),
  ],
);

export const contentEntries = sqliteTable(
  "content_entries",
  {
    id: text("id").primaryKey(),
    type: text("type", {
      enum: ["review", "find", "video", "category", "setting", "timeline"],
    }).notNull(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    payload: text("payload").notNull(),
    status: text("status", {
      enum: ["draft", "published", "archived", "removed"],
    })
      .notNull()
      .default("draft"),
    featured: integer("featured", { mode: "boolean" }).notNull().default(false),
    createdById: text("created_by_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    updatedById: text("updated_by_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    publishedAt: text("published_at"),
    deletedAt: text("deleted_at"),
  },
  (table) => [
    uniqueIndex("content_type_slug_unique").on(table.type, table.slug),
    index("content_status_type_updated_idx").on(
      table.status,
      table.type,
      table.updatedAt,
    ),
    index("content_featured_idx").on(table.featured, table.status),
  ],
);

export const rateLimits = sqliteTable(
  "rate_limits",
  {
    key: text("key").primaryKey(),
    action: text("action").notNull(),
    count: integer("count").notNull().default(0),
    windowStart: text("window_start").notNull(),
    expiresAt: text("expires_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [index("rate_limits_expires_idx").on(table.expiresAt)],
);

export const youtubeSnapshots = sqliteTable("youtube_snapshots", {
  channelId: text("channel_id").primaryKey(),
  payload: text("payload").notNull(),
  source: text("source", { enum: ["youtube-api", "youtube-feed"] }).notNull(),
  lastSuccessfulSyncAt: text("last_successful_sync_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const youtubeChannelState = sqliteTable("youtube_channel_state", {
  channelId: text("channel_id").primaryKey(),
  channelName: text("channel_name"),
  handle: text("handle"),
  description: text("description"),
  uploadsPlaylistId: text("uploads_playlist_id"),
  subscribers: integer("subscribers"),
  totalViews: integer("total_views"),
  videoCount: integer("video_count"),
  metricsSource: text("metrics_source", {
    enum: ["youtube-api", "snapshot", "unavailable"],
  })
    .notNull()
    .default("unavailable"),
  metricsUpdatedAt: text("metrics_updated_at"),
  metricsStale: integer("metrics_stale", { mode: "boolean" })
    .notNull()
    .default(true),
  catalogSource: text("catalog_source", {
    enum: ["youtube-api", "youtube-feed", "snapshot", "unavailable"],
  })
    .notNull()
    .default("unavailable"),
  catalogUpdatedAt: text("catalog_updated_at"),
  catalogPartial: integer("catalog_partial", { mode: "boolean" })
    .notNull()
    .default(true),
  catalogStale: integer("catalog_stale", { mode: "boolean" })
    .notNull()
    .default(true),
  indexedVideoCount: integer("indexed_video_count").notNull().default(0),
  syncStatus: text("sync_status", {
    enum: ["idle", "running", "failed"],
  })
    .notNull()
    .default("idle"),
  lastAttemptAt: text("last_attempt_at"),
  lastSuccessAt: text("last_success_at"),
  lastFullSyncAt: text("last_full_sync_at"),
  lastError: text("last_error"),
  lockExpiresAt: text("lock_expires_at"),
  updatedAt: text("updated_at").notNull(),
});

export const youtubeVideos = sqliteTable(
  "youtube_videos",
  {
    id: text("id").primaryKey(),
    position: integer("position").notNull().default(0),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    publishedAt: text("published_at").notNull().default(""),
    duration: text("duration").notNull().default(""),
    thumbnail: text("thumbnail").notNull().default(""),
    views: integer("views").notNull().default(0),
    likes: integer("likes"),
    comments: integer("comments"),
    availability: text("availability", {
      enum: ["public", "unavailable"],
    })
      .notNull()
      .default("public"),
    category: text("category"),
    tags: text("tags"),
    summary: text("summary"),
    featured: integer("featured", { mode: "boolean" }).notNull().default(false),
    relatedReviewSlug: text("related_review_slug"),
    relatedFindSlug: text("related_find_slug"),
    editorialUpdatedAt: text("editorial_updated_at"),
    syncedAt: text("synced_at").notNull(),
  },
  (table) => [
    index("youtube_videos_availability_position_idx").on(
      table.availability,
      table.position,
    ),
    index("youtube_videos_featured_idx").on(table.featured, table.availability),
  ],
);

export const youtubeSyncRuns = sqliteTable(
  "youtube_sync_runs",
  {
    id: text("id").primaryKey(),
    trigger: text("trigger", { enum: ["cron", "manual"] }).notNull(),
    mode: text("mode", { enum: ["incremental", "full"] }).notNull(),
    status: text("status", {
      enum: ["running", "succeeded", "failed", "skipped"],
    }).notNull(),
    startedAt: text("started_at").notNull(),
    completedAt: text("completed_at"),
    videosFound: integer("videos_found").notNull().default(0),
    videosIndexed: integer("videos_indexed").notNull().default(0),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
  },
  (table) => [index("youtube_sync_runs_started_idx").on(table.startedAt)],
);
