// iconRoutes.js
const express = require("express");
const router = express.Router({ mergeParams: true });
const iconController = require("../controller/iconController"); // Adjust the path as necessary

// Create a new icon
router.post("/icons", iconController.createIcon);

// Get all icons
router.get("/icons", iconController.getIcons);
router.get("/getAllIcons", iconController.getAllIcons);

// Get a single icon by ID
router.get("/icons/:id", iconController.getIconById);

// Update an icon by ID
router.put("/icons/:id", iconController.updateIcon);

// Delete an icon by ID
router.delete("/icons/:id", iconController.deleteIcon);

module.exports = router;
