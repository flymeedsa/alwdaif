-- Generated from the production D1 schema. Isolated app database only.
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS=0;
CREATE TABLE IF NOT EXISTS `admins` (
	`id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`user_id` VARCHAR(191) NOT NULL,
	`name` LONGTEXT NOT NULL,
	`username` VARCHAR(191),
	`email` LONGTEXT,
	`password` LONGTEXT,
	`role` VARCHAR(191) DEFAULT 'editor' NOT NULL,
	`permissions` LONGTEXT,
	`is_active` BIGINT DEFAULT 1,
	`created_at` BIGINT DEFAULT 0,
	`updated_at` BIGINT DEFAULT 0
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE UNIQUE INDEX `admins_user_id_unique` ON `admins` (`user_id`);
CREATE UNIQUE INDEX `admins_username_unique` ON `admins` (`username`);
CREATE TABLE IF NOT EXISTS `ads` (
	`id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`title` LONGTEXT NOT NULL,
	`type` VARCHAR(191) DEFAULT 'image' NOT NULL,
	`content` LONGTEXT,
	`description` LONGTEXT,
	`cta_text` LONGTEXT,
	`title_color` LONGTEXT,
	`cta_bg_color` LONGTEXT,
	`cta_text_color` LONGTEXT,
	`target_interests` LONGTEXT,
	`image_url` LONGTEXT,
	`link_url` LONGTEXT,
	`position` VARCHAR(191) DEFAULT 'header_banner' NOT NULL,
	`pages` LONGTEXT,
	`start_date` BIGINT,
	`end_date` BIGINT,
	`is_active` BIGINT DEFAULT 1,
	`priority` BIGINT DEFAULT 0,
	`deleted_at` BIGINT,
	`created_at` BIGINT DEFAULT 0,
	`updated_at` BIGINT DEFAULT 0
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `announcements` (
	`id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`title` LONGTEXT NOT NULL,
	`body` LONGTEXT NOT NULL,
	`target_audience` VARCHAR(191) DEFAULT 'all' NOT NULL,
	`status` VARCHAR(191) DEFAULT 'active' NOT NULL,
	`start_date` BIGINT,
	`end_date` BIGINT,
	`image_url` LONGTEXT,
	`link_url` LONGTEXT,
	`link_button_text` LONGTEXT,
	`created_by` BIGINT,
	`created_at` BIGINT DEFAULT 0
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `blog_categories` (
	`id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`name` LONGTEXT NOT NULL,
	`slug` VARCHAR(191) NOT NULL,
	`description` LONGTEXT,
	`sort_order` BIGINT DEFAULT 0,
	`is_active` BIGINT DEFAULT 1,
	`created_at` BIGINT DEFAULT 0
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE UNIQUE INDEX `blog_categories_slug_unique` ON `blog_categories` (`slug`);
CREATE TABLE IF NOT EXISTS `blog_posts` (
	`id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`title` LONGTEXT NOT NULL,
	`slug` VARCHAR(191) NOT NULL,
	`excerpt` LONGTEXT,
	`content` LONGTEXT,
	`image` LONGTEXT,
	`source` LONGTEXT,
	`category` LONGTEXT NOT NULL,
	`author` LONGTEXT NOT NULL,
	`date` LONGTEXT NOT NULL,
	`view_count` BIGINT DEFAULT 0 NOT NULL,
	`status` VARCHAR(191) DEFAULT 'published' NOT NULL,
	`is_published` BIGINT DEFAULT 1,
	`trashed_at` BIGINT,
	`created_at` BIGINT DEFAULT 0,
	`updated_at` BIGINT DEFAULT 0
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE UNIQUE INDEX `blog_posts_slug_unique` ON `blog_posts` (`slug`);
CREATE TABLE IF NOT EXISTS `categories` (
	`id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`name` LONGTEXT NOT NULL,
	`slug` VARCHAR(191) NOT NULL,
	`type` VARCHAR(191) DEFAULT 'job' NOT NULL,
	`icon` LONGTEXT,
	`color` LONGTEXT,
	`description` LONGTEXT,
	`is_active` BIGINT DEFAULT 1,
	`parent_id` BIGINT,
	`sort_order` BIGINT DEFAULT 0,
	`created_at` BIGINT DEFAULT 0
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE UNIQUE INDEX `categories_slug_unique` ON `categories` (`slug`);
CREATE TABLE IF NOT EXISTS `community_categories` (
	`id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`name` LONGTEXT NOT NULL,
	`slug` VARCHAR(191) NOT NULL,
	`description` LONGTEXT,
	`icon` LONGTEXT,
	`color` LONGTEXT,
	`posts_count` BIGINT DEFAULT 0,
	`sort_order` BIGINT DEFAULT 0,
	`is_active` BIGINT DEFAULT 1,
	`created_at` BIGINT DEFAULT 0
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE UNIQUE INDEX `community_categories_slug_unique` ON `community_categories` (`slug`);
CREATE TABLE IF NOT EXISTS `community_comments` (
	`id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`content` LONGTEXT NOT NULL,
	`post_id` BIGINT NOT NULL,
	`member_id` BIGINT NOT NULL,
	`parent_id` BIGINT,
	`likes_count` BIGINT DEFAULT 0,
	`status` VARCHAR(191) DEFAULT 'published' NOT NULL,
	`created_at` BIGINT DEFAULT 0,
	`updated_at` BIGINT DEFAULT 0
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE INDEX `community_comments_post_idx` ON `community_comments` (`post_id`);
CREATE INDEX `community_comments_member_idx` ON `community_comments` (`member_id`);
CREATE TABLE IF NOT EXISTS `community_likes` (
	`id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`member_id` BIGINT NOT NULL,
	`post_id` BIGINT,
	`comment_id` BIGINT,
	`created_at` BIGINT DEFAULT 0
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE INDEX `community_likes_member_idx` ON `community_likes` (`member_id`);
CREATE INDEX `community_likes_post_idx` ON `community_likes` (`post_id`);
CREATE TABLE IF NOT EXISTS `community_members` (
	`id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`user_id` VARCHAR(191) NOT NULL,
	`username` VARCHAR(191) NOT NULL,
	`display_name` LONGTEXT NOT NULL,
	`avatar` LONGTEXT,
	`bio` LONGTEXT,
	`phone` LONGTEXT,
	`email` LONGTEXT,
	`password` LONGTEXT,
	`provider` VARCHAR(191) DEFAULT 'email',
	`role` VARCHAR(191) DEFAULT 'new_member',
	`rank_id` BIGINT,
	`posts_count` BIGINT DEFAULT 0,
	`comments_count` BIGINT DEFAULT 0,
	`likes_received` BIGINT DEFAULT 0,
	`is_banned` BIGINT DEFAULT 0,
	`is_verified` BIGINT DEFAULT 0,
	`last_active` BIGINT DEFAULT 0,
	`created_at` BIGINT DEFAULT 0,
	`cv_analysis_used` BIGINT DEFAULT 0,
	`cv_analysis_reset_at` BIGINT,
	`cv_analysis_paid_credits` BIGINT DEFAULT 0,
	`cv_analysis_paid_credits_expires_at` BIGINT,
	`job_alert_points` BIGINT DEFAULT 100,
	`job_alert_paid_points` BIGINT DEFAULT 0
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE UNIQUE INDEX `community_members_user_id_unique` ON `community_members` (`user_id`);
CREATE UNIQUE INDEX `community_members_username_unique` ON `community_members` (`username`);
CREATE TABLE IF NOT EXISTS `community_moderator_permissions` (
	`id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`name` LONGTEXT NOT NULL,
	`slug` VARCHAR(191) NOT NULL,
	`description` LONGTEXT,
	`can_manage_posts` BIGINT DEFAULT 0,
	`can_manage_comments` BIGINT DEFAULT 0,
	`can_manage_members` BIGINT DEFAULT 0,
	`can_ban_members` BIGINT DEFAULT 0,
	`can_manage_categories` BIGINT DEFAULT 0,
	`can_pin_posts` BIGINT DEFAULT 0,
	`can_feature_posts` BIGINT DEFAULT 0,
	`can_lock_posts` BIGINT DEFAULT 0,
	`is_active` BIGINT DEFAULT 1,
	`created_at` BIGINT DEFAULT 0
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE UNIQUE INDEX `community_moderator_permissions_slug_unique` ON `community_moderator_permissions` (`slug`);
CREATE TABLE IF NOT EXISTS `community_moderator_requests` (
	`id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`member_id` BIGINT NOT NULL,
	`category_id` BIGINT NOT NULL,
	`reason` LONGTEXT NOT NULL,
	`status` VARCHAR(191) DEFAULT 'pending' NOT NULL,
	`resolved_by` BIGINT,
	`resolved_at` BIGINT,
	`created_at` BIGINT DEFAULT 0
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `community_moderators` (
	`id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`member_id` BIGINT NOT NULL,
	`category_id` BIGINT,
	`permission_id` BIGINT,
	`is_active` BIGINT DEFAULT 1,
	`assigned_by` BIGINT,
	`created_at` BIGINT DEFAULT 0
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `community_notifications` (
	`id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`member_id` BIGINT NOT NULL,
	`actor_id` BIGINT NOT NULL,
	`type` LONGTEXT NOT NULL,
	`post_id` BIGINT,
	`comment_id` BIGINT,
	`message` LONGTEXT,
	`link` LONGTEXT,
	`is_read` BIGINT DEFAULT 0,
	`created_at` BIGINT DEFAULT 0
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE INDEX `community_notif_member_idx` ON `community_notifications` (`member_id`);
CREATE INDEX `community_notif_read_idx` ON `community_notifications` (`is_read`);
CREATE TABLE IF NOT EXISTS `community_posts` (
	`id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`title` LONGTEXT NOT NULL,
	`content` LONGTEXT NOT NULL,
	`member_id` BIGINT NOT NULL,
	`category_id` BIGINT NOT NULL,
	`likes_count` BIGINT DEFAULT 0,
	`comments_count` BIGINT DEFAULT 0,
	`views_count` BIGINT DEFAULT 0,
	`is_pinned` BIGINT DEFAULT 0,
	`is_featured` BIGINT DEFAULT 0,
	`is_locked` BIGINT DEFAULT 0,
	`status` VARCHAR(191) DEFAULT 'published' NOT NULL,
	`trashed_at` BIGINT,
	`created_at` BIGINT DEFAULT 0,
	`updated_at` BIGINT DEFAULT 0
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE INDEX `community_posts_member_idx` ON `community_posts` (`member_id`);
CREATE INDEX `community_posts_category_idx` ON `community_posts` (`category_id`);
CREATE INDEX `community_posts_status_idx` ON `community_posts` (`status`);
CREATE INDEX `community_posts_created_at_idx` ON `community_posts` (`created_at`);
CREATE TABLE IF NOT EXISTS `community_reports` (
	`id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`reporter_id` BIGINT NOT NULL,
	`post_id` BIGINT,
	`comment_id` BIGINT,
	`member_id` BIGINT,
	`reason` LONGTEXT NOT NULL,
	`details` LONGTEXT,
	`status` VARCHAR(191) DEFAULT 'pending' NOT NULL,
	`resolved_by` BIGINT,
	`resolved_at` BIGINT,
	`created_at` BIGINT DEFAULT 0
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `courses` (
	`id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`title` LONGTEXT NOT NULL,
	`provider` LONGTEXT NOT NULL,
	`description` LONGTEXT,
	`url` LONGTEXT,
	`image` LONGTEXT,
	`date` LONGTEXT,
	`duration` LONGTEXT,
	`is_free` BIGINT DEFAULT 1,
	`is_active` BIGINT DEFAULT 1,
	`status` VARCHAR(191) DEFAULT 'published' NOT NULL,
	`created_at` BIGINT DEFAULT 0,
	`updated_at` BIGINT DEFAULT 0
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `credit_adjustments` (
	`id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`member_id` BIGINT NOT NULL,
	`type` LONGTEXT NOT NULL,
	`operation` LONGTEXT NOT NULL,
	`amount` BIGINT NOT NULL,
	`reason` LONGTEXT,
	`created_at` BIGINT DEFAULT 0
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `cv_analysis_history` (
	`id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`member_id` BIGINT NOT NULL,
	`job_id` BIGINT,
	`job_title` LONGTEXT NOT NULL,
	`job_company` LONGTEXT,
	`job_category` LONGTEXT,
	`match_percentage` BIGINT NOT NULL,
	`credit_type` VARCHAR(191) DEFAULT 'free' NOT NULL,
	`created_at` BIGINT DEFAULT 0
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE INDEX `cv_analysis_history_member_idx` ON `cv_analysis_history` (`member_id`);
CREATE INDEX `cv_analysis_history_created_idx` ON `cv_analysis_history` (`created_at`);
CREATE TABLE IF NOT EXISTS `daily_market_snapshots` (
	`id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`generated_at` BIGINT DEFAULT 0 NOT NULL,
	`period_start` BIGINT NOT NULL,
	`snapshot_data` LONGTEXT NOT NULL
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `employer_job_reports` (
	`id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`employer_job_id` BIGINT NOT NULL,
	`reporter_name` LONGTEXT,
	`reporter_email` LONGTEXT,
	`reason` LONGTEXT NOT NULL,
	`details` LONGTEXT,
	`status` VARCHAR(191) DEFAULT 'pending' NOT NULL,
	`resolved_at` BIGINT,
	`created_at` BIGINT DEFAULT 0
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE INDEX `employer_job_reports_job_idx` ON `employer_job_reports` (`employer_job_id`);
CREATE INDEX `employer_job_reports_status_idx` ON `employer_job_reports` (`status`);
CREATE TABLE IF NOT EXISTS `employer_jobs` (
	`id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`title` LONGTEXT NOT NULL,
	`company` LONGTEXT NOT NULL,
	`region` VARCHAR(191),
	`city` LONGTEXT,
	`work_schedule` LONGTEXT,
	`work_mode` LONGTEXT,
	`description` LONGTEXT NOT NULL,
	`requirements` LONGTEXT,
	`target_gender` VARCHAR(191) DEFAULT 'all' NOT NULL,
	`target_nationality` VARCHAR(191) DEFAULT 'all' NOT NULL,
	`contact_method` VARCHAR(191) DEFAULT 'email' NOT NULL,
	`contact_value` LONGTEXT NOT NULL,
	`submitter_name` LONGTEXT NOT NULL,
	`submitter_email` LONGTEXT NOT NULL,
	`status` VARCHAR(191) DEFAULT 'pending' NOT NULL,
	`deadline_date` BIGINT,
	`view_count` BIGINT DEFAULT 0 NOT NULL,
	`trashed_at` BIGINT,
	`created_at` BIGINT DEFAULT 0,
	`updated_at` BIGINT DEFAULT 0
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE INDEX `employer_jobs_status_idx` ON `employer_jobs` (`status`);
CREATE INDEX `employer_jobs_region_idx` ON `employer_jobs` (`region`);
CREATE INDEX `employer_jobs_created_at_idx` ON `employer_jobs` (`created_at`);
CREATE TABLE IF NOT EXISTS `faq_categories` (
	`id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`name` LONGTEXT NOT NULL,
	`slug` VARCHAR(191) NOT NULL,
	`sort_order` BIGINT DEFAULT 0 NOT NULL,
	`created_at` BIGINT DEFAULT 0
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE UNIQUE INDEX `faq_categories_slug_unique` ON `faq_categories` (`slug`);
CREATE TABLE IF NOT EXISTS `faq_items` (
	`id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`question` LONGTEXT NOT NULL,
	`answer` LONGTEXT NOT NULL,
	`category` VARCHAR(191) DEFAULT 'general',
	`sort_order` BIGINT DEFAULT 0 NOT NULL,
	`is_published` BIGINT DEFAULT 1 NOT NULL,
	`created_at` BIGINT DEFAULT 0,
	`updated_at` BIGINT DEFAULT 0
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `job_alert_preferences` (
	`id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`member_id` BIGINT NOT NULL,
	`categories` VARCHAR(191) DEFAULT '[]' NOT NULL,
	`is_enabled` BIGINT DEFAULT 1 NOT NULL,
	`created_at` BIGINT DEFAULT 0,
	`updated_at` BIGINT DEFAULT 0
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE UNIQUE INDEX `job_alert_preferences_member_id_unique` ON `job_alert_preferences` (`member_id`);
CREATE INDEX `job_alert_prefs_member_idx` ON `job_alert_preferences` (`member_id`);
CREATE TABLE IF NOT EXISTS `job_application_credits` (
	`id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`member_id` BIGINT NOT NULL,
	`balance` BIGINT DEFAULT 0 NOT NULL,
	`expires_at` BIGINT,
	`updated_at` BIGINT DEFAULT 0
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE UNIQUE INDEX `job_application_credits_member_id_unique` ON `job_application_credits` (`member_id`);
CREATE TABLE IF NOT EXISTS `job_application_requests` (
	`id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`member_id` BIGINT NOT NULL,
	`job_id` BIGINT NOT NULL,
	`job_title` LONGTEXT NOT NULL,
	`job_company` LONGTEXT,
	`job_apply_url` LONGTEXT NOT NULL,
	`request_number` VARCHAR(191) NOT NULL,
	`status` VARCHAR(191) DEFAULT 'pending' NOT NULL,
	`notes` LONGTEXT,
	`created_at` BIGINT DEFAULT 0,
	`updated_at` BIGINT DEFAULT 0
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE UNIQUE INDEX `job_application_requests_request_number_unique` ON `job_application_requests` (`request_number`);
CREATE INDEX `job_app_requests_member_idx` ON `job_application_requests` (`member_id`);
CREATE INDEX `job_app_requests_status_idx` ON `job_application_requests` (`status`);
CREATE TABLE IF NOT EXISTS `job_favorites` (
	`id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`member_id` BIGINT NOT NULL,
	`job_id` BIGINT NOT NULL,
	`created_at` BIGINT DEFAULT 0
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE INDEX `job_favorites_member_idx` ON `job_favorites` (`member_id`);
CREATE INDEX `job_favorites_job_idx` ON `job_favorites` (`job_id`);
CREATE TABLE IF NOT EXISTS `job_reports` (
	`id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`job_id` BIGINT NOT NULL,
	`reporter_name` LONGTEXT,
	`reporter_email` LONGTEXT,
	`member_id` BIGINT,
	`reason` LONGTEXT NOT NULL,
	`details` LONGTEXT,
	`status` VARCHAR(191) DEFAULT 'pending' NOT NULL,
	`resolved_by` BIGINT,
	`resolved_at` BIGINT,
	`created_at` BIGINT DEFAULT 0
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `jobs` (
	`id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`title` LONGTEXT NOT NULL,
	`company` LONGTEXT NOT NULL,
	`organization_id` BIGINT,
	`logo` LONGTEXT,
	`category` VARCHAR(191) NOT NULL,
	`date` LONGTEXT NOT NULL,
	`location` LONGTEXT,
	`description` LONGTEXT,
	`summary` LONGTEXT,
	`apply_url` LONGTEXT NOT NULL,
	`source_url` LONGTEXT NOT NULL,
	`link_type` VARCHAR(191) DEFAULT 'url' NOT NULL,
	`status` VARCHAR(191) DEFAULT 'published' NOT NULL,
	`is_featured` BIGINT DEFAULT 0,
	`view_count` BIGINT DEFAULT 0 NOT NULL,
	`is_active` BIGINT DEFAULT 1,
	`deadline_date` BIGINT,
	`trashed_at` BIGINT,
	`created_at` BIGINT DEFAULT 0,
	`updated_at` BIGINT DEFAULT 0
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE INDEX `jobs_status_idx` ON `jobs` (`status`);
CREATE INDEX `jobs_category_idx` ON `jobs` (`category`);
CREATE INDEX `jobs_org_idx` ON `jobs` (`organization_id`);
CREATE INDEX `jobs_created_at_idx` ON `jobs` (`created_at`);
CREATE TABLE IF NOT EXISTS `media` (
	`id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`name` LONGTEXT NOT NULL,
	`filename` LONGTEXT NOT NULL,
	`object_path` LONGTEXT NOT NULL,
	`url` LONGTEXT NOT NULL,
	`mime_type` LONGTEXT,
	`size` BIGINT,
	`width` BIGINT,
	`height` BIGINT,
	`alt` LONGTEXT,
	`uploaded_by` LONGTEXT,
	`category` VARCHAR(191) DEFAULT 'general' NOT NULL,
	`deleted_at` BIGINT,
	`created_at` BIGINT DEFAULT 0
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `member_ranks` (
	`id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`name` LONGTEXT NOT NULL,
	`color` VARCHAR(191) DEFAULT '#6b7280',
	`icon` LONGTEXT,
	`min_posts` BIGINT DEFAULT 0,
	`is_active` BIGINT DEFAULT 1,
	`sort_order` BIGINT DEFAULT 0,
	`created_at` BIGINT DEFAULT 0
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `organization_follows` (
	`id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`member_id` BIGINT NOT NULL,
	`organization_id` BIGINT NOT NULL,
	`created_at` BIGINT DEFAULT 0
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE INDEX `org_follows_member_idx` ON `organization_follows` (`member_id`);
CREATE INDEX `org_follows_org_idx` ON `organization_follows` (`organization_id`);
CREATE TABLE IF NOT EXISTS `organization_types` (
	`id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`label` LONGTEXT NOT NULL,
	`value` VARCHAR(191) NOT NULL,
	`color` VARCHAR(191) DEFAULT 'blue',
	`sort_order` BIGINT DEFAULT 0,
	`created_at` BIGINT DEFAULT 0
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE UNIQUE INDEX `organization_types_value_unique` ON `organization_types` (`value`);
CREATE TABLE IF NOT EXISTS `organizations` (
	`id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`name` LONGTEXT NOT NULL,
	`logo` LONGTEXT,
	`type` VARCHAR(191) DEFAULT 'government' NOT NULL,
	`description` LONGTEXT,
	`website` LONGTEXT,
	`is_active` BIGINT DEFAULT 1,
	`created_at` BIGINT DEFAULT 0,
	`updated_at` BIGINT DEFAULT 0
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `pages` (
	`id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`title` LONGTEXT NOT NULL,
	`slug` VARCHAR(191) NOT NULL,
	`content` LONGTEXT,
	`status` VARCHAR(191) DEFAULT 'published' NOT NULL,
	`trashed_at` BIGINT,
	`created_at` BIGINT DEFAULT 0,
	`updated_at` BIGINT DEFAULT 0
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE UNIQUE INDEX `pages_slug_unique` ON `pages` (`slug`);
CREATE TABLE IF NOT EXISTS `permissions` (
	`id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`name` LONGTEXT NOT NULL,
	`slug` VARCHAR(191) NOT NULL,
	`description` LONGTEXT,
	`module` LONGTEXT NOT NULL,
	`created_at` BIGINT DEFAULT 0
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE UNIQUE INDEX `permissions_slug_unique` ON `permissions` (`slug`);
CREATE TABLE IF NOT EXISTS `results` (
	`id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`title` LONGTEXT NOT NULL,
	`org` LONGTEXT NOT NULL,
	`organization_id` BIGINT,
	`type` LONGTEXT NOT NULL,
	`date` LONGTEXT NOT NULL,
	`details` LONGTEXT,
	`inquiry_url` LONGTEXT,
	`view_count` BIGINT DEFAULT 0 NOT NULL,
	`status` VARCHAR(191) DEFAULT 'published' NOT NULL,
	`is_active` BIGINT DEFAULT 1,
	`trashed_at` BIGINT,
	`created_at` BIGINT DEFAULT 0,
	`updated_at` BIGINT DEFAULT 0
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `seo_settings` (
	`id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`page_path` VARCHAR(191) NOT NULL,
	`title` LONGTEXT,
	`description` LONGTEXT,
	`keywords` LONGTEXT,
	`og_image` LONGTEXT,
	`canonical_url` LONGTEXT,
	`robots` VARCHAR(191) DEFAULT 'index,follow',
	`custom_meta` LONGTEXT,
	`updated_at` BIGINT DEFAULT 0
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE UNIQUE INDEX `seo_settings_page_path_unique` ON `seo_settings` (`page_path`);
CREATE TABLE IF NOT EXISTS `service_orders` (
	`id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`member_id` BIGINT,
	`order_number` VARCHAR(191) NOT NULL,
	`service_slug` LONGTEXT NOT NULL,
	`service_name` LONGTEXT NOT NULL,
	`service_variant` LONGTEXT,
	`amount` BIGINT NOT NULL,
	`customer_name` LONGTEXT NOT NULL,
	`customer_phone` LONGTEXT NOT NULL,
	`customer_email` LONGTEXT NOT NULL,
	`receipt_url` LONGTEXT NOT NULL,
	`payment_method` VARCHAR(191) DEFAULT 'bank_transfer',
	`status` VARCHAR(191) DEFAULT 'pending',
	`cancellation_reason` LONGTEXT,
	`notes` LONGTEXT,
	`created_at` BIGINT DEFAULT 0,
	`updated_at` BIGINT DEFAULT 0
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE UNIQUE INDEX `service_orders_order_number_unique` ON `service_orders` (`order_number`);
CREATE TABLE IF NOT EXISTS `services` (
	`id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`slug` VARCHAR(191) NOT NULL,
	`title` LONGTEXT NOT NULL,
	`description` LONGTEXT,
	`icon` LONGTEXT,
	`color` LONGTEXT,
	`price` BIGINT,
	`old_price` BIGINT,
	`discount` LONGTEXT,
	`variants` LONGTEXT,
	`category` VARCHAR(191) DEFAULT 'individual',
	`is_featured` BIGINT DEFAULT 0,
	`is_active` BIGINT DEFAULT 1,
	`sort_order` BIGINT DEFAULT 0,
	`created_at` BIGINT DEFAULT 0,
	`updated_at` BIGINT DEFAULT 0
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE UNIQUE INDEX `services_slug_unique` ON `services` (`slug`);
CREATE TABLE IF NOT EXISTS `site_settings` (
	`id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`key` VARCHAR(191) NOT NULL,
	`value` LONGTEXT,
	`updated_at` BIGINT DEFAULT 0
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE UNIQUE INDEX `site_settings_key_unique` ON `site_settings` (`key`);
CREATE TABLE IF NOT EXISTS `support_ticket_replies` (
	`id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`ticket_id` BIGINT NOT NULL,
	`sender_id` BIGINT NOT NULL,
	`sender_type` LONGTEXT NOT NULL,
	`message` LONGTEXT NOT NULL,
	`created_at` BIGINT DEFAULT 0
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE INDEX `support_ticket_replies_ticket_idx` ON `support_ticket_replies` (`ticket_id`);
CREATE TABLE IF NOT EXISTS `support_tickets` (
	`id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`ticket_number` VARCHAR(191) NOT NULL,
	`member_id` BIGINT NOT NULL,
	`subject` LONGTEXT NOT NULL,
	`type` VARCHAR(191) DEFAULT 'inquiry' NOT NULL,
	`status` VARCHAR(191) DEFAULT 'open' NOT NULL,
	`order_number` LONGTEXT,
	`closed_at` BIGINT,
	`last_member_reply_at` BIGINT,
	`last_admin_reply_at` BIGINT,
	`created_at` BIGINT DEFAULT 0,
	`updated_at` BIGINT DEFAULT 0
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE UNIQUE INDEX `support_tickets_ticket_number_unique` ON `support_tickets` (`ticket_number`);
CREATE INDEX `support_tickets_member_idx` ON `support_tickets` (`member_id`);
CREATE INDEX `support_tickets_status_idx` ON `support_tickets` (`status`);
CREATE TABLE IF NOT EXISTS `twitter_posts` (
	`id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`content_type` VARCHAR(191) NOT NULL,
	`content_id` BIGINT NOT NULL,
	`tweet_id` LONGTEXT,
	`tweet_url` LONGTEXT,
	`tweet_text` LONGTEXT,
	`status` VARCHAR(191) DEFAULT 'pending' NOT NULL,
	`is_auto` BIGINT DEFAULT 0,
	`published_by` BIGINT,
	`attempts` BIGINT DEFAULT 0,
	`error_message` LONGTEXT,
	`created_at` BIGINT DEFAULT 0,
	`published_at` BIGINT
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE INDEX `twitter_posts_content_idx` ON `twitter_posts` (`content_type`,`content_id`);
CREATE TABLE IF NOT EXISTS `twitter_settings` (
	`id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`enabled` BIGINT DEFAULT 0,
	`auto_jobs_general` BIGINT DEFAULT 0,
	`auto_jobs_civil` BIGINT DEFAULT 0,
	`auto_jobs_military` BIGINT DEFAULT 0,
	`auto_jobs_companies` BIGINT DEFAULT 0,
	`auto_jobs_organizations` BIGINT DEFAULT 0,
	`auto_jobs_results` BIGINT DEFAULT 0,
	`auto_blog` BIGINT DEFAULT 0,
	`default_hashtags` VARCHAR(191) DEFAULT '#وظائف_السعودية #وظائف',
	`image_source` VARCHAR(191) DEFAULT 'logo',
	`template_job` LONGTEXT,
	`template_civil` LONGTEXT,
	`template_military` LONGTEXT,
	`template_companies` LONGTEXT,
	`template_organizations` LONGTEXT,
	`template_results` LONGTEXT,
	`template_blog` LONGTEXT,
	`rate_limit_per_hour` BIGINT DEFAULT 5,
	`updated_at` BIGINT DEFAULT 0
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `weekly_subscriptions` (
	`id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`user_id` VARCHAR(191) NOT NULL,
	`email` LONGTEXT NOT NULL,
	`display_name` LONGTEXT,
	`subscribed_at` BIGINT DEFAULT 0 NOT NULL,
	`is_active` BIGINT DEFAULT 1 NOT NULL
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE UNIQUE INDEX `weekly_subscriptions_user_id_unique` ON `weekly_subscriptions` (`user_id`);
CREATE TABLE IF NOT EXISTS `weekly_summaries` (
	`id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`week_label` LONGTEXT NOT NULL,
	`generated_at` BIGINT DEFAULT 0 NOT NULL,
	`narrative` LONGTEXT NOT NULL,
	`top_jobs_section` LONGTEXT NOT NULL,
	`top_posts_section` LONGTEXT NOT NULL,
	`stats_snapshot` LONGTEXT NOT NULL,
	`ai_advice` LONGTEXT NOT NULL,
	`top_jobs_data` LONGTEXT,
	`top_posts_data` LONGTEXT,
	`stats_data` LONGTEXT
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `users` (
	`id` VARCHAR(191) PRIMARY KEY  NOT NULL,
	`email` VARCHAR(191),
	`first_name` LONGTEXT,
	`last_name` LONGTEXT,
	`profile_image_url` LONGTEXT,
	`created_at` BIGINT DEFAULT 0,
	`updated_at` BIGINT DEFAULT 0
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);
SET FOREIGN_KEY_CHECKS=1;
