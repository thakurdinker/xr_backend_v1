const express = require("express");
const { rateLimit } = require("express-rate-limit");
const {
  resetPassRequestMiddleWare,
  resetPasswordMiddleware,
} = require("../middleware/middleware");
const {
  resetPasswordRequest,
  verifyResetToken,
  resetUserPass,
} = require("../controller/resetPasswordController");

const router = express.Router({ mergeParams: true });

// Rate limit: 5 reset requests per 15 minutes per IP
const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: "Too many reset requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  "/resetPasswordRequest",
  resetLimiter,
  resetPassRequestMiddleWare,
  resetPasswordRequest
);
//this is what our frontend client will use
//to call the server and get the user to change their password
router.get("/verifyResetToken/:resetToken", verifyResetToken);

router.post("/resetPassword", resetPasswordMiddleware, resetUserPass);

module.exports = router;
