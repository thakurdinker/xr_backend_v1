const express = require("express");
const { rateLimit } = require("express-rate-limit");

const router = express.Router({ mergeParams: true });

const userController = require("../controller/userController");
const passport = require("passport");
const catchAsync = require("../utils/seedDB/catchAsync");
const { isLoggedIn, isAdmin } = require("../middleware/middleware");

// Rate limit: 10 login attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many login attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.route("/getUsers").get(isLoggedIn, isAdmin, userController.listUsers);

router
  .route("/getUsers/:id")
  .get(isLoggedIn, isAdmin, userController.getUserById)
  .put(isLoggedIn, isAdmin, userController.updateUser)
  .delete(isLoggedIn, isAdmin, userController.deleteUser);

router.route("/register").post(isLoggedIn, isAdmin, userController.register);

router.route("/currentuser").get(userController.currentUser);

router
  .route("/login")
  .post(loginLimiter, (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        return res
          .status(500)
          .json({ success: false, message: "An error occurred during login." });
      }
      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: info?.message || "Invalid username or password." });
      }
      req.logIn(user, (err) => {
        if (err) {
          return res
            .status(500)
            .json({ success: false, message: "Failed to create session." });
        }
        return res.status(200).json({ success: true, message: "DONE" });
      });
    })(req, res, next);
  });

// Keep for backward compatibility but with proper message
router.route("/failedLogin").get(
  catchAsync(async (req, res) => {
    res.status(401).json({ success: false, message: "Invalid username or password." });
  })
);

router.get("/logout", userController.logout);

module.exports = router;
