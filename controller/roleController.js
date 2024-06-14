const { default: mongoose } = require("mongoose");
const Role = require("../models/roles");
const catchAsync = require("../utils/seedDB/catchAsync");

//  list all roles
module.exports.listAll = catchAsync(async (req, res) => {
  const roles = await Role.find({}).select("id role_name");

  return res.status(200).json({ success: true, roles, message: "DONE" });
});

// add a role
module.exports.addRole = catchAsync(async (req, res) => {
  const { role_name, permissionsIds } = req.body;

  if (!permissionsIds || permissionsIds.trim() === "") {
    return res.status(200).json({
      success: false,
      message: "Please provide permissions",
      isCreated: false,
    });
  }

  if (!role_name || role_name.trim() === "") {
    return res.status(200).json({
      success: false,
      message: "Please provide role name",
      isCreated: false,
    });
  }

  let newPermissionsArr = [];

  const newRole = new Role({
    role_name,
  });

  newPermissionsArr = permissionsIds.split(",");

  for (let i = 0; i < newPermissionsArr.length; i++) {
    if (!mongoose.isValidObjectId(newPermissionsArr[i])) {
      continue;
    }
    newRole.permissions.push(newPermissionsArr[i]);
  }

  try {
    await newRole.save();
  } catch (err) {
    return res.status(200).json({
      success: false,
      message: "Something went wrong",
      isCreated: false,
    });
  }

  return res
    .status(200)
    .json({ success: true, isCreated: true, message: "DONE" });
});

// get a role by id
module.exports.getbyId = catchAsync(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(200).json({
      success: false,
      message: "Please provide valid id",
    });
  }
  const role = await Role.findById(id).populate("permissions");
  if (!role) {
    return res.status(200).json({
      success: false,
      message: "Role not found",
    });
  }
  return res.status(200).json({
    success: true,
    message: "DONE",
    role,
  });
});

// update a role
module.exports.updateRole = catchAsync(async (req, res) => {
  const { role_name, permissionsIds } = req.body;
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(200).json({
      success: false,
      message: "Invalid Role id",
      isUpdated: false,
    });
  }
  const role = await Role.findById(id);

  if (!role) {
    return res.status(200).json({
      success: false,
      message: "Role not found",
      isUpdated: false,
    });
  }

  if (!permissionsIds || permissionsIds.trim() === "") {
    return res.status(200).json({
      success: false,
      message: "Please provide permissions",
      isUpdated: false,
    });
  }

  if (!role_name || !role_name.trim() === "") role.role_name = role_name;

  let newPermissionsArr = [];

  newPermissionsArr = permissionsIds.split(",");

  let tempArr = [];

  for (let i = 0; i < newPermissionsArr.length; i++) {
    if (!mongoose.isValidObjectId(newPermissionsArr[i])) {
      continue;
    }
    tempArr.push(newPermissionsArr[i]);
  }

  role.permissions = tempArr;

  try {
    await role.save();
  } catch (err) {
    return res.status(200).json({
      success: false,
      message: "Something went wrong",
      isUpdated: false,
    });
  }

  return res
    .status(200)
    .json({ success: true, isUpdated: true, message: "DONE" });
});

// delete a role
module.exports.delete = catchAsync(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(200).json({
      success: false,
      message: "Invalid ID",
      isDeleted: false,
    });
  }

  try {
    await Role.findByIdAndDelete(id);
  } catch (err) {
    return res.status(200).json({
      success: false,
      message: "Something went wrong",
      isDeleted: false,
    });
  }
  return res.status(200).json({
    success: true,
    isDeleted: true,
    message: "DONE",
  });
});
