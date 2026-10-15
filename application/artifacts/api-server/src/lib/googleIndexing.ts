import { JWT } from "google-auth-library";
import { logger } from "./logger";

const SITE_BASE = "https://www.alwdaif.com";
const SITEMAP_URL = `${SITE_BASE}/sitemap.xml`;
const INDEXING_API = "https://indexing.googleapis.com/v3/urlNotifications:publish";
const SCOPES = ["https://www.googleapis.com/auth/indexing"];

// ── Sitemap Ping ────────────────────────────────────────────────
// Tells Google & Bing to re-crawl the sitemap immediately.
// No credentials or Search Console setup required.
async function pingSitemaps(): Promise<void> {
  const targets = [
    `https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`,
    `https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`,
  ];
  await Promise.allSettled(
    targets.map(url =>
      fetch(url, { method: "GET" })
        .then(res => {
          logger.info({ url, status: res.status }, "Sitemap ping sent");
        })
        .catch(err => {
          logger.warn({ url, err }, "Sitemap ping failed");
        })
    )
  );
}

// ── Google Indexing API ─────────────────────────────────────────
// Sends a direct URL notification to Google (faster than sitemap ping).
// Requires a verified service account owner in Google Search Console.
function getClient(): JWT | null {
  const raw = process.env.GOOGLE_INDEXING_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    const key = JSON.parse(raw);
    return new JWT({ email: key.client_email, key: key.private_key, scopes: SCOPES });
  } catch {
    logger.warn("GOOGLE_INDEXING_SERVICE_ACCOUNT_JSON could not be parsed");
    return null;
  }
}

async function notifyIndexingApi(url: string, type: "URL_UPDATED" | "URL_DELETED"): Promise<void> {
  const client = getClient();
  if (!client) return;
  try {
    const token = await client.getAccessToken();
    const res = await fetch(INDEXING_API, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token.token}` },
      body: JSON.stringify({ url, type }),
    });
    if (res.ok) {
      logger.info({ url, type }, "Google Indexing API notified");
    } else {
      const body = await res.text();
      logger.warn({ url, type, status: res.status, body }, "Google Indexing API error");
    }
  } catch (err) {
    logger.warn({ url, type, err }, "Google Indexing API call failed");
  }
}

// ── Public helpers ──────────────────────────────────────────────

export function notifyJobPublished(jobId: number | string): void {
  // Always ping sitemap (no credentials needed)
  pingSitemaps().catch(() => {});
  // Also try Indexing API if service account is configured
  notifyIndexingApi(`${SITE_BASE}/jobs/post/${jobId}`, "URL_UPDATED").catch(() => {});
}

export function notifyJobDeleted(jobId: number | string): void {
  pingSitemaps().catch(() => {});
  notifyIndexingApi(`${SITE_BASE}/jobs/post/${jobId}`, "URL_DELETED").catch(() => {});
}

export function notifyUrlUpdated(path: string): void {
  pingSitemaps().catch(() => {});
  notifyIndexingApi(`${SITE_BASE}${path}`, "URL_UPDATED").catch(() => {});
}
