// const express = require("express");
// const catchAsync = require("../utils/seedDB/catchAsync");
// const Community = require("../models/community");
// const shuffle = require("../utils/shuffleArray");
// const Property = require("../models/properties");
// const communityController = require("../controller/communityController");

// const router = express.Router({ mergeParams: true });

// router.route("/communities").get(communityController.getAll);

// router.route("/:communitySlug").get(
//   catchAsync(async (req, res) => {
//     const { communitySlug } = req.params;
//     try {

//       const community = await Community.findOne({
//         slug: communitySlug,
//       }).populate({ path: "amenities.icons" });

//       if (!community) {
//         return res
//           .status(200)
//           .json({ success: false, message: "NO community Found" });
//       }

//       // Properties in the community
//       const properties = await Property.find({
//         community_name_slug: communitySlug,
//         show_property: true,
//       }).sort({ order: 1 });

//       const moreCommunities = shuffle(
//         await Community.find({ _id: { $ne: community._id } }).limit(6)
//       );
//       return res.status(200).json({
//         success: true,
//         community,
//         properties,
//         moreCommunities,
//         message: "DONE",
//       });
//     } catch (error) {
//       console.log(error);
//     }
//   })
// );

// module.exports = router;

const express = require("express");
const catchAsync = require("../utils/seedDB/catchAsync");
const Community = require("../models/community");
const shuffle = require("../utils/shuffleArray");
const Property = require("../models/properties");
const communityController = require("../controller/communityController");

const router = express.Router({ mergeParams: true });

router.route("/communities").get(communityController.getAll);

router.route("/:communitySlug").get(
  catchAsync(async (req, res) => {
    const { communitySlug } = req.params;
    // Extract pagination parameters for properties and more communities
    const {
      propertiesPage = 1,
      propertiesLimit = 6,
      moreCommunitiesPage = 1,
      moreCommunitiesLimit = 8,
    } = req.query;

    // if (
    //   !req.query.propertiesPage ||
    //   !req.query.propertiesLimit ||
    //   !req.query.moreCommunitiesPage ||
    //   !req.query.moreCommunitiesLimit
    // ) {
    //   try {
    //     const community = await Community.findOne({
    //       slug: communitySlug,
    //     }).populate({ path: "amenities.icons" });

    //     if (!community) {
    //       return res
    //         .status(200)
    //         .json({ success: false, message: "NO community Found" });
    //     }

    //     // Properties in the community with pagination
    //     const properties = await Property.find({
    //       community_name_slug: communitySlug,
    //       show_property: true,
    //     }).sort({ order: 1 });

    //     return res.status(200).json({
    //       success: true,
    //       community: community,
    //       properties,
    //       totalPropertiesPages: null,
    //       moreCommunities: null,
    //       totalMoreCommunitiesPages: null,
    //       message: "DONE",
    //     });
    //   } catch (error) {
    //     console.log(error);
    //     return res
    //       .status(500)
    //       .json({ success: false, message: "Internal server error" });
    //   }
    // }

    try {
      const community = await Community.findOne({
        slug: communitySlug,
      }).populate({ path: "amenities.icons" });

      if (!community) {
        return res
          .status(200)
          .json({ success: false, message: "NO community Found" });
      }

      // Properties in the community with pagination
      const properties = await Property.find({
        community_name_slug: communitySlug,
        show_property: true,
      })
        .sort({ order: 1 })
        .limit(propertiesLimit * 1)
        .skip((propertiesPage - 1) * propertiesLimit);

      const totalProperties = await Property.countDocuments({
        community_name_slug: communitySlug,
        show_property: true,
      });

      // More communities with pagination
      // const allMoreCommunities = await Community.find({
      //   _id: { $ne: community._id },
      // });
      // const shuffledCommunities = shuffle(allMoreCommunities);
      // const moreCommunities = shuffledCommunities.slice(
      //   (moreCommunitiesPage - 1) * moreCommunitiesLimit,
      //   moreCommunitiesPage * moreCommunitiesLimit
      // );
      // const totalMoreCommunities = shuffledCommunities.length;

      return res.status(200).json({
        success: true,
        community,
        properties,
        totalPropertiesPages: Math.ceil(totalProperties / propertiesLimit),
        // moreCommunities,
        //   totalMoreCommunitiesPages: Math.ceil(
        //     totalMoreCommunities / moreCommunitiesLimit
        //   ),
        message: "DONE",
      });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  })
);

module.exports = router;
