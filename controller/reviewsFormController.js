const Joi = require("joi");
const Review = require("../models/reviewsForm");
const { reviewsFormValidation } = require("../schemaValidation/reviewsForm");
const catchAsync = require("../utils/seedDB/catchAsync");

module.exports.submitReviewsForm = catchAsync(async (req, res) => {
  const { error, value } = reviewsFormValidation.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  try {
    const review = new Review(value);
    await review.save();
    res.status(201).json({ message: "Form submitted successfully", review });
  } catch (err) {
    res.status(500).json({ error: "An error occurred while saving the form" });
  }
});
