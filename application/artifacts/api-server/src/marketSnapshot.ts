import { storage } from "./storage";
import { generateMarketForecast } from "./ai";

function log(msg: string, ns = "cron") {
  const time = new Date().toLocaleTimeString("en-US", { hour12: false });
  console.log(`${time} [${ns}] ${msg}`);
}

export async function buildAndSaveDailyMarketSnapshot(): Promise<void> {
  const allJobs = await storage.getJobs();
  const now = new Date();

  const h24ago = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const d7ago  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000);

  const published = allJobs.filter(j => j.status === "published");

  const jobs24h = published.filter(j => j.createdAt && new Date(j.createdAt) >= h24ago);
  const jobs7d  = published.filter(j => j.createdAt && new Date(j.createdAt) >= d7ago);

  // Use 24h pool if enough jobs; fall back to 7-day; then to 30 most-recent published
  const recentPublished = [...published].sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  ).slice(0, 30);
  const pool = jobs24h.length >= 3 ? jobs24h
    : jobs7d.length >= 5 ? jobs7d
    : recentPublished;

  if (pool.length === 0) {
    log("No jobs available for daily market snapshot — skipping");
    return;
  }

  const periodStart = jobs24h.length >= 3 ? h24ago : d7ago;

  // Most viewed job within the pool (recent jobs only — no all-time winner)
  const topViewedJob = [...pool].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))[0];

  // Category counts from pool
  const civilCount     = pool.filter(j => j.category === "civil").length;
  const militaryCount  = pool.filter(j => j.category === "military").length;
  const companiesCount = pool.filter(j => j.category === "companies").length;
  const categoryMap: Record<string, number> = { civil: civilCount, military: militaryCount, companies: companiesCount };
  const topCategoryKey = Object.entries(categoryMap).sort((a, b) => b[1] - a[1])[0][0];
  const categoryLabels: Record<string, string> = {
    civil: "الوظائف المدنية",
    military: "الوظائف العسكرية",
    companies: "وظائف الشركات",
  };
  const topCategoryLabel = categoryLabels[topCategoryKey] || topCategoryKey;

  // Top hiring company from pool
  const companyCount: Record<string, { count: number; organizationId: number | null }> = {};
  pool.forEach(j => {
    const key = j.company || "غير محدد";
    if (!companyCount[key]) companyCount[key] = { count: 0, organizationId: j.organizationId ?? null };
    companyCount[key].count++;
  });
  const topCompanyEntry = Object.entries(companyCount).sort((a, b) => b[1].count - a[1].count)[0];
  const topCompany = topCompanyEntry
    ? { name: topCompanyEntry[0], count: topCompanyEntry[1].count, organizationId: topCompanyEntry[1].organizationId }
    : null;

  // Newest job from pool
  const newestJob = [...pool].sort((a, b) =>
    new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  )[0];

  const forecast = await generateMarketForecast({
    totalJobs: pool.length,
    civilCount: categoryMap.civil,
    militaryCount: categoryMap.military,
    companiesCount: categoryMap.companies,
    topCategory: topCategoryLabel,
    topCompany: topCompany?.name || "غير محدد",
    topJobTitle: topViewedJob?.title || "غير محدد",
    topJobCompany: topViewedJob?.company || "غير محدد",
    newestJobTitle: newestJob?.title || "غير محدد",
    newestJobCompany: newestJob?.company || "غير محدد",
  });

  const snapshotData = JSON.stringify({
    topViewedJob: topViewedJob
      ? { id: topViewedJob.id, title: topViewedJob.title, company: topViewedJob.company, viewCount: topViewedJob.viewCount, category: topViewedJob.category }
      : null,
    newestJob: newestJob
      ? { id: newestJob.id, title: newestJob.title, company: newestJob.company, category: newestJob.category }
      : null,
    topCompany: topCompany ?? null,
    topCategory: { key: topCategoryKey, label: topCategoryLabel, count: categoryMap[topCategoryKey] },
    counts: {
      total: pool.length,
      civil: categoryMap.civil,
      military: categoryMap.military,
      companies: categoryMap.companies,
    },
    forecast: forecast ?? null,
  });

  await storage.saveDailyMarketSnapshot({ periodStart, snapshotData });
  log("Daily market snapshot saved successfully");
}
