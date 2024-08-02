const express = require("express");
const generateSitemap = require("../utils/generateSitemap/generateSitemap");
const { isLoggedIn, isAdmin } = require("../middleware/middleware");

const router = express.Router({ mergeParams: true });

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

module.exports = router;
