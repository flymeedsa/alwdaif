import { env } from "cloudflare:workers";
import { httpServerHandler } from "cloudflare:node";
import express, { type NextFunction, type Request, type Response } from "express";
import { createServer } from "node:http";
import cors from "cors";
import compression from "compression";
import { registerRoutes } from "../server/routes/routes";
import { seedCategories, ensureJobCategoryHierarchy, seedAds, seedFaq, seedBlogCategories } from "../server/seed";
import { migrateMissingData } from "../server/migrate-prod-data";

const app = express();
const server = createServer(app);

app.set("trust proxy", 1);
app.use(compression());
app.use(cors({ origin: (origin, callback) => callback(null, origin || true), credentials: true }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));

app.get("/api/healthz", (_req, res) => res.json({ status: "ok" }));

await seedCategories();
await seedBlogCategories();
await ensureJobCategoryHierarchy();
await seedAds();
await seedFaq();
await migrateMissingData();
await registerRoutes(server, app);

app.use(async (req, res, next) => {
  try {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    const incoming = new URL(req.originalUrl || req.url, "https://alwdaif.local");
    let asset = await env.ASSETS.fetch(new Request(new URL(incoming.pathname, "https://assets.local")));
    if (asset.status === 404) {
      asset = await env.ASSETS.fetch(new Request("https://assets.local/index.html"));
    }
    res.status(asset.status);
    asset.headers.forEach((value, key) => res.setHeader(key, value));
    res.send(Buffer.from(await asset.arrayBuffer()));
  } catch (error) {
    next(error);
  }
});

app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) return next(err);
  res.status(err?.status || err?.statusCode || 500).json({ message: err?.message || "Internal Server Error" });
});

server.listen(3000);

export default httpServerHandler({ port: 3000 });
