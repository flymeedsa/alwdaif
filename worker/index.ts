import { httpServerHandler } from "cloudflare:node";
import express, { type NextFunction, type Request, type Response } from "express";
import { createServer } from "node:http";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import { registerRoutes } from "../server/routes/routes";
import { seedCategories, ensureJobCategoryHierarchy, seedAds, seedFaq, seedBlogCategories } from "../server/seed";
import { migrateMissingData } from "../server/migrate-prod-data";
import { setDatabaseBinding } from "../server/db";
import { setObjectStorageBinding } from "../server/replit_integrations/object_storage/objectStorage";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  R2: R2Bucket;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

const app = express();
const server = createServer(app);
let initialization: Promise<void> | undefined;

app.set("trust proxy", 1);
app.use(compression());
app.use(cors({ origin: (origin, callback) => callback(null, origin || true), credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));
app.get("/api/healthz", (_req, res) => res.json({ status: "ok" }));

async function initialize() {
  await seedCategories();
  await seedBlogCategories();
  await ensureJobCategoryHierarchy();
  await seedAds();
  await seedFaq();
  await migrateMissingData();
  await registerRoutes(server, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) return next(err);
    res.status(err?.status || err?.statusCode || 500).json({ message: err?.message || "Internal Server Error" });
  });
}

server.listen(3000);
const expressHandler = httpServerHandler({ port: 3000 });

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    setDatabaseBinding(env.DB);
    setObjectStorageBinding(env.R2);
    initialization ||= initialize();
    await initialization;

    const url = new URL(request.url);
    const pathname = url.pathname;
    const isStaticRequest =
      (request.method === "GET" || request.method === "HEAD") &&
      !pathname.startsWith("/api/") &&
      !pathname.startsWith("/objects/") &&
      !pathname.startsWith("/uploads/") &&
      pathname !== "/robots.txt" &&
      pathname !== "/sitemap.xml" &&
      pathname !== "/rss.xml" &&
      pathname !== "/ws";

    if (isStaticRequest) {
      let asset = await env.ASSETS.fetch(request);
      const needsAppShell = asset.status === 404 || (asset.status >= 300 && asset.status < 400);
      const servesAppShell = needsAppShell || pathname === "/";
      if (needsAppShell) {
        // Cloudflare's HTML handling redirects /index.html to /. Fetching the
        // canonical root avoids leaking that redirect to deep SPA routes.
        const indexUrl = new URL("/", request.url);
        asset = await env.ASSETS.fetch(new Request(indexUrl, request));
      }
      if (servesAppShell) {
        const headers = new Headers(asset.headers);
        headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
        return new Response(asset.body, { status: asset.status, headers });
      }
      return asset;
    }

    return expressHandler.fetch(request, env, ctx);
  },
};
