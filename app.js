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

const app = express();

const permissionsRouter = require("./routes/permissions");
const rolesRouter = require("./routes/roles");
const userRouter = require("./routes/user");
const propertyRouter = require("./routes/properties");
const contentRouter = require("./routes/content");
const agentRouter = require("./routes/agent");
const homePageRouter = require("./routes/homePageVideo");

const homePageDataRouter = require("./routes/homepage");

const User = require("./models/user");

const PORT = process.env.PORT;
const DB_URL = process.env.DB_URL;
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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session(sessionConfig));

app.use(passport.initialize());
app.use(passport.session());
app.use(mongoSanitize());

passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// app.use((req, res, next) => {
//   console.log(req.session);
//   next();
// });

// Public Routes
app.use("/", homePageDataRouter);

app.use(permissionsRouter);
app.use(rolesRouter);
app.use(userRouter);
app.use(propertyRouter);
app.use(contentRouter);
app.use(agentRouter);
app.use(homePageRouter);

app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;

  console.log(err);
  if (!err.message) err.message = "Something went wrong";
  res.status(statusCode).json({ success: false, message: err.message });
});

app.listen(PORT, () => {
  console.log("Backend Server Started on PORT : ", PORT);
});
