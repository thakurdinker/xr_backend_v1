const mongoose = require("mongoose");

const sitemapSchema = new mongoose.Schema(
  {
    // The /sitemap.xml doc predates the field and has no name. A doc named
    // "abu-dhabi" may remain from when Abu Dhabi had its own sitemap; nothing
    // writes or serves it now.
    name: { type: String },
    content: { type: String, required: true },
    urlCount: { type: Number, default: 0 },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Sitemap = mongoose.model("Sitemap", sitemapSchema);

Sitemap.ABU_DHABI_NAME = "abu-dhabi";
// Filter for findOne / findOneAndUpdate. Still excludes the leftover
// "abu-dhabi" doc, so an upsert never overwrites it in place of /sitemap.xml.
Sitemap.MAIN = { name: { $ne: Sitemap.ABU_DHABI_NAME } };

module.exports = Sitemap;
