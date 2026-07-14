import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const profiles = sqliteTable("profiles", {
  email: text("email").primaryKey(),
  displayName: text("display_name").notNull(),
  role: text("role", { enum: ["user", "moderator", "admin"] }).notNull().default("user"),
  status: text("status", { enum: ["active", "blocked", "banned"] }).notNull().default("active"),
  blockedUntil: text("blocked_until"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const communityTopics = sqliteTable("community_topics", {
  id: text("id").primaryKey(),
  category: text("category").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  authorEmail: text("author_email").notNull().references(() => profiles.email),
  status: text("status", { enum: ["pending", "published", "hidden", "removed"] }).notNull().default("published"),
  replyCount: integer("reply_count").notNull().default(0),
  likeCount: integer("like_count").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  deletedAt: text("deleted_at"),
}, (table) => [index("topics_category_idx").on(table.category), index("topics_status_created_idx").on(table.status, table.createdAt), index("topics_author_idx").on(table.authorEmail)]);

export const communityReplies = sqliteTable("community_replies", {
  id: text("id").primaryKey(),
  topicId: text("topic_id").notNull().references(() => communityTopics.id),
  body: text("body").notNull(),
  authorEmail: text("author_email").notNull().references(() => profiles.email),
  status: text("status", { enum: ["pending", "published", "hidden", "removed"] }).notNull().default("published"),
  likeCount: integer("like_count").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  deletedAt: text("deleted_at"),
}, (table) => [index("replies_topic_idx").on(table.topicId, table.createdAt), index("replies_author_idx").on(table.authorEmail)]);

export const communityReports = sqliteTable("community_reports", {
  id: text("id").primaryKey(),
  reporterEmail: text("reporter_email").notNull().references(() => profiles.email),
  targetType: text("target_type", { enum: ["topic", "reply"] }).notNull(),
  targetId: text("target_id").notNull(),
  reason: text("reason").notNull(),
  status: text("status", { enum: ["open", "reviewing", "resolved", "dismissed"] }).notNull().default("open"),
  createdAt: text("created_at").notNull(),
  resolvedAt: text("resolved_at"),
}, (table) => [index("reports_status_idx").on(table.status, table.createdAt)]);

export const moderationActions = sqliteTable("moderation_actions", {
  id: text("id").primaryKey(),
  actorEmail: text("actor_email").notNull(),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  reason: text("reason"),
  metadata: text("metadata"),
  createdAt: text("created_at").notNull(),
}, (table) => [index("moderation_target_idx").on(table.targetType, table.targetId), index("moderation_created_idx").on(table.createdAt)]);

export const contentEntries = sqliteTable("content_entries", {
  id: text("id").primaryKey(),
  type: text("type", { enum: ["review", "find", "video", "category", "setting"] }).notNull(),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  payload: text("payload").notNull(),
  status: text("status", { enum: ["draft", "published", "archived"] }).notNull().default("draft"),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  authorEmail: text("author_email").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [uniqueIndex("content_type_slug_unique").on(table.type, table.slug), index("content_status_idx").on(table.status, table.type)]);

export const rateLimits = sqliteTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(0),
  windowStart: text("window_start").notNull(),
  updatedAt: text("updated_at").notNull(),
});
