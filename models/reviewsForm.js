const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
    },
    numberOfStars: {
      type: Number,
      default: 5,
    },
    showReview: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
