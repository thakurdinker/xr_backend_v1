const mongoose = require("mongoose");

const communitySchema = new mongoose.Schema(
  {
    name: { type: String },
    slug: { type: String, unique: true }, // SEO-friendly URL
    description: { type: String }, // Detailed description
    location: {
      _id: false,
      address: { type: String },
      city: { type: String },
      state: { type: String },
      country: { type: String },
      coordinates: {
        _id: false,
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    amenities: {
      _id: false,
      description: String,
      icons: [{ type: mongoose.Types.ObjectId, ref: "Icon" }],
    },
    images: [
      {
        _id: false,
        url: { type: String },
        description: { type: String },
      },
    ],
    faqs: [
      {
        _id: false,
        question: { type: String },
        answer: { type: String },
      },
    ],
    seo: {
      _id: false,
      meta_title: { type: String },
      meta_description: { type: String },
      keywords: [{ type: String }],
    },
    schema_org: {
      _id: false,
      type: { type: String, default: "Place" },
      properties: { type: Object },
    },
    open_graph: {
      _id: false,
      title: { type: String },
      description: { type: String },
      image: { type: String },
    },
    order: Number,
    developer: String,
    developer_name_slug: String,
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

// // Add a post hook to modify image URLs in various fields
// communitySchema.post("find", function (docs) {
//   docs.forEach((doc) => {
//     // Modify URLs in the `images` array
//     if (doc.images && doc.images.length > 0) {
//       doc.images.forEach((image) => {
//         image.url = modifyCloudinaryUrl(image.url);
//       });
//     }

//     // Modify URL in `schema_org.properties.image` if it exists
//     if (
//       doc.schema_org &&
//       doc.schema_org.properties &&
//       doc.schema_org.properties.image
//     ) {
//       doc.schema_org.properties.image = modifyCloudinaryUrl(
//         doc.schema_org.properties.image
//       );
//     }

//     // Modify URL in `open_graph.image` if it exists
//     if (doc.open_graph && doc.open_graph.image) {
//       doc.open_graph.image = modifyCloudinaryUrl(doc.open_graph.image);
//     }
//   });
// });

// // Add a post hook to modify image URLs for a single document
// communitySchema.post("findOne", function (doc) {
//   if (doc) {
//     // Modify URLs in the `images` array
//     if (doc.images && doc.images.length > 0) {
//       doc.images.forEach((image) => {
//         image.url = modifyCloudinaryUrl(image.url);
//       });
//     }

//     // Modify URL in `schema_org.properties.image` if it exists
//     if (
//       doc.schema_org &&
//       doc.schema_org.properties &&
//       doc.schema_org.properties.image
//     ) {
//       doc.schema_org.properties.image = modifyCloudinaryUrl(
//         doc.schema_org.properties.image
//       );
//     }

//     // Modify URL in `open_graph.image` if it exists
//     if (doc.open_graph && doc.open_graph.image) {
//       doc.open_graph.image = modifyCloudinaryUrl(doc.open_graph.image);
//     }
//   }
// });

const Community = mongoose.model("Community", communitySchema);

module.exports = Community;
