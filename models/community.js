const mongoose = require("mongoose");

const communitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true }, // SEO-friendly URL
    description: { type: String }, // Detailed description
    location: {
      address: { type: String },
      city: { type: String },
      state: { type: String },
      country: { type: String },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    amenities: [
      {
        name: { type: String },
        icon_url: { type: String },
        description: { type: String },
      },
    ],
    images: [
      {
        url: { type: String },
        description: { type: String },
      },
    ],
    faqs: [
      {
        question: { type: String },
        answer: { type: String },
      },
    ],
    seo: {
      meta_title: { type: String },
      meta_description: { type: String },
      keywords: [{ type: String }],
    },
    schema_org: {
      type: { type: String, default: "Place" },
      properties: { type: Object },
    },
    open_graph: {
      title: { type: String },
      description: { type: String },
      image: { type: String },
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

const Community = mongoose.model("Community", communitySchema);

module.exports = Community;
