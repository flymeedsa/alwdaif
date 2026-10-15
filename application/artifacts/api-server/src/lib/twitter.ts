import { TwitterApi } from "twitter-api-v2";
import { logger } from "./logger";
import { db } from "../db";
import { twitterSettings, twitterPosts, jobs, blogPosts, results } from "@workspace/db";
import { eq, and, gte, desc, count } from "drizzle-orm";

const SITE_URL = "https://www.alwdaif.com";

const DEFAULT_TEMPLATES = {
  templateJob: `🔔 وظيفة جديدة | {{company}}
{{title}}
📍 {{city}}

التقديم 👇
{{url}}

{{hashtags}}`,
  templateCivil: `📢 إعلان وظيفة حكومية
{{title}}
🏛️ {{company}}

التقديم من هنا 👇
{{url}}

#وظائف_حكومية #وظائف_السعودية {{hashtags}}`,
  templateMilitary: `⚔️ وظيفة عسكرية
{{title}}
🏛️ {{company}}

التقديم 👇
{{url}}

#وظائف_عسكرية #القوات_المسلحة {{hashtags}}`,
  templateCompanies: `💼 وظيفة في القطاع الخاص
{{title}} | {{company}}
📍 {{city}}

التقديم 👇
{{url}}

#وظائف_الشركات #وظائف_السعودية {{hashtags}}`,
  templateOrganizations: `🏛️ وظيفة جديدة
{{title}}
{{company}}

التقديم 👇
{{url}}

#وظائف_السعودية {{hashtags}}`,
  templateResults: `📋 نتيجة جديدة | {{company}}
{{title}}

الاستعلام 👇
{{url}}

#نتائج_الوظائف #وظائف_السعودية {{hashtags}}`,
  templateBlog: `📖 {{title}}

اقرأ المقال كاملاً 👇
{{url}}

#نصائح_وظيفية #سوق_العمل {{hashtags}}`,
};

export function isTwitterConfigured(): boolean {
  return !!(
    process.env.TWITTER_API_KEY &&
    process.env.TWITTER_API_SECRET &&
    process.env.TWITTER_ACCESS_TOKEN &&
    process.env.TWITTER_ACCESS_TOKEN_SECRET
  );
}

export function getTwitterClient(): TwitterApi | null {
  if (!isTwitterConfigured()) return null;
  return new TwitterApi({
    appKey: process.env.TWITTER_API_KEY!,
    appSecret: process.env.TWITTER_API_SECRET!,
    accessToken: process.env.TWITTER_ACCESS_TOKEN!,
    accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET!,
  });
}

export async function getOrCreateSettings() {
  const existing = await db.select().from(twitterSettings).limit(1);
  if (existing.length > 0) return existing[0];
  const [created] = await db.insert(twitterSettings).values({
    enabled: false,
    templateJob: DEFAULT_TEMPLATES.templateJob,
    templateCivil: DEFAULT_TEMPLATES.templateCivil,
    templateMilitary: DEFAULT_TEMPLATES.templateMilitary,
    templateCompanies: DEFAULT_TEMPLATES.templateCompanies,
    templateOrganizations: DEFAULT_TEMPLATES.templateOrganizations,
    templateResults: DEFAULT_TEMPLATES.templateResults,
    templateBlog: DEFAULT_TEMPLATES.templateBlog,
  }).returning();
  return created;
}

function getJobType(job: { category?: string | null; organizationId?: number | null }): "civil" | "military" | "companies" | "organizations" | "general" {
  if (job.organizationId) return "organizations";
  if (job.category === "civil") return "civil";
  if (job.category === "military") return "military";
  if (job.category === "companies" || job.category === "employer") return "companies";
  return "general";
}

function buildTweetText(template: string, vars: Record<string, string>): string {
  let text = template;
  for (const [key, val] of Object.entries(vars)) {
    text = text.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), val);
  }
  return text.slice(0, 280);
}

export async function buildJobTweet(jobId: number, settings: typeof twitterSettings.$inferSelect): Promise<{ text: string; imageUrl: string | null } | null> {
  const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId));
  if (!job) return null;

  const jobType = getJobType(job);
  const templateMap: Record<string, string | null> = {
    civil: settings.templateCivil,
    military: settings.templateMilitary,
    companies: settings.templateCompanies,
    organizations: settings.templateOrganizations,
    general: settings.templateJob,
  };

  const template = templateMap[jobType] || DEFAULT_TEMPLATES.templateJob;
  const url = `${SITE_URL}/jobs/post/${job.id}`;
  const hashtags = settings.defaultHashtags || "";

  const text = buildTweetText(template, {
    title: job.title,
    company: job.company,
    city: job.location || "",
    url,
    hashtags,
  });

  let imageUrl: string | null = null;
  if (settings.imageSource === "featured" || settings.imageSource === "company") {
    imageUrl = job.logo || null;
  } else if (settings.imageSource === "logo") {
    imageUrl = `${SITE_URL}/icon-192.png`;
  } else if (settings.imageSource === "default") {
    imageUrl = `${SITE_URL}/opengraph.jpg`;
  }

  return { text, imageUrl };
}

export async function buildBlogTweet(postId: number, settings: typeof twitterSettings.$inferSelect): Promise<{ text: string; imageUrl: string | null } | null> {
  const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, postId));
  if (!post) return null;

  const template = settings.templateBlog || DEFAULT_TEMPLATES.templateBlog;
  const url = `${SITE_URL}/blog/${post.slug || post.id}`;
  const hashtags = settings.defaultHashtags || "";

  const text = buildTweetText(template, {
    title: post.title,
    url,
    hashtags,
  });

  let imageUrl: string | null = null;
  if (settings.imageSource === "featured" || settings.imageSource === "default") {
    imageUrl = post.image || null;
  } else if (settings.imageSource === "logo") {
    imageUrl = `${SITE_URL}/icon-192.png`;
  }

  return { text, imageUrl };
}

export async function buildResultTweet(resultId: number, settings: typeof twitterSettings.$inferSelect): Promise<{ text: string; imageUrl: string | null } | null> {
  const [result] = await db.select().from(results).where(eq(results.id, resultId));
  if (!result) return null;

  const template = settings.templateResults || DEFAULT_TEMPLATES.templateResults;
  const url = `${SITE_URL}/jobs/results/${result.id}`;
  const hashtags = settings.defaultHashtags || "";

  const text = buildTweetText(template, {
    title: result.title,
    company: result.org,
    url,
    hashtags,
  });

  return { text, imageUrl: settings.imageSource === "logo" ? `${SITE_URL}/icon-192.png` : null };
}

async function checkRateLimit(settings: typeof twitterSettings.$inferSelect): Promise<boolean> {
  const limit = settings.rateLimitPerHour ?? 5;
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const [row] = await db
    .select({ cnt: count() })
    .from(twitterPosts)
    .where(and(eq(twitterPosts.status, "published"), gte(twitterPosts.publishedAt, oneHourAgo)));
  return (row?.cnt ?? 0) < limit;
}

async function alreadyPublished(contentType: string, contentId: number): Promise<boolean> {
  const existing = await db
    .select()
    .from(twitterPosts)
    .where(and(
      eq(twitterPosts.contentType, contentType),
      eq(twitterPosts.contentId, contentId),
      eq(twitterPosts.status, "published"),
    ))
    .limit(1);
  return existing.length > 0;
}

async function uploadMedia(client: TwitterApi, imageUrl: string): Promise<string | null> {
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get("content-type") || "image/png";
    const mediaId = await client.v1.uploadMedia(buffer, { mimeType: contentType as any });
    return mediaId;
  } catch (err) {
    logger.warn({ err, imageUrl }, "[twitter] Failed to upload media");
    return null;
  }
}

export interface PublishOptions {
  contentType: "job" | "blog" | "result";
  contentId: number;
  customText?: string;
  isAuto?: boolean;
  publishedBy?: number;
}

export async function publishToTwitter(opts: PublishOptions): Promise<{ success: boolean; tweetId?: string; tweetUrl?: string; error?: string }> {
  if (!isTwitterConfigured()) {
    return { success: false, error: "مفاتيح X API غير مضبوطة في الإعدادات" };
  }

  const settings = await getOrCreateSettings();

  if (!settings.enabled) {
    return { success: false, error: "نظام النشر في X معطّل" };
  }

  if (await alreadyPublished(opts.contentType, opts.contentId)) {
    return { success: false, error: "تم نشر هذا المحتوى مسبقاً" };
  }

  const withinLimit = await checkRateLimit(settings);
  if (!withinLimit) {
    return { success: false, error: "تم تجاوز حد النشر في الساعة" };
  }

  let built: { text: string; imageUrl: string | null } | null = null;
  if (opts.contentType === "job") {
    built = await buildJobTweet(opts.contentId, settings);
  } else if (opts.contentType === "blog") {
    built = await buildBlogTweet(opts.contentId, settings);
  } else if (opts.contentType === "result") {
    built = await buildResultTweet(opts.contentId, settings);
  }

  if (!built) {
    return { success: false, error: "المحتوى غير موجود" };
  }

  const tweetText = opts.customText || built.text;

  const [logRow] = await db.insert(twitterPosts).values({
    contentType: opts.contentType,
    contentId: opts.contentId,
    tweetText,
    status: "pending",
    isAuto: opts.isAuto ?? false,
    publishedBy: opts.publishedBy,
    attempts: 1,
  }).returning();

  const client = getTwitterClient()!;
  try {
    let mediaId: string | undefined;
    if (built.imageUrl) {
      const uploaded = await uploadMedia(client, built.imageUrl);
      if (uploaded) mediaId = uploaded;
    }

    const tweet = await client.v2.tweet({
      text: tweetText,
      ...(mediaId ? { media: { media_ids: [mediaId] } } : {}),
    });

    const tweetId = tweet.data.id;
    const tweetUrl = `https://x.com/alwdaif1/status/${tweetId}`;

    await db.update(twitterPosts).set({
      tweetId,
      tweetUrl,
      status: "published",
      publishedAt: new Date(),
    }).where(eq(twitterPosts.id, logRow.id));

    return { success: true, tweetId, tweetUrl };
  } catch (err: any) {
    const errorMessage = err?.message || String(err);
    logger.error({ err, opts }, "[twitter] Failed to post tweet");

    await db.update(twitterPosts).set({
      status: "failed",
      errorMessage,
    }).where(eq(twitterPosts.id, logRow.id));

    return { success: false, error: errorMessage };
  }
}

export async function shouldAutoPublishJob(job: { id: number; status?: string | null; isActive?: boolean | null; category?: string | null; organizationId?: number | null }): Promise<boolean> {
  if (job.status !== "published" || job.isActive === false) return false;
  if (await alreadyPublished("job", job.id)) return false;

  const settings = await getOrCreateSettings();
  if (!settings.enabled) return false;

  const jobType = getJobType(job);
  const typeMap: Record<string, boolean> = {
    civil: settings.autoJobsCivil ?? false,
    military: settings.autoJobsMilitary ?? false,
    companies: settings.autoJobsCompanies ?? false,
    organizations: settings.autoJobsOrganizations ?? false,
    general: settings.autoJobsGeneral ?? false,
  };

  return typeMap[jobType] ?? false;
}

export async function shouldAutoPublishBlog(post: { id: number; status?: string | null; isPublished?: boolean | null }): Promise<boolean> {
  if (post.status !== "published" || post.isPublished === false) return false;
  if (await alreadyPublished("blog", post.id)) return false;

  const settings = await getOrCreateSettings();
  return !!(settings.enabled && settings.autoBlog);
}
