CREATE TABLE `community_replies` (
	`id` text PRIMARY KEY NOT NULL,
	`topic_id` text NOT NULL,
	`body` text NOT NULL,
	`author_email` text NOT NULL,
	`status` text DEFAULT 'published' NOT NULL,
	`like_count` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`topic_id`) REFERENCES `community_topics`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`author_email`) REFERENCES `profiles`(`email`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `replies_topic_idx` ON `community_replies` (`topic_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `replies_author_idx` ON `community_replies` (`author_email`);--> statement-breakpoint
CREATE TABLE `community_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`reporter_email` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text NOT NULL,
	`reason` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` text NOT NULL,
	`resolved_at` text,
	FOREIGN KEY (`reporter_email`) REFERENCES `profiles`(`email`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `reports_status_idx` ON `community_reports` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `community_topics` (
	`id` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`author_email` text NOT NULL,
	`status` text DEFAULT 'published' NOT NULL,
	`reply_count` integer DEFAULT 0 NOT NULL,
	`like_count` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`author_email`) REFERENCES `profiles`(`email`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `topics_category_idx` ON `community_topics` (`category`);--> statement-breakpoint
CREATE INDEX `topics_status_created_idx` ON `community_topics` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `topics_author_idx` ON `community_topics` (`author_email`);--> statement-breakpoint
CREATE TABLE `content_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`payload` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`featured` integer DEFAULT false NOT NULL,
	`author_email` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `content_type_slug_unique` ON `content_entries` (`type`,`slug`);--> statement-breakpoint
CREATE INDEX `content_status_idx` ON `content_entries` (`status`,`type`);--> statement-breakpoint
CREATE TABLE `moderation_actions` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_email` text NOT NULL,
	`action` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text NOT NULL,
	`reason` text,
	`metadata` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `moderation_target_idx` ON `moderation_actions` (`target_type`,`target_id`);--> statement-breakpoint
CREATE INDEX `moderation_created_idx` ON `moderation_actions` (`created_at`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`email` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`role` text DEFAULT 'user' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`blocked_until` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`window_start` text NOT NULL,
	`updated_at` text NOT NULL
);
