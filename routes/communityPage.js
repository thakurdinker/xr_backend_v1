const express = require("express");
const catchAsync = require("../utils/seedDB/catchAsync");
const Community = require("../models/community");
const shuffle = require("../utils/shuffleArray");

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

      const moreCommunities = shuffle(
        await Community.find({ _id: { $ne: community._id } }).limit(5)
      );
      return res.status(200).json({
        success: true,
        community,
        moreCommunities,
        message: "DONE",
      });
    } catch (error) {}
  })
);

module.exports = router;
