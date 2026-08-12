import { sql, relations } from "drizzle-orm";
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export * from "./models/auth";

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  type: text("type").notNull().default("job"),
  icon: text("icon"),
  color: text("color"),
  description: text("description"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  parentId: integer("parent_id"),
  sortOrder: integer("sort_order").default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
});

export const organizations = sqliteTable("organizations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  logo: text("logo"),
  type: text("type").notNull().default("government"),
  description: text("description"),
  website: text("website"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
});

export const organizationTypes = sqliteTable("organization_types", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  label: text("label").notNull(),
  value: text("value").notNull().unique(),
  color: text("color").default("blue"),
  sortOrder: integer("sort_order").default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
});

export const jobs = sqliteTable("jobs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  company: text("company").notNull(),
  organizationId: integer("organization_id"),
  logo: text("logo"),
  category: text("category").notNull(),
  date: text("date").notNull(),
  location: text("location"),
  description: text("description"),
  summary: text("summary"),
  applyUrl: text("apply_url").notNull(),
  sourceUrl: text("source_url").notNull(),
  linkType: text("link_type").notNull().default("url"),
  status: text("status").notNull().default("published"),
  isFeatured: integer("is_featured", { mode: "boolean" }).default(false),
  viewCount: integer("view_count").default(0).notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  deadlineDate: integer("deadline_date", { mode: "timestamp_ms" }),
  trashedAt: integer("trashed_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
}, (t) => [
  index("jobs_status_idx").on(t.status),
  index("jobs_category_idx").on(t.category),
  index("jobs_org_idx").on(t.organizationId),
  index("jobs_created_at_idx").on(t.createdAt),
]);

export const results = sqliteTable("results", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  org: text("org").notNull(),
  organizationId: integer("organization_id"),
  type: text("type").notNull(),
  date: text("date").notNull(),
  details: text("details"),
  inquiryUrl: text("inquiry_url"),
  viewCount: integer("view_count").default(0).notNull(),
  status: text("status").notNull().default("published"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  trashedAt: integer("trashed_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
});

export const blogPosts = sqliteTable("blog_posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content"),
  image: text("image"),
  source: text("source"),
  category: text("category").notNull(),
  author: text("author").notNull(),
  date: text("date").notNull(),
  viewCount: integer("view_count").default(0).notNull(),
  status: text("status").notNull().default("published"),
  isPublished: integer("is_published", { mode: "boolean" }).default(true),
  trashedAt: integer("trashed_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
});

export const courses = sqliteTable("courses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  provider: text("provider").notNull(),
  description: text("description"),
  url: text("url"),
  image: text("image"),
  date: text("date"),
  duration: text("duration"),
  isFree: integer("is_free", { mode: "boolean" }).default(true),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  status: text("status").notNull().default("published"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
});

export const services = sqliteTable("services", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  icon: text("icon"),
  color: text("color"),
  price: integer("price"),
  oldPrice: integer("old_price"),
  discount: text("discount"),
  variants: text("variants"),
  category: text("category").default("individual"),
  isFeatured: integer("is_featured", { mode: "boolean" }).default(false),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
});

export const admins = sqliteTable("admins", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().unique(),
  name: text("name").notNull(),
  username: text("username").unique(),
  email: text("email"),
  password: text("password"),
  role: text("role").notNull().default("editor"),
  permissions: text("permissions"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
});

export const permissions = sqliteTable("permissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  module: text("module").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
});

export const ads = sqliteTable("ads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  type: text("type").notNull().default("image"),
  content: text("content"),
  description: text("description"),
  ctaText: text("cta_text"),
  titleColor: text("title_color"),
  ctaBgColor: text("cta_bg_color"),
  ctaTextColor: text("cta_text_color"),
  targetInterests: text("target_interests"),
  imageUrl: text("image_url"),
  linkUrl: text("link_url"),
  position: text("position").notNull().default("header_banner"),
  pages: text("pages"),
  startDate: integer("start_date", { mode: "timestamp_ms" }),
  endDate: integer("end_date", { mode: "timestamp_ms" }),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  priority: integer("priority").default(0),
  deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
});

export const seoSettings = sqliteTable("seo_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  pagePath: text("page_path").notNull().unique(),
  title: text("title"),
  description: text("description"),
  keywords: text("keywords"),
  ogImage: text("og_image"),
  canonicalUrl: text("canonical_url"),
  robots: text("robots").default("index,follow"),
  customMeta: text("custom_meta"),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
});

export const siteSettings = sqliteTable("site_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value"),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
});

export const media = sqliteTable("media", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  filename: text("filename").notNull(),
  objectPath: text("object_path").notNull(),
  url: text("url").notNull(),
  mimeType: text("mime_type"),
  size: integer("size"),
  width: integer("width"),
  height: integer("height"),
  alt: text("alt"),
  uploadedBy: text("uploaded_by"),
  category: text("category").default("general").notNull(),
  deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
});

export const pages = sqliteTable("pages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content"),
  status: text("status").notNull().default("published"),
  trashedAt: integer("trashed_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
});

// Community Tables

export const memberRanks = sqliteTable("member_ranks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  color: text("color").default("#6b7280"),
  icon: text("icon"),
  minPosts: integer("min_posts").default(0),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
});

export const communityMembers = sqliteTable("community_members", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().unique(),
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  avatar: text("avatar"),
  bio: text("bio"),
  phone: text("phone"),
  email: text("email"),
  password: text("password"),
  provider: text("provider").default("email"), // google, apple, email
  role: text("role").default("new_member"), // new_member, member, moderator, admin
  rankId: integer("rank_id"),
  postsCount: integer("posts_count").default(0),
  commentsCount: integer("comments_count").default(0),
  likesReceived: integer("likes_received").default(0),
  isBanned: integer("is_banned", { mode: "boolean" }).default(false),
  isVerified: integer("is_verified", { mode: "boolean" }).default(false),
  lastActive: integer("last_active", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
  cvAnalysisUsed: integer("cv_analysis_used").default(0),
  cvAnalysisResetAt: integer("cv_analysis_reset_at", { mode: "timestamp_ms" }),
  cvAnalysisPaidCredits: integer("cv_analysis_paid_credits").default(0),
  cvAnalysisPaidCreditsExpiresAt: integer("cv_analysis_paid_credits_expires_at", { mode: "timestamp_ms" }),
  jobAlertPoints: integer("job_alert_points").default(100),
  jobAlertPaidPoints: integer("job_alert_paid_points").default(0),
});

export const communityCategories = sqliteTable("community_categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  icon: text("icon"),
  color: text("color"),
  postsCount: integer("posts_count").default(0),
  sortOrder: integer("sort_order").default(0),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
});

export const communityPosts = sqliteTable("community_posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  memberId: integer("member_id").notNull(),
  categoryId: integer("category_id").notNull(),
  likesCount: integer("likes_count").default(0),
  commentsCount: integer("comments_count").default(0),
  viewsCount: integer("views_count").default(0),
  isPinned: integer("is_pinned", { mode: "boolean" }).default(false),
  isFeatured: integer("is_featured", { mode: "boolean" }).default(false),
  isLocked: integer("is_locked", { mode: "boolean" }).default(false),
  status: text("status").notNull().default("published"),
  trashedAt: integer("trashed_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
}, (t) => [
  index("community_posts_member_idx").on(t.memberId),
  index("community_posts_category_idx").on(t.categoryId),
  index("community_posts_status_idx").on(t.status),
  index("community_posts_created_at_idx").on(t.createdAt),
]);

export const communityComments = sqliteTable("community_comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  content: text("content").notNull(),
  postId: integer("post_id").notNull(),
  memberId: integer("member_id").notNull(),
  parentId: integer("parent_id"),
  likesCount: integer("likes_count").default(0),
  status: text("status").notNull().default("published"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
}, (t) => [
  index("community_comments_post_idx").on(t.postId),
  index("community_comments_member_idx").on(t.memberId),
]);

export const communityLikes = sqliteTable("community_likes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  memberId: integer("member_id").notNull(),
  postId: integer("post_id"),
  commentId: integer("comment_id"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
}, (t) => [
  index("community_likes_member_idx").on(t.memberId),
  index("community_likes_post_idx").on(t.postId),
]);

export const communityReports = sqliteTable("community_reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  reporterId: integer("reporter_id").notNull(),
  postId: integer("post_id"),
  commentId: integer("comment_id"),
  memberId: integer("member_id"),
  reason: text("reason").notNull(),
  details: text("details"),
  status: text("status").notNull().default("pending"),
  resolvedBy: integer("resolved_by"),
  resolvedAt: integer("resolved_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
});

export const communityModeratorRequests = sqliteTable("community_moderator_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  memberId: integer("member_id").notNull(),
  categoryId: integer("category_id").notNull(),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("pending"),
  resolvedBy: integer("resolved_by"),
  resolvedAt: integer("resolved_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
});

export const communityModerators = sqliteTable("community_moderators", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  memberId: integer("member_id").notNull(),
  categoryId: integer("category_id"),
  permissionId: integer("permission_id"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  assignedBy: integer("assigned_by"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
});

export const communityModeratorPermissions = sqliteTable("community_moderator_permissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  canManagePosts: integer("can_manage_posts", { mode: "boolean" }).default(false),
  canManageComments: integer("can_manage_comments", { mode: "boolean" }).default(false),
  canManageMembers: integer("can_manage_members", { mode: "boolean" }).default(false),
  canBanMembers: integer("can_ban_members", { mode: "boolean" }).default(false),
  canManageCategories: integer("can_manage_categories", { mode: "boolean" }).default(false),
  canPinPosts: integer("can_pin_posts", { mode: "boolean" }).default(false),
  canFeaturePosts: integer("can_feature_posts", { mode: "boolean" }).default(false),
  canLockPosts: integer("can_lock_posts", { mode: "boolean" }).default(false),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
});

// Community Notifications
export const communityNotifications = sqliteTable("community_notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  memberId: integer("member_id").notNull(), // الشخص الذي يستلم التنبيه
  actorId: integer("actor_id").notNull(), // الشخص الذي قام بالفعل
  type: text("type").notNull(), // reply_post, reply_comment, like_post, like_comment
  postId: integer("post_id"),
  commentId: integer("comment_id"),
  message: text("message"),
  link: text("link"),
  isRead: integer("is_read", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
}, (t) => [
  index("community_notif_member_idx").on(t.memberId),
  index("community_notif_read_idx").on(t.isRead),
]);

// Job Favorites
export const jobFavorites = sqliteTable("job_favorites", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  memberId: integer("member_id").notNull(),
  jobId: integer("job_id").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
}, (t) => [
  index("job_favorites_member_idx").on(t.memberId),
  index("job_favorites_job_idx").on(t.jobId),
]);

export const insertCategorySchema = createInsertSchema(categories).omit({ id: true, createdAt: true });
export const insertOrganizationSchema = createInsertSchema(organizations).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOrganizationTypeSchema = createInsertSchema(organizationTypes).omit({ id: true, createdAt: true });
export const insertJobSchema = createInsertSchema(jobs).omit({ id: true, createdAt: true, updatedAt: true });
export const insertResultSchema = createInsertSchema(results).omit({ id: true, createdAt: true, updatedAt: true });
export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCourseSchema = createInsertSchema(courses).omit({ id: true, createdAt: true, updatedAt: true });
export const insertServiceSchema = createInsertSchema(services).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAdminSchema = createInsertSchema(admins).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPermissionSchema = createInsertSchema(permissions).omit({ id: true, createdAt: true });
export const insertAdSchema = createInsertSchema(ads).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSeoSettingSchema = createInsertSchema(seoSettings).omit({ id: true, updatedAt: true });
export const insertSiteSettingSchema = createInsertSchema(siteSettings).omit({ id: true, updatedAt: true });
export const insertMediaSchema = createInsertSchema(media).omit({ id: true, createdAt: true });
export const insertPageSchema = createInsertSchema(pages).omit({ id: true, createdAt: true, updatedAt: true });

// Community Insert Schemas
export const insertMemberRankSchema = createInsertSchema(memberRanks).omit({ id: true, createdAt: true });
export const insertCommunityMemberSchema = createInsertSchema(communityMembers).omit({ id: true, createdAt: true, postsCount: true, commentsCount: true, likesReceived: true, lastActive: true });
export const insertCommunityCategorySchema = createInsertSchema(communityCategories).omit({ id: true, createdAt: true, postsCount: true });
export const insertCommunityPostSchema = createInsertSchema(communityPosts).omit({ id: true, createdAt: true, updatedAt: true, likesCount: true, commentsCount: true, viewsCount: true });
export const insertCommunityCommentSchema = createInsertSchema(communityComments).omit({ id: true, createdAt: true, updatedAt: true, likesCount: true });
export const insertCommunityLikeSchema = createInsertSchema(communityLikes).omit({ id: true, createdAt: true });
export const insertCommunityReportSchema = createInsertSchema(communityReports).omit({ id: true, createdAt: true, resolvedAt: true });
export const insertCommunityModeratorRequestSchema = createInsertSchema(communityModeratorRequests).omit({ id: true, createdAt: true, resolvedAt: true });
export const insertCommunityModeratorSchema = createInsertSchema(communityModerators).omit({ id: true, createdAt: true });
export const insertCommunityModeratorPermissionSchema = createInsertSchema(communityModeratorPermissions).omit({ id: true, createdAt: true });
export const insertCommunityNotificationSchema = createInsertSchema(communityNotifications).omit({ id: true, createdAt: true });
export const insertJobFavoriteSchema = createInsertSchema(jobFavorites).omit({ id: true, createdAt: true });

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;

export type OrganizationType = typeof organizationTypes.$inferSelect;
export type InsertOrganizationType = z.infer<typeof insertOrganizationTypeSchema>;

export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;

export type Result = typeof results.$inferSelect;
export type InsertResult = z.infer<typeof insertResultSchema>;

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;

export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;

export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;

export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = z.infer<typeof insertAdminSchema>;

export type Permission = typeof permissions.$inferSelect;
export type InsertPermission = z.infer<typeof insertPermissionSchema>;

export type Ad = typeof ads.$inferSelect;
export type InsertAd = z.infer<typeof insertAdSchema>;

export type SeoSetting = typeof seoSettings.$inferSelect;
export type InsertSeoSetting = z.infer<typeof insertSeoSettingSchema>;

export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertSiteSetting = z.infer<typeof insertSiteSettingSchema>;

export type Media = typeof media.$inferSelect;
export type InsertMedia = z.infer<typeof insertMediaSchema>;

export type Page = typeof pages.$inferSelect;
export type InsertPage = z.infer<typeof insertPageSchema>;

// Community Types
export type MemberRank = typeof memberRanks.$inferSelect;
export type InsertMemberRank = z.infer<typeof insertMemberRankSchema>;

export type CommunityMember = typeof communityMembers.$inferSelect;
export type InsertCommunityMember = z.infer<typeof insertCommunityMemberSchema>;

export type CommunityCategory = typeof communityCategories.$inferSelect;
export type InsertCommunityCategory = z.infer<typeof insertCommunityCategorySchema>;

export type CommunityPost = typeof communityPosts.$inferSelect;
export type InsertCommunityPost = z.infer<typeof insertCommunityPostSchema>;

export type CommunityComment = typeof communityComments.$inferSelect;
export type InsertCommunityComment = z.infer<typeof insertCommunityCommentSchema>;

export type CommunityLike = typeof communityLikes.$inferSelect;
export type InsertCommunityLike = z.infer<typeof insertCommunityLikeSchema>;

export type CommunityReport = typeof communityReports.$inferSelect;
export type InsertCommunityReport = z.infer<typeof insertCommunityReportSchema>;

export type CommunityModeratorRequest = typeof communityModeratorRequests.$inferSelect;
export type InsertCommunityModeratorRequest = z.infer<typeof insertCommunityModeratorRequestSchema>;

export type CommunityModerator = typeof communityModerators.$inferSelect;
export type InsertCommunityModerator = z.infer<typeof insertCommunityModeratorSchema>;

export type CommunityModeratorPermission = typeof communityModeratorPermissions.$inferSelect;
export type InsertCommunityModeratorPermission = z.infer<typeof insertCommunityModeratorPermissionSchema>;

export type CommunityNotification = typeof communityNotifications.$inferSelect;
export type InsertCommunityNotification = z.infer<typeof insertCommunityNotificationSchema>;

export type JobFavorite = typeof jobFavorites.$inferSelect;
export type InsertJobFavorite = z.infer<typeof insertJobFavoriteSchema>;

// Organization Follows
export const organizationFollows = sqliteTable("organization_follows", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  memberId: integer("member_id").notNull(),
  organizationId: integer("organization_id").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
}, (t) => [
  index("org_follows_member_idx").on(t.memberId),
  index("org_follows_org_idx").on(t.organizationId),
]);

export const insertOrganizationFollowSchema = createInsertSchema(organizationFollows).omit({ id: true, createdAt: true });
export type OrganizationFollow = typeof organizationFollows.$inferSelect;
export type InsertOrganizationFollow = z.infer<typeof insertOrganizationFollowSchema>;

// Job Alert Preferences — per-member category subscriptions for push/in-app alerts
export const jobAlertPreferences = sqliteTable("job_alert_preferences", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  memberId: integer("member_id").notNull().unique(),
  categories: text("categories", { mode: "json" }).$type<string[]>().notNull().default([]),
  isEnabled: integer("is_enabled", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
}, (t) => [
  index("job_alert_prefs_member_idx").on(t.memberId),
]);

export const insertJobAlertPreferencesSchema = createInsertSchema(jobAlertPreferences).omit({ id: true, createdAt: true, updatedAt: true });
export type JobAlertPreferences = typeof jobAlertPreferences.$inferSelect;
export type InsertJobAlertPreferences = z.infer<typeof insertJobAlertPreferencesSchema>;

// Member Push Tokens — Expo push tokens for mobile push notifications
export const memberPushTokens = sqliteTable("member_push_tokens", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  memberId: integer("member_id").notNull(),
  token: text("token").notNull().unique(),
  platform: text("platform"), // ios, android, web
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
}, (t) => [
  index("member_push_tokens_member_idx").on(t.memberId),
]);

export const insertMemberPushTokenSchema = createInsertSchema(memberPushTokens).omit({ id: true, createdAt: true, updatedAt: true });
export type MemberPushToken = typeof memberPushTokens.$inferSelect;
export type InsertMemberPushToken = z.infer<typeof insertMemberPushTokenSchema>;

// Job Alert Sent — dedup table to prevent double notifications
export const jobAlertSent = sqliteTable("job_alert_sent", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  memberId: integer("member_id").notNull(),
  jobId: integer("job_id").notNull(),
  sentAt: integer("sent_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
}, (t) => [
  index("job_alert_sent_member_idx").on(t.memberId),
  index("job_alert_sent_job_idx").on(t.jobId),
]);

// Online visitors tracking
export const onlineVisitors = sqliteTable("online_visitors", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: text("session_id").notNull().unique(),
  currentPage: text("current_page"),
  lastSeen: integer("last_seen", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
});

export const insertOnlineVisitorSchema = createInsertSchema(onlineVisitors).omit({ id: true, createdAt: true });
export type OnlineVisitor = typeof onlineVisitors.$inferSelect;
export type InsertOnlineVisitor = z.infer<typeof insertOnlineVisitorSchema>;

// Service Orders
export const serviceOrders = sqliteTable("service_orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  memberId: integer("member_id"), // linked community member (required for new orders)
  orderNumber: text("order_number").notNull().unique(),
  serviceSlug: text("service_slug").notNull(),
  serviceName: text("service_name").notNull(),
  serviceVariant: text("service_variant"),
  amount: integer("amount").notNull(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerEmail: text("customer_email").notNull(),
  receiptUrl: text("receipt_url").notNull(),
  paymentMethod: text("payment_method").default("bank_transfer"),
  status: text("status").default("pending"), // pending, in_progress, completed, cancelled
  cancellationReason: text("cancellation_reason"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
});

export const insertServiceOrderSchema = createInsertSchema(serviceOrders).omit({ id: true, createdAt: true, updatedAt: true });
export type ServiceOrder = typeof serviceOrders.$inferSelect;
export type InsertServiceOrder = z.infer<typeof insertServiceOrderSchema>;

// Community persistent tokens (DB-backed, survive server restarts)
export const communityTokensTable = sqliteTable("community_tokens", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  token: text("token").notNull().unique(),
  memberId: integer("member_id").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
});

export const announcements = sqliteTable("announcements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  body: text("body").notNull(),
  targetAudience: text("target_audience").notNull().default("all"),
  status: text("status").notNull().default("active"),
  startDate: integer("start_date", { mode: "timestamp_ms" }),
  endDate: integer("end_date", { mode: "timestamp_ms" }),
  imageUrl: text("image_url"),
  linkUrl: text("link_url"),
  linkButtonText: text("link_button_text"),
  createdBy: integer("created_by"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
});

export const insertAnnouncementSchema = createInsertSchema(announcements).omit({ id: true, createdAt: true });
export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;

export const jobReports = sqliteTable("job_reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  jobId: integer("job_id").notNull(),
  reporterName: text("reporter_name"),
  reporterEmail: text("reporter_email"),
  memberId: integer("member_id"),
  reason: text("reason").notNull(),
  details: text("details"),
  status: text("status").notNull().default("pending"),
  resolvedBy: integer("resolved_by"),
  resolvedAt: integer("resolved_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
});

export const insertJobReportSchema = createInsertSchema(jobReports).omit({ id: true, createdAt: true, resolvedAt: true });
export type JobReport = typeof jobReports.$inferSelect;
export type InsertJobReport = z.infer<typeof insertJobReportSchema>;

export const weeklySummaries = sqliteTable("weekly_summaries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  weekLabel: text("week_label").notNull(),
  generatedAt: integer("generated_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`).notNull(),
  narrative: text("narrative").notNull(),
  topJobsSection: text("top_jobs_section").notNull(),
  topPostsSection: text("top_posts_section").notNull(),
  statsSnapshot: text("stats_snapshot").notNull(),
  aiAdvice: text("ai_advice").notNull(),
  topJobsData: text("top_jobs_data"),
  topPostsData: text("top_posts_data"),
  statsData: text("stats_data"),
});

export const insertWeeklySummarySchema = createInsertSchema(weeklySummaries).omit({ id: true, generatedAt: true });
export type WeeklySummary = typeof weeklySummaries.$inferSelect;
export type InsertWeeklySummary = z.infer<typeof insertWeeklySummarySchema>;

export const weeklySubscriptions = sqliteTable("weekly_subscriptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().unique(),
  email: text("email").notNull(),
  displayName: text("display_name"),
  subscribedAt: integer("subscribed_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`).notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
});

export const insertWeeklySubscriptionSchema = createInsertSchema(weeklySubscriptions).omit({ id: true, subscribedAt: true });
export type WeeklySubscription = typeof weeklySubscriptions.$inferSelect;
export type InsertWeeklySubscription = z.infer<typeof insertWeeklySubscriptionSchema>;

// Employer Jobs — user submitted job listings (require admin approval)
export const employerJobs = sqliteTable("employer_jobs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  company: text("company").notNull(),
  region: text("region"),
  city: text("city"),
  workSchedule: text("work_schedule"),
  workMode: text("work_mode"),
  description: text("description").notNull(),
  requirements: text("requirements"),
  targetGender: text("target_gender").notNull().default("all"),
  targetNationality: text("target_nationality").notNull().default("all"),
  contactMethod: text("contact_method").notNull().default("email"),
  contactValue: text("contact_value").notNull(),
  submitterName: text("submitter_name").notNull(),
  submitterEmail: text("submitter_email").notNull(),
  status: text("status").notNull().default("pending"),
  deadlineDate: integer("deadline_date", { mode: "timestamp_ms" }),
  viewCount: integer("view_count").default(0).notNull(),
  trashedAt: integer("trashed_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
}, (t) => [
  index("employer_jobs_status_idx").on(t.status),
  index("employer_jobs_region_idx").on(t.region),
  index("employer_jobs_created_at_idx").on(t.createdAt),
]);

export const insertEmployerJobSchema = createInsertSchema(employerJobs).omit({ id: true, createdAt: true, updatedAt: true, viewCount: true });
export type EmployerJob = typeof employerJobs.$inferSelect;
export type InsertEmployerJob = z.infer<typeof insertEmployerJobSchema>;

// Reports on employer job listings
export const employerJobReports = sqliteTable("employer_job_reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  employerJobId: integer("employer_job_id").notNull(),
  reporterName: text("reporter_name"),
  reporterEmail: text("reporter_email"),
  reason: text("reason").notNull(),
  details: text("details"),
  status: text("status").notNull().default("pending"),
  resolvedAt: integer("resolved_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
}, (t) => [
  index("employer_job_reports_job_idx").on(t.employerJobId),
  index("employer_job_reports_status_idx").on(t.status),
]);

export const insertEmployerJobReportSchema = createInsertSchema(employerJobReports).omit({ id: true, createdAt: true, resolvedAt: true });
export type EmployerJobReport = typeof employerJobReports.$inferSelect;
export type InsertEmployerJobReport = z.infer<typeof insertEmployerJobReportSchema>;

// CV Analysis History — each analysis attempt
export const cvAnalysisHistory = sqliteTable("cv_analysis_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  memberId: integer("member_id").notNull(),
  jobId: integer("job_id"),
  jobTitle: text("job_title").notNull(),
  jobCompany: text("job_company"),
  jobCategory: text("job_category"),
  matchPercentage: integer("match_percentage").notNull(),
  creditType: text("credit_type").notNull().default("free"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
}, (t) => [
  index("cv_analysis_history_member_idx").on(t.memberId),
  index("cv_analysis_history_created_idx").on(t.createdAt),
]);

export const insertCvAnalysisHistorySchema = createInsertSchema(cvAnalysisHistory).omit({ id: true, createdAt: true });
export type CvAnalysisHistory = typeof cvAnalysisHistory.$inferSelect;
export type InsertCvAnalysisHistory = z.infer<typeof insertCvAnalysisHistorySchema>;

// Job Application Credits — balance per member
export const jobApplicationCredits = sqliteTable("job_application_credits", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  memberId: integer("member_id").notNull().unique(),
  balance: integer("balance").default(0).notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
});

export const insertJobApplicationCreditsSchema = createInsertSchema(jobApplicationCredits).omit({ id: true, updatedAt: true });
export type JobApplicationCredits = typeof jobApplicationCredits.$inferSelect;
export type InsertJobApplicationCredits = z.infer<typeof insertJobApplicationCreditsSchema>;

// Job Application Requests — each time a member uses a credit to request applying to a job
export const jobApplicationRequests = sqliteTable("job_application_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  memberId: integer("member_id").notNull(),
  jobId: integer("job_id").notNull(),
  jobTitle: text("job_title").notNull(),
  jobCompany: text("job_company"),
  jobApplyUrl: text("job_apply_url").notNull(),
  requestNumber: text("request_number").notNull().unique(),
  status: text("status").default("pending").notNull(),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
}, (t) => [
  index("job_app_requests_member_idx").on(t.memberId),
  index("job_app_requests_status_idx").on(t.status),
]);

export const insertJobApplicationRequestSchema = createInsertSchema(jobApplicationRequests).omit({ id: true, createdAt: true, updatedAt: true });
export type JobApplicationRequest = typeof jobApplicationRequests.$inferSelect;
export type InsertJobApplicationRequest = z.infer<typeof insertJobApplicationRequestSchema>;

// Support Tickets
export const supportTickets = sqliteTable("support_tickets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ticketNumber: text("ticket_number").notNull().unique(),
  memberId: integer("member_id").notNull(),
  subject: text("subject").notNull(),
  type: text("type").notNull().default("inquiry"),
  status: text("status").notNull().default("open"),
  orderNumber: text("order_number"),
  closedAt: integer("closed_at", { mode: "timestamp_ms" }),
  lastMemberReplyAt: integer("last_member_reply_at", { mode: "timestamp_ms" }),
  lastAdminReplyAt: integer("last_admin_reply_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
}, (t) => [
  index("support_tickets_member_idx").on(t.memberId),
  index("support_tickets_status_idx").on(t.status),
]);

export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({ id: true, createdAt: true, updatedAt: true });
export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;

// Support Ticket Replies
export const supportTicketReplies = sqliteTable("support_ticket_replies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ticketId: integer("ticket_id").notNull(),
  senderId: integer("sender_id").notNull(),
  senderType: text("sender_type").notNull(),
  message: text("message").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
}, (t) => [
  index("support_ticket_replies_ticket_idx").on(t.ticketId),
]);

export const insertSupportTicketReplySchema = createInsertSchema(supportTicketReplies).omit({ id: true, createdAt: true });
export type SupportTicketReply = typeof supportTicketReplies.$inferSelect;
export type InsertSupportTicketReply = z.infer<typeof insertSupportTicketReplySchema>;

// FAQ Categories
export const faqCategories = sqliteTable("faq_categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
});

export const insertFaqCategorySchema = createInsertSchema(faqCategories).omit({ id: true, createdAt: true });
export type FaqCategory = typeof faqCategories.$inferSelect;
export type InsertFaqCategory = z.infer<typeof insertFaqCategorySchema>;

// FAQ Items
export const faqItems = sqliteTable("faq_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  category: text("category").default("general"),
  sortOrder: integer("sort_order").notNull().default(0),
  isPublished: integer("is_published", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
});

export const insertFaqItemSchema = createInsertSchema(faqItems).omit({ id: true, createdAt: true, updatedAt: true });
export type FaqItem = typeof faqItems.$inferSelect;
export type InsertFaqItem = z.infer<typeof insertFaqItemSchema>;

export const dailyMarketSnapshots = sqliteTable("daily_market_snapshots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  generatedAt: integer("generated_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`).notNull(),
  periodStart: integer("period_start", { mode: "timestamp_ms" }).notNull(),
  snapshotData: text("snapshot_data").notNull(),
});
export const insertDailyMarketSnapshotSchema = createInsertSchema(dailyMarketSnapshots).omit({ id: true, generatedAt: true });
export type DailyMarketSnapshot = typeof dailyMarketSnapshots.$inferSelect;
export type InsertDailyMarketSnapshot = z.infer<typeof insertDailyMarketSnapshotSchema>;

// Dedicated blog categories table (separate from generic categories)
export const blogCategories = sqliteTable("blog_categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  sortOrder: integer("sort_order").default(0),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
});
export const insertBlogCategorySchema = createInsertSchema(blogCategories).omit({ id: true, createdAt: true });
export type BlogCategory = typeof blogCategories.$inferSelect;
export type InsertBlogCategory = z.infer<typeof insertBlogCategorySchema>;

export const creditAdjustments = sqliteTable("credit_adjustments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  memberId: integer("member_id").notNull(),
  type: text("type").notNull(),
  operation: text("operation").notNull(),
  amount: integer("amount").notNull(),
  reason: text("reason"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
});
export const insertCreditAdjustmentSchema = createInsertSchema(creditAdjustments).omit({ id: true, createdAt: true });
export type CreditAdjustment = typeof creditAdjustments.$inferSelect;
export type InsertCreditAdjustment = z.infer<typeof insertCreditAdjustmentSchema>;

// ─── Twitter / X Publishing ──────────────────────────────────────────────────
export const twitterSettings = sqliteTable("twitter_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  enabled: integer("enabled", { mode: "boolean" }).default(false),
  autoJobsGeneral: integer("auto_jobs_general", { mode: "boolean" }).default(false),
  autoJobsCivil: integer("auto_jobs_civil", { mode: "boolean" }).default(false),
  autoJobsMilitary: integer("auto_jobs_military", { mode: "boolean" }).default(false),
  autoJobsCompanies: integer("auto_jobs_companies", { mode: "boolean" }).default(false),
  autoJobsOrganizations: integer("auto_jobs_organizations", { mode: "boolean" }).default(false),
  autoJobsResults: integer("auto_jobs_results", { mode: "boolean" }).default(false),
  autoBlog: integer("auto_blog", { mode: "boolean" }).default(false),
  defaultHashtags: text("default_hashtags").default("#وظائف_السعودية #وظائف"),
  imageSource: text("image_source").default("logo"),
  templateJob: text("template_job"),
  templateCivil: text("template_civil"),
  templateMilitary: text("template_military"),
  templateCompanies: text("template_companies"),
  templateOrganizations: text("template_organizations"),
  templateResults: text("template_results"),
  templateBlog: text("template_blog"),
  rateLimitPerHour: integer("rate_limit_per_hour").default(5),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
});
export const insertTwitterSettingsSchema = createInsertSchema(twitterSettings).omit({ id: true });
export type TwitterSettings = typeof twitterSettings.$inferSelect;

export const twitterPosts = sqliteTable("twitter_posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  contentType: text("content_type").notNull(),
  contentId: integer("content_id").notNull(),
  tweetId: text("tweet_id"),
  tweetUrl: text("tweet_url"),
  tweetText: text("tweet_text"),
  status: text("status").notNull().default("pending"),
  isAuto: integer("is_auto", { mode: "boolean" }).default(false),
  publishedBy: integer("published_by"),
  attempts: integer("attempts").default(0),
  errorMessage: text("error_message"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
  publishedAt: integer("published_at", { mode: "timestamp_ms" }),
}, (t) => [
  index("twitter_posts_content_idx").on(t.contentType, t.contentId),
]);
export const insertTwitterPostSchema = createInsertSchema(twitterPosts).omit({ id: true, createdAt: true });
export type TwitterPost = typeof twitterPosts.$inferSelect;
