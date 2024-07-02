const express = require("express");
const catchAsync = require("../utils/seedDB/catchAsync");
const Property = require("../models/properties");

const fs = require("fs");
const path = require("path");

const router = express.Router({ mergeParams: true });

router.route("/").get(
  catchAsync(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const { developerNameSlug } = req.params;

    let data = null;

    try {
      const filePath = path.join(__dirname, `../seo/${developerNameSlug}.json`);
      data = fs.readFileSync(filePath, { encoding: "utf8", flag: "r" });
    } catch (e) {
      console.log(e.message);
    }

    try {
      const developerProperties = await Property.find({
        developer_name_slug: developerNameSlug,
      })
        .limit(limit)
        .skip((page - 1) * limit)
        .select(
          "_id property_name property_name_slug price location features images"
        )
        .exec();

      const count = await Property.countDocuments({
        developer_name_slug: developerNameSlug,
      });
      return res.status(200).json({
        success: true,
        aboutDeveloper: JSON.parse(data),
        developerProperties,
        message: "DONE",
        totalPages: Math.ceil(count / limit),
        currentPage: page,
      });
    } catch (error) {}
  })
);

module.exports = router;
