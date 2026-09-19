const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const Community = require("../../models/community");
const Property = require("../../models/properties");
const Content = require("../../models/content");
const Redirect = require("../../models/redirect");
const Sitemap = require("../../models/sitemap");
const seoUrlMap = require("../seoUrlMap");

dotenv.config({ path: path.resolve(__dirname, "../../vars/.env") });

// ── Config ───────────────────────────────────────────────────────
const SITE_URL = "https://www.xrealty.ae";
const STRAPI_BASE_URL =
  process.env.STRAPI_BASE_URL || "https://admin-v1.xrealty.ae";
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN || "";

const SITEMAP_PATH = path.join(__dirname, "../../public/sitemap.xml");

// ── Frontend cache revalidation ──────────────────────────────────
// The Next.js frontend serves /sitemap.xml by proxying this generated sitemap
// (the admin/sitemap endpoint) behind a ~1h cache (edge s-maxage + Next
// data-cache, tag "sitemap"). Without a nudge, a fresh regeneration takes up to
// an hour to appear live. A fire-and-forget POST to /api/revalidate busts the
// "sitemap" tag so the live sitemap updates within seconds. Mirrors
// routes/redirect.js's revalidateFrontend(); no-ops when REVALIDATE_SECRET is
// unset (the frontend then falls back to its cache TTL).
const MAIN_FRONTEND_URL =
  process.env.MAIN_FRONTEND_URL || "https://www.xrealty.ae";
const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET || "";

function revalidateFrontendSitemap() {
  if (!REVALIDATE_SECRET) return; // not configured → rely on the frontend cache TTL
  // POST to the trailing-slash URL directly (site is trailingSlash:true, so the
  // bare path 308-redirects) and bust BOTH the cache tag AND the route path:
  //   - tags:["sitemap"]      → the data cache of the admin/sitemap fetch
  //   - paths:["/sitemap.xml"]→ the route's own response/edge cache (the route
  //                             sets s-maxage, which the tag alone may not purge)
  fetch(`${MAIN_FRONTEND_URL}/api/revalidate/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret: REVALIDATE_SECRET,
      tags: ["sitemap"],
      paths: ["/sitemap.xml"],
    }),
    signal: AbortSignal.timeout(5000),
  }).catch((err) => {
    console.error("[Sitemap] frontend revalidate failed:", err.message);
  });
}

/**
 * Fetch the static page list owned by the frontend (/api/static-routes), so a
 * page added in the Next.js app flows into the sitemap without a backend edit.
 * Returns a validated [{ path, changefreq, priority }] array, or null on any
 * failure — the caller then falls back to the hardcoded STATIC_PAGES, so the
 * sitemap never loses its static pages if the frontend is briefly unreachable.
 * `cache: no-store` so each regen sees the currently-deployed list.
 */
async function fetchFrontendStaticRoutes() {
  try {
    const res = await fetch(`${MAIN_FRONTEND_URL}/api/static-routes/`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      console.warn(`[Sitemap] static-routes fetch failed (${res.status}); using built-in list`);
      return null;
    }
    const data = await res.json();
    const routes = Array.isArray(data?.routes) ? data.routes : null;
    if (!routes) return null;
    const cleaned = routes
      .filter((r) => r && typeof r.path === "string" && r.path.startsWith("/"))
      .map((r) => ({
        path: r.path,
        changefreq: typeof r.changefreq === "string" ? r.changefreq : "weekly",
        priority: typeof r.priority === "string" ? r.priority : "0.8",
      }));
    return cleaned.length > 0 ? cleaned : null; // empty/garbage → fall back
  } catch (err) {
    console.warn(`[Sitemap] static-routes fetch errored (${err.message}); using built-in list`);
    return null;
  }
}

// ── Strapi fetch helper ──────────────────────────────────────────
async function fetchStrapi(endpoint) {
  const headers = { "Content-Type": "application/json" };
  if (STRAPI_API_TOKEN) {
    headers["Authorization"] = `Bearer ${STRAPI_API_TOKEN}`;
  }

  try {
    const res = await fetch(`${STRAPI_BASE_URL}${endpoint}`, { headers });
    if (!res.ok) {
      console.warn(
        `[Sitemap] Strapi fetch failed: ${endpoint} → ${res.status}`
      );
      return [];
    }
    const json = await res.json();
    return json?.data || [];
  } catch (err) {
    console.warn(`[Sitemap] Strapi fetch error: ${endpoint} → ${err.message}`);
    return [];
  }
}

/**
 * Fetch all pages from a Strapi collection using pagination.
 * Returns a flat array of all items.
 */
async function fetchStrapiAll(endpoint, params = "") {
  const allItems = [];
  let page = 1;
  const pageSize = 100;

  while (true) {
    const sep = params ? "&" : "?";
    const paginationParams = `${params ? "?" + params + sep : "?"}pagination[page]=${page}&pagination[pageSize]=${pageSize}`;
    const items = await fetchStrapi(`${endpoint}${paginationParams}`);

    if (!items || items.length === 0) break;
    allItems.push(...items);

    if (items.length < pageSize) break; // last page
    page++;
  }

  return allItems;
}

// ── Static pages ─────────────────────────────────────────────────
const STATIC_PAGES = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/about-us/", changefreq: "weekly", priority: "0.9" },
  {
    path: "/contact-us-dubai-real-estate-agency/",
    changefreq: "weekly",
    priority: "0.9",
  },
  { path: "/privacy-policy/", changefreq: "weekly", priority: "0.8" },
  { path: "/agent/", changefreq: "daily", priority: "0.9" },
  { path: "/real-estate-news/", changefreq: "daily", priority: "0.9" },
  { path: "/blogs/", changefreq: "daily", priority: "0.9" },
  // NOTE: bare /dubai-properties/ is intentionally absent — the frontend
  // 301-redirects it to /off-plan-projects-for-sale-in-dubai/ (a sitemap must
  // not list redirecting URLs). The canonical by-type listing pages are added
  // below.
  { path: "/customer-reviews/", changefreq: "daily", priority: "0.9" },
  { path: "/careers/", changefreq: "weekly", priority: "0.8" },
  { path: "/guides/", changefreq: "weekly", priority: "0.9" },
  { path: "/our-publications/", changefreq: "weekly", priority: "0.8" },
  { path: "/living-experience-dubai/", changefreq: "weekly", priority: "0.8" },
  { path: "/living-experience-dubai/beachfront/", changefreq: "weekly", priority: "0.8" },
  { path: "/developer/", changefreq: "daily", priority: "0.9" },
  { path: "/property-search/", changefreq: "daily", priority: "0.8" },
  // Canonical by-type listing pages. The /dubai-properties/<type> shortcut URLs
  // 301-redirect to these clean slugs (see frontend redirects.ts), so the clean
  // slugs are the sitemap canonicals. Dropped here vs the old list:
  // /dubai-properties/<type> (redirecting), duplex-/twin-villas- and
  // for-sale/type-off-plan-villa-projects (no frontend route → 404). The
  // /dubai-properties/[saleType]/[type] filtered space is open-ended and
  // self-canonical, so it is not enumerated.
  { path: "/apartments-for-sale-in-dubai/", changefreq: "daily", priority: "0.9" },
  { path: "/villas-for-sale-in-dubai/", changefreq: "daily", priority: "0.9" },
  { path: "/townhouse-for-sale-in-dubai/", changefreq: "daily", priority: "0.9" },
  { path: "/penthouse-for-sale-in-dubai/", changefreq: "daily", priority: "0.9" },
  { path: "/mansions-for-sale-in-dubai/", changefreq: "daily", priority: "0.9" },
  { path: "/off-plan-projects-for-sale-in-dubai/", changefreq: "daily", priority: "0.9" },
];

// ── XML helpers ──────────────────────────────────────────────────
function escapeXml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function urlEntry(loc, lastmod, changefreq = "daily", priority = "0.9") {
  return `  <url>
    <loc>${escapeXml(SITE_URL + loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

function normalizePath(p) {
  // Ensure leading slash, trailing slash, decode
  let normalized = decodeURIComponent(p);
  if (!normalized.startsWith("/")) normalized = "/" + normalized;
  if (!normalized.endsWith("/")) normalized = normalized + "/";
  return normalized.toLowerCase();
}

// ── Article canonical paths ──────────────────────────────────────
// category slug → hub base path. Canonical article URLs nest under their
// sub-category when one is set (/{hub}/{sub}/{slug}/), matching the frontend's
// articlePath(); flat (/{hub}/{slug}/) otherwise.
const HUB_BASE = {
  news: "/real-estate-news/",
  blog: "/blogs/",
  publications: "/our-publications/",
};
const HUB_BASES = Object.values(HUB_BASE);

/**
 * Read an article's own sub-categorised path out of its Strapi `seo.canonicalUrl`,
 * used only as a fallback when the `sub_category` relation is empty (a handful of
 * articles carry the sub-category in this field alone, and the frontend routes them
 * by it — /blogs/<slug>/ then 308s to the nested form).
 *
 * canonicalUrl is a hand-edited SEO field, so it is trusted only when it plainly
 * describes THIS article's location: an on-site absolute URL of the shape
 * /{known-hub}/{sub}/{this-slug}/. Editorial cross-canonicals pointing at a
 * different (often deleted) article, bare hub URLs and typo'd schemes are rejected
 * — the caller then falls back to the derived path. Returns { path, subSlug } or null.
 */
function subPathFromCanonicalUrl(canonicalUrl, slug) {
  if (typeof canonicalUrl !== "string") return null;
  const trimmed = canonicalUrl.trim();
  if (!trimmed.startsWith(`${SITE_URL}/`)) return null;

  let p = trimmed.slice(SITE_URL.length).split("?")[0].split("#")[0];
  if (!p.endsWith("/")) p += "/";

  const segments = p.split("/").filter(Boolean);
  if (segments.length !== 3) return null; // not /{hub}/{sub}/{slug}/
  if (!HUB_BASES.includes(`/${segments[0]}/`)) return null;

  let leaf;
  try {
    leaf = decodeURIComponent(segments[2]);
  } catch {
    return null; // malformed percent-encoding
  }
  if (leaf.toLowerCase() !== slug.toLowerCase()) return null; // another article

  return { path: p, subSlug: decodeURIComponent(segments[1]) };
}

/**
 * The single URL an article resolves to today, derived from the same live Strapi
 * fields the frontend uses (category + sub_category, then seo.canonicalUrl).
 * Never a stored legacy path — so an article that is re-filed moves in the sitemap
 * on the next regeneration instead of leaving a redirecting URL behind.
 * Returns { path, subSlug } (subSlug null when the article sits flat under its hub).
 */
function resolveArticlePath(article, hubBase, slug) {
  const encSlug = encodeURIComponent(slug);

  const subSlug = article.sub_category?.slug;
  if (subSlug) {
    return {
      path: `${hubBase}${encodeURIComponent(subSlug)}/${encSlug}/`,
      subSlug,
    };
  }

  const fromSeo = subPathFromCanonicalUrl(article.seo?.canonicalUrl, slug);
  if (fromSeo) return fromSeo;

  return { path: `${hubBase}${encSlug}/`, subSlug: null };
}

// ── Main generator ───────────────────────────────────────────────
const generateSitemap = async (onProgress) => {
  const startTime = Date.now();
  console.log("[Sitemap] Generation started...");

  const STEPS = [
    "redirects",
    "static-pages",
    "seo-pages",
    "properties",
    "communities",
    "developers",
    "agents",
    "blogs",
    "news",
    "guides",
    "articles",
    "dedup",
    "write",
  ];
  let currentStepIdx = 0;

  function reportProgress(step, detail = {}) {
    if (!onProgress) return;
    currentStepIdx = STEPS.indexOf(step);
    onProgress({
      phase: step,
      stepNumber: currentStepIdx + 1,
      totalSteps: STEPS.length,
      elapsed: Date.now() - startTime,
      ...detail,
    });
  }

  // Track all URLs to prevent duplicates — keyed by normalized path
  const urlMap = new Map();

  // seoUrlMap pages are never pruned — the seoUrlMap middleware intercepts
  // those requests before any redirect or article route can claim them, so
  // they are always live 200s. Used by both the article-canonical pruning
  // (section 9) and the redirect-source pruning (section 10).
  const protectedPaths = new Set(
    Object.keys(seoUrlMap).map((p) => normalizePath(p))
  );

  function addUrl(rawPath, lastmod, changefreq = "daily", priority = "0.9") {
    const normalized = normalizePath(rawPath);
    // Only add if not already present (first-add wins, so add higher-priority sources first)
    if (!urlMap.has(normalized)) {
      // Keep the original (non-lowercased) path for the actual URL
      let cleanPath = decodeURIComponent(rawPath);
      if (!cleanPath.startsWith("/")) cleanPath = "/" + cleanPath;
      if (!cleanPath.endsWith("/")) cleanPath = cleanPath + "/";

      urlMap.set(normalized, { path: cleanPath, lastmod, changefreq, priority });
    }
  }

  try {
    // ── 1. Load redirects (to exclude source paths) ────────────
    reportProgress("redirects", { message: "Loading redirects…" });
    const redirects = await Redirect.find({});
    const redirectSourcePaths = new Set();
    const redirectTargetPaths = new Set();

    for (const r of redirects) {
      if (!r.from) continue;

      // The site runs trailingSlash:true, so incoming paths ALWAYS have a
      // trailing slash — a redirect whose `from` lacks one never fires (it's
      // dead, and the frontend drops it for the same reason). normalizePath()
      // below adds a slash, which would otherwise resurrect these ~780 dead
      // rules and wrongly strip the matching LIVE URL from the sitemap (e.g. a
      // stale `/villas-for-sale-in-dubai` → /blogs/... rule deleting the live
      // /villas-for-sale-in-dubai/ listing). So only trailing-slash sources can
      // exclude a URL — matching the frontend proxy's behaviour.
      const fromHasSlash = r.from.trim().endsWith("/");
      const fromNormalized = normalizePath(r.from);
      const toNormalized = r.to ? normalizePath(r.to) : null;

      // Only exclude if the redirect actually fires (trailing-slash source) and
      // points ELSEWHERE (skip self-referencing / trailing-slash-only redirects).
      if (fromHasSlash && toNormalized && fromNormalized !== toNormalized) {
        redirectSourcePaths.add(fromNormalized);
      }

      // Track redirect targets — these should be in the sitemap
      if (r.to) {
        redirectTargetPaths.add(toNormalized);
      }
    }

    console.log(
      `[Sitemap] Loaded ${redirects.length} redirects (${redirectSourcePaths.size} source paths to exclude)`
    );

    // ── 2. Static pages ────────────────────────────────────────
    // Prefer the frontend-owned list (/api/static-routes) so new Next.js pages
    // appear without a backend edit; fall back to the built-in STATIC_PAGES.
    reportProgress("static-pages", { message: "Adding static pages…", urlCount: urlMap.size });
    const isoNow = new Date().toISOString();
    const frontendRoutes = await fetchFrontendStaticRoutes();
    const staticPages = frontendRoutes || STATIC_PAGES;
    console.log(
      `[Sitemap] Static pages: ${staticPages.length} (source: ${
        frontendRoutes ? "frontend /api/static-routes" : "built-in fallback"
      })`
    );
    for (const page of staticPages) {
      addUrl(page.path, isoNow, page.changefreq, page.priority);
    }

    // ── 2b. SEO landing pages (from seoUrlMap) ─────────────────
    reportProgress("seo-pages", { message: "Adding SEO landing pages…", urlCount: urlMap.size });
    //   These are internal rewrites — the SEO-friendly path is the
    //   public-facing URL that should appear in the sitemap.
    for (const seoPath of Object.keys(seoUrlMap)) {
      addUrl(seoPath, isoNow, "daily", "0.9");
    }
    console.log(`[Sitemap] SEO landing pages: ${Object.keys(seoUrlMap).length}`);

    // ── 3. Properties (from MongoDB) ───────────────────────────
    reportProgress("properties", { message: "Fetching properties from MongoDB…", urlCount: urlMap.size });
    const properties = await Property.find({ show_property: true }).select(
      "property_name_slug updatedAt"
    );
    for (const p of properties) {
      addUrl(
        `/property/${encodeURIComponent(p.property_name_slug)}/`,
        new Date(p.updatedAt).toISOString(),
        "daily",
        "0.9"
      );
    }
    console.log(`[Sitemap] Properties: ${properties.length}`);

    // ── 4. Communities (Strapi priority, MongoDB fallback) ─────
    reportProgress("communities", { message: "Fetching communities…", urlCount: urlMap.size });
    // First, load MongoDB communities into the map
    const mongoCommunities = await Community.find({}).select("slug updatedAt");
    for (const c of mongoCommunities) {
      addUrl(
        `/area/${encodeURIComponent(c.slug)}/`,
        new Date(c.updatedAt).toISOString(),
        "daily",
        "0.9"
      );
    }

    // Then, load Strapi communities — these OVERWRITE MongoDB entries (Strapi priority)
    const strapiCommunities = await fetchStrapiAll(
      "/api/communities-contents",
      "fields[0]=community_slug&fields[1]=updatedAt"
    );
    for (const c of strapiCommunities) {
      const slug = c.community_slug;
      if (!slug) continue;

      const normalized = normalizePath(`/area/${encodeURIComponent(slug)}/`);
      const cleanPath = `/area/${encodeURIComponent(slug)}/`;

      // Overwrite MongoDB entry with Strapi data (Strapi has priority)
      urlMap.set(normalized, {
        path: cleanPath,
        lastmod: new Date(c.updatedAt).toISOString(),
        changefreq: "daily",
        priority: "0.9",
      });
    }
    console.log(
      `[Sitemap] Communities: ${mongoCommunities.length} (MongoDB) + ${strapiCommunities.length} (Strapi)`
    );

    // ── 5. Developers (from Strapi) ──────────────────────────
    reportProgress("developers", { message: "Fetching developers from Strapi…", urlCount: urlMap.size });
    const strapiDevelopers = await fetchStrapiAll(
      "/api/developers",
      "fields[0]=developer_slug&fields[1]=updatedAt"
    );
    for (const d of strapiDevelopers) {
      const slug = d.developer_slug;
      if (!slug) continue;
      addUrl(
        `/developer/${encodeURIComponent(slug)}/`,
        new Date(d.updatedAt).toISOString(),
        "daily",
        "0.9"
      );
    }
    console.log(`[Sitemap] Developers (Strapi): ${strapiDevelopers.length}`);

    // ── 6. Agents (from Strapi, show_profile=true) ──────────────
    reportProgress("agents", { message: "Fetching agents from Strapi…", urlCount: urlMap.size });
    const strapiAgents = await fetchStrapiAll(
      "/api/agents",
      "filters[show_profile][$eq]=true&fields[0]=name_slug&fields[1]=updatedAt"
    );
    for (const a of strapiAgents) {
      const slug = a.name_slug;
      if (!slug) continue;
      addUrl(
        `/agent/${encodeURIComponent(slug)}/`,
        new Date(a.updatedAt).toISOString(),
        "weekly",
        "0.8"
      );
    }
    console.log(`[Sitemap] Agents (Strapi): ${strapiAgents.length}`);

    // ── 7. Blogs & News (from MongoDB with redirect mapping) ───
    reportProgress("blogs", { message: "Fetching blogs from MongoDB…", urlCount: urlMap.size });
    const blogs = await Content.find({
      status: "published",
      category: "Blog",
    }).select("slug updatedAt");

    for (const blog of blogs) {
      // Check if there's a redirect for this slug
      let blogPath = `/blogs/${encodeURIComponent(blog.slug)}/`;
      const redirect = redirects.find(
        (r) => r.from === `/${blog.slug}` || r.from === `/${blog.slug}/`
      );
      if (redirect && redirect.to) {
        blogPath = redirect.to.endsWith("/") ? redirect.to : redirect.to + "/";
      }
      addUrl(blogPath, new Date(blog.updatedAt).toISOString(), "daily", "0.9");
    }
    console.log(`[Sitemap] Blogs: ${blogs.length}`);

    reportProgress("news", { message: "Fetching news from MongoDB…", urlCount: urlMap.size });
    const news = await Content.find({
      status: "published",
      category: "News",
    }).select("slug updatedAt");

    for (const article of news) {
      let newsPath = `/real-estate-news/${encodeURIComponent(article.slug)}/`;
      const redirect = redirects.find(
        (r) => r.from === `/${article.slug}` || r.from === `/${article.slug}/`
      );
      if (redirect && redirect.to) {
        newsPath = redirect.to.endsWith("/") ? redirect.to : redirect.to + "/";
      }
      addUrl(
        newsPath,
        new Date(article.updatedAt).toISOString(),
        "daily",
        "0.9"
      );
    }
    console.log(`[Sitemap] News: ${news.length}`);

    // ── 8. Guides (from Strapi) ────────────────────────────────
    reportProgress("guides", { message: "Fetching guides from Strapi…", urlCount: urlMap.size });
    const guides = await fetchStrapiAll(
      "/api/guides",
      "filters[show_guide][$eq]=true&fields[0]=guide_slug&fields[1]=updatedAt"
    );
    for (const g of guides) {
      const slug = g.guide_slug;
      if (!slug) continue;
      addUrl(
        `/guides/${encodeURIComponent(slug)}/`,
        new Date(g.updatedAt).toISOString(),
        "weekly",
        "0.8"
      );
    }
    console.log(`[Sitemap] Guides (Strapi): ${guides.length}`);

    // ── 9. Articles from Strapi (news, blogs, publications) ────
    reportProgress("articles", { message: "Fetching articles from Strapi…", urlCount: urlMap.size });
    // These may overlap with MongoDB content — Strapi articles that
    // aren't in MongoDB will get added; duplicates are caught by the Map.
    const strapiArticles = await fetchStrapiAll(
      "/api/articles",
      "fields[0]=slug&fields[1]=updatedAt&populate[category][fields][0]=slug&populate[sub_category][fields][0]=slug&populate[seo][fields][0]=canonicalUrl"
    );

    // Distinct blog sub-categories → their landing pages (/blogs/<sub>/), with
    // the latest article date in that sub-category as lastmod.
    const blogSubLastmod = new Map();

    // Canonical-path bookkeeping. Strapi IS the live source of truth for where
    // an article resolves — resolveArticlePath() reads the same fields the
    // frontend routes by (articlePath() / /api/article-canonical), and every
    // OTHER shape of that article's URL 30x-redirects to it. Crucially, none of
    // those moves is recorded as a Mongo redirect row, so the redirect pruning
    // in section 10 cannot see them.
    //
    //   articleCanonicalKeys — the one URL per article that must survive.
    //   legacyArticleKeys    — every flat /{hub}/{slug}/ shape of a Strapi
    //                          article, under EVERY hub, not just its current
    //                          one. The legacy MongoDB Content sections (7)
    //                          emit from a stored `category` string that goes
    //                          stale the moment an article is re-filed, so an
    //                          article that moved news → blog is emitted at
    //                          /real-estate-news/<slug>/ while its canonical
    //                          lives at /blogs/<sub>/<slug>/. Enumerating all
    //                          hubs catches hub moves and sub-category moves
    //                          alike, today and for the next one.
    // Both keyed by normalizePath to match urlMap.
    const articleCanonicalKeys = new Set();
    const legacyArticleKeys = new Set();

    let nestedArticleCount = 0;
    for (const article of strapiArticles) {
      const slug = article.slug;
      const categorySlug = article.category?.slug;
      const hubBase = HUB_BASE[categorySlug];
      if (!slug || !hubBase) continue;

      const lastmod = new Date(article.updatedAt).toISOString();
      const { path: canonicalPath, subSlug } = resolveArticlePath(
        article,
        hubBase,
        slug
      );

      addUrl(canonicalPath, lastmod, "daily", "0.9");
      articleCanonicalKeys.add(normalizePath(canonicalPath));

      // Every flat hub shape of this slug is a legacy path — including the one
      // under the article's own current hub (stale when the sub-category moved).
      const encSlug = encodeURIComponent(slug);
      for (const base of HUB_BASES) {
        legacyArticleKeys.add(normalizePath(`${base}${encSlug}/`));
      }

      if (subSlug) {
        nestedArticleCount++;
        // Only blog sub-categories have dedicated landing pages on the frontend.
        if (categorySlug === "blog") {
          const prev = blogSubLastmod.get(subSlug);
          if (!prev || lastmod > prev) blogSubLastmod.set(subSlug, lastmod);
        }
      }
    }
    console.log(
      `[Sitemap] Articles (Strapi): ${strapiArticles.length} (${nestedArticleCount} nested under a sub-category)`
    );

    // Drop every legacy article shape that is not itself some article's
    // canonical. Subtracting articleCanonicalKeys keeps a flat-canonical
    // article (no sub-category) in place, and keeps both entries should two
    // distinct articles ever share a slug across hubs. Articles that exist only
    // in MongoDB Content are untouched — their slugs never enter these sets.
    let legacyDropped = 0;
    for (const key of legacyArticleKeys) {
      if (articleCanonicalKeys.has(key) || protectedPaths.has(key)) continue;
      if (urlMap.delete(key)) legacyDropped++;
    }
    if (legacyDropped > 0) {
      console.log(
        `[Sitemap] Dropped ${legacyDropped} legacy article URLs superseded by a canonical path`
      );
    }

    // Blog sub-category landing pages (/blogs/<sub-category>/) — SSR hub pages.
    for (const [subSlug, lastmod] of blogSubLastmod) {
      addUrl(`/blogs/${encodeURIComponent(subSlug)}/`, lastmod, "weekly", "0.8");
    }
    console.log(
      `[Sitemap] Blog sub-category landing pages: ${blogSubLastmod.size}`
    );

    // ── 10. Remove redirect source paths ───────────────────────
    reportProgress("dedup", { message: "Removing redirect sources & deduplicating…", urlCount: urlMap.size });
    //   protectedPaths (seoUrlMap pages) is built at the top of this function —
    //   those pages take priority over redirects because the seoUrlMap
    //   middleware intercepts requests first.
    let removedCount = 0;
    for (const sourcePath of redirectSourcePaths) {
      if (urlMap.has(sourcePath) && !protectedPaths.has(sourcePath)) {
        urlMap.delete(sourcePath);
        removedCount++;
      }
    }
    if (removedCount > 0) {
      console.log(
        `[Sitemap] Removed ${removedCount} URLs that are redirect sources`
      );
    }

    // ── 11. Build XML ──────────────────────────────────────────
    reportProgress("write", { message: "Building XML & writing to disk…", urlCount: urlMap.size });
    const urlEntries = [];
    for (const [, entry] of urlMap) {
      urlEntries.push(
        urlEntry(entry.path, entry.lastmod, entry.changefreq, entry.priority)
      );
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries.join("\n")}
</urlset>`;

    // ── 12. Write to disk ──────────────────────────────────────
    fs.writeFileSync(SITEMAP_PATH, xml, { encoding: "utf8" });

    // ── 13. Save to MongoDB (shared across all instances) ─────
    try {
      await Sitemap.findOneAndUpdate(
        {},
        { content: xml, urlCount: urlMap.size, generatedAt: new Date() },
        { upsert: true, new: true }
      );
      console.log(`[Sitemap] Saved to MongoDB (${urlMap.size} URLs)`);
    } catch (mongoErr) {
      console.warn(`[Sitemap] MongoDB save failed (non-fatal): ${mongoErr.message}`);
    }

    // ── 14. Nudge the frontend to drop its cached /sitemap.xml ────
    // Fires on every regen path (admin button, content/redirect auto-trigger,
    // cron) since they all funnel through this function — so the live sitemap
    // reflects this run within seconds instead of lagging up to ~1h.
    revalidateFrontendSitemap();

    const elapsed = Date.now() - startTime;
    console.log(
      `[Sitemap] Generated successfully — ${urlMap.size} URLs in ${elapsed}ms`
    );

    return { success: true, urlCount: urlMap.size, elapsed };
  } catch (err) {
    console.error("[Sitemap] Generation failed:", err);
    return { success: false, error: err.message };
  }
};

// ── Debounced generation ─────────────────────────────────────────
let debounceTimer = null;
const DEBOUNCE_MS = 30_000; // 30 seconds

/**
 * Queue a sitemap regeneration. Multiple calls within DEBOUNCE_MS
 * are coalesced into a single generation run.
 */
function queueRegeneration(reason = "unknown") {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  console.log(
    `[Sitemap] Regeneration queued (reason: ${reason}), will run in ${DEBOUNCE_MS / 1000}s...`
  );
  debounceTimer = setTimeout(async () => {
    debounceTimer = null;
    await generateSitemap();
  }, DEBOUNCE_MS);
}

/**
 * Force immediate regeneration — bypasses the debounce timer.
 */
async function forceRegeneration(reason = "force", onProgress) {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  console.log(`[Sitemap] Force regeneration (reason: ${reason})`);
  return await generateSitemap(onProgress);
}

module.exports = generateSitemap;
module.exports.generateSitemap = generateSitemap;
// Exposed for verification — lets the article canonical resolution be exercised
// against live Strapi data without running a full generation.
module.exports.HUB_BASE = HUB_BASE;
module.exports.resolveArticlePath = resolveArticlePath;
module.exports.queueRegeneration = queueRegeneration;
module.exports.forceRegeneration = forceRegeneration;
