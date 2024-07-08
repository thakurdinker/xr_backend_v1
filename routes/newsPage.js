const express = require("express");
const catchAsync = require("../utils/seedDB/catchAsync");
const Content = require("../models/content");

const router = express.Router({ mergeParams: true });

// All News and articles
router.route("/real-estate-news").get(
  catchAsync(async (req, res) => {
    const categories = await Content.distinct("category");
    const newsAndBlogs = await Content.find({ status: "published" })
      .sort("-createdAt")
      .limit(20);

    return res
      .status(200)
      .json({ success: true, categories, newsAndBlogs, message: "DONE" });
  })
);

// get content matching content slug
router.route("/:contentSlug").get(
  catchAsync(async (req, res) => {
    const { contentSlug } = req.params;
    const content = await Content.find({
      slug: contentSlug,
      status: "published",
    });

    return res.status(200).json({ success: true, content, message: "DONE" });
  })
);

module.exports = router;
