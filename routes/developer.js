const express = require("express");
const Developer = require("../models/developer");
const { isLoggedIn } = require("../middleware/middleware");

const router = express.Router({ mergeParams: true });

// Create a new developer
router.route("/developers").post(isLoggedIn, async (req, res) => {
  try {
    const developer = new Developer(req.body);
    await developer.save();
    return res.status(200).json({
      success: true,
      isCreated: true,
      message: "DONE",
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      isCreated: false,
      message: error.message,
    });
  }
});

// Get all developers
router.route("/developers").get(async (req, res) => {
  try {
    const developers = await Developer.find({});
    return res.status(200).json({
      success: true,
      isFetched: true,
      message: "DONE",
      data: developers,
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      isFetched: false,
      message: error.message,
    });
  }
});

// Get a developer by ID
router.route("/developers/:id").get(isLoggedIn, async (req, res) => {
  try {
    const developer = await Developer.findById(req.params.id);
    if (!developer) {
      return res.status(200).json({
        success: false,
        isFetched: false,
        message: "Developer not found",
      });
    }
    return res.status(200).json({
      success: true,
      isFetched: true,
      message: "DONE",
      data: developer,
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      isFetched: false,
      message: error.message,
    });
  }
});

// Update a developer by ID
router.route("/developers/:id").put(isLoggedIn, async (req, res) => {
  try {
    const developer = await Developer.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );
    if (!developer) {
      return res.status(200).json({
        success: false,
        isUpdated: false,
        message: "Developer not found",
      });
    }
    return res.status(200).json({
      success: true,
      isUpdated: true,
      message: "DONE",
      data: developer,
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      isUpdated: false,
      message: error.message,
    });
  }
});

// Delete a developer by ID
router.route("/developers/:id").delete(isLoggedIn, async (req, res) => {
  try {
    const developer = await Developer.findByIdAndDelete(req.params.id);
    if (!developer) {
      return res.status(200).json({
        success: false,
        isDeleted: false,
        message: "Developer not found",
      });
    }
    return res.status(200).json({
      success: true,
      isDeleted: true,
      message: "DONE",
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      isDeleted: false,
      message: error.message,
    });
  }
});

module.exports = router;
