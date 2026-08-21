import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATIC_DIR = path.join(__dirname, "dist", "public");
const PORT = parseInt(process.env.PORT || "22860");
const API_BASE = "http://localhost:8080";
const SITE_URL = "https://www.alwdaif.com";
const SITE_TITLE = "منصة اعلانات الوظائف";
const SITE_DESC = "أحدث الوظائف المدنية والعسكرية ووظائف الشركات في المملكة العربية السعودية. ابحث عن وظيفتك المناسبة.";
const SITE_IMAGE = `${SITE_URL}/opengraph.jpg`;

const BOT_RE = /googlebot|google-inspectiontool|adsbot-google|bingbot|yandexbot|duckduckbot|baiduspider|facebookexternalhit|facebookcatalog|whatsapp|twitterbot|telegrambot|linkedinbot|slackbot|discordbot|applebot|msnbot|ahrefsbot|semrushbot|ia_archiver|rogerbot|showyoubot|outbrain|pinterest|vkshare|w3c_validator/i;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain",
  ".xml": "application/xml",
  ".webmanifest": "application/manifest+json",
  ".map": "application/json",
};

function esc(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function toAbsImg(url) {
  if (!url) return SITE_IMAGE;
  if (url.startsWith("http")) return url;
  const p = url.startsWith("/api/objects") ? url : `/api/objects${url.replace(/^\/objects/, "")}`;
  return `${SITE_URL}${p}`;
}

function stripHtml(s) {
  return (s || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function buildJobHtml(job, org, relatedJobs = []) {
  const base = SITE_URL;
  const pageUrl = `${base}/jobs/post/${job.id}`;
  const imageUrl = toAbsImg(org?.logo || job.logo || null);
  const titleText = esc(`${job.title} | إعلانات الوظائف`);
  const fullBody = job.description ? stripHtml(job.description) : "";
  const rawDesc = fullBody.slice(0, 155) || `وظيفة ${job.title} في ${job.company} — المملكة العربية السعودية`;
  const descText = esc(rawDesc);
  const cityText = esc(job.location || "المملكة العربية السعودية");
  const company = esc(job.company || "");
  const datePosted = job.createdAt ? new Date(job.createdAt).toISOString() : new Date().toISOString();

  const categoryToType = {
    civil: "FULL_TIME", military: "FULL_TIME",
    companies: "FULL_TIME", employer: "FULL_TIME",
    organizations: "FULL_TIME", general: "FULL_TIME",
  };
  const empType = categoryToType[job.category] || "FULL_TIME";

  const categoryLabel = { civil: "وظائف مدنية", military: "وظائف عسكرية", companies: "وظائف شركات", organizations: "وظائف جهات", general: "وظائف" }[job.category] || "وظائف";
  const categoryPath = { civil: "civil", military: "military", companies: "companies", organizations: "organizations" }[job.category] || "";

  const breadcrumbLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "الرئيسية", item: base },
      { "@type": "ListItem", position: 2, name: categoryLabel, item: `${base}/jobs${categoryPath ? "/" + categoryPath : ""}` },
      { "@type": "ListItem", position: 3, name: job.title, item: pageUrl },
    ],
  });

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "JobPosting",
    identifier: { "@type": "PropertyValue", name: "alwdaif", value: String(job.id) },
    title: job.title,
    description: fullBody || rawDesc,
    datePosted,
    ...(job.deadlineDate ? { validThrough: new Date(job.deadlineDate).toISOString() } : {}),
    ...(job.updatedAt ? { dateModified: new Date(job.updatedAt).toISOString() } : {}),
    hiringOrganization: {
      "@type": "Organization",
      name: job.company,
      sameAs: org?.website || null,
      ...(org?.logo ? { logo: { "@type": "ImageObject", url: toAbsImg(org.logo) } } : {}),
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressCountry: "SA",
        addressLocality: job.location || "المملكة العربية السعودية",
        addressRegion: "SA",
      },
    },
    url: pageUrl,
    ...(job.applyUrl ? { directApply: true } : {}),
    employmentType: empType,
  });

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<meta name="robots" content="index, follow"/>
<title>${titleText}</title>
<meta name="description" content="${descText}"/>
<link rel="canonical" href="${esc(pageUrl)}"/>
<link rel="alternate" type="application/rss+xml" title="وظائف جديدة - إعلانات الوظائف" href="${SITE_URL}/rss.xml"/>
<meta property="og:title" content="${titleText}"/>
<meta property="og:description" content="${descText}"/>
<meta property="og:image" content="${esc(imageUrl)}"/>
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>
<meta property="og:url" content="${esc(pageUrl)}"/>
<meta property="og:type" content="website"/>
<meta property="og:site_name" content="منصة إعلانات الوظائف"/>
<meta property="og:locale" content="ar_SA"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:site" content="@alwdaif1"/>
<meta name="twitter:title" content="${titleText}"/>
<meta name="twitter:description" content="${descText}"/>
<meta name="twitter:image" content="${esc(imageUrl)}"/>
<script type="application/ld+json">${jsonLd}</script>
<script type="application/ld+json">${breadcrumbLd}</script>
</head>
<body>
<main>
<nav aria-label="breadcrumb">
  <a href="${base}">الرئيسية</a> › <a href="${base}/jobs${categoryPath ? "/" + categoryPath : ""}">${categoryLabel}</a> › ${esc(job.title)}
</nav>
<h1>${esc(job.title)}</h1>
${company ? `<p><strong>الجهة:</strong> ${company}</p>` : ""}
${cityText ? `<p><strong>المدينة:</strong> ${cityText}</p>` : ""}
<p>${esc(fullBody.slice(0, 3000))}</p>
${relatedJobs.length > 0 ? `<section><h2>وظائف مشابهة</h2><ul>${relatedJobs.map(r => `<li><a href="${base}/jobs/post/${r.id}">${esc(r.title)} — ${esc(r.company)}</a></li>`).join("")}</ul></section>` : ""}
<p><a href="${base}/jobs${categoryPath ? "/" + categoryPath : ""}">عرض جميع ${categoryLabel}</a></p>
</main>
</body>
</html>`;
}

function buildBlogHtml(post) {
  const base = SITE_URL;
  const pageUrl = `${base}/blog/${post.slug || post.id}`;
  const imageUrl = toAbsImg(post.image || null);
  const titleText = esc(`${post.title} | إعلانات الوظائف`);
  const fullBody = stripHtml(post.content || "");
  const rawDesc = post.excerpt || fullBody.slice(0, 155) || SITE_DESC;
  const descText = esc(rawDesc);
  const author = esc(post.authorName || "إعلانات الوظائف");
  const datePublished = post.publishedAt ? new Date(post.publishedAt).toISOString() : new Date().toISOString();
  const dateModified = post.updatedAt ? new Date(post.updatedAt).toISOString() : datePublished;

  const breadcrumbLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "الرئيسية", item: base },
      { "@type": "ListItem", position: 2, name: "المدونة", item: `${base}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: pageUrl },
    ],
  });

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: rawDesc,
    image: { "@type": "ImageObject", url: imageUrl, width: 1200, height: 630 },
    url: pageUrl,
    datePublished,
    dateModified,
    author: { "@type": "Person", name: post.authorName || "إعلانات الوظائف" },
    publisher: {
      "@type": "Organization",
      name: "منصة إعلانات الوظائف",
      url: base,
      logo: { "@type": "ImageObject", url: `${base}/logo.png`, width: 512, height: 512 },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
  });

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<meta name="robots" content="index, follow"/>
<title>${titleText}</title>
<meta name="description" content="${descText}"/>
<link rel="canonical" href="${esc(pageUrl)}"/>
<link rel="alternate" type="application/rss+xml" title="مقالات جديدة - إعلانات الوظائف" href="${SITE_URL}/rss.xml"/>
<meta property="og:title" content="${titleText}"/>
<meta property="og:description" content="${descText}"/>
<meta property="og:image" content="${esc(imageUrl)}"/>
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>
<meta property="og:url" content="${esc(pageUrl)}"/>
<meta property="og:type" content="article"/>
<meta property="og:article:published_time" content="${datePublished}"/>
<meta property="og:article:modified_time" content="${dateModified}"/>
<meta property="og:site_name" content="منصة إعلانات الوظائف"/>
<meta property="og:locale" content="ar_SA"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:site" content="@alwdaif1"/>
<meta name="twitter:title" content="${titleText}"/>
<meta name="twitter:description" content="${descText}"/>
<meta name="twitter:image" content="${esc(imageUrl)}"/>
<script type="application/ld+json">${jsonLd}</script>
<script type="application/ld+json">${breadcrumbLd}</script>
</head>
<body>
<main>
<nav aria-label="breadcrumb">
  <a href="${base}">الرئيسية</a> › <a href="${base}/blog">المدونة</a> › ${esc(post.title)}
</nav>
<h1>${esc(post.title)}</h1>
${author ? `<p><strong>الكاتب:</strong> ${author}</p>` : ""}
<p>${esc(fullBody.slice(0, 3000))}</p>
<p><a href="${base}/blog">عرض جميع المقالات</a></p>
</main>
</body>
</html>`;
}

function buildOrgHtml(org, reqPath) {
  const base = SITE_URL;
  const pageUrl = `${base}${reqPath}`;
  const imageUrl = toAbsImg(org.logo || null);
  const titleText = esc(`${org.name} | إعلانات الوظائف`);
  const rawDesc = org.description
    ? stripHtml(org.description).slice(0, 155)
    : `وظائف ${org.name} في المملكة العربية السعودية`;
  const descText = esc(rawDesc);

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: org.name,
    description: rawDesc,
    url: pageUrl,
    ...(imageUrl !== SITE_IMAGE ? { logo: { "@type": "ImageObject", url: imageUrl } } : {}),
    address: { "@type": "PostalAddress", addressCountry: "SA" },
  });

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<meta name="robots" content="index, follow"/>
<title>${titleText}</title>
<meta name="description" content="${descText}"/>
<link rel="canonical" href="${esc(pageUrl)}"/>
<link rel="alternate" type="application/rss+xml" title="وظائف جديدة - إعلانات الوظائف" href="${SITE_URL}/rss.xml"/>
<meta property="og:title" content="${titleText}"/>
<meta property="og:description" content="${descText}"/>
<meta property="og:image" content="${esc(imageUrl)}"/>
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>
<meta property="og:url" content="${esc(pageUrl)}"/>
<meta property="og:type" content="website"/>
<meta property="og:site_name" content="منصة إعلانات الوظائف"/>
<meta property="og:locale" content="ar_SA"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:site" content="@alwdaif1"/>
<meta name="twitter:title" content="${titleText}"/>
<meta name="twitter:description" content="${descText}"/>
<meta name="twitter:image" content="${esc(imageUrl)}"/>
<script type="application/ld+json">${jsonLd}</script>
</head>
<body>
<main>
<h1>${esc(org.name)}</h1>
${rawDesc ? `<p>${esc(rawDesc)}</p>` : ""}
</main>
</body>
</html>`;
}

function buildDefaultHtml({ title, description, image, url }) {
  const t = esc(title || SITE_TITLE);
  const d = esc(description || SITE_DESC);
  const i = esc(toAbsImg(image));
  const u = esc(url || SITE_URL);
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<meta name="robots" content="index, follow"/>
<title>${t}</title>
<meta name="description" content="${d}"/>
<link rel="canonical" href="${u}"/>
<link rel="alternate" type="application/rss+xml" title="وظائف جديدة - إعلانات الوظائف" href="${SITE_URL}/rss.xml"/>
<meta property="og:title" content="${t}"/>
<meta property="og:description" content="${d}"/>
<meta property="og:image" content="${i}"/>
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>
<meta property="og:url" content="${u}"/>
<meta property="og:type" content="website"/>
<meta property="og:site_name" content="منصة إعلانات الوظائف"/>
<meta property="og:locale" content="ar_SA"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:site" content="@alwdaif1"/>
<meta name="twitter:title" content="${t}"/>
<meta name="twitter:description" content="${d}"/>
<meta name="twitter:image" content="${i}"/>
</head>
<body></body>
</html>`;
}

async function buildBotHtml(reqPath) {
  try {
    const jobMatch = reqPath.match(/^\/jobs\/post\/(\d+)/);
    if (jobMatch) {
      const r = await fetch(`${API_BASE}/api/jobs/${jobMatch[1]}`);
      if (r.ok) {
        const job = await r.json();
        const [orgRes, relatedRes] = await Promise.allSettled([
          job.organizationId ? fetch(`${API_BASE}/api/organizations/${job.organizationId}`) : Promise.resolve(null),
          fetch(`${API_BASE}/api/jobs?category=${encodeURIComponent(job.category || "")}&limit=5&status=published`),
        ]);
        const org = (orgRes.status === "fulfilled" && orgRes.value?.ok) ? await orgRes.value.json() : null;
        let relatedJobs = [];
        if (relatedRes.status === "fulfilled" && relatedRes.value?.ok) {
          const data = await relatedRes.value.json();
          const list = Array.isArray(data) ? data : (data.jobs || data.data || []);
          relatedJobs = list.filter((j) => j.id !== job.id).slice(0, 5);
        }
        return buildJobHtml(job, org, relatedJobs);
      }
    }

    const blogMatch = reqPath.match(/^\/blog\/([^/?]+)/);
    if (blogMatch) {
      const r = await fetch(`${API_BASE}/api/blog/${encodeURIComponent(blogMatch[1])}`);
      if (r.ok) {
        const post = await r.json();
        return buildBlogHtml(post);
      }
    }

    const orgMatch = reqPath.match(/^\/(?:jobs\/)?organizations\/(\d+)/);
    if (orgMatch) {
      const r = await fetch(`${API_BASE}/api/organizations/${orgMatch[1]}`);
      if (r.ok) {
        const org = await r.json();
        if (org && org.id) {
          return buildOrgHtml(org, reqPath);
        }
      }
    }
  } catch (_) {}

  return buildDefaultHtml({
    title: SITE_TITLE,
    description: SITE_DESC,
    image: SITE_IMAGE,
    url: `${SITE_URL}${reqPath}`,
  });
}

function sendFile(res, filePath, fallback) {
  const ext = path.extname(filePath).toLowerCase();
  const ct = MIME[ext] || "application/octet-stream";
  const stream = fs.createReadStream(filePath);
  stream.once("error", () => {
    if (fallback) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      fs.createReadStream(fallback).pipe(res);
    } else {
      res.writeHead(404);
      res.end("Not found");
    }
  });
  res.writeHead(200, { "Content-Type": ct });
  stream.pipe(res);
}

const INDEX = path.join(STATIC_DIR, "index.html");

http.createServer(async (req, res) => {
  const ua = req.headers["user-agent"] || "";
  const reqPath = (req.url || "/").split("?")[0];

  if (BOT_RE.test(ua)) {
    try {
      const html = await buildBotHtml(reqPath);
      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      });
      res.end(html);
    } catch (_) {
      res.writeHead(500);
      res.end("Error");
    }
    return;
  }

  const filePath = path.join(STATIC_DIR, reqPath);

  if (!filePath.startsWith(STATIC_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.stat(filePath, (err, stat) => {
    if (!err && !stat.isDirectory()) {
      sendFile(res, filePath, INDEX);
    } else if (!err && stat.isDirectory()) {
      const idx = path.join(filePath, "index.html");
      fs.stat(idx, (e2) => {
        if (!e2) sendFile(res, idx, INDEX);
        else sendFile(res, INDEX, null);
      });
    } else {
      sendFile(res, INDEX, null);
    }
  });
}).listen(PORT, "0.0.0.0", () => {
  console.log(`[alwdaif] server on port ${PORT}`);
});
