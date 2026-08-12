CREATE TABLE `admins` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`username` text,
	`email` text,
	`password` text,
	`role` text DEFAULT 'editor' NOT NULL,
	`permissions` text,
	`is_active` integer DEFAULT true,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	`updated_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admins_user_id_unique` ON `admins` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `admins_username_unique` ON `admins` (`username`);--> statement-breakpoint
CREATE TABLE `ads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`type` text DEFAULT 'image' NOT NULL,
	`content` text,
	`description` text,
	`cta_text` text,
	`title_color` text,
	`cta_bg_color` text,
	`cta_text_color` text,
	`target_interests` text,
	`image_url` text,
	`link_url` text,
	`position` text DEFAULT 'header_banner' NOT NULL,
	`pages` text,
	`start_date` integer,
	`end_date` integer,
	`is_active` integer DEFAULT true,
	`priority` integer DEFAULT 0,
	`deleted_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	`updated_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE TABLE `announcements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`target_audience` text DEFAULT 'all' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`start_date` integer,
	`end_date` integer,
	`image_url` text,
	`link_url` text,
	`link_button_text` text,
	`created_by` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE TABLE `blog_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`sort_order` integer DEFAULT 0,
	`is_active` integer DEFAULT true,
	`created_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `blog_categories_slug_unique` ON `blog_categories` (`slug`);--> statement-breakpoint
CREATE TABLE `blog_posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`excerpt` text,
	`content` text,
	`image` text,
	`source` text,
	`category` text NOT NULL,
	`author` text NOT NULL,
	`date` text NOT NULL,
	`view_count` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'published' NOT NULL,
	`is_published` integer DEFAULT true,
	`trashed_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	`updated_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `blog_posts_slug_unique` ON `blog_posts` (`slug`);--> statement-breakpoint
CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`type` text DEFAULT 'job' NOT NULL,
	`icon` text,
	`color` text,
	`description` text,
	`is_active` integer DEFAULT true,
	`parent_id` integer,
	`sort_order` integer DEFAULT 0,
	`created_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_slug_unique` ON `categories` (`slug`);--> statement-breakpoint
CREATE TABLE `community_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`icon` text,
	`color` text,
	`posts_count` integer DEFAULT 0,
	`sort_order` integer DEFAULT 0,
	`is_active` integer DEFAULT true,
	`created_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `community_categories_slug_unique` ON `community_categories` (`slug`);--> statement-breakpoint
CREATE TABLE `community_comments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`content` text NOT NULL,
	`post_id` integer NOT NULL,
	`member_id` integer NOT NULL,
	`parent_id` integer,
	`likes_count` integer DEFAULT 0,
	`status` text DEFAULT 'published' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	`updated_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE INDEX `community_comments_post_idx` ON `community_comments` (`post_id`);--> statement-breakpoint
CREATE INDEX `community_comments_member_idx` ON `community_comments` (`member_id`);--> statement-breakpoint
CREATE TABLE `community_likes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer NOT NULL,
	`post_id` integer,
	`comment_id` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE INDEX `community_likes_member_idx` ON `community_likes` (`member_id`);--> statement-breakpoint
CREATE INDEX `community_likes_post_idx` ON `community_likes` (`post_id`);--> statement-breakpoint
CREATE TABLE `community_members` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`username` text NOT NULL,
	`display_name` text NOT NULL,
	`avatar` text,
	`bio` text,
	`phone` text,
	`email` text,
	`password` text,
	`provider` text DEFAULT 'email',
	`role` text DEFAULT 'new_member',
	`rank_id` integer,
	`posts_count` integer DEFAULT 0,
	`comments_count` integer DEFAULT 0,
	`likes_received` integer DEFAULT 0,
	`is_banned` integer DEFAULT false,
	`is_verified` integer DEFAULT false,
	`last_active` integer DEFAULT (unixepoch() * 1000),
	`created_at` integer DEFAULT (unixepoch() * 1000),
	`cv_analysis_used` integer DEFAULT 0,
	`cv_analysis_reset_at` integer,
	`cv_analysis_paid_credits` integer DEFAULT 0,
	`cv_analysis_paid_credits_expires_at` integer,
	`job_alert_points` integer DEFAULT 100,
	`job_alert_paid_points` integer DEFAULT 0
);
--> statement-breakpoint
CREATE UNIQUE INDEX `community_members_user_id_unique` ON `community_members` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `community_members_username_unique` ON `community_members` (`username`);--> statement-breakpoint
CREATE TABLE `community_moderator_permissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`can_manage_posts` integer DEFAULT false,
	`can_manage_comments` integer DEFAULT false,
	`can_manage_members` integer DEFAULT false,
	`can_ban_members` integer DEFAULT false,
	`can_manage_categories` integer DEFAULT false,
	`can_pin_posts` integer DEFAULT false,
	`can_feature_posts` integer DEFAULT false,
	`can_lock_posts` integer DEFAULT false,
	`is_active` integer DEFAULT true,
	`created_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `community_moderator_permissions_slug_unique` ON `community_moderator_permissions` (`slug`);--> statement-breakpoint
CREATE TABLE `community_moderator_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer NOT NULL,
	`category_id` integer NOT NULL,
	`reason` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`resolved_by` integer,
	`resolved_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE TABLE `community_moderators` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer NOT NULL,
	`category_id` integer,
	`permission_id` integer,
	`is_active` integer DEFAULT true,
	`assigned_by` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE TABLE `community_notifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer NOT NULL,
	`actor_id` integer NOT NULL,
	`type` text NOT NULL,
	`post_id` integer,
	`comment_id` integer,
	`message` text,
	`link` text,
	`is_read` integer DEFAULT false,
	`created_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE INDEX `community_notif_member_idx` ON `community_notifications` (`member_id`);--> statement-breakpoint
CREATE INDEX `community_notif_read_idx` ON `community_notifications` (`is_read`);--> statement-breakpoint
CREATE TABLE `community_posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`member_id` integer NOT NULL,
	`category_id` integer NOT NULL,
	`likes_count` integer DEFAULT 0,
	`comments_count` integer DEFAULT 0,
	`views_count` integer DEFAULT 0,
	`is_pinned` integer DEFAULT false,
	`is_featured` integer DEFAULT false,
	`is_locked` integer DEFAULT false,
	`status` text DEFAULT 'published' NOT NULL,
	`trashed_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	`updated_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE INDEX `community_posts_member_idx` ON `community_posts` (`member_id`);--> statement-breakpoint
CREATE INDEX `community_posts_category_idx` ON `community_posts` (`category_id`);--> statement-breakpoint
CREATE INDEX `community_posts_status_idx` ON `community_posts` (`status`);--> statement-breakpoint
CREATE INDEX `community_posts_created_at_idx` ON `community_posts` (`created_at`);--> statement-breakpoint
CREATE TABLE `community_reports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`reporter_id` integer NOT NULL,
	`post_id` integer,
	`comment_id` integer,
	`member_id` integer,
	`reason` text NOT NULL,
	`details` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`resolved_by` integer,
	`resolved_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE TABLE `community_tokens` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`token` text NOT NULL,
	`member_id` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `community_tokens_token_unique` ON `community_tokens` (`token`);--> statement-breakpoint
CREATE TABLE `courses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`provider` text NOT NULL,
	`description` text,
	`url` text,
	`image` text,
	`date` text,
	`duration` text,
	`is_free` integer DEFAULT true,
	`is_active` integer DEFAULT true,
	`status` text DEFAULT 'published' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	`updated_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE TABLE `credit_adjustments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer NOT NULL,
	`type` text NOT NULL,
	`operation` text NOT NULL,
	`amount` integer NOT NULL,
	`reason` text,
	`created_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE TABLE `cv_analysis_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer NOT NULL,
	`job_id` integer,
	`job_title` text NOT NULL,
	`job_company` text,
	`job_category` text,
	`match_percentage` integer NOT NULL,
	`credit_type` text DEFAULT 'free' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE INDEX `cv_analysis_history_member_idx` ON `cv_analysis_history` (`member_id`);--> statement-breakpoint
CREATE INDEX `cv_analysis_history_created_idx` ON `cv_analysis_history` (`created_at`);--> statement-breakpoint
CREATE TABLE `daily_market_snapshots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`generated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`period_start` integer NOT NULL,
	`snapshot_data` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `employer_job_reports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employer_job_id` integer NOT NULL,
	`reporter_name` text,
	`reporter_email` text,
	`reason` text NOT NULL,
	`details` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`resolved_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE INDEX `employer_job_reports_job_idx` ON `employer_job_reports` (`employer_job_id`);--> statement-breakpoint
CREATE INDEX `employer_job_reports_status_idx` ON `employer_job_reports` (`status`);--> statement-breakpoint
CREATE TABLE `employer_jobs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`company` text NOT NULL,
	`region` text,
	`city` text,
	`work_schedule` text,
	`work_mode` text,
	`description` text NOT NULL,
	`requirements` text,
	`target_gender` text DEFAULT 'all' NOT NULL,
	`target_nationality` text DEFAULT 'all' NOT NULL,
	`contact_method` text DEFAULT 'email' NOT NULL,
	`contact_value` text NOT NULL,
	`submitter_name` text NOT NULL,
	`submitter_email` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`deadline_date` integer,
	`view_count` integer DEFAULT 0 NOT NULL,
	`trashed_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	`updated_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE INDEX `employer_jobs_status_idx` ON `employer_jobs` (`status`);--> statement-breakpoint
CREATE INDEX `employer_jobs_region_idx` ON `employer_jobs` (`region`);--> statement-breakpoint
CREATE INDEX `employer_jobs_created_at_idx` ON `employer_jobs` (`created_at`);--> statement-breakpoint
CREATE TABLE `faq_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `faq_categories_slug_unique` ON `faq_categories` (`slug`);--> statement-breakpoint
CREATE TABLE `faq_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`question` text NOT NULL,
	`answer` text NOT NULL,
	`category` text DEFAULT 'general',
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_published` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	`updated_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE TABLE `job_alert_preferences` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer NOT NULL,
	`categories` text DEFAULT '[]' NOT NULL,
	`is_enabled` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	`updated_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `job_alert_preferences_member_id_unique` ON `job_alert_preferences` (`member_id`);--> statement-breakpoint
CREATE INDEX `job_alert_prefs_member_idx` ON `job_alert_preferences` (`member_id`);--> statement-breakpoint
CREATE TABLE `job_alert_sent` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer NOT NULL,
	`job_id` integer NOT NULL,
	`sent_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE INDEX `job_alert_sent_member_idx` ON `job_alert_sent` (`member_id`);--> statement-breakpoint
CREATE INDEX `job_alert_sent_job_idx` ON `job_alert_sent` (`job_id`);--> statement-breakpoint
CREATE TABLE `job_application_credits` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer NOT NULL,
	`balance` integer DEFAULT 0 NOT NULL,
	`expires_at` integer,
	`updated_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `job_application_credits_member_id_unique` ON `job_application_credits` (`member_id`);--> statement-breakpoint
CREATE TABLE `job_application_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer NOT NULL,
	`job_id` integer NOT NULL,
	`job_title` text NOT NULL,
	`job_company` text,
	`job_apply_url` text NOT NULL,
	`request_number` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	`updated_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `job_application_requests_request_number_unique` ON `job_application_requests` (`request_number`);--> statement-breakpoint
CREATE INDEX `job_app_requests_member_idx` ON `job_application_requests` (`member_id`);--> statement-breakpoint
CREATE INDEX `job_app_requests_status_idx` ON `job_application_requests` (`status`);--> statement-breakpoint
CREATE TABLE `job_favorites` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer NOT NULL,
	`job_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE INDEX `job_favorites_member_idx` ON `job_favorites` (`member_id`);--> statement-breakpoint
CREATE INDEX `job_favorites_job_idx` ON `job_favorites` (`job_id`);--> statement-breakpoint
CREATE TABLE `job_reports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`job_id` integer NOT NULL,
	`reporter_name` text,
	`reporter_email` text,
	`member_id` integer,
	`reason` text NOT NULL,
	`details` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`resolved_by` integer,
	`resolved_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`company` text NOT NULL,
	`organization_id` integer,
	`logo` text,
	`category` text NOT NULL,
	`date` text NOT NULL,
	`location` text,
	`description` text,
	`summary` text,
	`apply_url` text NOT NULL,
	`source_url` text NOT NULL,
	`link_type` text DEFAULT 'url' NOT NULL,
	`status` text DEFAULT 'published' NOT NULL,
	`is_featured` integer DEFAULT false,
	`view_count` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true,
	`deadline_date` integer,
	`trashed_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	`updated_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE INDEX `jobs_status_idx` ON `jobs` (`status`);--> statement-breakpoint
CREATE INDEX `jobs_category_idx` ON `jobs` (`category`);--> statement-breakpoint
CREATE INDEX `jobs_org_idx` ON `jobs` (`organization_id`);--> statement-breakpoint
CREATE INDEX `jobs_created_at_idx` ON `jobs` (`created_at`);--> statement-breakpoint
CREATE TABLE `media` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`filename` text NOT NULL,
	`object_path` text NOT NULL,
	`url` text NOT NULL,
	`mime_type` text,
	`size` integer,
	`width` integer,
	`height` integer,
	`alt` text,
	`uploaded_by` text,
	`category` text DEFAULT 'general' NOT NULL,
	`deleted_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE TABLE `member_push_tokens` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer NOT NULL,
	`token` text NOT NULL,
	`platform` text,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	`updated_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `member_push_tokens_token_unique` ON `member_push_tokens` (`token`);--> statement-breakpoint
CREATE INDEX `member_push_tokens_member_idx` ON `member_push_tokens` (`member_id`);--> statement-breakpoint
CREATE TABLE `member_ranks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`color` text DEFAULT '#6b7280',
	`icon` text,
	`min_posts` integer DEFAULT 0,
	`is_active` integer DEFAULT true,
	`sort_order` integer DEFAULT 0,
	`created_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE TABLE `online_visitors` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` text NOT NULL,
	`current_page` text,
	`last_seen` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `online_visitors_session_id_unique` ON `online_visitors` (`session_id`);--> statement-breakpoint
CREATE TABLE `organization_follows` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer NOT NULL,
	`organization_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE INDEX `org_follows_member_idx` ON `organization_follows` (`member_id`);--> statement-breakpoint
CREATE INDEX `org_follows_org_idx` ON `organization_follows` (`organization_id`);--> statement-breakpoint
CREATE TABLE `organization_types` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`label` text NOT NULL,
	`value` text NOT NULL,
	`color` text DEFAULT 'blue',
	`sort_order` integer DEFAULT 0,
	`created_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `organization_types_value_unique` ON `organization_types` (`value`);--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`logo` text,
	`type` text DEFAULT 'government' NOT NULL,
	`description` text,
	`website` text,
	`is_active` integer DEFAULT true,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	`updated_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE TABLE `pages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`content` text,
	`status` text DEFAULT 'published' NOT NULL,
	`trashed_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	`updated_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pages_slug_unique` ON `pages` (`slug`);--> statement-breakpoint
CREATE TABLE `permissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`module` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `permissions_slug_unique` ON `permissions` (`slug`);--> statement-breakpoint
CREATE TABLE `results` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`org` text NOT NULL,
	`organization_id` integer,
	`type` text NOT NULL,
	`date` text NOT NULL,
	`details` text,
	`inquiry_url` text,
	`view_count` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'published' NOT NULL,
	`is_active` integer DEFAULT true,
	`trashed_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	`updated_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE TABLE `seo_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`page_path` text NOT NULL,
	`title` text,
	`description` text,
	`keywords` text,
	`og_image` text,
	`canonical_url` text,
	`robots` text DEFAULT 'index,follow',
	`custom_meta` text,
	`updated_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `seo_settings_page_path_unique` ON `seo_settings` (`page_path`);--> statement-breakpoint
CREATE TABLE `service_orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer,
	`order_number` text NOT NULL,
	`service_slug` text NOT NULL,
	`service_name` text NOT NULL,
	`service_variant` text,
	`amount` integer NOT NULL,
	`customer_name` text NOT NULL,
	`customer_phone` text NOT NULL,
	`customer_email` text NOT NULL,
	`receipt_url` text NOT NULL,
	`payment_method` text DEFAULT 'bank_transfer',
	`status` text DEFAULT 'pending',
	`cancellation_reason` text,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	`updated_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `service_orders_order_number_unique` ON `service_orders` (`order_number`);--> statement-breakpoint
CREATE TABLE `services` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`icon` text,
	`color` text,
	`price` integer,
	`old_price` integer,
	`discount` text,
	`variants` text,
	`category` text DEFAULT 'individual',
	`is_featured` integer DEFAULT false,
	`is_active` integer DEFAULT true,
	`sort_order` integer DEFAULT 0,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	`updated_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `services_slug_unique` ON `services` (`slug`);--> statement-breakpoint
CREATE TABLE `site_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`value` text,
	`updated_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `site_settings_key_unique` ON `site_settings` (`key`);--> statement-breakpoint
CREATE TABLE `support_ticket_replies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ticket_id` integer NOT NULL,
	`sender_id` integer NOT NULL,
	`sender_type` text NOT NULL,
	`message` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE INDEX `support_ticket_replies_ticket_idx` ON `support_ticket_replies` (`ticket_id`);--> statement-breakpoint
CREATE TABLE `support_tickets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ticket_number` text NOT NULL,
	`member_id` integer NOT NULL,
	`subject` text NOT NULL,
	`type` text DEFAULT 'inquiry' NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`order_number` text,
	`closed_at` integer,
	`last_member_reply_at` integer,
	`last_admin_reply_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	`updated_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `support_tickets_ticket_number_unique` ON `support_tickets` (`ticket_number`);--> statement-breakpoint
CREATE INDEX `support_tickets_member_idx` ON `support_tickets` (`member_id`);--> statement-breakpoint
CREATE INDEX `support_tickets_status_idx` ON `support_tickets` (`status`);--> statement-breakpoint
CREATE TABLE `twitter_posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`content_type` text NOT NULL,
	`content_id` integer NOT NULL,
	`tweet_id` text,
	`tweet_url` text,
	`tweet_text` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`is_auto` integer DEFAULT false,
	`published_by` integer,
	`attempts` integer DEFAULT 0,
	`error_message` text,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	`published_at` integer
);
--> statement-breakpoint
CREATE INDEX `twitter_posts_content_idx` ON `twitter_posts` (`content_type`,`content_id`);--> statement-breakpoint
CREATE TABLE `twitter_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`enabled` integer DEFAULT false,
	`auto_jobs_general` integer DEFAULT false,
	`auto_jobs_civil` integer DEFAULT false,
	`auto_jobs_military` integer DEFAULT false,
	`auto_jobs_companies` integer DEFAULT false,
	`auto_jobs_organizations` integer DEFAULT false,
	`auto_jobs_results` integer DEFAULT false,
	`auto_blog` integer DEFAULT false,
	`default_hashtags` text DEFAULT '#وظائف_السعودية #وظائف',
	`image_source` text DEFAULT 'logo',
	`template_job` text,
	`template_civil` text,
	`template_military` text,
	`template_companies` text,
	`template_organizations` text,
	`template_results` text,
	`template_blog` text,
	`rate_limit_per_hour` integer DEFAULT 5,
	`updated_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE TABLE `weekly_subscriptions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`email` text NOT NULL,
	`display_name` text,
	`subscribed_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`is_active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `weekly_subscriptions_user_id_unique` ON `weekly_subscriptions` (`user_id`);--> statement-breakpoint
CREATE TABLE `weekly_summaries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`week_label` text NOT NULL,
	`generated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`narrative` text NOT NULL,
	`top_jobs_section` text NOT NULL,
	`top_posts_section` text NOT NULL,
	`stats_snapshot` text NOT NULL,
	`ai_advice` text NOT NULL,
	`top_jobs_data` text,
	`top_posts_data` text,
	`stats_data` text
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`sid` text PRIMARY KEY NOT NULL,
	`sess` text NOT NULL,
	`expire` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `IDX_session_expire` ON `sessions` (`expire`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`email` text,
	`first_name` text,
	`last_name` text,
	`profile_image_url` text,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	`updated_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);