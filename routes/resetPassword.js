const express = require("express");
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

router.post(
  "/resetPasswordRequest",
  resetPassRequestMiddleWare,
  resetPasswordRequest
);
//this is what our frontend client will use
//to call the server and get the user to change their password
router.get("/verifyResetToken/:resetToken", verifyResetToken);

router.post("/resetPassword", resetPasswordMiddleware, resetUserPass);

module.exports = router;
