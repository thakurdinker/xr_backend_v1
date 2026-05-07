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
const aboutUsRouter = require("./routes/aboutUsRouter");
const propertySearchRouter = require("./routes/propertySearchRouter");
const fetchSearchFilterRouter = require("./routes/fetchSearchFilterRouter");

const User = require("./models/user");
const seoUrlMap = require("./utils/seoUrlMap");

const PORT = process.env.PORT;
const DB_URL =
  process.env.ENV === "development"
    ? process.env.TEST_DB_URL
    : process.env.DB_URL;

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

const sessionConfig = {
  store,
  name: "session",
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    // secure: true,
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

app.use(cors({ origin: true, credentials: true }));

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

  // ── Sitemap: generate on startup + schedule every 2 hours ────
  generateSitemap()
    .then((result) => {
      if (result.success) {
        console.log(`[Sitemap] Startup generation complete — ${result.urlCount} URLs`);
      } else {
        console.warn("[Sitemap] Startup generation failed:", result.error);
      }
    })
    .catch((err) => console.error("[Sitemap] Startup generation error:", err));

  // Cron: every 2 hours at minute 0 (00:00, 02:00, 04:00, ...)
  const sitemapCron = new CronJob("0 */2 * * *", async () => {
    console.log("[Sitemap] Cron triggered — regenerating...");
    await generateSitemap();
  });
  sitemapCron.start();
  console.log("[Sitemap] Cron scheduled — every 2 hours");

  // Cron: daily health check at 03:30 AM (after the 02:00 sitemap regen)
  const healthCheckCron = new CronJob("30 3 * * *", async () => {
    console.log("[SitemapAudit] Daily health check triggered...");
    try {
      const result = await runHealthCheck();
      if (result.badUrls > 0) {
        console.log(
          `[SitemapAudit] Removed ${result.removed} bad URLs (run: ${result.auditRunId})`
        );
      } else {
        console.log("[SitemapAudit] All URLs healthy — nothing to remove");
      }
    } catch (err) {
      console.error("[SitemapAudit] Daily health check failed:", err);
    }
  });
  healthCheckCron.start();
  console.log("[SitemapAudit] Daily health check scheduled — 03:30 AM");
});
