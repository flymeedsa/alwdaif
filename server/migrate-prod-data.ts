import { db } from "./db";
import { results, employerJobs, siteSettings } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";

const OLD_SEEDED_RESULT_IDS = [1, 2, 3, 4, 5, 6, 7, 8];

export async function migrateMissingData(): Promise<void> {
  try {
    await cleanupOldResults();
    await migrateSiteSettings();
    console.log("[migrate] Data sync complete.");
  } catch (err) {
    console.error("[migrate] Data sync error:", err);
  }
}

async function cleanupOldResults() {
  try {
    const deleted = await db.delete(results).where(inArray(results.id, OLD_SEEDED_RESULT_IDS));
    console.log("[migrate] Cleaned up old seeded results if any.");
  } catch (_) {
    // ignore errors (may not exist in dev DB without results table)
  }
}

async function migrateEmployerJobs() {
  const MISSING_JOBS = [
    {
      id: 16,
      title: "مدير مبيعات",
      company: "مجموعة الرائد التجارية",
      region: "الرياض",
      city: "الرياض",
      description: "مطلوب مدير مبيعات لقيادة فريق المبيعات وتحقيق الأهداف.",
      requirements: "خبرة 5 سنوات في المبيعات\nمهارات قيادية عالية",
      targetGender: "male",
      targetNationality: "saudi",
      contactMethod: "phone",
      contactValue: "0501122334",
      submitterName: "مدير الموارد البشرية",
      submitterEmail: "hr@raidalcommerce.sa",
      status: "published",
      deadlineDate: new Date("2026-09-15"),
      viewCount: 3,
      workSchedule: "full_time",
      workMode: "on_site",
    },
    {
      id: 17,
      title: "ينخنقوبهختثقبه٠تقث٠هب",
      company: "،يصخنثخينثخن",
      region: "كل المدن",
      description: "نتيصخهبتيهبتيه٩بتهقث",
      requirements: "خنيثوبنخيبهخيتثهتي",
      targetGender: "all",
      targetNationality: "all",
      contactMethod: "url",
      contactValue: "#",
      submitterName: "نسيهنصيهتثهيتث",
      submitterEmail: "jahznet@gmail.com",
      status: "published",
      viewCount: 1,
    },
    {
      id: 18,
      title: "كاتب خطابات احترافي",
      company: "منصة برقيات",
      region: "كل المناطق",
      city: "طريف",
      description: "نبحث عن كاتب خطابات احترافي للعمل في منصة برقيات عن بعد",
      requirements: "القدرة على استخدام الكمبيوتر برامج الـ Offices",
      targetGender: "all",
      targetNationality: "all",
      contactMethod: "url",
      contactValue: "#",
      submitterName: "متعب الشراري",
      submitterEmail: "jahznet@gmail.com",
      status: "published",
      deadlineDate: new Date("2026-05-30"),
      viewCount: 17,
      workSchedule: "full_time",
      workMode: "remote",
      trashedAt: new Date("2026-05-16T18:02:36.82"),
    },
  ];

  for (const record of MISSING_JOBS) {
    const existing = await db.select().from(employerJobs).where(eq(employerJobs.id, record.id));
    if (existing.length === 0) {
      await db.insert(employerJobs).values(record as any);
      console.log(`[migrate] Inserted employer job #${record.id}: ${record.title}`);
    }
  }
}

async function migrateSiteSettings() {
  const MISSING_SETTINGS = [
    { key: "MONTHLY_REVENUE_GOAL", value: "5000" },
  ];

  for (const setting of MISSING_SETTINGS) {
    const existing = await db.select().from(siteSettings).where(eq(siteSettings.key, setting.key));
    if (existing.length === 0) {
      await db.insert(siteSettings).values(setting);
      console.log(`[migrate] Inserted site_setting: ${setting.key}`);
    }
  }
}
