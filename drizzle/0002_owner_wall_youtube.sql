CREATE TABLE `owner_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`display_name` text NOT NULL,
	`protected` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `owner_accounts_email_unique` ON `owner_accounts` (`email`);
--> statement-breakpoint
CREATE TABLE `wall_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`created_by_owner_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`created_by_owner_id`) REFERENCES `owner_accounts`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `wall_categories_name_unique` ON `wall_categories` (`name`);
--> statement-breakpoint
CREATE INDEX `wall_categories_status_position_idx` ON `wall_categories` (`status`,`position`);
--> statement-breakpoint
INSERT INTO `wall_categories` (`id`,`name`,`description`,`status`,`position`,`created_by_owner_id`,`created_at`,`updated_at`) VALUES
	('celulares','Celulares','Celulares novos, usados e experiências de uso.','active',1,NULL,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
	('notebooks','Notebooks','Notebooks para trabalho, estudo e jogos.','active',2,NULL,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
	('consoles','Consoles','Consoles, jogos, manutenção e custo-benefício.','active',3,NULL,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
	('perifericos','Periféricos','Acessórios, fones, teclados e periféricos.','active',4,NULL,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
	('garimpos-olx','Garimpos e OLX','Achados, negociações e compras de risco.','active',5,NULL,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
	('reparos','Reparos','Diagnósticos, peças e resultados de reparos.','active',6,NULL,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
	('ajuda-tecnica','Ajuda técnica','Dúvidas técnicas com contexto suficiente para ajudar.','active',7,NULL,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
	('sugestoes-video','Sugestões de vídeo','Ideias de produtos, testes e comparações para o canal.','active',8,NULL,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
	('assuntos-gerais','Assuntos gerais','Conversas úteis sobre tecnologia que não cabem nas demais categorias.','active',9,NULL,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
--> statement-breakpoint
CREATE TABLE `wall_topics` (
	`id` text PRIMARY KEY NOT NULL,
	`category_id` text NOT NULL,
	`display_name` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`status` text DEFAULT 'published' NOT NULL,
	`is_official` integer DEFAULT false NOT NULL,
	`identity_hash` text,
	`content_hash` text NOT NULL,
	`reply_count` integer DEFAULT 0 NOT NULL,
	`closed_at` text,
	`pinned_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`category_id`) REFERENCES `wall_categories`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `wall_topics_status_pinned_created_idx` ON `wall_topics` (`status`,`pinned_at`,`created_at`);
--> statement-breakpoint
CREATE INDEX `wall_topics_category_status_idx` ON `wall_topics` (`category_id`,`status`);
--> statement-breakpoint
CREATE INDEX `wall_topics_identity_created_idx` ON `wall_topics` (`identity_hash`,`created_at`);
--> statement-breakpoint
CREATE INDEX `wall_topics_content_hash_idx` ON `wall_topics` (`content_hash`,`created_at`);
--> statement-breakpoint
CREATE TABLE `wall_replies` (
	`id` text PRIMARY KEY NOT NULL,
	`topic_id` text NOT NULL,
	`display_name` text NOT NULL,
	`body` text NOT NULL,
	`status` text DEFAULT 'published' NOT NULL,
	`is_official` integer DEFAULT false NOT NULL,
	`identity_hash` text,
	`content_hash` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`topic_id`) REFERENCES `wall_topics`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `wall_replies_topic_status_created_idx` ON `wall_replies` (`topic_id`,`status`,`created_at`);
--> statement-breakpoint
CREATE INDEX `wall_replies_identity_created_idx` ON `wall_replies` (`identity_hash`,`created_at`);
--> statement-breakpoint
CREATE INDEX `wall_replies_content_hash_idx` ON `wall_replies` (`content_hash`,`created_at`);
--> statement-breakpoint
CREATE TABLE `wall_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`reporter_hash` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text NOT NULL,
	`reason` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`resolved_at` text,
	`resolved_by_owner_id` text,
	FOREIGN KEY (`resolved_by_owner_id`) REFERENCES `owner_accounts`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `wall_reports_status_created_idx` ON `wall_reports` (`status`,`created_at`);
--> statement-breakpoint
CREATE INDEX `wall_reports_target_idx` ON `wall_reports` (`target_type`,`target_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `wall_reports_open_identity_target_unique` ON `wall_reports` (`reporter_hash`,`target_type`,`target_id`) WHERE `status` in ('open', 'reviewing');
--> statement-breakpoint
CREATE TABLE `wall_blocks` (
	`id` text PRIMARY KEY NOT NULL,
	`identity_hash` text NOT NULL,
	`reason` text NOT NULL,
	`expires_at` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_by_owner_id` text,
	`created_at` text NOT NULL,
	`lifted_at` text,
	FOREIGN KEY (`created_by_owner_id`) REFERENCES `owner_accounts`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `wall_blocks_identity_active_expires_idx` ON `wall_blocks` (`identity_hash`,`active`,`expires_at`);
--> statement-breakpoint
CREATE TABLE `owner_actions` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_owner_id` text,
	`action` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text NOT NULL,
	`reason` text,
	`metadata` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`actor_owner_id`) REFERENCES `owner_accounts`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `owner_actions_target_idx` ON `owner_actions` (`target_type`,`target_id`);
--> statement-breakpoint
CREATE INDEX `owner_actions_created_idx` ON `owner_actions` (`created_at`);
--> statement-breakpoint
CREATE TABLE `youtube_channel_state` (
	`channel_id` text PRIMARY KEY NOT NULL,
	`channel_name` text,
	`handle` text,
	`description` text,
	`uploads_playlist_id` text,
	`subscribers` integer,
	`total_views` integer,
	`video_count` integer,
	`metrics_source` text DEFAULT 'unavailable' NOT NULL,
	`metrics_updated_at` text,
	`metrics_stale` integer DEFAULT true NOT NULL,
	`catalog_source` text DEFAULT 'unavailable' NOT NULL,
	`catalog_updated_at` text,
	`catalog_partial` integer DEFAULT true NOT NULL,
	`catalog_stale` integer DEFAULT true NOT NULL,
	`indexed_video_count` integer DEFAULT 0 NOT NULL,
	`sync_status` text DEFAULT 'idle' NOT NULL,
	`last_attempt_at` text,
	`last_success_at` text,
	`last_full_sync_at` text,
	`last_error` text,
	`lock_expires_at` text,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `youtube_videos` (
	`id` text PRIMARY KEY NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`published_at` text DEFAULT '' NOT NULL,
	`duration` text DEFAULT '' NOT NULL,
	`thumbnail` text DEFAULT '' NOT NULL,
	`views` integer DEFAULT 0 NOT NULL,
	`likes` integer,
	`comments` integer,
	`availability` text DEFAULT 'public' NOT NULL,
	`category` text,
	`tags` text,
	`summary` text,
	`featured` integer DEFAULT false NOT NULL,
	`related_review_slug` text,
	`related_find_slug` text,
	`editorial_updated_at` text,
	`synced_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `youtube_videos_availability_position_idx` ON `youtube_videos` (`availability`,`position`);
--> statement-breakpoint
CREATE INDEX `youtube_videos_featured_idx` ON `youtube_videos` (`featured`,`availability`);
--> statement-breakpoint
CREATE TABLE `youtube_sync_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`trigger` text NOT NULL,
	`mode` text NOT NULL,
	`status` text NOT NULL,
	`started_at` text NOT NULL,
	`completed_at` text,
	`videos_found` integer DEFAULT 0 NOT NULL,
	`videos_indexed` integer DEFAULT 0 NOT NULL,
	`error_code` text,
	`error_message` text
);
--> statement-breakpoint
CREATE INDEX `youtube_sync_runs_started_idx` ON `youtube_sync_runs` (`started_at`);
