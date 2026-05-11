const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../vars/.env") });
const ResetToken = require("../models/resettoken");
const { sendResetEmail } = require("../utils/postmark/postmarkConfig");
const {
  createResetToken,
  verifyJWTToken,
  resetPassword,
} = require("../utils/resetToken/resetToken");
const catchAsync = require("../utils/seedDB/catchAsync");

const FRONTEND_URL =
  process.env.ENV === "development"
    ? "http://localhost:5173"
    : process.env.FRONTEND_URL;

module.exports.resetPasswordRequest = catchAsync(async (req, res) => {
  const { email } = req.body;

  // Always return the same generic message to prevent user enumeration
  const genericMessage = "If an account with that email exists, a reset link has been sent.";

  try {
    let resetToken = await createResetToken({ email: email });
    if (!resetToken.error) {
      sendResetEmail({ email: email, content: resetToken.resetToken });
    }
  } catch (err) {
    // Log internally but don't reveal to user
    console.error("Reset token creation error:", err);
  }

  return res.status(200).json({ success: true, message: genericMessage });
});

module.exports.verifyResetToken = catchAsync(async (req, res) => {
  const { resetToken } = req.params;
  let verified = verifyJWTToken(resetToken);
  if (verified.error) {
    return res.redirect(`${FRONTEND_URL}/auth/signin?error=expired`);
  }

  let verifiedResetToken = await ResetToken.findOne({ resetToken: resetToken }).populate("user", "email");

  if (verifiedResetToken && verifiedResetToken.user) {
    return res.redirect(
      `${FRONTEND_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(
        verifiedResetToken.user.email
      )}`
    );
  } else {
    return res.redirect(`${FRONTEND_URL}/auth/signin?error=invalid`);
  }
});

module.exports.resetUserPass = catchAsync(async (req, res) => {
  const { password, user } = req.body;
  let updated = await resetPassword(user, password);
  if (updated.error) {
    return res.status(400).send(updated);
  } else {
    await ResetToken.deleteOne({ resetToken: req.body.resetToken });
    return res.status(200).send(updated);
  }
});
