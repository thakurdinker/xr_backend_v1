const Role = require("../models/roles");
const catchAsync = require("../utils/seedDB/catchAsync");

module.exports.isLoggedIn = catchAsync(async (req, res, next) => {
  if (!req.user) {
    return res.status(200).json({
      success: false,
      message: "You are not logged in",
    });
  }
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
