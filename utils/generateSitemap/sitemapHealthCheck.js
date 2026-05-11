const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const SitemapAuditLog = require("../../models/sitemapAuditLog");

const SITEMAP_PATH = path.join(__dirname, "../../public/sitemap.xml");

// ── Config ──────────────────────────────────────────────────────
const CONCURRENCY = 10; // max parallel requests
const REQUEST_TIMEOUT = 10_000; // 10 seconds per URL
const BAD_STATUS_CODES = new Set([301, 302, 307, 308, 404, 410, 500, 502, 503]);

/**
 * Check a single URL — follows NO redirects, just reads the status.
 * Returns { url, statusCode, redirectTarget }
 */
async function checkUrl(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const res = await fetch(url, {
      method: "HEAD",
      redirect: "manual", // don't follow redirects — we want the raw status
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const redirectTarget = res.headers.get("location") || null;
    return { url, statusCode: res.status, redirectTarget };
  } catch (err) {
    console.warn(`[SitemapAudit] Failed to check ${url}: ${err.message}`);
    return { url, statusCode: 0, redirectTarget: null, error: err.message };
  }
}

/**
 * Run checks in batches to avoid overwhelming the server.
 * Calls onProgress(checked, total) after each batch completes.
 */
async function checkUrlsBatched(urls, onProgress) {
  const results = [];
  for (let i = 0; i < urls.length; i += CONCURRENCY) {
    const batch = urls.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(batch.map(checkUrl));
    results.push(...batchResults);

    // Report progress after each batch
    if (onProgress) {
      onProgress({
        phase: "checking",
        checked: results.length,
        total: urls.length,
        lastBatch: batchResults,
      });
    }

    // Small delay between batches to be gentle on the server
    if (i + CONCURRENCY < urls.length) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  return results;
}

/**
 * Extract all <loc> URLs from the sitemap XML file.
 */
function extractUrlsFromSitemap() {
  if (!fs.existsSync(SITEMAP_PATH)) {
    throw new Error("Sitemap file not found at " + SITEMAP_PATH);
  }
  const xml = fs.readFileSync(SITEMAP_PATH, "utf8");
  const urls = [];
  const regex = /<loc>([^<]+)<\/loc>/g;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    // Unescape XML entities back to real URL
    urls.push(
      match[1]
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
    );
  }
  return urls;
}

/**
 * Remove specific URLs from the sitemap XML file.
 * Removes the entire <url>...</url> block for each bad URL.
 */
function removeUrlsFromSitemap(urlsToRemove) {
  if (urlsToRemove.length === 0) return 0;

  let xml = fs.readFileSync(SITEMAP_PATH, "utf8");
  let removedCount = 0;

  for (const url of urlsToRemove) {
    // Escape for XML matching (the URL in the file is XML-escaped)
    const escapedUrl = url
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Match the full <url>...</url> block containing this loc
    const pattern = new RegExp(
      `\\s*<url>\\s*<loc>${escapeRegex(escapedUrl)}</loc>[\\s\\S]*?</url>`,
      "g"
    );

    const newXml = xml.replace(pattern, "");
    if (newXml !== xml) {
      removedCount++;
      xml = newXml;
    }
  }

  if (removedCount > 0) {
    fs.writeFileSync(SITEMAP_PATH, xml, { encoding: "utf8" });
  }

  return removedCount;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Main health check function.
 * 1. Reads all URLs from the sitemap
 * 2. Checks each URL for bad status codes (301, 404, etc.)
 * 3. Auto-removes bad URLs from the sitemap
 * 4. Logs everything to MongoDB
 *
 * @param {function} onProgress - Optional callback for progress events.
 *   Called with { phase, checked, total, ... } objects.
 *
 * Returns a summary object.
 */
async function runHealthCheck(onProgress) {
  const startTime = Date.now();
  const auditRunId = crypto.randomUUID();

  console.log(`[SitemapAudit] Starting health check (run: ${auditRunId})...`);

  // 1. Extract URLs
  const urls = extractUrlsFromSitemap();
  console.log(`[SitemapAudit] Checking ${urls.length} URLs...`);

  if (onProgress) {
    onProgress({
      phase: "started",
      auditRunId,
      total: urls.length,
      checked: 0,
    });
  }

  // 2. Check all URLs (with progress callback)
  const results = await checkUrlsBatched(urls, onProgress);

  // 3. Find bad URLs
  const badResults = results.filter(
    (r) => BAD_STATUS_CODES.has(r.statusCode) || r.statusCode === 0
  );

  console.log(
    `[SitemapAudit] Found ${badResults.length} bad URLs out of ${urls.length}`
  );

  if (onProgress) {
    onProgress({
      phase: "removing",
      total: urls.length,
      checked: urls.length,
      badUrls: badResults.length,
    });
  }

  if (badResults.length > 0) {
    // 4. Remove bad URLs from sitemap
    const urlsToRemove = badResults.map((r) => r.url);
    const removedCount = removeUrlsFromSitemap(urlsToRemove);
    console.log(`[SitemapAudit] Removed ${removedCount} URLs from sitemap`);

    // 5. Log to MongoDB
    const logEntries = badResults.map((r) => ({
      url: r.url,
      statusCode: r.statusCode,
      redirectTarget: r.redirectTarget,
      action: "removed",
      reason:
        r.statusCode === 0
          ? `Request failed: ${r.error || "timeout"}`
          : r.statusCode === 301 || r.statusCode === 308
          ? `Permanent redirect → ${r.redirectTarget || "unknown"}`
          : r.statusCode === 302 || r.statusCode === 307
          ? `Temporary redirect → ${r.redirectTarget || "unknown"}`
          : r.statusCode === 404
          ? "Page not found"
          : r.statusCode === 410
          ? "Page gone (410)"
          : `Server error (${r.statusCode})`,
      auditRunId,
    }));

    await SitemapAuditLog.insertMany(logEntries);
    console.log(`[SitemapAudit] Logged ${logEntries.length} entries to MongoDB`);
  }

  const elapsed = Date.now() - startTime;
  const summary = {
    success: true,
    auditRunId,
    totalChecked: urls.length,
    badUrls: badResults.length,
    removed: badResults.length,
    elapsed,
    details: badResults.map((r) => ({
      url: r.url,
      statusCode: r.statusCode,
      redirectTarget: r.redirectTarget,
    })),
  };

  console.log(
    `[SitemapAudit] Health check complete — ${badResults.length} removed in ${elapsed}ms`
  );

  if (onProgress) {
    onProgress({ phase: "done", ...summary });
  }

  return summary;
}

module.exports = { runHealthCheck };
