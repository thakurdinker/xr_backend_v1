const { default: mongoose } = require("mongoose");
const User = require("../models/user");
const catchAsync = require("../utils/seedDB/catchAsync");
const ExpressError = require("../utils/seedDB/ExpressError");

// get all users
module.exports.listUsers = catchAsync(async (req, res) => {
  const users = await User.find({}).populate({
    path: "role",
    select: " role_name",
  });

  return res.status(200).json({ success: true, users, message: "DONE" });
});

// add user
module.exports.register = catchAsync(async (req, res) => {
  const { first_name, last_name, email, password, roleId, username } = req.body;

  if (!first_name || first_name.trim() === "") {
    return res.status(200).json({
      success: false,
      isRegistered: false,
      message: "Please Provide First Name",
    });
  }

  if (!last_name || last_name.trim() === "") {
    return res.status(200).json({
      success: false,
      isRegistered: false,
      message: "Please Provide Last Name",
    });
  }

  if (!username || username.trim() === "") {
    return res.status(200).json({
      success: false,
      isRegistered: false,
      message: "Username Cannot be empty",
    });
  }

  if (!email || email.trim() === "") {
    return res.status(200).json({
      success: false,
      isRegistered: false,
      message: "Please Provide Valid Email",
    });
  }

  if (!password || password.trim() === "") {
    return res.status(200).json({
      success: false,
      isRegistered: false,
      message: "Password Cannot be empty",
    });
  }

  if (!roleId || roleId.trim() === "") {
    return res.status(200).json({
      success: false,
      isRegistered: false,
      message: "Role Cannot be empty",
    });
  }

  if (!mongoose.isValidObjectId(roleId)) {
    return res.status(200).json({
      success: false,
      isRegistered: false,
      message: "Not a valid Role",
    });
  }

  const newUser = new User({
    first_name,
    last_name,
    email,
    role: roleId,
    username,
  });

  const registeredUser = await User.register(newUser, password);

  req.login(registeredUser, (err) => {
    if (err) return res.send("Failed Logging In");
    return res.send("User Registered");
  });
});

module.exports.logout = catchAsync(async (req, res) => {
  req.logout((err) => {
    if (!err) {
      return res.send("Logged Out");
    } else {
      return res.send("Failed Logging Out");
    }
  });
});

module.exports.getUserById = catchAsync(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(200).json({ success: false, message: "Invalid id" });
  }

  const user = await User.findById(id).populate({
    path: "role",
    select: "-_id role_name permissons",
    populate: {
      path: "permissions",
      select: "permission_name",
    },
  });

  if (!user) {
    return res.status(200).json({ success: false, message: "user not found" });
  }

  return res.status(200).json({ success: true, user, message: "DONE" });
});

module.exports.updateUser = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, roleId } = req.body;
  if (!mongoose.isValidObjectId(id)) {
    return res
      .status(200)
      .json({ success: false, isUpdated: false, message: "Invalid id" });
  }

  const user = await User.findById(id);

  if (!user) {
    return res
      .status(200)
      .json({ success: false, isUpdated: false, message: "user not found" });
  }

  if (first_name && first_name.trim() !== "") {
    user.first_name = first_name;
  }

  if (last_name && last_name.trim() !== "") {
    user.last_name = last_name;
  }

  if (roleId && roleId.trim() !== "") {
    if (mongoose.isValidObjectId(roleId)) {
      user.role = roleId;
    }
  }

  try {
    await user.save();
    return res.status(200).json({
      success: true,
      isUpdated: true,
      message: "DONE",
    });
  } catch (err) {
    return res.status(200).json({
      success: false,
      isUpdated: false,
      message: "Something went wrong",
    });
  }
});

module.exports.deleteUser = catchAsync(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res
      .status(200)
      .json({ success: false, isDeleted: false, message: "Invalid id" });
  }

  try {
    await User.findByIdAndDelete(id);
    return res
      .status(200)
      .json({ success: true, isDeleted: true, message: "DONE" });
  } catch (err) {
    return res.status(200).json({
      success: false,
      isDeleted: false,
      message: "Error Deleting user",
    });
  }
});

// get current user
module.exports.currentUser = catchAsync(async (req, res) => {
  if (!req.user) {
    return res
      .status(200)
      .json({ success: false, isLoggedIn: false, user: null, message: "DONE" });
  }
  const user = await User.findById(req.user.id).populate({
    path: "role",
    select: "-_id role_name",
  });
  return res
    .status(200)
    .json({ success: false, isLoggedIn: true, user, message: "DONE" });
});
