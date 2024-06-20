const mongoose = require("mongoose");

const contentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    content: { type: String, required: true }, // HTML content
    author: {
      name: { type: String },
      email: { type: String },
    },
    category: { type: String, required: true }, // e.g., "blog", "news", "article"
    tags: [{ type: String }],
    publish_date: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    images: [
      {
        url: { type: String },
        description: { type: String },
      },
    ],
    faqs: [
      {
        question: { type: String, required: true },
        answer: { type: String, required: true },
      },
    ],

    // SEO fields
    meta_title: { type: String, required: true },
    meta_description: { type: String, required: true },
    keywords: [{ type: String }],
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

module.exports = mongoose.model("Content", contentSchema);
