import { 
  memberRanks, type MemberRank, type InsertMemberRank,
  communityMembers, type CommunityMember, type InsertCommunityMember,
  communityCategories, type CommunityCategory, type InsertCommunityCategory,
  communityPosts, type CommunityPost, type InsertCommunityPost,
  communityComments, type CommunityComment, type InsertCommunityComment,
  communityLikes, type CommunityLike, type InsertCommunityLike,
  communityReports, type CommunityReport, type InsertCommunityReport,
  communityModeratorRequests, type CommunityModeratorRequest, type InsertCommunityModeratorRequest,
  communityModerators, type CommunityModerator, type InsertCommunityModerator,
  communityModeratorPermissions, type CommunityModeratorPermission, type InsertCommunityModeratorPermission,
  communityNotifications, type CommunityNotification, type InsertCommunityNotification,
  jobFavorites, type JobFavorite, type InsertJobFavorite,
  jobs
} from "@workspace/db";
import { db } from "./db";
import { eq, desc, and, sql, count, or, lt } from "drizzle-orm";

export class CommunityStorage {
  // Members
  async getMembers(): Promise<CommunityMember[]> {
    return await db.select().from(communityMembers).orderBy(desc(communityMembers.createdAt));
  }

  async getMember(id: number): Promise<CommunityMember | undefined> {
    const [member] = await db.select().from(communityMembers).where(eq(communityMembers.id, id));
    return member;
  }

  async getMemberByUserId(userId: string): Promise<CommunityMember | undefined> {
    const [member] = await db.select().from(communityMembers).where(eq(communityMembers.userId, userId));
    return member;
  }

  async getMemberByEmail(email: string): Promise<CommunityMember | undefined> {
    const [member] = await db.select().from(communityMembers).where(eq(communityMembers.email, email));
    return member;
  }

  async getMemberByUsername(username: string): Promise<CommunityMember | undefined> {
    const [member] = await db.select().from(communityMembers).where(eq(communityMembers.username, username));
    return member;
  }

  async createMember(member: InsertCommunityMember): Promise<CommunityMember> {
    const [newMember] = await db.insert(communityMembers).values(member).returning();
    return newMember;
  }

  async updateMember(id: number, member: Partial<InsertCommunityMember>): Promise<CommunityMember | undefined> {
    const [updated] = await db.update(communityMembers)
      .set(member)
      .where(eq(communityMembers.id, id))
      .returning();
    return updated;
  }

  async deleteMember(id: number): Promise<boolean> {
    await db.delete(communityMembers).where(eq(communityMembers.id, id));
    return true;
  }

  async getMembersCount(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(communityMembers);
    return result?.count || 0;
  }

  async getMembersWithExpiredCvCredits(): Promise<CommunityMember[]> {
    return await db.select().from(communityMembers)
      .where(and(
        sql`${communityMembers.cvAnalysisPaidCreditsExpiresAt} < now()`,
        sql`${communityMembers.cvAnalysisPaidCredits} > 0`
      ));
  }

  async getMembersWithCvCreditsExpiringIn(days: number): Promise<CommunityMember[]> {
    return await db.select().from(communityMembers)
      .where(and(
        sql`${communityMembers.cvAnalysisPaidCreditsExpiresAt} < now() + interval '${sql.raw(String(days))} days'`,
        sql`${communityMembers.cvAnalysisPaidCreditsExpiresAt} > now()`,
        sql`${communityMembers.cvAnalysisPaidCredits} > 0`
      ));
  }

  // Categories
  async getCommunityCategories(): Promise<CommunityCategory[]> {
    return await db.select().from(communityCategories)
      .where(eq(communityCategories.isActive, true))
      .orderBy(communityCategories.sortOrder);
  }

  async getAllCommunityCategories(): Promise<CommunityCategory[]> {
    return await db.select().from(communityCategories).orderBy(communityCategories.sortOrder);
  }

  async getCommunityCategory(id: number): Promise<CommunityCategory | undefined> {
    const [category] = await db.select().from(communityCategories).where(eq(communityCategories.id, id));
    return category;
  }

  async createCommunityCategory(category: InsertCommunityCategory): Promise<CommunityCategory> {
    const [newCategory] = await db.insert(communityCategories).values(category).returning();
    return newCategory;
  }

  async updateCommunityCategory(id: number, category: Partial<InsertCommunityCategory>): Promise<CommunityCategory | undefined> {
    const [updated] = await db.update(communityCategories)
      .set(category)
      .where(eq(communityCategories.id, id))
      .returning();
    return updated;
  }

  async deleteCommunityCategory(id: number): Promise<boolean> {
    await db.delete(communityCategories).where(eq(communityCategories.id, id));
    return true;
  }

  // Posts
  async getPosts(categoryId?: number): Promise<CommunityPost[]> {
    if (categoryId) {
      return await db.select().from(communityPosts)
        .where(and(eq(communityPosts.categoryId, categoryId), eq(communityPosts.status, "published")))
        .orderBy(desc(communityPosts.isPinned), desc(communityPosts.createdAt));
    }
    return await db.select().from(communityPosts)
      .where(eq(communityPosts.status, "published"))
      .orderBy(desc(communityPosts.isPinned), desc(communityPosts.createdAt));
  }

  async getAllPosts(): Promise<CommunityPost[]> {
    return await db.select().from(communityPosts).orderBy(desc(communityPosts.createdAt));
  }

  async getPost(id: number): Promise<CommunityPost | undefined> {
    const [post] = await db.select().from(communityPosts).where(eq(communityPosts.id, id));
    return post;
  }

  async createPost(post: InsertCommunityPost): Promise<CommunityPost> {
    const [newPost] = await db.insert(communityPosts).values(post).returning();
    // Update member posts count
    await db.update(communityMembers)
      .set({ postsCount: sql`${communityMembers.postsCount} + 1` })
      .where(eq(communityMembers.id, post.memberId));
    // Update category posts count
    await db.update(communityCategories)
      .set({ postsCount: sql`${communityCategories.postsCount} + 1` })
      .where(eq(communityCategories.id, post.categoryId));
    return newPost;
  }

  async updatePost(id: number, post: Partial<InsertCommunityPost>): Promise<CommunityPost | undefined> {
    const old = await this.getPost(id);
    const extra: Record<string, any> = {};
    if (post.status === "trash") extra.trashedAt = new Date();
    else if (post.status && post.status !== "trash") extra.trashedAt = null;
    const [updated] = await db.update(communityPosts)
      .set({ ...post, ...extra, updatedAt: new Date() })
      .where(eq(communityPosts.id, id))
      .returning();

    if (old && updated) {
      const oldPublished = old.status === "published";
      const newPublished = (post.status ?? old.status) === "published";
      const categoryChanged = post.categoryId !== undefined && post.categoryId !== old.categoryId;

      if (categoryChanged) {
        // Remove from old category if it was published
        if (oldPublished) {
          await db.update(communityCategories)
            .set({ postsCount: sql`GREATEST(${communityCategories.postsCount} - 1, 0)` })
            .where(eq(communityCategories.id, old.categoryId));
        }
        // Add to new category if it will be published
        if (newPublished) {
          await db.update(communityCategories)
            .set({ postsCount: sql`${communityCategories.postsCount} + 1` })
            .where(eq(communityCategories.id, post.categoryId!));
        }
      } else if (post.status !== undefined && oldPublished !== newPublished) {
        // Status changed within same category
        if (oldPublished && !newPublished) {
          await db.update(communityCategories)
            .set({ postsCount: sql`GREATEST(${communityCategories.postsCount} - 1, 0)` })
            .where(eq(communityCategories.id, old.categoryId));
        } else if (!oldPublished && newPublished) {
          await db.update(communityCategories)
            .set({ postsCount: sql`${communityCategories.postsCount} + 1` })
            .where(eq(communityCategories.id, old.categoryId));
        }
      }
    }

    return updated;
  }

  async deletePost(id: number): Promise<boolean> {
    const post = await this.getPost(id);
    if (post) {
      // Update member posts count
      await db.update(communityMembers)
        .set({ postsCount: sql`GREATEST(${communityMembers.postsCount} - 1, 0)` })
        .where(eq(communityMembers.id, post.memberId));
      // Update category posts count
      await db.update(communityCategories)
        .set({ postsCount: sql`GREATEST(${communityCategories.postsCount} - 1, 0)` })
        .where(eq(communityCategories.id, post.categoryId));
    }
    await db.delete(communityPosts).where(eq(communityPosts.id, id));
    return true;
  }

  async incrementPostViews(id: number): Promise<void> {
    await db.update(communityPosts)
      .set({ viewsCount: sql`${communityPosts.viewsCount} + 1` })
      .where(eq(communityPosts.id, id));
  }

  async getPostsCount(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(communityPosts).where(eq(communityPosts.status, "published"));
    return result?.count || 0;
  }

  // Comments
  async getComments(postId: number): Promise<CommunityComment[]> {
    return await db.select().from(communityComments)
      .where(and(eq(communityComments.postId, postId), eq(communityComments.status, "published")))
      .orderBy(communityComments.createdAt);
  }

  async getAllComments(): Promise<CommunityComment[]> {
    return await db.select().from(communityComments).orderBy(desc(communityComments.createdAt));
  }

  async getComment(id: number): Promise<CommunityComment | undefined> {
    const [comment] = await db.select().from(communityComments).where(eq(communityComments.id, id));
    return comment;
  }

  async createComment(comment: InsertCommunityComment): Promise<CommunityComment> {
    const [newComment] = await db.insert(communityComments).values(comment).returning();
    // Update post comments count
    await db.update(communityPosts)
      .set({ commentsCount: sql`${communityPosts.commentsCount} + 1` })
      .where(eq(communityPosts.id, comment.postId));
    // Update member comments count
    await db.update(communityMembers)
      .set({ commentsCount: sql`${communityMembers.commentsCount} + 1` })
      .where(eq(communityMembers.id, comment.memberId));
    return newComment;
  }

  async updateComment(id: number, comment: Partial<InsertCommunityComment>): Promise<CommunityComment | undefined> {
    const [updated] = await db.update(communityComments)
      .set({ ...comment, updatedAt: new Date() })
      .where(eq(communityComments.id, id))
      .returning();
    return updated;
  }

  async deleteComment(id: number): Promise<boolean> {
    const comment = await this.getComment(id);
    if (comment) {
      // Update post comments count
      await db.update(communityPosts)
        .set({ commentsCount: sql`GREATEST(${communityPosts.commentsCount} - 1, 0)` })
        .where(eq(communityPosts.id, comment.postId));
      // Update member comments count
      await db.update(communityMembers)
        .set({ commentsCount: sql`GREATEST(${communityMembers.commentsCount} - 1, 0)` })
        .where(eq(communityMembers.id, comment.memberId));
    }
    await db.delete(communityComments).where(eq(communityComments.id, id));
    return true;
  }

  // Likes
  async getLike(memberId: number, postId?: number, commentId?: number): Promise<CommunityLike | undefined> {
    if (postId) {
      const [like] = await db.select().from(communityLikes)
        .where(and(eq(communityLikes.memberId, memberId), eq(communityLikes.postId, postId)));
      return like;
    }
    if (commentId) {
      const [like] = await db.select().from(communityLikes)
        .where(and(eq(communityLikes.memberId, memberId), eq(communityLikes.commentId, commentId)));
      return like;
    }
    return undefined;
  }

  async toggleLike(memberId: number, postId?: number, commentId?: number): Promise<{ liked: boolean }> {
    const existing = await this.getLike(memberId, postId, commentId);
    if (existing) {
      await db.delete(communityLikes).where(eq(communityLikes.id, existing.id));
      if (postId) {
        await db.update(communityPosts)
          .set({ likesCount: sql`GREATEST(${communityPosts.likesCount} - 1, 0)` })
          .where(eq(communityPosts.id, postId));
      }
      if (commentId) {
        await db.update(communityComments)
          .set({ likesCount: sql`GREATEST(${communityComments.likesCount} - 1, 0)` })
          .where(eq(communityComments.id, commentId));
      }
      return { liked: false };
    } else {
      await db.insert(communityLikes).values({ memberId, postId, commentId });
      if (postId) {
        await db.update(communityPosts)
          .set({ likesCount: sql`${communityPosts.likesCount} + 1` })
          .where(eq(communityPosts.id, postId));
      }
      if (commentId) {
        await db.update(communityComments)
          .set({ likesCount: sql`${communityComments.likesCount} + 1` })
          .where(eq(communityComments.id, commentId));
      }
      return { liked: true };
    }
  }

  // Reports
  async getReports(): Promise<CommunityReport[]> {
    return await db.select().from(communityReports).orderBy(desc(communityReports.createdAt));
  }

  async getPendingReports(): Promise<CommunityReport[]> {
    return await db.select().from(communityReports)
      .where(eq(communityReports.status, "pending"))
      .orderBy(desc(communityReports.createdAt));
  }

  async createReport(report: InsertCommunityReport): Promise<CommunityReport> {
    const [newReport] = await db.insert(communityReports).values(report).returning();
    return newReport;
  }

  async resolveReport(id: number, resolvedBy: number, status: string): Promise<CommunityReport | undefined> {
    const [updated] = await db.update(communityReports)
      .set({ status, resolvedBy, resolvedAt: new Date() })
      .where(eq(communityReports.id, id))
      .returning();
    return updated;
  }

  // Moderator Requests
  async getModeratorRequests(): Promise<(CommunityModeratorRequest & { member?: CommunityMember; category?: CommunityCategory })[]> {
    const requests = await db.select().from(communityModeratorRequests).orderBy(desc(communityModeratorRequests.createdAt));
    return await Promise.all(requests.map(async (r) => {
      const [member] = await db.select().from(communityMembers).where(eq(communityMembers.id, r.memberId));
      const [category] = await db.select().from(communityCategories).where(eq(communityCategories.id, r.categoryId));
      return { ...r, member, category };
    }));
  }

  async getPendingModeratorRequests(): Promise<(CommunityModeratorRequest & { member?: CommunityMember; category?: CommunityCategory })[]> {
    const requests = await db.select().from(communityModeratorRequests)
      .where(eq(communityModeratorRequests.status, "pending"))
      .orderBy(desc(communityModeratorRequests.createdAt));
    return await Promise.all(requests.map(async (r) => {
      const [member] = await db.select().from(communityMembers).where(eq(communityMembers.id, r.memberId));
      const [category] = await db.select().from(communityCategories).where(eq(communityCategories.id, r.categoryId));
      return { ...r, member, category };
    }));
  }

  async createModeratorRequest(request: InsertCommunityModeratorRequest): Promise<CommunityModeratorRequest> {
    const [newRequest] = await db.insert(communityModeratorRequests).values(request).returning();
    return newRequest;
  }

  async resolveModeratorRequest(id: number, resolvedBy: number, status: string): Promise<CommunityModeratorRequest | undefined> {
    const [updated] = await db.update(communityModeratorRequests)
      .set({ status, resolvedBy, resolvedAt: new Date() })
      .where(eq(communityModeratorRequests.id, id))
      .returning();
    return updated;
  }

  // Member Ranks
  async getRanks(): Promise<MemberRank[]> {
    return await db.select().from(memberRanks).orderBy(memberRanks.sortOrder, memberRanks.minPosts);
  }

  async getRank(id: number): Promise<MemberRank | undefined> {
    const [rank] = await db.select().from(memberRanks).where(eq(memberRanks.id, id));
    return rank;
  }

  async createRank(rank: InsertMemberRank): Promise<MemberRank> {
    const [newRank] = await db.insert(memberRanks).values(rank).returning();
    return newRank;
  }

  async updateRank(id: number, rank: Partial<InsertMemberRank>): Promise<MemberRank | undefined> {
    const [updated] = await db.update(memberRanks).set(rank).where(eq(memberRanks.id, id)).returning();
    return updated;
  }

  async deleteRank(id: number): Promise<boolean> {
    await db.delete(memberRanks).where(eq(memberRanks.id, id));
    return true;
  }

  async resolveRankForMember(member: CommunityMember): Promise<MemberRank | null> {
    if (member.rankId) {
      const rank = await this.getRank(member.rankId);
      if (rank) return rank;
    }
    const allRanks = await db.select().from(memberRanks)
      .where(eq(memberRanks.isActive, true))
      .orderBy(desc(memberRanks.minPosts));
    const postsCount = member.postsCount ?? 0;
    for (const rank of allRanks) {
      if (postsCount >= (rank.minPosts ?? 0)) return rank;
    }
    return null;
  }

  // Moderators
  async getModerators(): Promise<CommunityModerator[]> {
    return await db.select().from(communityModerators).orderBy(desc(communityModerators.createdAt));
  }

  async getModerator(id: number): Promise<CommunityModerator | undefined> {
    const [moderator] = await db.select().from(communityModerators).where(eq(communityModerators.id, id));
    return moderator;
  }

  async getModeratorByMemberId(memberId: number): Promise<CommunityModerator | undefined> {
    const [moderator] = await db.select().from(communityModerators).where(and(eq(communityModerators.memberId, memberId), eq(communityModerators.isActive, true)));
    return moderator;
  }

  async getModeratorsByMemberId(memberId: number): Promise<CommunityModerator[]> {
    return await db.select().from(communityModerators).where(and(eq(communityModerators.memberId, memberId), eq(communityModerators.isActive, true)));
  }

  async getModeratorForCategory(memberId: number, categoryId: number): Promise<CommunityModerator | undefined> {
    const [mod] = await db.select().from(communityModerators).where(
      and(
        eq(communityModerators.memberId, memberId),
        eq(communityModerators.isActive, true),
        or(eq(communityModerators.categoryId, categoryId), sql`${communityModerators.categoryId} IS NULL`)
      )
    );
    return mod;
  }

  async createModerator(moderator: InsertCommunityModerator): Promise<CommunityModerator> {
    const [newModerator] = await db.insert(communityModerators).values(moderator).returning();
    return newModerator;
  }

  async updateModerator(id: number, moderator: Partial<InsertCommunityModerator>): Promise<CommunityModerator | undefined> {
    const [updated] = await db.update(communityModerators)
      .set(moderator)
      .where(eq(communityModerators.id, id))
      .returning();
    return updated;
  }

  async deleteModerator(id: number): Promise<boolean> {
    await db.delete(communityModerators).where(eq(communityModerators.id, id));
    return true;
  }

  async getModeratorsCount(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(communityModerators).where(eq(communityModerators.isActive, true));
    return result?.count || 0;
  }

  // Moderator Permissions
  async getModeratorPermissions(): Promise<CommunityModeratorPermission[]> {
    return await db.select().from(communityModeratorPermissions).orderBy(communityModeratorPermissions.name);
  }

  async getModeratorPermission(id: number): Promise<CommunityModeratorPermission | undefined> {
    const [permission] = await db.select().from(communityModeratorPermissions).where(eq(communityModeratorPermissions.id, id));
    return permission;
  }

  async createModeratorPermission(permission: InsertCommunityModeratorPermission): Promise<CommunityModeratorPermission> {
    const [newPermission] = await db.insert(communityModeratorPermissions).values(permission).returning();
    return newPermission;
  }

  async updateModeratorPermission(id: number, permission: Partial<InsertCommunityModeratorPermission>): Promise<CommunityModeratorPermission | undefined> {
    const [updated] = await db.update(communityModeratorPermissions)
      .set(permission)
      .where(eq(communityModeratorPermissions.id, id))
      .returning();
    return updated;
  }

  async deleteModeratorPermission(id: number): Promise<boolean> {
    await db.delete(communityModeratorPermissions).where(eq(communityModeratorPermissions.id, id));
    return true;
  }

  async getModeratorPermissionsCount(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(communityModeratorPermissions).where(eq(communityModeratorPermissions.isActive, true));
    return result?.count || 0;
  }

  // Stats
  async getCommunityStats(): Promise<{
    membersCount: number;
    postsCount: number;
    commentsCount: number;
    onlineCount: number;
    totalPosts: number;
    totalCategories: number;
    totalMembers: number;
    totalModerators: number;
    totalPermissions: number;
    totalReports: number;
    pendingReports: number;
    totalModeratorRequests: number;
    pendingModeratorRequests: number;
  }> {
    const [members] = await db.select({ count: count() }).from(communityMembers);
    const [posts] = await db.select({ count: count() }).from(communityPosts).where(eq(communityPosts.status, "published"));
    const [comments] = await db.select({ count: count() }).from(communityComments).where(eq(communityComments.status, "published"));
    const [categories] = await db.select({ count: count() }).from(communityCategories);
    const [moderators] = await db.select({ count: count() }).from(communityModerators).where(eq(communityModerators.isActive, true));
    const [permissions] = await db.select({ count: count() }).from(communityModeratorPermissions);
    const [reports] = await db.select({ count: count() }).from(communityReports);
    const [pendingReports] = await db.select({ count: count() }).from(communityReports).where(eq(communityReports.status, "pending"));
    const [modRequests] = await db.select({ count: count() }).from(communityModeratorRequests);
    const [pendingModRequests] = await db.select({ count: count() }).from(communityModeratorRequests).where(eq(communityModeratorRequests.status, "pending"));
    
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const [online] = await db.select({ count: count() }).from(communityMembers)
      .where(sql`${communityMembers.lastActive} > ${fifteenMinutesAgo}`);
    
    return {
      membersCount: members?.count || 0,
      postsCount: posts?.count || 0,
      commentsCount: comments?.count || 0,
      onlineCount: online?.count || 0,
      totalPosts: posts?.count || 0,
      totalCategories: categories?.count || 0,
      totalMembers: members?.count || 0,
      totalModerators: moderators?.count || 0,
      totalPermissions: permissions?.count || 0,
      totalReports: reports?.count || 0,
      pendingReports: pendingReports?.count || 0,
      totalModeratorRequests: modRequests?.count || 0,
      pendingModeratorRequests: pendingModRequests?.count || 0,
    };
  }

  // Notifications
  async getNotifications(memberId: number): Promise<(CommunityNotification & { actor?: CommunityMember; post?: CommunityPost })[]> {
    const notifications = await db.select().from(communityNotifications)
      .where(eq(communityNotifications.memberId, memberId))
      .orderBy(desc(communityNotifications.createdAt));
    
    const enriched = await Promise.all(notifications.map(async (n) => {
      const [actor] = await db.select().from(communityMembers).where(eq(communityMembers.id, n.actorId));
      let post;
      if (n.postId) {
        [post] = await db.select().from(communityPosts).where(eq(communityPosts.id, n.postId));
      }
      return { ...n, actor, post };
    }));
    return enriched;
  }

  async getUnreadNotificationsCount(memberId: number): Promise<number> {
    const [result] = await db.select({ count: count() }).from(communityNotifications)
      .where(and(eq(communityNotifications.memberId, memberId), eq(communityNotifications.isRead, false)));
    return result?.count || 0;
  }

  async createNotification(notification: InsertCommunityNotification): Promise<CommunityNotification> {
    // Don't create notification if actor is the same as member (social notifications only)
    if (notification.memberId === notification.actorId) {
      return {} as CommunityNotification;
    }
    const [newNotification] = await db.insert(communityNotifications).values(notification).returning();
    return newNotification;
  }

  // Activity log notifications — allowed for self (actor === member)
  async createDirectNotification(notification: InsertCommunityNotification): Promise<void> {
    await db.insert(communityNotifications).values(notification);
  }

  async markNotificationAsRead(id: number): Promise<void> {
    await db.update(communityNotifications).set({ isRead: true }).where(eq(communityNotifications.id, id));
  }

  async markAllNotificationsAsRead(memberId: number): Promise<void> {
    await db.update(communityNotifications).set({ isRead: true }).where(eq(communityNotifications.memberId, memberId));
  }

  async deleteNotification(id: number, memberId: number): Promise<void> {
    await db.delete(communityNotifications)
      .where(and(eq(communityNotifications.id, id), eq(communityNotifications.memberId, memberId)));
  }

  async deleteAllNotifications(memberId: number): Promise<void> {
    await db.delete(communityNotifications)
      .where(eq(communityNotifications.memberId, memberId));
  }

  async deleteNotificationsByLink(link: string): Promise<void> {
    await db.delete(communityNotifications)
      .where(eq(communityNotifications.link, link));
  }

  // Job Favorites
  async getFavoriteJobs(memberId: number): Promise<any[]> {
    const favorites = await db.select().from(jobFavorites)
      .where(eq(jobFavorites.memberId, memberId))
      .orderBy(desc(jobFavorites.createdAt));
    
    const enriched = await Promise.all(favorites.map(async (f) => {
      const [job] = await db.select().from(jobs).where(eq(jobs.id, f.jobId));
      return { ...f, job };
    }));
    return enriched.filter(f => f.job);
  }

  async isJobFavorited(memberId: number, jobId: number): Promise<boolean> {
    const [favorite] = await db.select().from(jobFavorites)
      .where(and(eq(jobFavorites.memberId, memberId), eq(jobFavorites.jobId, jobId)));
    return !!favorite;
  }

  async toggleJobFavorite(memberId: number, jobId: number): Promise<{ favorited: boolean }> {
    const [existing] = await db.select().from(jobFavorites)
      .where(and(eq(jobFavorites.memberId, memberId), eq(jobFavorites.jobId, jobId)));
    
    if (existing) {
      await db.delete(jobFavorites)
        .where(and(eq(jobFavorites.memberId, memberId), eq(jobFavorites.jobId, jobId)));
      return { favorited: false };
    } else {
      await db.insert(jobFavorites).values({ memberId, jobId });
      return { favorited: true };
    }
  }

  async removeJobFavorite(memberId: number, jobId: number): Promise<void> {
    await db.delete(jobFavorites)
      .where(and(eq(jobFavorites.memberId, memberId), eq(jobFavorites.jobId, jobId)));
  }

  async getMemberFavoriteJobIds(memberId: number): Promise<number[]> {
    const favorites = await db.select({ jobId: jobFavorites.jobId }).from(jobFavorites)
      .where(eq(jobFavorites.memberId, memberId));
    return favorites.map(f => f.jobId);
  }

  // Member posts
  async getMemberPosts(memberId: number): Promise<(CommunityPost & { category?: CommunityCategory })[]> {
    const posts = await db.select().from(communityPosts)
      .where(eq(communityPosts.memberId, memberId))
      .orderBy(desc(communityPosts.createdAt));
    
    const enriched = await Promise.all(posts.map(async (p) => {
      if (p.categoryId) {
        const [category] = await db.select().from(communityCategories).where(eq(communityCategories.id, p.categoryId));
        return { ...p, category };
      }
      return p;
    }));
    return enriched;
  }

  // Member comments
  async getMemberComments(memberId: number): Promise<(CommunityComment & { post?: CommunityPost })[]> {
    const comments = await db.select().from(communityComments)
      .where(eq(communityComments.memberId, memberId))
      .orderBy(desc(communityComments.createdAt));
    
    const enriched = await Promise.all(comments.map(async (c) => {
      const [post] = await db.select().from(communityPosts).where(eq(communityPosts.id, c.postId));
      return { ...c, post };
    }));
    return enriched;
  }
}

export const communityStorage = new CommunityStorage();

export async function seedCommunityCategories() {
  const existingCategories = await communityStorage.getAllCommunityCategories();
  if (existingCategories.length === 0) {
    const defaultCategories = [
      { name: "نقاشات عامة", slug: "general-discussions", description: "مناقشات عامة حول سوق العمل والوظائف", color: "#3b82f6", sortOrder: 1 },
      { name: "استفسارات المقابلات", slug: "interview-questions", description: "أسئلة ونصائح حول المقابلات الشخصية", color: "#10b981", sortOrder: 2 },
      { name: "تجارب التوظيف", slug: "employment-experiences", description: "شارك تجربتك في التقديم والتوظيف", color: "#8b5cf6", sortOrder: 3 },
      { name: "دورات وتطوير", slug: "courses-development", description: "دورات تدريبية وتطوير المهارات", color: "#f59e0b", sortOrder: 4 },
      { name: "مشاريع وأفكار", slug: "projects-ideas", description: "شارك أفكارك ومشاريعك الريادية", color: "#ef4444", sortOrder: 5 }
    ];
    
    for (const category of defaultCategories) {
      await communityStorage.createCommunityCategory(category);
    }
    console.log("Seeded default community categories");
  }
}

export async function seedCommunityRanks() {
  const existing = await communityStorage.getRanks();
  if (existing.length === 0) {
    const defaultRanks = [
      { name: "عضو جديد", color: "#94a3b8", icon: "👋", minPosts: 0, sortOrder: 1, isActive: true },
      { name: "عضو نشط", color: "#3b82f6", icon: "💬", minPosts: 10, sortOrder: 2, isActive: true },
      { name: "عضو متميز", color: "#10b981", icon: "🌟", minPosts: 50, sortOrder: 3, isActive: true },
      { name: "عضو محترف", color: "#8b5cf6", icon: "🎯", minPosts: 100, sortOrder: 4, isActive: true },
      { name: "خبير مجتمع", color: "#f59e0b", icon: "🏆", minPosts: 250, sortOrder: 5, isActive: true },
      { name: "أسطورة المجتمع", color: "#ef4444", icon: "👑", minPosts: 500, sortOrder: 6, isActive: true },
      { name: "مؤسس", color: "#dc2626", icon: "🔥", minPosts: 0, sortOrder: 0, isActive: true }
    ];
    for (const rank of defaultRanks) {
      await communityStorage.createRank(rank as InsertMemberRank);
    }
    console.log("Seeded default community member ranks");
  }
}

export async function seedCommunityAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.warn("Skipping community admin seed: ADMIN_EMAIL and ADMIN_PASSWORD are required");
    return;
  }

  const existingMember = await communityStorage.getMemberByEmail(adminEmail);
  const founderRank = await db.select().from(memberRanks).where(eq(memberRanks.name, "مؤسس"));
  const founderRankId = founderRank[0]?.id || null;

  if (!existingMember) {
    const newMember = await communityStorage.createMember({
      userId: "admin_community_" + Date.now(),
      username: "admin",
      displayName: "مسؤول المجتمع",
      email: adminEmail,
      password: adminPassword,
      provider: "email",
      role: "admin",
      rankId: founderRankId,
      isVerified: true
    });
    // Ensure moderator entry exists with full permissions
    const existingMod = await communityStorage.getModeratorsByMemberId(newMember.id);
    if (existingMod.length === 0) {
      const allPerms = await communityStorage.getModeratorPermissions();
      const fullPerm = allPerms.find((p: any) => p.name?.includes("كامل") || p.name?.includes("Full")) || allPerms[0];
      if (fullPerm) {
        await communityStorage.createModerator({
          memberId: newMember.id,
          permissionId: fullPerm.id,
          isActive: true,
          assignedBy: newMember.id,
        });
      }
    }
    console.log("Seeded default community admin member");
  } else {
    // Update existing admin to ensure role, rank, and moderator status
    if (existingMember.role !== "admin" || existingMember.rankId !== founderRankId) {
      await communityStorage.updateMember(existingMember.id, {
        role: "admin",
        rankId: founderRankId,
      });
      console.log("Updated community admin member role and rank");
    }
    // Ensure moderator entry exists
    const existingMod = await communityStorage.getModeratorsByMemberId(existingMember.id);
    if (existingMod.length === 0) {
      const allPerms = await communityStorage.getModeratorPermissions();
      const fullPerm = allPerms.find((p: any) => p.name?.includes("كامل") || p.name?.includes("Full")) || allPerms[0];
      if (fullPerm) {
        await communityStorage.createModerator({
          memberId: existingMember.id,
          permissionId: fullPerm.id,
          isActive: true,
          assignedBy: existingMember.id,
        });
        console.log("Added moderator permissions to community admin");
      }
    }
  }
}
