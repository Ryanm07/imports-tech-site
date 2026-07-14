PRAGMA foreign_keys=OFF;
--> statement-breakpoint
CREATE TABLE `profiles_new` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`display_name` text NOT NULL,
	`role` text DEFAULT 'user' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`block_type` text,
	`blocked_until` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
INSERT INTO `profiles_new` (`id`, `email`, `display_name`, `role`, `status`, `block_type`, `blocked_until`, `created_at`, `updated_at`, `deleted_at`)
SELECT
	'p_' || lower(hex(randomblob(16))),
	lower(`email`),
	`display_name`,
	`role`,
	`status`,
	CASE WHEN `status` = 'blocked' AND `blocked_until` IS NULL THEN 'permanent'
		 WHEN `status` = 'blocked' THEN 'temporary'
		 ELSE NULL END,
	`blocked_until`,
	`created_at`,
	`updated_at`,
	NULL
FROM `profiles`;
--> statement-breakpoint
CREATE TABLE `community_topics_new` (
	`id` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`author_id` text NOT NULL,
	`status` text DEFAULT 'published' NOT NULL,
	`reply_count` integer DEFAULT 0 NOT NULL,
	`like_count` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`author_id`) REFERENCES `profiles_new`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
INSERT INTO `community_topics_new`
SELECT t.`id`, t.`category`, t.`title`, t.`body`, p.`id`, t.`status`, t.`reply_count`, t.`like_count`, t.`created_at`, t.`updated_at`, t.`deleted_at`
FROM `community_topics` t
INNER JOIN `profiles_new` p ON p.`email` = lower(t.`author_email`);
--> statement-breakpoint
CREATE TABLE `community_replies_new` (
	`id` text PRIMARY KEY NOT NULL,
	`topic_id` text NOT NULL,
	`body` text NOT NULL,
	`author_id` text NOT NULL,
	`status` text DEFAULT 'published' NOT NULL,
	`like_count` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`topic_id`) REFERENCES `community_topics_new`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `profiles_new`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
INSERT INTO `community_replies_new`
SELECT r.`id`, r.`topic_id`, r.`body`, p.`id`, r.`status`, r.`like_count`, r.`created_at`, r.`updated_at`, r.`deleted_at`
FROM `community_replies` r
INNER JOIN `profiles_new` p ON p.`email` = lower(r.`author_email`);
--> statement-breakpoint
CREATE TABLE `community_reports_new` (
	`id` text PRIMARY KEY NOT NULL,
	`reporter_id` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text NOT NULL,
	`reason` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`resolved_at` text,
	`resolved_by_id` text,
	FOREIGN KEY (`reporter_id`) REFERENCES `profiles_new`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`resolved_by_id`) REFERENCES `profiles_new`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `community_reports_new` (`id`, `reporter_id`, `target_type`, `target_id`, `reason`, `status`, `created_at`, `updated_at`, `resolved_at`, `resolved_by_id`)
SELECT r.`id`, p.`id`, r.`target_type`, r.`target_id`, r.`reason`, r.`status`, r.`created_at`, r.`created_at`, r.`resolved_at`, NULL
FROM `community_reports` r
INNER JOIN `profiles_new` p ON p.`email` = lower(r.`reporter_email`);
--> statement-breakpoint
CREATE TABLE `moderation_actions_new` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text,
	`actor_role` text NOT NULL,
	`action` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text NOT NULL,
	`reason` text,
	`metadata` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`actor_id`) REFERENCES `profiles_new`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `moderation_actions_new`
SELECT a.`id`, p.`id`, CASE WHEN p.`role` IN ('moderator', 'admin') THEN p.`role` ELSE 'system' END, a.`action`, a.`target_type`, a.`target_id`, a.`reason`, a.`metadata`, a.`created_at`
FROM `moderation_actions` a
LEFT JOIN `profiles_new` p ON p.`email` = lower(a.`actor_email`);
--> statement-breakpoint
CREATE TABLE `content_entries_new` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`payload` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`featured` integer DEFAULT false NOT NULL,
	`created_by_id` text,
	`updated_by_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`published_at` text,
	`deleted_at` text,
	FOREIGN KEY (`created_by_id`) REFERENCES `profiles_new`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`updated_by_id`) REFERENCES `profiles_new`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `content_entries_new`
SELECT c.`id`, c.`type`, c.`slug`, c.`title`, c.`payload`, c.`status`, c.`featured`, p.`id`, p.`id`, c.`created_at`, c.`updated_at`, CASE WHEN c.`status` = 'published' THEN c.`updated_at` ELSE NULL END, NULL
FROM `content_entries` c
LEFT JOIN `profiles_new` p ON p.`email` = lower(c.`author_email`);
--> statement-breakpoint
DROP TABLE `community_reports`;
--> statement-breakpoint
DROP TABLE `community_replies`;
--> statement-breakpoint
DROP TABLE `community_topics`;
--> statement-breakpoint
DROP TABLE `moderation_actions`;
--> statement-breakpoint
DROP TABLE `content_entries`;
--> statement-breakpoint
DROP TABLE `rate_limits`;
--> statement-breakpoint
DROP TABLE `profiles`;
--> statement-breakpoint
ALTER TABLE `profiles_new` RENAME TO `profiles`;
--> statement-breakpoint
ALTER TABLE `community_topics_new` RENAME TO `community_topics`;
--> statement-breakpoint
ALTER TABLE `community_replies_new` RENAME TO `community_replies`;
--> statement-breakpoint
ALTER TABLE `community_reports_new` RENAME TO `community_reports`;
--> statement-breakpoint
ALTER TABLE `moderation_actions_new` RENAME TO `moderation_actions`;
--> statement-breakpoint
ALTER TABLE `content_entries_new` RENAME TO `content_entries`;
--> statement-breakpoint
CREATE UNIQUE INDEX `profiles_email_unique` ON `profiles` (`email`);
--> statement-breakpoint
CREATE INDEX `profiles_role_status_idx` ON `profiles` (`role`,`status`);
--> statement-breakpoint
CREATE INDEX `topics_category_idx` ON `community_topics` (`category`);
--> statement-breakpoint
CREATE INDEX `topics_status_created_idx` ON `community_topics` (`status`,`created_at`);
--> statement-breakpoint
CREATE INDEX `topics_author_idx` ON `community_topics` (`author_id`,`created_at`);
--> statement-breakpoint
CREATE INDEX `replies_topic_status_created_idx` ON `community_replies` (`topic_id`,`status`,`created_at`);
--> statement-breakpoint
CREATE INDEX `replies_author_idx` ON `community_replies` (`author_id`,`created_at`);
--> statement-breakpoint
CREATE INDEX `reports_status_created_idx` ON `community_reports` (`status`,`created_at`);
--> statement-breakpoint
CREATE INDEX `reports_target_idx` ON `community_reports` (`target_type`,`target_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `reports_open_reporter_target_unique` ON `community_reports` (`reporter_id`,`target_type`,`target_id`) WHERE `status` in ('open', 'reviewing');
--> statement-breakpoint
CREATE INDEX `moderation_target_idx` ON `moderation_actions` (`target_type`,`target_id`);
--> statement-breakpoint
CREATE INDEX `moderation_actor_created_idx` ON `moderation_actions` (`actor_id`,`created_at`);
--> statement-breakpoint
CREATE INDEX `moderation_created_idx` ON `moderation_actions` (`created_at`);
--> statement-breakpoint
CREATE UNIQUE INDEX `content_type_slug_unique` ON `content_entries` (`type`,`slug`);
--> statement-breakpoint
CREATE INDEX `content_status_type_updated_idx` ON `content_entries` (`status`,`type`,`updated_at`);
--> statement-breakpoint
CREATE INDEX `content_featured_idx` ON `content_entries` (`featured`,`status`);
--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`action` text NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`window_start` text NOT NULL,
	`expires_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `rate_limits_expires_idx` ON `rate_limits` (`expires_at`);
--> statement-breakpoint
CREATE TABLE `youtube_snapshots` (
	`channel_id` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`source` text NOT NULL,
	`last_successful_sync_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
PRAGMA foreign_keys=ON;
