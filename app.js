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

const User = require("./models/user");

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

app.use(cors({ origin: true, credentials: true }));

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session(sessionConfig));

app.use(passport.initialize());
app.use(passport.session());
app.use(mongoSanitize());

passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// app.use(async (req, res, next) => {
//   console.log(req.user);
//   next();
// });

// Admin Routes
app.use("/admin", permissionsRouter);
app.use("/admin", rolesRouter);
app.use("/admin", userRouter);
app.use("/admin", propertyRouter);
app.use("/admin", contentRouter);
app.use("/admin", agentRouter);
app.use("/admin", homePageRouter);
app.use("/admin", propertyTypeRouter);
app.use("/admin", communityRouter);
app.use("/admin", resetPassRouter);
app.use("/admin", assestsDeleteRouter);
app.use("/admin", iconRouter);
app.use("/admin", developerRouter);
app.use("/admin", sitemapRouter);
app.use("/admin", reviewsRouter);
app.use("/admin", projectOfTheMonthRouter);


// Public Routes
app.use("/", homePageDataRouter);
app.use("/label/:developerNameSlug", developerPageRouter);
app.use("/meet-the-xr", agentsPageRouter);
app.use("/agent", agentDetailRouter);
app.use("/", agentRouter);
app.use("/area", communityPageRouter);
app.use("/property/:propertySlug", propertyPageRouter);
app.use("/dubai-properties", allProperties);
app.use("/", newsPageRouter);
app.use("/", submitForm);
app.use("/", reviewsForm);
app.use("/", iconRouter);

app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;

  console.log(err);
  if (!err.message) err.message = "Something went wrong";
  res.status(statusCode).json({ success: false, message: err.message });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("Backend Server Started on PORT : ", PORT);
});
