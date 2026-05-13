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

module.exports = router;
