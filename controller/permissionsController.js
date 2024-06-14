const { default: mongoose } = require("mongoose");
const Permission = require("../models/permissions");
const catchAsync = require("../utils/seedDB/catchAsync");

// get all permissions
module.exports.listAll = catchAsync(async (req, res) => {
  const permissions = await Permission.find({});

  return res.status(200).json({ success: true, permissions, message: "DONE" });
});

// Add a permission
module.exports.addPermission = catchAsync(async (req, res) => {
  const { permission_name, description } = req.body;

  if (!permission_name || permission_name.trim() === "") {
    return res.status(200).json({
      success: false,
      message: "Please provide permissions name",
      isCreated: false,
    });
  }

  if (!description || description.trim() === "") {
    return res.status(200).json({
      success: false,
      message: "Please provide description",
      isCreated: false,
    });
  }

  const newPermission = new Permission({
    permission_name,
    description,
  });

  try {
    await newPermission.save();
    return res
      .status(200)
      .json({ success: true, isCreated: true, message: "DONE" });
  } catch (e) {
    return res.status(200).json({
      success: false,
      isCreated: false,
      message: "Unable to add Permission",
    });
  }
});

// get permission details by id
module.exports.getById = catchAsync(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(200).json({ success: false, message: "Invalid Id" });
  }
  const permission = await Permission.findById(id);
  if (!permission) {
    return res.status(200).json({
      success: false,
      message: "Permission not found",
    });
  }
  return res.status(200).json({
    success: true,
    permission,
    message: "DONE",
  });
});

// Update a permission
module.exports.updatePermission = catchAsync(async (req, res) => {
  const { permission_name, description } = req.body;
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res
      .status(200)
      .json({ success: false, isUpdated: false, message: "Invalid Id" });
  }

  const permission = await Permission.findById(id);

  if (!permission) {
    return res.status(200).json({
      success: false,
      isUpdated: false,
      message: "Permission doesn't exist",
    });
  }

  if (!permission || permission_name.trim() !== "") {
    permission.permission_name = permission_name;
  }
  if (!description || description.trim() !== "") {
    permission.description = description;
  }

  await permission.save();

  return res.status(200).json({
    success: true,
    isUpdated: true,
    message: "DONE",
  });
});

// Delete a permission

module.exports.delete = catchAsync(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res
      .status(200)
      .json({ success: false, isDeleted: false, message: "Invalid Id" });
  }
  await Permission.findByIdAndDelete(id);
  return res.status(200).json({
    success: true,
    isDeleted: true,
    message: "DONE",
  });
});
