const Icon = require("../models/icons");

// Create a new icon
exports.createIcon = async (req, res) => {
  try {
    const icon = new Icon(req.body);
    await icon.save();
    res.status(200).json({ success: true, isCreated: true, message: "DONE" });
  } catch (error) {
    res.status(200).json({ success: false, isCreated: false, message: error.message });
  }
};

exports.getAllIcons = async (req, res) => {
  try {
    const icons = await Icon.find();

    res.status(200).json({
      success: true,
      icons,
      message: "DONE",
    });
  } catch (error) {
    res.status(200).json({ success: false, message: error.message });
  }
};

// Get all icons with pagination
exports.getIcons = async (req, res) => {
  const { page = 1, limit = 10 } = req.query; // Default to page 1, limit 10

  try {
    const icons = await Icon.find()
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    // Count the total number of documents
    const count = await Icon.countDocuments();

    res.status(200).json({
      success: true,
      icons,
      message: "DONE",
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalIcons: count
    });
  } catch (error) {
    res.status(200).json({ success: false, message: error.message });
  }
};

// Get a single icon by ID
exports.getIconById = async (req, res) => {
  try {
    const icon = await Icon.findById(req.params.id);
    if (icon) {
      res.status(200).json({ success: true, icon, message: "DONE" });
    } else {
      res.status(200).json({ success: false, icon: null, message: "Not Found" });
    }
  } catch (error) {
    res.status(200).json({ success: false, message: error.message });
  }
};

// Update an icon by ID
exports.updateIcon = async (req, res) => {
  try {
    const icon = await Icon.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (icon) {
      res.status(200).json({ success: true, isUpdated: true, message: "DONE" });
    } else {
      res.status(200).json({ success: false, isUpdated: false, message: "Not Found" });
    }
  } catch (error) {
    res.status(200).json({ success: false, message: error.message });
  }
};

// Delete an icon by ID
exports.deleteIcon = async (req, res) => {
  try {
    const icon = await Icon.findByIdAndDelete(req.params.id);
    if (icon) {
      res.status(200).json({ success: true, isDeleted: true, message: "DONE" });
    } else {
      res.status(200).json({ success: true, isDeleted: false, message: "Not Found" });
    }
  } catch (error) {
    res.status(200).json({ success: false, message: error.message });
  }
};
