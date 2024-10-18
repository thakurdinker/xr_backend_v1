const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const newPropertySchema = new Schema(
  {
    property_name: String,
    property_name_slug: String,
    description: String,
    price: String,
    developer: String,
    developer_name_slug: String,
    type: [{ _id: false, name: String, bedrooms: String }], // e.g., "townhouse", "semi-detached home"
    location: {
      _id: false,
      address: String,
      city: String,
      state: String,
      country: String,
      coordinates: {
        _id: false,
        lat: String,
        lng: String,
      },
    },
    features: {
      _id: false,
      // bedrooms: String,
      bathrooms: String,
      area: String, // in square feet or meters
      year_built: String,
    },
    images: [
      {
        _id: false,
        heading: String,
        url: String,
        alt: String,
        description: String, // optional
      },
    ],
    gallery_title_1: String,
    gallery_title_2: String,
    gallery_description_1: String,
    gallery_description_2: String,
    gallery1: [String],
    gallery2: [String],
    status: [String], // e.g., "for sale", "latest", "off-plan"
    community_name: String,
    community_name_slug: String,
    community_features: {
      _id: false,
      project_overview: String,
      nearby_facilities: [String], // e.g., ["hospital", "school"]
      transportation: [String], // e.g., ["Al Maktoum Intl' Airport", "District 2020"]
    },
    show_property: Boolean, // true or false
    featured: Boolean, // true or false
    show_slideShow: {
      type: Boolean,
      default: false,
    },
    section_1: {
      _id: false,
      heading: String,
      title: String,
      description: String,
      image: String,
    },

    about_project: {
      _id: false,
      heading: String,
      title: String,
      description: String,
    },

    amenities: {
      _id: false,
      description: String,
      icons: [{ type: mongoose.Types.ObjectId, ref: "Icon" }],
    },
    faqs: [
      {
        _id: false,
        question: { type: String },
        answer: { type: String },
      },
    ],
    // SEO fields
    seo: {
      _id: false,
      meta_title: { type: String },
      meta_description: { type: String },
      meta_canonical_url: { type: String },
      keywords: [{ type: String }],
    },
    schema_org: {
      _id: false,
      type: { type: String, default: "" }, // Example schema.org type
      properties: { type: Object }, // Additional properties for schema.org
    },
    open_graph: {
      _id: false,
      title: { type: String },
      description: { type: String },
      image: { type: String },
      type: { type: String, default: "" },
    },
    order: { type: Number, required: true, unique: true },
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
// newPropertySchema.post("find", function (docs) {
//   docs.forEach((doc) => {
//     // Modify URLs in the `images` array
//     if (doc.images && doc.images.length > 0) {
//       doc.images.forEach((image) => {
//         image.url = modifyCloudinaryUrl(image.url);
//       });
//     }

//     // Modify URLs in the `gallery1` array
//     if (doc.gallery1 && doc.gallery1.length > 0) {
//       doc.gallery1 = doc.gallery1.map((imageUrl) =>
//         modifyCloudinaryUrl(imageUrl)
//       );
//     }

//     // Modify URLs in the `gallery2` array
//     if (doc.gallery2 && doc.gallery2.length > 0) {
//       doc.gallery2 = doc.gallery2.map((imageUrl) =>
//         modifyCloudinaryUrl(imageUrl)
//       );
//     }

//     // Modify URL in `section_1.image`
//     if (doc.section_1 && doc.section_1.image) {
//       doc.section_1.image = modifyCloudinaryUrl(doc.section_1.image);
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

// Add a post hook to modify image URLs for a single document
// newPropertySchema.post("findOne", function (doc) {
//   if (doc) {
//     // Modify URLs in the `images` array
//     if (doc.images && doc.images.length > 0) {
//       doc.images.forEach((image) => {
//         image.url = modifyCloudinaryUrl(image.url);
//       });
//     }

//     // Modify URLs in the `gallery1` array
//     if (doc.gallery1 && doc.gallery1.length > 0) {
//       doc.gallery1 = doc.gallery1.map((imageUrl) =>
//         modifyCloudinaryUrl(imageUrl)
//       );
//     }

//     // Modify URLs in the `gallery2` array
//     if (doc.gallery2 && doc.gallery2.length > 0) {
//       doc.gallery2 = doc.gallery2.map((imageUrl) =>
//         modifyCloudinaryUrl(imageUrl)
//       );
//     }

//     // Modify URL in `section_1.image`
//     if (doc.section_1 && doc.section_1.image) {
//       doc.section_1.image = modifyCloudinaryUrl(doc.section_1.image);
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

const Property = mongoose.model("Property", newPropertySchema);

module.exports = Property;
