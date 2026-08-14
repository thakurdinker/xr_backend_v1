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

const { normaliseSlug } = communityController;

// Matches a slug ignoring case and surrounding whitespace. Slugs are
// denormalised strings shared by the Community collection, Strapi and
// Property.community_name_slug, so casing drift on any one of them silently
// empties the Projects section (this is what broke "Evermore"/"evermore").
const slugMatcher = (slug) => ({
  $regex: `^${normaliseSlug(slug).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
  $options: "i",
});

router.route("/communities").get(communityController.getAll);

router.route("/:communitySlug").get(
  catchAsync(async (req, res) => {
    const communitySlug = normaliseSlug(req.params.communitySlug);
    // Extract pagination parameters for properties and more communities
    const {
      propertiesPage = 1,
      // No cap by default. The frontend renders every project in one grid with
      // no "load more" control, so the old default of 6 silently truncated any
      // community with more than six live projects — including for crawlers,
      // since /area/[slug] is prerendered.
      propertiesLimit = 0,
      moreCommunitiesPage = 1,
      moreCommunitiesLimit = 8,
    } = req.query;

    const limit = Math.max(0, Number(propertiesLimit) || 0);
    const page = Math.max(1, Number(propertiesPage) || 1);

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
        slug: slugMatcher(communitySlug),
      }).populate({ path: "amenities.icons" });

      // Disable for now as we are adding new communities from the strapi backend

      // if (!community) {
      //   return res
      //     .status(200)
      //     .json({ success: false, message: "NO community Found" });
      // }

      const propertyFilter = {
        community_name_slug: slugMatcher(communitySlug),
        show_property: true,
      };

      // Properties in the community. Pagination is opt-in: pass
      // propertiesLimit to page, omit it to get the full list.
      const propertiesQuery = Property.find(propertyFilter).sort({ order: 1 });

      if (limit > 0) {
        propertiesQuery.limit(limit).skip((page - 1) * limit);
      }

      const properties = await propertiesQuery;

      const totalProperties = await Property.countDocuments(propertyFilter);

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
        totalProperties,
        totalPropertiesPages: limit > 0 ? Math.ceil(totalProperties / limit) : 1,
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
