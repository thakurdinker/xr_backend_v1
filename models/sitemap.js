const mongoose = require("mongoose");

const sitemapSchema = new mongoose.Schema(
  {
    // Which sitemap this is. The original /sitemap.xml doc predates the field
    // and has no name; the Abu Dhabi sitemap is stored as name "abu-dhabi".
    name: { type: String },
    content: { type: String, required: true },
    urlCount: { type: Number, default: 0 },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Sitemap = mongoose.model("Sitemap", sitemapSchema);

Sitemap.ABU_DHABI_NAME = "abu-dhabi";
// Filters for findOne / findOneAndUpdate.
Sitemap.MAIN = { name: { $ne: Sitemap.ABU_DHABI_NAME } };
Sitemap.ABU_DHABI = { name: Sitemap.ABU_DHABI_NAME };

module.exports = Sitemap;
