const Review = require("../models/reviewsForm");

// Create a new review
exports.postReview = async (req, res) => {
  try {
    const review = new Review(req.body);
    await review.save();
    res.status(200).json({ success: true, isCreated: true, message: "DONE" });
  } catch (error) {
    res
      .status(200)
      .json({ success: false, isCreated: false, message: error.message });
  }
};

exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find();

    res.status(200).json({
      success: true,
      reviews,
      message: "DONE",
    });
  } catch (error) {
    res.status(200).json({ success: false, message: error.message });
  }
};

// Get all reviews with pagination
exports.getReviews = async (req, res) => {
  const { page = 1, limit = 10 } = req.query; // Default to page 1, limit 10

  try {
    const reviews = await Review.find()
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    // Count the total number of documents
    const count = await Review.countDocuments();

    res.status(200).json({
      success: true,
      reviews,
      message: "DONE",
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalIcons: count,
    });
  } catch (error) {
    res.status(200).json({ success: false, message: error.message });
  }
};

// Get a single review by ID
exports.getReviewById = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (review) {
      res.status(200).json({ success: true, review, message: "DONE" });
    } else {
      res
        .status(200)
        .json({ success: false, review: null, message: "Not Found" });
    }
  } catch (error) {
    res.status(200).json({ success: false, message: error.message });
  }
};

// Update an review by ID
exports.updateReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (review) {
      res.status(200).json({ success: true, isUpdated: true, message: "DONE" });
    } else {
      res
        .status(200)
        .json({ success: false, isUpdated: false, message: "Not Found" });
    }
  } catch (error) {
    res.status(200).json({ success: false, message: error.message });
  }
};

// Delete an review by ID
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (review) {
      res.status(200).json({ success: true, isDeleted: true, message: "DONE" });
    } else {
      res
        .status(200)
        .json({ success: true, isDeleted: false, message: "Not Found" });
    }
  } catch (error) {
    res.status(200).json({ success: false, message: error.message });
  }
};
