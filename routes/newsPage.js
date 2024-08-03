const express = require("express");
const catchAsync = require("../utils/seedDB/catchAsync");
const Content = require("../models/content");

const fs = require("fs");
const path = require("path");

const router = express.Router({ mergeParams: true });

// All News and articles
router.route("/real-estate-news").get(
  catchAsync(async (req, res) => {
    const { page = 1, limit = 20, category } = req.query;
    let query = {
      status: "published",
    };

    if (category && category.trim() !== "") {
      query.category = category.trim().toLowerCase();
    }
    try {
      const filePath = path.join(
        __dirname,
        "../configs/content-categories.json"
      );
      data = fs.readFileSync(filePath, { encoding: "utf8", flag: "r" });
    } catch (e) {
      console.log(e.message);
    }
    // const categories = await Content.distinct("category");
    const newsAndBlogs = await Content.find(query).sort("-createdAt").limit(20);
    const count = await Content.countDocuments(query);
    return res.status(200).json({
      success: true,
      categories: JSON.parse(data),
      newsAndBlogs,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      message: "DONE",
    });
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
