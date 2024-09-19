const mongoose = require("mongoose");

const contentSchema = new mongoose.Schema(
  {
    title: { type: String },
    slug: { type: String, unique: true },
    content: { type: String }, // HTML content
    featured_image: {
      type: String,
    },
    author: {
      _id: false,
      name: { type: String },
      email: { type: String },
    },
    category: { type: String }, // e.g., "blog", "news", "article"
    tags: [{ type: String }],
    publish_date: { type: Date, default: Date.now },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
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

    // SEO fields
    seo: {
      _id: false,
      meta_title: { type: String },
      meta_description: { type: String },
      keywords: [{ type: String }],
    },
    schema_org: {
      _id: false,
      type: { type: String, default: "Article" }, // Example schema.org type
      properties: { type: Object }, // Additional properties for schema.org
    },
    open_graph: {
      _id: false,
      title: { type: String },
      description: { type: String },
      image: { type: String },
      type: { type: String, default: "article" },
    },
    order: Number,
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
contentSchema.post("find", function (docs) {
  docs.forEach((doc) => {
    // Modify the `featured_image` URL
    if (doc.featured_image) {
      doc.featured_image = modifyCloudinaryUrl(doc.featured_image);
    }

    // Modify URLs in the `images` array
    if (doc.images && doc.images.length > 0) {
      doc.images.forEach((image) => {
        image.url = modifyCloudinaryUrl(image.url);
      });
    }

    // Modify URL in `schema_org.properties.image` if it exists
    if (
      doc.schema_org &&
      doc.schema_org.properties &&
      doc.schema_org.properties.image
    ) {
      doc.schema_org.properties.image = modifyCloudinaryUrl(
        doc.schema_org.properties.image
      );
    }

    // Modify URL in `open_graph.image` if it exists
    if (doc.open_graph && doc.open_graph.image) {
      doc.open_graph.image = modifyCloudinaryUrl(doc.open_graph.image);
    }
  });
});

// Add a post hook to modify image URLs for a single document
contentSchema.post("findOne", function (doc) {
  if (doc) {
    // Modify the `featured_image` URL
    if (doc.featured_image) {
      doc.featured_image = modifyCloudinaryUrl(doc.featured_image);
    }

    // Modify URLs in the `images` array
    if (doc.images && doc.images.length > 0) {
      doc.images.forEach((image) => {
        image.url = modifyCloudinaryUrl(image.url);
      });
    }

    // Modify URL in `schema_org.properties.image` if it exists
    if (
      doc.schema_org &&
      doc.schema_org.properties &&
      doc.schema_org.properties.image
    ) {
      doc.schema_org.properties.image = modifyCloudinaryUrl(
        doc.schema_org.properties.image
      );
    }

    // Modify URL in `open_graph.image` if it exists
    if (doc.open_graph && doc.open_graph.image) {
      doc.open_graph.image = modifyCloudinaryUrl(doc.open_graph.image);
    }
  }
});

const Content = mongoose.model("Content", contentSchema);

module.exports = Content;
