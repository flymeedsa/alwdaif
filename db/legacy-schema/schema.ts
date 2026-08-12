import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, serial, timestamp, boolean, integer, unique, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export * from "./models/auth";

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  type: varchar("type", { length: 50 }).notNull().default("job"),
  icon: varchar("icon", { length: 50 }),
  color: varchar("color", { length: 20 }),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  parentId: integer("parent_id"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  logo: varchar("logo", { length: 500 }),
  type: varchar("type", { length: 100 }).notNull().default("government"),
  description: text("description"),
  website: varchar("website", { length: 500 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const organizationTypes = pgTable("organization_types", {
  id: serial("id").primaryKey(),
  label: varchar("label", { length: 100 }).notNull(),
  value: varchar("value", { length: 100 }).notNull().unique(),
  color: varchar("color", { length: 50 }).default("blue"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  company: varchar("company", { length: 255 }).notNull(),
  organizationId: integer("organization_id"),
  logo: varchar("logo", { length: 500 }),
  category: varchar("category", { length: 100 }).notNull(),
  date: varchar("date", { length: 50 }).notNull(),
  location: varchar("location", { length: 255 }),
  description: text("description"),
  summary: text("summary"),
  applyUrl: varchar("apply_url", { length: 500 }).notNull(),
  sourceUrl: varchar("source_url", { length: 500 }).notNull(),
  linkType: varchar("link_type", { length: 20 }).notNull().default("url"),
  status: varchar("status", { length: 20 }).notNull().default("published"),
  isFeatured: boolean("is_featured").default(false),
  viewCount: integer("view_count").default(0).notNull(),
  isActive: boolean("is_active").default(true),
  deadlineDate: timestamp("deadline_date"),
  trashedAt: timestamp("trashed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  index("jobs_status_idx").on(t.status),
  index("jobs_category_idx").on(t.category),
  index("jobs_org_idx").on(t.organizationId),
  index("jobs_created_at_idx").on(t.createdAt),
]);

export const results = pgTable("results", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  org: varchar("org", { length: 255 }).notNull(),
  organizationId: integer("organization_id"),
  type: varchar("type", { length: 100 }).notNull(),
  date: varchar("date", { length: 50 }).notNull(),
  details: text("details"),
  inquiryUrl: varchar("inquiry_url", { length: 500 }),
  viewCount: integer("view_count").default(0).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("published"),
  isActive: boolean("is_active").default(true),
  trashedAt: timestamp("trashed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content"),
  image: varchar("image", { length: 500 }),
  source: varchar("source", { length: 255 }),
  category: varchar("category", { length: 100 }).notNull(),
  author: varchar("author", { length: 100 }).notNull(),
  date: varchar("date", { length: 50 }).notNull(),
  viewCount: integer("view_count").default(0).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("published"),
  isPublished: boolean("is_published").default(true),
  trashedAt: timestamp("trashed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  provider: varchar("provider", { length: 255 }).notNull(),
  description: text("description"),
  url: varchar("url", { length: 500 }),
  image: varchar("image", { length: 500 }),
  date: varchar("date", { length: 50 }),
  duration: varchar("duration", { length: 100 }),
  isFree: boolean("is_free").default(true),
  isActive: boolean("is_active").default(true),
  status: varchar("status", { length: 20 }).notNull().default("published"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }),
  color: varchar("color", { length: 100 }),
  price: integer("price"),
  oldPrice: integer("old_price"),
  discount: varchar("discount", { length: 20 }),
  variants: text("variants"),
  category: varchar("category", { length: 50 }).default("individual"),
  isFeatured: boolean("is_featured").default(false),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  username: varchar("username", { length: 100 }).unique(),
  email: varchar("email", { length: 255 }),
  password: varchar("password", { length: 255 }),
  role: varchar("role", { length: 50 }).notNull().default("editor"),
  permissions: text("permissions"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  module: varchar("module", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ads = pgTable("ads", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull().default("image"),
  content: text("content"),
  description: text("description"),
  ctaText: varchar("cta_text", { length: 100 }),
  titleColor: varchar("title_color", { length: 30 }),
  ctaBgColor: varchar("cta_bg_color", { length: 30 }),
  ctaTextColor: varchar("cta_text_color", { length: 30 }),
  targetInterests: text("target_interests"),
  imageUrl: varchar("image_url", { length: 500 }),
  linkUrl: varchar("link_url", { length: 500 }),
  position: varchar("position", { length: 50 }).notNull().default("header_banner"),
  pages: text("pages"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").default(true),
  priority: integer("priority").default(0),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const seoSettings = pgTable("seo_settings", {
  id: serial("id").primaryKey(),
  pagePath: varchar("page_path", { length: 255 }).notNull().unique(),
  title: varchar("title", { length: 255 }),
  description: text("description"),
  keywords: text("keywords"),
  ogImage: varchar("og_image", { length: 500 }),
  canonicalUrl: varchar("canonical_url", { length: 500 }),
  robots: varchar("robots", { length: 100 }).default("index,follow"),
  customMeta: text("custom_meta"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const media = pgTable("media", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  objectPath: varchar("object_path", { length: 500 }).notNull(),
  url: varchar("url", { length: 500 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }),
  size: integer("size"),
  width: integer("width"),
  height: integer("height"),
  alt: varchar("alt", { length: 255 }),
  uploadedBy: varchar("uploaded_by", { length: 255 }),
  category: varchar("category", { length: 50 }).default("general").notNull(),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pages = pgTable("pages", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  content: text("content"),
  status: varchar("status", { length: 20 }).notNull().default("published"),
  trashedAt: timestamp("trashed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Community Tables

export const memberRanks = pgTable("member_ranks", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  color: varchar("color", { length: 20 }).default("#6b7280"),
  icon: varchar("icon", { length: 50 }),
  minPosts: integer("min_posts").default(0),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const communityMembers = pgTable("community_members", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull().unique(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  displayName: varchar("display_name", { length: 255 }).notNull(),
  avatar: text("avatar"),
  bio: text("bio"),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  password: varchar("password", { length: 255 }),
  provider: varchar("provider", { length: 50 }).default("email"), // google, apple, email
  role: varchar("role", { length: 50 }).default("new_member"), // new_member, member, moderator, admin
  rankId: integer("rank_id"),
  postsCount: integer("posts_count").default(0),
  commentsCount: integer("comments_count").default(0),
  likesReceived: integer("likes_received").default(0),
  isBanned: boolean("is_banned").default(false),
  isVerified: boolean("is_verified").default(false),
  lastActive: timestamp("last_active").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  cvAnalysisUsed: integer("cv_analysis_used").default(0),
  cvAnalysisResetAt: timestamp("cv_analysis_reset_at"),
  cvAnalysisPaidCredits: integer("cv_analysis_paid_credits").default(0),
  cvAnalysisPaidCreditsExpiresAt: timestamp("cv_analysis_paid_credits_expires_at"),
  jobAlertPoints: integer("job_alert_points").default(100),
  jobAlertPaidPoints: integer("job_alert_paid_points").default(0),
});

export const communityCategories = pgTable("community_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }),
  color: varchar("color", { length: 20 }),
  postsCount: integer("posts_count").default(0),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const communityPosts = pgTable("community_posts", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content").notNull(),
  memberId: integer("member_id").notNull(),
  categoryId: integer("category_id").notNull(),
  likesCount: integer("likes_count").default(0),
  commentsCount: integer("comments_count").default(0),
  viewsCount: integer("views_count").default(0),
  isPinned: boolean("is_pinned").default(false),
  isFeatured: boolean("is_featured").default(false),
  isLocked: boolean("is_locked").default(false),
  status: varchar("status", { length: 20 }).notNull().default("published"),
  trashedAt: timestamp("trashed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  index("community_posts_member_idx").on(t.memberId),
  index("community_posts_category_idx").on(t.categoryId),
  index("community_posts_status_idx").on(t.status),
  index("community_posts_created_at_idx").on(t.createdAt),
]);

export const communityComments = pgTable("community_comments", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  postId: integer("post_id").notNull(),
  memberId: integer("member_id").notNull(),
  parentId: integer("parent_id"),
  likesCount: integer("likes_count").default(0),
  status: varchar("status", { length: 20 }).notNull().default("published"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  index("community_comments_post_idx").on(t.postId),
  index("community_comments_member_idx").on(t.memberId),
]);

export const communityLikes = pgTable("community_likes", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").notNull(),
  postId: integer("post_id"),
  commentId: integer("comment_id"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [
  index("community_likes_member_idx").on(t.memberId),
  index("community_likes_post_idx").on(t.postId),
]);

export const communityReports = pgTable("community_reports", {
  id: serial("id").primaryKey(),
  reporterId: integer("reporter_id").notNull(),
  postId: integer("post_id"),
  commentId: integer("comment_id"),
  memberId: integer("member_id"),
  reason: varchar("reason", { length: 100 }).notNull(),
  details: text("details"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  resolvedBy: integer("resolved_by"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const communityModeratorRequests = pgTable("community_moderator_requests", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").notNull(),
  categoryId: integer("category_id").notNull(),
  reason: text("reason").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  resolvedBy: integer("resolved_by"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const communityModerators = pgTable("community_moderators", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").notNull(),
  categoryId: integer("category_id"),
  permissionId: integer("permission_id"),
  isActive: boolean("is_active").default(true),
  assignedBy: integer("assigned_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const communityModeratorPermissions = pgTable("community_moderator_permissions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  canManagePosts: boolean("can_manage_posts").default(false),
  canManageComments: boolean("can_manage_comments").default(false),
  canManageMembers: boolean("can_manage_members").default(false),
  canBanMembers: boolean("can_ban_members").default(false),
  canManageCategories: boolean("can_manage_categories").default(false),
  canPinPosts: boolean("can_pin_posts").default(false),
  canFeaturePosts: boolean("can_feature_posts").default(false),
  canLockPosts: boolean("can_lock_posts").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Community Notifications
export const communityNotifications = pgTable("community_notifications", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").notNull(), // الشخص الذي يستلم التنبيه
  actorId: integer("actor_id").notNull(), // الشخص الذي قام بالفعل
  type: varchar("type", { length: 50 }).notNull(), // reply_post, reply_comment, like_post, like_comment
  postId: integer("post_id"),
  commentId: integer("comment_id"),
  message: text("message"),
  link: varchar("link", { length: 500 }),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [
  index("community_notif_member_idx").on(t.memberId),
  index("community_notif_read_idx").on(t.isRead),
]);

// Job Favorites
export const jobFavorites = pgTable("job_favorites", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").notNull(),
  jobId: integer("job_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
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
export const organizationFollows = pgTable("organization_follows", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").notNull(),
  organizationId: integer("organization_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [
  index("org_follows_member_idx").on(t.memberId),
  index("org_follows_org_idx").on(t.organizationId),
]);

export const insertOrganizationFollowSchema = createInsertSchema(organizationFollows).omit({ id: true, createdAt: true });
export type OrganizationFollow = typeof organizationFollows.$inferSelect;
export type InsertOrganizationFollow = z.infer<typeof insertOrganizationFollowSchema>;

// Job Alert Preferences — per-member category subscriptions for push/in-app alerts
export const jobAlertPreferences = pgTable("job_alert_preferences", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").notNull().unique(),
  categories: text("categories").array().notNull().default([]),
  isEnabled: boolean("is_enabled").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  index("job_alert_prefs_member_idx").on(t.memberId),
]);

export const insertJobAlertPreferencesSchema = createInsertSchema(jobAlertPreferences).omit({ id: true, createdAt: true, updatedAt: true });
export type JobAlertPreferences = typeof jobAlertPreferences.$inferSelect;
export type InsertJobAlertPreferences = z.infer<typeof insertJobAlertPreferencesSchema>;

// Member Push Tokens — Expo push tokens for mobile push notifications
export const memberPushTokens = pgTable("member_push_tokens", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").notNull(),
  token: varchar("token", { length: 500 }).notNull().unique(),
  platform: varchar("platform", { length: 20 }), // ios, android, web
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  index("member_push_tokens_member_idx").on(t.memberId),
]);

export const insertMemberPushTokenSchema = createInsertSchema(memberPushTokens).omit({ id: true, createdAt: true, updatedAt: true });
export type MemberPushToken = typeof memberPushTokens.$inferSelect;
export type InsertMemberPushToken = z.infer<typeof insertMemberPushTokenSchema>;

// Job Alert Sent — dedup table to prevent double notifications
export const jobAlertSent = pgTable("job_alert_sent", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").notNull(),
  jobId: integer("job_id").notNull(),
  sentAt: timestamp("sent_at").defaultNow(),
}, (t) => [
  index("job_alert_sent_member_idx").on(t.memberId),
  index("job_alert_sent_job_idx").on(t.jobId),
]);

// Online visitors tracking
export const onlineVisitors = pgTable("online_visitors", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 100 }).notNull().unique(),
  currentPage: varchar("current_page", { length: 500 }),
  lastSeen: timestamp("last_seen").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOnlineVisitorSchema = createInsertSchema(onlineVisitors).omit({ id: true, createdAt: true });
export type OnlineVisitor = typeof onlineVisitors.$inferSelect;
export type InsertOnlineVisitor = z.infer<typeof insertOnlineVisitorSchema>;

// Service Orders
export const serviceOrders = pgTable("service_orders", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id"), // linked community member (required for new orders)
  orderNumber: varchar("order_number", { length: 20 }).notNull().unique(),
  serviceSlug: varchar("service_slug", { length: 100 }).notNull(),
  serviceName: varchar("service_name", { length: 255 }).notNull(),
  serviceVariant: text("service_variant"),
  amount: integer("amount").notNull(),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 20 }).notNull(),
  customerEmail: varchar("customer_email", { length: 255 }).notNull(),
  receiptUrl: varchar("receipt_url", { length: 500 }).notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }).default("bank_transfer"),
  status: varchar("status", { length: 50 }).default("pending"), // pending, in_progress, completed, cancelled
  cancellationReason: text("cancellation_reason"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertServiceOrderSchema = createInsertSchema(serviceOrders).omit({ id: true, createdAt: true, updatedAt: true });
export type ServiceOrder = typeof serviceOrders.$inferSelect;
export type InsertServiceOrder = z.infer<typeof insertServiceOrderSchema>;

// Community persistent tokens (DB-backed, survive server restarts)
export const communityTokensTable = pgTable("community_tokens", {
  id: serial("id").primaryKey(),
  token: varchar("token", { length: 128 }).notNull().unique(),
  memberId: integer("member_id").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  targetAudience: varchar("target_audience", { length: 50 }).notNull().default("all"),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  imageUrl: varchar("image_url", { length: 1000 }),
  linkUrl: varchar("link_url", { length: 1000 }),
  linkButtonText: varchar("link_button_text", { length: 100 }),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAnnouncementSchema = createInsertSchema(announcements).omit({ id: true, createdAt: true });
export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;

export const jobReports = pgTable("job_reports", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(),
  reporterName: varchar("reporter_name", { length: 255 }),
  reporterEmail: varchar("reporter_email", { length: 255 }),
  memberId: integer("member_id"),
  reason: varchar("reason", { length: 100 }).notNull(),
  details: text("details"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  resolvedBy: integer("resolved_by"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertJobReportSchema = createInsertSchema(jobReports).omit({ id: true, createdAt: true, resolvedAt: true });
export type JobReport = typeof jobReports.$inferSelect;
export type InsertJobReport = z.infer<typeof insertJobReportSchema>;

export const weeklySummaries = pgTable("weekly_summaries", {
  id: serial("id").primaryKey(),
  weekLabel: varchar("week_label", { length: 100 }).notNull(),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
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

export const weeklySubscriptions = pgTable("weekly_subscriptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().unique(),
  email: varchar("email", { length: 255 }).notNull(),
  displayName: varchar("display_name", { length: 255 }),
  subscribedAt: timestamp("subscribed_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const insertWeeklySubscriptionSchema = createInsertSchema(weeklySubscriptions).omit({ id: true, subscribedAt: true });
export type WeeklySubscription = typeof weeklySubscriptions.$inferSelect;
export type InsertWeeklySubscription = z.infer<typeof insertWeeklySubscriptionSchema>;

// Employer Jobs — user submitted job listings (require admin approval)
export const employerJobs = pgTable("employer_jobs", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  company: varchar("company", { length: 255 }).notNull(),
  region: varchar("region", { length: 100 }),
  city: varchar("city", { length: 100 }),
  workSchedule: varchar("work_schedule", { length: 30 }),
  workMode: varchar("work_mode", { length: 30 }),
  description: text("description").notNull(),
  requirements: text("requirements"),
  targetGender: varchar("target_gender", { length: 20 }).notNull().default("all"),
  targetNationality: varchar("target_nationality", { length: 30 }).notNull().default("all"),
  contactMethod: varchar("contact_method", { length: 20 }).notNull().default("email"),
  contactValue: varchar("contact_value", { length: 500 }).notNull(),
  submitterName: varchar("submitter_name", { length: 255 }).notNull(),
  submitterEmail: varchar("submitter_email", { length: 255 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  deadlineDate: timestamp("deadline_date"),
  viewCount: integer("view_count").default(0).notNull(),
  trashedAt: timestamp("trashed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  index("employer_jobs_status_idx").on(t.status),
  index("employer_jobs_region_idx").on(t.region),
  index("employer_jobs_created_at_idx").on(t.createdAt),
]);

export const insertEmployerJobSchema = createInsertSchema(employerJobs).omit({ id: true, createdAt: true, updatedAt: true, viewCount: true });
export type EmployerJob = typeof employerJobs.$inferSelect;
export type InsertEmployerJob = z.infer<typeof insertEmployerJobSchema>;

// Reports on employer job listings
export const employerJobReports = pgTable("employer_job_reports", {
  id: serial("id").primaryKey(),
  employerJobId: integer("employer_job_id").notNull(),
  reporterName: varchar("reporter_name", { length: 255 }),
  reporterEmail: varchar("reporter_email", { length: 255 }),
  reason: varchar("reason", { length: 100 }).notNull(),
  details: text("details"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [
  index("employer_job_reports_job_idx").on(t.employerJobId),
  index("employer_job_reports_status_idx").on(t.status),
]);

export const insertEmployerJobReportSchema = createInsertSchema(employerJobReports).omit({ id: true, createdAt: true, resolvedAt: true });
export type EmployerJobReport = typeof employerJobReports.$inferSelect;
export type InsertEmployerJobReport = z.infer<typeof insertEmployerJobReportSchema>;

// CV Analysis History — each analysis attempt
export const cvAnalysisHistory = pgTable("cv_analysis_history", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").notNull(),
  jobId: integer("job_id"),
  jobTitle: varchar("job_title", { length: 255 }).notNull(),
  jobCompany: varchar("job_company", { length: 255 }),
  jobCategory: varchar("job_category", { length: 100 }),
  matchPercentage: integer("match_percentage").notNull(),
  creditType: varchar("credit_type", { length: 10 }).notNull().default("free"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [
  index("cv_analysis_history_member_idx").on(t.memberId),
  index("cv_analysis_history_created_idx").on(t.createdAt),
]);

export const insertCvAnalysisHistorySchema = createInsertSchema(cvAnalysisHistory).omit({ id: true, createdAt: true });
export type CvAnalysisHistory = typeof cvAnalysisHistory.$inferSelect;
export type InsertCvAnalysisHistory = z.infer<typeof insertCvAnalysisHistorySchema>;

// Job Application Credits — balance per member
export const jobApplicationCredits = pgTable("job_application_credits", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").notNull().unique(),
  balance: integer("balance").default(0).notNull(),
  expiresAt: timestamp("expires_at"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertJobApplicationCreditsSchema = createInsertSchema(jobApplicationCredits).omit({ id: true, updatedAt: true });
export type JobApplicationCredits = typeof jobApplicationCredits.$inferSelect;
export type InsertJobApplicationCredits = z.infer<typeof insertJobApplicationCreditsSchema>;

// Job Application Requests — each time a member uses a credit to request applying to a job
export const jobApplicationRequests = pgTable("job_application_requests", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").notNull(),
  jobId: integer("job_id").notNull(),
  jobTitle: varchar("job_title", { length: 255 }).notNull(),
  jobCompany: varchar("job_company", { length: 255 }),
  jobApplyUrl: varchar("job_apply_url", { length: 500 }).notNull(),
  requestNumber: varchar("request_number", { length: 20 }).notNull().unique(),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  index("job_app_requests_member_idx").on(t.memberId),
  index("job_app_requests_status_idx").on(t.status),
]);

export const insertJobApplicationRequestSchema = createInsertSchema(jobApplicationRequests).omit({ id: true, createdAt: true, updatedAt: true });
export type JobApplicationRequest = typeof jobApplicationRequests.$inferSelect;
export type InsertJobApplicationRequest = z.infer<typeof insertJobApplicationRequestSchema>;

// Support Tickets
export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  ticketNumber: varchar("ticket_number", { length: 20 }).notNull().unique(),
  memberId: integer("member_id").notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull().default("inquiry"),
  status: varchar("status", { length: 20 }).notNull().default("open"),
  orderNumber: varchar("order_number", { length: 50 }),
  closedAt: timestamp("closed_at"),
  lastMemberReplyAt: timestamp("last_member_reply_at"),
  lastAdminReplyAt: timestamp("last_admin_reply_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  index("support_tickets_member_idx").on(t.memberId),
  index("support_tickets_status_idx").on(t.status),
]);

export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({ id: true, createdAt: true, updatedAt: true });
export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;

// Support Ticket Replies
export const supportTicketReplies = pgTable("support_ticket_replies", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").notNull(),
  senderId: integer("sender_id").notNull(),
  senderType: varchar("sender_type", { length: 10 }).notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [
  index("support_ticket_replies_ticket_idx").on(t.ticketId),
]);

export const insertSupportTicketReplySchema = createInsertSchema(supportTicketReplies).omit({ id: true, createdAt: true });
export type SupportTicketReply = typeof supportTicketReplies.$inferSelect;
export type InsertSupportTicketReply = z.infer<typeof insertSupportTicketReplySchema>;

// FAQ Categories
export const faqCategories = pgTable("faq_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFaqCategorySchema = createInsertSchema(faqCategories).omit({ id: true, createdAt: true });
export type FaqCategory = typeof faqCategories.$inferSelect;
export type InsertFaqCategory = z.infer<typeof insertFaqCategorySchema>;

// FAQ Items
export const faqItems = pgTable("faq_items", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  category: varchar("category", { length: 100 }).default("general"),
  sortOrder: integer("sort_order").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertFaqItemSchema = createInsertSchema(faqItems).omit({ id: true, createdAt: true, updatedAt: true });
export type FaqItem = typeof faqItems.$inferSelect;
export type InsertFaqItem = z.infer<typeof insertFaqItemSchema>;

export const dailyMarketSnapshots = pgTable("daily_market_snapshots", {
  id: serial("id").primaryKey(),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  periodStart: timestamp("period_start").notNull(),
  snapshotData: text("snapshot_data").notNull(),
});
export const insertDailyMarketSnapshotSchema = createInsertSchema(dailyMarketSnapshots).omit({ id: true, generatedAt: true });
export type DailyMarketSnapshot = typeof dailyMarketSnapshots.$inferSelect;
export type InsertDailyMarketSnapshot = z.infer<typeof insertDailyMarketSnapshotSchema>;

// Dedicated blog categories table (separate from generic categories)
export const blogCategories = pgTable("blog_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertBlogCategorySchema = createInsertSchema(blogCategories).omit({ id: true, createdAt: true });
export type BlogCategory = typeof blogCategories.$inferSelect;
export type InsertBlogCategory = z.infer<typeof insertBlogCategorySchema>;

export const creditAdjustments = pgTable("credit_adjustments", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").notNull(),
  type: varchar("type", { length: 20 }).notNull(),
  operation: varchar("operation", { length: 10 }).notNull(),
  amount: integer("amount").notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertCreditAdjustmentSchema = createInsertSchema(creditAdjustments).omit({ id: true, createdAt: true });
export type CreditAdjustment = typeof creditAdjustments.$inferSelect;
export type InsertCreditAdjustment = z.infer<typeof insertCreditAdjustmentSchema>;

// ─── Twitter / X Publishing ──────────────────────────────────────────────────
export const twitterSettings = pgTable("twitter_settings", {
  id: serial("id").primaryKey(),
  enabled: boolean("enabled").default(false),
  autoJobsGeneral: boolean("auto_jobs_general").default(false),
  autoJobsCivil: boolean("auto_jobs_civil").default(false),
  autoJobsMilitary: boolean("auto_jobs_military").default(false),
  autoJobsCompanies: boolean("auto_jobs_companies").default(false),
  autoJobsOrganizations: boolean("auto_jobs_organizations").default(false),
  autoJobsResults: boolean("auto_jobs_results").default(false),
  autoBlog: boolean("auto_blog").default(false),
  defaultHashtags: text("default_hashtags").default("#وظائف_السعودية #وظائف"),
  imageSource: varchar("image_source", { length: 20 }).default("logo"),
  templateJob: text("template_job"),
  templateCivil: text("template_civil"),
  templateMilitary: text("template_military"),
  templateCompanies: text("template_companies"),
  templateOrganizations: text("template_organizations"),
  templateResults: text("template_results"),
  templateBlog: text("template_blog"),
  rateLimitPerHour: integer("rate_limit_per_hour").default(5),
  updatedAt: timestamp("updated_at").defaultNow(),
});
export const insertTwitterSettingsSchema = createInsertSchema(twitterSettings).omit({ id: true });
export type TwitterSettings = typeof twitterSettings.$inferSelect;

export const twitterPosts = pgTable("twitter_posts", {
  id: serial("id").primaryKey(),
  contentType: varchar("content_type", { length: 20 }).notNull(),
  contentId: integer("content_id").notNull(),
  tweetId: varchar("tweet_id", { length: 100 }),
  tweetUrl: varchar("tweet_url", { length: 500 }),
  tweetText: text("tweet_text"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  isAuto: boolean("is_auto").default(false),
  publishedBy: integer("published_by"),
  attempts: integer("attempts").default(0),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
  publishedAt: timestamp("published_at"),
}, (t) => [
  index("twitter_posts_content_idx").on(t.contentType, t.contentId),
]);
export const insertTwitterPostSchema = createInsertSchema(twitterPosts).omit({ id: true, createdAt: true });
export type TwitterPost = typeof twitterPosts.$inferSelect;
