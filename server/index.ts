import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import cors from "cors";
import compression from "compression";
import { registerRoutes } from "./routes/routes";
import { seedCategories, ensureJobCategoryHierarchy, seedAds, seedFaq, seedBlogCategories } from "./seed";
import { seedEmployerJobsIfEmpty } from "./seed-employer-jobs";
import { migrateMissingData } from "./migrate-prod-data";
import { setupWebSocket } from "./ws";
import { storage } from "./storage";
import { communityStorage } from "./communityStorage";
import { generateWeeklySummary } from "./ai";
import { buildAndSaveDailyMarketSnapshot } from "./marketSnapshot";
import { sendWeeklySummaryEmailGmail } from "./email";
import { db } from "./db";
import { employerJobs } from "@workspace/db";
import { inArray } from "drizzle-orm";
import cron from "node-cron";
import { logger } from "./lib/logger";

const app = express();
const httpServer = createServer(app);

app.set("trust proxy", 1);
app.use(compression());
app.use(cors({
  origin: (origin, callback) => callback(null, origin || true),
  credentials: true,
}));
app.use(
  express.json({
    verify: (req: any, _res: any, buf: any) => {
      req.rawBody = buf;
    },
  }),
);
app.use(express.urlencoded({ extended: false }));

// Health check
app.get("/api/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

async function buildWeeklySummaryData(now: Date, periodStart: Date) {
  const allJobs = await storage.getJobs();
  const published = allJobs.filter((j: any) => j.status === "published");
  const newThisWeek = published.filter((j: any) => j.createdAt && new Date(j.createdAt) >= periodStart);
  const newJobsThisWeek = newThisWeek.length;
  const topJobsByViews = [...newThisWeek]
    .sort((a: any, b: any) => (b.viewCount || 0) - (a.viewCount || 0))
    .slice(0, 15)
    .map((j: any) => ({ id: j.id, title: j.title, company: j.company, viewCount: j.viewCount || 0, category: j.category, location: j.location }));

  const allEmployerJobs = await storage.getEmployerJobs();
  const newEmployerJobs = allEmployerJobs.filter((j: any) => j.createdAt && new Date(j.createdAt) >= periodStart);
  const topEmployerJobs = [...newEmployerJobs]
    .sort((a: any, b: any) => (b.viewCount || 0) - (a.viewCount || 0))
    .slice(0, 5)
    .map((j: any) => ({ id: j.id, title: j.title, company: j.company, viewCount: j.viewCount || 0, region: j.region }));

  const allPosts = await communityStorage.getPosts();
  const newPostsThisWeek = allPosts.filter((p: any) => p.createdAt && new Date(p.createdAt) >= periodStart).length;
  const topCommunityPosts = allPosts
    .filter((p: any) => p.createdAt && new Date(p.createdAt) >= periodStart)
    .sort((a: any, b: any) => ((b.commentsCount || 0) + (b.likesCount || 0)) - ((a.commentsCount || 0) + (a.likesCount || 0)))
    .slice(0, 5)
    .map((p: any) => ({ id: p.id, title: p.title, commentsCount: p.commentsCount || 0, likesCount: p.likesCount || 0, viewsCount: p.viewsCount || 0 }));

  const allMembers = await communityStorage.getMembers();
  const newMembersThisWeek = allMembers.filter((m: any) => m.createdAt && new Date(m.createdAt) >= periodStart).length;

  const allBlogPosts = await storage.getBlogPosts();
  const topBlogPosts = allBlogPosts
    .filter((b: any) => b.createdAt && new Date(b.createdAt) >= periodStart)
    .sort((a: any, b: any) => (b.viewCount || 0) - (a.viewCount || 0))
    .slice(0, 5)
    .map((b: any) => ({ id: b.id, title: b.title, viewCount: b.viewCount || 0 }));

  const weekLabel = `${periodStart.toLocaleDateString("ar-SA", { day: "numeric", month: "long" })} — ${now.toLocaleDateString("ar-SA", { day: "numeric", month: "long", year: "numeric" })}`;

  const statsData = {
    totalJobs: published.length,
    civilCount: published.filter((j: any) => j.category === "civil").length,
    militaryCount: published.filter((j: any) => j.category === "military").length,
    companiesCount: published.filter((j: any) => j.category === "companies").length,
    newJobsThisWeek,
    totalMembers: allMembers.length,
    newMembersThisWeek,
    totalPosts: allPosts.length,
    newPostsThisWeek,
  };

  return { weekLabel, statsData, topJobsByViews, topEmployerJobs, topCommunityPosts, topBlogPosts };
}

function scheduleDailyMarketIndicators() {
  async function run() {
    try {
      logger.info("Running daily market indicators snapshot...");
      await buildAndSaveDailyMarketSnapshot();
    } catch (err) {
      logger.error({ err }, "Daily market indicators error");
    }
  }
  cron.schedule("0 6 * * *", run, { timezone: "Asia/Riyadh" });
  logger.info("Daily market indicators scheduled: every day 06:00 Asia/Riyadh");
}

async function generateInitialDailyMarketSnapshotIfNeeded() {
  try {
    const existing = await storage.getLatestDailyMarketSnapshot();
    if (existing) {
      const ageMs = Date.now() - new Date(existing.generatedAt).getTime();
      if (ageMs < 24 * 60 * 60 * 1000) {
        logger.info("Daily market snapshot is fresh — skipping initial generation");
        return;
      }
    }
    logger.info(existing ? "Daily market snapshot is stale (>24h) — regenerating..." : "No daily market snapshot found — generating initial one...");
    await buildAndSaveDailyMarketSnapshot();
  } catch (err) {
    logger.error({ err }, "Failed to generate initial daily market snapshot");
  }
}

function scheduleWeeklySummary() {
  async function runWeeklySummary() {
    try {
      logger.info("Running scheduled weekly summary generation...");
      const now = new Date();
      const lastSummary = await storage.getLatestWeeklySummary();
      const periodStart = lastSummary?.generatedAt
        ? new Date(lastSummary.generatedAt)
        : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const { weekLabel, statsData, topJobsByViews, topEmployerJobs, topCommunityPosts, topBlogPosts } =
        await buildWeeklySummaryData(now, periodStart);

      const aiResult = await generateWeeklySummary({ weekLabel, ...statsData, topJobsByViews, topEmployerJobs, topCommunityPosts, topBlogPosts });
      if (!aiResult) { logger.error("AI failed to generate weekly summary"); return; }

      const summary = await storage.createWeeklySummary({
        weekLabel, ...aiResult,
        topJobsData: JSON.stringify(topJobsByViews),
        topPostsData: JSON.stringify(topCommunityPosts),
        statsData: JSON.stringify(statsData),
      });
      logger.info("Weekly summary generated successfully");

      const subscribers = await storage.getAllActiveWeeklySubscribers();
      logger.info({ count: subscribers.length }, "Notifying subscribers");
      for (const sub of subscribers) {
        try {
          let member = await communityStorage.getMemberByUserId(sub.userId);
          if (!member && sub.email) member = await communityStorage.getMemberByEmail(sub.email);
          if (member) {
            await communityStorage.createDirectNotification({
              memberId: member.id, actorId: member.id,
              type: "weekly_summary",
              message: `الملخص الأسبوعي جاهز — ${summary.weekLabel}`,
              link: "/weekly-summary",
            });
          }
        } catch (e) {
          logger.error({ err: e, userId: sub.userId }, "Failed to notify subscriber");
        }

        if (process.env.GMAIL_APP_PASSWORD && sub.email) {
          try {
            let member = await communityStorage.getMemberByUserId(sub.userId);
            if (!member && sub.email) member = await communityStorage.getMemberByEmail(sub.email);
            await sendWeeklySummaryEmailGmail({
              email: sub.email,
              displayName: sub.displayName || member?.displayName,
              weekLabel: summary.weekLabel,
              narrative: summary.narrative || "",
              statsSnapshot: summary.statsSnapshot || "",
              aiAdvice: summary.aiAdvice || "",
              topJobsData: summary.topJobsData,
            });
          } catch (e) {
            logger.error({ err: e, email: sub.email }, "Email failed");
          }
        }
      }
    } catch (err) {
      logger.error({ err }, "Weekly summary cron error");
    }
  }

  cron.schedule("0 13 * * 5", runWeeklySummary, { timezone: "Asia/Riyadh" });
  logger.info("Weekly summary scheduled: every Friday 13:00 Asia/Riyadh");
}

function scheduleCreditsExpiryCheck() {
  const INTERVAL_MS = 24 * 60 * 60 * 1000;
  async function runExpiryCheck() {
    try {
      const expiredJobCredits = await storage.getExpiredJobCredits();
      for (const credit of expiredJobCredits) {
        await storage.zeroJobApplicationCredits(credit.memberId);
        communityStorage.createDirectNotification({
          memberId: credit.memberId, actorId: credit.memberId,
          type: "order_status_change",
          message: "انتهت صلاحية رصيد التقديم على الوظائف. اشترِ رصيداً جديداً للاستمرار.",
          link: "/store/services/job-credits",
        }).catch(() => {});
      }
      const expiredCvMembers = await communityStorage.getMembersWithExpiredCvCredits();
      for (const member of expiredCvMembers) {
        await communityStorage.updateMember(member.id, { cvAnalysisPaidCredits: 0 });
        communityStorage.createDirectNotification({
          memberId: member.id, actorId: member.id,
          type: "order_status_change",
          message: "انتهت صلاحية رصيد تحليل السيرة الذاتية. اشترِ رصيداً جديداً من المتجر.",
          link: "/dashboard/orders",
        }).catch(() => {});
      }
      const expiringJobCredits = await storage.getJobCreditsExpiringIn(7);
      for (const credit of expiringJobCredits) {
        const daysLeft = Math.ceil((new Date(credit.expiresAt!).getTime() - Date.now()) / 86400000);
        communityStorage.createDirectNotification({
          memberId: credit.memberId, actorId: credit.memberId,
          type: "order_status_change",
          message: `تنبيه: رصيد التقديم على الوظائف سينتهي خلال ${daysLeft} ${daysLeft === 1 ? "يوم" : "أيام"}. الرصيد المتبقي: ${credit.balance}.`,
          link: "/store/services/job-credits",
        }).catch(() => {});
      }
      const expiringCvMembers = await communityStorage.getMembersWithCvCreditsExpiringIn(7);
      for (const member of expiringCvMembers) {
        const daysLeft = Math.ceil((new Date(member.cvAnalysisPaidCreditsExpiresAt!).getTime() - Date.now()) / 86400000);
        communityStorage.createDirectNotification({
          memberId: member.id, actorId: member.id,
          type: "order_status_change",
          message: `تنبيه: رصيد تحليل السيرة الذاتية سينتهي خلال ${daysLeft} ${daysLeft === 1 ? "يوم" : "أيام"}. الرصيد المتبقي: ${member.cvAnalysisPaidCredits}.`,
          link: "/dashboard/ai-credits",
        }).catch(() => {});
      }
    } catch (err) {
      logger.error({ err }, "Credits expiry check error");
    }
  }
  runExpiryCheck();
  setInterval(runExpiryCheck, INTERVAL_MS);
  logger.info("Credits expiry check scheduled every 24h");
}

function scheduleSupportAutoClose() {
  const INTERVAL_MS = 60 * 60 * 1000;
  async function runAutoClose() {
    try {
      const tickets = await storage.getTicketsAwaitingAutoClose();
      for (const ticket of tickets) {
        await storage.updateSupportTicketStatus(ticket.id, "closed", { closedAt: new Date() });
        communityStorage.createDirectNotification({
          memberId: ticket.memberId, actorId: ticket.memberId,
          type: "order_status_change",
          message: `تم إغلاق تذكرة الدعم #${ticket.ticketNumber} تلقائياً بعد 24 ساعة من الرد.`,
          link: `/dashboard/support/${ticket.id}`,
        }).catch(() => {});
      }
    } catch (err) {
      logger.error({ err }, "Support auto-close error");
    }
  }
  runAutoClose();
  setInterval(runAutoClose, INTERVAL_MS);
  logger.info("Support auto-close scheduled every 1h");
}

function scheduleTrashedJobsCleanup() {
  const INTERVAL_MS = 24 * 60 * 60 * 1000;
  async function runCleanup() {
    try {
      const deleted = await storage.deleteOldTrashedJobs(30);
      if (deleted > 0) logger.info({ deleted }, "Trash cleanup: deleted old jobs");
    } catch (err) {
      logger.error({ err }, "Trash cleanup error");
    }
  }
  runCleanup();
  setInterval(runCleanup, INTERVAL_MS);
  logger.info("Trash cleanup scheduled every 24h");
}

async function generateInitialSummaryIfNeeded() {
  try {
    const existing = await storage.getLatestWeeklySummary();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    if (existing && new Date(existing.generatedAt) > sevenDaysAgo) return;
    logger.info(existing ? "Weekly summary is stale (>7 days old) — regenerating..." : "No weekly summary found — generating initial one...");
    const now = new Date();
    const periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const { weekLabel, statsData, topJobsByViews, topEmployerJobs, topCommunityPosts } = await buildWeeklySummaryData(now, periodStart);
    const aiResult = await generateWeeklySummary({ weekLabel, ...statsData, topJobsByViews, topEmployerJobs, topCommunityPosts });
    if (!aiResult) { logger.error("AI failed to generate initial weekly summary"); return; }
    await storage.createWeeklySummary({
      weekLabel, ...aiResult,
      topJobsData: JSON.stringify(topJobsByViews),
      topPostsData: JSON.stringify(topCommunityPosts),
      statsData: JSON.stringify(statsData),
    });
    logger.info("Initial weekly summary generated successfully");
  } catch (err) {
    logger.error({ err }, "Failed to generate initial weekly summary");
  }
}

async function cleanupSeededEmployerJobs() {
  if (process.env.NODE_ENV !== "production") return;
  const SEED_EMAILS = [
    "hr@ufq.sa", "sultan@nokhba.com", "fatima@golden-care.sa", "hr@modernconstruct.com",
    "mona@futuracademy.sa", "hr@logisticspro.sa", "reem@ebda3studio.com", "chef@saudihome-rest.com",
    "khalid@roia-consulting.sa", "lina@powerfit-tabuk.com", "hr@nokhba-tech.sa", "hr@ibd3.sa",
    "hr@raidalcommerce.sa", "jahznet@gmail.com",
  ];
  try {
    const deleted = await db.delete(employerJobs).where(inArray(employerJobs.submitterEmail, SEED_EMAILS)).returning({ id: employerJobs.id });
    if (deleted.length > 0) logger.info({ count: deleted.length }, "Removed seeded fake employer jobs");
  } catch (err) {
    logger.error({ err }, "Failed to remove seeded employer jobs");
  }
}

const rawPort = process.env["PORT"];
if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}
const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

(async () => {
  try {
    await seedCategories();
    await seedBlogCategories();
    await ensureJobCategoryHierarchy();
    await seedAds();
    await seedFaq();
    if (process.env.NODE_ENV !== "production") {
      await seedEmployerJobsIfEmpty();
    }
    await cleanupSeededEmployerJobs();
    await migrateMissingData();
    await registerRoutes(httpServer, app);

    if (process.env.RUN_BACKGROUND_JOBS !== "false") {
      scheduleWeeklySummary();
      scheduleDailyMarketIndicators();
      scheduleTrashedJobsCleanup();
      scheduleCreditsExpiryCheck();
      scheduleSupportAutoClose();
      generateInitialSummaryIfNeeded();
      generateInitialDailyMarketSnapshotIfNeeded();
    } else {
      logger.info("Background jobs disabled by RUN_BACKGROUND_JOBS=false");
    }
    setupWebSocket(httpServer);

    app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      if (res.headersSent) return next(err);
      return res.status(status).json({ message });
    });

    httpServer.listen({ port, host: "0.0.0.0" }, () => {
      logger.info({ port }, "Server listening");
    });
  } catch (err) {
    logger.error({ err }, "Failed to start server");
    process.exit(1);
  }
})();
