# XR Backend V1 — Developer Onboarding Documentation

This document explains how the backend works, how it is structured, and how to safely modify or extend it. It is meant to be detailed enough for a new developer to get productive quickly.

## 1. What This Service Does

This is the backend for the XR Realty website and admin panel. It serves two kinds of traffic:

- Admin APIs under `/admin` for internal content management.
- Public APIs under `/` for the website (homepage data, properties, agents, communities, blogs/news, forms, etc.).

Key responsibilities:

- CRUD for content: properties, agents, communities, developers, icons, roles/permissions, reviews, project-of-the-month.
- Public data aggregation for homepage, listing pages, and detail pages.
- Form submissions with email delivery, webhook forwarding, and CRM integrations.
- User authentication and session management for admin operations.
- Redirect rules and sitemap management.

The backend is Express + Mongoose, with external integrations like Cloudinary (media), Postmark (email), Zapier/n8n/CRM (lead pipelines), and Strapi for some content.

## 2. Tech Stack

- Node.js + Express
- MongoDB (Mongoose)
- Passport (local strategy) + express-session (cookie-based sessions)
- Cloudinary (asset management)
- Postmark (email service)
- External Strapi instance (admin-v1.xrealty.ae)

## 3. Repository Structure

- `app.js` — entrypoint, middleware, DB connection, routes
- `routes/` — HTTP routes grouped by domain
- `controller/` — business logic for each domain
- `models/` — Mongoose schemas and models
- `middleware/` — auth/role checks and reset password validation
- `schemaValidation/` — Joi schemas for payload validation
- `utils/` — helper utilities and integrations
- `cloudinary/` — Cloudinary configuration
- `configs/` — JSON config files (property types, content categories)
- `seo/` — JSON files used for page metadata
- `public/` — static files like sitemap
- `vars/.env` — environment configuration (secrets live here)

## 4. Application Boot Flow

File: `app.js`

- Loads env via `dotenv` from `vars/.env`.
- Connects to MongoDB using `mongoose.connect(DB_URL)`.
- Configures session storage via MongoDB (connect-mongo).
- Enables CORS and JSON parsing.
- Initializes Passport for authentication.
- Mounts admin routes under `/admin`.
- Mounts public routes under `/`.
- Central error handler returns `{ success: false, message }`.

## 5. Environment Configuration

All environment configuration is read from `vars/.env`.

Important: do not commit real secrets to version control. Use a private `.env` locally.

Required variables and usage:

- `PORT` — server port
- `TEST_DB_URL` — MongoDB URL for development/testing
- `DB_URL` — MongoDB URL for production
- `ENV` — `development` or `production`
- `SESSION_SECRET` — session cookie encryption secret
- `JWT_SECRET` — JWT secret for password reset tokens
- `POSTMARK_TOKEN` — Postmark API token for reset emails
- `POSTMARK_CONTACT_FORM_SERVER_TOKEN` — Postmark API token for lead emails
- `CLOUDINARY_CLOUD_NAME` — Cloudinary account
- `CLOUDINARY_API_KEY` — Cloudinary API key
- `CLOUDINARY_API_SECRET` — Cloudinary API secret
- `FRONTEND_URL` — admin or frontend URL used in password reset redirects
- `ZAPIER_URL` — Zapier webhook endpoint
- `CRM_URL` — CRM webhook endpoint
- `N8N_FROM_SUBMIT_URL` — n8n webhook endpoint

## 6. Running the Service

From repo root:

```bash
npm install
node app.js
```

The `package.json` script `start` runs `npm i -f && node app.js`.

## 7. Authentication and Authorization

Authentication uses Passport Local with a MongoDB-backed session:

- Model: `models/user.js`
- Passport initialization: `app.js`
- User login: `POST /admin/login`
- Current user: `GET /admin/currentuser`
- Logout: `GET /admin/logout`

Authorization helpers live in `middleware/middleware.js`:

- `isLoggedIn` — ensures `req.user` exists.
- `isAdmin` — checks user role and requires `role_name === "admin"`.

Roles and permissions:

- `models/roles.js` holds role name + permissions array.
- `models/permissions.js` holds permission definitions.
- Roles are enforced only by `isAdmin`, not per-permission.

## 8. Admin API Routes

All admin routes are mounted under `/admin` in `app.js`.

### User / Roles / Permissions

- `GET /admin/getUsers` — list users (admin only)
- `GET /admin/getUsers/:id` — user detail (admin only)
- `PUT /admin/getUsers/:id` — update user (admin only)
- `DELETE /admin/getUsers/:id` — delete user (admin only)
- `POST /admin/register` — create user (admin only)
- `POST /admin/login` — login

- `GET /admin/roles` — list roles
- `POST /admin/roles` — create role (admin only)
- `GET /admin/roles/:id` — role detail
- `PUT /admin/roles/:id` — update role (admin only)
- `DELETE /admin/roles/:id` — delete role (admin only)

- `GET /admin/permissions` — list permissions
- `POST /admin/permissions` — create permission (admin only)
- `GET /admin/permissions/:id` — permission detail
- `PUT /admin/permissions/:id` — update permission (admin only)
- `DELETE /admin/permissions/:id` — delete permission (admin only)

### Properties

- `GET /admin/properties` — list properties (admin only)
- `POST /admin/properties` — create property (admin only)
- `GET /admin/properties/:id` — property detail
- `PUT /admin/properties/:id` — update property
- `DELETE /admin/properties/:id` — delete property

Note: property ordering is managed via the `order` field. Creating or updating a property shifts other properties to keep order unique.

### Agents

- `GET /admin/agents` — list with pagination
- `GET /admin/agents/listAll` — list without pagination
- `POST /admin/agents` — create
- `GET /admin/agents/:id` — detail
- `PUT /admin/agents/:id` — update
- `DELETE /admin/agents/:id` — delete (also deletes Cloudinary image)

### Communities

- `GET /admin/communities` — list communities
- `POST /admin/communities` — create community
- `GET /admin/getAllForAdmin` — admin list with pagination
- `GET /admin/getAllForAdmin/:id` — admin community detail
- `PUT /admin/getAllForAdmin/:id` — update
- `DELETE /admin/getAllForAdmin/:id` — delete
- `GET /admin/getAllCommunities` — list all for admin
- `GET /admin/communities/:id` — community detail
- `PUT /admin/communities/:id` — update
- `DELETE /admin/communities/:id` — delete

Communities also pull supplemental data from Strapi in the public route.

### Content (Blogs/News)

- `GET /admin/content` — list content with pagination
- `POST /admin/content` — create content
- `GET /admin/content/filter` — filter content
- `GET /admin/content/:id` — detail
- `PUT /admin/content/:id` — update
- `DELETE /admin/content/:id` — delete

### Developers

- `POST /admin/developers` — create developer
- `GET /admin/developers` — list developers (special ordering for Emaar)
- `GET /admin/developers/:id` — detail
- `PUT /admin/developers/:id` — update
- `DELETE /admin/developers/:id` — delete

### Home Page Videos

- `GET /admin/homepageVideo` — get existing video document
- `POST /admin/homepageVideo` — create
- `PUT /admin/homepageVideo/:id` — update
- `DELETE /admin/homepageVideo/:id` — delete

### Icons

- `POST /admin/icons` — create icon
- `GET /admin/icons` — list with pagination
- `GET /admin/getAllIcons` — list all
- `GET /admin/icons/:id` — detail
- `PUT /admin/icons/:id` — update
- `DELETE /admin/icons/:id` — delete

### Reviews

- `POST /admin/reviews` — create review
- `GET /admin/reviews` — list with pagination
- `GET /admin/getAllReviews` — list all
- `GET /admin/reviews/:id` — detail
- `PUT /admin/reviews/:id` — update
- `DELETE /admin/reviews/:id` — delete

### Project of the Month

- `POST /admin/projectOfTheMonth` — create or update singleton
- `GET /admin/projectOfTheMonth` — fetch singleton

### Assets / Sitemap / Redirects

- `POST /admin/deleteAsset` — delete Cloudinary asset (by URL)
- `GET /admin/generateSitemap` — regenerate sitemap (admin only)
- `GET /admin/sitemap` — read current sitemap
- `POST /admin/sitemap` — update sitemap content

- `GET /admin/redirect-rules` — list redirects
- `POST /admin/redirect-rules` — create redirect
- `PUT /admin/redirect-rules/:id` — update redirect
- `DELETE /admin/redirect-rules/:id` — delete redirect

## 9. Public API Routes

Mounted at `/` in `app.js`.

### Homepage and Featured Content

- `GET /` — homepage data via `homePageController.getHomePage`
  - Pulls featured properties from MongoDB.
  - Pulls homepage sections and featured agents from Strapi.
  - Merges and shuffles featured agents.
  - Fetches “guides” from Strapi.

### Properties

- `GET /dubai-properties` — all public properties
- `GET /dubai-properties/:slug` — filter by property type slug
- `GET /dubai-properties/:saleType/:type` — sale type + type mapping
- `GET /property/:propertySlug` — property detail by slug

### Communities

- `GET /area/communities` — all communities (Mongo + Strapi data)
- `GET /area/:communitySlug` — community detail with properties

### Developers

- `GET /label/:developerNameSlug` — developer page
  - Returns developer details, properties, slideshow items, and communities.

### Agents

- `GET /meet-the-xr` — agent listing page (with SEO JSON sections)
- `GET /agent/:agentSlug` — agent detail + “more of the team”
- `GET /starAgents` — star agents listing

### News and Blogs

- `GET /real-estate-news` — published content filtered by category = News
- `GET /blogs` — published content filtered by category = Blog
- `GET /:contentSlug` — content detail by slug, with fallback to redirect rules

### Search and Filters

- `POST /property-search` — filtered search (type, bedroom, price range, community)
- `GET /user/search-filters` — returns property types and communities

### Forms and Submissions

- `POST /contact` — main contact form
- `POST /landing-page` — landing page form (currently returns error immediately)
- `POST /career_contact` — career form (updates existing Contact by `formId`)
- `POST /brochure-download` — brochure request
- `POST /market-report` — market report request
- `POST /newsletter` — newsletter signup

### Resume Upload

- `POST /resume/upload` — PDF upload to Cloudinary

## 10. Data Models (Mongo)

### User / Access Control

- `User` (`models/user.js`)
  - `username`, `first_name`, `last_name`, `email`, `profile_image`, `position`, `role`
  - Passport Local adds password hash and auth helpers

- `Role` (`models/roles.js`)
  - `role_name`, `permissions[]`

- `Permission` (`models/permissions.js`)
  - `permission_name`, `description`

- `ResetToken` (`models/resettoken.js`)
  - `resetToken`, `user`

### Content / Marketing

- `Content` (`models/content.js`)
  - `title`, `slug`, `content`, `featured_image`, `category`, `publish_date`, `status`
  - `seo`, `schema_org`, `open_graph`
  - `images[]`, `faqs[]`, `tags[]`

- `ProjectOfTheMonth` (`models/ProjectOfTheMonthModel.js`)
  - `videoUrl`, `projectName`, `description`, `amenities.icons`, `headings[]`, `images[]`, `learnMore`

### Real Estate Inventory

- `Property` (`models/properties.js`)
  - Core: `property_name`, `property_name_slug`, `price`, `developer`, `type[]`, `status[]`
  - Location: `location.address`, `location.city`, `location.coordinates`
  - Media: `images[]`, `gallery1[]`, `gallery2[]`, `section_1.image`
  - SEO: `seo`, `schema_org`, `open_graph`
  - Flags: `show_property`, `featured`, `show_slideShow`
  - Ordering: `order` (unique)

- `Community` (`models/community.js`)
  - `name`, `slug`, `description`, `location`, `amenities`, `images[]`, `faqs[]`
  - `seo`, `schema_org`, `open_graph`

- `Developer` (`models/developer.js`)
  - `logo_img_url`, `developer_name`, `developer_slug`, `description`, `meta_*`, `order`

### Agents / Reviews / Forms

- `Agent` (`models/agent.js`)
  - `name`, `name_slug`, `email`, `phone`, `profile_picture`
  - `bio`, `education`, `experience`, `specialties`, `languages`
  - `seo`, `schema_org`, `open_graph`
  - `starAgent`, `hidden`

- `Review` (`models/reviewsForm.js`)
  - `name`, `message`, `imageUrl`, `numberOfStars`, `showReview`

- `Contact` (`models/submitForm.js`)
  - form data for all submissions, including resume uploads

### Redirects

- `Redirect` (`models/redirect.js`)
  - `from`, `to`, `type` (301/302)

## 11. Form Submission Pipeline

File: `controller/submitFormController.js`

`POST /contact`

- Validates with Joi.
- Saves to MongoDB (`Contact`).
- Sends lead email via Postmark.
- Pushes data to n8n webhook.
- Sends data to Zapier (finally block).

`POST /brochure-download` and `POST /market-report`

- Save submission
- Send lead email
- Fetch document URL from Strapi and return it
- Send to Zapier

`POST /newsletter`

- Sends to Strapi newsletter endpoint
- Sends confirmation email via Postmark

`POST /landing-page`

- Currently returns an error immediately and does not process submission.

## 12. Password Reset Flow

Files:

- `controller/resetPasswordController.js`
- `utils/resetToken/resetToken.js`

Flow:

1. `POST /admin/resetPassword` requests a reset token.
2. Token saved in `ResetToken` collection.
3. Postmark sends email with reset link.
4. `GET /admin/verifyResetToken/:resetToken` validates token and redirects user to frontend.
5. `POST /admin/resetPassword` with token + new password updates user.

## 13. Search and Filters

Property search uses an aggregation pipeline to match:

- community name
- property type
- bedroom count (regex over type bed counts)
- price range (parsed from human-readable strings like `2M - 5M`)

File: `controller/propertySearchController.js`

Search filters endpoint:

- `GET /user/search-filters` returns property types (from JSON) and community list (from DB).

## 14. Cloudinary Usage

- Cloudinary is configured in `cloudinary/cloudinaryConfig.js`.
- Asset deletion is handled via `POST /admin/deleteAsset` and within some delete handlers.
- Resume upload uses `multer-storage-cloudinary` and accepts only PDFs up to 5MB.

Many models have a `post("find")` or `post("findOne")` hook to automatically inject Cloudinary transformations into image URLs.

## 15. Sitemap and Redirects

- Sitemap is generated by `utils/generateSitemap/generateSitemap.js`.
- `GET /admin/generateSitemap` triggers generation.
- `GET /admin/sitemap` returns sitemap from Strapi.
- `POST /admin/sitemap` updates sitemap in `public/sitemap.xml`.

Redirects:

- CRUD managed under `/admin/redirect-rules`.
- Public blog/news endpoint checks redirects and rewrites slugs when necessary.

## 16. Validation Strategy

Validation is done with Joi under `schemaValidation/`:

- `schema.js` — property, content, agent, community
- `submitForm.js` — all form payloads
- `resetPassword.js` — reset password flow
- `reviewsForm.js` — review submissions

Some validation calls are currently commented out in controllers.

## 17. Seed and Maintenance Scripts

Scripts live under `utils/seedDB/` and `utils/updatePropertiesSchema/`:

- `seedProperties.js`, `seedAgents.js`, `seedCommunity.js`, etc.
- `seedRedirectUrlsfromExcel.js` and Excel file `agent_redirect.xlsx`
- `updatePropertiesSchema.js` for migrations

These scripts are not wired into npm scripts. They are run manually as needed.

## 18. Common Pitfalls

- Admin routes require a logged-in session; use `/admin/login` first.
- Some endpoints return `200` for error states with `{ success: false }`, not 4xx.
- Validation is partially disabled in some controllers (commented out).
- `landing-page` submission returns early with an error.
- Several public routes pull from Strapi; if Strapi is down, data will be partial.

## 19. Suggested Local Setup Checklist

- Create a local `vars/.env` with correct values.
- Ensure MongoDB connection works.
- Confirm Cloudinary and Postmark credentials are valid.
- Log in via `POST /admin/login` and verify session cookie is set.
- Test public endpoints with a few known slugs.

## 20. Where to Start Modifying

- Add new endpoints in `routes/` and wire them in `app.js`.
- Add validation schemas in `schemaValidation/`.
- Update or add Mongoose models in `models/`.
- Reuse `catchAsync` for async controller handlers.

If you want a more specific onboarding guide, I can add flow diagrams or API request examples next.
