const Role = require("../models/roles");
const User = require("../models/user");
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    //check if we got either a username or email and proceed accordingly
    let email = req.body.email;
    let username = req.body.username;
    //check if user exists in either case , handling email first if that is the case
    if (email) {
      let user = await User.findOne({ email: email });
      if (!user) {
        return res.status(200).json({
          message: "if the user exists, an email will be sent to them",
        });
      }
    } else if (username) {
      let user = await User.findOne({ username: username });
      if (!user) {
        return res.status(200).json({
          message: "if the user exists, an email will be sent to them",
        });
      }
    }
    next();
  }
);
