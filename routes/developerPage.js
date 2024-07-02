const express = require("express");
const catchAsync = require("../utils/seedDB/catchAsync");
const Property = require("../models/properties");

const router = express.Router({ mergeParams: true });

router.route("/").get(
  catchAsync(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const { developerNameSlug } = req.params;

    try {
      const developerProperties = await Property.find({
        developer_name_slug: developerNameSlug,
      })
        .limit(limit)
        .skip((page - 1) * limit)
        .exec();

      const count = await Property.countDocuments({
        developer_name_slug: developerNameSlug,
      });
      return res.status(200).json({
        success: true,
        developerProperties,
        message: "DONE",
        totalPages: Math.ceil(count / limit),
        currentPage: page,
      });
    } catch (error) {}
  })
);

module.exports = router;
