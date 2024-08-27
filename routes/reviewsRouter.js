// iconRoutes.js
const express = require("express");
const router = express.Router({ mergeParams: true });
const reviewController = require("../controller/reviewController"); // Adjust the path as necessary
const { isLoggedIn, isAdmin } = require("../middleware/middleware");

// Create a new icon
router.post("/reviews", isLoggedIn, isAdmin, reviewController.postReview);

// Get all icons
router.get("/reviews", reviewController.getReviews);
router.get("/getAllReviews", reviewController.getAllReviews);

// Get a single icon by ID
router.get("/reviews/:id", reviewController.getReviewById);

// Update an icon by ID
router.put("/reviews/:id", isLoggedIn,isAdmin, reviewController.updateReview);

// Delete an icon by ID
router.delete("/reviews/:id", isLoggedIn,isAdmin, reviewController.deleteReview);

module.exports = router;
