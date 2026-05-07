const express = require("express");
const crypto = require("crypto");
const {
  generateSitemap,
  forceRegeneration,
  queueRegeneration,
} = require("../utils/generateSitemap/generateSitemap");
const { runHealthCheck } = require("../utils/generateSitemap/sitemapHealthCheck");
const { isLoggedIn, isAdmin } = require("../middleware/middleware");
const path = require("path");
const fs = require("fs");

const router = express.Router({ mergeParams: true });

const SITEMAP_FILE = path.join(__dirname, "../public/sitemap.xml");
const ADMIN_SECRET = process.env.ADMIN_SECRET || "";
const SITEMAP_WEBHOOK_SECRET = process.env.SITEMAP_WEBHOOK_SECRET || "";

// ── Kill-switch: set SITEMAP_SOURCE=strapi to revert to Strapi sitemap ──
//    Default is "local" (serve from generated file).
//    Change to "strapi" in .env and restart to fall back instantly.
const SITEMAP_SOURCE = (process.env.SITEMAP_SOURCE || "local").toLowerCase();
const STRAPI_SITEMAP_URL = process.env.STRAPI_BASE_URL
  ? `${process.env.STRAPI_BASE_URL}/api/sitemaps`
  : "";

// ── Bearer token auth (same pattern as redirect cache admin) ─────
function bearerAuth(secret) {
  return (req, res, next) => {
    if (!secret) {
      return res
        .status(503)
        .json({ error: "Endpoint not configured — set the required secret env var" });
    }
    const authHeader = req.headers["authorization"] || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : "";
    if (!token) {
      return res.status(403).json({ error: "Forbidden — missing Authorization header" });
    }
    const tokenHash = crypto.createHash("sha256").update(token).digest();
    const secretHash = crypto.createHash("sha256").update(secret).digest();
    if (!crypto.timingSafeEqual(tokenHash, secretHash)) {
      return res.status(403).json({ error: "Forbidden — invalid token" });
    }
    next();
  };
}

// ── 1. Generate sitemap (admin session auth — existing endpoint) ─
router.route("/generateSitemap").get(isLoggedIn, isAdmin, async (req, res) => {
  const result = await generateSitemap();

  if (result.success) {
    return res.status(200).json({
      success: true,
      message: "Generated Successfully",
      urlCount: result.urlCount,
      elapsed: result.elapsed,
    });
  }
  return res.status(500).json({
    success: false,
    message: "Failed Generating Sitemap",
    error: result.error,
  });
});

// ── 2. Force regenerate (bearer token — for CLI / manual use) ────
//    POST /admin/generateSitemap/force
//    Authorization: Bearer <ADMIN_SECRET>
router
  .route("/generateSitemap/force")
  .post(bearerAuth(ADMIN_SECRET), async (req, res) => {
    const result = await forceRegeneration("admin-force");

    if (result.success) {
      // Return XML directly so you can inspect it immediately
      const xml = fs.readFileSync(SITEMAP_FILE, "utf8");
      res.set("Content-Type", "application/xml");
      res.set("X-Sitemap-Url-Count", String(result.urlCount));
      res.set("X-Sitemap-Elapsed-Ms", String(result.elapsed));
      return res.status(200).send(xml);
    }
    return res.status(500).json({
      success: false,
      message: "Force regeneration failed",
      error: result.error,
    });
  });

// ── 2b. Sitemap health check (bearer token — for CLI / manual use)
//    POST /admin/generateSitemap/health-check
//    Authorization: Bearer <ADMIN_SECRET>
router
  .route("/generateSitemap/health-check")
  .post(bearerAuth(ADMIN_SECRET), async (req, res) => {
    try {
      const result = await runHealthCheck();
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Health check failed",
        error: err.message,
      });
    }
  });

// ── 2b-alt. Sitemap health check (admin session auth — browser trigger)
//    GET /admin/generateSitemap/health-check
router
  .route("/generateSitemap/health-check")
  .get(isLoggedIn, isAdmin, async (req, res) => {
    try {
      const result = await runHealthCheck();
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Health check failed",
        error: err.message,
      });
    }
  });

// ── 2c. Get health check logs (admin session auth)
//    GET /admin/generateSitemap/audit-logs?limit=50&runId=xxx
router
  .route("/generateSitemap/audit-logs")
  .get(isLoggedIn, isAdmin, async (req, res) => {
    try {
      const SitemapAuditLog = require("../models/sitemapAuditLog");
      const limit = Math.min(parseInt(req.query.limit) || 50, 500);
      const query = req.query.runId ? { auditRunId: req.query.runId } : {};

      const logs = await SitemapAuditLog.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return res.status(200).json({ success: true, count: logs.length, logs });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch audit logs",
        error: err.message,
      });
    }
  });

// ── 3. Get current sitemap ───────────────────────────────────────
router.route("/sitemap").get(async (req, res) => {
  // ── Kill-switch: proxy from Strapi if SITEMAP_SOURCE=strapi ───
  if (SITEMAP_SOURCE === "strapi") {
    console.log("[Sitemap] Serving from Strapi (kill-switch active)");
    try {
      if (!STRAPI_SITEMAP_URL) {
        return res.status(503).json({ error: "STRAPI_BASE_URL not configured" });
      }
      const strapiRes = await fetch(STRAPI_SITEMAP_URL);
      if (!strapiRes.ok) {
        return res.status(502).json({ error: `Strapi returned ${strapiRes.status}` });
      }
      // Strapi returns JSON: { data: [{ content: "<xml>..." }] }
      const json = await strapiRes.json();
      const xml = json?.data?.[0]?.content;
      if (!xml) {
        return res.status(502).json({ error: "Empty sitemap content from Strapi" });
      }
      res.set("Content-Type", "application/xml");
      res.set("Cache-Control", "public, max-age=3600");
      res.set("X-Sitemap-Source", "strapi");
      return res.send(xml);
    } catch (err) {
      console.error("[Sitemap] Strapi fallback failed:", err.message);
      return res.status(502).json({ error: "Failed to fetch sitemap from Strapi" });
    }
  }

  // ── Default: serve from local file (generated by our system) ──
  try {
    if (fs.existsSync(SITEMAP_FILE)) {
      const data = fs.readFileSync(SITEMAP_FILE, "utf8");
      res.set("Content-Type", "application/xml");
      res.set("Cache-Control", "public, max-age=3600");
      res.set("X-Sitemap-Source", "local");
      return res.send(data);
    }
  } catch (err) {
    console.error("[Sitemap] Error reading sitemap file:", err.message);
  }

  // Fallback — try to generate on the fly
  console.log("[Sitemap] No sitemap file found, generating...");
  const result = await generateSitemap();
  if (result.success && fs.existsSync(SITEMAP_FILE)) {
    const data = fs.readFileSync(SITEMAP_FILE, "utf8");
    res.set("Content-Type", "application/xml");
    res.set("Cache-Control", "public, max-age=600");
    res.set("X-Sitemap-Source", "local");
    return res.send(data);
  }

  return res.status(503).json({ error: "Sitemap unavailable" });
});

// ── 4. Update sitemap manually (admin session auth) ──────────────
router.route("/sitemap").post(isLoggedIn, isAdmin, async (req, res) => {
  const { sitemap } = req.body;

  if (!sitemap) {
    return res.status(400).json({ message: "Sitemap content is required" });
  }

  fs.writeFile(SITEMAP_FILE, sitemap, "utf8", (err) => {
    if (err) {
      return res.status(500).json({ message: "Error updating sitemap" });
    }
    res.json({ message: "Sitemap updated successfully" });
  });
});

module.exports = router;

// ── 5. Webhook endpoint (for Strapi to call) ────────────────────
//    Mounted separately at /api/sitemap/regenerate in app.js
//    POST /api/sitemap/regenerate
//    Authorization: Bearer <SITEMAP_WEBHOOK_SECRET>
const webhookRouter = express.Router();

webhookRouter
  .route("/regenerate")
  .post(bearerAuth(SITEMAP_WEBHOOK_SECRET), async (req, res) => {
    const reason = req.body?.reason || "strapi-webhook";
    queueRegeneration(reason);

    return res.status(202).json({
      success: true,
      message: "Sitemap regeneration queued",
      reason,
    });
  });

module.exports.webhookRouter = webhookRouter;
