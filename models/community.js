const mongoose = require("mongoose");

const communitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true }, // SEO-friendly URL
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
    amenities: [
      {
        _id: false,
        name: { type: String },
        icon_url: { type: String },
        description: { type: String },
      },
    ],
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
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

const Community = mongoose.model("Community", communitySchema);

module.exports = Community;
