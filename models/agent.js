const mongoose = require("mongoose");

const agentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  name_slug: { type: String, required: true, unique: true }, // Name Slug for SEO-friendly URLs
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  profile_picture: { type: String, required: true },
  bio: { type: String, required: true }, // Professional Snapshot
  personal_info: { type: String }, // Personal Information
  education: { type: String, required: true }, // Education Qualification
  experience: { type: Number, required: true }, // Years of Experience
  specialties: [{ type: String }], // Specialization
  languages: [{ type: String, required: true }], // Languages
  social_links: {
    _id: false,
    linkedin: { type: String },
    twitter: { type: String },
    facebook: { type: String },
  },
  seo: {
    _id: false,
    meta_title: { type: String, required: true },
    meta_description: { type: String, required: true },
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
});

const Agent = mongoose.model("Agent", agentSchema);

module.exports = Agent;
