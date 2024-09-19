const mongoose = require("mongoose");
const cloudinary = require("../cloudinary/cloudinaryConfig");
const extractPublicIdfromUrl = require("../utils/extractPublicIdfromUrl");

const agentSchema = new mongoose.Schema(
  {
    name: { type: String },
    name_slug: { type: String, unique: true }, // Name Slug for SEO-friendly URLs
    email: { type: String, unique: true },
    phone: { type: String },
    profile_picture: { type: String },
    bio: { type: String }, // Professional Snapshot
    personal_info: { type: String }, //   Personal Information
    education: { type: String }, // Education Qualification
    experience: { type: Number }, // Years of Experience
    specialties: [{ type: String }], // Specialization
    languages: [{ type: String }], // Languages
    social_links: {
      _id: false,
      linkedin: { type: String },
      twitter: { type: String },
      facebook: { type: String },
      instagram: { type: String },
      youtube: { type: String },
    },
    video_links: [{ type: String }],
    seo: {
      _id: false,
      meta_title: { type: String },
      meta_description: { type: String },
      keywords: [{ type: String }],
    },
    schema_org: {
      _id: false,
      type: { type: String, default: "Person" },
      properties: { type: Object },
    },
    open_graph: {
      _id: false,
      title: { type: String },
      description: { type: String },
      image: { type: String },
    },
    starAgent: Boolean,
    hidden: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Function to modify the Cloudinary URL
function modifyCloudinaryUrl(url) {
  // Define the part where you want to insert the transformation parameters
  const insertionPoint = "/upload/";
  const transformation = "f_auto,q_auto/";

  // Find the position to insert the transformation
  const index = url.indexOf(insertionPoint) + insertionPoint.length;

  // Insert the transformation at the correct position
  const modifiedUrl = url.slice(0, index) + transformation + url.slice(index);

  return modifiedUrl;
}

// Function to modify the Cloudinary URL
function modifyCloudinaryUrl(url) {
  // Define the part where you want to insert the transformation parameters
  const insertionPoint = "/upload/";
  const transformation = "f_auto,q_auto/";

  // Check if the URL contains the insertion point
  if (url.includes(insertionPoint)) {
    // Find the position to insert the transformation
    const index = url.indexOf(insertionPoint) + insertionPoint.length;

    // Insert the transformation at the correct position
    return url.slice(0, index) + transformation + url.slice(index);
  }
  // Return the original URL if insertion point is not found
  return url;
}

// Add a post hook to modify the profile picture and image URLs in schema_org and open_graph
agentSchema.post("find", function (docs) {
  docs.forEach((doc) => {
    // Modify the profile picture URL
    if (doc.profile_picture) {
      doc.profile_picture = modifyCloudinaryUrl(doc.profile_picture);
    }

    // Modify the schema_org image URL if it exists
    if (
      doc.schema_org &&
      doc.schema_org.properties &&
      doc.schema_org.properties.image
    ) {
      doc.schema_org.properties.image = modifyCloudinaryUrl(
        doc.schema_org.properties.image
      );
    }

    // Modify the open_graph image URL if it exists
    if (doc.open_graph && doc.open_graph.image) {
      doc.open_graph.image = modifyCloudinaryUrl(doc.open_graph.image);
    }
  });
});

// Add a post hook to modify the URLs for a single document
agentSchema.post("findOne", function (doc) {
  if (doc) {
    // Modify the profile picture URL
    if (doc.profile_picture) {
      doc.profile_picture = modifyCloudinaryUrl(doc.profile_picture);
    }

    // Modify the schema_org image URL if it exists
    if (
      doc.schema_org &&
      doc.schema_org.properties &&
      doc.schema_org.properties.image
    ) {
      doc.schema_org.properties.image = modifyCloudinaryUrl(
        doc.schema_org.properties.image
      );
    }

    // Modify the open_graph image URL if it exists
    if (doc.open_graph && doc.open_graph.image) {
      doc.open_graph.image = modifyCloudinaryUrl(doc.open_graph.image);
    }
  }
});

const Agent = mongoose.model("Agent", agentSchema);

module.exports = Agent;
