const mongoose = require("mongoose");

const iconSchema = new mongoose.Schema(
  {
    icon_url: {
      type: String,
    },
    icon_text: {
      type: String,
    },
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

// Add a post hook to modify icon URLs in various fields
iconSchema.post("find", function (docs) {
  docs.forEach((doc) => {
    // Modify the `icon_url`
    if (doc.icon_url) {
      doc.icon_url = modifyCloudinaryUrl(doc.icon_url);
    }
  });
});

// Add a post hook to modify icon URL for a single document
iconSchema.post("findOne", function (doc) {
  if (doc) {
    // Modify the `icon_url`
    if (doc.icon_url) {
      doc.icon_url = modifyCloudinaryUrl(doc.icon_url);
    }
  }
});

const Icon = mongoose.model("Icon", iconSchema);

module.exports = Icon;
