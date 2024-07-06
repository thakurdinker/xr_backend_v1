const express = require("express");
const catchAsync = require("../utils/seedDB/catchAsync");
const Property = require("../models/properties");

const router = express.Router({ mergeParams: true });

router.route("/").get(
  catchAsync(async (req, res) => {
    const { propertySlug } = req.params;

    try {
      const property = await Property.findOne({
        property_name_slug: propertySlug,
      });
      if (!property) {
        return res
          .status(200)
          .json({ success: false, message: "No property Found" });
      }
      return res.status(200).json({ success: true, property, message: "DONE" });
    } catch (error) {
      return res.status(200).json({ success: false, message: error });
    }
  })
);

module.exports = router;
