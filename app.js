require("dotenv").config({ path: "./vars/.env" });

const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const session = require("express-session");
const LocalStrategy = require("passport-local");
const mongoSanitize = require("express-mongo-sanitize");
const MongoDBStore = require("connect-mongo");
const passportLocalMongoose = require("passport-local-mongoose");
const cors = require("cors");

const path = require("path");

const app = express();

const permissionsRouter = require("./routes/permissions");
const rolesRouter = require("./routes/roles");
const userRouter = require("./routes/user");
const propertyRouter = require("./routes/properties");
const contentRouter = require("./routes/content");
const agentRouter = require("./routes/agent");
const homePageRouter = require("./routes/homePageVideo");
const developerPageRouter = require("./routes/developerPage");
const propertyTypeRouter = require("./routes/propertyType");
const communityRouter = require("./routes/community");
const communityPageRouter = require("./routes/communityPage");
const resetPassRouter = require("./routes/resetPassword");
const assestsDeleteRouter = require("./routes/assetsDelete");
const iconRouter = require("./routes/icons");
const developerRouter = require("./routes/developer");
const sitemapRouter = require("./routes/generateSitemap");
const { webhookRouter: sitemapWebhookRouter } = require("./routes/generateSitemap");
const sitemapTrigger = require("./middleware/sitemapTrigger");
const { CronJob } = require("cron");
const { generateSitemap, forceRegeneration } = require("./utils/generateSitemap/generateSitemap");
const { runHealthCheck } = require("./utils/generateSitemap/sitemapHealthCheck");

const homePageDataRouter = require("./routes/homepage");
const agentsPageRouter = require("./routes/agentPage");
const agentDetailRouter = require("./routes/agentDetailPage");
const propertyPageRouter = require("./routes/propertyPage");
const allProperties = require("./routes/allPropertiesPage");
const newsPageRouter = require("./routes/newsPage");
const submitForm = require("./routes/submitForm");
const reviewsForm = require("./routes/reviewsForm");
const reviewsRouter = require("./routes/reviewsRouter");
const projectOfTheMonthRouter = require("./routes/projectOfTheMonthRouter");
const redirectRouter = require("./routes/redirect");
const dashboardStatsRouter = require("./routes/dashboardStats");
const aboutUsRouter = require("./routes/aboutUsRouter");
const propertySearchRouter = require("./routes/propertySearchRouter");
const fetchSearchFilterRouter = require("./routes/fetchSearchFilterRouter");
const openHouseRsvpRouter = require("./routes/openHouseRsvp");

const User = require("./models/user");
const seoUrlMap = require("./utils/seoUrlMap");

const PORT = process.env.PORT;

const isDevelopment = process.env.ENV === "development";

// Which database to read. Deliberately DECOUPLED from ENV.
//
// This used to be `ENV === "development" ? TEST_DB_URL : DB_URL`, which meant
// the only way to see live data locally was to set ENV=production — and that
// also flips ALLOWED_ORIGINS to the strict production list (no localhost) and
// sets cookie.secure/sameSite=none, so CORS and sessions both break over plain
// http://localhost. Keep ENV=development and set USE_LIVE_DB=true instead.
const useLiveDb =
  String(process.env.USE_LIVE_DB || "").toLowerCase() === "true" ||
  !isDevelopment;

const DB_URL = useLiveDb ? process.env.DB_URL : process.env.TEST_DB_URL;

if (!DB_URL) {
  console.error(
    `FATAL: ${useLiveDb ? "DB_URL" : "TEST_DB_URL"} is not set in vars/.env`
  );
  process.exit(1);
}

// Name the target database on stdout. Silently reading production from a dev
// machine is how test records end up in live collections.
const dbName = (DB_URL.split("/").pop() || "").split("?")[0];
if (isDevelopment && useLiveDb) {
  console.warn(
    [
      "",
      "  ==========================================================",
      "   WARNING: development server connected to the LIVE database",
      `   database: ${dbName}`,
      "   Writes from this process affect the production site.",
      "   Unset USE_LIVE_DB in vars/.env to return to the test DB.",
      "  ==========================================================",
      "",
    ].join("\n")
  );
} else {
  console.log(`Database target: ${dbName} (live=${useLiveDb})`);
}

const SESSION_SECRET = process.env.SESSION_SECRET;

const store = MongoDBStore.create({
  mongoUrl: DB_URL,
  touchAfter: 24 * 3600,
  crypto: {
    secret: SESSION_SECRET,
  },
});

store.on("error", function (e) {
  console.log("SESSION STORE ERROR");
});

// Derived from ENV only — never from which database is in use. Reading live
// data locally must not change CORS or cookie security.
const isProduction = !isDevelopment;

const sessionConfig = {
  store,
  name: "session",
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};

mongoose.connect(DB_URL);

const db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error: "));

db.once("open", () => {
  console.log("Database connected");
});

// Trust the first proxy (AWS ELB) so express-rate-limit and req.ip work correctly
app.set("trust proxy", 1);

const ALLOWED_ORIGINS = isProduction
  ? [
      process.env.FRONTEND_URL,
      "https://www.xrealty.ae",
      "https://xrealty.ae",
      "https://admin.xrealty.ae",
    ].filter(Boolean)
  : true; // allow all in development

app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session(sessionConfig));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(mongoSanitize());

// app.use(async (req, res, next) => {
//   console.log(req.user);
//   next();
// });

app.use((req, res, next) => {
  const path = req.path.endsWith("/") ? req.path : req.path + "/";
  const destination = seoUrlMap[path];
  if (destination) {
    req.url = destination + (req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "");
  }
  next();
})

// ── Live-database write guard ─────────────────────────────────────
// Active only when a DEVELOPMENT process is pointed at the live database
// (ENV=development + USE_LIVE_DB=true). Reads pass through; anything that could
// mutate production is refused before it reaches a route. Deployed instances
// (ENV=production) are unaffected.
//
// Set LIVE_DB_ALLOW_WRITES=true in vars/.env to bypass — needed for admin
// login, which writes a session document.
const LIVE_DB_READ_ONLY =
  isDevelopment &&
  useLiveDb &&
  String(process.env.LIVE_DB_ALLOW_WRITES || "").toLowerCase() !== "true";

if (LIVE_DB_READ_ONLY) {
  const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
  app.use((req, res, next) => {
    if (SAFE_METHODS.has(req.method)) return next();
    console.warn(
      `[live-db-guard] BLOCKED ${req.method} ${req.originalUrl} from ${req.ip}`
    );
    return res.status(423).json({
      success: false,
      message:
        "Refusing to write: this local development server is connected to the " +
        "LIVE database. Set LIVE_DB_ALLOW_WRITES=true in vars/.env to override, " +
        "or unset USE_LIVE_DB to work against the test database.",
    });
  });
  console.warn(
    "[live-db-guard] read-only mode active — non-GET requests will be refused"
  );
}

// Admin Routes
app.use("/admin", permissionsRouter);
app.use("/admin", rolesRouter);
app.use("/admin", userRouter);
app.use("/admin", sitemapTrigger, propertyRouter);       // auto-regen on property CRUD
app.use("/admin", sitemapTrigger, contentRouter);         // auto-regen on blog/news CRUD
app.use("/admin", sitemapTrigger, agentRouter);           // auto-regen on agent CRUD
app.use("/admin", homePageRouter);
app.use("/admin", propertyTypeRouter);
app.use("/admin", sitemapTrigger, communityRouter);       // auto-regen on community CRUD
app.use("/admin", resetPassRouter);
app.use("/admin", assestsDeleteRouter);
app.use("/admin", iconRouter);
app.use("/admin", sitemapTrigger, developerRouter);       // auto-regen on developer CRUD
app.use("/admin", sitemapRouter);
app.use("/admin", reviewsRouter);
app.use("/admin", projectOfTheMonthRouter);
app.use("/admin/redirect-rules", sitemapTrigger, redirectRouter); // auto-regen on redirect CRUD
app.use("/admin", dashboardStatsRouter);

// Sitemap webhook (for Strapi to call)
app.use("/api/sitemap", sitemapWebhookRouter);

// Public Routes
app.use("/", homePageDataRouter);
app.use("/label/:developerNameSlug", developerPageRouter);
app.use("/meet-the-xr", agentsPageRouter);
app.use("/agent", agentDetailRouter);
app.use("/", agentRouter);
app.use("/", propertyTypeRouter);

app.use("/area", communityPageRouter);
app.use("/property/:propertySlug", propertyPageRouter);
app.use("/dubai-properties", allProperties);
app.use("/about-us", aboutUsRouter);
app.use("/", newsPageRouter);
app.use("/", submitForm);
app.use("/", reviewsForm);
app.use("/", iconRouter);
app.use("/", propertySearchRouter);
app.use("/", fetchSearchFilterRouter);

// Open House RSVP
app.use("/api/openhouse", openHouseRsvpRouter);

// Resume Upload
app.use("/resume", require("./routes/resumeUpload"));


app.use("*", (req, res) => {
  return res.status(404).json({ success: false, message: "Page not found" });
});

app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;

  console.log(err);
  if (!err.message) err.message = "Something went wrong";
  res.status(statusCode).json({ success: false, message: err.message });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("Backend Server Started on PORT : ", PORT);

  // ── Helper: generate sitemap + run health check ───────────────
  async function generateAndClean(reason) {
    const result = await generateSitemap();
    if (!result.success) {
      console.warn(`[Sitemap] Generation failed (${reason}):`, result.error);
      return;
    }
    console.log(`[Sitemap] ${reason} generation complete — ${result.urlCount} URLs`);

    // Auto health check after startup and cron (not CRUD-triggered)
    try {
      console.log(`[SitemapAudit] Auto health check starting (${reason})...`);
      const audit = await runHealthCheck();
      if (audit.badUrls > 0) {
        console.log(
          `[SitemapAudit] Removed ${audit.removed} bad URLs (run: ${audit.auditRunId})`
        );
      } else {
        console.log("[SitemapAudit] All URLs healthy — nothing to remove");
      }
    } catch (err) {
      console.error(`[SitemapAudit] Auto health check failed (${reason}):`, err);
    }
  }

  // ── Sitemap: generate + clean on startup ─────────────────────
  generateAndClean("Startup")
    .catch((err) => console.error("[Sitemap] Startup error:", err));

  // Cron: every 2 hours — regenerate + auto health check
  const sitemapCron = new CronJob("0 */2 * * *", async () => {
    console.log("[Sitemap] Cron triggered — regenerating...");
    await generateAndClean("Cron");
  });
  sitemapCron.start();
  console.log("[Sitemap] Cron scheduled — every 2 hours (with auto health check)");
});
