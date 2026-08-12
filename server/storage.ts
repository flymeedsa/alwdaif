import { 
  communityPosts, communityComments, communityMembers as communityMembersTable,
  jobs, type Job, type InsertJob,
  results, type Result, type InsertResult,
  blogPosts, type BlogPost, type InsertBlogPost,
  categories, type Category, type InsertCategory,
  blogCategories, type BlogCategory, type InsertBlogCategory,
  siteSettings, type SiteSetting, type InsertSiteSetting,
  organizations, type Organization, type InsertOrganization,
  organizationTypes, type OrganizationType, type InsertOrganizationType,
  admins, type Admin, type InsertAdmin,
  permissions, type Permission, type InsertPermission,
  ads, type Ad, type InsertAd,
  seoSettings, type SeoSetting, type InsertSeoSetting,
  media, type Media, type InsertMedia,
  pages, type Page, type InsertPage,
  courses, type Course, type InsertCourse,
  services, type Service, type InsertService,
  onlineVisitors,
  serviceOrders, type ServiceOrder, type InsertServiceOrder,
  announcements, type Announcement, type InsertAnnouncement,
  jobReports, type JobReport, type InsertJobReport,
  jobFavorites,
  weeklySummaries, type WeeklySummary, type InsertWeeklySummary,
  weeklySubscriptions, type WeeklySubscription, type InsertWeeklySubscription,
  employerJobs, type EmployerJob, type InsertEmployerJob,
  employerJobReports, type EmployerJobReport, type InsertEmployerJobReport,
  jobApplicationCredits, type JobApplicationCredits,
  jobApplicationRequests, type JobApplicationRequest, type InsertJobApplicationRequest,
  cvAnalysisHistory, type CvAnalysisHistory, type InsertCvAnalysisHistory,
  jobAlertSent,
  supportTickets, type SupportTicket, type InsertSupportTicket,
  supportTicketReplies, type SupportTicketReply, type InsertSupportTicketReply,
  faqItems, type FaqItem, type InsertFaqItem,
  faqCategories, type FaqCategory, type InsertFaqCategory,
  dailyMarketSnapshots, type DailyMarketSnapshot, type InsertDailyMarketSnapshot,
  creditAdjustments, type CreditAdjustment, type InsertCreditAdjustment,
} from "@workspace/db";
import { db } from "./db";
import { eq, desc, and, sql, count, lt, ilike, or, gte, isNull, isNotNull, ne } from "drizzle-orm";

export interface IStorage {
  // Jobs
  getJobs(): Promise<Job[]>;
  getAllJobs(): Promise<Job[]>;
  getJobsByCategory(category: string): Promise<Job[]>;
  getJobsByStatus(status: string): Promise<Job[]>;
  getFeaturedJobs(): Promise<Job[]>;
  getJob(id: number): Promise<Job | undefined>;
  searchJobs(query: string, category?: string): Promise<Job[]>;
  getJobSuggestions(query: string): Promise<string[]>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: number, job: Partial<InsertJob>): Promise<Job | undefined>;
  deleteJob(id: number): Promise<boolean>;
  deleteOldTrashedJobs(olderThanDays: number): Promise<number>;
  
  // Results
  getResults(): Promise<Result[]>;
  getAllResults(): Promise<Result[]>;
  getResultsByStatus(status: string): Promise<Result[]>;
  getResult(id: number): Promise<Result | undefined>;
  createResult(result: InsertResult): Promise<Result>;
  updateResult(id: number, result: Partial<InsertResult>): Promise<Result | undefined>;
  deleteResult(id: number): Promise<boolean>;
  
  // Blog Posts
  getBlogPosts(): Promise<BlogPost[]>;
  getAllBlogPosts(): Promise<BlogPost[]>;
  getBlogPostsByStatus(status: string): Promise<BlogPost[]>;
  getBlogPost(id: number): Promise<BlogPost | undefined>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: number, post: Partial<InsertBlogPost>): Promise<BlogPost | undefined>;
  deleteBlogPost(id: number): Promise<boolean>;
  
  // Categories
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;

  // Blog Categories (dedicated table)
  getBlogCategories(activeOnly?: boolean): Promise<BlogCategory[]>;
  getBlogCategory(id: number): Promise<BlogCategory | undefined>;
  createBlogCategory(cat: InsertBlogCategory): Promise<BlogCategory>;
  updateBlogCategory(id: number, cat: Partial<InsertBlogCategory>): Promise<BlogCategory | undefined>;
  deleteBlogCategory(id: number): Promise<boolean>;
  
  // Organizations
  getOrganizations(): Promise<Organization[]>;
  getOrganizationsWithFollowers(): Promise<(Organization & { followerCount: number })[]>;
  getOrganization(id: number): Promise<Organization | undefined>;
  getOrganizationWithStats(id: number): Promise<{ org: Organization; jobCount: number } | undefined>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  updateOrganization(id: number, org: Partial<InsertOrganization>): Promise<Organization | undefined>;
  deleteOrganization(id: number): Promise<boolean>;

  // Organization Types
  getOrganizationTypes(): Promise<OrganizationType[]>;
  createOrganizationType(data: InsertOrganizationType): Promise<OrganizationType>;
  updateOrganizationType(id: number, data: Partial<InsertOrganizationType>): Promise<OrganizationType | undefined>;
  deleteOrganizationType(id: number): Promise<boolean>;
  
  // Admins
  getAdmins(): Promise<Admin[]>;
  getAdmin(id: number): Promise<Admin | undefined>;
  getAdminByUserId(userId: string): Promise<Admin | undefined>;
  getAdminByEmail(email: string): Promise<Admin | undefined>;
  getAdminByUsername(username: string): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  updateAdmin(id: number, admin: Partial<InsertAdmin>): Promise<Admin | undefined>;
  deleteAdmin(id: number): Promise<boolean>;
  
  // Permissions
  getPermissions(): Promise<Permission[]>;
  createPermission(permission: InsertPermission): Promise<Permission>;
  deletePermission(id: number): Promise<boolean>;
  
  // Ads
  getAds(status?: string): Promise<Ad[]>;
  getActiveAds(): Promise<Ad[]>;
  getAdsByPosition(position: string): Promise<Ad[]>;
  getSmartAd(interests: string[]): Promise<Ad | null>;
  getAd(id: number): Promise<Ad | undefined>;
  createAd(ad: InsertAd): Promise<Ad>;
  updateAd(id: number, ad: Partial<InsertAd>): Promise<Ad | undefined>;
  trashAd(id: number): Promise<boolean>;
  restoreAd(id: number): Promise<boolean>;
  deleteAd(id: number): Promise<boolean>;
  
  // SEO Settings
  getSeoSettings(): Promise<SeoSetting[]>;
  getSeoSetting(pagePath: string): Promise<SeoSetting | undefined>;
  createSeoSetting(seo: InsertSeoSetting): Promise<SeoSetting>;
  updateSeoSetting(id: number, seo: Partial<InsertSeoSetting>): Promise<SeoSetting | undefined>;
  deleteSeoSetting(id: number): Promise<boolean>;
  
  // Site Settings
  getSetting(key: string): Promise<SiteSetting | undefined>;
  setSetting(key: string, value: string): Promise<SiteSetting>;
  
  // Credit Adjustments
  createCreditAdjustment(data: InsertCreditAdjustment): Promise<CreditAdjustment>;
  getCreditAdjustmentsByMember(memberId: number): Promise<CreditAdjustment[]>;

  // Media
  getMedia(category?: string): Promise<Media[]>;
  getMediaTrash(): Promise<Media[]>;
  getMediaItem(id: number): Promise<Media | undefined>;
  createMedia(mediaItem: InsertMedia): Promise<Media>;
  updateMedia(id: number, mediaItem: Partial<InsertMedia>): Promise<Media | undefined>;
  softDeleteMedia(id: number): Promise<boolean>;
  restoreMedia(id: number): Promise<boolean>;
  permanentDeleteMedia(id: number): Promise<boolean>;
  cleanupMediaTrash(): Promise<number>;
  autoCategorizMedia(): Promise<void>;
  
  // Pages
  getPages(): Promise<Page[]>;
  getAllPages(): Promise<Page[]>;
  getPagesByStatus(status: string): Promise<Page[]>;
  getPage(id: number): Promise<Page | undefined>;
  getPageBySlug(slug: string): Promise<Page | undefined>;
  createPage(page: InsertPage): Promise<Page>;
  updatePage(id: number, page: Partial<InsertPage>): Promise<Page | undefined>;
  deletePage(id: number): Promise<boolean>;
  cleanupTrash(): Promise<number>;
  
  // Online visitors
  updateOnlineVisitor(sessionId: string, currentPage: string): Promise<void>;
  getOnlineVisitorCount(minutesThreshold: number): Promise<number>;
  cleanupOldOnlineVisitors(minutesThreshold: number): Promise<void>;
  
  // View count incrementing
  incrementJobViewCount(id: number): Promise<void>;
  incrementResultViewCount(id: number): Promise<void>;
  incrementBlogPostViewCount(id: number): Promise<void>;
  
  // Courses
  getCourses(): Promise<Course[]>;
  getAllCourses(): Promise<Course[]>;
  getCourse(id: number): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, course: Partial<InsertCourse>): Promise<Course | undefined>;
  deleteCourse(id: number): Promise<boolean>;

  getAnalytics(): Promise<Record<string, any>>;

  // Announcements
  getAnnouncements(): Promise<Announcement[]>;
  getActiveAnnouncements(): Promise<Announcement[]>;
  getAnnouncement(id: number): Promise<Announcement | undefined>;
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  updateAnnouncement(id: number, announcement: Partial<InsertAnnouncement>): Promise<Announcement | undefined>;
  deleteAnnouncement(id: number): Promise<boolean>;

  // Job Reports
  getJobReports(): Promise<JobReport[]>;
  getJobReport(id: number): Promise<JobReport | undefined>;
  createJobReport(report: InsertJobReport): Promise<JobReport>;
  resolveJobReport(id: number, resolvedBy: number, status: string): Promise<JobReport | undefined>;

  // Employer Jobs
  getEmployerJobs(region?: string): Promise<EmployerJob[]>;
  getEmployerJobsByStatus(status: string): Promise<EmployerJob[]>;
  getEmployerJob(id: number): Promise<EmployerJob | undefined>;
  createEmployerJob(job: InsertEmployerJob): Promise<EmployerJob>;
  updateEmployerJobStatus(id: number, status: string): Promise<EmployerJob | undefined>;
  updateEmployerJob(id: number, data: Partial<InsertEmployerJob>): Promise<EmployerJob | undefined>;
  deleteEmployerJob(id: number): Promise<boolean>;
  incrementEmployerJobViewCount(id: number): Promise<void>;
  getSimilarEmployerJobs(excludeId: number, title: string, limit: number): Promise<EmployerJob[]>;

  // Employer Job Reports
  getEmployerJobReports(): Promise<EmployerJobReport[]>;
  createEmployerJobReport(report: InsertEmployerJobReport): Promise<EmployerJobReport>;
  resolveEmployerJobReport(id: number, status: string): Promise<EmployerJobReport | undefined>;

  // Daily Market Snapshots
  getLatestDailyMarketSnapshot(): Promise<DailyMarketSnapshot | undefined>;
  saveDailyMarketSnapshot(data: InsertDailyMarketSnapshot): Promise<DailyMarketSnapshot>;

  // Weekly Summaries
  getLatestWeeklySummary(): Promise<WeeklySummary | undefined>;
  getAllWeeklySummaries(): Promise<WeeklySummary[]>;
  createWeeklySummary(summary: InsertWeeklySummary): Promise<WeeklySummary>;
  deleteWeeklySummary(id: number): Promise<void>;
  subscribeToWeeklySummary(data: { userId: string; email: string; displayName?: string }): Promise<WeeklySubscription>;
  unsubscribeFromWeeklySummary(userId: string): Promise<void>;
  getWeeklySubscriptionStatus(userId: string): Promise<boolean>;
  getAllActiveWeeklySubscribers(): Promise<WeeklySubscription[]>;

  // CV Analysis History
  saveCvAnalysisHistory(data: InsertCvAnalysisHistory): Promise<CvAnalysisHistory>;
  getCvAnalysisHistoryByMember(memberId: number): Promise<CvAnalysisHistory[]>;

  // Job Alert Points
  getJobAlertPoints(memberId: number): Promise<{ freePoints: number; paidPoints: number }>;
  addJobAlertPoints(memberId: number, amount: number): Promise<void>;
  deductJobAlertPoint(memberId: number): Promise<boolean>;
  hasJobAlertSent(memberId: number, jobId: number): Promise<boolean>;
  markJobAlertSent(memberId: number, jobId: number): Promise<void>;
  getJobAlertSentByJob(jobId: number): Promise<{ memberId: number }[]>;
  deleteJobAlertSentByJob(jobId: number): Promise<void>;
  refundJobAlertPoint(memberId: number): Promise<void>;

  // Job Application Credits
  getJobApplicationCredits(memberId: number): Promise<JobApplicationCredits | undefined>;
  addJobApplicationCredits(memberId: number, amount: number, expiresAt?: Date): Promise<JobApplicationCredits>;
  useJobApplicationCredit(memberId: number): Promise<boolean>;
  deductJobApplicationCredits(memberId: number, amount: number): Promise<boolean>;
  getAllJobApplicationCredits(): Promise<JobApplicationCredits[]>;
  getExpiredJobCredits(): Promise<JobApplicationCredits[]>;
  getJobCreditsExpiringIn(days: number): Promise<JobApplicationCredits[]>;
  zeroJobApplicationCredits(memberId: number): Promise<void>;

  // Job Application Requests
  createJobApplicationRequest(data: InsertJobApplicationRequest): Promise<JobApplicationRequest>;
  getJobApplicationRequests(): Promise<JobApplicationRequest[]>;
  getJobApplicationRequestsByMember(memberId: number): Promise<JobApplicationRequest[]>;
  updateJobApplicationRequestStatus(id: number, status: string, notes?: string): Promise<JobApplicationRequest | undefined>;
  getJobApplicationRequest(id: number): Promise<JobApplicationRequest | undefined>;
  deleteJobApplicationRequest(id: number): Promise<void>;

  // Support Tickets
  createSupportTicket(data: InsertSupportTicket): Promise<SupportTicket>;
  getSupportTicketsByMember(memberId: number): Promise<SupportTicket[]>;
  getSupportTicket(id: number): Promise<SupportTicket | undefined>;
  getSupportTicketByNumber(ticketNumber: string): Promise<SupportTicket | undefined>;
  updateSupportTicketStatus(id: number, status: string, extra?: Partial<SupportTicket>): Promise<SupportTicket | undefined>;
  getAllSupportTickets(status?: string): Promise<(SupportTicket & { memberName?: string; memberEmail?: string })[]>;
  getTicketsAwaitingAutoClose(): Promise<SupportTicket[]>;
  createSupportTicketReply(data: InsertSupportTicketReply): Promise<SupportTicketReply>;
  getSupportTicketReplies(ticketId: number): Promise<SupportTicketReply[]>;
  getFaqItems(publishedOnly?: boolean): Promise<FaqItem[]>;
  getFaqItem(id: number): Promise<FaqItem | undefined>;
  createFaqItem(data: InsertFaqItem): Promise<FaqItem>;
  updateFaqItem(id: number, data: Partial<InsertFaqItem>): Promise<FaqItem | undefined>;
  deleteFaqItem(id: number): Promise<void>;
  getFaqCategories(): Promise<FaqCategory[]>;
  createFaqCategory(data: InsertFaqCategory): Promise<FaqCategory>;
  updateFaqCategory(id: number, data: Partial<InsertFaqCategory>): Promise<FaqCategory | undefined>;
  deleteFaqCategory(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Jobs
  async getJobs(): Promise<Job[]> {
    return await db.select().from(jobs).where(eq(jobs.status, "published")).orderBy(desc(jobs.createdAt));
  }
  
  async getAllJobs(): Promise<Job[]> {
    return await db.select().from(jobs).orderBy(desc(jobs.createdAt));
  }
  
  async getJobsByCategory(category: string): Promise<Job[]> {
    return await db.select().from(jobs)
      .where(and(eq(jobs.category, category), eq(jobs.status, "published")))
      .orderBy(desc(jobs.createdAt));
  }
  
  async getJobsByStatus(status: string): Promise<Job[]> {
    return await db.select().from(jobs).where(eq(jobs.status, status)).orderBy(desc(jobs.createdAt));
  }
  
  async getFeaturedJobs(): Promise<Job[]> {
    return await db.select().from(jobs)
      .where(and(eq(jobs.isFeatured, true), eq(jobs.status, "published")))
      .orderBy(desc(jobs.createdAt));
  }
  
  async getJob(id: number): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job;
  }

  async searchJobs(query: string, category?: string): Promise<Job[]> {
    const term = `%${query}%`;
    const searchCondition = or(
      ilike(jobs.title, term),
      ilike(jobs.company, term),
      ilike(jobs.description, term),
      ilike(jobs.summary, term)
    );
    const conditions = category && category !== "all"
      ? and(eq(jobs.status, "published"), eq(jobs.category, category), searchCondition)
      : and(eq(jobs.status, "published"), searchCondition);
    return await db.select().from(jobs).where(conditions).orderBy(desc(jobs.createdAt));
  }

  async getJobSuggestions(query: string): Promise<string[]> {
    const term = `%${query}%`;
    const rows = await db
      .select({ title: jobs.title })
      .from(jobs)
      .where(and(eq(jobs.status, "published"), ilike(jobs.title, term)))
      .orderBy(desc(jobs.createdAt))
      .limit(8);
    return Array.from(new Set(rows.map(r => r.title)));
  }

  async createJob(job: InsertJob): Promise<Job> {
    const [newJob] = await db.insert(jobs).values(job).returning();
    return newJob;
  }
  
  async updateJob(id: number, job: Partial<InsertJob>): Promise<Job | undefined> {
    const extra: Record<string, any> = {};
    if (job.status === "trash") extra.trashedAt = new Date();
    else if (job.status && job.status !== "trash") extra.trashedAt = null;
    const [updated] = await db.update(jobs)
      .set({ ...job, ...extra, updatedAt: new Date() })
      .where(eq(jobs.id, id))
      .returning();
    return updated;
  }
  
  async deleteJob(id: number): Promise<boolean> {
    // Refund job-alert points to all members who received a notification for this job
    const alertedMembers = await this.getJobAlertSentByJob(id);
    for (const { memberId } of alertedMembers) {
      await this.refundJobAlertPoint(memberId);
    }
    // Clean up alert-sent records and job-link notifications
    await this.deleteJobAlertSentByJob(id);
    await db.delete(jobFavorites).where(eq(jobFavorites.jobId, id));
    await db.delete(jobs).where(eq(jobs.id, id));
    return true;
  }

  async deleteOldTrashedJobs(olderThanDays: number): Promise<number> {
    const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    const oldTrashed = await db
      .select({ id: jobs.id })
      .from(jobs)
      .where(and(eq(jobs.status, "trash"), lt(jobs.trashedAt, cutoff)));
    if (oldTrashed.length === 0) return 0;
    const ids = oldTrashed.map(j => j.id);
    for (const id of ids) {
      await db.delete(jobFavorites).where(eq(jobFavorites.jobId, id));
    }
    await db.delete(jobs).where(and(eq(jobs.status, "trash"), lt(jobs.trashedAt, cutoff)));
    return ids.length;
  }
  
  // Results
  async getResults(): Promise<Result[]> {
    return await db.select().from(results).where(eq(results.status, "published")).orderBy(desc(results.createdAt));
  }
  
  async getAllResults(): Promise<Result[]> {
    return await db.select().from(results).orderBy(desc(results.createdAt));
  }
  
  async getResultsByStatus(status: string): Promise<Result[]> {
    return await db.select().from(results).where(eq(results.status, status)).orderBy(desc(results.createdAt));
  }
  
  async getResult(id: number): Promise<Result | undefined> {
    const [result] = await db.select().from(results).where(eq(results.id, id));
    return result;
  }
  
  async createResult(result: InsertResult): Promise<Result> {
    const [newResult] = await db.insert(results).values(result).returning();
    return newResult;
  }
  
  async updateResult(id: number, result: Partial<InsertResult>): Promise<Result | undefined> {
    const [updated] = await db.update(results)
      .set({ ...result, updatedAt: new Date() })
      .where(eq(results.id, id))
      .returning();
    return updated;
  }
  
  async deleteResult(id: number): Promise<boolean> {
    await db.delete(results).where(eq(results.id, id));
    return true;
  }
  
  // Blog Posts
  async getBlogPosts(): Promise<BlogPost[]> {
    return await db.select().from(blogPosts).where(eq(blogPosts.status, "published")).orderBy(desc(blogPosts.createdAt));
  }
  
  async getAllBlogPosts(): Promise<BlogPost[]> {
    return await db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt));
  }
  
  async getBlogPostsByStatus(status: string): Promise<BlogPost[]> {
    return await db.select().from(blogPosts).where(eq(blogPosts.status, status)).orderBy(desc(blogPosts.createdAt));
  }
  
  async getBlogPost(id: number): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
    return post;
  }
  
  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug));
    return post;
  }
  
  async createBlogPost(post: InsertBlogPost): Promise<BlogPost> {
    const [newPost] = await db.insert(blogPosts).values(post).returning();
    return newPost;
  }
  
  async updateBlogPost(id: number, post: Partial<InsertBlogPost>): Promise<BlogPost | undefined> {
    const extra: Record<string, any> = {};
    if (post.status === "trash") extra.trashedAt = new Date();
    else if (post.status && post.status !== "trash") extra.trashedAt = null;
    const [updated] = await db.update(blogPosts)
      .set({ ...post, ...extra, updatedAt: new Date() })
      .where(eq(blogPosts.id, id))
      .returning();
    return updated;
  }
  
  async deleteBlogPost(id: number): Promise<boolean> {
    await db.delete(blogPosts).where(eq(blogPosts.id, id));
    return true;
  }
  
  // Categories
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.sortOrder, categories.name);
  }

  async getChildCategories(parentId: number): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.parentId, parentId)).orderBy(categories.sortOrder, categories.name);
  }
  
  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }
  
  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updated] = await db.update(categories).set(category).where(eq(categories.id, id)).returning();
    return updated;
  }
  
  async deleteCategory(id: number): Promise<boolean> {
    await db.delete(categories).where(eq(categories.id, id));
    return true;
  }

  // Blog Categories (dedicated table)
  async getBlogCategories(activeOnly = false): Promise<BlogCategory[]> {
    const rows = await db.select().from(blogCategories).orderBy(blogCategories.sortOrder, blogCategories.name);
    return activeOnly ? rows.filter(r => r.isActive) : rows;
  }

  async getBlogCategory(id: number): Promise<BlogCategory | undefined> {
    const [row] = await db.select().from(blogCategories).where(eq(blogCategories.id, id));
    return row;
  }

  async createBlogCategory(cat: InsertBlogCategory): Promise<BlogCategory> {
    const [created] = await db.insert(blogCategories).values(cat).returning();
    return created;
  }

  async updateBlogCategory(id: number, cat: Partial<InsertBlogCategory>): Promise<BlogCategory | undefined> {
    const [updated] = await db.update(blogCategories).set(cat).where(eq(blogCategories.id, id)).returning();
    return updated;
  }

  async deleteBlogCategory(id: number): Promise<boolean> {
    await db.delete(blogCategories).where(eq(blogCategories.id, id));
    return true;
  }

  // Organizations
  async getOrganizations(): Promise<Organization[]> {
    return await db.select().from(organizations).orderBy(organizations.name);
  }

  async getOrganizationsWithFollowers(): Promise<(Organization & { followerCount: number })[]> {
    const result = await db.execute(sql`
      SELECT
        o.id, o.name, o.logo, o.type, o.description, o.website,
        o.is_active AS "isActive",
        o.created_at AS "createdAt",
        o.updated_at AS "updatedAt",
        COALESCE(fc.cnt, 0)::int AS "followerCount"
      FROM organizations o
      LEFT JOIN (
        SELECT organization_id, COUNT(*) AS cnt
        FROM organization_follows
        GROUP BY organization_id
      ) fc ON o.id = fc.organization_id
      ORDER BY o.name
    `);
    return result.rows as (Organization & { followerCount: number })[];
  }
  
  async getOrganization(id: number): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
    return org;
  }
  
  async getOrganizationWithStats(id: number): Promise<{ org: Organization; jobCount: number } | undefined> {
    const org = await this.getOrganization(id);
    if (!org) return undefined;
    
    const [result] = await db.select({ count: count() }).from(jobs).where(eq(jobs.organizationId, id));
    return { org, jobCount: result?.count || 0 };
  }
  
  async createOrganization(org: InsertOrganization): Promise<Organization> {
    const [newOrg] = await db.insert(organizations).values(org).returning();
    return newOrg;
  }
  
  async updateOrganization(id: number, org: Partial<InsertOrganization>): Promise<Organization | undefined> {
    const [updated] = await db.update(organizations)
      .set({ ...org, updatedAt: new Date() })
      .where(eq(organizations.id, id))
      .returning();
    return updated;
  }
  
  async deleteOrganization(id: number): Promise<boolean> {
    await db.delete(organizations).where(eq(organizations.id, id));
    return true;
  }

  // Organization Types
  async getOrganizationTypes(): Promise<OrganizationType[]> {
    return await db.select().from(organizationTypes).orderBy(organizationTypes.sortOrder, organizationTypes.label);
  }

  async createOrganizationType(data: InsertOrganizationType): Promise<OrganizationType> {
    const [created] = await db.insert(organizationTypes).values(data).returning();
    return created;
  }

  async updateOrganizationType(id: number, data: Partial<InsertOrganizationType>): Promise<OrganizationType | undefined> {
    const [updated] = await db.update(organizationTypes).set(data).where(eq(organizationTypes.id, id)).returning();
    return updated;
  }

  async deleteOrganizationType(id: number): Promise<boolean> {
    await db.delete(organizationTypes).where(eq(organizationTypes.id, id));
    return true;
  }
  
  // Admins
  async getAdmins(): Promise<Admin[]> {
    return await db.select().from(admins).orderBy(admins.name);
  }
  
  async getAdmin(id: number): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.id, id));
    return admin;
  }
  
  async getAdminByUserId(userId: string): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.userId, userId));
    return admin;
  }

  async getAdminByEmail(email: string): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.email, email));
    return admin;
  }

  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.username, username));
    return admin;
  }

  async createAdmin(admin: InsertAdmin): Promise<Admin> {
    const [newAdmin] = await db.insert(admins).values(admin).returning();
    return newAdmin;
  }
  
  async updateAdmin(id: number, admin: Partial<InsertAdmin>): Promise<Admin | undefined> {
    const [updated] = await db.update(admins)
      .set({ ...admin, updatedAt: new Date() })
      .where(eq(admins.id, id))
      .returning();
    return updated;
  }
  
  async deleteAdmin(id: number): Promise<boolean> {
    await db.delete(admins).where(eq(admins.id, id));
    return true;
  }
  
  // Permissions
  async getPermissions(): Promise<Permission[]> {
    return await db.select().from(permissions).orderBy(permissions.module, permissions.name);
  }
  
  async createPermission(permission: InsertPermission): Promise<Permission> {
    const [newPermission] = await db.insert(permissions).values(permission).returning();
    return newPermission;
  }
  
  async deletePermission(id: number): Promise<boolean> {
    await db.delete(permissions).where(eq(permissions.id, id));
    return true;
  }
  
  // Ads
  async getAds(status?: string): Promise<Ad[]> {
    if (status === "active") {
      return await db.select().from(ads)
        .where(and(eq(ads.isActive, true), isNull(ads.deletedAt)))
        .orderBy(desc(ads.priority), desc(ads.createdAt));
    }
    if (status === "inactive") {
      return await db.select().from(ads)
        .where(and(eq(ads.isActive, false), isNull(ads.deletedAt)))
        .orderBy(desc(ads.priority), desc(ads.createdAt));
    }
    if (status === "deleted") {
      return await db.select().from(ads)
        .where(isNotNull(ads.deletedAt))
        .orderBy(desc(ads.createdAt));
    }
    // default: all non-deleted
    return await db.select().from(ads)
      .where(isNull(ads.deletedAt))
      .orderBy(desc(ads.priority), desc(ads.createdAt));
  }
  
  async getActiveAds(): Promise<Ad[]> {
    return await db.select().from(ads)
      .where(and(eq(ads.isActive, true), isNull(ads.deletedAt)))
      .orderBy(desc(ads.priority));
  }
  
  async getAdsByPosition(position: string): Promise<Ad[]> {
    return await db.select().from(ads)
      .where(and(eq(ads.position, position), eq(ads.isActive, true)))
      .orderBy(desc(ads.priority));
  }

  async getSmartAd(interests: string[]): Promise<Ad | null> {
    const allAds = await db.select().from(ads)
      .where(and(eq(ads.isActive, true), isNull(ads.deletedAt)))
      .orderBy(desc(ads.priority));
    if (allAds.length === 0) return null;

    // Score each ad based on interest matching + priority
    const scored = allAds.map(ad => {
      let score = ad.priority || 0;
      if (ad.targetInterests) {
        const adInterests = ad.targetInterests.split(',').map((s: string) => s.trim()).filter(Boolean);
        const matches = adInterests.filter((i: string) => interests.includes(i)).length;
        score += matches * 10;
      } else {
        score += 5; // non-targeted ads get a small boost (show to everyone)
      }
      return { ad, score };
    });

    // Find best score and collect top-tier ads within 15 points of it
    const bestScore = Math.max(...scored.map(s => s.score));
    const topTier = scored.filter(s => s.score >= bestScore - 15);

    // Rotate randomly within the top tier
    return topTier[Math.floor(Math.random() * topTier.length)].ad;
  }
  
  async getAd(id: number): Promise<Ad | undefined> {
    const [ad] = await db.select().from(ads).where(eq(ads.id, id));
    return ad;
  }
  
  async createAd(ad: InsertAd): Promise<Ad> {
    const [newAd] = await db.insert(ads).values(ad).returning();
    return newAd;
  }
  
  async updateAd(id: number, ad: Partial<InsertAd>): Promise<Ad | undefined> {
    const [updated] = await db.update(ads)
      .set({ ...ad, updatedAt: new Date() })
      .where(eq(ads.id, id))
      .returning();
    return updated;
  }
  
  async trashAd(id: number): Promise<boolean> {
    await db.update(ads).set({ deletedAt: new Date() }).where(eq(ads.id, id));
    return true;
  }

  async restoreAd(id: number): Promise<boolean> {
    await db.update(ads).set({ deletedAt: null }).where(eq(ads.id, id));
    return true;
  }

  async deleteAd(id: number): Promise<boolean> {
    await db.delete(ads).where(eq(ads.id, id));
    return true;
  }
  
  // SEO Settings
  async getSeoSettings(): Promise<SeoSetting[]> {
    return await db.select().from(seoSettings).orderBy(seoSettings.pagePath);
  }
  
  async getSeoSetting(pagePath: string): Promise<SeoSetting | undefined> {
    const [setting] = await db.select().from(seoSettings).where(eq(seoSettings.pagePath, pagePath));
    return setting;
  }
  
  async createSeoSetting(seo: InsertSeoSetting): Promise<SeoSetting> {
    const [newSeo] = await db.insert(seoSettings).values(seo).returning();
    return newSeo;
  }
  
  async updateSeoSetting(id: number, seo: Partial<InsertSeoSetting>): Promise<SeoSetting | undefined> {
    const [updated] = await db.update(seoSettings)
      .set({ ...seo, updatedAt: new Date() })
      .where(eq(seoSettings.id, id))
      .returning();
    return updated;
  }
  
  async deleteSeoSetting(id: number): Promise<boolean> {
    await db.delete(seoSettings).where(eq(seoSettings.id, id));
    return true;
  }
  
  // Site Settings
  async getSetting(key: string): Promise<SiteSetting | undefined> {
    const [setting] = await db.select().from(siteSettings).where(eq(siteSettings.key, key));
    return setting;
  }
  
  async setSetting(key: string, value: string): Promise<SiteSetting> {
    const existing = await this.getSetting(key);
    if (existing) {
      const [updated] = await db.update(siteSettings)
        .set({ value, updatedAt: new Date() })
        .where(eq(siteSettings.key, key))
        .returning();
      return updated;
    }
    const [newSetting] = await db.insert(siteSettings).values({ key, value }).returning();
    return newSetting;
  }
  
  // Credit Adjustments
  async createCreditAdjustment(data: InsertCreditAdjustment): Promise<CreditAdjustment> {
    const [created] = await db.insert(creditAdjustments).values(data).returning();
    return created;
  }

  async getCreditAdjustmentsByMember(memberId: number): Promise<CreditAdjustment[]> {
    return await db.select().from(creditAdjustments).where(eq(creditAdjustments.memberId, memberId)).orderBy(desc(creditAdjustments.createdAt));
  }

  // Media
  async getMedia(category?: string): Promise<Media[]> {
    const conditions = [isNull(media.deletedAt)];
    if (category) conditions.push(eq(media.category, category));
    return await db.select().from(media).where(and(...conditions)).orderBy(desc(media.createdAt));
  }

  async getMediaTrash(): Promise<Media[]> {
    return await db.select().from(media).where(isNotNull(media.deletedAt)).orderBy(desc(media.deletedAt));
  }

  async getMediaItem(id: number): Promise<Media | undefined> {
    const [item] = await db.select().from(media).where(eq(media.id, id));
    return item;
  }

  async createMedia(mediaItem: InsertMedia): Promise<Media> {
    const [created] = await db.insert(media).values(mediaItem).returning();
    return created;
  }

  async updateMedia(id: number, mediaItem: Partial<InsertMedia>): Promise<Media | undefined> {
    const [updated] = await db.update(media).set(mediaItem).where(eq(media.id, id)).returning();
    return updated;
  }

  async softDeleteMedia(id: number): Promise<boolean> {
    await db.update(media).set({ deletedAt: new Date() }).where(eq(media.id, id));
    return true;
  }

  async restoreMedia(id: number): Promise<boolean> {
    await db.update(media).set({ deletedAt: null }).where(eq(media.id, id));
    return true;
  }

  async permanentDeleteMedia(id: number): Promise<boolean> {
    await db.delete(media).where(eq(media.id, id));
    return true;
  }

  async cleanupMediaTrash(): Promise<number> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const deleted = await db.delete(media).where(and(isNotNull(media.deletedAt), lt(media.deletedAt, thirtyDaysAgo))).returning();
    return deleted.length;
  }

  async autoCategorizMedia(): Promise<void> {
    await db.execute(sql`
      UPDATE media SET category = 'organizations'
      WHERE deleted_at IS NULL AND category = 'general'
        AND url IN (SELECT logo FROM organizations WHERE logo IS NOT NULL AND logo != '')
    `);
    await db.execute(sql`
      UPDATE media SET category = 'blog'
      WHERE deleted_at IS NULL AND category = 'general'
        AND url IN (SELECT image FROM blog_posts WHERE image IS NOT NULL AND image != '')
    `);
  }
  
  // Pages
  async getPages(): Promise<Page[]> {
    return await db.select().from(pages).where(eq(pages.status, "published")).orderBy(desc(pages.createdAt));
  }
  
  async getAllPages(): Promise<Page[]> {
    return await db.select().from(pages).orderBy(desc(pages.createdAt));
  }
  
  async getPagesByStatus(status: string): Promise<Page[]> {
    return await db.select().from(pages).where(eq(pages.status, status)).orderBy(desc(pages.createdAt));
  }
  
  async getPage(id: number): Promise<Page | undefined> {
    const [page] = await db.select().from(pages).where(eq(pages.id, id));
    return page;
  }
  
  async getPageBySlug(slug: string): Promise<Page | undefined> {
    const [page] = await db.select().from(pages).where(eq(pages.slug, slug));
    return page;
  }
  
  async createPage(page: InsertPage): Promise<Page> {
    const [newPage] = await db.insert(pages).values(page).returning();
    return newPage;
  }
  
  async updatePage(id: number, page: Partial<InsertPage>): Promise<Page | undefined> {
    const [updated] = await db.update(pages)
      .set({ ...page, updatedAt: new Date() })
      .where(eq(pages.id, id))
      .returning();
    return updated;
  }
  
  async deletePage(id: number): Promise<boolean> {
    await db.delete(pages).where(eq(pages.id, id));
    return true;
  }

  async cleanupTrash(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    let deletedCount = 0;
    
    // Cleanup trashed pages
    const trashedPages = await db.select().from(pages)
      .where(and(
        eq(pages.status, "trash"),
        lt(pages.trashedAt!, thirtyDaysAgo)
      ));
    
    for (const page of trashedPages) {
      await db.delete(pages).where(eq(pages.id, page.id));
      deletedCount++;
    }
    
    // Cleanup trashed jobs
    const trashedJobs = await db.select().from(jobs)
      .where(and(
        eq(jobs.status, "trash"),
        lt(jobs.trashedAt!, thirtyDaysAgo)
      ));
    
    for (const job of trashedJobs) {
      await db.delete(jobs).where(eq(jobs.id, job.id));
      deletedCount++;
    }
    
    // Cleanup trashed blog posts
    const trashedPosts = await db.select().from(blogPosts)
      .where(and(
        eq(blogPosts.status, "trash"),
        lt(blogPosts.trashedAt!, thirtyDaysAgo)
      ));
    
    for (const post of trashedPosts) {
      await db.delete(blogPosts).where(eq(blogPosts.id, post.id));
      deletedCount++;
    }
    
    // Cleanup trashed results
    const trashedResults = await db.select().from(results)
      .where(and(
        eq(results.status, "trash"),
        lt(results.trashedAt!, thirtyDaysAgo)
      ));
    
    for (const result of trashedResults) {
      await db.delete(results).where(eq(results.id, result.id));
      deletedCount++;
    }

    // Cleanup trashed community posts
    const trashedCommunityPosts = await db.select().from(communityPosts)
      .where(and(
        eq(communityPosts.status, "trash"),
        lt(communityPosts.trashedAt!, thirtyDaysAgo)
      ));

    for (const post of trashedCommunityPosts) {
      await db.delete(communityPosts).where(eq(communityPosts.id, post.id));
      deletedCount++;
    }
    
    return deletedCount;
  }

  // Online visitors
  async updateOnlineVisitor(sessionId: string, currentPage: string): Promise<void> {
    await db.insert(onlineVisitors)
      .values({ sessionId, currentPage, lastSeen: new Date() })
      .onConflictDoUpdate({
        target: onlineVisitors.sessionId,
        set: { currentPage, lastSeen: new Date() }
      });
  }

  async getOnlineVisitorCount(minutesThreshold: number): Promise<number> {
    const thresholdTime = new Date(Date.now() - minutesThreshold * 60 * 1000);
    const [result] = await db.select({ count: count() })
      .from(onlineVisitors)
      .where(sql`${onlineVisitors.lastSeen} > ${thresholdTime}`);
    return result?.count || 0;
  }

  async cleanupOldOnlineVisitors(minutesThreshold: number): Promise<void> {
    const thresholdTime = new Date(Date.now() - minutesThreshold * 60 * 1000);
    await db.delete(onlineVisitors)
      .where(sql`${onlineVisitors.lastSeen} < ${thresholdTime}`);
  }

  // View count incrementing
  async incrementJobViewCount(id: number): Promise<void> {
    await db.update(jobs)
      .set({ viewCount: sql`COALESCE(${jobs.viewCount}, 0) + 1` })
      .where(eq(jobs.id, id));
  }

  async incrementResultViewCount(id: number): Promise<void> {
    await db.update(results)
      .set({ viewCount: sql`COALESCE(${results.viewCount}, 0) + 1` })
      .where(eq(results.id, id));
  }

  async incrementBlogPostViewCount(id: number): Promise<void> {
    await db.update(blogPosts)
      .set({ viewCount: sql`COALESCE(${blogPosts.viewCount}, 0) + 1` })
      .where(eq(blogPosts.id, id));
  }

  async createServiceOrder(order: InsertServiceOrder): Promise<ServiceOrder> {
    const [newOrder] = await db.insert(serviceOrders).values(order).returning();
    return newOrder;
  }

  async getServiceOrder(id: number): Promise<ServiceOrder | undefined> {
    const [order] = await db.select().from(serviceOrders).where(eq(serviceOrders.id, id));
    return order;
  }

  async getServiceOrderByNumber(orderNumber: string): Promise<ServiceOrder | undefined> {
    const [order] = await db.select().from(serviceOrders).where(eq(serviceOrders.orderNumber, orderNumber));
    return order;
  }

  async getNextOrderNumber(): Promise<string> {
    const START = 100000001;
    const [row] = await db
      .select({ maxNum: sql<string>`max(${serviceOrders.orderNumber})` })
      .from(serviceOrders)
      .where(sql`${serviceOrders.orderNumber} ~ '^[0-9]{9}$'`);
    const maxNum = row?.maxNum ? parseInt(row.maxNum, 10) : 0;
    return String(Math.max(START, maxNum + 1));
  }

  async getServiceOrders(): Promise<ServiceOrder[]> {
    return await db.select().from(serviceOrders).orderBy(desc(serviceOrders.createdAt));
  }

  async getServiceOrdersByEmail(email: string): Promise<ServiceOrder[]> {
    return await db.select().from(serviceOrders)
      .where(eq(serviceOrders.customerEmail, email))
      .orderBy(desc(serviceOrders.createdAt));
  }

  async getServiceOrdersByMemberId(memberId: number): Promise<ServiceOrder[]> {
    return await db.select().from(serviceOrders)
      .where(eq(serviceOrders.memberId, memberId))
      .orderBy(desc(serviceOrders.createdAt));
  }

  async updateServiceOrderStatus(id: number, status: string, cancellationReason?: string): Promise<ServiceOrder | undefined> {
    const updateData: any = { status, updatedAt: new Date() };
    if (status === "cancelled" && cancellationReason) {
      updateData.cancellationReason = cancellationReason;
    }
    const [updated] = await db.update(serviceOrders)
      .set(updateData)
      .where(eq(serviceOrders.id, id))
      .returning();
    return updated;
  }

  async deleteServiceOrder(id: number): Promise<void> {
    await db.delete(serviceOrders).where(eq(serviceOrders.id, id));
  }
  
  // Courses
  async getCourses(): Promise<Course[]> {
    return await db.select().from(courses).where(eq(courses.status, "published")).orderBy(desc(courses.createdAt));
  }
  
  async getAllCourses(): Promise<Course[]> {
    return await db.select().from(courses).orderBy(desc(courses.createdAt));
  }
  
  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }
  
  async createCourse(course: InsertCourse): Promise<Course> {
    const [newCourse] = await db.insert(courses).values(course).returning();
    return newCourse;
  }
  
  async updateCourse(id: number, course: Partial<InsertCourse>): Promise<Course | undefined> {
    const [updated] = await db.update(courses)
      .set({ ...course, updatedAt: new Date() })
      .where(eq(courses.id, id))
      .returning();
    return updated;
  }
  
  async deleteCourse(id: number): Promise<boolean> {
    await db.delete(courses).where(eq(courses.id, id));
    return true;
  }

  async getAnalytics(): Promise<Record<string, any>> {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const since7d  = new Date(Date.now() - 7  * 24 * 60 * 60 * 1000);

    const [
      allJobs, allBlogs, allOrgs,
      jobs24h, blogs24h,
      communityPosts24h, communityComments24h,
      communityMembers24h,
      communityPosts7d,
      announcements24h,
      topJobs,
      totalMembers, totalCvAnalyses,
      onlineNow,
    ] = await Promise.all([
      db.select({ count: count() }).from(jobs).where(eq(jobs.status, "published")),
      db.select({ count: count() }).from(blogPosts).where(eq(blogPosts.status, "published")),
      db.select({ count: count() }).from(organizations),
      db.select({ count: count() }).from(jobs).where(and(eq(jobs.status, "published"), gte(jobs.createdAt, since24h))),
      db.select({ count: count() }).from(blogPosts).where(gte(blogPosts.createdAt, since24h)),
      db.select({ count: count() }).from(communityPosts).where(gte(communityPosts.createdAt, since24h)),
      db.select({ count: count() }).from(communityComments).where(gte(communityComments.createdAt, since24h)),
      db.select({ count: count() }).from(communityMembersTable).where(gte(communityMembersTable.createdAt, since24h)),
      db.select({ count: count() }).from(communityPosts).where(gte(communityPosts.createdAt, since7d)),
      db.select({ count: count() }).from(announcements).where(gte(announcements.createdAt, since24h)),
      db.select({ id: jobs.id, title: jobs.title, company: jobs.company, viewCount: jobs.viewCount, category: jobs.category })
        .from(jobs).where(eq(jobs.status, "published")).orderBy(desc(jobs.viewCount)).limit(5),
      db.select({ count: count() }).from(communityMembersTable),
      db.select({ total: sql<number>`coalesce(sum(${communityMembersTable.cvAnalysisUsed}), 0)` }).from(communityMembersTable),
      db.select({ count: count() }).from(onlineVisitors).where(gte(onlineVisitors.lastSeen, since24h)),
    ]);

    const categoryBreakdown = await db
      .select({ category: jobs.category, count: count() })
      .from(jobs)
      .where(eq(jobs.status, "published"))
      .groupBy(jobs.category);

    return {
      totalJobs: allJobs[0]?.count ?? 0,
      totalBlogs: allBlogs[0]?.count ?? 0,
      totalOrganizations: allOrgs[0]?.count ?? 0,
      jobs24h: jobs24h[0]?.count ?? 0,
      blogs24h: blogs24h[0]?.count ?? 0,
      communityPosts24h: communityPosts24h[0]?.count ?? 0,
      communityComments24h: communityComments24h[0]?.count ?? 0,
      newMembers24h: communityMembers24h[0]?.count ?? 0,
      communityPosts7d: communityPosts7d[0]?.count ?? 0,
      announcements24h: announcements24h[0]?.count ?? 0,
      topJobs,
      totalMembers: totalMembers[0]?.count ?? 0,
      totalCvAnalyses: Number(totalCvAnalyses[0]?.total ?? 0),
      onlineNow: onlineNow[0]?.count ?? 0,
      categoryBreakdown: Object.fromEntries(categoryBreakdown.map(r => [r.category, r.count])),
    };
  }

  // Announcements
  async getAnnouncements(): Promise<Announcement[]> {
    return await db.select().from(announcements).orderBy(desc(announcements.createdAt));
  }

  async getActiveAnnouncements(): Promise<Announcement[]> {
    const now = new Date();
    const all = await db.select().from(announcements)
      .where(eq(announcements.status, "active"))
      .orderBy(desc(announcements.createdAt));
    return all.filter(a => {
      if (a.startDate && a.startDate > now) return false;
      if (a.endDate && a.endDate < now) return false;
      return true;
    });
  }

  async getAnnouncement(id: number): Promise<Announcement | undefined> {
    const [item] = await db.select().from(announcements).where(eq(announcements.id, id));
    return item;
  }

  async createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement> {
    const [item] = await db.insert(announcements).values(announcement).returning();
    return item;
  }

  async updateAnnouncement(id: number, announcement: Partial<InsertAnnouncement>): Promise<Announcement | undefined> {
    const [item] = await db.update(announcements).set(announcement).where(eq(announcements.id, id)).returning();
    return item;
  }

  async deleteAnnouncement(id: number): Promise<boolean> {
    await db.delete(announcements).where(eq(announcements.id, id));
    return true;
  }

  // Job Reports
  async getJobReports(): Promise<JobReport[]> {
    return await db.select().from(jobReports).orderBy(desc(jobReports.createdAt));
  }

  async getJobReport(id: number): Promise<JobReport | undefined> {
    const [report] = await db.select().from(jobReports).where(eq(jobReports.id, id));
    return report;
  }

  async createJobReport(report: InsertJobReport): Promise<JobReport> {
    const [newReport] = await db.insert(jobReports).values(report).returning();
    return newReport;
  }

  async resolveJobReport(id: number, resolvedBy: number, status: string): Promise<JobReport | undefined> {
    const [updated] = await db.update(jobReports)
      .set({ status, resolvedBy, resolvedAt: new Date() })
      .where(eq(jobReports.id, id))
      .returning();
    return updated;
  }

  // Services
  async getServices(): Promise<Service[]> {
    return await db.select().from(services).where(eq(services.isActive, true)).orderBy(services.sortOrder);
  }
  
  async getAllServices(): Promise<Service[]> {
    return await db.select().from(services).orderBy(services.sortOrder);
  }
  
  async getService(id: number): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service;
  }
  
  async getServiceBySlug(slug: string): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.slug, slug));
    return service;
  }
  
  async createService(service: InsertService): Promise<Service> {
    const [newService] = await db.insert(services).values(service).returning();
    return newService;
  }
  
  async updateService(id: number, service: Partial<InsertService>): Promise<Service | undefined> {
    const [updated] = await db.update(services)
      .set({ ...service, updatedAt: new Date() })
      .where(eq(services.id, id))
      .returning();
    return updated;
  }
  
  async deleteService(id: number): Promise<boolean> {
    await db.delete(services).where(eq(services.id, id));
    return true;
  }

  // Weekly Summaries
  async getLatestDailyMarketSnapshot(): Promise<DailyMarketSnapshot | undefined> {
    const [snapshot] = await db.select().from(dailyMarketSnapshots).orderBy(desc(dailyMarketSnapshots.generatedAt)).limit(1);
    return snapshot;
  }

  async saveDailyMarketSnapshot(data: InsertDailyMarketSnapshot): Promise<DailyMarketSnapshot> {
    const [created] = await db.insert(dailyMarketSnapshots).values(data).returning();
    return created;
  }

  async getLatestWeeklySummary(): Promise<WeeklySummary | undefined> {
    const [summary] = await db.select().from(weeklySummaries).orderBy(desc(weeklySummaries.generatedAt)).limit(1);
    return summary;
  }

  async getAllWeeklySummaries(): Promise<WeeklySummary[]> {
    return await db.select().from(weeklySummaries).orderBy(desc(weeklySummaries.generatedAt));
  }

  async createWeeklySummary(summary: InsertWeeklySummary): Promise<WeeklySummary> {
    const [created] = await db.insert(weeklySummaries).values(summary).returning();
    return created;
  }

  async deleteWeeklySummary(id: number): Promise<void> {
    await db.delete(weeklySummaries).where(eq(weeklySummaries.id, id));
  }

  async subscribeToWeeklySummary(data: { userId: string; email: string; displayName?: string }): Promise<WeeklySubscription> {
    const existing = await db.select().from(weeklySubscriptions).where(eq(weeklySubscriptions.userId, data.userId)).limit(1);
    if (existing.length > 0) {
      const [updated] = await db.update(weeklySubscriptions)
        .set({ isActive: true, email: data.email, displayName: data.displayName })
        .where(eq(weeklySubscriptions.userId, data.userId))
        .returning();
      return updated;
    }
    const [created] = await db.insert(weeklySubscriptions).values({
      userId: data.userId,
      email: data.email,
      displayName: data.displayName,
      isActive: true,
    }).returning();
    return created;
  }

  async unsubscribeFromWeeklySummary(userId: string): Promise<void> {
    await db.update(weeklySubscriptions).set({ isActive: false }).where(eq(weeklySubscriptions.userId, userId));
  }

  async getWeeklySubscriptionStatus(userId: string): Promise<boolean> {
    const [row] = await db.select().from(weeklySubscriptions)
      .where(and(eq(weeklySubscriptions.userId, userId), eq(weeklySubscriptions.isActive, true)))
      .limit(1);
    return !!row;
  }

  async getAllActiveWeeklySubscribers(): Promise<WeeklySubscription[]> {
    return await db.select().from(weeklySubscriptions).where(eq(weeklySubscriptions.isActive, true));
  }

  // Employer Jobs
  async getEmployerJobs(region?: string): Promise<EmployerJob[]> {
    const now = new Date();
    const baseConditions: any[] = [
      eq(employerJobs.status, "published"),
      isNull(employerJobs.trashedAt),
      sql`(${employerJobs.deadlineDate} IS NULL OR ${employerJobs.deadlineDate} > ${now})`,
    ];
    if (region) {
      return await db.select().from(employerJobs)
        .where(and(...baseConditions, eq(employerJobs.region, region)))
        .orderBy(desc(employerJobs.createdAt));
    }
    return await db.select().from(employerJobs)
      .where(and(...baseConditions))
      .orderBy(desc(employerJobs.createdAt));
  }

  async getEmployerJobsByStatus(status: string): Promise<EmployerJob[]> {
    if (status === "closed") {
      const now = new Date();
      return await db.select().from(employerJobs)
        .where(and(
          eq(employerJobs.status, "published"),
          isNull(employerJobs.trashedAt),
          sql`${employerJobs.deadlineDate} IS NOT NULL AND ${employerJobs.deadlineDate} <= ${now}`,
        ))
        .orderBy(desc(employerJobs.deadlineDate));
    }
    if (status === "trashed") {
      return await db.select().from(employerJobs)
        .where(isNotNull(employerJobs.trashedAt))
        .orderBy(desc(employerJobs.trashedAt));
    }
    return await db.select().from(employerJobs)
      .where(and(eq(employerJobs.status, status), isNull(employerJobs.trashedAt)))
      .orderBy(desc(employerJobs.createdAt));
  }

  async getEmployerJob(id: number): Promise<EmployerJob | undefined> {
    const [job] = await db.select().from(employerJobs).where(eq(employerJobs.id, id));
    return job;
  }

  async createEmployerJob(job: InsertEmployerJob): Promise<EmployerJob> {
    const [created] = await db.insert(employerJobs).values(job).returning();
    return created;
  }

  async updateEmployerJobStatus(id: number, status: string): Promise<EmployerJob | undefined> {
    if (status === "trashed") {
      const [updated] = await db.update(employerJobs)
        .set({ trashedAt: new Date(), updatedAt: new Date() })
        .where(eq(employerJobs.id, id))
        .returning();
      return updated;
    }
    const [updated] = await db.update(employerJobs)
      .set({ status, trashedAt: null, updatedAt: new Date() })
      .where(eq(employerJobs.id, id))
      .returning();
    return updated;
  }

  async updateEmployerJob(id: number, data: Partial<InsertEmployerJob>): Promise<EmployerJob | undefined> {
    const [updated] = await db.update(employerJobs)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(employerJobs.id, id))
      .returning();
    return updated;
  }

  async deleteEmployerJob(id: number): Promise<boolean> {
    await db.delete(employerJobs).where(eq(employerJobs.id, id));
    return true;
  }

  async incrementEmployerJobViewCount(id: number): Promise<void> {
    await db.update(employerJobs)
      .set({ viewCount: sql`${employerJobs.viewCount} + 1` })
      .where(eq(employerJobs.id, id));
  }

  async getSimilarEmployerJobs(excludeId: number, title: string, limit: number): Promise<EmployerJob[]> {
    const now = new Date().toISOString().split("T")[0];
    const words = title.split(/\s+/).filter(w => w.length > 2);
    if (words.length === 0) return [];
    const titleCondition = or(...words.map(w => ilike(employerJobs.title, `%${w}%`)))!;
    return await db.select().from(employerJobs)
      .where(and(
        eq(employerJobs.status, "published"),
        isNull(employerJobs.trashedAt),
        sql`(${employerJobs.deadlineDate} IS NULL OR ${employerJobs.deadlineDate} > ${now})`,
        ne(employerJobs.id, excludeId),
        titleCondition,
      ))
      .orderBy(desc(employerJobs.createdAt))
      .limit(limit);
  }

  // Employer Job Reports
  async getEmployerJobReports(): Promise<EmployerJobReport[]> {
    return await db.select().from(employerJobReports).orderBy(desc(employerJobReports.createdAt));
  }

  async createEmployerJobReport(report: InsertEmployerJobReport): Promise<EmployerJobReport> {
    const [created] = await db.insert(employerJobReports).values(report).returning();
    return created;
  }

  async resolveEmployerJobReport(id: number, status: string): Promise<EmployerJobReport | undefined> {
    const [updated] = await db.update(employerJobReports)
      .set({ status, resolvedAt: new Date() })
      .where(eq(employerJobReports.id, id))
      .returning();
    return updated;
  }

  // Job Application Credits
  async getJobApplicationCredits(memberId: number): Promise<JobApplicationCredits | undefined> {
    const [row] = await db.select().from(jobApplicationCredits).where(eq(jobApplicationCredits.memberId, memberId));
    return row;
  }

  async addJobApplicationCredits(memberId: number, amount: number, expiresAt?: Date): Promise<JobApplicationCredits> {
    const existing = await this.getJobApplicationCredits(memberId);
    if (existing) {
      const [updated] = await db.update(jobApplicationCredits)
        .set({ balance: existing.balance + amount, expiresAt: expiresAt ?? existing.expiresAt, updatedAt: new Date() })
        .where(eq(jobApplicationCredits.memberId, memberId))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(jobApplicationCredits)
        .values({ memberId, balance: amount, expiresAt: expiresAt ?? null })
        .returning();
      return created;
    }
  }

  async useJobApplicationCredit(memberId: number): Promise<boolean> {
    const existing = await this.getJobApplicationCredits(memberId);
    if (!existing || existing.balance <= 0) return false;
    if (existing.expiresAt && new Date() > new Date(existing.expiresAt)) return false;
    await db.update(jobApplicationCredits)
      .set({ balance: existing.balance - 1, updatedAt: new Date() })
      .where(eq(jobApplicationCredits.memberId, memberId));
    return true;
  }

  async deductJobApplicationCredits(memberId: number, amount: number): Promise<boolean> {
    const existing = await this.getJobApplicationCredits(memberId);
    if (!existing) return false;
    const newBalance = Math.max(0, existing.balance - amount);
    await db.update(jobApplicationCredits)
      .set({ balance: newBalance, updatedAt: new Date() })
      .where(eq(jobApplicationCredits.memberId, memberId));
    return true;
  }

  async getAllJobApplicationCredits(): Promise<JobApplicationCredits[]> {
    return await db.select().from(jobApplicationCredits).orderBy(desc(jobApplicationCredits.updatedAt));
  }

  async saveCvAnalysisHistory(data: InsertCvAnalysisHistory): Promise<CvAnalysisHistory> {
    const [row] = await db.insert(cvAnalysisHistory).values(data).returning();
    return row;
  }

  async getCvAnalysisHistoryByMember(memberId: number): Promise<CvAnalysisHistory[]> {
    return await db.select().from(cvAnalysisHistory)
      .where(eq(cvAnalysisHistory.memberId, memberId))
      .orderBy(desc(cvAnalysisHistory.createdAt))
      .limit(200);
  }

  async getJobAlertPoints(memberId: number): Promise<{ freePoints: number; paidPoints: number }> {
    const [member] = await db.select({
      jobAlertPoints: communityMembersTable.jobAlertPoints,
      jobAlertPaidPoints: communityMembersTable.jobAlertPaidPoints,
    })
      .from(communityMembersTable)
      .where(eq(communityMembersTable.id, memberId));
    return {
      freePoints: member?.jobAlertPoints ?? 0,
      paidPoints: member?.jobAlertPaidPoints ?? 0,
    };
  }

  async addJobAlertPoints(memberId: number, amount: number): Promise<void> {
    await db.update(communityMembersTable)
      .set({ jobAlertPaidPoints: sql`COALESCE(${communityMembersTable.jobAlertPaidPoints}, 0) + ${amount}` })
      .where(eq(communityMembersTable.id, memberId));
  }

  async deductJobAlertPoint(memberId: number): Promise<boolean> {
    const { freePoints, paidPoints } = await this.getJobAlertPoints(memberId);
    if (paidPoints <= 0 && freePoints <= 0) return false;
    if (paidPoints > 0) {
      await db.update(communityMembersTable)
        .set({ jobAlertPaidPoints: sql`GREATEST(0, COALESCE(${communityMembersTable.jobAlertPaidPoints}, 0) - 1)` })
        .where(eq(communityMembersTable.id, memberId));
    } else {
      await db.update(communityMembersTable)
        .set({ jobAlertPoints: sql`GREATEST(0, COALESCE(${communityMembersTable.jobAlertPoints}, 0) - 1)` })
        .where(eq(communityMembersTable.id, memberId));
    }
    return true;
  }

  async hasJobAlertSent(memberId: number, jobId: number): Promise<boolean> {
    const [row] = await db.select({ id: jobAlertSent.id })
      .from(jobAlertSent)
      .where(and(eq(jobAlertSent.memberId, memberId), eq(jobAlertSent.jobId, jobId)));
    return !!row;
  }

  async markJobAlertSent(memberId: number, jobId: number): Promise<void> {
    await db.insert(jobAlertSent).values({ memberId, jobId }).onConflictDoNothing();
  }

  async getJobAlertSentByJob(jobId: number): Promise<{ memberId: number }[]> {
    return await db.select({ memberId: jobAlertSent.memberId })
      .from(jobAlertSent)
      .where(eq(jobAlertSent.jobId, jobId));
  }

  async deleteJobAlertSentByJob(jobId: number): Promise<void> {
    await db.delete(jobAlertSent).where(eq(jobAlertSent.jobId, jobId));
  }

  async refundJobAlertPoint(memberId: number): Promise<void> {
    await db.update(communityMembersTable)
      .set({ jobAlertPoints: sql`COALESCE(${communityMembersTable.jobAlertPoints}, 0) + 1` })
      .where(eq(communityMembersTable.id, memberId));
  }

  async getExpiredJobCredits(): Promise<JobApplicationCredits[]> {
    return await db.select().from(jobApplicationCredits)
      .where(and(
        sql`${jobApplicationCredits.expiresAt} < now()`,
        sql`${jobApplicationCredits.balance} > 0`
      ));
  }

  async getJobCreditsExpiringIn(days: number): Promise<JobApplicationCredits[]> {
    return await db.select().from(jobApplicationCredits)
      .where(and(
        sql`${jobApplicationCredits.expiresAt} < now() + interval '${sql.raw(String(days))} days'`,
        sql`${jobApplicationCredits.expiresAt} > now()`,
        sql`${jobApplicationCredits.balance} > 0`
      ));
  }

  async zeroJobApplicationCredits(memberId: number): Promise<void> {
    await db.update(jobApplicationCredits)
      .set({ balance: 0, updatedAt: new Date() })
      .where(eq(jobApplicationCredits.memberId, memberId));
  }

  // Job Application Requests
  async createJobApplicationRequest(data: InsertJobApplicationRequest): Promise<JobApplicationRequest> {
    const [row] = await db.insert(jobApplicationRequests).values(data).returning();
    return row;
  }

  async getJobApplicationRequests(): Promise<JobApplicationRequest[]> {
    return await db.select().from(jobApplicationRequests).orderBy(desc(jobApplicationRequests.createdAt));
  }

  async getJobApplicationRequestsByMember(memberId: number): Promise<JobApplicationRequest[]> {
    return await db.select().from(jobApplicationRequests)
      .where(eq(jobApplicationRequests.memberId, memberId))
      .orderBy(desc(jobApplicationRequests.createdAt));
  }

  async updateJobApplicationRequestStatus(id: number, status: string, notes?: string): Promise<JobApplicationRequest | undefined> {
    const updateData: any = { status, updatedAt: new Date() };
    if (notes !== undefined) updateData.notes = notes;
    const [updated] = await db.update(jobApplicationRequests)
      .set(updateData)
      .where(eq(jobApplicationRequests.id, id))
      .returning();
    return updated;
  }

  async getJobApplicationRequest(id: number): Promise<JobApplicationRequest | undefined> {
    const [row] = await db.select().from(jobApplicationRequests).where(eq(jobApplicationRequests.id, id));
    return row;
  }

  async deleteJobApplicationRequest(id: number): Promise<void> {
    await db.delete(jobApplicationRequests).where(eq(jobApplicationRequests.id, id));
  }

  // ─── Support Tickets ────────────────────────────────────────────────────
  async createSupportTicket(data: InsertSupportTicket): Promise<SupportTicket> {
    const [row] = await db.insert(supportTickets).values(data).returning();
    return row;
  }

  async getSupportTicketsByMember(memberId: number): Promise<SupportTicket[]> {
    return db.select().from(supportTickets)
      .where(eq(supportTickets.memberId, memberId))
      .orderBy(desc(supportTickets.updatedAt));
  }

  async getSupportTicket(id: number): Promise<SupportTicket | undefined> {
    const [row] = await db.select().from(supportTickets).where(eq(supportTickets.id, id)).limit(1);
    return row;
  }

  async getSupportTicketByNumber(ticketNumber: string): Promise<SupportTicket | undefined> {
    const [row] = await db.select().from(supportTickets).where(eq(supportTickets.ticketNumber, ticketNumber)).limit(1);
    return row;
  }

  async updateSupportTicketStatus(id: number, status: string, extra: Partial<SupportTicket> = {}): Promise<SupportTicket | undefined> {
    const [row] = await db.update(supportTickets)
      .set({ status, updatedAt: new Date(), ...extra })
      .where(eq(supportTickets.id, id))
      .returning();
    return row;
  }

  async getAllSupportTickets(status?: string): Promise<(SupportTicket & { memberName?: string; memberEmail?: string })[]> {
    const rows = await db.select({
      ticket: supportTickets,
      memberName: communityMembersTable.displayName,
      memberEmail: communityMembersTable.email,
    })
      .from(supportTickets)
      .leftJoin(communityMembersTable, eq(supportTickets.memberId, communityMembersTable.id))
      .where(status && status !== "all" ? eq(supportTickets.status, status) : undefined)
      .orderBy(desc(supportTickets.updatedAt));
    return rows.map(r => ({ ...r.ticket, memberName: r.memberName ?? undefined, memberEmail: r.memberEmail ?? undefined }));
  }

  async getTicketsAwaitingAutoClose(): Promise<SupportTicket[]> {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return db.select().from(supportTickets)
      .where(and(
        eq(supportTickets.status, "in_progress"),
        isNotNull(supportTickets.lastAdminReplyAt),
        lt(supportTickets.lastAdminReplyAt, cutoff),
      ));
  }

  async createSupportTicketReply(data: InsertSupportTicketReply): Promise<SupportTicketReply> {
    const [row] = await db.insert(supportTicketReplies).values(data).returning();
    return row;
  }

  async getSupportTicketReplies(ticketId: number): Promise<SupportTicketReply[]> {
    return db.select().from(supportTicketReplies)
      .where(eq(supportTicketReplies.ticketId, ticketId))
      .orderBy(supportTicketReplies.createdAt);
  }

  async getFaqItems(publishedOnly = false): Promise<FaqItem[]> {
    const q = db.select().from(faqItems);
    if (publishedOnly) {
      return q.where(eq(faqItems.isPublished, true)).orderBy(faqItems.sortOrder, faqItems.createdAt);
    }
    return q.orderBy(faqItems.sortOrder, faqItems.createdAt);
  }

  async getFaqItem(id: number): Promise<FaqItem | undefined> {
    const [item] = await db.select().from(faqItems).where(eq(faqItems.id, id));
    return item;
  }

  async createFaqItem(data: InsertFaqItem): Promise<FaqItem> {
    const [item] = await db.insert(faqItems).values(data).returning();
    return item;
  }

  async updateFaqItem(id: number, data: Partial<InsertFaqItem>): Promise<FaqItem | undefined> {
    const [item] = await db.update(faqItems)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(faqItems.id, id))
      .returning();
    return item;
  }

  async deleteFaqItem(id: number): Promise<void> {
    await db.delete(faqItems).where(eq(faqItems.id, id));
  }

  async getFaqCategories(): Promise<FaqCategory[]> {
    return db.select().from(faqCategories).orderBy(faqCategories.sortOrder, faqCategories.createdAt);
  }

  async createFaqCategory(data: InsertFaqCategory): Promise<FaqCategory> {
    const [cat] = await db.insert(faqCategories).values(data).returning();
    return cat;
  }

  async updateFaqCategory(id: number, data: Partial<InsertFaqCategory>): Promise<FaqCategory | undefined> {
    const [cat] = await db.update(faqCategories).set(data).where(eq(faqCategories.id, id)).returning();
    return cat;
  }

  async deleteFaqCategory(id: number): Promise<void> {
    await db.delete(faqCategories).where(eq(faqCategories.id, id));
  }
}

export const storage = new DatabaseStorage();

// Seed default services
export async function seedServices() {
  const existingServices = await db.select().from(services);
  if (existingServices.length > 0) {
    console.log("Services already seeded");
    return;
  }

  const defaultServices: InsertService[] = [
    {
      slug: "cv",
      title: "تصميم سيرة ذاتية",
      description: "نصمم لك سيرة ذاتية متوافقة مع أنظمة تتبع المتقدمين (ATS) لزيادة فرص قبولك. سيرة ذاتية احترافية تُبرز مهاراتك وخبراتك بأفضل شكل ممكن.",
      icon: "FileText",
      color: "from-blue-500 to-cyan-400",
      price: 30,
      variants: JSON.stringify([
        { name: "باللغة العربية", price: 30 },
        { name: "باللغة الإنجليزية", price: 50 },
        { name: "اللغة العربية + الإنجليزية", price: 80 }
      ]),
      isFeatured: false,
      isActive: true,
      sortOrder: 1
    },
    {
      slug: "job-application",
      title: "التقديم على وظيفة",
      description: "نساعدك في التقديم الاحترافي على الوظائف التي تناسب مهاراتك وخبراتك مع ضمان اتباع أفضل الممارسات.",
      icon: "Send",
      color: "from-green-500 to-emerald-400",
      price: 30,
      isFeatured: false,
      isActive: true,
      sortOrder: 2
    },
    {
      slug: "jadarat",
      title: "التسجيل في جدارات",
      description: "خدمة تسجيل وتحديث البيانات في المنصة الوطنية الموحدة للتوظيف (جدارات) لضمان ظهورك أمام جهات التوظيف الحكومية.",
      icon: "UserCheck",
      color: "from-purple-500 to-indigo-400",
      price: 50,
      isFeatured: false,
      isActive: true,
      sortOrder: 3
    },
    {
      slug: "taqat",
      title: "التسجيل في طاقات",
      description: "نسهل عليك عملية التسجيل في بوابة طاقات للاستفادة من برامج دعم التوظيف والحصول على الفرص المناسبة.",
      icon: "Briefcase",
      color: "from-orange-500 to-yellow-400",
      price: 50,
      isFeatured: false,
      isActive: true,
      sortOrder: 4
    },
    {
      slug: "linkedin",
      title: "التسجيل في لينكد إن",
      description: "بناء ملف شخصي احترافي على LinkedIn يجذب أصحاب العمل والمؤسسات ويزيد من ظهورك أمام مسؤولي التوظيف.",
      icon: "Linkedin",
      color: "from-blue-600 to-blue-400",
      price: 60,
      isFeatured: false,
      isActive: true,
      sortOrder: 5
    },
    {
      slug: "comprehensive",
      title: "الباقة الشاملة",
      description: "باقة النخبة التي تجمع كافة خدماتنا في باقة واحدة متكاملة مع خصم خاص 15%. الخيار الأمثل للحصول على كل ما تحتاجه بسعر مميز.",
      icon: "Layers",
      color: "from-red-500 to-rose-400",
      price: 230,
      oldPrice: 270,
      discount: "15%",
      isFeatured: true,
      isActive: true,
      sortOrder: 6
    }
  ];

  for (const service of defaultServices) {
    await db.insert(services).values(service).onConflictDoNothing();
  }
  
  console.log("Default services seeded successfully");
}

export async function ensureJobCreditsService() {
  await db.insert(services).values({
    slug: "job-credits",
    title: "باقات التقديم على الوظائف",
    description: "اشحن رصيدك من طلبات التقديم على الوظائف. كل رصيد = تقديم واحد. فريقنا يتولى التقديم نيابةً عنك بشكل احترافي وفي أسرع وقت.",
    icon: "Send",
    color: "from-green-500 to-emerald-400",
    price: 15,
    variants: JSON.stringify([
      { name: "1 تقديم", price: 15 },
      { name: "10 تقديمات", price: 140 },
      { name: "20 تقديماً", price: 260 },
      { name: "30 تقديماً", price: 390 },
      { name: "40 تقديماً", price: 440 },
      { name: "50 تقديماً", price: 500 },
    ]),
    isFeatured: true,
    isActive: true,
    sortOrder: 1,
  }).onConflictDoNothing();
}

export async function ensureJobAlertPointsService() {
  await db.insert(services).values({
    slug: "job-alert-points",
    title: "نقاط تنبيهات الوظائف",
    description: "اشحن رصيدك من نقاط تنبيهات الوظائف. كل نقطة = إشعار واحد عند نشر وظيفة جديدة في الجهات التي تتابعها. كلما اشتريت أكثر، وفّرت أكثر.",
    icon: "Bell",
    color: "from-amber-500 to-yellow-400",
    price: 10,
    variants: JSON.stringify([
      { name: "100 نقطة", price: 10 },
      { name: "200 نقطة", price: 18 },
      { name: "300 نقطة", price: 25 },
      { name: "500 نقطة", price: 40 },
      { name: "700 نقطة", price: 52 },
      { name: "1000 نقطة", price: 70 },
    ]),
    isFeatured: true,
    isActive: true,
    sortOrder: 2,
  }).onConflictDoNothing();
}

export async function ensureCvAnalysisService() {
  await db.insert(services).values({
    slug: "cv-analysis-credits",
    title: "رصيد تحليل السيرة الذاتية",
    description: "اشحن رصيدك من تحليلات السيرة الذاتية بالذكاء الاصطناعي وحلّل سيرتك مقابل أي وظيفة دون قيود يومية. صلاحية الرصيد سنة كاملة من تاريخ الشراء.",
    icon: "Sparkles",
    color: "from-violet-500 to-purple-400",
    price: 5,
    variants: JSON.stringify([
      { name: "30 تحليل", price: 5 },
      { name: "60 تحليل", price: 10 },
      { name: "100 تحليل", price: 15 },
    ]),
    isFeatured: true,
    isActive: true,
    sortOrder: 0,
  }).onConflictDoNothing();
}

// Site Settings helpers
export async function getSiteSetting(key: string): Promise<string | null> {
  const [setting] = await db.select().from(siteSettings).where(eq(siteSettings.key, key));
  return setting?.value || null;
}

export async function setSiteSetting(key: string, value: string): Promise<void> {
  const [existing] = await db.select().from(siteSettings).where(eq(siteSettings.key, key));
  if (existing) {
    await db.update(siteSettings).set({ value, updatedAt: new Date() }).where(eq(siteSettings.key, key));
  } else {
    await db.insert(siteSettings).values({ key, value });
  }
}

// Trash helpers
export async function getTrashedJobs(): Promise<Job[]> {
  return await db.select().from(jobs).where(sql`${jobs.trashedAt} IS NOT NULL`).orderBy(desc(jobs.trashedAt));
}

export async function getTrashedResults(): Promise<Result[]> {
  return await db.select().from(results).where(sql`${results.trashedAt} IS NOT NULL`).orderBy(desc(results.trashedAt));
}

export async function getTrashedBlogs(): Promise<BlogPost[]> {
  return await db.select().from(blogPosts).where(sql`${blogPosts.trashedAt} IS NOT NULL`).orderBy(desc(blogPosts.trashedAt));
}

export async function getTrashedPages(): Promise<Page[]> {
  return await db.select().from(pages).where(sql`${pages.trashedAt} IS NOT NULL`).orderBy(desc(pages.trashedAt));
}

export async function restoreFromTrash(type: string, id: number): Promise<void> {
  switch (type) {
    case "jobs":
      await db.update(jobs).set({ trashedAt: null, status: "draft" }).where(eq(jobs.id, id));
      break;
    case "results":
      await db.update(results).set({ trashedAt: null, status: "draft" }).where(eq(results.id, id));
      break;
    case "blogs":
      await db.update(blogPosts).set({ trashedAt: null, status: "draft" }).where(eq(blogPosts.id, id));
      break;
    case "pages":
      await db.update(pages).set({ trashedAt: null, status: "draft" }).where(eq(pages.id, id));
      break;
    case "community":
      await db.update(communityPosts).set({ trashedAt: null, status: "published" }).where(eq(communityPosts.id, id));
      break;
  }
}

export async function permanentlyDelete(type: string, id: number): Promise<void> {
  switch (type) {
    case "jobs":
      await db.delete(jobs).where(eq(jobs.id, id));
      break;
    case "results":
      await db.delete(results).where(eq(results.id, id));
      break;
    case "blogs":
      await db.delete(blogPosts).where(eq(blogPosts.id, id));
      break;
    case "pages":
      await db.delete(pages).where(eq(pages.id, id));
      break;
  }
}
