const express = require("express");
const catchAsync = require("../utils/seedDB/catchAsync");
const Community = require("../models/community");
const shuffle = require("../utils/shuffleArray");
const Property = require("../models/properties");

const router = express.Router({ mergeParams: true });

router.route("/:communitySlug").get(
  catchAsync(async (req, res) => {
    const { communitySlug } = req.params;
    try {
      const community = await Community.findOne({
        slug: communitySlug,
      });

      if (!community) {
        return res
          .status(200)
          .json({ success: false, message: "NO community Found" });
      }

      // Properties in the community
      const properties = await Property.find({
        community_name_slug: communitySlug,
      });

      const moreCommunities = shuffle(
        await Community.find({ _id: { $ne: community._id } }).limit(5)
      );
      return res.status(200).json({
        success: true,
        community,
        properties,
        moreCommunities,
        message: "DONE",
      });
    } catch (error) {}
  })
);

module.exports = router;
