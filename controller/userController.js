const { default: mongoose } = require("mongoose");
const User = require("../models/user");
const catchAsync = require("../utils/seedDB/catchAsync");
const ExpressError = require("../utils/seedDB/ExpressError");

// get all users (with optional pagination + search)
module.exports.listUsers = catchAsync(async (req, res) => {
  const { page, limit: limitParam, search } = req.query;

  // If no page param, return all users (backward compatible)
  if (!page) {
    const users = await User.find({}).populate({
      path: "role",
      select: "role_name",
    });
    return res.status(200).json({ success: true, users, message: "DONE" });
  }

  const pageNum = parseInt(page) || 1;
  const limit = parseInt(limitParam) || 10;
  const skip = (pageNum - 1) * limit;

  let query = {};
  if (search && search.trim()) {
    const searchRegex = { $regex: search.trim(), $options: "i" };
    query = {
      $or: [
        { first_name: searchRegex },
        { last_name: searchRegex },
        { username: searchRegex },
        { email: searchRegex },
      ],
    };
  }

  const [users, totalCount] = await Promise.all([
    User.find(query)
      .populate({ path: "role", select: "role_name" })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(query),
  ]);

  return res.status(200).json({
    success: true,
    users,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: pageNum,
    totalCount,
    message: "DONE",
  });
});

// add user
module.exports.register = catchAsync(async (req, res) => {
  const { first_name, last_name, email, password, roleId, username } = req.body;

  if (!first_name || first_name.trim() === "") {
    return res.status(400).json({
      success: false,
      isRegistered: false,
      message: "First name is required",
    });
  }

  if (!last_name || last_name.trim() === "") {
    return res.status(400).json({
      success: false,
      isRegistered: false,
      message: "Last name is required",
    });
  }

  if (!username || username.trim() === "") {
    return res.status(400).json({
      success: false,
      isRegistered: false,
      message: "Username is required",
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email.trim())) {
    return res.status(400).json({
      success: false,
      isRegistered: false,
      message: "Please provide a valid email address",
    });
  }

  // Password strength check
  if (!password || password.trim().length < 6) {
    return res.status(400).json({
      success: false,
      isRegistered: false,
      message: "Password must be at least 6 characters",
    });
  }

  if (!roleId || roleId.trim() === "") {
    return res.status(400).json({
      success: false,
      isRegistered: false,
      message: "Role is required",
    });
  }

  if (!mongoose.isValidObjectId(roleId)) {
    return res.status(400).json({
      success: false,
      isRegistered: false,
      message: "Not a valid role",
    });
  }

  // Check for duplicate username or email
  const existingUser = await User.findOne({
    $or: [
      { username: username.trim() },
      { email: email.trim().toLowerCase() },
    ],
  });
  if (existingUser) {
    const field = existingUser.username === username.trim() ? "username" : "email";
    return res.status(409).json({
      success: false,
      isRegistered: false,
      message: `A user with that ${field} already exists`,
    });
  }

  // Verify role exists
  const Role = require("../models/roles");
  const roleExists = await Role.findById(roleId);
  if (!roleExists) {
    return res.status(400).json({
      success: false,
      isRegistered: false,
      message: "Selected role does not exist",
    });
  }

  const newUser = new User({
    first_name: first_name.trim(),
    last_name: last_name.trim(),
    email: email.trim().toLowerCase(),
    role: roleId,
    username: username.trim(),
  });

  try {
    await User.register(newUser, password);
  } catch (err) {
    // passport-local-mongoose throws if username is taken
    return res.status(409).json({
      success: false,
      isRegistered: false,
      message: err.message || "Registration failed",
    });
  }

  return res
    .status(201)
    .json({ success: true, isRegistered: true, message: "User registered successfully" });
});

module.exports.logout = catchAsync(async (req, res) => {
  req.logout((err) => {
    if (err) {
      return res
        .status(500)
        .json({ success: false, isLoggedOut: false, message: "Logout failed" });
    }
    // Destroy the session entirely so the cookie is invalidated
    req.session.destroy((sessionErr) => {
      if (sessionErr) {
        console.error("Session destroy error:", sessionErr);
      }
      res.clearCookie("session");
      return res
        .status(200)
        .json({ success: true, isLoggedOut: true, message: "Logged Out" });
    });
  });
});

module.exports.getUserById = catchAsync(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(200).json({ success: false, message: "Invalid id" });
  }

  const user = await User.findById(id).populate({
    path: "role",
    select: "_id role_name permissons",
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
      .status(400)
      .json({ success: false, isUpdated: false, message: "Invalid id" });
  }

  const user = await User.findById(id);

  if (!user) {
    return res
      .status(404)
      .json({ success: false, isUpdated: false, message: "User not found" });
  }

  if (first_name && first_name.trim() !== "") {
    user.first_name = first_name.trim();
  }

  if (last_name && last_name.trim() !== "") {
    user.last_name = last_name.trim();
  }

  if (roleId && roleId.trim() !== "") {
    if (!mongoose.isValidObjectId(roleId)) {
      return res
        .status(400)
        .json({ success: false, isUpdated: false, message: "Invalid role ID" });
    }
    // Verify role exists
    const Role = require("../models/roles");
    const roleExists = await Role.findById(roleId);
    if (!roleExists) {
      return res
        .status(400)
        .json({ success: false, isUpdated: false, message: "Selected role does not exist" });
    }
    user.role = roleId;
  }

  try {
    await user.save();
    return res.status(200).json({
      success: true,
      isUpdated: true,
      message: "User updated",
    });
  } catch (err) {
    return res.status(500).json({
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
      .status(400)
      .json({ success: false, isDeleted: false, message: "Invalid id" });
  }

  // Prevent self-deletion
  if (req.user && req.user._id.toString() === id) {
    return res
      .status(403)
      .json({ success: false, isDeleted: false, message: "You cannot delete your own account" });
  }

  try {
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return res
        .status(404)
        .json({ success: false, isDeleted: false, message: "User not found" });
    }
    return res
      .status(200)
      .json({ success: true, isDeleted: true, message: "User deleted" });
  } catch (err) {
    return res.status(500).json({
      success: false,
      isDeleted: false,
      message: "Error deleting user",
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
    .json({ success: true, isLoggedIn: true, user, message: "DONE" });
});
