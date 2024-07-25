const express = require("express");
const catchAsync = require("../utils/seedDB/catchAsync");
const Property = require("../models/properties");

const fs = require("fs");
const path = require("path");
const Developer = require("../models/developer");

const router = express.Router({ mergeParams: true });

router.route("/").get(
  catchAsync(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const { developerNameSlug } = req.params;

    try {
      // Find the developer details from the database
      const developer = await Developer.findOne({
        developer_slug: developerNameSlug,
      })
        .select(
          "logo_img_url developer_name developer_slug description heading"
        )
        .exec();

      if (!developer) {
        return res.status(404).json({
          success: false,
          message: "Developer not found",
        });
      }

      // Find the properties associated with the developer
      const developerProperties = await Property.find({
        developer_name_slug: developerNameSlug,
      })
        .limit(limit)
        .skip((page - 1) * limit)
        .select(
          "_id property_name property_name_slug price location features images"
        )
        .exec();

      // Get the count of properties for pagination
      const count = await Property.countDocuments({
        developer_name_slug: developerNameSlug,
      });

      return res.status(200).json({
        success: true,
        aboutDeveloper: developer, // Developer information
        developerProperties,
        message: "DONE",
        totalPages: Math.ceil(count / limit),
        currentPage: Number(page),
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  })
);

module.exports = router;
