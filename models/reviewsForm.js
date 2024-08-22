const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 30,
    },
    message: {
      type: String,
      maxlength: 500,
    },
    imageUrl: {
      type: String,
    },
    numberOfStars: {
      type: Number,
      default: 5,
    },
  },
  {
    timestamps: true,
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
