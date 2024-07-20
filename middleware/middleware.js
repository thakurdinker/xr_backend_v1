const ResetToken = require("../models/resettoken");
const Role = require("../models/roles");
const User = require("../models/user");
const {
  resetPasswordRequestValidation,
  resetPasswordValidation,
} = require("../schemaValidation/resetPassword");
const { verifyJWTToken } = require("../utils/resetToken/resetToken");
const catchAsync = require("../utils/seedDB/catchAsync");

module.exports.isLoggedIn = catchAsync(async (req, res, next) => {
  if (!req.user) {
    return res.status(200).json({
      success: false,
      message: "You are not logged in",
    });
  }
  next();
});

module.exports.isAdmin = catchAsync(async (req, res, next) => {
  if (req.user) {
    const role = await Role.findById(req.user.role);
    if (role && role.role_name === "admin") {
      return next();
    }
    return res.status(200).json({
      success: false,
      message: "You are not Authorized",
    });
  }
});

module.exports.resetPassRequestMiddleWare = catchAsync(
  async (req, res, next) => {
    const { error } = resetPasswordRequestValidation.validate(req.body);

    if (error) {
      return res.status(200).json({
        success: false,
        message: "Please Provide a valid Email",
      });
    }

    //check if we got either a username or email and proceed accordingly
    let email = req.body.email;
    // let username = req.body.username;
    //check if user exists in either case , handling email first if that is the case
    if (email) {
      let user = await User.findOne({ email: email });
      if (!user) {
        return res.status(200).json({
          message: "if the user exists, an email will be sent to them",
        });
      }
    }
    next();
  }
);

module.exports.resetPasswordMiddleware = catchAsync(async (req, res, next) => {

  const { errors } = resetPasswordValidation.validate(req.body);
  if (errors) {
    return res.status(422).json({ errors: errors });
  }
  //get the token from the request
  let resetToken = req.body.resetToken;
  //check if the token is valid or expired
  let verified = verifyJWTToken(resetToken);
  if (verified.error) {
    return res.status(422).json({
      message: "invalid or expired token",
      error: true,
    });
  }
  //check if the token exists in the database
  let verifiedResetToken = await ResetToken.findOne({ resetToken: resetToken });
  if (!verifiedResetToken) {
    return res.status(422).json({
      message: "invalid token",
      error: true,
    });
  }

  //can add any other checks here if needed such as
  //checking if the user exists in the database
  //checking the ip address of the user who requested the reset
  //checking the region etc, can also check and add previous passwords
  //to the user model if needed and prevent the user from using the same password
  //here would be a good check for that if implementing
  let userID = verifiedResetToken.user;
  req.body.user = userID;
  next();
});
