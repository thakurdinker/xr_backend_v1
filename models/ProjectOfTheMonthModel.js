const mongoose = require("mongoose");

const ProjectOfTheMonthSchema = new mongoose.Schema(
  {
    videoUrl: {
      _id: false,
      type: String,
      required: true,
    },
    projectName: {
      _id: false,
      type: String,
      required: true,
    },
    description: {
      _id: false,
      type: String,
      required: true,
    },
    amenities: {
      _id: false,
      icons: [{ type: mongoose.Types.ObjectId, ref: "Icon" }],
    },
    headings: [
      {
        _id: false,
        heading: String,
        description: String,
      },
    ],
    images: [String],
  },
  { timestamps: true }
);

// Function to modify the Cloudinary URL
function modifyCloudinaryUrl(url) {
  // Define the part where you want to insert the transformation parameters
  const insertionPoint = "/upload/";
  const transformation = "w_1280,f_auto,q_auto/";

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

// Add a post hook to modify image URLs in the `images` array
ProjectOfTheMonthSchema.post("find", function (docs) {
  docs.forEach((doc) => {
    // Modify URLs in the `images` array
    if (doc.images && doc.images.length > 0) {
      doc.images = doc.images.map((imageUrl) => modifyCloudinaryUrl(imageUrl));
    }
  });
});

// Add a post hook to modify image URLs for a single document
ProjectOfTheMonthSchema.post("findOne", function (doc) {
  if (doc) {
    // Modify URLs in the `images` array
    if (doc.images && doc.images.length > 0) {
      doc.images = doc.images.map((imageUrl) => modifyCloudinaryUrl(imageUrl));
    }
  }
});

module.exports = mongoose.model("ProjectOfTheMonth", ProjectOfTheMonthSchema);
