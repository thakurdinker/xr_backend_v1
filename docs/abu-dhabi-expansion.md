# Abu Dhabi expansion — backend notes

Branch **`feat/abu-dhabi-phase-0`**. The full handover (brief, URL structure, verification results, release order, open SEO decisions) is in the frontend repo: **`xr_client/docs/abu-dhabi-expansion.md`**. This file covers the backend specifics.

## Model changes
- `models/community.js` — `emirate` (`"Dubai" | "Abu Dhabi"`, default Dubai), `noindex`. A post-save hook moves the area's properties when its emirate changes.
- `models/properties.js` — `emirate`, **always** derived from the community in a pre-save hook (`Property.emirateForCommunity()`); anything sent in the request body is overwritten. The schema_org URL uses the emirate's path.
- `models/developer.js` — `noindex`. No editor sets it any more: the admin panel's developer pages were removed in May 2026 (admin `e754c04`), and developers are added in Strapi (see below).
- `models/sitemap.js` — `name`. Abu Dhabi no longer has its own sitemap, but a leftover doc named `"abu-dhabi"` may remain, so always filter with `Sitemap.MAIN` (the main doc has no name).
- No schema indexes on purpose (tiny collections; avoids an index build on production at deploy). The one new index, on live property slugs per emirate, is created by a script (see "Slug index" below).

## Shared helper — `utils/emirate.js`
`parseEmirate()` (missing → Dubai, unknown → `null` → 400), `emirateFilter()` (Dubai = `emirate != "Abu Dhabi"`, so legacy rows are Dubai), `emirateOf()`, `propertyPath()`, `areaPath()`.

## Endpoints (all default to Dubai; pass `emirate=abu-dhabi`)
| Endpoint | Change |
|---|---|
| `GET /property/:slug?emirate=` | scoped; other emirate → `success:false` |
| `GET /area/:slug?emirate=` | community + properties scoped; area of the other emirate → `{ success:false, wrongEmirate:true }` |
| `GET /area/communities?emirate=` | Mongo + Strapi merge scoped by the Strapi area emirate tag, with Mongo fallback |
| `GET /label/:slug?emirate=` | properties, slideshow, communities scoped; adds `emirates`, `noindex`. Serves a developer that is in Mongo **or** Strapi (502 if Strapi can't be checked); 404 otherwise |
| `GET /admin/developers?emirate=` | unfiltered by default (admin panel uses it); every developer gets `emirates`. Mongo records first, unchanged, then Strapi-only developers (`source: "strapi"`); Mongo-only if Strapi is down |
| `POST /property-search` (`emirate` in body), `GET /user/search-filters?emirate=` | scoped |
| `GET /` homepage featured | Dubai only |
| `/dubai-properties/...` | Dubai only |
| `/abu-dhabi-properties/:saleType/:type` | **new** — Abu Dhabi landing pages. Strapi copy is looked up under property type `<type>-abu-dhabi` |

Abu Dhabi landing slugs live in **`utils/abuDhabiSeoUrlMap.js`** (rewritten by the same middleware as `seoUrlMap.js`) and are deliberately **not** in `seoUrlMap.js`, whose keys all go into the main sitemap.

## Developers from Strapi — `utils/strapiDevelopers.js`
Developers are added in Strapi; the 12 Mongo `Developer` records predate that. Properties link to a developer by slug (`developer_name_slug`), so:
- `mergeDevelopers()` — the developer list is the Mongo records (order and names unchanged; a Mongo record wins on a shared slug, e.g. Mongo "Beyond" vs Strapi "Beyond Developments") followed by Strapi-only developers by name. Each Strapi-only entry has `id` (its Strapi `documentId`), `developer_name`, `developer_slug`, `source: "strapi"`.
- `fetchStrapiDevelopers()` / `strapiDeveloperExists()` — read Strapi (`STRAPI_BASE_URL`, optional `STRAPI_API_TOKEN`, 5 s timeout).
- Strapi developer emirate tags are authoritative when present; legacy untagged developers use their live properties and default to Dubai.

To test a Strapi-only developer without touching Strapi, point `STRAPI_BASE_URL` at a local proxy that adds a fake entry to `/api/developers`.

## Admin writes
Duplicate slugs are rejected with a readable message (the admin panel shows it as a toast): property slugs are unique **per emirate**, area and developer slugs globally.

The code checks run before the write, so two concurrent writes can both pass them (#163). The slug index below closes that gap. When the index refuses a write, the handlers map the duplicate-key error (`E11000`) to the same message: `SLUG_CLASH_MESSAGE` for a property create or update, `Community.areaMoveClashMessage()` for an area move. Duplicate keys on `order` keep their old handling.

`updateCommunity` saves the area in a transaction (`mongoose.connection.transaction()`). The post-save hook moves the area's properties in the same transaction. A duplicate-key error in that move rolls back the area write too, so a move never stops halfway. Transactions need a replica set: Atlas is one; a local standalone `mongod` now rejects every area update.

## Sitemap
There is one sitemap, `/sitemap.xml`, for both emirates. `utils/generateSitemap/generateSitemap.js` lists Abu Dhabi areas and properties at their `/abu-dhabi/` URLs and every developer at its shared `/developer/` URL, plus the hub/list/landing pages once they have content (`abuDhabiSectionPages()`). Abu Dhabi URLs go through the same dedup, redirect pruning and daily health check as Dubai ones. `noindex` areas and developers are left out.

`/abu-dhabi/developers/` is listed when `hasAbuDhabiListDeveloper()` is true. It uses the page's own condition: a developer that is in Strapi and has a live Abu Dhabi project. Both-emirate developers count. So the sitemap never lists the page while it returns 404, and never misses it while it is live.

## Backfill — `scripts/backfillEmirate.js`
Dry run by default; only `$set`s `emirate`. Reports orphaned properties and duplicate slugs.
```
node scripts/backfillEmirate.js                 # dry run, TEST_DB_URL
node scripts/backfillEmirate.js --apply         # write, TEST_DB_URL
node scripts/backfillEmirate.js --live          # dry run, DB_URL (production)
node scripts/backfillEmirate.js --live --apply  # write production — release owner only
```
Already applied to the dev DB; **never run against production yet**.

## Slug index — `scripts/createPropertySlugIndex.js`
Creates the unique index `uniq_live_property_slug_per_emirate` on `{ emirate: 1, property_name_slug: 1 }`. Spec and checks: `utils/propertySlugIndex.js`. The index is not in the `Property` schema on purpose: `autoIndex` would build it at boot, before the backfill.

The index is partial: it covers only live properties (`show_property: true`) with a string `emirate` and slug. Only live properties own a public URL, so hidden duplicates do not block it.

Dry run by default. The script refuses (exit code 1) when a live property has no `emirate` or when two live properties share a slug in one emirate. It reports hidden duplicates only. When the index already exists, it does nothing. It never changes a document.
```
node scripts/createPropertySlugIndex.js                 # dry run, TEST_DB_URL
node scripts/createPropertySlugIndex.js --apply         # create, TEST_DB_URL
node scripts/createPropertySlugIndex.js --live          # dry run, DB_URL (production)
node scripts/createPropertySlugIndex.js --live --apply  # create on production — release owner only
```
Release order on production:
1. Deploy this backend.
2. Run the backfill: `node scripts/backfillEmirate.js --live`, then `--live --apply`.
3. Run `node scripts/createPropertySlugIndex.js --live` (dry run). Resolve each live duplicate it reports with the SEO team.
4. Run `node scripts/createPropertySlugIndex.js --live --apply`.

Until step 4, production has only the code checks, and the race from #163 stays open. The dev DB dry run passes; it reports one hidden duplicate (`the-heights-country-club-and-wellness`, Dubai). The index is not created on the dev DB yet.

Real-MongoDB tests (opt-in; `npm test` skips them): `test/integration/propertySlugIndex.test.js`. The file header has the commands. They need a local single-node replica set:
```
MONGOD_URL='mongodb://127.0.0.1:27391/?replicaSet=rs0' node --test test/integration/
```

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
