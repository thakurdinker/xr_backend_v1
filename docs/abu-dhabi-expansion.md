# Abu Dhabi expansion — backend notes

Branch **`feat/abu-dhabi-phase-0`**. The full handover (brief, URL structure, verification results, release order, open SEO decisions) is in the frontend repo: **`xr_client/docs/abu-dhabi-expansion.md`**. This file covers the backend specifics.

## Model changes
- `models/community.js` — `emirate` (`"Dubai" | "Abu Dhabi"`, default Dubai), `noindex`. A post-save hook moves the area's properties when its emirate changes.
- `models/properties.js` — `emirate`, **always** derived from the community in a pre-save hook (`Property.emirateForCommunity()`); anything sent in the request body is overwritten. The schema_org URL uses the emirate's path.
- `models/developer.js` — `noindex`.
- `models/sitemap.js` — `name`; the Abu Dhabi sitemap is stored as `name: "abu-dhabi"`. Use `Sitemap.MAIN` / `Sitemap.ABU_DHABI` as filters (the original doc has no name).
- No new indexes on purpose (tiny collections; avoids an index build on production at deploy).

## Shared helper — `utils/emirate.js`
`parseEmirate()` (missing → Dubai, unknown → `null` → 400), `emirateFilter()` (Dubai = `emirate != "Abu Dhabi"`, so legacy rows are Dubai), `emirateOf()`, `propertyPath()`, `areaPath()`.

## Endpoints (all default to Dubai; pass `emirate=abu-dhabi`)
| Endpoint | Change |
|---|---|
| `GET /property/:slug?emirate=` | scoped; other emirate → `success:false` |
| `GET /area/:slug?emirate=` | community + properties scoped; area of the other emirate → `{ success:false, wrongEmirate:true }` |
| `GET /area/communities?emirate=` | Mongo + Strapi merge scoped; Strapi-only areas are Dubai |
| `GET /label/:slug?emirate=` | properties, slideshow, communities scoped; adds `emirates`, `noindex` |
| `GET /admin/developers?emirate=` | unfiltered by default (admin panel uses it); every developer gets `emirates` |
| `POST /property-search` (`emirate` in body), `GET /user/search-filters?emirate=` | scoped |
| `GET /` homepage featured | Dubai only |
| `/dubai-properties/...` | Dubai only |
| `/abu-dhabi-properties/:saleType/:type` | **new** — Abu Dhabi landing pages. Strapi copy is looked up under property type `<type>-abu-dhabi` |
| `GET /admin/sitemap-abu-dhabi` | **new** — Abu Dhabi sitemap XML |

Abu Dhabi landing slugs live in **`utils/abuDhabiSeoUrlMap.js`** (rewritten by the same middleware as `seoUrlMap.js`) and are deliberately **not** in `seoUrlMap.js`, whose keys all go into the main sitemap.

## Admin writes
Duplicate slugs are rejected with a readable message (the admin panel shows it as a toast): property slugs are unique **per emirate**, area and developer slugs globally.

## Sitemap
`utils/generateSitemap/generateSitemap.js` keeps Abu Dhabi areas/properties and Abu Dhabi-only developers out of `/sitemap.xml` and writes them to the Abu Dhabi sitemap (`writeAbuDhabiSitemap()`), together with the hub/list/landing pages once they have content. `noindex` areas and developers are left out of both.

`/abu-dhabi/developers/` is listed when `hasAbuDhabiListDeveloper()` is true. It uses the page's own condition: a developer that is in Strapi, is in Mongo and has a live Abu Dhabi project. Both-emirate developers count. So the sitemap never lists the page while it returns 404, and never misses it while it is live.

## Backfill — `scripts/backfillEmirate.js`
Dry run by default; only `$set`s `emirate`. Reports orphaned properties and duplicate slugs.
```
node scripts/backfillEmirate.js                 # dry run, TEST_DB_URL
node scripts/backfillEmirate.js --apply         # write, TEST_DB_URL
node scripts/backfillEmirate.js --live          # dry run, DB_URL (production)
node scripts/backfillEmirate.js --live --apply  # write production — release owner only
```
Already applied to the dev DB; **never run against production yet**.

## Verification scripts — `scripts/verify-abu-dhabi/`
All refuse to run unless `TEST_DB_URL` is `xrealty_website_dev_backend`. Run the backend first:
```
ENV=development USE_LIVE_DB=false MAIN_FRONTEND_URL=http://127.0.0.1:9 node app.js   # Node ≤ 22
```
| Script | Purpose |
|---|---|
| `capture-api.js <outDir>` + `compare-api.js <a> <b> [--ignore=regex]` | snapshot ~430 public responses and diff two snapshots. Use `--ignore='featured_agents\|\.(emirate\|emirates\|noindex)$'` to compare old vs new code |
| `crawl.js <sitemap.xml> <out.json> [base]` + `compare-crawl.js <a> <b>` | crawl a local Next build (`NEXT_PUBLIC_API_URL=http://localhost:3333`, port 3100) and diff SEO fields per page |
| `ad-isolation-test.js` | inserts temporary Abu Dhabi data, checks every endpoint + sitemaps, cleans up (35 checks). Checks that expect exactly the test's own rows ignore other `zz-test-*` rows (for example the demo data), and only those. |
| `fe-ad-test.js` | same against the local Next build (20 checks). Next caches pages, so the script refreshes each path through `/api/revalidate` before it fetches it. Start Next with `REVALIDATE_SECRET=<value>` and run the script with `FE_REVALIDATE_SECRET=<same value>`. |
| `seed-ad-demo.js [--rm]` | demo Abu Dhabi area + property (clones of Dubai Marina / The Yards Plaza, labelled TEST) for local previews |

## Gotchas
- `MONGODB_URI` in `vars/.env` is **production**; `scripts/migrateGalleryToObjects.js` uses it. The dev DB is on the same cluster.
- Starting the backend regenerates the sitemap and POSTs to `MAIN_FRONTEND_URL` (defaults to the live site) — override it locally.
- Node 26 fails to start (`SlowBuffer` in `buffer-equal-constant-time`); use Node 22.
