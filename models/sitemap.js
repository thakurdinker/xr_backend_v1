const mongoose = require("mongoose");

const sitemapSchema = new mongoose.Schema(
  {
    content: { type: String, required: true },
    urlCount: { type: Number, default: 0 },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Sitemap", sitemapSchema);
