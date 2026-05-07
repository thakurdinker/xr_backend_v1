/**
 * Middleware that queues a sitemap regeneration after successful
 * write operations (POST, PUT, DELETE) on content-related routes.
 *
 * Usage: app.use("/admin", sitemapTrigger, propertyRouter);
 *        — or attach to individual routes.
 */
const { queueRegeneration } = require("../utils/generateSitemap/generateSitemap");

const TRIGGER_METHODS = new Set(["POST", "PUT", "DELETE"]);

/**
 * Express middleware — listens for the response to finish and,
 * if the request was a write operation that succeeded (2xx),
 * queues a debounced sitemap regeneration.
 */
function sitemapTrigger(req, res, next) {
  if (!TRIGGER_METHODS.has(req.method)) {
    return next();
  }

  // Hook into the response finish event
  res.on("finish", () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const reason = `${req.method} ${req.originalUrl}`;
      queueRegeneration(reason);
    }
  });

  next();
}

module.exports = sitemapTrigger;
