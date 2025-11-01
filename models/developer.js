const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const newDeveloperSchema = new Schema(
  {
    logo_img_url: {
      type: String,
    },
    logo_img_url_alt: {
      type: String,
    },
    developer_name: {
      type: String,
    },
    developer_slug: {
      type: String,
    },
    description: {
      type: String,
    },
    heading: { type: String },
    meta_title: { type: String },
    meta_description: { type: String },
    meta_keywords: { type: String },
    order: Number,
    predefinedCommunitiesOrder: [String],
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
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

// Add a post hook to modify image URLs in various fields
newDeveloperSchema.post("find", function (docs) {
  docs.forEach((doc) => {
    // Modify the `logo_img_url`
    if (doc.logo_img_url) {
      doc.logo_img_url = modifyCloudinaryUrl(doc.logo_img_url);
    }

    // Modify the `logo_img_url_alt`
    if (doc.logo_img_url_alt) {
      doc.logo_img_url_alt = modifyCloudinaryUrl(doc.logo_img_url_alt);
    }
  });
});

// Add a post hook to modify image URLs for a single document
newDeveloperSchema.post("findOne", function (doc) {
  if (doc) {
    // Modify the `logo_img_url`
    if (doc.logo_img_url) {
      doc.logo_img_url = modifyCloudinaryUrl(doc.logo_img_url);
    }

    // Modify the `logo_img_url_alt`
    if (doc.logo_img_url_alt) {
      doc.logo_img_url_alt = modifyCloudinaryUrl(doc.logo_img_url_alt);
    }
  }
});

const Developer = mongoose.model("Developer", newDeveloperSchema);

module.exports = Developer;
