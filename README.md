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
