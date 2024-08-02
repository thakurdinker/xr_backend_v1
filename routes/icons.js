// iconRoutes.js
const express = require("express");
const router = express.Router({ mergeParams: true });
const iconController = require("../controller/iconController"); // Adjust the path as necessary
const { isLoggedIn } = require("../middleware/middleware");

// Create a new icon
router.post("/icons", isLoggedIn, iconController.createIcon);

// Get all icons
router.get("/icons", iconController.getIcons);
router.get("/getAllIcons", iconController.getAllIcons);

// Get a single icon by ID
router.get("/icons/:id", isLoggedIn, iconController.getIconById);

// Update an icon by ID
router.put("/icons/:id", isLoggedIn, iconController.updateIcon);

// Delete an icon by ID
router.delete("/icons/:id", isLoggedIn, iconController.deleteIcon);

module.exports = router;
