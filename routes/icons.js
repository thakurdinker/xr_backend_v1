const express = require("express");
const Icon = require("../models/icons");
const router = express.Router({ mergeParams: true });

// Create
router.route("/icons").post(async (req, res) => {
  try {
    const icon = new Icon(req.body);
    await icon.save();
    res.status(200).json({ success: true, isCreated: true, message: "DONE" });
  } catch (error) {
    res
      .status(200)
      .json({ success: false, isCreated: false, message: error.message });
  }
});

// Read (All)
router.route("/icons").get(async (req, res) => {
  try {
    const icons = await Icon.find();
    res.status(200).json({ success: true, icons, message: "DONE" });
  } catch (error) {
    res.status(200).json({ success: false, message: error.message });
  }
});

// Read (Single)
router.route("/icons/:id").get(async (req, res) => {
  try {
    const icon = await Icon.findById(req.params.id);
    if (icon) {
      res.status(200).json({ success: true, icon, message: "DONE" });
    } else {
      res
        .status(200)
        .json({ success: false, icon: null, message: "Not Found" });
    }
  } catch (error) {
    res.status(200).json({ success: false, message: error.message });
  }
});

// Update
router.route("/icons/:id").put(async (req, res) => {
  try {
    const icon = await Icon.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (icon) {
      res.status(200).json({ success: true, isUpdated: true, message: "DONE" });
    } else {
      res
        .status(200)
        .json({ success: false, isUpdated: false, message: "Not Found" });
    }
  } catch (error) {
    res.status(200).json({ success: false, message: error.message });
  }
});

// Delete
router.route("/icons/:id").delete(async (req, res) => {
  try {
    const icon = await Icon.findByIdAndDelete(req.params.id);
    if (icon) {
      res.status(200).json({ success: true, isDeleted: true, message: "DONE" });
    } else {
      res
        .status(200)
        .json({ success: true, isDeleted: false, message: "Not Found" });
    }
  } catch (error) {
    res.status(200).json({ success: false, message: error.message });
  }
});

module.exports = router;
