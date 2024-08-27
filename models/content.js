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

const Content = mongoose.model("Content", contentSchema);

module.exports = Content;
