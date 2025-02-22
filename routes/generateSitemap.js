const express = require("express");
const generateSitemap = require("../utils/generateSitemap/generateSitemap");
const { isLoggedIn, isAdmin } = require("../middleware/middleware");
const path = require("path");
const fs = require("fs");

const router = express.Router({ mergeParams: true });

const SITEMAP_FILE = path.join(__dirname, "../public/sitemap.xml");

router.route("/generateSitemap").get(isLoggedIn, isAdmin, async (req, res) => {
  const sitemap = await generateSitemap();

  if (sitemap) {
    return res
      .status(200)
      .json({ success: true, message: "Generated Successfully" });
  }
  return res
    .status(200)
    .json({ success: false, message: "Failed Generating Sitemap" });
});

// Get current sitemap
router.route("/sitemap").get(async (req, res) => {
  // fs.readFile(SITEMAP_FILE, "utf8", (err, data) => {
  //   if (err) {
  //     return res.status(500).json({ message: "Error fetching sitemap" });
  //   }
  //   res.send(data);
  // });

  // Fetch Sitemap from Strapi
  const sitemap = await fetch("https://admin-v1.xrealty.ae" + "/api/sitemaps");
  const sitemapData = await sitemap.json();
  return res.send(sitemapData?.data[0]?.content);
});

// Update current sitemap
router.route("/sitemap").post(isLoggedIn, isAdmin, async (req, res) => {
  const { sitemap } = req.body;

  if (!sitemap) {
    return res.status(400).json({ message: "Sitemap content is required" });
  }

  fs.writeFile(SITEMAP_FILE, sitemap, "utf8", (err) => {
    if (err) {
      return res.status(500).json({ message: "Error updating sitemap" });
    }
    res.json({ message: "Sitemap updated successfully" });
  });
});

module.exports = router;
