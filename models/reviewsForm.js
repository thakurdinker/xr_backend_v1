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

// Function to modify the Cloudinary URL
function modifyCloudinaryUrl(url) {
  // Define the part where you want to insert the transformation parameters
  const insertionPoint = "/upload/";
  const transformation = "f_auto,q_auto/";

  // Check if the URL contains the insertion point
  if (url && url.includes(insertionPoint)) {
    // Find the position to insert the transformation
    const index = url.indexOf(insertionPoint) + insertionPoint.length;

    // Insert the transformation at the correct position
    return url.slice(0, index) + transformation + url.slice(index);
  }
  // Return the original URL if insertion point is not found
  return url;
}

// Add a post hook to modify the imageUrl in various fields
reviewSchema.post("find", function (docs) {
  docs.forEach((doc) => {
    // Modify the `imageUrl`
    if (doc.imageUrl) {
      doc.imageUrl = modifyCloudinaryUrl(doc.imageUrl);
    }
  });
});

// Add a post hook to modify the imageUrl for a single document
reviewSchema.post("findOne", function (doc) {
  if (doc) {
    // Modify the `imageUrl`
    if (doc.imageUrl) {
      doc.imageUrl = modifyCloudinaryUrl(doc.imageUrl);
    }
  }
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
