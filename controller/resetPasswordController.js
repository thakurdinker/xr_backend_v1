const ResetToken = require("../models/resettoken");
const { sendResetEmail } = require("../utils/postmark/postmarkConfig");
const {
  createResetToken,
  verifyJWTToken,
  resetPassword,
} = require("../utils/resetToken/resetToken");
const catchAsync = require("../utils/seedDB/catchAsync");

module.exports.resetPasswordRequest = catchAsync(async (req, res) => {
  const { email } = req.body;

  //if the user supplied an email
  let resetToken = await createResetToken({ email: email });
  if (resetToken.error) {
    res.status(400).send({ message: "Error creating reset token" });
  } else {
    //send the email link here
    sendResetEmail({ email: email, content: resetToken.resetToken });
    res
      .status(200)
      .send({ message: "if the user exists, an email will be sent to them" });
  }
});

module.exports.verifyResetToken = catchAsync(async (req, res) => {
  const { resetToken } = req.params;
  console.log("received request to verify reset token: ", resetToken);
  let verified = verifyJWTToken(resetToken);
  if (verified.error) {
    return res.status(400).send({
      error: true,
      message: "invalid token or token expired",
    });
  }

  let verifiedResetToken = await ResetToken.findOne({ resetToken: resetToken });
  
  if (verifiedResetToken) {
    return res.redirect(`${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(verifiedResetToken.user.email)}`);
  } else {
    return res.redirect(`${process.env.FRONTEND_URL}/pages/error-page`);
  }
});

module.exports.resetUserPass = catchAsync(async (req, res) => {
  const { password, user } = req.body;
  console.log("received request to reset password for user: ", user);
  let updated = await resetPassword(user, password);
  if (updated.error) {
    return res.status(400).send(updated);
  } else {
    await ResetToken.deleteOne({ resetToken: req.body.resetToken });
    return res.status(200).send(updated);
  }
});