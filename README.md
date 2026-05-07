# XR Backend V1

Backend service for XR Realty. Provides admin APIs and public APIs for the website, with MongoDB storage and integrations (Cloudinary, Postmark, Zapier, n8n, Strapi).

## Quick Start

```bash
npm install
node app.js
```

Runs on `PORT` from `vars/.env`.

## Documentation

- `docs/PROJECT_DOCUMENTATION.md` — full onboarding documentation
- `docs/API_EXAMPLES.md` — request/response samples
- `docs/FLOWS.md` — system flow diagrams (Mermaid)
- `docs/ENV_SAMPLE.md` — sanitized env template

## Key Paths

- Entry: `app.js`
- Routes: `routes/`
- Controllers: `controller/`
- Models: `models/`
- Middleware: `middleware/`
- Validations: `schemaValidation/`
- Utilities: `utils/`

## Notes

- Admin routes are under `/admin` and require a logged-in session.
- Several public endpoints fetch supplemental data from Strapi (`admin-v1.xrealty.ae`).
- Some controllers return `200` with `{ success: false }` rather than 4xx.

If you need more detail, start with `docs/PROJECT_DOCUMENTATION.md`.

## Sitemap Automation

The backend automatically generates and maintains `public/sitemap.xml` by pulling data from both MongoDB and Strapi.

### How It Works

The sitemap is generated on server startup and refreshed automatically via three mechanisms:

- **Cron job** — regenerates every 2 hours
- **Admin CRUD auto-trigger** — any successful POST/PUT/DELETE on property, content, agent, community, developer, or redirect admin routes queues a regeneration (debounced 30 seconds so bulk edits coalesce into one rebuild)
- **Strapi webhook** — Strapi sends a POST to `/api/sitemap/regenerate` when content changes

### Data Sources

| Source | Collections |
|--------|------------|
| MongoDB | Properties (`show_property=true`), Communities, Developers, Blogs, News, Redirects |
| Strapi | Agents (`show_profile=true`), Communities (overrides MongoDB), Guides, Articles (news/blogs/publications) |
| Static | 27 hardcoded pages + 30 SEO landing pages from `utils/seoUrlMap.js` |

### Environment Variables

Add these to `vars/.env`:

| Variable | Required | Description |
|----------|----------|-------------|
| `SITEMAP_SOURCE` | No | `local` (default) serves the generated file. Set to `strapi` to proxy from Strapi instead (kill-switch). |
| `STRAPI_BASE_URL` | Yes | Strapi instance URL. Default: `https://admin-v1.xrealty.ae` |
| `STRAPI_API_TOKEN` | Yes | Read-only Strapi API token for fetching agents, guides, articles, communities |
| `ADMIN_SECRET` | No | Bearer token for the force-regenerate endpoint |
| `SITEMAP_WEBHOOK_SECRET` | No | Bearer token for the Strapi webhook endpoint |

### Endpoints

**Generate sitemap (admin session auth)**
```
GET /admin/generateSitemap
```
Requires logged-in admin session. Returns JSON with `urlCount` and `elapsed`.

**Force regenerate (bearer token)**
```
POST /admin/generateSitemap/force
Authorization: Bearer <ADMIN_SECRET>
```
Bypasses debounce, regenerates immediately, and returns the raw XML. Response headers include `X-Sitemap-Url-Count` and `X-Sitemap-Elapsed-Ms`.

**Serve sitemap**
```
GET /admin/sitemap
```
Returns the current sitemap XML. Respects the `SITEMAP_SOURCE` kill-switch. Response header `X-Sitemap-Source` shows `local` or `strapi`.

**Strapi webhook**
```
POST /api/sitemap/regenerate
Authorization: Bearer <SITEMAP_WEBHOOK_SECRET>
Content-Type: application/json

{ "reason": "article published" }
```
Queues a debounced regeneration. Returns `202 Accepted`.

### Kill-Switch (Revert to Strapi)

If something goes wrong with the generated sitemap, revert instantly:

1. Set `SITEMAP_SOURCE=strapi` in `vars/.env`
2. Restart the backend

This proxies the sitemap from Strapi's `/api/sitemaps` endpoint. The local generation keeps running in the background, so when you switch back to `SITEMAP_SOURCE=local` the file will already be fresh.
