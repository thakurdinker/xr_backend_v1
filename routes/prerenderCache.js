const express = require("express");
const router = express.Router();

// ── Proxy for frontend server's prerender redirect cache admin API ──
// The admin panel talks to xr_backend_v1, which forwards requests to
// the frontend server's /admin/redirect-cache/* endpoints.

const FRONTEND_SERVER_URL =
  process.env.MAIN_FRONTEND_URL || "https://www.xrealty.ae";
const ADMIN_SECRET = process.env.ADMIN_SECRET || "";

/**
 * Simple auth middleware — reuses the existing session-based auth
 * from the admin panel (req.user must exist and be logged in).
 */
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Not authenticated" });
  }
  next();
}

/**
 * Forward a request to the frontend server's redirect cache API.
 */
async function proxyToFrontend(method, endpoint, res) {
  try {
    const options = {
      method,
      headers: {
        Authorization: `Bearer ${ADMIN_SECRET}`,
        "Content-Type": "application/json",
      },
    };

    const response = await fetch(
      `${FRONTEND_SERVER_URL}/admin/redirect-cache${endpoint}`,
      options
    );

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    console.error("[PrerenderCache] Proxy error:", err.message);
    return res.status(502).json({
      success: false,
      message: `Failed to reach frontend server: ${err.message}`,
    });
  }
}

// GET /admin/prerender-cache/stats — cache stats
router.get("/stats", requireAuth, (req, res) => {
  return proxyToFrontend("GET", "/stats", res);
});

// DELETE /admin/prerender-cache/single?path=/property/some-slug/
// — remove a single cached redirect
router.delete("/single", requireAuth, (req, res) => {
  const urlPath = req.query.path;
  if (!urlPath) {
    return res
      .status(400)
      .json({ success: false, message: "Missing ?path= query parameter" });
  }
  return proxyToFrontend(
    "DELETE",
    `?path=${encodeURIComponent(urlPath)}`,
    res
  );
});

// DELETE /admin/prerender-cache/all — clear all cached redirects
router.delete("/all", requireAuth, (req, res) => {
  return proxyToFrontend("DELETE", "/all", res);
});

// ── Prerender.io API integration (purge + recache) ──────────────────
const PRERENDER_TOKEN = process.env.PRERENDER_TOKEN || "";
const SITE_BASE = process.env.SITE_BASE_URL || "https://www.xrealty.ae";

/**
 * POST /admin/prerender-cache/purge
 * Body: { url: "/property/some-slug/" }
 * Purges a URL from prerender.io's CDN cache.
 */
router.post("/purge", requireAuth, async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ success: false, message: "Missing url in request body" });
  }
  if (!PRERENDER_TOKEN) {
    return res.status(500).json({ success: false, message: "PRERENDER_TOKEN not configured on server" });
  }

  // Build full URL if a relative path was provided
  const fullUrl = url.startsWith("http") ? url : `${SITE_BASE}${url.startsWith("/") ? "" : "/"}${url}`;

  try {
    const response = await fetch("https://api.prerender.io/cache-clear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prerenderToken: PRERENDER_TOKEN, query: fullUrl }),
    });

    const data = await response.json();
    console.log(`[PrerenderCache] Purge ${fullUrl}:`, response.status, data);

    if (response.ok) {
      return res.json({ success: true, message: `Purged from prerender.io: ${fullUrl}`, data });
    }
    return res.status(response.status).json({ success: false, message: data.message || "Purge failed", data });
  } catch (err) {
    console.error("[PrerenderCache] Purge error:", err.message);
    return res.status(502).json({ success: false, message: `Prerender.io API error: ${err.message}` });
  }
});

/**
 * POST /admin/prerender-cache/recache
 * Body: { url: "/property/some-slug/" }
 * Triggers prerender.io to re-render and re-cache a URL.
 */
router.post("/recache", requireAuth, async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ success: false, message: "Missing url in request body" });
  }
  if (!PRERENDER_TOKEN) {
    return res.status(500).json({ success: false, message: "PRERENDER_TOKEN not configured on server" });
  }

  const fullUrl = url.startsWith("http") ? url : `${SITE_BASE}${url.startsWith("/") ? "" : "/"}${url}`;

  try {
    const response = await fetch("https://api.prerender.io/recache", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prerenderToken: PRERENDER_TOKEN, url: fullUrl }),
    });

    const data = await response.json();
    console.log(`[PrerenderCache] Recache ${fullUrl}:`, response.status, data);

    if (response.ok) {
      return res.json({ success: true, message: `Recache queued for: ${fullUrl}`, data });
    }
    return res.status(response.status).json({ success: false, message: data.message || "Recache failed", data });
  } catch (err) {
    console.error("[PrerenderCache] Recache error:", err.message);
    return res.status(502).json({ success: false, message: `Prerender.io API error: ${err.message}` });
  }
});

/**
 * POST /admin/prerender-cache/purge-and-recache
 * Body: { url: "/property/some-slug/" }
 * Purges from prerender.io cache first, then triggers a recache.
 * This is the correct workflow to force updated meta tags.
 */
router.post("/purge-and-recache", requireAuth, async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ success: false, message: "Missing url in request body" });
  }
  if (!PRERENDER_TOKEN) {
    return res.status(500).json({ success: false, message: "PRERENDER_TOKEN not configured on server" });
  }

  const fullUrl = url.startsWith("http") ? url : `${SITE_BASE}${url.startsWith("/") ? "" : "/"}${url}`;

  try {
    // Step 1: Purge
    const purgeRes = await fetch("https://api.prerender.io/cache-clear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prerenderToken: PRERENDER_TOKEN, query: fullUrl }),
    });
    const purgeData = await purgeRes.json();
    console.log(`[PrerenderCache] Purge+Recache step 1 (purge) ${fullUrl}:`, purgeRes.status, purgeData);

    if (!purgeRes.ok) {
      return res.status(purgeRes.status).json({
        success: false,
        step: "purge",
        message: purgeData.message || "Purge step failed",
        data: purgeData,
      });
    }

    // Step 2: Recache (small delay to ensure purge propagates)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const recacheRes = await fetch("https://api.prerender.io/recache", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prerenderToken: PRERENDER_TOKEN, url: fullUrl }),
    });
    const recacheData = await recacheRes.json();
    console.log(`[PrerenderCache] Purge+Recache step 2 (recache) ${fullUrl}:`, recacheRes.status, recacheData);

    if (recacheRes.ok) {
      return res.json({
        success: true,
        message: `Purged and recache queued for: ${fullUrl}`,
        purge: purgeData,
        recache: recacheData,
      });
    }
    return res.status(recacheRes.status).json({
      success: false,
      step: "recache",
      message: recacheData.message || "Recache step failed",
      purge: purgeData,
      data: recacheData,
    });
  } catch (err) {
    console.error("[PrerenderCache] Purge+Recache error:", err.message);
    return res.status(502).json({ success: false, message: `Prerender.io API error: ${err.message}` });
  }
});

module.exports = router;
