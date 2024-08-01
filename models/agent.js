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
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

const Agent = mongoose.model("Agent", agentSchema);

module.exports = Agent;
