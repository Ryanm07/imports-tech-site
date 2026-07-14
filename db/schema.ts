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

export const contentEntries = sqliteTable(
  "content_entries",
  {
    id: text("id").primaryKey(),
    type: text("type", {
      enum: ["review", "find", "video", "category", "setting"],
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
