const mongoose = require("mongoose");

const contentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    content: { type: String, required: true }, // HTML content
    author: {
      _id: false,
      name: { type: String },
      email: { type: String },
    },
    category: { type: String, required: true }, // e.g., "blog", "news", "article"
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
        question: { type: String, required: true },
        answer: { type: String, required: true },
      },
    ],

    // SEO fields
    meta_title: { type: String, required: true },
    meta_description: { type: String, required: true },
    keywords: [{ type: String }],
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
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

const Content = mongoose.model("Content", contentSchema);

module.exports = Content;
