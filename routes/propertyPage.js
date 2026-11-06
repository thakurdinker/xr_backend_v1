const express = require("express");
const catchAsync = require("../utils/seedDB/catchAsync");
const Property = require("../models/properties");
const { parseEmirate, emirateFilter } = require("../utils/emirate");

const router = express.Router({ mergeParams: true });

router.route("/").get(
  catchAsync(async (req, res) => {
    const { propertySlug } = req.params;
    // ?emirate=abu-dhabi for the /abu-dhabi/property/ route; default Dubai.
    // A property of the other emirate is "not found" here, so neither site
    // section can render the other's properties.
    const emirate = parseEmirate(req.query.emirate);
    if (!emirate) {
      return res.status(400).json({ success: false, message: "Invalid emirate" });
    }

    try {
      const property = await Property.findOne({
        property_name_slug: propertySlug,
        show_property: true,
        ...emirateFilter(emirate),
      }).populate({ path: "amenities.icons" });
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
