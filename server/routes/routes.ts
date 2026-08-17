import type { Express, RequestHandler } from "express";
import { cache, TTL } from "../lib/cache";
import { createServer, type Server } from "http";
import AdmZip from "adm-zip";
import { storage, seedServices, ensureCvAnalysisService, ensureJobCreditsService, ensureJobAlertPointsService, getSiteSetting, setSiteSetting, getTrashedJobs, getTrashedResults, getTrashedBlogs, getTrashedPages, restoreFromTrash, permanentlyDelete } from "../storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "../replit_integrations/auth";
import { registerObjectStorageRoutes } from "../replit_integrations/object_storage";
import { ObjectStorageService, ObjectNotFoundError } from "../replit_integrations/object_storage/objectStorage";
import { sendContactEmail, sendPasswordResetEmail, sendWeeklySummaryEmailGmail } from "../email";
import crypto from "crypto";
import multer from "multer";
import path from "path";
import express from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { broadcast } from "../ws";
import { 
  insertJobSchema, 
  insertResultSchema, 
  insertBlogPostSchema,
  insertCategorySchema,
  insertBlogCategorySchema,
  insertOrganizationSchema,
  insertOrganizationTypeSchema,
  insertAdminSchema,
  insertPermissionSchema,
  insertAdSchema,
  insertSeoSettingSchema,
  insertMediaSchema,
  insertPageSchema,
  insertCommunityMemberSchema,
  insertCommunityCategorySchema,
  insertCommunityPostSchema,
  insertCommunityCommentSchema,
  insertCommunityReportSchema,
  insertCommunityModeratorRequestSchema,
  insertServiceOrderSchema,
  insertAnnouncementSchema,
  insertJobReportSchema,
  insertEmployerJobSchema,
  insertEmployerJobReportSchema,
  organizationFollows,
  organizations,
  communityMembers,
  communityNotifications,
  communityTokensTable,
  jobAlertSent,
  jobAlertPreferences,
  memberPushTokens,
  twitterPosts as twitterPostsTable,
  twitterSettings as twitterSettingsTable,
} from "@workspace/db";
import { db } from "../db";
import { eq, and, gt, gte, desc, sql, isNull, count as drizzleCount } from "drizzle-orm";
import { communityStorage, seedCommunityCategories, seedCommunityAdmin, seedCommunityRanks } from "../communityStorage";
import { generateJobSummary, generateMarketForecast, analyzeJobMatchFromText, analyzeJobMatchFromImage, generateWeeklySummary } from "../ai";
import mammoth from "mammoth";
type ExpoPushMessage = {
  to: string | string[];
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
};

class Expo {
  static isExpoPushToken(token: string): boolean {
    return /^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]+\]$/.test(token);
  }

  chunkPushNotifications(messages: ExpoPushMessage[]): ExpoPushMessage[][] {
    const chunks: ExpoPushMessage[][] = [];
    for (let i = 0; i < messages.length; i += 100) chunks.push(messages.slice(i, i + 100));
    return chunks;
  }

  async sendPushNotificationsAsync(messages: ExpoPushMessage[]) {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(messages),
    });
    if (!response.ok) throw new Error(`Expo push request failed: ${response.status}`);
    const payload = await response.json() as { data?: unknown[] };
    return payload.data || [];
  }
}
import { notifyJobPublished, notifyJobDeleted } from "../lib/googleIndexing";
import { logger } from "../lib/logger";
import { publishToTwitter, shouldAutoPublishJob, shouldAutoPublishBlog, getOrCreateSettings, buildJobTweet, buildBlogTweet, buildResultTweet, isTwitterConfigured } from "../lib/twitter";

const passwordResetTokens = new Map<string, { email: string; memberId: number; expiresAt: number }>();
const adminResetTokens = new Map<string, { email: string; adminId: number | null; expiresAt: number }>();

const CV_ANALYSIS_LIMIT = 10;

function extractDocxTextFallback(buffer: Buffer): string {
  try {
    const zip = new AdmZip(buffer);
    const xmlEntry = zip.getEntry("word/document.xml");
    if (!xmlEntry) return "";
    const xml = xmlEntry.getData().toString("utf8");
    return xml.replace(/<[^>]+>/g, " ").replace(/\s{2,}/g, " ").trim();
  } catch {
    return "";
  }
}

const ADMIN_USER_IDS = process.env.ADMIN_USER_IDS?.split(",").filter(id => id.trim()) || [];

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const DELETE_APP_PASSWORD = process.env.DELETE_APP_PASSWORD || "";

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "عدد محاولات تسجيل الدخول تجاوز الحد المسموح. حاول مجدداً بعد 15 دقيقة" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Keep legacy in-memory tokens readable during rolling deployments, but issue
// stateless signed tokens so authentication survives Cloudflare isolate changes.
const adminTokens = new Map<string, { adminId: number | null; adminName: string; expires: number }>();

// Community tokens are now stored in the database (community_tokens table)

type AdminTokenData = { adminId: number | null; adminName: string; expires: number };

function adminTokenSecret(): string {
  return process.env.SESSION_SECRET || ADMIN_PASSWORD;
}

function issueAdminToken(data: AdminTokenData): string {
  const payload = Buffer.from(JSON.stringify(data), "utf8").toString("base64url");
  const signature = crypto.createHmac("sha256", adminTokenSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function readAdminToken(token: string): AdminTokenData | null {
  try {
    const [payload, signature, extra] = token.split(".");
    if (!payload || !signature || extra || !adminTokenSecret()) return adminTokens.get(token) || null;
    const expected = crypto.createHmac("sha256", adminTokenSecret()).update(payload).digest("base64url");
    const suppliedBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (suppliedBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(suppliedBuffer, expectedBuffer)) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AdminTokenData;
    if (typeof data.expires !== "number" || data.expires <= Date.now()) return null;
    return data;
  } catch {
    return adminTokens.get(token) || null;
  }
}

function generateCommunityToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let token = "";
  for (let i = 0; i < 64; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

function cleanExpiredTokens() {
  const now = Date.now();
  for (const [token, data] of Array.from(adminTokens.entries())) {
    if (data.expires < now) adminTokens.delete(token);
  }
}


const isAdminSession: RequestHandler = (req, res, next) => {
  // Check session cookie
  if ((req.session as any)?.isAdmin === true) {
    return next();
  }
  // Check Authorization header / X-Admin-Token header (for iframe environments)
  const authHeader = req.headers["authorization"] || req.headers["x-admin-token"];
  const token = typeof authHeader === "string"
    ? authHeader.replace(/^Bearer\s+/i, "").trim()
    : null;
  if (token) {
    cleanExpiredTokens();
    const data = readAdminToken(token);
    if (data && data.expires > Date.now()) {
      (req as any).adminTokenData = data;
      return next();
    }
  }
  return res.status(401).json({ message: "Unauthorized: Admin login required" });
};

const isAdmin: RequestHandler = async (req, res, next) => {
  const user = req.user as any;
  if (!user || !user.claims) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const userId = user.claims.sub;
  
  if (ADMIN_USER_IDS.length === 0) {
    return res.status(403).json({ message: "Forbidden: No admins configured. Set ADMIN_USER_IDS environment variable." });
  }
  
  if (ADMIN_USER_IDS.includes(userId)) {
    return next();
  }
  
  return res.status(403).json({ message: "Forbidden: Admin access required" });
};

function fixLogoUrl(logo: string | null | undefined): string | null {
  if (!logo) return null;
  if (logo.startsWith("http")) return logo;
  return `/api/objects${logo.replace(/^\/objects/, "")}`;
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  const memoryUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const allowed = [
        "application/pdf",
        "image/jpeg", "image/jpg", "image/png", "image/webp",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      cb(null, allowed.includes(file.mimetype));
    },
  });

  app.get("/robots.txt", (req, res) => {
    const base = process.env.SITE_URL || (() => {
      const host = req.headers.host || "localhost:5000";
      const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
      return `${protocol}://${host}`;
    })();
    res.type("text/plain");
    res.send(
      `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /dashboard\nDisallow: /api/\n\n` +
      `Sitemap: ${base}/sitemap.xml\n`
    );
  });

  app.get("/sitemap.xml", async (req, res) => {
    try {
      const [jobs, results, blogPosts, orgs] = await Promise.all([
        storage.getJobsByStatus("published"),
        storage.getResults(),
        storage.getBlogPostsByStatus("published"),
        storage.getOrganizations(),
      ]);
      const base = process.env.SITE_URL || (() => {
        const host = req.headers.host || "localhost:5000";
        const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
        return `${protocol}://${host}`;
      })();

      const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

      const staticUrls: { loc: string; priority: string; changefreq: string; lastmod?: string }[] = [
        { loc: base,                               priority: "1.0", changefreq: "daily" },
        { loc: `${base}/jobs`,                     priority: "0.9", changefreq: "daily" },
        { loc: `${base}/jobs/civil`,               priority: "0.9", changefreq: "daily" },
        { loc: `${base}/jobs/military`,            priority: "0.9", changefreq: "daily" },
        { loc: `${base}/jobs/companies`,           priority: "0.9", changefreq: "daily" },
        { loc: `${base}/jobs/organizations`,       priority: "0.8", changefreq: "weekly" },
        { loc: `${base}/blog`,                     priority: "0.7", changefreq: "weekly" },
        { loc: `${base}/pages/about`,              priority: "0.5", changefreq: "monthly" },
        { loc: `${base}/pages/contact`,            priority: "0.5", changefreq: "monthly" },
        { loc: `${base}/pages/privacy`,            priority: "0.3", changefreq: "yearly" },
        { loc: `${base}/pages/terms`,              priority: "0.3", changefreq: "yearly" },
      ];

      const jobUrls = (jobs || []).map((j: any) => {
        const logo = j.logo ? (j.logo.startsWith("http") ? j.logo : `${base}/api/objects${j.logo.replace(/^\/objects/, "")}`) : null;
        return {
          loc: `${base}/jobs/post/${j.id}`,
          priority: "0.8",
          changefreq: "weekly",
          lastmod: j.updatedAt ? new Date(j.updatedAt).toISOString().split("T")[0] : undefined,
          image: logo ? { loc: logo, title: esc(j.title), caption: esc(j.company) } : null,
        };
      });

      const resultUrls = (results || []).map((r: any) => ({
        loc: `${base}/jobs/results/${r.id}`,
        priority: "0.7",
        changefreq: "monthly",
        lastmod: r.updatedAt ? new Date(r.updatedAt).toISOString().split("T")[0] : undefined,
        image: null,
      }));

      const blogUrls = (blogPosts || []).map((p: any) => {
        const img = p.image ? (p.image.startsWith("http") ? p.image : `${base}/api/objects${p.image.replace(/^\/objects/, "")}`) : null;
        return {
          loc: `${base}/blog/${p.slug || p.id}`,
          priority: "0.7",
          changefreq: "monthly",
          lastmod: p.updatedAt ? new Date(p.updatedAt).toISOString().split("T")[0] : undefined,
          image: img ? { loc: img, title: esc(p.title), caption: esc(p.excerpt || p.title) } : null,
        };
      });

      const orgUrls = (orgs || []).map((o: any) => ({
        loc: `${base}/jobs/organizations/${o.id}`,
        priority: "0.6",
        changefreq: "weekly",
        image: null,
      }));

      const allUrls = [...staticUrls.map((u: any) => ({ ...u, image: null })), ...jobUrls, ...resultUrls, ...blogUrls, ...orgUrls];

      const urlsXml = allUrls.map((u: any) => {
        const imgXml = u.image
          ? `\n    <image:image>\n      <image:loc>${u.image.loc}</image:loc>\n      <image:title>${u.image.title}</image:title>\n      <image:caption>${u.image.caption}</image:caption>\n    </image:image>`
          : "";
        return `  <url>
    <loc>${esc(u.loc)}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ""}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>${imgXml}
  </url>`;
      }).join("\n");

      res.type("application/xml");
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urlsXml}\n</urlset>`);
    } catch (err) {
      res.status(500).send("Error generating sitemap");
    }
  });

  app.get("/rss.xml", async (req, res) => {
    try {
      const [jobs, employerJobs] = await Promise.all([
        storage.getJobsByStatus("published"),
        storage.getEmployerJobsByStatus("approved"),
      ]);
      const host = req.headers.host || "localhost:5000";
      const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
      const base = `${protocol}://${host}`;

      const esc = (s: string) => (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

      const allJobs = [
        ...(jobs || []).map((j: any) => ({
          title: j.title,
          link: `${base}/jobs/post/${j.id}`,
          description: j.description || `وظيفة ${j.title} في ${j.company}`,
          pubDate: j.createdAt ? new Date(j.createdAt).toUTCString() : new Date().toUTCString(),
          category: j.category === "civil" ? "وظائف مدنية" : j.category === "military" ? "وظائف عسكرية" : "وظائف شركات",
          company: j.company,
        })),
        ...(employerJobs || []).map((j: any) => ({
          title: j.title,
          link: `${base}/jobs/employer/${j.id}`,
          description: j.description || `وظيفة ${j.title} في ${j.company}`,
          pubDate: j.createdAt ? new Date(j.createdAt).toUTCString() : new Date().toUTCString(),
          category: "وظائف أصحاب العمل",
          company: j.company,
        })),
      ].sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
       .slice(0, 100);

      const itemsXml = allJobs.map(j => `    <item>
      <title>${esc(j.title)}</title>
      <link>${esc(j.link)}</link>
      <guid isPermaLink="true">${esc(j.link)}</guid>
      <description>${esc(j.description)}</description>
      <pubDate>${j.pubDate}</pubDate>
      <category>${esc(j.category)}</category>
      <author>${esc(j.company)}</author>
    </item>`).join("\n");

      const now = new Date().toUTCString();

      res.type("application/rss+xml; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=1800");
      res.send(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>إعلانات الوظائف — أحدث الوظائف في السعودية</title>
    <link>${base}</link>
    <description>أحدث إعلانات الوظائف الحكومية والعسكرية والشركات في المملكة العربية السعودية</description>
    <language>ar</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${base}/rss.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${base}/opengraph.jpg</url>
      <title>إعلانات الوظائف</title>
      <link>${base}</link>
    </image>
${itemsXml}
  </channel>
</rss>`);
    } catch (err) {
      res.status(500).send("Error generating RSS feed");
    }
  });

  app.get("/api/cv-analysis/history", async (req, res) => {
    const memberId = await getCurrentMemberId(req);
    if (!memberId) return res.status(401).json({ message: "Login required" });
    const history = await storage.getCvAnalysisHistoryByMember(memberId);
    return res.json(history);
  });

  app.get("/api/cv-analysis/usage", async (req, res) => {
    const memberId = await getCurrentMemberId(req);
    if (!memberId) return res.status(401).json({ message: "Login required" });
    const member = await communityStorage.getMember(memberId);
    if (!member) return res.status(404).json({ message: "Member not found" });
    const expiresAt = member.cvAnalysisPaidCreditsExpiresAt ?? null;
    const isExpired = expiresAt && new Date() > new Date(expiresAt);
    return res.json({
      paidCredits: isExpired ? 0 : (member.cvAnalysisPaidCredits ?? 0),
      freeUsed: member.cvAnalysisUsed ?? 0,
      freeLimit: CV_ANALYSIS_LIMIT,
      expiresAt,
      isExpired: !!isExpired,
    });
  });

  /* ── shared CV analysis helper ── */
  async function runCvAnalysis(
    req: any,
    res: any,
    job: { id: number; title: string; description: string; category?: string | null; requirements?: string | null; company?: string | null; companyName?: string | null },
  ) {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ message: "خدمة التحليل غير متاحة حالياً" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "يرجى رفع السيرة الذاتية" });
    }

    const memberId = await getCurrentMemberId(req);
    if (!memberId) return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });

    const member = await communityStorage.getMember(memberId);
    if (!member) return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });

    const freeUsed = member.cvAnalysisUsed ?? 0;
    const rawPaidCredits = member.cvAnalysisPaidCredits ?? 0;
    const cvExpiresAt = member.cvAnalysisPaidCreditsExpiresAt;
    const isCvExpired = cvExpiresAt && new Date() > new Date(cvExpiresAt);
    const paidCredits = isCvExpired ? 0 : rawPaidCredits;

    const hasPaid = paidCredits > 0;
    const hasFree = freeUsed < CV_ANALYSIS_LIMIT;

    if (!hasPaid && !hasFree) {
      return res.status(429).json({
        message: `استنفدت التحليلات المجانية (${CV_ANALYSIS_LIMIT}/${CV_ANALYSIS_LIMIT}) — اشترِ رصيداً للمتابعة`,
        usage: { paidCredits: 0, freeUsed, freeLimit: CV_ANALYSIS_LIMIT },
      });
    }

    const { mimetype, buffer } = req.file;
    const jobCategory = job.category ?? job.requirements ?? "";
    const jobCompany = job.company ?? job.companyName ?? null;
    let result;

    const isWord = mimetype === "application/msword" || mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    const isPdf = mimetype === "application/pdf";

    if (isPdf) {
      let cvText = "";
      try {
        const { default: pdfParse } = await import("pdf-parse/lib/pdf-parse.js");
        const pdfData = await pdfParse(buffer, { max: 0 });
        cvText = pdfData.text?.trim() || "";
      } catch (pdfErr) {
        console.error("[analyze-cv] pdf-parse error:", pdfErr);
        return res.status(422).json({ message: "تعذّر قراءة ملف PDF — جرّب رفع صورة أو ملف Word بدلاً منه" });
      }
      if (!cvText || cvText.length < 30) {
        return res.status(422).json({ message: "ملف PDF لا يحتوي على نص مقروء — جرّب رفع صورة أو Word بدلاً منه" });
      }
      result = await analyzeJobMatchFromText({ jobTitle: job.title, jobDescription: job.description, jobCategory, cvText });
    } else if (isWord) {
      let cvText = "";
      try {
        const wordData = await mammoth.extractRawText({ buffer });
        cvText = wordData.value?.trim() || "";
      } catch (wordErr) {
        console.error("[analyze-cv] mammoth error (trying fallback):", wordErr);
      }
      if (!cvText || cvText.length < 30) cvText = extractDocxTextFallback(buffer);
      if (!cvText || cvText.length < 30) {
        return res.status(422).json({ message: "ملف Word لا يحتوي على نص مقروء — جرّب رفع ملف PDF أو صورة بدلاً منه" });
      }
      result = await analyzeJobMatchFromText({ jobTitle: job.title, jobDescription: job.description, jobCategory, cvText });
    } else {
      const imageBase64 = buffer.toString("base64");
      result = await analyzeJobMatchFromImage({ jobTitle: job.title, jobDescription: job.description, jobCategory, imageBase64, mimeType: mimetype });
    }

    if (!result) return res.status(500).json({ message: "فشل التحليل — حاول مرة أخرى" });

    let newPaidCredits = paidCredits;
    let newFreeUsed = freeUsed;
    const usedCreditType = hasPaid ? "paid" : "free";
    if (hasPaid) {
      newPaidCredits = paidCredits - 1;
      await communityStorage.updateMember(memberId, { cvAnalysisPaidCredits: newPaidCredits });
    } else {
      newFreeUsed = freeUsed + 1;
      await communityStorage.updateMember(memberId, { cvAnalysisUsed: newFreeUsed });
    }

    storage.saveCvAnalysisHistory({
      memberId,
      jobId: job.id,
      jobTitle: job.title,
      jobCompany,
      jobCategory: jobCategory ? jobCategory.slice(0, 100) : null,
      matchPercentage: result.matchPercentage,
      creditType: usedCreditType,
    }).catch(() => {});

    return res.json({ ...result, usage: { paidCredits: newPaidCredits, freeUsed: newFreeUsed, freeLimit: CV_ANALYSIS_LIMIT } });
  }

  app.post("/api/jobs/:id/analyze-cv", memoryUpload.single("cv"), async (req, res) => {
    try {
      const jobId = parseInt(req.params.id as string);
      if (isNaN(jobId)) return res.status(400).json({ message: "معرف الوظيفة غير صحيح" });
      const job = await storage.getJob(jobId);
      if (!job) return res.status(404).json({ message: "الوظيفة غير موجودة" });
      return runCvAnalysis(req, res, job);
    } catch (err) {
      console.error("[analyze-cv]", err);
      return res.status(500).json({ message: "حدث خطأ أثناء التحليل" });
    }
  });

  app.post("/api/employer-jobs/:id/analyze-cv", memoryUpload.single("cv"), async (req, res) => {
    try {
      const jobId = parseInt(req.params.id as string);
      if (isNaN(jobId)) return res.status(400).json({ message: "معرف الوظيفة غير صحيح" });
      const job = await storage.getEmployerJob(jobId);
      if (!job) return res.status(404).json({ message: "الوظيفة غير موجودة" });
      return runCvAnalysis(req, res, job);
    } catch (err) {
      console.error("[employer-analyze-cv]", err);
      return res.status(500).json({ message: "حدث خطأ أثناء التحليل" });
    }
  });

  await setupAuth(app);
  registerAuthRoutes(app);

  app.post("/api/contact", async (req, res) => {
    try {
      const { firstName, lastName, email, subject, message } = req.body;
      if (!firstName || !lastName || !email || !subject || !message) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const result = await sendContactEmail({
        firstName,
        lastName,
        email,
        subject,
        message
      });

      if (result.error) {
        console.error("Email sending failed:", result.error);
        return res.status(500).json({ message: "Failed to send email. Please try again later." });
      }

      res.json({ success: true, message: "Email sent successfully" });
    } catch (error: any) {
      console.error("Email sending error:", error);
      res.status(500).json({ message: error.message || "Failed to send email" });
    }
  });

  app.get("/api/seo/page", async (req, res) => {
    try {
      const pagePath = req.query.path as string;
      const setting = await storage.getSeoSetting(pagePath);
      res.json(setting || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch SEO setting" });
    }
  });

  // ============ PUBLIC API ROUTES ============
  
  app.get("/api/jobs", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const search = (req.query.search as string | undefined)?.trim();
      const orgs = await storage.getOrganizations();
      const orgMap = new Map(orgs.map(org => [org.id, { ...org, logo: fixLogoUrl(org.logo) }]));

      // If category is "results", only return results (no search support for results)
      if (category === "results") {
        const resultsList = await storage.getResults();
        const resultsAsJobs = resultsList.map(result => ({
          id: result.id,
          title: result.title,
          company: result.org,
          organizationId: result.organizationId,
          logo: null,
          category: "results",
          date: result.date,
          location: null,
          description: result.details,
          applyUrl: result.inquiryUrl,
          sourceUrl: result.inquiryUrl,
          status: result.status,
          isFeatured: false,
          viewCount: result.viewCount,
          isActive: result.isActive,
          trashedAt: result.trashedAt,
          createdAt: result.createdAt,
          updatedAt: result.updatedAt,
          isResult: true,
          organization: result.organizationId ? orgMap.get(result.organizationId) || null : null
        }));
        return res.json(resultsAsJobs);
      }

      // Server-side search — only applies to jobs (civil/military/companies)
      if (search) {
        const jobsList = await storage.searchJobs(search, category);
        const jobsWithOrgs = jobsList.map(job => ({
          ...job,
          isResult: false,
          organization: job.organizationId ? orgMap.get(job.organizationId) || null : null
        }));
        return res.json(jobsWithOrgs);
      }

      // No search — normal listing
      const jobsList = category ? await storage.getJobsByCategory(category) : await storage.getJobs();
      const jobsWithOrgs = jobsList.map(job => ({
        ...job,
        isResult: false,
        organization: job.organizationId ? orgMap.get(job.organizationId) || null : null
      }));

      // If no category filter, include results as well
      if (!category) {
        const resultsList = await storage.getResults();
        const resultsAsJobs = resultsList.map(result => ({
          id: result.id,
          title: result.title,
          company: result.org,
          organizationId: result.organizationId,
          logo: null,
          category: "results",
          date: result.date,
          location: null,
          description: result.details,
          applyUrl: result.inquiryUrl,
          sourceUrl: result.inquiryUrl,
          status: result.status,
          isFeatured: false,
          viewCount: result.viewCount,
          isActive: result.isActive,
          trashedAt: result.trashedAt,
          createdAt: result.createdAt,
          updatedAt: result.updatedAt,
          isResult: true,
          organization: result.organizationId ? orgMap.get(result.organizationId) || null : null
        }));

        const allJobs = [...jobsWithOrgs, ...resultsAsJobs].sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        return res.json(allJobs);
      }

      res.json(jobsWithOrgs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  app.get("/api/jobs/suggestions", async (req, res) => {
    try {
      const q = (req.query.q as string | undefined)?.trim();
      if (!q || q.length < 2) return res.json([]);
      const suggestions = await storage.getJobSuggestions(q);
      res.json(suggestions);
    } catch (error) {
      res.status(500).json([]);
    }
  });

  app.get("/api/jobs/featured", async (req, res) => {
    try {
      const cached = cache.get<unknown[]>("jobs:featured");
      if (cached) return res.json(cached);
      const featuredJobs = await storage.getFeaturedJobs();
      const orgs = await storage.getOrganizations();
      const orgMap = new Map(orgs.map(org => [org.id, { ...org, logo: fixLogoUrl(org.logo) }]));
      const jobsWithOrgs = featuredJobs.map(job => ({
        ...job,
        isResult: false,
        organization: job.organizationId ? orgMap.get(job.organizationId) || null : null
      }));
      const limitedFeaturedJobs = jobsWithOrgs.slice(0, 4);
      cache.set("jobs:featured", limitedFeaturedJobs, TTL.MEDIUM);
      res.json(limitedFeaturedJobs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch featured jobs" });
    }
  });

  app.get("/api/jobs/:id", async (req, res) => {
    try {
      const jobId = parseInt(req.params.id as string);
      const isResult = req.query.isResult === "true";
      
      // If it's a result, fetch from results table
      if (isResult) {
        const result = await storage.getResult(jobId);
        if (!result) return res.status(404).json({ message: "Result not found" });
        
        // Increment view count
        await storage.incrementResultViewCount(jobId);
        
        // Transform result to job format
        const orgs = await storage.getOrganizations();
        const orgMap = new Map(orgs.map(org => [org.id, { ...org, logo: fixLogoUrl(org.logo) }]));
        
        return res.json({
          id: result.id,
          title: result.title,
          company: result.org,
          organizationId: result.organizationId,
          logo: null,
          category: "results",
          date: result.date,
          location: null,
          description: result.details,
          applyUrl: result.inquiryUrl,
          sourceUrl: result.inquiryUrl,
          status: result.status,
          isFeatured: false,
          viewCount: (result.viewCount || 0) + 1,
          isActive: result.isActive,
          trashedAt: result.trashedAt,
          createdAt: result.createdAt,
          updatedAt: result.updatedAt,
          isResult: true,
          organization: result.organizationId ? orgMap.get(result.organizationId) || null : null
        });
      }
      
      const job = await storage.getJob(jobId);
      if (!job) return res.status(404).json({ message: "Job not found" });
      
      // Increment view count
      await storage.incrementJobViewCount(jobId);
      
      // Include organization data if available
      if (job.organizationId) {
        const org = await storage.getOrganization(job.organizationId);
        const orgFixed = org ? { ...org, logo: fixLogoUrl(org.logo) } : null;
        return res.json({ ...job, viewCount: (job.viewCount || 0) + 1, isResult: false, organization: orgFixed });
      }
      res.json({ ...job, viewCount: (job.viewCount || 0) + 1, isResult: false, organization: null });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch job" });
    }
  });

  app.get("/api/results", async (req, res) => {
    try {
      const cached = cache.get<unknown[]>("results");
      if (cached) return res.json(cached);
      const data = await storage.getResults();
      cache.set("results", data, TTL.MEDIUM);
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch results" });
    }
  });

  app.get("/api/results/:id", async (req, res) => {
    try {
      const resultId = parseInt(req.params.id as string);
      const result = await storage.getResult(resultId);
      if (!result) return res.status(404).json({ message: "Result not found" });
      
      // Increment view count
      await storage.incrementResultViewCount(resultId);
      
      res.json({ ...result, viewCount: (result.viewCount || 0) + 1 });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch result" });
    }
  });

  app.get("/api/blog", async (req, res) => {
    try {
      const posts = await storage.getBlogPosts();
      res.json(posts.map((p: any) => ({ ...p, image: fixLogoUrl(p.image) })));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });

  app.get("/api/blog/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const post = isNaN(id) ? await storage.getBlogPostBySlug(req.params.id as string) : await storage.getBlogPost(id);
      if (!post) return res.status(404).json({ message: "Blog post not found" });
      
      // Increment view count
      await storage.incrementBlogPostViewCount(post.id);
      
      res.json({ ...post, image: fixLogoUrl(post.image), viewCount: (post.viewCount || 0) + 1 });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blog post" });
    }
  });

  app.get("/api/services", async (req, res) => {
    try {
      res.json(await storage.getServices());
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.get("/api/services/:slug", async (req, res) => {
    try {
      const service = await storage.getServiceBySlug(req.params.slug as string);
      if (!service) return res.status(404).json({ message: "Service not found" });
      res.json(service);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch service" });
    }
  });

  app.get("/api/categories", async (req, res) => {
    try {
      const cacheKey = `categories:${req.query.type ?? "all"}`;
      const cached = cache.get<unknown[]>(cacheKey);
      if (cached) return res.json(cached);
      const all = await storage.getCategories();
      const type = req.query.type as string | undefined;
      const filtered = type ? all.filter(c => c.type === type) : all;
      cache.set(cacheKey, filtered, TTL.STATIC);
      res.json(filtered);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // ─── Blog Categories (public) ───────────────────────────────────────────────
  app.get("/api/blog-categories", async (_req, res) => {
    try {
      const cached = cache.get<unknown[]>("blog-categories");
      if (cached) return res.json(cached);
      const data = await storage.getBlogCategories(true);
      cache.set("blog-categories", data, TTL.STATIC);
      res.json(data);
    } catch { res.status(500).json({ message: "فشل في جلب أقسام المدونة" }); }
  });

  // ─── Blog Categories Admin (CRUD) ────────────────────────────────────────────
  app.get("/api/admin/blog-categories", isAdminSession, async (_req, res) => {
    try {
      res.json(await storage.getBlogCategories(false));
    } catch { res.status(500).json({ message: "فشل في جلب أقسام المدونة" }); }
  });

  app.post("/api/admin/blog-categories", isAdminSession, async (req, res) => {
    try {
      const body = { ...req.body, sortOrder: req.body.sortOrder ? parseInt(req.body.sortOrder) : 0 };
      const parsed = insertBlogCategorySchema.safeParse(body);
      if (!parsed.success) return res.status(400).json({ message: "بيانات غير صحيحة", errors: parsed.error.errors });
      const cat = await storage.createBlogCategory(parsed.data);
      broadcast("categories_changed");
      res.status(201).json(cat);
    } catch { res.status(500).json({ message: "فشل في إضافة القسم" }); }
  });

  app.put("/api/admin/blog-categories/:id", isAdminSession, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getBlogCategory(id);
      if (!existing) return res.status(404).json({ message: "القسم غير موجود" });
      // Only allow fields that exist in blog_categories table
      const allowed: Record<string, unknown> = {};
      if (req.body.name !== undefined) allowed.name = String(req.body.name);
      if (req.body.slug !== undefined) allowed.slug = String(req.body.slug);
      if (req.body.description !== undefined) allowed.description = req.body.description || null;
      if (req.body.isActive !== undefined) allowed.isActive = Boolean(req.body.isActive);
      if (req.body.sortOrder !== undefined) allowed.sortOrder = parseInt(req.body.sortOrder) || 0;
      const cat = await storage.updateBlogCategory(id, allowed);
      broadcast("categories_changed");
      res.json(cat);
    } catch { res.status(500).json({ message: "فشل في تحديث القسم" }); }
  });

  app.delete("/api/admin/blog-categories/:id", isAdminSession, async (req, res) => {
    try {
      const existing = await storage.getBlogCategory(parseInt(req.params.id));
      if (!existing) return res.status(404).json({ message: "القسم غير موجود" });
      await storage.deleteBlogCategory(parseInt(req.params.id));
      broadcast("categories_changed");
      res.json({ success: true });
    } catch { res.status(500).json({ message: "فشل في حذف القسم" }); }
  });

  app.get("/api/organizations", async (req, res) => {
    try {
      const cached = cache.get<unknown>("organizations");
      if (cached) return res.json(cached);
      const orgs = await storage.getOrganizationsWithFollowers();
      const totalFollowers = orgs.reduce((sum, o) => sum + (o.followerCount || 0), 0);
      const mapped = orgs.map(o => ({ ...o, logo: fixLogoUrl(o.logo) }));
      const result = { orgs: mapped, totalFollowers };
      cache.set("organizations", result, TTL.MEDIUM);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch organizations" });
    }
  });

  // Public: jobs for a specific organization
  app.get("/api/organizations/:id/jobs", async (req, res) => {
    try {
      const orgId = parseInt(req.params.id as string);
      const [allJobs, org] = await Promise.all([
        storage.getJobs(),
        storage.getOrganization(orgId),
      ]);
      const orgJobs = allJobs
        .filter(j => j.organizationId === orgId && j.status === "published")
        .map(j => ({ ...j, isResult: false, organization: org || null }));
      res.json(orgJobs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch organization jobs" });
    }
  });

  // Helper: get member ID from either community auth or Replit auth
  async function getCurrentMemberId(req: any): Promise<number | null> {
    // 0. Token-based auth (works even when cookies are blocked, e.g. in iframes)
    const tokenHeader = req.headers["x-community-token"];
    const token = typeof tokenHeader === "string" ? tokenHeader.trim() : null;
    if (token) {
      const [tokenRow] = await db
        .select()
        .from(communityTokensTable)
        .where(and(eq(communityTokensTable.token, token), gt(communityTokensTable.expiresAt, new Date())))
        .limit(1);
      if (tokenRow) {
        const member = await communityStorage.getMember(tokenRow.memberId);
        if (member && !member.isBanned) return member.id;
      }
    }

    // 1. Cached community member session (fast path)
    const sessionMemberId = req.session?.communityMemberId;
    if (sessionMemberId) {
      const member = await communityStorage.getMember(sessionMemberId);
      if (member) return member.id;
    }

    // 2. Replit Auth bridge: try passport session then req.user
    const passportClaims = req.session?.passport?.user?.claims;
    const reqUserClaims = req.user?.claims;
    const claims = reqUserClaims || passportClaims || {};
    const replitUserId = claims.sub || claims.id;

    if (replitUserId) {
      let member = await communityStorage.getMemberByUserId(replitUserId);
      if (!member) {
        const rawUsername = claims.preferred_username || claims.username || claims.first_name || replitUserId;
        const username = String(rawUsername).toLowerCase().replace(/[^a-z0-9]/g, "_").substring(0, 100) || "user";
        const displayName = String(claims.name || claims.first_name || claims.preferred_username || username).substring(0, 255);
        try {
          const [newMember] = await db.insert(communityMembers).values({
            userId: replitUserId,
            username,
            displayName,
            email: claims.email || null,
            provider: "replit",
          }).returning();
          member = newMember;
        } catch (err: any) {
          member = await communityStorage.getMemberByUserId(replitUserId);
        }
      }
      if (member) {
        req.session.communityMemberId = member.id;
        req.session.save?.(() => {});
        return member.id;
      }
    }

    return null;
  }

  // Follow / Unfollow organization (member auth required)
  app.post("/api/community/follows/organizations/:id", async (req, res) => {
    try {
      const memberId = await getCurrentMemberId(req);
      if (!memberId) return res.status(401).json({ message: "Login required" });

      const orgId = parseInt(req.params.id as string);
      // Check already following
      const existing = await db.select().from(organizationFollows)
        .where(and(eq(organizationFollows.memberId, memberId), eq(organizationFollows.organizationId, orgId)));
      if (existing.length > 0) {
        return res.json({ following: true, message: "Already following" });
      }
      await db.insert(organizationFollows).values({ memberId, organizationId: orgId });
      res.json({ following: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to follow organization" });
    }
  });

  app.delete("/api/community/follows/organizations/:id", async (req, res) => {
    try {
      const memberId = await getCurrentMemberId(req);
      if (!memberId) return res.status(401).json({ message: "Login required" });

      const orgId = parseInt(req.params.id as string);
      await db.delete(organizationFollows)
        .where(and(eq(organizationFollows.memberId, memberId), eq(organizationFollows.organizationId, orgId)));
      res.json({ following: false });
    } catch (error) {
      res.status(500).json({ message: "Failed to unfollow organization" });
    }
  });

  // Get all org follows for current member
  app.get("/api/community/follows/organizations", async (req, res) => {
    try {
      const memberId = await getCurrentMemberId(req);
      if (!memberId) return res.json([]);
      const follows = await db.select().from(organizationFollows)
        .where(eq(organizationFollows.memberId, memberId));
      res.json(follows);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch follows" });
    }
  });

  // Job alerts - notifications of type new_job_alert for current member
  app.get("/api/community/job-alerts", async (req, res) => {
    try {
      const memberId = await getCurrentMemberId(req);
      if (!memberId) return res.json([]);
      const notifications = await communityStorage.getNotifications(memberId);
      const alerts = notifications.filter((n: any) => n.type === "new_job_alert");
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch job alerts" });
    }
  });

  app.get("/api/ads/smart", async (req, res) => {
    try {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      const interestsParam = (req.query.interests as string) || "";
      const interests = interestsParam ? interestsParam.split(",").map(s => s.trim()).filter(Boolean) : [];
      const ad = await storage.getSmartAd(interests);
      res.json(ad || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch smart ad" });
    }
  });

  app.get("/api/ads/:position", async (req, res) => {
    try {
      res.json(await storage.getAdsByPosition(req.params.position as string));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch ads" });
    }
  });

  app.get("/api/seo/:path", async (req, res) => {
    try {
      const seo = await storage.getSeoSetting(req.params.path as string);
      res.json(seo || {});
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch SEO settings" });
    }
  });

  // ============ ADMIN LOGIN ============
  
  app.post("/api/admin/login", loginLimiter, async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "البريد الإلكتروني وكلمة المرور مطلوبان" });
    }

    const TOKEN_TTL = 7 * 24 * 60 * 60 * 1000; // 1 week

    const issueToken = (adminId: number | null, adminName: string) => {
      return issueAdminToken({ adminId, adminName, expires: Date.now() + TOKEN_TTL });
    };

    const loginSuccess = (adminId: number | null, adminName: string) => {
      const token = issueToken(adminId, adminName);
      (req.session as any).isAdmin = true;
      (req.session as any).adminId = adminId;
      (req.session as any).adminName = adminName;
      req.session.save(() => {/* best-effort */});
      return res.json({ success: true, message: "Login successful", token });
    };

    // 1) Check admins table first (by email or username)
    try {
      let dbAdmin = await storage.getAdminByEmail(email);
      if (!dbAdmin) dbAdmin = await storage.getAdminByUsername(email);

      if (dbAdmin && dbAdmin.isActive && dbAdmin.password) {
        const valid = await bcrypt.compare(password, dbAdmin.password);
        if (valid) return loginSuccess(dbAdmin.id, dbAdmin.name);
        return res.status(401).json({ message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
      }
    } catch (_) { /* fall through to env-var check */ }

    // 2) Main admin credentials. Database settings take priority after the
    // admin changes their email or password from the dashboard.
    const configuredAdminEmail = (await storage.getSetting("ADMIN_EMAIL").catch(() => null))?.value || ADMIN_EMAIL;
    const configuredAdminPassword = (await storage.getSetting("ADMIN_PASSWORD").catch(() => null))?.value || ADMIN_PASSWORD;
    if (email === configuredAdminEmail && password === configuredAdminPassword) {
      return loginSuccess(null, "المشرف الرئيسي");
    }

    return res.status(401).json({ message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
  });

  app.post("/api/admin/logout", (req, res) => {
    // Revoke token if provided
    const authHeader = req.headers["authorization"] || req.headers["x-admin-token"];
    const token = typeof authHeader === "string" ? authHeader.replace(/^Bearer\s+/i, "").trim() : null;
    if (token) adminTokens.delete(token);
    (req.session as any).isAdmin = false;
    req.session.destroy(() => {/* best-effort */});
    res.json({ success: true, message: "Logged out" });
  });

  app.get("/api/admin/check-auth", (req, res) => {
    if ((req.session as any)?.isAdmin === true) {
      return res.json({ isAdmin: true });
    }
    // Also check token header
    const authHeader = req.headers["authorization"] || req.headers["x-admin-token"];
    const token = typeof authHeader === "string" ? authHeader.replace(/^Bearer\s+/i, "").trim() : null;
    if (token) {
      const data = readAdminToken(token);
      if (data && data.expires > Date.now()) return res.json({ isAdmin: true });
    }
    return res.json({ isAdmin: false });
  });

  // Current logged-in admin's own data (role + permissions)
  app.get("/api/admin/me", isAdminSession, async (req, res) => {
    try {
      const adminId = (req.session as any)?.adminId;
      // Check token for adminId too
      let resolvedId = adminId;
      if (!resolvedId) {
        const authHeader = req.headers["authorization"] || req.headers["x-admin-token"];
        const token = typeof authHeader === "string" ? authHeader.replace(/^Bearer\s+/i, "").trim() : null;
        if (token) {
          const data = readAdminToken(token);
          if (data && data.expires > Date.now()) resolvedId = data.adminId;
        }
      }
      if (!resolvedId) {
        // Main admin (no DB record) — super access
        return res.json({ role: "super", permissions: null, isSuperAdmin: true });
      }
      const admin = await storage.getAdmin(resolvedId);
      if (!admin) return res.json({ role: "super", permissions: null, isSuperAdmin: true });
      res.json({ role: admin.role, permissions: admin.permissions, isSuperAdmin: false, name: admin.name });
    } catch (error) {
      res.json({ role: "super", permissions: null, isSuperAdmin: true });
    }
  });

  // Admin forgot password — public route
  app.post("/api/admin/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || typeof email !== "string") return res.status(400).json({ message: "البريد الإلكتروني مطلوب" });

      const emailLower = email.trim().toLowerCase();

      // Check main admin (env var or site_settings)
      const storedAdminEmail = (await storage.getSetting("ADMIN_EMAIL").catch(() => null))?.value || ADMIN_EMAIL;
      let adminId: number | null = null;
      let resolvedEmail = "";

      if (storedAdminEmail && storedAdminEmail.toLowerCase() === emailLower) {
        resolvedEmail = storedAdminEmail;
        adminId = null; // main admin has no DB row
      } else {
        // Check admins table
        const dbAdmin = await storage.getAdminByEmail(email.trim());
        if (dbAdmin && dbAdmin.email) {
          resolvedEmail = dbAdmin.email;
          adminId = dbAdmin.id;
        }
      }

      // Always respond with success to prevent email enumeration
      if (!resolvedEmail) {
        return res.json({ message: "إذا كان البريد الإلكتروني مسجلاً، ستصلك رسالة الاستعادة" });
      }

      // Generate token
      const token = `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
      adminResetTokens.set(token, { email: resolvedEmail, adminId, expiresAt: Date.now() + 3600_000 });

      const protocol = req.headers["x-forwarded-proto"] || "https";
      const host = req.headers["x-forwarded-host"] || req.headers.host;
      const resetUrl = `${protocol}://${host}/admin/reset-password?token=${token}`;

      await sendPasswordResetEmail({ email: resolvedEmail, resetUrl, displayName: "المشرف" });

      res.json({ message: "إذا كان البريد الإلكتروني مسجلاً، ستصلك رسالة الاستعادة" });
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ، حاول مجدداً" });
    }
  });

  // Admin reset password — public route
  app.post("/api/admin/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) return res.status(400).json({ message: "البيانات غير مكتملة" });
      if (newPassword.length < 8) return res.status(400).json({ message: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" });

      const entry = adminResetTokens.get(token);
      if (!entry || entry.expiresAt < Date.now()) {
        adminResetTokens.delete(token);
        return res.status(400).json({ message: "الرابط غير صالح أو منتهي الصلاحية" });
      }
      adminResetTokens.delete(token);

      if (entry.adminId === null) {
        // Main admin — store plain text (same as change-password flow)
        await storage.setSetting("ADMIN_PASSWORD", newPassword);
      } else {
        // DB admin — store bcrypt hash
        const hashed = await bcrypt.hash(newPassword, 10);
        await storage.updateAdmin(entry.adminId, { password: hashed });
      }

      res.json({ message: "تم تعيين كلمة المرور الجديدة بنجاح" });
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ، حاول مجدداً" });
    }
  });

  app.post("/api/admin/change-password", isAdminSession, async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    const storedPwdSetting = await storage.getSetting("ADMIN_PASSWORD").catch(() => null);
    const currentPwdToCheck = storedPwdSetting?.value || ADMIN_PASSWORD;
    if (!currentPwdToCheck || currentPassword !== currentPwdToCheck) {
      return res.status(400).json({ message: "كلمة المرور الحالية غير صحيحة" });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({ message: "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل" });
    }

    try {
      await storage.setSetting("ADMIN_PASSWORD", newPassword);
      // Update the local variable as well if needed, but the server should probably reload or use storage
      // For now, let's just confirm it's saved to the database
      res.json({ success: true, message: "تم تغيير كلمة المرور بنجاح" });
    } catch (error) {
      res.status(500).json({ message: "فشل في حفظ كلمة المرور الجديدة" });
    }
  });

  // Admin profile routes
  const _uploadStorageService = new ObjectStorageService();

  app.post("/api/admin/upload", isAdminSession, memoryUpload.single("file"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    try {
      const objectPath = await _uploadStorageService.uploadBuffer(
        req.file.buffer,
        req.file.mimetype,
        req.file.originalname,
      );
      const fileUrl = `/api/objects${objectPath.replace(/^\/objects/, "")}`;
      res.json({ url: fileUrl });
    } catch (err) {
      console.error("[upload] object storage error:", err);
      res.status(500).json({ message: "فشل رفع الملف" });
    }
  });

  // Legacy /uploads static files (dev only, production has no local uploads dir)
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // Public upload endpoint for service order receipts
  app.post("/api/media/upload", memoryUpload.single("file"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    try {
      const objectPath = await _uploadStorageService.uploadBuffer(
        req.file.buffer,
        req.file.mimetype,
        req.file.originalname,
      );
      const fileUrl = `/api/objects${objectPath.replace(/^\/objects/, "")}`;
      res.json({ url: fileUrl, path: fileUrl });
    } catch (err) {
      console.error("[media/upload] object storage error:", err);
      res.status(500).json({ message: "فشل رفع الملف" });
    }
  });

  app.post("/api/admin/profile", isAdminSession, async (req, res) => {
    try {
      const { name, email, avatar, location, bio, website } = req.body;
      await storage.setSetting("ADMIN_NAME", name);
      await storage.setSetting("ADMIN_EMAIL", email);
      await storage.setSetting("ADMIN_AVATAR", avatar);
      await storage.setSetting("ADMIN_LOCATION", location);
      await storage.setSetting("ADMIN_BIO", bio);
      await storage.setSetting("ADMIN_WEBSITE", website);
      res.json({ success: true, message: "تم حفظ بيانات الملف الشخصي بنجاح" });
    } catch (error) {
      res.status(500).json({ message: "فشل تحديث الملف الشخصي" });
    }
  });

  app.get("/api/admin/profile", isAdminSession, async (req, res) => {
    try {
      const name = await storage.getSetting("ADMIN_NAME");
      const email = await storage.getSetting("ADMIN_EMAIL");
      const avatar = await storage.getSetting("ADMIN_AVATAR");
      const location = await storage.getSetting("ADMIN_LOCATION");
      const bio = await storage.getSetting("ADMIN_BIO");
      const website = await storage.getSetting("ADMIN_WEBSITE");
      
      res.json({
        name: name?.value || "مشرف",
        email: email?.value || ADMIN_EMAIL,
        avatar: avatar?.value || "",
        location: location?.value || "المملكة العربية السعودية",
        bio: bio?.value || "مشرف على موقع إعلانات الوظائف",
        website: website?.value || "",
      });
    } catch (error) {
      res.status(500).json({ message: "فشل في جلب بيانات الملف الشخصي" });
    }
  });

  // ============ MARKET INDICATORS (AI) ============
  app.get("/api/market-indicators", async (req, res) => {
    try {
      const cached = cache.get<unknown>("market-indicators");
      if (cached) return res.json(cached);
      let snapshot = await storage.getLatestDailyMarketSnapshot();
      if (!snapshot) {
        const { buildAndSaveDailyMarketSnapshot } = await import("../marketSnapshot");
        await buildAndSaveDailyMarketSnapshot();
        snapshot = await storage.getLatestDailyMarketSnapshot();
      }
      if (!snapshot) return res.json(null);
      const data = JSON.parse(snapshot.snapshotData);
      cache.set("market-indicators", data, TTL.STATIC);
      res.json(data);
    } catch (error) {
      console.error("[Market Indicators] Error:", error);
      res.status(500).json({ message: "فشل في جلب مؤشرات السوق" });
    }
  });

  // ============ HOMEPAGE SETTINGS ============
  app.get("/api/homepage-settings", async (req, res) => {
    try {
      const cached = cache.get<unknown>("homepage-settings");
      if (cached !== undefined) return res.json(cached);
      const setting = await storage.getSetting("HOMEPAGE_SETTINGS");
      const data = setting?.value ? JSON.parse(setting.value) : null;
      cache.set("homepage-settings", data, TTL.MEDIUM);
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "فشل في جلب إعدادات الصفحة الرئيسية" });
    }
  });

  app.get("/api/admin/analytics", isAdminSession, async (req, res) => {
    try {
      const data = await storage.getAnalytics();
      res.json(data);
    } catch (error) {
      console.error("[analytics]", error);
      res.status(500).json({ message: "فشل في جلب بيانات التحليلات" });
    }
  });

  app.post("/api/admin/market-indicators/rebuild", isAdminSession, async (req, res) => {
    try {
      const { buildAndSaveDailyMarketSnapshot } = await import("../marketSnapshot");
      await buildAndSaveDailyMarketSnapshot();
      res.json({ success: true, message: "تم إعادة بناء مؤشرات السوق بنجاح" });
    } catch (error) {
      console.error("[market-indicators rebuild]", error);
      res.status(500).json({ message: "فشل في إعادة بناء المؤشرات" });
    }
  });

  app.post("/api/admin/analytics/ai-analyze", isAdminSession, async (req, res) => {
    try {
      const { data, focusArea } = req.body;
      const { analyzeWebsiteStats } = await import("../ai");
      const result = await analyzeWebsiteStats(data, focusArea);
      if (!result) return res.status(503).json({ message: "خدمة الذكاء الاصطناعي غير متاحة حالياً" });
      res.json({ analysis: result });
    } catch (error) {
      console.error("[analytics ai]", error);
      res.status(500).json({ message: "فشل في تحليل البيانات" });
    }
  });

  app.get("/api/admin/homepage-settings", isAdminSession, async (req, res) => {
    try {
      const setting = await storage.getSetting("HOMEPAGE_SETTINGS");
      if (!setting || !setting.value) {
        return res.json(null);
      }
      res.json(JSON.parse(setting.value));
    } catch (error) {
      res.status(500).json({ message: "فشل في جلب إعدادات الصفحة الرئيسية" });
    }
  });

  app.post("/api/admin/homepage-settings", isAdminSession, async (req, res) => {
    try {
      const settings = req.body;
      await storage.setSetting("HOMEPAGE_SETTINGS", JSON.stringify(settings));
      cache.del("homepage-settings");
      broadcast("settings_changed");
      res.json({ success: true, message: "تم حفظ إعدادات الصفحة الرئيسية بنجاح" });
    } catch (error) {
      res.status(500).json({ message: "فشل في حفظ إعدادات الصفحة الرئيسية" });
    }
  });

  app.post("/api/admin/settings", isAdminSession, async (req, res) => {
    try {
      const settings = req.body;
      await storage.setSetting("ADMIN_SETTINGS", JSON.stringify(settings));
      broadcast("settings_changed");
      res.json({ success: true, message: "تم حفظ الإعدادات بنجاح" });
    } catch (error) {
      res.status(500).json({ message: "فشل في حفظ الإعدادات" });
    }
  });

  app.get("/api/admin/settings", isAdminSession, async (req, res) => {
    try {
      const settings = await storage.getSetting("ADMIN_SETTINGS");
      res.json(settings ? JSON.parse(settings.value!) : {
        emailNotifications: true,
        pushNotifications: false,
        darkMode: true,
        twoFactorAuth: false,
        showOnlineStatus: true,
        language: "ar",
        timezone: "Asia/Riyadh",
      });
    } catch (error) {
      res.status(500).json({ message: "فشل في جلب الإعدادات" });
    }
  });

  // ============ ADMIN API ROUTES ============
  
  // Jobs Admin
  app.get("/api/admin/jobs", isAdminSession, async (req, res) => {
    try {
      const allJobs = await storage.getAllJobs();
      const allResults = await storage.getAllResults();

      // Combine both and map results to job format
      const combined = [
        ...allJobs,
        ...allResults.map(r => ({
          id: r.id,
          title: r.title,
          company: r.org || "",
          organizationId: r.organizationId,
          category: "results",
          date: r.date,
          description: r.details,
          applyUrl: r.inquiryUrl,
          sourceUrl: r.inquiryUrl,
          status: r.status,
          isFeatured: (r as any).isFeatured,
          viewCount: r.viewCount,
          isActive: r.isActive,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          isResult: true
        }))
      ].sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());

      res.json(combined);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch admin jobs" });
    }
  });

  app.post("/api/admin/jobs", isAdminSession, async (req, res) => {
    try {
      // Normalize deadlineDate before Zod parse: Drizzle timestamp expects Date or null, not a string
      let body = { ...req.body };
      if (!body.deadlineDate || body.deadlineDate === "") {
        body.deadlineDate = null;
      } else if (typeof body.deadlineDate === "string") {
        const d = new Date(body.deadlineDate + "T00:00:00");
        body.deadlineDate = isNaN(d.getTime()) ? null : d;
      }

      const parsed = insertJobSchema.safeParse(body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid job data", errors: parsed.error.errors });
      
      let jobData = parsed.data;

      // Handle featured jobs limit (max 4)
      if (jobData.isFeatured) {
        // Fetch ALL jobs that are currently featured
        const featuredJobs = await storage.getFeaturedJobs();
        // Since getFeaturedJobs filters by isFeatured=true and status=published
        // we check if we're at or above the limit
        if (featuredJobs.length >= 4) {
          // Sort by id ASC to find the oldest featured item
          const sortedFeatured = [...featuredJobs].sort((a, b) => a.id - b.id);
          const oldestJob = sortedFeatured[0];
          // Set isFeatured to false for the oldest one
          await storage.updateJob(oldestJob.id, { isFeatured: false });
        }
      }
      
      const newJob = await storage.createJob(jobData);
      cache.delPrefix("jobs:");
      broadcast("jobs_changed");
      res.status(201).json(newJob);

      // Notify Google Indexing API (non-blocking)
      if (newJob.status === "published") {
        notifyJobPublished(newJob.id);
      }

      // Auto-publish to X/Twitter (non-blocking)
      shouldAutoPublishJob(newJob).then((should) => {
        if (should) publishToTwitter({ contentType: "job", contentId: newJob.id, isAuto: true }).catch(() => {});
      }).catch(() => {});

      // Notify followers of the organization with points system (non-blocking)
      if (newJob.status === "published") {
        (async () => {
          try {
            // Collect member IDs to notify (org followers + category subscribers), deduplicated
            const notifyMemberIds = new Set<number>();

            if (newJob.organizationId) {
              const follows = await db.select().from(organizationFollows)
                .where(eq(organizationFollows.organizationId, newJob.organizationId!));
              for (const f of follows) notifyMemberIds.add(f.memberId);
            }

            // Category subscribers
            if (newJob.category) {
              const categorySubscribers = await db.select({
                memberId: jobAlertPreferences.memberId,
              })
                .from(jobAlertPreferences)
                .where(
                  and(
                    eq(jobAlertPreferences.isEnabled, true),
                    sql`${newJob.category} = ANY(${jobAlertPreferences.categories})`
                  )
                );
              for (const s of categorySubscribers) notifyMemberIds.add(s.memberId);
            }

            const [org] = newJob.organizationId
              ? await db.select().from(organizations).where(eq(organizations.id, newJob.organizationId!))
              : [null];

            const expo = new Expo();
            const pushMessages: ExpoPushMessage[] = [];

            for (const memberId of notifyMemberIds) {
              // Dedup: skip if already sent
              const alreadySent = await storage.hasJobAlertSent(memberId, newJob.id);
              if (alreadySent) continue;
              // Check points balance
              const points = await storage.getJobAlertPoints(memberId);
              if (points <= 0) continue;
              // Deduct 1 point and send notification
              const deducted = await storage.deductJobAlertPoint(memberId);
              if (!deducted) continue;
              await storage.markJobAlertSent(memberId, newJob.id);

              const notifMessage = org
                ? `وظيفة جديدة في ${org.name}: ${newJob.title}`
                : `وظيفة جديدة: ${newJob.title}`;

              await communityStorage.createDirectNotification({
                memberId,
                actorId: 0,
                type: "new_job_alert",
                message: notifMessage,
                link: `/jobs/post/${newJob.id}`,
              });

              // Collect push tokens for this member
              const tokens = await db.select({ token: memberPushTokens.token })
                .from(memberPushTokens)
                .where(eq(memberPushTokens.memberId, memberId));

              for (const { token } of tokens) {
                if (Expo.isExpoPushToken(token)) {
                  pushMessages.push({
                    to: token,
                    sound: "default",
                    title: "وظيفة جديدة 🎯",
                    body: notifMessage,
                    data: { jobId: newJob.id, link: `/jobs/post/${newJob.id}` },
                  });
                }
              }

              // Warn if points running low after deduction
              const newPoints = points - 1;
              if (newPoints === 10) {
                communityStorage.createDirectNotification({
                  memberId,
                  actorId: 0,
                  type: "system",
                  message: "تنبيه: رصيد نقاط التنبيه لديك وصل إلى 10 نقاط فقط. اشحن رصيدك لتستمر في استقبال التنبيهات.",
                  link: "/dashboard/job-alerts",
                }).catch(() => {});
              } else if (newPoints === 0) {
                communityStorage.createDirectNotification({
                  memberId,
                  actorId: 0,
                  type: "system",
                  message: "نفد رصيد نقاط التنبيه لديك. اشحن رصيدك لتستمر في استقبال إشعارات الوظائف الجديدة.",
                  link: "/dashboard/job-alerts",
                }).catch(() => {});
              }
            }

            // Send push notifications in chunks
            if (pushMessages.length > 0) {
              const chunks = expo.chunkPushNotifications(pushMessages);
              for (const chunk of chunks) {
                expo.sendPushNotificationsAsync(chunk).catch(() => {});
              }
            }
          } catch {}
        })();
      }

      // Generate AI summary in background (non-blocking)
      if (newJob.description) {
        generateJobSummary({ title: newJob.title, description: newJob.description, category: newJob.category, location: newJob.location })
          .then(points => {
            if (points && points.length > 0) {
              storage.updateJob(newJob.id, { summary: JSON.stringify(points) }).catch(() => {});
            }
          })
          .catch(() => {});
      }
    } catch (error: any) {
      logger.error({ err: error, body: req.body }, "[createJob error]");
      res.status(500).json({ message: "Failed to create job", detail: error?.message || String(error) });
    }
  });

  app.put("/api/admin/jobs/:id", isAdminSession, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      let jobData = req.body;

      // Normalize deadlineDate: convert "YYYY-MM-DD" string to Date, or null if empty/invalid
      if (jobData.deadlineDate === "" || jobData.deadlineDate === undefined) {
        jobData = { ...jobData, deadlineDate: null };
      } else if (typeof jobData.deadlineDate === "string") {
        const d = new Date(jobData.deadlineDate + "T00:00:00");
        jobData = { ...jobData, deadlineDate: isNaN(d.getTime()) ? null : d };
      }

      // Handle featured jobs limit (max 4)
      if (jobData.isFeatured) {
        const featuredJobs = await storage.getFeaturedJobs();
        const currentJob = await storage.getJob(id);
        
        // Only if it's being turned into featured or it wasn't featured before
        if (!currentJob?.isFeatured && featuredJobs.length >= 4) {
          const sortedFeatured = [...featuredJobs].sort((a, b) => a.id - b.id);
          const oldestJob = sortedFeatured[0];
          await storage.updateJob(oldestJob.id, { isFeatured: false });
        }
      }

      const updatedJob = await storage.updateJob(id, jobData);
      if (!updatedJob) return res.status(404).json({ message: "Job not found" });
      cache.delPrefix("jobs:");
      broadcast("jobs_changed");
      res.json(updatedJob);

      // Notify Google Indexing API (non-blocking)
      if (updatedJob.status === "published") {
        notifyJobPublished(updatedJob.id);
      }

      // Auto-publish to X/Twitter (non-blocking)
      shouldAutoPublishJob(updatedJob).then((should) => {
        if (should) publishToTwitter({ contentType: "job", contentId: updatedJob.id, isAuto: true }).catch(() => {});
      }).catch(() => {});

      // Regenerate AI summary if description changed (non-blocking)
      if (jobData.description !== undefined && updatedJob.description) {
        generateJobSummary({ title: updatedJob.title, description: updatedJob.description, category: updatedJob.category, location: updatedJob.location })
          .then(points => {
            if (points && points.length > 0) {
              storage.updateJob(id, { summary: JSON.stringify(points) }).catch(() => {});
            }
          })
          .catch(() => {});
      }
    } catch (error: any) {
      logger.error({ err: error, id: req.params.id, body: req.body }, "[updateJob error]");
      res.status(500).json({ message: "Failed to update job", detail: error?.message || String(error) });
    }
  });

  app.delete("/api/admin/jobs/:id", isAdminSession, async (req, res) => {
    try {
      const jobId = parseInt(req.params.id as string);
      await storage.deleteJob(jobId);
      await communityStorage.deleteNotificationsByLink(`/jobs/post/${jobId}`);
      notifyJobDeleted(jobId);
      cache.delPrefix("jobs:");
      broadcast("jobs_changed");
      res.json({ message: "Job deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete job" });
    }
  });

  // Results Admin
  app.get("/api/admin/results", isAdminSession, async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const results = status ? await storage.getResultsByStatus(status) : await storage.getAllResults();
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch results" });
    }
  });

  app.post("/api/admin/results", isAdminSession, async (req, res) => {
    try {
      const parsed = insertResultSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid result data", errors: parsed.error.errors });
      
      const resultData = parsed.data;

      // Handle featured jobs limit (max 4) - Results are also jobs in the 'results' category
      if ((resultData as any).isFeatured) {
        const featuredJobs = await storage.getFeaturedJobs();
        if (featuredJobs.length >= 4) {
          const sortedFeatured = [...featuredJobs].sort((a, b) => a.id - b.id);
          const oldestJob = sortedFeatured[0];
          await storage.updateJob(oldestJob.id, { isFeatured: false });
        }
      }

      const newResult = await storage.createResult(resultData);
      cache.del("results");
      cache.delPrefix("jobs:");
      broadcast("results_changed");
      res.status(201).json(newResult);
    } catch (error) {
      res.status(500).json({ message: "Failed to create result" });
    }
  });

  app.put("/api/admin/results/:id", isAdminSession, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const resultData = req.body;

      // Handle featured jobs limit (max 4)
      if (resultData.isFeatured) {
        const featuredJobs = await storage.getFeaturedJobs();
        const currentResult = await storage.getResult(id);
        
        // Only if it's being turned into featured or it wasn't featured before
        if (!(currentResult as any)?.isFeatured && featuredJobs.length >= 4) {
          const sortedFeatured = [...featuredJobs].sort((a, b) => a.id - b.id);
          const oldestJob = sortedFeatured[0];
          await storage.updateJob(oldestJob.id, { isFeatured: false });
        }
      }

      const updatedResult = await storage.updateResult(id, resultData);
      if (!updatedResult) return res.status(404).json({ message: "Result not found" });
      cache.del("results");
      cache.delPrefix("jobs:");
      broadcast("results_changed");
      res.json(updatedResult);
    } catch (error) {
      res.status(500).json({ message: "Failed to update result" });
    }
  });

  app.delete("/api/admin/results/:id", isAdminSession, async (req, res) => {
    try {
      await storage.deleteResult(parseInt(req.params.id as string));
      cache.del("results");
      cache.delPrefix("jobs:");
      broadcast("results_changed");
      res.json({ message: "Result deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete result" });
    }
  });

  app.get("/api/admin/jobs/:id", isAdminSession, async (req, res) => {
    try {
      const job = await storage.getJob(parseInt(req.params.id as string));
      if (!job) return res.status(404).json({ message: "Job not found" });
      res.json(job);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch job" });
    }
  });

  app.get("/api/admin/results/:id", isAdminSession, async (req, res) => {
    try {
      const result = await storage.getResult(parseInt(req.params.id as string));
      if (!result) return res.status(404).json({ message: "Result not found" });
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch result" });
    }
  });

  // Blog Admin
  app.get("/api/admin/blog", isAdminSession, async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const posts = status ? await storage.getBlogPostsByStatus(status) : await storage.getAllBlogPosts();
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });

  app.post("/api/admin/blog", isAdminSession, async (req, res) => {
    try {
      const parsed = insertBlogPostSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid blog post data", errors: parsed.error.errors });
      const post = await storage.createBlogPost(parsed.data);
      broadcast("blog_changed");
      res.status(201).json(post);

      // Auto-publish to X/Twitter (non-blocking)
      shouldAutoPublishBlog(post).then((should) => {
        if (should) publishToTwitter({ contentType: "blog", contentId: post.id, isAuto: true }).catch(() => {});
      }).catch(() => {});
    } catch (error) {
      res.status(500).json({ message: "Failed to create blog post" });
    }
  });

  app.get("/api/admin/blog/:id", isAdminSession, async (req, res) => {
    try {
      const post = await storage.getBlogPost(parseInt(req.params.id as string));
      if (!post) return res.status(404).json({ message: "Blog post not found" });
      res.json(post);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blog post" });
    }
  });

  app.put("/api/admin/blog/:id", isAdminSession, async (req, res) => {
    try {
      const post = await storage.updateBlogPost(parseInt(req.params.id as string), req.body);
      if (!post) return res.status(404).json({ message: "Blog post not found" });
      broadcast("blog_changed");
      res.json(post);

      // Auto-publish to X/Twitter (non-blocking)
      shouldAutoPublishBlog(post).then((should) => {
        if (should) publishToTwitter({ contentType: "blog", contentId: post.id, isAuto: true }).catch(() => {});
      }).catch(() => {});
    } catch (error) {
      res.status(500).json({ message: "Failed to update blog post" });
    }
  });

  app.delete("/api/admin/blog/:id", isAdminSession, async (req, res) => {
    try {
      await storage.deleteBlogPost(parseInt(req.params.id as string));
      broadcast("blog_changed");
      res.json({ message: "Blog post deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete blog post" });
    }
  });

  // Services Admin
  app.get("/api/admin/services", isAdminSession, async (req, res) => {
    try {
      res.json(await storage.getAllServices());
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.post("/api/admin/services", isAdminSession, async (req, res) => {
    try {
      const service = await storage.createService(req.body);
      broadcast("services_changed");
      res.status(201).json(service);
    } catch (error) {
      res.status(500).json({ message: "Failed to create service" });
    }
  });

  app.get("/api/admin/services/:id", isAdminSession, async (req, res) => {
    try {
      const service = await storage.getService(parseInt(req.params.id as string));
      if (!service) return res.status(404).json({ message: "Service not found" });
      res.json(service);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch service" });
    }
  });

  app.put("/api/admin/services/:id", isAdminSession, async (req, res) => {
    try {
      const service = await storage.updateService(parseInt(req.params.id as string), req.body);
      if (!service) return res.status(404).json({ message: "Service not found" });
      broadcast("services_changed");
      res.json(service);
    } catch (error) {
      res.status(500).json({ message: "Failed to update service" });
    }
  });

  app.delete("/api/admin/services/:id", isAdminSession, async (req, res) => {
    try {
      await storage.deleteService(parseInt(req.params.id as string));
      broadcast("services_changed");
      res.json({ message: "Service deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete service" });
    }
  });

  // Organizations Admin
  app.get("/api/admin/organizations", isAdminSession, async (req, res) => {
    try {
      res.json(await storage.getOrganizations());
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch organizations" });
    }
  });

  app.post("/api/admin/organizations", isAdminSession, async (req, res) => {
    try {
      const parsed = insertOrganizationSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid organization data", errors: parsed.error.errors });
      const existing = await storage.getOrganizations();
      const duplicate = existing.find(o => o.name.trim().toLowerCase() === parsed.data.name.trim().toLowerCase());
      if (duplicate) return res.status(409).json({ message: `الجهة "${parsed.data.name}" موجودة بالفعل — يمكنك اختيارها من القائمة` });
      const org = await storage.createOrganization(parsed.data);
      cache.del("organizations");
      broadcast("organizations_changed");
      res.status(201).json(org);
    } catch (error) {
      res.status(500).json({ message: "Failed to create organization" });
    }
  });

  app.put("/api/admin/organizations/:id", isAdminSession, async (req, res) => {
    try {
      const org = await storage.updateOrganization(parseInt(req.params.id as string), req.body);
      if (!org) return res.status(404).json({ message: "Organization not found" });
      cache.del("organizations");
      broadcast("organizations_changed");
      res.json(org);
    } catch (error) {
      res.status(500).json({ message: "Failed to update organization" });
    }
  });

  app.delete("/api/admin/organizations/:id", isAdminSession, async (req, res) => {
    try {
      await storage.deleteOrganization(parseInt(req.params.id as string));
      cache.del("organizations");
      broadcast("organizations_changed");
      res.json({ message: "Organization deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete organization" });
    }
  });

  // Organization Types Management
  app.get("/api/admin/organization-types", isAdminSession, async (req, res) => {
    try {
      res.json(await storage.getOrganizationTypes());
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch organization types" });
    }
  });

  app.get("/api/organization-types", async (req, res) => {
    try {
      res.json(await storage.getOrganizationTypes());
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch organization types" });
    }
  });

  app.post("/api/admin/organization-types", isAdminSession, async (req, res) => {
    try {
      const parsed = insertOrganizationTypeSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "بيانات غير صالحة", errors: parsed.error.errors });
      const existing = await storage.getOrganizationTypes();
      if (existing.find(t => t.value.toLowerCase() === parsed.data.value.toLowerCase())) {
        return res.status(409).json({ message: `التصنيف "${parsed.data.value}" موجود بالفعل` });
      }
      if (existing.find(t => t.label === parsed.data.label)) {
        return res.status(409).json({ message: `التصنيف "${parsed.data.label}" موجود بالفعل` });
      }
      const orgType = await storage.createOrganizationType(parsed.data);
      res.status(201).json(orgType);
    } catch (error) {
      res.status(500).json({ message: "Failed to create organization type" });
    }
  });

  app.put("/api/admin/organization-types/:id", isAdminSession, async (req, res) => {
    try {
      const updated = await storage.updateOrganizationType(parseInt(req.params.id), req.body);
      if (!updated) return res.status(404).json({ message: "التصنيف غير موجود" });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update organization type" });
    }
  });

  app.delete("/api/admin/organization-types/:id", isAdminSession, async (req, res) => {
    try {
      await storage.deleteOrganizationType(parseInt(req.params.id));
      res.json({ message: "تم حذف التصنيف" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete organization type" });
    }
  });

  // Admins Management
  app.get("/api/admin/admins", isAdminSession, async (req, res) => {
    try {
      res.json(await storage.getAdmins());
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch admins" });
    }
  });

  app.post("/api/admin/admins", isAdminSession, async (req, res) => {
    try {
      const { password, ...rest } = req.body;
      // Auto-generate userId if not provided
      if (!rest.userId || !rest.userId.trim()) {
        rest.userId = `admin_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      }
      const parsed = insertAdminSchema.safeParse(rest);
      if (!parsed.success) return res.status(400).json({ message: "بيانات غير صحيحة", errors: parsed.error.errors });
      const data: any = { ...parsed.data };
      if (password && password.trim()) {
        if (password.trim().length < 6) {
          return res.status(400).json({ message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });
        }
        data.password = await bcrypt.hash(password.trim(), 10);
      }
      const newAdmin = await storage.createAdmin(data);
      broadcast("admins_changed");
      res.status(201).json(newAdmin);
    } catch (error: any) {
      if (error?.code === "23505") {
        return res.status(400).json({ message: "اسم المستخدم أو البريد الإلكتروني مستخدم بالفعل" });
      }
      res.status(500).json({ message: "فشل في إضافة المشرف" });
    }
  });

  app.put("/api/admin/admins/:id", isAdminSession, async (req, res) => {
    try {
      const { password, ...rest } = req.body;
      const updateData: any = { ...rest };
      if (password && password.trim()) {
        updateData.password = await bcrypt.hash(password.trim(), 10);
      }
      const admin = await storage.updateAdmin(parseInt(req.params.id as string), updateData);
      if (!admin) return res.status(404).json({ message: "المشرف غير موجود" });
      broadcast("admins_changed");
      res.json(admin);
    } catch (error: any) {
      if (error?.code === "23505") {
        return res.status(400).json({ message: "اسم المستخدم أو البريد الإلكتروني مستخدم بالفعل" });
      }
      res.status(500).json({ message: "فشل في تحديث المشرف" });
    }
  });

  app.delete("/api/admin/admins/:id", isAdminSession, async (req, res) => {
    try {
      await storage.deleteAdmin(parseInt(req.params.id as string));
      broadcast("admins_changed");
      res.json({ message: "Admin deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete admin" });
    }
  });

  app.patch("/api/admin/admins/:id/permissions", isAdminSession, async (req, res) => {
    try {
      const { permissions, role } = req.body;
      const updateData: any = {};
      if (permissions !== undefined) updateData.permissions = typeof permissions === "string" ? permissions : JSON.stringify(permissions);
      if (role !== undefined) updateData.role = role;
      const admin = await storage.updateAdmin(parseInt(req.params.id as string), updateData);
      if (!admin) return res.status(404).json({ message: "المشرف غير موجود" });
      broadcast("admins_changed");
      res.json(admin);
    } catch (error) {
      res.status(500).json({ message: "فشل في تحديث الصلاحيات" });
    }
  });

  // Permissions
  app.get("/api/admin/permissions", isAdminSession, async (req, res) => {
    try {
      res.json(await storage.getPermissions());
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch permissions" });
    }
  });

  app.post("/api/admin/permissions", isAdminSession, async (req, res) => {
    try {
      const parsed = insertPermissionSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid permission data", errors: parsed.error.errors });
      res.status(201).json(await storage.createPermission(parsed.data));
    } catch (error) {
      res.status(500).json({ message: "Failed to create permission" });
    }
  });

  app.delete("/api/admin/permissions/:id", isAdminSession, async (req, res) => {
    try {
      await storage.deletePermission(parseInt(req.params.id as string));
      res.json({ message: "Permission deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete permission" });
    }
  });

  // AI Ad Generator
  app.post("/api/admin/ads/generate", isAdminSession, async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) return res.status(400).json({ message: "prompt مطلوب" });
      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `أنت متخصص في كتابة إعلانات احترافية لموقع وظائف سعودي يغطي الوظائف المدنية والعسكرية ووظائف الشركات والنتائج الوظيفية. 
اكتب المحتوى بالعربية الفصحى السهلة المناسبة للجمهور السعودي.
أرجع دائماً JSON فقط بدون أي نص إضافي.`
          },
          {
            role: "user",
            content: `اكتب محتوى إعلان احترافي عن: "${prompt}"

أرجع JSON بهذا الشكل بالضبط:
{
  "title": "عنوان الإعلان (لا يتجاوز 60 حرف)",
  "description": "وصف مقنع ومختصر (لا يتجاوز 120 حرف)",
  "ctaText": "نص زر الإجراء (مثل: اكتشف الآن، سجل مجاناً، ابدأ الآن)",
  "targetInterests": "الاهتمامات المستهدفة مفصولة بفاصلة من هذه القائمة فقط: civil,military,companies,results,courses,blog,community"
}`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 300,
      });
      const content = completion.choices[0].message.content;
      const data = JSON.parse(content || "{}");
      res.json(data);
    } catch (error) {
      console.error("AI ad generation error:", error);
      res.status(500).json({ message: "فشل توليد الإعلان بالذكاء الاصطناعي" });
    }
  });

  // Ads Admin
  app.get("/api/admin/ads", isAdminSession, async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      res.json(await storage.getAds(status));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch ads" });
    }
  });

  app.post("/api/admin/ads", isAdminSession, async (req, res) => {
    try {
      const parsed = insertAdSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid ad data", errors: parsed.error.errors });
      const ad = await storage.createAd(parsed.data);
      broadcast("ads_changed");
      res.status(201).json(ad);
    } catch (error) {
      res.status(500).json({ message: "Failed to create ad" });
    }
  });

  app.put("/api/admin/ads/:id", isAdminSession, async (req, res) => {
    try {
      const ad = await storage.updateAd(parseInt(req.params.id as string), req.body);
      if (!ad) return res.status(404).json({ message: "Ad not found" });
      broadcast("ads_changed");
      res.json(ad);
    } catch (error) {
      res.status(500).json({ message: "Failed to update ad" });
    }
  });

  app.post("/api/admin/ads/:id/trash", isAdminSession, async (req, res) => {
    try {
      await storage.trashAd(parseInt(req.params.id as string));
      broadcast("ads_changed");
      res.json({ message: "Ad trashed" });
    } catch (error) {
      res.status(500).json({ message: "Failed to trash ad" });
    }
  });

  app.post("/api/admin/ads/:id/restore", isAdminSession, async (req, res) => {
    try {
      await storage.restoreAd(parseInt(req.params.id as string));
      broadcast("ads_changed");
      res.json({ message: "Ad restored" });
    } catch (error) {
      res.status(500).json({ message: "Failed to restore ad" });
    }
  });

  app.delete("/api/admin/ads/:id", isAdminSession, async (req, res) => {
    try {
      await storage.deleteAd(parseInt(req.params.id as string));
      broadcast("ads_changed");
      res.json({ message: "Ad deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete ad" });
    }
  });

  // SEO Settings Admin
  app.get("/api/admin/seo", isAdminSession, async (req, res) => {
    try {
      res.json(await storage.getSeoSettings());
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch SEO settings" });
    }
  });

  app.post("/api/admin/seo", isAdminSession, async (req, res) => {
    try {
      const parsed = insertSeoSettingSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid SEO data", errors: parsed.error.errors });
      const seoItem = await storage.createSeoSetting(parsed.data);
      broadcast("seo_changed");
      res.status(201).json(seoItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to create SEO setting" });
    }
  });

  app.put("/api/admin/seo/:id", isAdminSession, async (req, res) => {
    try {
      const seo = await storage.updateSeoSetting(parseInt(req.params.id as string), req.body);
      if (!seo) return res.status(404).json({ message: "SEO setting not found" });
      broadcast("seo_changed");
      res.json(seo);
    } catch (error) {
      res.status(500).json({ message: "Failed to update SEO setting" });
    }
  });

  app.delete("/api/admin/seo/:id", isAdminSession, async (req, res) => {
    try {
      await storage.deleteSeoSetting(parseInt(req.params.id as string));
      broadcast("seo_changed");
      res.json({ message: "SEO setting deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete SEO setting" });
    }
  });

  // Categories Admin
  app.get("/api/admin/categories", isAdminSession, async (req, res) => {
    try {
      res.json(await storage.getCategories());
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/admin/categories", isAdminSession, async (req, res) => {
    try {
      const body = {
        ...req.body,
        parentId: req.body.parentId === "null" || req.body.parentId === null || req.body.parentId === undefined ? null : parseInt(req.body.parentId),
        sortOrder: req.body.sortOrder ? parseInt(req.body.sortOrder) : 0,
      };
      const parsed = insertCategorySchema.safeParse(body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid category data", errors: parsed.error.errors });
      const cat = await storage.createCategory(parsed.data);
      broadcast("categories_changed");
      res.status(201).json(cat);
    } catch (error) {
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.put("/api/admin/categories/:id", isAdminSession, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const updateData = {
        ...req.body,
        parentId: req.body.parentId === "null" || req.body.parentId === null || req.body.parentId === undefined ? null : parseInt(req.body.parentId),
        sortOrder: req.body.sortOrder ? parseInt(req.body.sortOrder) : 0,
      };
      const category = await storage.updateCategory(id, updateData);
      if (!category) return res.status(404).json({ message: "Category not found" });
      broadcast("categories_changed");
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete("/api/admin/categories/:id", isAdminSession, async (req, res) => {
    try {
      await storage.deleteCategory(parseInt(req.params.id as string));
      broadcast("categories_changed");
      res.json({ message: "Category deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Auto-categorize media on startup (best-effort)
  storage.autoCategorizMedia().catch(() => {});

  // Media Admin
  registerObjectStorageRoutes(app);

  // Serve object storage files via /api/objects/* (used by logo URLs stored as /objects/...)
  const _objectStorageService = new ObjectStorageService();
  app.get(/^\/api\/objects\/(.+)$/, async (req, res) => {
    try {
      const objectPath = `/objects/${(req.params as any)[0]}`;
      const objectFile = await _objectStorageService.getObjectEntityFile(objectPath);
      await _objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "Object not found" });
      }
      return res.status(500).json({ error: "Failed to serve object" });
    }
  });

  app.get("/api/admin/media", isAdminSession, async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const items = await storage.getMedia(category);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch media" });
    }
  });

  app.get("/api/admin/media/trash", isAdminSession, async (req, res) => {
    try {
      res.json(await storage.getMediaTrash());
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch media trash" });
    }
  });

  app.post("/api/admin/media", isAdminSession, async (req, res) => {
    try {
      const parsed = insertMediaSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid media data", errors: parsed.error.errors });
      const mediaItem = await storage.createMedia(parsed.data);
      broadcast("media_changed");
      res.status(201).json(mediaItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to create media" });
    }
  });

  app.put("/api/admin/media/:id", isAdminSession, async (req, res) => {
    try {
      const mediaItem = await storage.updateMedia(parseInt(req.params.id as string), req.body);
      if (!mediaItem) return res.status(404).json({ message: "Media not found" });
      broadcast("media_changed");
      res.json(mediaItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to update media" });
    }
  });

  app.post("/api/admin/media/:id/restore", isAdminSession, async (req, res) => {
    try {
      await storage.restoreMedia(parseInt(req.params.id as string));
      broadcast("media_changed");
      res.json({ message: "تم الاستعادة" });
    } catch (error) {
      res.status(500).json({ message: "Failed to restore media" });
    }
  });

  app.delete("/api/admin/media/:id/permanent", isAdminSession, async (req, res) => {
    try {
      await storage.permanentDeleteMedia(parseInt(req.params.id as string));
      broadcast("media_changed");
      res.json({ message: "تم الحذف النهائي" });
    } catch (error) {
      res.status(500).json({ message: "Failed to permanently delete media" });
    }
  });

  app.delete("/api/admin/media/:id", isAdminSession, async (req, res) => {
    try {
      await storage.softDeleteMedia(parseInt(req.params.id as string));
      broadcast("media_changed");
      res.json({ message: "تم النقل إلى سلة المحذوفات" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete media" });
    }
  });

  // Pages Admin
  app.get("/api/admin/pages", isAdminSession, async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const pages = status ? await storage.getPagesByStatus(status) : await storage.getAllPages();
      res.json(pages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pages" });
    }
  });

  app.post("/api/admin/pages", isAdminSession, async (req, res) => {
    try {
      const parsed = insertPageSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid page data", errors: parsed.error.errors });
      const page = await storage.createPage(parsed.data);
      broadcast("pages_changed");
      res.status(201).json(page);
    } catch (error) {
      res.status(500).json({ message: "Failed to create page" });
    }
  });

  app.get("/api/admin/pages/:id", isAdminSession, async (req, res) => {
    try {
      const page = await storage.getPage(parseInt(req.params.id as string));
      if (!page) return res.status(404).json({ message: "Page not found" });
      res.json(page);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch page" });
    }
  });

  app.put("/api/admin/pages/:id", isAdminSession, async (req, res) => {
    try {
      const page = await storage.updatePage(parseInt(req.params.id as string), req.body);
      if (!page) return res.status(404).json({ message: "Page not found" });
      broadcast("pages_changed");
      res.json(page);
    } catch (error) {
      res.status(500).json({ message: "Failed to update page" });
    }
  });

  app.delete("/api/admin/pages/:id", isAdminSession, async (req, res) => {
    try {
      await storage.deletePage(parseInt(req.params.id as string));
      broadcast("pages_changed");
      res.json({ message: "Page deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete page" });
    }
  });

  // Public pages list
  app.get("/api/pages", async (req, res) => {
    try {
      const allPages = await storage.getPages();
      res.json(allPages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pages" });
    }
  });

  // Public page by slug
  app.get("/api/pages/:slug", async (req, res) => {
    try {
      const page = await storage.getPageBySlug(req.params.slug);
      if (!page || page.status !== "published") return res.status(404).json({ message: "Page not found" });
      res.json(page);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch page" });
    }
  });

  // ============ COMMUNITY PUBLIC API ROUTES ============
  
  app.get("/api/community/categories", async (req, res) => {
    try {
      res.json(await communityStorage.getCommunityCategories());
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch community categories" });
    }
  });

  const enrichMemberWithRankAndMod = async (member: any) => {
    if (!member) return member;
    const rank = await communityStorage.resolveRankForMember(member);
    let moderatorCategory: { id: number | null; name: string | null } | null = null;
    if (member.role === "moderator" || member.role === "admin") {
      const mods = await communityStorage.getModeratorsByMemberId(member.id);
      if (mods.length > 0) {
        const mod = mods[0];
        if (mod.categoryId) {
          const cat = await communityStorage.getCommunityCategory(mod.categoryId);
          moderatorCategory = cat ? { id: cat.id, name: cat.name } : null;
        } else {
          moderatorCategory = { id: null, name: "جميع الأقسام" };
        }
      } else if (member.role === "admin") {
        moderatorCategory = { id: null, name: "جميع الأقسام" };
      }
    }
    return { ...member, rank, moderatorCategory };
  };

  app.get("/api/community/posts", async (req, res) => {
    try {
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
      const posts = await communityStorage.getPosts(categoryId);
      const postsWithMembers = await Promise.all(posts.map(async (post) => {
        const member = await communityStorage.getMember(post.memberId);
        const category = await communityStorage.getCommunityCategory(post.categoryId);
        return { ...post, member: await enrichMemberWithRankAndMod(member), category };
      }));
      res.json(postsWithMembers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.get("/api/community/posts/:id", async (req, res) => {
    try {
      const post = await communityStorage.getPost(parseInt(req.params.id as string));
      if (!post) return res.status(404).json({ message: "Post not found" });
      await communityStorage.incrementPostViews(post.id);
      const member = await communityStorage.getMember(post.memberId);
      const category = await communityStorage.getCommunityCategory(post.categoryId);
      res.json({ ...post, member: await enrichMemberWithRankAndMod(member), category });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch post" });
    }
  });

  app.get("/api/community/posts/:id/comments", async (req, res) => {
    try {
      const comments = await communityStorage.getComments(parseInt(req.params.id as string));
      const commentsWithMembers = await Promise.all(comments.map(async (comment) => {
        const member = await communityStorage.getMember(comment.memberId);
        return { ...comment, member };
      }));
      res.json(commentsWithMembers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.get("/api/community/stats", async (req, res) => {
    try {
      res.json(await communityStorage.getCommunityStats());
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get("/api/community/member/:id", async (req, res) => {
    try {
      const member = await communityStorage.getMember(parseInt(req.params.id as string));
      if (!member) return res.status(404).json({ message: "Member not found" });
      res.json(member);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch member" });
    }
  });

  // Community member session check (also supports Replit Auth and token auth)
  app.get("/api/community/me", async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    try {
      const memberId = await getCurrentMemberId(req);
      if (!memberId) {
        return res.json({ authenticated: false });
      }
      const member = await communityStorage.getMember(memberId);
      if (!member) {
        return res.json({ authenticated: false });
      }
      communityStorage.updateMember(memberId, { lastActive: new Date() } as any).catch(() => {});

      // If client has no token (e.g. PWA/iOS cookie-less env), generate one and return it
      const incomingToken = req.headers["x-community-token"];
      let persistentToken: string | undefined;
      if (!incomingToken) {
        // Reuse existing valid token if one exists for this member
        const [existing] = await db
          .select()
          .from(communityTokensTable)
          .where(and(eq(communityTokensTable.memberId, memberId), gt(communityTokensTable.expiresAt, new Date())))
          .orderBy(desc(communityTokensTable.expiresAt))
          .limit(1);
        if (existing) {
          persistentToken = existing.token;
        } else {
          persistentToken = crypto.randomBytes(32).toString("hex");
          const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
          await db.insert(communityTokensTable).values({ token: persistentToken, memberId, expiresAt });
        }
      }

      res.json({ authenticated: true, member, ...(persistentToken ? { token: persistentToken } : {}) });
    } catch (error) {
      res.json({ authenticated: false });
    }
  });

  // Community Registration & Login
  // Check username availability
  app.get("/api/community/check-username/:username", async (req, res) => {
    try {
      const { username } = req.params;
      const usernameRegex = /^[a-zA-Z0-9]{5,12}$/;
      if (!usernameRegex.test(username)) {
        return res.json({ available: false, reason: "invalid" });
      }
      const existing = await communityStorage.getMemberByUsername(username);
      res.json({ available: !existing });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/community/register", loginLimiter, async (req, res) => {
    try {
      const { username, displayName, email, phone, password, provider, website } = req.body;
      
      // Honeypot check
      if (website) {
        console.log("Registration blocked by honeypot");
        return res.status(400).json({ message: "فشل في إنشاء الحساب" });
      }

      if (!username || !displayName || !email || !phone) {
        return res.status(400).json({ message: "جميع الحقول مطلوبة بما فيها رقم الجوال" });
      }

      const phoneRegex = /^05[0-9]{8}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({ message: "رقم الجوال يجب أن يبدأ بـ 05 ويكون 10 أرقام" });
      }

      // Validate username format: 5-12 alphanumeric only
      const usernameRegex = /^[a-zA-Z0-9]{5,12}$/;
      if (!usernameRegex.test(username)) {
        return res.status(400).json({ message: "اسم المستخدم يجب أن يكون بين 5 و12 حرفاً ويحتوي على أحرف إنجليزية وأرقام فقط" });
      }
      
      // Check if username exists
      const existingUsername = await communityStorage.getMemberByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ message: "اسم المستخدم موجود بالفعل" });
      }

      // Check if email exists
      const existingEmail = await communityStorage.getMemberByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "البريد الإلكتروني مستخدم بالفعل" });
      }
      
      // Create unique user ID
      const userId = `${provider || 'email'}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const member = await communityStorage.createMember({
        userId,
        username,
        displayName,
        email,
        phone: phone || null,
        password: password ? await bcrypt.hash(password, 10) : null,
        provider: provider || "email"
      });
      
      (req.session as any).communityMemberId = member.id;
      const regToken = generateCommunityToken();
      const regExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await db.insert(communityTokensTable).values({ token: regToken, memberId: member.id, expiresAt: regExpiresAt });
      req.session.save((err) => {
        if (err) console.error("Session save error:", err);
        res.status(201).json({ success: true, member, token: regToken });
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "فشل في إنشاء الحساب" });
    }
  });

  app.post("/api/community/login", loginLimiter, async (req, res) => {
    try {
      const { emailOrUsername, password } = req.body;
      
      if (!emailOrUsername || !password) {
        return res.status(400).json({ message: "البريد الإلكتروني أو اسم المستخدم وكلمة المرور مطلوبان" });
      }
      
      // Find member by email or username
      const isEmail = emailOrUsername.includes("@");
      const member = isEmail
        ? await communityStorage.getMemberByEmail(emailOrUsername)
        : await communityStorage.getMemberByUsername(emailOrUsername);
      
      if (!member) {
        return res.status(401).json({ message: "البيانات غير صحيحة. تأكد من البريد الإلكتروني أو اسم المستخدم وكلمة المرور" });
      }
      
      // Check password — support bcrypt hashes and migrate plaintext on-the-fly
      if (!member.password) {
        return res.status(401).json({ message: "البيانات غير صحيحة. تأكد من البريد الإلكتروني أو اسم المستخدم وكلمة المرور" });
      }
      const isBcryptHash = member.password.startsWith("$2");
      const passwordMatch = isBcryptHash
        ? await bcrypt.compare(password, member.password)
        : member.password === password;
      if (!passwordMatch) {
        return res.status(401).json({ message: "البيانات غير صحيحة. تأكد من البريد الإلكتروني أو اسم المستخدم وكلمة المرور" });
      }
      // Migrate plaintext password to bcrypt hash transparently
      if (!isBcryptHash) {
        const hashed = await bcrypt.hash(password, 10);
        await communityStorage.updateMember(member.id, { password: hashed });
      }
      
      if (member.isBanned) {
        return res.status(403).json({ message: "هذا الحساب محظور" });
      }

      const loginToken = generateCommunityToken();
      // 30-day persistent token stored in DB
      const TOKEN_DAYS = 30;
      const expiresAt = new Date(Date.now() + TOKEN_DAYS * 24 * 60 * 60 * 1000);
      await db.insert(communityTokensTable).values({ token: loginToken, memberId: member.id, expiresAt });

      (req.session as any).communityMemberId = member.id;
      req.session.save((err) => {
        if (err) console.error("Session save error:", err);
        res.json({ success: true, member, token: loginToken });
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "فشل في تسجيل الدخول" });
    }
  });

  app.post("/api/community/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || !email.includes("@")) return res.status(400).json({ message: "يرجى إدخال بريد إلكتروني صحيح" });
      const member = await communityStorage.getMemberByEmail(email.trim().toLowerCase());
      if (member) {
        const token = crypto.randomBytes(32).toString("hex");
        passwordResetTokens.set(token, { email: member.email!, memberId: member.id, expiresAt: Date.now() + 3600_000 });
        const host = req.get("host") || "localhost:5000";
        const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
        const resetUrl = `${protocol}://${host}/community/reset-password?token=${token}`;
        await sendPasswordResetEmail({ email: member.email!, resetUrl, displayName: member.displayName });
      }
      return res.json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ message: "حدث خطأ، حاول مرة أخرى" });
    }
  });

  app.post("/api/community/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      if (!token || !password || password.length < 6) return res.status(400).json({ message: "البيانات غير مكتملة أو كلمة المرور قصيرة جداً" });
      const entry = passwordResetTokens.get(token);
      if (!entry || entry.expiresAt < Date.now()) return res.status(400).json({ message: "رابط الاستعادة منتهي الصلاحية أو غير صحيح" });
      await communityStorage.updateMember(entry.memberId, { password });
      passwordResetTokens.delete(token);
      return res.json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ message: "حدث خطأ، حاول مرة أخرى" });
    }
  });

  app.post("/api/community/logout", async (req, res) => {
    const tokenHeader = req.headers["x-community-token"];
    const token = typeof tokenHeader === "string" ? tokenHeader.trim() : null;
    if (token) {
      await db.delete(communityTokensTable).where(eq(communityTokensTable.token, token));
    }
    (req.session as any).communityMemberId = undefined;
    res.json({ success: true });
  });

  // Community member-only routes (requires community login — supports token and session)
  const isCommunityMember: RequestHandler = async (req, res, next) => {
    const memberId = await getCurrentMemberId(req);
    if (!memberId) {
      return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
    }
    const member = await communityStorage.getMember(memberId);
    if (!member || member.isBanned) {
      return res.status(403).json({ message: "الحساب غير موجود أو محظور" });
    }
    (req as any).communityMember = member;
    next();
  };

  app.post("/api/community/posts", isCommunityMember, async (req, res) => {
    try {
      const member = (req as any).communityMember;
      const parsed = insertCommunityPostSchema.safeParse({ ...req.body, memberId: member.id });
      if (!parsed.success) return res.status(400).json({ message: "بيانات غير صالحة", errors: parsed.error.errors });
      const post = await communityStorage.createPost(parsed.data);
      broadcast("community_posts_changed");
      // Notify the member of their own new post (activity log)
      communityStorage.createDirectNotification({
        memberId: member.id, actorId: member.id, type: "new_post",
        postId: post.id, message: `نشرت موضوعاً جديداً: "${post.title}"`,
        link: `/community/post/${post.id}`,
      }).catch(() => {});
      res.status(201).json(post);
    } catch (error) {
      res.status(500).json({ message: "فشل في إنشاء الموضوع" });
    }
  });

  // Edit post — owner only, within 3 hours
  app.put("/api/community/posts/:id", isCommunityMember, async (req, res) => {
    try {
      const member = (req as any).communityMember;
      const postId = parseInt(req.params.id as string);
      const post = await communityStorage.getPost(postId);
      if (!post) return res.status(404).json({ message: "الموضوع غير موجود" });
      if (post.memberId !== member.id) return res.status(403).json({ message: "لا يمكنك تعديل موضوع شخص آخر" });
      const diffHours = (Date.now() - new Date(post.createdAt!).getTime()) / 3600000;
      if (diffHours > 3) return res.status(403).json({ message: "انتهت مهلة التعديل (3 ساعات من وقت النشر)" });
      const { title, content, categoryId } = req.body;
      if (!title || !content || !categoryId) return res.status(400).json({ message: "بيانات غير مكتملة" });
      const updated = await communityStorage.updatePost(postId, { title, content, categoryId: parseInt(categoryId) });
      broadcast("community_posts_changed");
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "فشل في تعديل الموضوع" });
    }
  });

  // Delete post — owner only, within 3 hours
  app.delete("/api/community/posts/:id", isCommunityMember, async (req, res) => {
    try {
      const member = (req as any).communityMember;
      const postId = parseInt(req.params.id as string);
      const post = await communityStorage.getPost(postId);
      if (!post) return res.status(404).json({ message: "الموضوع غير موجود" });
      if (post.memberId !== member.id) return res.status(403).json({ message: "لا يمكنك حذف موضوع شخص آخر" });
      const diffHours = (Date.now() - new Date(post.createdAt!).getTime()) / 3600000;
      if (diffHours > 3) return res.status(403).json({ message: "انتهت مهلة الحذف (3 ساعات من وقت النشر)" });
      await communityStorage.deletePost(postId);
      broadcast("community_posts_changed");
      res.json({ message: "تم حذف الموضوع بنجاح" });
    } catch (error) {
      res.status(500).json({ message: "فشل في حذف الموضوع" });
    }
  });

  // Moderator: toggle pin — only in assigned category (admins allowed everywhere)
  app.post("/api/community/posts/:id/pin", isCommunityMember, async (req, res) => {
    try {
      const member = (req as any).communityMember;
      const postId = parseInt(req.params.id as string);
      const post = await communityStorage.getPost(postId);
      if (!post) return res.status(404).json({ message: "الموضوع غير موجود" });
      const mod = await communityStorage.getModeratorForCategory(member.id, post.categoryId);
      if (!mod && member.role !== "admin") return res.status(403).json({ message: "ليس لديك صلاحية تثبيت المواضيع في هذا القسم" });
      const updated = await communityStorage.updatePost(postId, { isPinned: !post.isPinned });
      broadcast("community_posts_changed");
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "فشل في تثبيت الموضوع" });
    }
  });

  // Moderator: toggle lock — only in assigned category (admins allowed everywhere)
  app.post("/api/community/posts/:id/lock", isCommunityMember, async (req, res) => {
    try {
      const member = (req as any).communityMember;
      const postId = parseInt(req.params.id as string);
      const post = await communityStorage.getPost(postId);
      if (!post) return res.status(404).json({ message: "الموضوع غير موجود" });
      const mod = await communityStorage.getModeratorForCategory(member.id, post.categoryId);
      if (!mod && member.role !== "admin") return res.status(403).json({ message: "ليس لديك صلاحية إغلاق المواضيع في هذا القسم" });
      const updated = await communityStorage.updatePost(postId, { isLocked: !post.isLocked });
      broadcast("community_posts_changed");
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "فشل في إغلاق الموضوع" });
    }
  });

  // Moderator: toggle feature — only in assigned category (admins allowed everywhere)
  app.post("/api/community/posts/:id/feature", isCommunityMember, async (req, res) => {
    try {
      const member = (req as any).communityMember;
      const postId = parseInt(req.params.id as string);
      const post = await communityStorage.getPost(postId);
      if (!post) return res.status(404).json({ message: "الموضوع غير موجود" });
      const mod = await communityStorage.getModeratorForCategory(member.id, post.categoryId);
      if (!mod && member.role !== "admin") return res.status(403).json({ message: "ليس لديك صلاحية تمييز المواضيع في هذا القسم" });
      const updated = await communityStorage.updatePost(postId, { isFeatured: !post.isFeatured });
      broadcast("community_posts_changed");
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "فشل في تمييز الموضوع" });
    }
  });

  // Moderator: delete post in assigned category (admins allowed everywhere)
  app.delete("/api/community/moderator/posts/:id", isCommunityMember, async (req, res) => {
    try {
      const member = (req as any).communityMember;
      const postId = parseInt(req.params.id as string);
      const post = await communityStorage.getPost(postId);
      if (!post) return res.status(404).json({ message: "الموضوع غير موجود" });
      const mod = await communityStorage.getModeratorForCategory(member.id, post.categoryId);
      if (!mod && member.role !== "admin") return res.status(403).json({ message: "ليس لديك صلاحية حذف مواضيع هذا القسم" });
      await communityStorage.deletePost(postId);
      broadcast("community_posts_changed");
      res.json({ message: "تم حذف الموضوع بنجاح" });
    } catch (error) {
      res.status(500).json({ message: "فشل في حذف الموضوع" });
    }
  });

  // Public: get member ranks
  app.get("/api/community/ranks", async (req, res) => {
    try {
      res.json(await communityStorage.getRanks());
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch ranks" });
    }
  });

  app.post("/api/community/posts/:id/comments", isCommunityMember, async (req, res) => {
    try {
      const member = (req as any).communityMember;
      const postId = parseInt(req.params.id as string);
      
      // Check if post is locked
      const post = await communityStorage.getPost(postId);
      if (!post) return res.status(404).json({ message: "الموضوع غير موجود" });
      if (post.isLocked) {
        return res.status(403).json({ message: "هذا الموضوع مغلق، لا يمكن إضافة تعليقات جديدة" });
      }

      const parsed = insertCommunityCommentSchema.safeParse({ ...req.body, memberId: member.id, postId });
      if (!parsed.success) return res.status(400).json({ message: "بيانات غير صالحة", errors: parsed.error.errors });
      const comment = await communityStorage.createComment(parsed.data);
      
      // Create notification for post owner
      if (post && post.memberId !== member.id) {
        await communityStorage.createNotification({
          memberId: post.memberId,
          actorId: member.id,
          type: "reply_post",
          postId,
          commentId: comment.id,
          message: `علق ${member.displayName} على موضوعك: ${post.title}`
        });
      }
      
      // If replying to a parent comment, notify the parent comment owner
      if (parsed.data.parentId) {
        const parentComment = await communityStorage.getComment(parsed.data.parentId);
        if (parentComment && parentComment.memberId !== member.id) {
          await communityStorage.createNotification({
            memberId: parentComment.memberId,
            actorId: member.id,
            type: "reply_comment",
            postId,
            commentId: comment.id,
            message: `رد ${member.displayName} على تعليقك`
          });
        }
      }
      
      broadcast("community_comments_changed");
      res.status(201).json(comment);
    } catch (error) {
      res.status(500).json({ message: "فشل في إضافة التعليق" });
    }
  });

  app.post("/api/community/posts/:id/like", isCommunityMember, async (req, res) => {
    try {
      const member = (req as any).communityMember;
      const postId = parseInt(req.params.id as string);
      const result = await communityStorage.toggleLike(member.id, postId);
      
      // Create notification for post owner when liked (not unliked)
      if (result.liked) {
        const post = await communityStorage.getPost(postId);
        if (post && post.memberId !== member.id) {
          await communityStorage.createNotification({
            memberId: post.memberId,
            actorId: member.id,
            type: "like_post",
            postId,
            message: `أعجب ${member.displayName} بموضوعك: ${post.title}`
          });
        }
      }
      broadcast("community_posts_changed");
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "فشل في تحديث الإعجاب" });
    }
  });

  app.post("/api/community/comments/:id/like", isCommunityMember, async (req, res) => {
    try {
      const member = (req as any).communityMember;
      const commentId = parseInt(req.params.id as string);
      const result = await communityStorage.toggleLike(member.id, undefined, commentId);
      
      // Create notification for comment owner when liked
      if (result.liked) {
        const comment = await communityStorage.getComment(commentId);
        if (comment && comment.memberId !== member.id) {
          await communityStorage.createNotification({
            memberId: comment.memberId,
            actorId: member.id,
            type: "like_comment",
            postId: comment.postId,
            commentId,
            message: `أعجب ${member.displayName} بتعليقك`
          });
        }
      }
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "فشل في تحديث الإعجاب" });
    }
  });

  app.post("/api/community/report", isCommunityMember, async (req, res) => {
    try {
      const member = (req as any).communityMember;
      const parsed = insertCommunityReportSchema.safeParse({ ...req.body, reporterId: member.id });
      if (!parsed.success) return res.status(400).json({ message: "بيانات غير صالحة", errors: parsed.error.errors });
      const report = await communityStorage.createReport(parsed.data);
      res.status(201).json(report);
    } catch (error) {
      res.status(500).json({ message: "فشل في إرسال البلاغ" });
    }
  });

  // Profile update endpoint
  app.put("/api/community/profile", isCommunityMember, async (req, res) => {
    try {
      const member = (req as any).communityMember;
      const { displayName, bio, avatar, phone } = req.body;
      
      if (displayName !== undefined && (!displayName || displayName.trim().length === 0)) {
        return res.status(400).json({ message: "الاسم المعروض مطلوب" });
      }
      
      const updateData: any = {
        displayName: displayName !== undefined ? displayName.trim() : member.displayName,
        bio: bio !== undefined ? bio : member.bio,
        avatar: avatar !== undefined ? avatar : member.avatar,
        phone: phone !== undefined ? phone.trim() || null : member.phone,
      };

      const updated = await communityStorage.updateMember(member.id, updateData);
      
      if (!updated) return res.status(404).json({ message: "العضو غير موجود" });
      
      const { password: _, ...memberWithoutPassword } = updated as any;
      res.json({ success: true, member: memberWithoutPassword });
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ message: "فشل في تحديث الملف الشخصي" });
    }
  });

  // Change password endpoint
  app.put("/api/community/change-password", isCommunityMember, async (req, res) => {
    try {
      const member = (req as any).communityMember;
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "يرجى إدخال كلمة المرور الحالية والجديدة" });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });
      }
      
      // Get member with password
      const fullMember = await communityStorage.getMember(member.id);
      if (!fullMember) return res.status(404).json({ message: "العضو غير موجود" });
      
      // Check current password
      if (fullMember.password !== currentPassword) {
        return res.status(400).json({ message: "كلمة المرور الحالية غير صحيحة" });
      }
      
      // Update password
      await communityStorage.updateMember(member.id, { password: newPassword });
      
      res.json({ success: true, message: "تم تغيير كلمة المرور بنجاح" });
    } catch (error) {
      res.status(500).json({ message: "فشل في تغيير كلمة المرور" });
    }
  });

  // Member posts
  app.get("/api/community/my-posts", isCommunityMember, async (req, res) => {
    try {
      const member = (req as any).communityMember;
      const posts = await communityStorage.getMemberPosts(member.id);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "فشل في جلب المواضيع" });
    }
  });

  // Member comments
  app.get("/api/community/my-comments", isCommunityMember, async (req, res) => {
    try {
      const member = (req as any).communityMember;
      const comments = await communityStorage.getMemberComments(member.id);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "فشل في جلب التعليقات" });
    }
  });

  // Notifications
  app.get("/api/community/notifications", isCommunityMember, async (req, res) => {
    try {
      const member = (req as any).communityMember;
      const notifications = await communityStorage.getNotifications(member.id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "فشل في جلب التنبيهات" });
    }
  });

  app.get("/api/community/notifications/unread-count", isCommunityMember, async (req, res) => {
    try {
      const member = (req as any).communityMember;
      const count = await communityStorage.getUnreadNotificationsCount(member.id);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "فشل في جلب عدد التنبيهات" });
    }
  });

  app.put("/api/community/notifications/:id/read", isCommunityMember, async (req, res) => {
    try {
      await communityStorage.markNotificationAsRead(parseInt(req.params.id as string));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "فشل في تحديث التنبيه" });
    }
  });

  app.put("/api/community/notifications/announcements/read-all", isCommunityMember, async (req, res) => {
    try {
      const member = (req as any).communityMember;
      await db.update(communityNotifications)
        .set({ isRead: true })
        .where(and(
          eq(communityNotifications.memberId, member.id),
          eq(communityNotifications.type, "announcement"),
          eq(communityNotifications.isRead, false)
        ));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "فشل في تحديث التنبيه" });
    }
  });

  app.get("/api/community/notifications/announcements/unread-count", isCommunityMember, async (req, res) => {
    try {
      const member = (req as any).communityMember;
      const result = await db.select({ count: sql<number>`count(*)::int` })
        .from(communityNotifications)
        .where(and(
          eq(communityNotifications.memberId, member.id),
          eq(communityNotifications.type, "announcement"),
          eq(communityNotifications.isRead, false)
        ));
      res.json({ count: result[0]?.count || 0 });
    } catch (error) {
      res.status(500).json({ message: "فشل في جلب عدد الإعلانات" });
    }
  });

  app.put("/api/community/notifications/read-all", isCommunityMember, async (req, res) => {
    try {
      const member = (req as any).communityMember;
      await communityStorage.markAllNotificationsAsRead(member.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "فشل في تحديث التنبيهات" });
    }
  });

  app.delete("/api/community/notifications", isCommunityMember, async (req, res) => {
    try {
      const member = (req as any).communityMember;
      await communityStorage.deleteAllNotifications(member.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "فشل في حذف الإشعارات" });
    }
  });

  app.delete("/api/community/notifications/:id", isCommunityMember, async (req, res) => {
    try {
      const member = (req as any).communityMember;
      await communityStorage.deleteNotification(parseInt(req.params.id as string), member.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "فشل في حذف الإشعار" });
    }
  });

  // Job Alert Preferences
  app.get("/api/community/job-alert-preferences", isCommunityMember, async (req, res) => {
    try {
      const member = (req as any).communityMember;
      const [prefs] = await db.select()
        .from(jobAlertPreferences)
        .where(eq(jobAlertPreferences.memberId, member.id))
        .limit(1);
      res.json(prefs || { categories: [], isEnabled: true });
    } catch (error) {
      res.status(500).json({ message: "فشل في جلب تفضيلات التنبيهات" });
    }
  });

  app.put("/api/community/job-alert-preferences", isCommunityMember, async (req, res) => {
    try {
      const member = (req as any).communityMember;
      const { categories, isEnabled } = req.body;
      const validCategories = ["civil", "military", "companies", "employer"];
      const cleanCategories = Array.isArray(categories)
        ? categories.filter((c: string) => validCategories.includes(c))
        : [];
      const [existing] = await db.select({ id: jobAlertPreferences.id })
        .from(jobAlertPreferences)
        .where(eq(jobAlertPreferences.memberId, member.id))
        .limit(1);
      if (existing) {
        const [updated] = await db.update(jobAlertPreferences)
          .set({
            categories: cleanCategories,
            isEnabled: isEnabled !== false,
            updatedAt: new Date(),
          })
          .where(eq(jobAlertPreferences.memberId, member.id))
          .returning();
        res.json(updated);
      } else {
        const [created] = await db.insert(jobAlertPreferences)
          .values({
            memberId: member.id,
            categories: cleanCategories,
            isEnabled: isEnabled !== false,
          })
          .returning();
        res.json(created);
      }
    } catch (error) {
      res.status(500).json({ message: "فشل في حفظ تفضيلات التنبيهات" });
    }
  });

  // Push Token Registration
  app.post("/api/community/push-token", isCommunityMember, async (req, res) => {
    try {
      const member = (req as any).communityMember;
      const { token, platform } = req.body;
      if (!token || typeof token !== "string") {
        return res.status(400).json({ message: "رمز الإشعارات مطلوب" });
      }
      if (!Expo.isExpoPushToken(token)) {
        return res.status(400).json({ message: "رمز الإشعارات غير صالح" });
      }
      const [existing] = await db.select({ id: memberPushTokens.id })
        .from(memberPushTokens)
        .where(eq(memberPushTokens.token, token))
        .limit(1);
      if (existing) {
        await db.update(memberPushTokens)
          .set({ memberId: member.id, platform: platform || null, updatedAt: new Date() })
          .where(eq(memberPushTokens.token, token));
      } else {
        await db.insert(memberPushTokens).values({
          memberId: member.id,
          token,
          platform: platform || null,
        });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "فشل في تسجيل رمز الإشعارات" });
    }
  });

  app.delete("/api/community/push-token", isCommunityMember, async (req, res) => {
    try {
      const member = (req as any).communityMember;
      const { token } = req.body;
      if (token) {
        await db.delete(memberPushTokens)
          .where(and(eq(memberPushTokens.memberId, member.id), eq(memberPushTokens.token, token)));
      } else {
        await db.delete(memberPushTokens).where(eq(memberPushTokens.memberId, member.id));
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "فشل في حذف رمز الإشعارات" });
    }
  });

  // Job Favorites
  app.get("/api/community/favorites", isCommunityMember, async (req, res) => {
    try {
      const member = (req as any).communityMember;
      const favorites = await communityStorage.getFavoriteJobs(member.id);
      res.json(favorites);
    } catch (error) {
      res.status(500).json({ message: "فشل في جلب الوظائف المفضلة" });
    }
  });

  app.get("/api/community/favorites/ids", isCommunityMember, async (req, res) => {
    try {
      const member = (req as any).communityMember;
      const ids = await communityStorage.getMemberFavoriteJobIds(member.id);
      res.json(ids);
    } catch (error) {
      res.status(500).json({ message: "فشل في جلب الوظائف المفضلة" });
    }
  });

  app.post("/api/community/favorites/:jobId", isCommunityMember, async (req, res) => {
    try {
      const member = (req as any).communityMember;
      const jobId = parseInt(req.params.jobId as string);
      const result = await communityStorage.toggleJobFavorite(member.id, jobId);
      // Notify member when they save a job (not when they remove it)
      if (result.favorited) {
        const job = await storage.getJob(jobId);
        if (job) {
          communityStorage.createDirectNotification({
            memberId: member.id, actorId: member.id, type: "job_saved",
            message: `أضفت وظيفة "${job.title}" إلى مفضلتك`,
            link: "/dashboard/favorites",
          }).catch(() => {});
        }
      }
      broadcast("favorites_changed");
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "فشل في تحديث المفضلة" });
    }
  });

  app.delete("/api/community/favorites/:jobId", isCommunityMember, async (req, res) => {
    try {
      const member = (req as any).communityMember;
      await communityStorage.removeJobFavorite(member.id, parseInt(req.params.jobId as string));
      broadcast("favorites_changed");
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "فشل في إزالة المفضلة" });
    }
  });

  app.get("/api/community/my-orders", isCommunityMember, async (req, res) => {
    try {
      const member = (req as any).communityMember;
      const orders = await storage.getServiceOrdersByMemberId(member.id);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "فشل في جلب الطلبات" });
    }
  });

  // ─── Job Alert Points ──────────────────────────────────────────────────────

  app.get("/api/community/job-alert-points", isCommunityMember, async (req, res) => {
    try {
      const member = (req as any).communityMember;
      const { freePoints, paidPoints } = await storage.getJobAlertPoints(member.id);
      res.json({ freePoints, paidPoints, points: freePoints + paidPoints });
    } catch {
      res.status(500).json({ message: "فشل في جلب الرصيد" });
    }
  });

  // ─── Job Application Credits ───────────────────────────────────────────────

  app.get("/api/community/job-credits", isCommunityMember, async (req, res) => {
    try {
      const member = (req as any).communityMember;
      const credits = await storage.getJobApplicationCredits(member.id);
      res.json({ balance: credits?.balance ?? 0, expiresAt: credits?.expiresAt ?? null });
    } catch {
      res.status(500).json({ message: "فشل في جلب الرصيد" });
    }
  });

  app.post("/api/community/job-apply", isCommunityMember, async (req, res) => {
    try {
      const member = (req as any).communityMember;
      const { jobId, jobTitle, jobCompany, jobApplyUrl } = req.body;
      if (!jobId || !jobTitle || !jobApplyUrl) {
        return res.status(400).json({ message: "بيانات الوظيفة ناقصة" });
      }
      const used = await storage.useJobApplicationCredit(member.id);
      if (!used) {
        return res.status(402).json({ message: "رصيدك غير كافٍ", needsCredits: true });
      }
      const requestNumber = "JOB-" + Date.now().toString(36).toUpperCase();
      const request = await storage.createJobApplicationRequest({
        memberId: member.id,
        jobId: parseInt(jobId),
        jobTitle,
        jobCompany: jobCompany || null,
        jobApplyUrl,
        requestNumber,
        status: "pending",
      });
      broadcast("orders_changed");
      communityStorage.createDirectNotification({
        memberId: member.id, actorId: member.id, type: "order_status_change",
        message: `تم استلام طلب التقديم على وظيفة "${jobTitle}" برقم ${requestNumber} — سيبدأ فريقنا التنفيذ قريباً`,
        link: "/dashboard/orders",
      }).catch(() => {});
      res.json(request);
    } catch (err) {
      res.status(500).json({ message: "فشل في إنشاء الطلب" });
    }
  });

  app.get("/api/community/my-job-applications", isCommunityMember, async (req, res) => {
    try {
      const member = (req as any).communityMember;
      const requests = await storage.getJobApplicationRequestsByMember(member.id);
      res.json(requests);
    } catch {
      res.status(500).json({ message: "فشل في جلب الطلبات" });
    }
  });

  // ============ COMMUNITY ADMIN API ROUTES ============
  
  app.get("/api/admin/community/members", isAdminSession, async (req, res) => {
    try {
      res.json(await communityStorage.getMembers());
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch members" });
    }
  });

  app.post("/api/admin/community/members", isAdminSession, async (req, res) => {
    try {
      const { displayName, username, email, phone } = req.body;
      if (!displayName || !username) {
        return res.status(400).json({ message: "الاسم واسم المستخدم مطلوبان" });
      }
      const existingByUsername = await communityStorage.getMemberByUsername(username);
      if (existingByUsername) {
        return res.status(400).json({ message: "اسم المستخدم مستخدم مسبقاً" });
      }
      if (email) {
        const existingByEmail = await communityStorage.getMemberByEmail(email);
        if (existingByEmail) {
          return res.status(400).json({ message: "البريد الإلكتروني مستخدم مسبقاً" });
        }
      }
      const userId = `admin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const member = await communityStorage.createMember({
        userId,
        username,
        displayName,
        email: email || null,
        phone: phone || null,
        provider: "admin-created",
      });
      broadcast("community_members_changed");
      res.status(201).json(member);
    } catch (error: any) {
      console.error("Admin create member error:", error);
      res.status(500).json({ message: error.message || "فشل في إنشاء الحساب" });
    }
  });

  app.put("/api/admin/community/members/:id", isAdminSession, async (req, res) => {
    try {
      const member = await communityStorage.updateMember(parseInt(req.params.id as string), req.body);
      if (!member) return res.status(404).json({ message: "Member not found" });
      broadcast("community_members_changed");
      res.json(member);
    } catch (error) {
      res.status(500).json({ message: "Failed to update member" });
    }
  });

  app.delete("/api/admin/community/members/:id", isAdminSession, async (req, res) => {
    try {
      await communityStorage.deleteMember(parseInt(req.params.id as string));
      broadcast("community_members_changed");
      res.json({ message: "Member deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete member" });
    }
  });

  app.get("/api/admin/community/categories", isAdminSession, async (req, res) => {
    try {
      res.json(await communityStorage.getAllCommunityCategories());
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/admin/community/categories", isAdminSession, async (req, res) => {
    try {
      const parsed = insertCommunityCategorySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      const commCat = await communityStorage.createCommunityCategory(parsed.data);
      broadcast("categories_changed");
      res.status(201).json(commCat);
    } catch (error) {
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.put("/api/admin/community/categories/:id", isAdminSession, async (req, res) => {
    try {
      const category = await communityStorage.updateCommunityCategory(parseInt(req.params.id as string), req.body);
      if (!category) return res.status(404).json({ message: "Category not found" });
      broadcast("categories_changed");
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete("/api/admin/community/categories/:id", isAdminSession, async (req, res) => {
    try {
      await communityStorage.deleteCommunityCategory(parseInt(req.params.id as string));
      broadcast("categories_changed");
      res.json({ message: "Category deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  app.get("/api/admin/community/posts", isAdminSession, async (req, res) => {
    try {
      const posts = await communityStorage.getAllPosts();
      const postsWithMembers = await Promise.all(posts.map(async (post) => {
        const member = await communityStorage.getMember(post.memberId);
        return { ...post, member };
      }));
      res.json(postsWithMembers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.put("/api/admin/community/posts/:id", isAdminSession, async (req, res) => {
    try {
      const post = await communityStorage.updatePost(parseInt(req.params.id as string), req.body);
      if (!post) return res.status(404).json({ message: "Post not found" });
      broadcast("community_posts_changed");
      res.json(post);
    } catch (error) {
      res.status(500).json({ message: "Failed to update post" });
    }
  });

  app.delete("/api/admin/community/posts/:id", isAdminSession, async (req, res) => {
    try {
      await communityStorage.deletePost(parseInt(req.params.id as string));
      broadcast("community_posts_changed");
      res.json({ message: "Post deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  app.get("/api/admin/community/comments", isAdminSession, async (req, res) => {
    try {
      const comments = await communityStorage.getAllComments();
      const commentsWithMembers = await Promise.all(comments.map(async (comment) => {
        const member = await communityStorage.getMember(comment.memberId);
        return { ...comment, member };
      }));
      res.json(commentsWithMembers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.delete("/api/admin/community/comments/:id", isAdminSession, async (req, res) => {
    try {
      await communityStorage.deleteComment(parseInt(req.params.id as string));
      broadcast("community_comments_changed");
      res.json({ message: "Comment deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  app.get("/api/admin/community/reports", isAdminSession, async (req, res) => {
    try {
      res.json(await communityStorage.getReports());
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  app.put("/api/admin/community/reports/:id", isAdminSession, async (req, res) => {
    try {
      const { status } = req.body;
      const report = await communityStorage.resolveReport(parseInt(req.params.id as string), 0, status);
      if (!report) return res.status(404).json({ message: "Report not found" });
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to update report" });
    }
  });

  // Moderator Requests - Member routes
  app.post("/api/community/moderator-requests", isCommunityMember, async (req, res) => {
    try {
      const member = (req as any).communityMember;
      const parsed = insertCommunityModeratorRequestSchema.safeParse({ ...req.body, memberId: member.id });
      if (!parsed.success) return res.status(400).json({ message: "بيانات غير صالحة", errors: parsed.error.errors });
      const request = await communityStorage.createModeratorRequest(parsed.data);
      res.status(201).json(request);
    } catch (error) {
      res.status(500).json({ message: "فشل في إرسال طلب الإشراف" });
    }
  });

  // Moderator Requests - Admin routes
  app.get("/api/admin/community/moderator-requests", isAdminSession, async (req, res) => {
    try {
      res.json(await communityStorage.getModeratorRequests());
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch moderator requests" });
    }
  });

  app.put("/api/admin/community/moderator-requests/:id", isAdminSession, async (req, res) => {
    try {
      const { status } = req.body;
      const request = await communityStorage.resolveModeratorRequest(parseInt(req.params.id as string), 0, status);
      if (!request) return res.status(404).json({ message: "Request not found" });
      res.json(request);
    } catch (error) {
      res.status(500).json({ message: "Failed to update moderator request" });
    }
  });

  app.get("/api/admin/community/stats", isAdminSession, async (req, res) => {
    try {
      res.json(await communityStorage.getCommunityStats());
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // PATCH routes for community admin
  app.patch("/api/admin/community/posts/:id", isAdminSession, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const updated = await communityStorage.updatePost(id, req.body);
      if (!updated) return res.status(404).json({ message: "Post not found" });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update post" });
    }
  });

  app.patch("/api/admin/community/categories/:id", isAdminSession, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const updated = await communityStorage.updateCommunityCategory(id, req.body);
      if (!updated) return res.status(404).json({ message: "Category not found" });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.patch("/api/admin/community/members/:id", isAdminSession, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const updated = await communityStorage.updateMember(id, req.body);
      if (!updated) return res.status(404).json({ message: "Member not found" });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update member" });
    }
  });

  // Member Ranks (admin CRUD)
  app.get("/api/admin/community/ranks", isAdminSession, async (req, res) => {
    try {
      res.json(await communityStorage.getRanks());
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch ranks" });
    }
  });

  app.post("/api/admin/community/ranks", isAdminSession, async (req, res) => {
    try {
      const rank = await communityStorage.createRank(req.body);
      res.json(rank);
    } catch (error) {
      res.status(500).json({ message: "Failed to create rank" });
    }
  });

  app.patch("/api/admin/community/ranks/:id", isAdminSession, async (req, res) => {
    try {
      const updated = await communityStorage.updateRank(parseInt(req.params.id as string), req.body);
      if (!updated) return res.status(404).json({ message: "Rank not found" });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update rank" });
    }
  });

  app.delete("/api/admin/community/ranks/:id", isAdminSession, async (req, res) => {
    try {
      await communityStorage.deleteRank(parseInt(req.params.id as string));
      res.json({ message: "Rank deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete rank" });
    }
  });

  // Moderators routes
  app.get("/api/admin/community/moderators", isAdminSession, async (req, res) => {
    try {
      res.json(await communityStorage.getModerators());
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch moderators" });
    }
  });

  app.post("/api/admin/community/moderators", isAdminSession, async (req, res) => {
    try {
      const moderator = await communityStorage.createModerator(req.body);
      res.json(moderator);
    } catch (error) {
      res.status(500).json({ message: "Failed to create moderator" });
    }
  });

  app.patch("/api/admin/community/moderators/:id", isAdminSession, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const updated = await communityStorage.updateModerator(id, req.body);
      if (!updated) return res.status(404).json({ message: "Moderator not found" });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update moderator" });
    }
  });

  app.delete("/api/admin/community/moderators/:id", isAdminSession, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      await communityStorage.deleteModerator(id);
      res.json({ message: "Moderator deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete moderator" });
    }
  });

  // Moderator Permissions routes
  app.get("/api/admin/community/moderator-permissions", isAdminSession, async (req, res) => {
    try {
      res.json(await communityStorage.getModeratorPermissions());
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch permissions" });
    }
  });

  app.post("/api/admin/community/moderator-permissions", isAdminSession, async (req, res) => {
    try {
      const permission = await communityStorage.createModeratorPermission(req.body);
      res.json(permission);
    } catch (error) {
      res.status(500).json({ message: "Failed to create permission" });
    }
  });

  app.patch("/api/admin/community/moderator-permissions/:id", isAdminSession, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const updated = await communityStorage.updateModeratorPermission(id, req.body);
      if (!updated) return res.status(404).json({ message: "Permission not found" });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update permission" });
    }
  });

  app.delete("/api/admin/community/moderator-permissions/:id", isAdminSession, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      await communityStorage.deleteModeratorPermission(id);
      res.json({ message: "Permission deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete permission" });
    }
  });

  // Admin cleanup route
  app.post("/api/admin/cleanup-trash", isAdminSession, async (req, res) => {
    try {
      const deletedCount = await storage.cleanupTrash();
      res.json({ message: `تم حذف ${deletedCount} عنصر من سلة المهملات`, deletedCount });
    } catch (error) {
      res.status(500).json({ message: "فشل في تنظيف سلة المهملات" });
    }
  });

  // Online visitors tracking endpoints
  app.post("/api/online/heartbeat", async (req, res) => {
    try {
      // Generate or use existing session ID from cookie
      let sessionId = req.cookies?.visitorSession;
      if (!sessionId) {
        sessionId = `v_${crypto.randomUUID()}`;
        res.cookie("visitorSession", sessionId, { 
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
          httpOnly: true,
          sameSite: "lax",
          secure: req.secure || req.get("x-forwarded-proto") === "https",
          path: "/"
        });
      }
      
      const rawPage = typeof req.body?.currentPage === "string" ? req.body.currentPage : "/";
      const currentPage = rawPage.startsWith("/") ? rawPage.slice(0, 500) : "/";
      await storage.updateOnlineVisitor(sessionId, currentPage);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update heartbeat" });
    }
  });

  app.get("/api/online/count", async (_req, res) => {
    try {
      // Consider visitors online if they were seen in the last 3 minutes
      const count = await storage.getOnlineVisitorCount(3);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "Failed to get online count" });
    }
  });

  // Cleanup old online visitors periodically (every 5 minutes)
  setInterval(async () => {
    try {
      await storage.cleanupOldOnlineVisitors(5);
    } catch (err) {
      console.error("Online visitors cleanup error:", err);
    }
  }, 5 * 60 * 1000);

  // ─── Daily credits expiry cron (runs every 24 hours) ────────────────────────
  const runCreditExpiryJobs = async () => {
    try {
      // 1. Expire job application credits
      const expiredJobCredits = await storage.getExpiredJobCredits();
      for (const record of expiredJobCredits) {
        await storage.zeroJobApplicationCredits(record.memberId);
        await communityStorage.createDirectNotification({
          memberId: record.memberId,
          actorId: 0,
          type: "system",
          message: "انتهت صلاحية رصيد طلبات التوظيف الخاص بك.",
          link: "/dashboard/job-credits",
        });
      }

      // 2. Expire CV analysis paid credits
      const expiredCvMembers = await db.select({
        id: communityMembers.id,
      }).from(communityMembers).where(
        and(
          sql`${communityMembers.cvAnalysisPaidCreditsExpiresAt} < now()`,
          sql`COALESCE(${communityMembers.cvAnalysisPaidCredits}, 0) > 0`
        )
      );
      for (const m of expiredCvMembers) {
        await communityStorage.updateMember(m.id, { cvAnalysisPaidCredits: 0 });
        await communityStorage.createDirectNotification({
          memberId: m.id,
          actorId: 0,
          type: "system",
          message: "انتهت صلاحية رصيد تحليل السيرة الذاتية المدفوع.",
          link: "/dashboard/ai-credits",
        });
      }

      // 3. "7 days left" warnings for job credits
      const expiringJobCredits = await storage.getJobCreditsExpiringIn(7);
      for (const record of expiringJobCredits) {
        const daysLeft = Math.ceil((new Date(record.expiresAt!).getTime() - Date.now()) / 86400000);
        const alreadyWarned = await db.select({ id: communityNotifications.id })
          .from(communityNotifications)
          .where(and(
            eq(communityNotifications.memberId, record.memberId),
            eq(communityNotifications.type, "system"),
            eq(communityNotifications.link, "/dashboard/job-credits"),
            sql`${communityNotifications.createdAt} > now() - interval '6 days'`
          ));
        if (!alreadyWarned.length) {
          await communityStorage.createDirectNotification({
            memberId: record.memberId,
            actorId: 0,
            type: "system",
            message: `تنبيه: رصيد طلبات التوظيف لديك ينتهي خلال ${daysLeft} ${daysLeft === 1 ? "يوم" : "أيام"}.`,
            link: "/dashboard/job-credits",
          });
        }
      }

      // 4. "7 days left" warnings for CV credits
      const expiringCvMembers = await db.select({
        id: communityMembers.id,
        cvAnalysisPaidCreditsExpiresAt: communityMembers.cvAnalysisPaidCreditsExpiresAt,
      }).from(communityMembers).where(
        and(
          sql`${communityMembers.cvAnalysisPaidCreditsExpiresAt} < now() + interval '7 days'`,
          sql`${communityMembers.cvAnalysisPaidCreditsExpiresAt} > now()`,
          sql`COALESCE(${communityMembers.cvAnalysisPaidCredits}, 0) > 0`
        )
      );
      for (const m of expiringCvMembers) {
        const daysLeft = Math.ceil((new Date(m.cvAnalysisPaidCreditsExpiresAt!).getTime() - Date.now()) / 86400000);
        const alreadyWarned = await db.select({ id: communityNotifications.id })
          .from(communityNotifications)
          .where(and(
            eq(communityNotifications.memberId, m.id),
            eq(communityNotifications.type, "system"),
            eq(communityNotifications.link, "/dashboard/ai-credits"),
            sql`${communityNotifications.createdAt} > now() - interval '6 days'`
          ));
        if (!alreadyWarned.length) {
          await communityStorage.createDirectNotification({
            memberId: m.id,
            actorId: 0,
            type: "system",
            message: `تنبيه: رصيد تحليل السيرة الذاتية المدفوع ينتهي خلال ${daysLeft} ${daysLeft === 1 ? "يوم" : "أيام"}.`,
            link: "/dashboard/ai-credits",
          });
        }
      }

      if (expiredJobCredits.length + expiredCvMembers.length > 0) {
        console.log(`Credits expiry cron: zeroed ${expiredJobCredits.length} job-credits, ${expiredCvMembers.length} CV-credits`);
      }
    } catch (err) {
      console.error("Credits expiry cron error:", err);
    }
  };

  // Run on startup then every 24 hours
  runCreditExpiryJobs();
  setInterval(runCreditExpiryJobs, 24 * 60 * 60 * 1000);

  // Run cleanup on startup (async, non-blocking)
  storage.cleanupTrash()
    .then(count => {
      if (count > 0) {
        console.log(`Cleanup: Deleted ${count} items older than 30 days from trash`);
      }
    })
    .catch(err => console.error("Trash cleanup error:", err));

  storage.cleanupMediaTrash()
    .then(count => { if (count > 0) console.log(`Cleanup: Deleted ${count} media items from trash`); })
    .catch(err => console.error("Media trash cleanup error:", err));

  setInterval(() => {
    storage.cleanupMediaTrash().catch(err => console.error("Media trash cleanup error:", err));
  }, 24 * 60 * 60 * 1000);

  // Seed default community categories if none exist
  seedCommunityCategories()
    .catch(err => console.error("Community categories seed error:", err));

  // Seed default community admin member if not exists
  seedCommunityAdmin()
    .catch(err => console.error("Community admin seed error:", err));

  // Seed default community member ranks if none exist
  seedCommunityRanks()
    .catch(err => console.error("Community ranks seed error:", err));

  // Seed default services if none exist
  seedServices()
    .catch(err => console.error("Services seed error:", err));

  // Ensure CV analysis credits service exists
  ensureCvAnalysisService()
    .catch(err => console.error("CV analysis service ensure error:", err));

  // Ensure job application credits service exists in store
  ensureJobCreditsService()
    .catch(err => console.error("Job credits service ensure error:", err));

  // Ensure job alert points service exists in store
  ensureJobAlertPointsService()
    .catch(err => console.error("Job alert points service ensure error:", err));

  // Service Orders API
  app.post("/api/service-orders", isCommunityMember, async (req, res) => {
    try {
      const member = (req as any).communityMember;
      const orderNumber = await storage.getNextOrderNumber();
      
      const orderData = {
        ...req.body,
        memberId: member.id,
        orderNumber,
        paymentMethod: "bank_transfer",
        status: "pending"
      };

      const validatedData = insertServiceOrderSchema.parse(orderData);
      const order = await storage.createServiceOrder(validatedData);
      broadcast("orders_changed");
      // Notify member of their new order (activity log)
      communityStorage.createDirectNotification({
        memberId: member.id, actorId: member.id, type: "new_order",
        message: `تم استلام طلبك "${order.serviceName}" برقم ${order.orderNumber} — سيتم التواصل معك قريباً`,
        link: "/dashboard/orders",
      }).catch(() => {});
      res.status(201).json(order);
    } catch (error: any) {
      console.error("Service order creation error:", error);
      res.status(400).json({ message: error.message || "Failed to create order" });
    }
  });

  app.get("/api/service-orders/:orderNumber", async (req, res) => {
    try {
      const order = await storage.getServiceOrderByNumber(req.params.orderNumber);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to get order" });
    }
  });

  // ===== Store Reports =====
  app.get("/api/admin/store/report", isAdminSession, async (req, res) => {
    try {
      const orders = await storage.getServiceOrders();
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

      const thisMonth = orders.filter(o => new Date(o.createdAt!) >= thisMonthStart);
      const lastMonth = orders.filter(o => {
        const d = new Date(o.createdAt!);
        return d >= lastMonthStart && d <= lastMonthEnd;
      });

      const calcStats = (list: any[]) => ({
        revenue: list.filter(o => o.status === "completed").reduce((s: number, o: any) => s + (o.amount || 0), 0),
        total: list.length,
        completed: list.filter(o => o.status === "completed").length,
        pending: list.filter(o => o.status === "pending").length,
        inProgress: list.filter(o => o.status === "in_progress").length,
        cancelled: list.filter(o => o.status === "cancelled").length,
      });

      const serviceCounts: Record<string, { count: number; revenue: number; name: string }> = {};
      orders.forEach((o: any) => {
        const key = o.serviceSlug || "unknown";
        if (!serviceCounts[key]) serviceCounts[key] = { count: 0, revenue: 0, name: o.serviceName || key };
        serviceCounts[key].count++;
        if (o.status === "completed") serviceCounts[key].revenue += o.amount || 0;
      });
      const topServices = Object.values(serviceCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const goalSetting = await storage.getSetting("MONTHLY_REVENUE_GOAL");
      const monthlyGoal = goalSetting?.value ? parseInt(goalSetting.value) || 0 : 0;

      res.json({
        thisMonth: calcStats(thisMonth),
        lastMonth: calcStats(lastMonth),
        allTime: calcStats(orders),
        topServices,
        monthlyGoal,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate report" });
    }
  });

  app.get("/api/admin/store/report/detailed", isAdminSession, async (req, res) => {
    try {
      const period = (req.query.period as string) || "month";
      const orders = await storage.getServiceOrders();
      const now = new Date();

      const calcStats = (list: any[]) => ({
        revenue: list.filter(o => o.status === "completed").reduce((s: number, o: any) => s + (o.amount || 0), 0),
        total: list.length,
        completed: list.filter(o => o.status === "completed").length,
        pending: list.filter(o => o.status === "pending").length,
        inProgress: list.filter(o => o.status === "in_progress").length,
        cancelled: list.filter(o => o.status === "cancelled").length,
      });

      let filtered: typeof orders;
      let breakdown: { label: string; revenue: number; total: number; completed: number; cancelled: number }[] = [];

      if (period === "today") {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        filtered = orders.filter(o => new Date(o.createdAt!) >= start);
        for (let h = 0; h <= now.getHours(); h++) {
          const list = filtered.filter(o => new Date(o.createdAt!).getHours() === h);
          const s = calcStats(list);
          breakdown.push({ label: `${h}:00`, revenue: s.revenue, total: s.total, completed: s.completed, cancelled: s.cancelled });
        }
      } else if (period === "week") {
        const start = new Date(now);
        start.setDate(now.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        filtered = orders.filter(o => new Date(o.createdAt!) >= start);
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(now.getDate() - i);
          const label = d.toLocaleDateString("ar-SA", { weekday: "short", month: "short", day: "numeric" });
          const list = filtered.filter(o => {
            const od = new Date(o.createdAt!);
            return od.getFullYear() === d.getFullYear() && od.getMonth() === d.getMonth() && od.getDate() === d.getDate();
          });
          const s = calcStats(list);
          breakdown.push({ label, revenue: s.revenue, total: s.total, completed: s.completed, cancelled: s.cancelled });
        }
      } else if (period === "month") {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        filtered = orders.filter(o => new Date(o.createdAt!) >= start);
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        for (let d = 1; d <= daysInMonth; d++) {
          const list = filtered.filter(o => {
            const od = new Date(o.createdAt!);
            return od.getMonth() === now.getMonth() && od.getFullYear() === now.getFullYear() && od.getDate() === d;
          });
          const s = calcStats(list);
          breakdown.push({ label: String(d), revenue: s.revenue, total: s.total, completed: s.completed, cancelled: s.cancelled });
        }
      } else if (period === "year") {
        const start = new Date(now.getFullYear(), 0, 1);
        filtered = orders.filter(o => new Date(o.createdAt!) >= start);
        const monthNames = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
        for (let m = 0; m <= now.getMonth(); m++) {
          const list = filtered.filter(o => {
            const od = new Date(o.createdAt!);
            return od.getFullYear() === now.getFullYear() && od.getMonth() === m;
          });
          const s = calcStats(list);
          breakdown.push({ label: monthNames[m], revenue: s.revenue, total: s.total, completed: s.completed, cancelled: s.cancelled });
        }
      } else {
        // all: last 12 months
        filtered = orders;
        for (let i = 11; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const label = d.toLocaleDateString("ar-SA", { month: "short", year: "2-digit" });
          const list = orders.filter(o => {
            const od = new Date(o.createdAt!);
            return od.getFullYear() === d.getFullYear() && od.getMonth() === d.getMonth();
          });
          const s = calcStats(list);
          breakdown.push({ label, revenue: s.revenue, total: s.total, completed: s.completed, cancelled: s.cancelled });
        }
      }

      const serviceCounts: Record<string, { count: number; revenue: number; name: string }> = {};
      filtered.forEach((o: any) => {
        const key = o.serviceSlug || "unknown";
        if (!serviceCounts[key]) serviceCounts[key] = { count: 0, revenue: 0, name: o.serviceName || key };
        serviceCounts[key].count++;
        if (o.status === "completed") serviceCounts[key].revenue += o.amount || 0;
      });
      const topServices = Object.values(serviceCounts).sort((a, b) => b.count - a.count).slice(0, 5);

      res.json({ period, stats: calcStats(filtered), breakdown, topServices });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate detailed report" });
    }
  });

  app.post("/api/admin/store/goal", isAdminSession, async (req, res) => {
    try {
      const { goal } = req.body;
      await storage.setSetting("MONTHLY_REVENUE_GOAL", String(parseInt(goal) || 0));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update goal" });
    }
  });

  app.get("/api/admin/service-orders", isAdminSession, async (req, res) => {
    try {
      const orders = await storage.getServiceOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to get orders" });
    }
  });

  app.post("/api/admin/service-orders", isAdminSession, async (req, res) => {
    try {
      const orderNumber = await storage.getNextOrderNumber();
      const orderData = {
        ...req.body,
        orderNumber,
        receiptUrl: req.body.receiptUrl || "manual-order",
        paymentMethod: req.body.paymentMethod || "manual",
        status: req.body.status || "pending",
      };
      const validatedData = insertServiceOrderSchema.parse(orderData);
      const order = await storage.createServiceOrder(validatedData);
      broadcast("orders_changed");
      res.status(201).json(order);
    } catch (error: any) {
      console.error("Manual order creation error:", error);
      res.status(400).json({ message: error.message || "Failed to create order" });
    }
  });

  app.patch("/api/admin/service-orders/:id/status", isAdminSession, async (req, res) => {
    try {
      const { status, cancellationReason } = req.body;
      const orderId = parseInt(req.params.id as string);
      // Fetch previous status BEFORE update to prevent double-granting credits
      const prevOrder = await storage.getServiceOrder(orderId);
      const wasAlreadyCompleted = prevOrder?.status === "completed";
      const order = await storage.updateServiceOrderStatus(orderId, status, cancellationReason);
      // Grant job application credits when job-credits order is completed (first time only)
      if (status === "completed" && !wasAlreadyCompleted && order?.serviceSlug === "job-credits" && order?.memberId) {
        const creditsMatch = order.serviceVariant?.match(/(\d+)/);
        if (creditsMatch) {
          const creditsToAdd = parseInt(creditsMatch[1]);
          const expiresAt = new Date();
          expiresAt.setFullYear(expiresAt.getFullYear() + 1);
          await storage.addJobApplicationCredits(order.memberId, creditsToAdd, expiresAt);
        }
      }
      // Grant job alert points when job-alert-points order is completed (first time only)
      if (status === "completed" && !wasAlreadyCompleted && order?.serviceSlug === "job-alert-points" && order?.memberId) {
        const pointsMatch = order.serviceVariant?.match(/(\d+)/);
        if (pointsMatch) {
          const pointsToAdd = parseInt(pointsMatch[1]);
          await storage.addJobAlertPoints(order.memberId, pointsToAdd);
          communityStorage.createDirectNotification({
            memberId: order.memberId,
            actorId: 0,
            type: "system",
            message: `تم إضافة ${pointsToAdd} نقطة تنبيه إلى رصيدك بنجاح. يمكنك الآن استقبال إشعارات الوظائف الجديدة.`,
            link: "/dashboard/job-alerts",
          }).catch(() => {});
        }
      }
      // Grant AI credits when cv-analysis-credits order is completed (first time only)
      if (status === "completed" && !wasAlreadyCompleted && order?.serviceSlug === "cv-analysis-credits" && order?.memberId) {
        const creditsMatch = order.serviceVariant?.match(/(\d+)/);
        if (creditsMatch) {
          const creditsToAdd = parseInt(creditsMatch[1]);
          const currentMember = await communityStorage.getMember(order.memberId);
          if (currentMember) {
            const newExpiresAt = new Date();
            newExpiresAt.setFullYear(newExpiresAt.getFullYear() + 1);
            await communityStorage.updateMember(order.memberId, {
              cvAnalysisPaidCredits: (currentMember.cvAnalysisPaidCredits ?? 0) + creditsToAdd,
              cvAnalysisPaidCreditsExpiresAt: newExpiresAt,
            });
          }
        }
      }
      // Notify the member of the status change
      if (order?.memberId) {
        const statusLabels: Record<string, string> = {
          pending: "قيد الانتظار",
          in_progress: "جارٍ التنفيذ",
          completed: "مكتمل ✓",
          cancelled: "ملغى",
        };
        const statusLabel = statusLabels[status] || status;
        const cancelNote = cancellationReason ? ` — السبب: ${cancellationReason}` : "";
        communityStorage.createDirectNotification({
          memberId: order.memberId, actorId: order.memberId, type: "order_status_change",
          message: `تم تحديث حالة طلبك "${order.serviceName}" (${order.orderNumber}) إلى: ${statusLabel}${cancelNote}`,
          link: "/dashboard/orders",
        }).catch(() => {});
      }
      broadcast("orders_changed");
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  app.delete("/api/admin/service-orders/:id", isAdminSession, async (req, res) => {
    try {
      await storage.deleteServiceOrder(parseInt(req.params.id as string));
      broadcast("orders_changed");
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete order" });
    }
  });

  // ─── Admin: Job Application Requests ─────────────────────────────────────

  app.get("/api/admin/job-applications", isAdminSession, async (req, res) => {
    try {
      const requests = await storage.getJobApplicationRequests();
      // Enrich with member info
      const enriched = await Promise.all(requests.map(async (r) => {
        const member = await communityStorage.getMember(r.memberId);
        return { ...r, member: member ? { displayName: member.displayName, phone: member.phone, email: member.email } : null };
      }));
      res.json(enriched);
    } catch {
      res.status(500).json({ message: "Failed to fetch job applications" });
    }
  });

  app.delete("/api/admin/job-applications/:id", isAdminSession, async (req, res) => {
    try {
      const { password } = req.body;
      if (!password) return res.status(400).json({ message: "كلمة المرور مطلوبة" });

      // Verify against dedicated delete password
      const currentPassword = DELETE_APP_PASSWORD;
      if (!currentPassword || password !== currentPassword) {
        return res.status(403).json({ message: "كلمة المرور غير صحيحة" });
      }

      // Only superadmin (no adminId in session = main admin)
      const adminId = (req.session as any)?.adminId;
      if (adminId) {
        return res.status(403).json({ message: "هذا الإجراء متاح لمدير النظام الرئيسي فقط" });
      }

      const id = parseInt(req.params.id);
      const existing = await storage.getJobApplicationRequest(id);
      if (!existing) return res.status(404).json({ message: "الطلب غير موجود" });

      await storage.deleteJobApplicationRequest(id);
      res.json({ success: true });
    } catch {
      res.status(500).json({ message: "فشل في حذف الطلب" });
    }
  });

  app.patch("/api/admin/job-applications/:id/status", isAdminSession, async (req, res) => {
    try {
      const { status, adminNotes } = req.body;
      // Fetch the current request before updating to check old status
      const existing = await storage.getJobApplicationRequest(parseInt(req.params.id));
      const request = await storage.updateJobApplicationRequestStatus(parseInt(req.params.id), status, adminNotes);
      if (request?.memberId) {
        const statusLabels: Record<string, string> = {
          pending: "قيد الانتظار",
          in_progress: "جارٍ التنفيذ",
          done: "تم التنفيذ ✓",
          failed: "فشل / ملغى",
        };
        // Refund 1 credit if application closed/failed and wasn't already refunded
        const refundStatuses = ["failed", "cancelled"];
        const activeStatuses = ["pending", "in_progress", "done"];
        const wasAlreadyRefunded = existing && refundStatuses.includes(existing.status);
        if (refundStatuses.includes(status) && !wasAlreadyRefunded) {
          // Moving to failed/cancelled → refund credit
          await storage.addJobApplicationCredits(request.memberId, 1);
          communityStorage.createDirectNotification({
            memberId: request.memberId, actorId: request.memberId, type: "order_status_change",
            message: `تم إغلاق طلب التقديم على وظيفة "${request.jobTitle}" (${request.requestNumber}) وتمّت استعادة رصيد التقديم إلى حسابك.`,
            link: "/dashboard/orders",
          }).catch(() => {});
        } else if (wasAlreadyRefunded && activeStatuses.includes(status)) {
          // Reactivating from failed/cancelled → re-deduct the previously refunded credit
          await storage.useJobApplicationCredit(request.memberId);
          communityStorage.createDirectNotification({
            memberId: request.memberId, actorId: request.memberId, type: "order_status_change",
            message: `تم استئناف طلب التقديم على وظيفة "${request.jobTitle}" (${request.requestNumber}) وسيقوم فريقنا بالتقديم نيابةً عنك.`,
            link: "/dashboard/orders",
          }).catch(() => {});
        } else {
          communityStorage.createDirectNotification({
            memberId: request.memberId, actorId: request.memberId, type: "order_status_change",
            message: `تم تحديث حالة طلب التقديم على وظيفة "${request.jobTitle}" (${request.requestNumber}) إلى: ${statusLabels[status] || status}`,
            link: "/dashboard/orders",
          }).catch(() => {});
        }
      }
      broadcast("orders_changed");
      res.json(request);
    } catch {
      res.status(500).json({ message: "Failed to update status" });
    }
  });

  app.get("/api/admin/credit-adjustments/:memberId", isAdminSession, async (req, res) => {
    try {
      const logs = await storage.getCreditAdjustmentsByMember(parseInt(req.params.memberId as string));
      res.json(logs);
    } catch {
      res.status(500).json({ message: "Failed to fetch credit adjustments" });
    }
  });

  app.post("/api/admin/job-credits/add", isAdminSession, async (req, res) => {
    try {
      const { memberId, amount, reason } = req.body;
      if (!memberId || !amount) return res.status(400).json({ message: "memberId and amount required" });
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      const credits = await storage.addJobApplicationCredits(parseInt(memberId), parseInt(amount), expiresAt);
      storage.createCreditAdjustment({ memberId: parseInt(memberId), type: "job", operation: "add", amount: parseInt(amount), reason: reason || null }).catch(() => {});
      const notifMsg = reason ? `تم إضافة ${amount} رصيد تقديم إلى حسابك — ${reason}` : `تم إضافة ${amount} رصيد تقديم إلى حسابك.`;
      communityStorage.createDirectNotification({ memberId: parseInt(memberId), actorId: parseInt(memberId), type: "order_status_change", message: notifMsg, link: "/dashboard/orders" }).catch(() => {});
      res.json(credits);
    } catch {
      res.status(500).json({ message: "Failed to add credits" });
    }
  });

  app.post("/api/admin/job-credits/deduct", isAdminSession, async (req, res) => {
    try {
      const { memberId, amount, reason } = req.body;
      if (!memberId || !amount) return res.status(400).json({ message: "memberId and amount required" });
      await storage.deductJobApplicationCredits(parseInt(memberId), parseInt(amount));
      const credits = await storage.getJobApplicationCredits(parseInt(memberId));
      storage.createCreditAdjustment({ memberId: parseInt(memberId), type: "job", operation: "deduct", amount: parseInt(amount), reason: reason || null }).catch(() => {});
      const notifMsg = reason ? `تم خصم ${amount} رصيد تقديم من حسابك — ${reason}` : `تم خصم ${amount} رصيد تقديم من حسابك.`;
      communityStorage.createDirectNotification({ memberId: parseInt(memberId), actorId: parseInt(memberId), type: "order_status_change", message: notifMsg, link: "/dashboard/orders" }).catch(() => {});
      const remaining = credits ? (credits.paidCredits ?? 0) : 0;
      if (remaining === 0) {
        communityStorage.createDirectNotification({ memberId: parseInt(memberId), actorId: parseInt(memberId), type: "order_status_change", message: "نبّهك: رصيد التقديم على الوظائف انتهى. يمكنك شراء رصيد جديد للاستمرار في التقديم.", link: "/store" }).catch(() => {});
      }
      res.json(credits);
    } catch {
      res.status(500).json({ message: "Failed to deduct credits" });
    }
  });

  app.post("/api/admin/cv-credits/add", isAdminSession, async (req, res) => {
    try {
      const { memberId, amount, reason } = req.body;
      if (!memberId || !amount) return res.status(400).json({ message: "memberId and amount required" });
      const member = await communityStorage.getMember(parseInt(memberId));
      if (!member) return res.status(404).json({ message: "Member not found" });
      const newCredits = (member.cvAnalysisPaidCredits ?? 0) + parseInt(amount);
      const newExpiresAt = new Date();
      newExpiresAt.setFullYear(newExpiresAt.getFullYear() + 1);
      await communityStorage.updateMember(parseInt(memberId), { cvAnalysisPaidCredits: newCredits, cvAnalysisPaidCreditsExpiresAt: newExpiresAt });
      storage.createCreditAdjustment({ memberId: parseInt(memberId), type: "cv", operation: "add", amount: parseInt(amount), reason: reason || null }).catch(() => {});
      const notifMsg = reason ? `تم إضافة ${amount} رصيد تحليل ذكاء اصطناعي إلى حسابك — ${reason}` : `تم إضافة ${amount} رصيد تحليل ذكاء اصطناعي إلى حسابك.`;
      communityStorage.createDirectNotification({ memberId: parseInt(memberId), actorId: parseInt(memberId), type: "order_status_change", message: notifMsg, link: "/dashboard/orders" }).catch(() => {});
      res.json({ memberId, cvCredits: newCredits });
    } catch {
      res.status(500).json({ message: "Failed to add CV credits" });
    }
  });

  app.post("/api/admin/cv-credits/deduct", isAdminSession, async (req, res) => {
    try {
      const { memberId, amount, reason } = req.body;
      if (!memberId || !amount) return res.status(400).json({ message: "memberId and amount required" });
      const member = await communityStorage.getMember(parseInt(memberId));
      if (!member) return res.status(404).json({ message: "Member not found" });
      const newCredits = Math.max(0, (member.cvAnalysisPaidCredits ?? 0) - parseInt(amount));
      await communityStorage.updateMember(parseInt(memberId), { cvAnalysisPaidCredits: newCredits });
      storage.createCreditAdjustment({ memberId: parseInt(memberId), type: "cv", operation: "deduct", amount: parseInt(amount), reason: reason || null }).catch(() => {});
      const notifMsg = reason ? `تم خصم ${amount} رصيد تحليل ذكاء اصطناعي من حسابك — ${reason}` : `تم خصم ${amount} رصيد تحليل ذكاء اصطناعي من حسابك.`;
      communityStorage.createDirectNotification({ memberId: parseInt(memberId), actorId: parseInt(memberId), type: "order_status_change", message: notifMsg, link: "/dashboard/orders" }).catch(() => {});
      if (newCredits === 0) {
        communityStorage.createDirectNotification({ memberId: parseInt(memberId), actorId: parseInt(memberId), type: "order_status_change", message: "نبّهك: رصيد تحليل السيرة الذاتية بالذكاء الاصطناعي انتهى. يمكنك شراء رصيد جديد للاستمرار.", link: "/store" }).catch(() => {});
      }
      res.json({ memberId, cvCredits: newCredits });
    } catch {
      res.status(500).json({ message: "Failed to deduct CV credits" });
    }
  });

  app.get("/api/admin/member-credits", isAdminSession, async (req, res) => {
    try {
      const allMembers = await communityStorage.getMembers();
      const allJobCredits = await storage.getAllJobApplicationCredits();
      const jobCreditsMap = new Map(allJobCredits.map(c => [c.memberId, c]));
      const result = allMembers
        .filter((m: any) => (m.cvAnalysisPaidCredits ?? 0) > 0 || jobCreditsMap.has(m.id))
        .map((m: any) => ({
          memberId: m.id,
          displayName: m.displayName || m.username || `عضو #${m.id}`,
          phone: m.phone || null,
          email: m.email || null,
          jobCredits: jobCreditsMap.get(m.id)?.balance ?? 0,
          jobCreditsExpiresAt: jobCreditsMap.get(m.id)?.expiresAt ?? null,
          cvCredits: m.cvAnalysisPaidCredits ?? 0,
        }));
      res.json(result);
    } catch {
      res.status(500).json({ message: "Failed to fetch member credits" });
    }
  });

  // Site Settings
  app.get("/api/admin/site-settings", isAdminSession, async (req, res) => {
    try {
      const maintenanceMode = await getSiteSetting("maintenanceMode");
      const maintenanceMessage = await getSiteSetting("maintenanceMessage");
      res.json({
        maintenanceMode: maintenanceMode === "true",
        maintenanceMessage: maintenanceMessage || "الموقع تحت الصيانة حالياً. يرجى المحاولة لاحقاً.",
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get site settings" });
    }
  });

  app.put("/api/admin/site-settings", isAdminSession, async (req, res) => {
    try {
      const { maintenanceMode, maintenanceMessage } = req.body;
      await setSiteSetting("maintenanceMode", maintenanceMode ? "true" : "false");
      await setSiteSetting("maintenanceMessage", maintenanceMessage || "");
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to save site settings" });
    }
  });

  // Trash routes
  app.get("/api/admin/trash/jobs", isAdminSession, async (req, res) => {
    try {
      const trashedJobsList = await getTrashedJobs();
      res.json(trashedJobsList);
    } catch (error) {
      res.status(500).json({ message: "Failed to get trashed jobs" });
    }
  });

  app.get("/api/admin/trash/results", isAdminSession, async (req, res) => {
    try {
      const trashedResultsList = await getTrashedResults();
      res.json(trashedResultsList);
    } catch (error) {
      res.status(500).json({ message: "Failed to get trashed results" });
    }
  });

  app.get("/api/admin/trash/blogs", isAdminSession, async (req, res) => {
    try {
      const trashedBlogsList = await getTrashedBlogs();
      res.json(trashedBlogsList);
    } catch (error) {
      res.status(500).json({ message: "Failed to get trashed blogs" });
    }
  });

  app.get("/api/admin/trash/pages", isAdminSession, async (req, res) => {
    try {
      const trashedPagesList = await getTrashedPages();
      res.json(trashedPagesList);
    } catch (error) {
      res.status(500).json({ message: "Failed to get trashed pages" });
    }
  });

  app.post("/api/admin/trash/:type/:id/restore", isAdminSession, async (req, res) => {
    try {
      const { type, id } = req.params as Record<string, string>;
      await restoreFromTrash(type, parseInt(id));
      cache.delPrefix("jobs:");
      cache.del("results");
      broadcast("jobs_changed");
      broadcast("results_changed");
      broadcast("blog_changed");
      broadcast("pages_changed");
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to restore item" });
    }
  });

  app.delete("/api/admin/trash/:type/:id", isAdminSession, async (req, res) => {
    try {
      const { type, id } = req.params as Record<string, string>;
      await permanentlyDelete(type, parseInt(id));
      broadcast("jobs_changed");
      broadcast("results_changed");
      broadcast("blog_changed");
      broadcast("pages_changed");
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete item permanently" });
    }
  });

  // ─── Announcements (Admin) ───────────────────────────────────────────────
  app.get("/api/admin/announcements", isAdminSession, async (req, res) => {
    try {
      const items = await storage.getAnnouncements();
      res.json(items);
    } catch {
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  app.get("/api/admin/announcements/read-stats", isAdminSession, async (req, res) => {
    try {
      // Total members count (denominator for all announcements)
      const [memberCount] = await db.select({ count: sql<number>`count(*)::int` }).from(communityMembers);
      const total = memberCount?.count || 0;

      // Read counts per announcement (only for those with postId set)
      const rows = await db.select({
        announcementId: communityNotifications.postId,
        readCount: sql<number>`sum(case when ${communityNotifications.isRead} then 1 else 0 end)::int`,
      })
        .from(communityNotifications)
        .where(eq(communityNotifications.type, "announcement"))
        .groupBy(communityNotifications.postId);

      const readMap: Record<number, number> = {};
      for (const row of rows) {
        if (row.announcementId !== null) {
          readMap[row.announcementId] = row.readCount;
        }
      }

      // Get all announcement IDs so we can return stats for every announcement
      const announcements = await storage.getAnnouncements();
      const stats: Record<number, { total: number; readCount: number }> = {};
      for (const ann of announcements) {
        stats[ann.id] = { total, readCount: readMap[ann.id] || 0 };
      }

      res.json(stats);
    } catch {
      res.status(500).json({ message: "Failed to fetch read stats" });
    }
  });

  app.post("/api/admin/announcements", isAdminSession, async (req, res) => {
    try {
      const body = { ...req.body };
      if (body.startDate === "" || body.startDate === null) body.startDate = null;
      else if (body.startDate) body.startDate = new Date(body.startDate);
      if (body.endDate === "" || body.endDate === null) body.endDate = null;
      else if (body.endDate) body.endDate = new Date(body.endDate);
      const data = insertAnnouncementSchema.parse(body);
      const item = await storage.createAnnouncement(data);

      // Send notification to all community members if announcement is active
      if (item.status === "active") {
        try {
          const members = await communityStorage.getMembers();
          const ADMIN_ACTOR_ID = 0; // sentinel value for admin-originated notifications
          await Promise.all(
            members.map(member =>
              communityStorage.createDirectNotification({
                memberId: member.id,
                actorId: ADMIN_ACTOR_ID,
                type: "announcement",
                postId: item.id,
                message: `📢 ${item.title}`,
                link: "/dashboard/announcements",
                isRead: false,
              })
            )
          );
        } catch (notifErr) {
          console.error("Failed to send announcement notifications:", notifErr);
        }
      }

      res.json(item);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create announcement" });
    }
  });

  app.put("/api/admin/announcements/:id", isAdminSession, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const body = { ...req.body };
      if (body.startDate === "" || body.startDate === null) body.startDate = null;
      else if (body.startDate) body.startDate = new Date(body.startDate);
      if (body.endDate === "" || body.endDate === null) body.endDate = null;
      else if (body.endDate) body.endDate = new Date(body.endDate);
      const data = insertAnnouncementSchema.partial().parse(body);
      const item = await storage.updateAnnouncement(id, data);
      if (!item) return res.status(404).json({ message: "Not found" });
      res.json(item);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update announcement" });
    }
  });

  app.delete("/api/admin/announcements/:id", isAdminSession, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      await storage.deleteAnnouncement(id);
      res.json({ success: true });
    } catch {
      res.status(500).json({ message: "Failed to delete announcement" });
    }
  });

  // ─── Announcements (Members) ─────────────────────────────────────────────
  app.get("/api/announcements", async (req, res) => {
    try {
      const items = await storage.getActiveAnnouncements();
      res.json(items);
    } catch {
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  app.get("/api/announcements/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const items = await storage.getActiveAnnouncements();
      const item = items.find((a: any) => a.id === id);
      if (!item) return res.status(404).json({ message: "Announcement not found" });
      res.json(item);
    } catch {
      res.status(500).json({ message: "Failed to fetch announcement" });
    }
  });

  // ─── Job Reports (Public) ─────────────────────────────────────────────────
  app.post("/api/job-reports", async (req, res) => {
    try {
      const data = insertJobReportSchema.parse(req.body);
      const report = await storage.createJobReport(data);
      res.status(201).json(report);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create report" });
    }
  });

  // ─── Weekly Summary Subscriptions ─────────────────────────────────────────
  app.get("/api/weekly-summary/subscribers-count", async (req, res) => {
    try {
      const subs = await storage.getAllActiveWeeklySubscribers();
      res.json({ count: subs.length });
    } catch {
      res.status(500).json({ count: 0 });
    }
  });

  app.get("/api/weekly-summary/subscription-status", async (req, res) => {
    try {
      const memberId = await getCurrentMemberId(req);
      if (!memberId) return res.json({ subscribed: false, authenticated: false });
      const subscribed = await storage.getWeeklySubscriptionStatus(String(memberId));
      res.json({ subscribed, authenticated: true });
    } catch {
      res.status(500).json({ message: "Failed to get subscription status" });
    }
  });

  app.post("/api/weekly-summary/subscribe", isCommunityMember, async (req: any, res) => {
    try {
      const memberId = await getCurrentMemberId(req);
      if (!memberId) return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
      const member = await communityStorage.getMember(memberId);
      if (!member) return res.status(401).json({ message: "العضو غير موجود" });
      const email = member.email;
      if (!email) return res.status(400).json({ message: "لا يوجد بريد إلكتروني مرتبط بحسابك" });
      const sub = await storage.subscribeToWeeklySummary({
        userId: String(memberId),
        email,
        displayName: member.displayName || member.username,
      });
      res.json({ subscribed: true, sub });
    } catch {
      res.status(500).json({ message: "Failed to subscribe" });
    }
  });

  app.post("/api/weekly-summary/unsubscribe", isCommunityMember, async (req: any, res) => {
    try {
      const memberId = await getCurrentMemberId(req);
      if (!memberId) return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
      await storage.unsubscribeFromWeeklySummary(String(memberId));
      res.json({ subscribed: false });
    } catch {
      res.status(500).json({ message: "Failed to unsubscribe" });
    }
  });

  // ─── Weekly Summary (Public) ───────────────────────────────────────────────
  app.get("/api/weekly-summary/latest", async (req, res) => {
    try {
      const summary = await storage.getLatestWeeklySummary();
      res.json(summary || null);
    } catch {
      res.status(500).json({ message: "Failed to fetch weekly summary" });
    }
  });

  app.get("/api/weekly-summary/all", async (req, res) => {
    try {
      const summaries = await storage.getAllWeeklySummaries();
      res.json(summaries);
    } catch {
      res.status(500).json({ message: "Failed to fetch weekly summaries" });
    }
  });

  app.get("/api/weekly-summary/weekly-market-indicators", async (req, res) => {
    try {
      const { jobs, employerJobs } = await import("@workspace/db");
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const allJobs = await db.select().from(jobs).where(eq(jobs.status, "published"));
      const weekJobs = allJobs.filter(j => j.createdAt && new Date(j.createdAt) >= sevenDaysAgo);

      // Most viewed job this week (fallback to all-time if no week jobs)
      const pool = weekJobs.length > 0 ? weekJobs : allJobs;
      const topViewedJob = [...pool].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))[0] || null;

      // Top category this week
      const catCount: Record<string, number> = { civil: 0, military: 0, companies: 0 };
      weekJobs.forEach(j => { if (j.category && catCount[j.category] !== undefined) catCount[j.category]++; });
      const catLabels: Record<string, string> = { civil: "الوظائف المدنية", military: "الوظائف العسكرية", companies: "وظائف الشركات" };
      const topCatEntry = Object.entries(catCount).sort((a, b) => b[1] - a[1])[0];
      const topCategory = topCatEntry && topCatEntry[1] > 0
        ? { key: topCatEntry[0], label: catLabels[topCatEntry[0]], count: topCatEntry[1] }
        : null;

      // Top company this week
      const compCount: Record<string, { count: number; organizationId: number | null }> = {};
      weekJobs.forEach(j => {
        const key = j.company || "غير محدد";
        if (!compCount[key]) compCount[key] = { count: 0, organizationId: j.organizationId ?? null };
        compCount[key].count++;
      });
      const topCompEntry = Object.entries(compCount).sort((a, b) => b[1].count - a[1].count)[0];
      const topCompany = topCompEntry && topCompEntry[1].count > 0
        ? { name: topCompEntry[0], count: topCompEntry[1].count, organizationId: topCompEntry[1].organizationId }
        : null;

      // Active employer jobs count (this week)
      const activeEmployerJobs = await db.select().from(employerJobs).where(
        and(eq(employerJobs.status, "published"), isNull(employerJobs.trashedAt))
      );
      const newEmployerThisWeek = activeEmployerJobs.filter(j => j.createdAt && new Date(j.createdAt) >= sevenDaysAgo).length;

      res.json({
        topViewedJob: topViewedJob ? {
          id: topViewedJob.id, title: topViewedJob.title,
          company: topViewedJob.company, viewCount: topViewedJob.viewCount || 0,
          category: topViewedJob.category,
        } : null,
        topCategory,
        topCompany,
        employerJobsCount: activeEmployerJobs.length,
        newEmployerThisWeek,
        newJobsThisWeek: weekJobs.length,
      });
    } catch (err) {
      console.error("[weekly-market-indicators]", err);
      res.status(500).json({ message: "Failed" });
    }
  });

  app.get("/api/weekly-summary/top-employer-jobs", async (req, res) => {
    try {
      const allEmployerJobs = await storage.getEmployerJobs();
      const top10 = [...allEmployerJobs]
        .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
        .slice(0, 10)
        .map(j => ({
          id: j.id,
          title: j.title,
          company: j.company,
          region: j.region || null,
          city: j.city || null,
          viewCount: j.viewCount || 0,
        }));
      res.json(top10);
    } catch {
      res.status(500).json({ message: "Failed to fetch top employer jobs" });
    }
  });

  app.get("/api/weekly-summary/top-blog-posts", async (req, res) => {
    try {
      const allPosts = await storage.getBlogPostsByStatus("published");
      const top5 = [...allPosts]
        .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
        .slice(0, 5)
        .map(p => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          excerpt: p.excerpt || null,
          viewCount: p.viewCount || 0,
          category: p.category,
        }));
      res.json(top5);
    } catch {
      res.status(500).json({ message: "Failed to fetch top blog posts" });
    }
  });

  // ─── Weekly Summary (Admin — manual trigger & cron) ────────────────────────
  app.get("/api/admin/weekly-summary/subscribers", isAdminSession, async (req, res) => {
    try {
      const subscribers = await storage.getAllActiveWeeklySubscribers();
      res.json(subscribers);
    } catch {
      res.status(500).json({ message: "Failed to fetch subscribers" });
    }
  });

  app.post("/api/admin/weekly-summary/generate", isAdminSession, async (req, res) => {
    try {
      const now = new Date();
      const replace = req.body?.replace === true;

      // Check if a summary was already generated today
      const lastSummary = await storage.getLatestWeeklySummary();
      if (lastSummary && !replace) {
        const lastDate = new Date(lastSummary.generatedAt);
        const sameDay =
          lastDate.getFullYear() === now.getFullYear() &&
          lastDate.getMonth() === now.getMonth() &&
          lastDate.getDate() === now.getDate();
        if (sameDay) {
          return res.status(409).json({ conflict: true, message: "يوجد ملخص مولَّد اليوم بالفعل" });
        }
      }

      // If replacing, delete the existing today's summary and find the prior one for period start
      let periodStartSummary = lastSummary;
      if (replace && lastSummary) {
        const lastDate = new Date(lastSummary.generatedAt);
        const sameDay =
          lastDate.getFullYear() === now.getFullYear() &&
          lastDate.getMonth() === now.getMonth() &&
          lastDate.getDate() === now.getDate();
        if (sameDay) {
          await storage.deleteWeeklySummary(lastSummary.id);
          // Use the summary before today's as the period start
          const allSummaries = await storage.getAllWeeklySummaries();
          periodStartSummary = allSummaries[0]; // now the most recent remaining one
        }
      }

      // Use prior summary's date as period start (consistent with cron logic)
      const periodStart = periodStartSummary?.generatedAt
        ? new Date(periodStartSummary.generatedAt)
        : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Jobs
      const allJobs = await storage.getJobs();
      const published = allJobs.filter(j => j.status === "published");
      const newThisWeek = published.filter(j => j.createdAt && new Date(j.createdAt) >= periodStart);
      const newJobsThisWeek = newThisWeek.length;
      const topJobsByViews = [...newThisWeek]
        .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
        .slice(0, 15)
        .map(j => ({ id: j.id, title: j.title, company: j.company, viewCount: j.viewCount || 0, category: j.category, location: j.location }));

      // Employer jobs — only new this week
      const allEmployerJobs = await storage.getEmployerJobs();
      const topEmployerJobs = allEmployerJobs
        .filter(j => j.createdAt && new Date(j.createdAt) >= periodStart)
        .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
        .slice(0, 5)
        .map(j => ({ id: j.id, title: j.title, company: j.company, viewCount: j.viewCount || 0, region: j.region }));

      // Community — only new this week
      const allPosts = await communityStorage.getPosts();
      const newPostsThisWeek = allPosts.filter((p: any) => p.createdAt && new Date(p.createdAt) >= periodStart).length;
      const topCommunityPosts = allPosts
        .filter((p: any) => p.createdAt && new Date(p.createdAt) >= periodStart)
        .sort((a: any, b: any) => ((b.commentsCount || 0) + (b.likesCount || 0)) - ((a.commentsCount || 0) + (a.likesCount || 0)))
        .slice(0, 5)
        .map((p: any) => ({ id: p.id, title: p.title, commentsCount: p.commentsCount || 0, likesCount: p.likesCount || 0, viewsCount: p.viewsCount || 0 }));

      const allMembers = await communityStorage.getMembers();
      const newMembersThisWeek = allMembers.filter((m: any) => m.createdAt && new Date(m.createdAt) >= periodStart).length;

      // Blog posts — only new this week
      const allBlogPosts = await storage.getBlogPosts();
      const topBlogPosts = allBlogPosts
        .filter(b => b.createdAt && new Date(b.createdAt) >= periodStart)
        .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
        .slice(0, 5)
        .map(b => ({ id: b.id, title: b.title, viewCount: b.viewCount || 0 }));

      const weekLabel = `${periodStart.toLocaleDateString("ar-SA", { day: "numeric", month: "long" })} — ${now.toLocaleDateString("ar-SA", { day: "numeric", month: "long", year: "numeric" })}`;

      const statsData = {
        totalJobs: published.length,
        civilCount: published.filter(j => j.category === "civil").length,
        militaryCount: published.filter(j => j.category === "military").length,
        companiesCount: published.filter(j => j.category === "companies").length,
        newJobsThisWeek,
        totalMembers: allMembers.length,
        newMembersThisWeek,
        totalPosts: allPosts.length,
        newPostsThisWeek,
      };

      const aiResult = await generateWeeklySummary({ weekLabel, ...statsData, topJobsByViews, topEmployerJobs, topCommunityPosts, topBlogPosts });
      if (!aiResult) return res.status(500).json({ message: "AI generation failed" });

      const summary = await storage.createWeeklySummary({
        weekLabel, ...aiResult,
        topJobsData: JSON.stringify(topJobsByViews),
        topPostsData: JSON.stringify(topCommunityPosts),
        statsData: JSON.stringify(statsData),
      });

      // Notify in-site subscribers
      const subscribers = await storage.getAllActiveWeeklySubscribers();
      for (const sub of subscribers) {
        try {
          let member = await communityStorage.getMemberByUserId(sub.userId);
          if (!member && sub.email) {
            member = await communityStorage.getMemberByEmail(sub.email);
          }
          if (member) {
            await communityStorage.createDirectNotification({
              memberId: member.id,
              actorId: member.id,
              type: "weekly_summary",
              message: `الملخص الأسبوعي جاهز — ${summary.weekLabel}`,
              link: "/weekly-summary",
            });
            console.log(`[WeeklySummary] In-site notification sent to member ${member.id} (${sub.email})`);
          } else {
            console.warn(`[WeeklySummary] No community member found for subscriber userId=${sub.userId} email=${sub.email} — in-site notification skipped`);
          }
        } catch (e) {
          console.error(`[WeeklySummary] Notification failed for ${sub.email}:`, e);
        }
      }

      // Send Gmail emails to subscribers
      if (process.env.GMAIL_APP_PASSWORD) {
        for (const sub of subscribers) {
          if (!sub.email) continue;
          try {
            await sendWeeklySummaryEmailGmail({
              email: sub.email,
              displayName: sub.displayName,
              weekLabel: summary.weekLabel,
              narrative: summary.narrative || "",
              statsSnapshot: summary.statsSnapshot || "",
              aiAdvice: summary.aiAdvice || "",
              topJobsData: summary.topJobsData,
            });
            console.log(`[WeeklySummary] Email sent to ${sub.email}`);
          } catch (e) {
            console.error(`[WeeklySummary] Email failed for ${sub.email}:`, e);
          }
        }
      } else {
        console.warn("[WeeklySummary] GMAIL_APP_PASSWORD not set — email notifications skipped");
      }

      res.json(summary);
    } catch (err: any) {
      console.error("[WeeklySummary] Error generating:", err);
      res.status(500).json({ message: err.message || "Failed to generate weekly summary" });
    }
  });

  // ─── Job Reports (Admin) ──────────────────────────────────────────────────
  app.get("/api/admin/job-reports", isAdminSession, async (req, res) => {
    try {
      const reports = await storage.getJobReports();
      res.json(reports);
    } catch {
      res.status(500).json({ message: "Failed to fetch job reports" });
    }
  });

  app.put("/api/admin/job-reports/:id", isAdminSession, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const { status } = req.body;
      const report = await storage.resolveJobReport(id, 0, status);
      if (!report) return res.status(404).json({ message: "Report not found" });
      res.json(report);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update report" });
    }
  });

  // ===================== Employer Jobs (Public) =====================
  app.get("/api/employer-jobs", async (req, res) => {
    try {
      const { region } = req.query;
      const jobs = await storage.getEmployerJobs(region as string | undefined);
      res.json(jobs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/employer-jobs/closed", async (req, res) => {
    try {
      const jobs = await storage.getEmployerJobsByStatus("closed");
      res.json(jobs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/employer-jobs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const job = await storage.getEmployerJob(id);
      if (!job || job.trashedAt) return res.status(404).json({ message: "Not found" });
      await storage.incrementEmployerJobViewCount(id);
      res.json(job);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/employer-jobs/:id/similar", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const job = await storage.getEmployerJob(id);
      if (!job) return res.status(404).json({ message: "Not found" });
      const similar = await storage.getSimilarEmployerJobs(id, job.title, 3);
      res.json(similar);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/employer-jobs", async (req, res) => {
    try {
      const body = { ...req.body };
      if (body.deadlineDate && typeof body.deadlineDate === "string" && body.deadlineDate.trim() !== "") {
        body.deadlineDate = new Date(body.deadlineDate);
      } else {
        body.deadlineDate = null;
      }
      const parsed = insertEmployerJobSchema.safeParse(body);
      if (!parsed.success) return res.status(400).json({ message: "بيانات غير صالحة", errors: parsed.error.errors });
      const job = await storage.createEmployerJob({ ...parsed.data, status: "pending" });
      res.status(201).json(job);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });


  app.post("/api/employer-jobs/:id/report", async (req, res) => {
    try {
      const employerJobId = parseInt(req.params.id);
      const parsed = insertEmployerJobReportSchema.safeParse({ ...req.body, employerJobId });
      if (!parsed.success) return res.status(400).json({ message: "بيانات غير صالحة", errors: parsed.error.errors });
      const report = await storage.createEmployerJobReport(parsed.data);
      res.status(201).json(report);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ===================== Employer Jobs (Admin) =====================
  app.get("/api/admin/employer-jobs", isAdminSession, async (req, res) => {
    try {
      const { status } = req.query;
      const jobs = await storage.getEmployerJobsByStatus((status as string) || "pending");
      res.json(jobs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/admin/employer-jobs/:id/status", isAdminSession, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const job = await storage.updateEmployerJobStatus(id, status);
      if (!job) return res.status(404).json({ message: "Not found" });
      res.json(job);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/admin/employer-jobs/:id", isAdminSession, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { workSchedule, workMode, region } = req.body;
      let { deadlineDate } = req.body;
      if (deadlineDate && typeof deadlineDate === "string" && deadlineDate.trim() !== "") {
        deadlineDate = new Date(deadlineDate);
        if (isNaN(deadlineDate.getTime())) {
          return res.status(400).json({ message: "تاريخ غير صالح" });
        }
      } else {
        deadlineDate = null;
      }
      const job = await storage.updateEmployerJob(id, { workSchedule, workMode, region, deadlineDate });
      if (!job) return res.status(404).json({ message: "Not found" });
      res.json(job);
    } catch (error: any) {
      console.error("[PATCH employer-jobs]", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/admin/employer-jobs/:id", isAdminSession, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteEmployerJob(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/employer-job-reports", isAdminSession, async (req, res) => {
    try {
      const reports = await storage.getEmployerJobReports();
      res.json(reports);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/admin/employer-job-reports/:id", isAdminSession, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const report = await storage.resolveEmployerJobReport(id, status);
      if (!report) return res.status(404).json({ message: "Not found" });
      res.json(report);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ══════════════════════════════════════════════════════════════
  // SUPPORT TICKETS — Member Routes
  // ══════════════════════════════════════════════════════════════

  app.get("/api/support/tickets", isCommunityMember, async (req, res) => {
    try {
      const member = (req as any).communityMember;
      const tickets = await storage.getSupportTicketsByMember(member.id);
      res.json(tickets);
    } catch { res.status(500).json({ message: "فشل في جلب التذاكر" }); }
  });

  app.post("/api/support/tickets", isCommunityMember, async (req, res) => {
    try {
      const member = (req as any).communityMember;
      const { subject, type, message, orderNumber } = req.body;
      if (!subject?.trim() || !type || !message?.trim()) {
        return res.status(400).json({ message: "الموضوع والنوع والرسالة مطلوبة" });
      }
      const ticketNumber = "TKT-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      const ticket = await storage.createSupportTicket({
        ticketNumber,
        memberId: member.id,
        subject: subject.trim(),
        type,
        status: "open",
        orderNumber: orderNumber?.trim() || null,
        lastMemberReplyAt: new Date(),
      });
      await storage.createSupportTicketReply({
        ticketId: ticket.id,
        senderId: member.id,
        senderType: "member",
        message: message.trim(),
      });
      res.status(201).json(ticket);
    } catch { res.status(500).json({ message: "فشل في إنشاء التذكرة" }); }
  });

  app.get("/api/support/tickets/:id", isCommunityMember, async (req, res) => {
    try {
      const member = (req as any).communityMember;
      const ticket = await storage.getSupportTicket(parseInt(req.params.id));
      if (!ticket || ticket.memberId !== member.id) return res.status(404).json({ message: "التذكرة غير موجودة" });
      const replies = await storage.getSupportTicketReplies(ticket.id);
      res.json({ ticket, replies });
    } catch { res.status(500).json({ message: "فشل في جلب التذكرة" }); }
  });

  app.post("/api/support/tickets/:id/reply", isCommunityMember, async (req, res) => {
    try {
      const member = (req as any).communityMember;
      const ticket = await storage.getSupportTicket(parseInt(req.params.id));
      if (!ticket || ticket.memberId !== member.id) return res.status(404).json({ message: "التذكرة غير موجودة" });
      if (ticket.status === "closed") return res.status(400).json({ message: "التذكرة مغلقة. استخدم إعادة الفتح أولاً" });
      const { message } = req.body;
      if (!message?.trim()) return res.status(400).json({ message: "الرسالة مطلوبة" });
      const reply = await storage.createSupportTicketReply({
        ticketId: ticket.id, senderId: member.id, senderType: "member", message: message.trim(),
      });
      await storage.updateSupportTicketStatus(ticket.id, "open", { lastMemberReplyAt: new Date() });
      res.status(201).json(reply);
    } catch { res.status(500).json({ message: "فشل في إرسال الرد" }); }
  });

  app.post("/api/support/tickets/:id/reopen", isCommunityMember, async (req, res) => {
    try {
      const member = (req as any).communityMember;
      const ticket = await storage.getSupportTicket(parseInt(req.params.id));
      if (!ticket || ticket.memberId !== member.id) return res.status(404).json({ message: "التذكرة غير موجودة" });
      if (ticket.status !== "closed") return res.status(400).json({ message: "التذكرة مفتوحة بالفعل" });
      const { message } = req.body;
      const now = new Date();
      await storage.updateSupportTicketStatus(ticket.id, "open", { closedAt: null, lastMemberReplyAt: now });
      const systemMsg = await storage.createSupportTicketReply({
        ticketId: ticket.id, senderId: member.id, senderType: "system",
        message: "أُعيد فتح هذه التذكرة من قِبل العضو.",
      });
      if (message?.trim()) {
        await storage.createSupportTicketReply({
          ticketId: ticket.id, senderId: member.id, senderType: "member", message: message.trim(),
        });
      }
      res.json({ success: true });
    } catch { res.status(500).json({ message: "فشل في إعادة الفتح" }); }
  });

  // ══════════════════════════════════════════════════════════════
  // SUPPORT TICKETS — Admin Routes
  // ══════════════════════════════════════════════════════════════

  app.get("/api/admin/support/open-count", isAdminSession, async (req, res) => {
    try {
      const all = await storage.getAllSupportTickets();
      const openComplaints = all.filter((t: any) => t.type === "complaint" && t.status !== "closed").length;
      const totalOpen = all.filter((t: any) => t.status === "open").length;
      res.json({ openComplaints, totalOpen });
    } catch { res.status(500).json({ openComplaints: 0, totalOpen: 0 }); }
  });

  app.get("/api/admin/support/tickets", isAdminSession, async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const tickets = await storage.getAllSupportTickets(status);
      res.json(tickets);
    } catch { res.status(500).json({ message: "فشل في جلب التذاكر" }); }
  });

  app.get("/api/admin/support/tickets/:id", isAdminSession, async (req, res) => {
    try {
      const ticket = await storage.getSupportTicket(parseInt(req.params.id));
      if (!ticket) return res.status(404).json({ message: "التذكرة غير موجودة" });
      const replies = await storage.getSupportTicketReplies(ticket.id);
      res.json({ ticket, replies });
    } catch { res.status(500).json({ message: "فشل في جلب التذكرة" }); }
  });

  app.post("/api/admin/support/tickets/:id/reply", isAdminSession, async (req, res) => {
    try {
      const ticket = await storage.getSupportTicket(parseInt(req.params.id));
      if (!ticket) return res.status(404).json({ message: "التذكرة غير موجودة" });
      const { message } = req.body;
      if (!message?.trim()) return res.status(400).json({ message: "الرسالة مطلوبة" });
      const adminId = (req.session as any).adminId ?? 0;
      const now = new Date();
      const reply = await storage.createSupportTicketReply({
        ticketId: ticket.id, senderId: adminId, senderType: "admin", message: message.trim(),
      });
      await storage.updateSupportTicketStatus(ticket.id, "in_progress", { lastAdminReplyAt: now });
      communityStorage.createDirectNotification({
        memberId: ticket.memberId, actorId: ticket.memberId,
        type: "order_status_change",
        message: `تم الرد على تذكرة الدعم الفني #${ticket.ticketNumber} — "${ticket.subject}"`,
        link: `/dashboard/support/${ticket.id}`,
      }).catch(() => {});
      res.status(201).json(reply);
    } catch { res.status(500).json({ message: "فشل في إرسال الرد" }); }
  });

  app.put("/api/admin/support/tickets/:id/status", isAdminSession, async (req, res) => {
    try {
      const ticket = await storage.getSupportTicket(parseInt(req.params.id));
      if (!ticket) return res.status(404).json({ message: "التذكرة غير موجودة" });
      const { status } = req.body;
      const allowedStatuses = ["open", "in_progress", "pending", "closed"];
      if (!allowedStatuses.includes(status)) return res.status(400).json({ message: "حالة غير صحيحة" });
      const extra: any = {};
      if (status === "closed") extra.closedAt = new Date();
      const updated = await storage.updateSupportTicketStatus(ticket.id, status, extra);
      if (status === "closed") {
        communityStorage.createDirectNotification({
          memberId: ticket.memberId, actorId: ticket.memberId,
          type: "order_status_change",
          message: `تم إغلاق تذكرة الدعم #${ticket.ticketNumber} — "${ticket.subject}"`,
          link: `/dashboard/support/${ticket.id}`,
        }).catch(() => {});
      }
      res.json(updated);
    } catch { res.status(500).json({ message: "فشل في تحديث الحالة" }); }
  });

  // ── FAQ Routes ──
  app.get("/api/faq/categories", async (_req, res) => {
    try {
      const cats = await storage.getFaqCategories();
      res.json(cats);
    } catch { res.status(500).json({ message: "خطأ" }); }
  });

  app.get("/api/admin/faq/categories", isAdminSession, async (_req, res) => {
    try {
      const cats = await storage.getFaqCategories();
      res.json(cats);
    } catch { res.status(500).json({ message: "خطأ" }); }
  });

  app.post("/api/admin/faq/categories", isAdminSession, async (req, res) => {
    try {
      const cat = await storage.createFaqCategory(req.body);
      res.status(201).json(cat);
    } catch { res.status(500).json({ message: "فشل في إضافة التصنيف" }); }
  });

  app.put("/api/admin/faq/categories/:id", isAdminSession, async (req, res) => {
    try {
      const cat = await storage.updateFaqCategory(parseInt(req.params.id), req.body);
      if (!cat) return res.status(404).json({ message: "التصنيف غير موجود" });
      res.json(cat);
    } catch { res.status(500).json({ message: "فشل في تحديث التصنيف" }); }
  });

  app.delete("/api/admin/faq/categories/:id", isAdminSession, async (req, res) => {
    try {
      await storage.deleteFaqCategory(parseInt(req.params.id));
      res.json({ success: true });
    } catch { res.status(500).json({ message: "فشل في حذف التصنيف" }); }
  });

  app.get("/api/faq", async (_req, res) => {
    try {
      const items = await storage.getFaqItems(true);
      res.json(items);
    } catch { res.status(500).json({ message: "خطأ في جلب الأسئلة الشائعة" }); }
  });

  app.get("/api/admin/faq", isAdminSession, async (_req, res) => {
    try {
      const items = await storage.getFaqItems(false);
      res.json(items);
    } catch { res.status(500).json({ message: "خطأ في جلب الأسئلة الشائعة" }); }
  });

  app.post("/api/admin/faq", isAdminSession, async (req, res) => {
    try {
      const item = await storage.createFaqItem(req.body);
      res.status(201).json(item);
    } catch { res.status(500).json({ message: "فشل في إضافة السؤال" }); }
  });

  app.put("/api/admin/faq/:id", isAdminSession, async (req, res) => {
    try {
      const item = await storage.updateFaqItem(parseInt(req.params.id), req.body);
      if (!item) return res.status(404).json({ message: "السؤال غير موجود" });
      res.json(item);
    } catch { res.status(500).json({ message: "فشل في تحديث السؤال" }); }
  });

  app.delete("/api/admin/faq/:id", isAdminSession, async (req, res) => {
    try {
      await storage.deleteFaqItem(parseInt(req.params.id));
      res.json({ success: true });
    } catch { res.status(500).json({ message: "فشل في حذف السؤال" }); }
  });

  // ─── Twitter / X Publishing Routes ──────────────────────────────────────────

  app.get("/api/twitter/status", isAdminSession, async (_req, res) => {
    try {
      const configured = isTwitterConfigured();
      const settings = await getOrCreateSettings();
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const [todayRow] = await db.select({ cnt: drizzleCount() }).from(twitterPostsTable).where(
        and(eq(twitterPostsTable.status, "published"), gte(twitterPostsTable.publishedAt, today))
      );
      res.json({ configured, enabled: settings.enabled, todayCount: Number(todayRow?.cnt ?? 0) });
    } catch {
      res.status(500).json({ configured: false, enabled: false, todayCount: 0 });
    }
  });

  app.get("/api/twitter/settings", isAdminSession, async (_req, res) => {
    try {
      res.json(await getOrCreateSettings());
    } catch { res.status(500).json({ message: "Failed" }); }
  });

  app.put("/api/twitter/settings", isAdminSession, async (req, res) => {
    try {
      const settings = await getOrCreateSettings();
      const [updated] = await db.update(twitterSettingsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(twitterSettingsTable.id, settings.id)).returning();
      res.json(updated);
    } catch { res.status(500).json({ message: "Failed to save settings" }); }
  });

  app.get("/api/twitter/preview", isAdminSession, async (req, res) => {
    try {
      const { contentType, contentId } = req.query as { contentType: string; contentId: string };
      if (!contentType || !contentId) return res.status(400).json({ message: "contentType and contentId required" });
      const settings = await getOrCreateSettings();
      const id = parseInt(contentId);
      let built: { text: string; imageUrl: string | null } | null = null;
      if (contentType === "job") built = await buildJobTweet(id, settings);
      else if (contentType === "blog") built = await buildBlogTweet(id, settings);
      else if (contentType === "result") built = await buildResultTweet(id, settings);
      if (!built) return res.status(404).json({ message: "المحتوى غير موجود" });
      res.json(built);
    } catch { res.status(500).json({ message: "Failed to build preview" }); }
  });

  app.post("/api/twitter/publish", isAdminSession, async (req, res) => {
    try {
      const { contentType, contentId, customText } = req.body;
      if (!contentType || !contentId) return res.status(400).json({ message: "contentType and contentId required" });
      const adminId = (req.session as any)?.adminId ?? null;
      const result = await publishToTwitter({
        contentType,
        contentId: parseInt(contentId),
        customText,
        isAuto: false,
        publishedBy: adminId,
      });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || "Server error" });
    }
  });

  app.get("/api/twitter/posts", isAdminSession, async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string || "50"), 200);
      const rows = await db.select().from(twitterPostsTable).orderBy(desc(twitterPostsTable.createdAt)).limit(limit);
      res.json(rows);
    } catch { res.status(500).json({ message: "Failed" }); }
  });

  // ─── SEO Prerender: serve real HTML to search engine crawlers ───────────────
  // Regular users get the React SPA (next()); crawlers get pre-rendered HTML.
  // No cloaking — both receive the same data, just different rendering method.

  const CRAWLER_RE = /googlebot|google-inspectiontool|adsbot-google|bingbot|yandexbot|duckduckbot|baiduspider|whatsapp|facebookexternalhit|twitterbot|telegrambot|linkedinbot|slackbot|discordbot|applebot|msnbot|ahrefsbot|semrushbot/i;

  function isCrawlerUA(ua: string) { return CRAWLER_RE.test(ua); }

  function esc(s: string) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function stripHtml(s: string) {
    return s.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
  }

  function buildOgImageUrl(logo: string | null | undefined, base: string) {
    if (!logo) return `${base}/logo.png`;
    return logo.startsWith("http") ? logo : `${base}/api/objects${logo.replace(/^\/objects/, "")}`;
  }

  // Job detail pages: /jobs/post/:id
  app.get("/jobs/post/:id", async (req, res, next) => {
    if (!isCrawlerUA(req.headers["user-agent"] || "")) return next();
    try {
      const jobId = parseInt(req.params.id);
      if (isNaN(jobId)) return next();
      const job = await storage.getJob(jobId);
      if (!job) return next();

      const org = job.organizationId ? await storage.getOrganization(job.organizationId) : null;
      const base = process.env.SITE_URL || "https://www.alwdaif.com";
      const pageUrl = `${base}/jobs/post/${job.id}`;
      const imageUrl = buildOgImageUrl(org?.logo || (job as any).logo || null, base);

      const titleText = esc(`${job.title} | إعلانات الوظائف`);
      const rawDesc = job.description
        ? stripHtml(job.description).slice(0, 155)
        : `وظيفة ${job.title} في ${job.company} — المملكة العربية السعودية`;
      const descText = esc(rawDesc);
      const fullBody = job.description ? stripHtml(job.description) : rawDesc;
      const categoryLabel = job.category === "civil" ? "حكومي" : job.category === "military" ? "عسكري" : "شركات";

      const jsonLd = {
        "@context": "https://schema.org",
        "@type": "JobPosting",
        title: job.title,
        description: rawDesc,
        datePosted: job.createdAt ? new Date(job.createdAt).toISOString() : new Date().toISOString(),
        hiringOrganization: { "@type": "Organization", name: job.company, ...(imageUrl !== `${base}/logo.png` ? { logo: imageUrl } : {}) },
        jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressCountry: "SA", addressLocality: (job as any).city || (job as any).location || "المملكة العربية السعودية" } },
        url: pageUrl,
        directApply: !!((job as any).applyUrl),
      };

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${titleText}</title>
<meta name="description" content="${descText}"/>
<link rel="canonical" href="${esc(pageUrl)}"/>
<meta property="og:title" content="${titleText}"/>
<meta property="og:description" content="${descText}"/>
<meta property="og:image" content="${esc(imageUrl)}"/>
<meta property="og:url" content="${esc(pageUrl)}"/>
<meta property="og:type" content="website"/>
<meta property="og:site_name" content="منصة إعلانات الوظائف"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${titleText}"/>
<meta name="twitter:description" content="${descText}"/>
<meta name="twitter:image" content="${esc(imageUrl)}"/>
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body>
<header><a href="${esc(base)}">منصة إعلانات الوظائف</a></header>
<main>
<article>
  <h1>${esc(job.title)}</h1>
  <p><strong>الجهة:</strong> ${esc(job.company)}</p>
  <p><strong>التصنيف:</strong> ${esc(categoryLabel)}</p>
  ${(job as any).location ? `<p><strong>الموقع:</strong> ${esc((job as any).location)}</p>` : ""}
  <p>${esc(fullBody.slice(0, 2000))}</p>
  <p><a href="${esc(pageUrl)}">عرض الوظيفة كاملاً</a></p>
</article>
<nav>
  <a href="${esc(base)}/jobs">جميع الوظائف</a> |
  <a href="${esc(base)}/jobs/civil">وظائف حكومية</a> |
  <a href="${esc(base)}/jobs/military">وظائف عسكرية</a> |
  <a href="${esc(base)}/jobs/companies">وظائف شركات</a>
</nav>
</main>
</body>
</html>`);
    } catch { next(); }
  });

  // Blog post pages: /blog/:id
  app.get("/blog/:id", async (req, res, next) => {
    if (!isCrawlerUA(req.headers["user-agent"] || "")) return next();
    try {
      const rawId = req.params.id;
      const numId = parseInt(rawId);
      const post = isNaN(numId)
        ? await storage.getBlogPostBySlug(rawId)
        : await storage.getBlogPost(numId);
      if (!post || (post as any).status !== "published") return next();

      const base = process.env.SITE_URL || "https://www.alwdaif.com";
      const pageUrl = `${base}/blog/${(post as any).slug || post.id}`;
      const imageUrl = (post as any).image
        ? ((post as any).image.startsWith("http") ? (post as any).image : `${base}/api/objects${(post as any).image.replace(/^\/objects/, "")}`)
        : `${base}/logo.png`;

      const titleText = esc(`${post.title} | مدونة إعلانات الوظائف`);
      const rawDesc = (post as any).excerpt
        ? stripHtml((post as any).excerpt).slice(0, 155)
        : stripHtml(post.content || "").slice(0, 155);
      const descText = esc(rawDesc);
      const bodyText = stripHtml(post.content || "").slice(0, 3000);

      const jsonLd = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        description: rawDesc,
        author: { "@type": "Person", name: (post as any).author || "فريق إعلانات الوظائف" },
        publisher: { "@type": "Organization", "@id": `${base}/#organization`, name: "منصة إعلانات الوظائف" },
        datePublished: (post as any).date || (post.createdAt ? new Date(post.createdAt).toISOString() : new Date().toISOString()),
        inLanguage: "ar",
        url: pageUrl,
        mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
        ...(imageUrl !== `${base}/logo.png` ? { image: { "@type": "ImageObject", url: imageUrl } } : {}),
      };

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${titleText}</title>
<meta name="description" content="${descText}"/>
<link rel="canonical" href="${esc(pageUrl)}"/>
<meta property="og:title" content="${titleText}"/>
<meta property="og:description" content="${descText}"/>
<meta property="og:image" content="${esc(imageUrl)}"/>
<meta property="og:url" content="${esc(pageUrl)}"/>
<meta property="og:type" content="article"/>
<meta property="og:site_name" content="منصة إعلانات الوظائف"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${titleText}"/>
<meta name="twitter:description" content="${descText}"/>
<meta name="twitter:image" content="${esc(imageUrl)}"/>
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body>
<header><a href="${esc(base)}">منصة إعلانات الوظائف</a></header>
<main>
<article>
  <h1>${esc(post.title)}</h1>
  ${(post as any).category ? `<p><strong>التصنيف:</strong> ${esc((post as any).category)}</p>` : ""}
  ${(post as any).author ? `<p><strong>الكاتب:</strong> ${esc((post as any).author)}</p>` : ""}
  <p>${esc(bodyText)}</p>
  <p><a href="${esc(pageUrl)}">قراءة المقالة كاملاً</a></p>
</article>
<nav>
  <a href="${esc(base)}/blog">المدونة</a> |
  <a href="${esc(base)}/jobs">الوظائف</a> |
  <a href="${esc(base)}">الرئيسية</a>
</nav>
</main>
</body>
</html>`);
    } catch { next(); }
  });

  // Legacy WordPress job URLs (e.g. /jobs/141413) — return 410 Gone
  // so Google removes them from its index cleanly without affecting new routes
  app.get(/^\/jobs\/\d+$/, (req, res) => {
    res.status(410).send("هذا الإعلان انتهت صلاحيته وتم حذفه نهائياً.");
  });

  return httpServer;
}
