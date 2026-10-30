const express = require("express");
const catchAsync = require("../utils/seedDB/catchAsync");
const Property = require("../models/properties");

const fs = require("fs");
const path = require("path");
const Developer = require("../models/developer");
const Community = require("../models/community");
const {
  DUBAI,
  EMIRATES,
  parseEmirate,
  emirateFilter,
  emirateOf,
  propertyPath,
} = require("../utils/emirate");

const router = express.Router({ mergeParams: true });

router.route("/").get(
  catchAsync(async (req, res) => {
    const { page = 1, limit = 9 } = req.query;
    const { developerNameSlug } = req.params;
    // Developer pages are shared across emirates: the page fetches its Dubai
    // projects (default) and, separately, ?emirate=abu-dhabi for its Abu Dhabi
    // section. Every property query below is scoped to the one emirate.
    const emirate = parseEmirate(req.query.emirate);
    if (!emirate) {
      return res.status(400).json({ success: false, message: "Invalid emirate" });
    }
    const liveInEmirate = {
      developer_name_slug: developerNameSlug,
      show_property: true,
      ...emirateFilter(emirate),
    };
    try {
      // Find the developer details from the database
      const developer = await Developer.findOne({
        developer_slug: developerNameSlug,
      })
        .select(
          "logo_img_url developer_name developer_slug description heading meta_title meta_description meta_keywords predefinedCommunitiesOrder noindex"
        )
        .exec();

      if (!developer) {
        return res.status(404).json({
          success: false,
          message: "Developer not found",
        });
      }

      // Find the properties associated with the developer
      const developerProperties = await Property.find(liveInEmirate)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .select(
          "_id property_name property_name_slug price  images community_name community_name_slug developer developer_name_slug emirate"
        )

        .exec();

      // get all unqiue communities
      const uniqueCommunities = await Property.distinct(
        "community_name_slug",
        liveInEmirate
      );

      // Count the number of properties
      const propertiesCount = await Property.countDocuments(liveInEmirate);

      // Which emirates the developer has live projects in. A developer with
      // none yet counts as Dubai, where every existing developer page lives.
      const liveEmirates = new Set(
        (
          await Property.find({
            developer_name_slug: developerNameSlug,
            show_property: true,
          })
            .select("emirate")
            .lean()
        ).map(emirateOf)
      );
      const emirates = EMIRATES.filter((e) => liveEmirates.has(e));
      if (emirates.length === 0) emirates.push(DUBAI);

      // Find slide_show (Newly Launched) properties
      const newly_launched_properties = await Property.find({
        ...liveInEmirate,
        show_slideShow: true,
      }).sort("-createdAt");

      // Construct data for the slideshow
      const slideShowData = newly_launched_properties.map((property) => {
        return {
          backgroundUrl: property?.images[0]?.url,
          developer_name: property?.developer,
          community_name: property?.community_name,
          property_name: property?.property_name,
          slogan: property?.section_1?.heading,
          // Historically without a trailing slash; kept as-is.
          learnMore: property?.property_name_slug
            ? propertyPath(property.property_name_slug, emirateOf(property)).replace(/\/$/, "")
            : `/developer/${developerNameSlug}/`,
        };
      });

      // const developerCommunities = await Community.find({
      //   developer_name_slug: developerNameSlug,
      //   // show_property: true,
      // })
      //   .limit(limit)
      //   .skip((page - 1) * limit)
      //   .select("_id order name slug images")
      //   .exec();

      const developerCommunities = await Community.find({
        // developer_name_slug: developerNameSlug,
        slug: { $in: uniqueCommunities },
        // show_property: true,
        ...emirateFilter(emirate),
      })
        .select("_id order name slug images description emirate")
        .exec();

      // // Normalize the order array for comparison
      // const normalizedOrder = developer?.predefinedCommunitiesOrder?.map(
      //   (name) => name.toLowerCase()
      // );

      // Generate regex patterns for each predefined order entry

      // Generate regex patterns
      const regexPatterns = developer?.predefinedCommunitiesOrder?.map(
        (name) => {
          const pattern = name
            .toLowerCase()
            .replace(/&/g, "(and|&)") // Match both 'and' and '&'
            .replace(/\s+/g, "\\s*"); // Allow flexible spaces
          return new RegExp(pattern, "i"); // Create case-insensitive regex
        }
      );

      // Sort communities based on predefined order
      const sortedCommunities = developerCommunities.sort((a, b) => {
        const indexA = regexPatterns.findIndex((regex) => regex.test(a.name));
        const indexB = regexPatterns.findIndex((regex) => regex.test(b.name));

        // If the name is not found in predefinedOrder, move it to the end
        const adjustedIndexA = indexA === -1 ? regexPatterns.length : indexA;
        const adjustedIndexB = indexB === -1 ? regexPatterns.length : indexB;

        return adjustedIndexA - adjustedIndexB;
      });

      // console.log(sortedCommunities);

      // Apply pagination to the sorted result
      // const paginatedCommunities = sortedCommunities.slice(
      //   (page - 1) * limit,
      //   page * limit
      // );

      // Get the count of properties for paginationclear

      // const count = await Community.countDocuments({
      //   developer_name_slug: developerNameSlug,
      //   // show_property: true,
      // });
      return res.status(200).json({
        success: true,
        developerProperties,
        slideShowData,
        developerCommunities: sortedCommunities,
        emirates,
        noindex: Boolean(developer.noindex),
        message: "DONE",
        totalPages: Math.ceil(propertiesCount / limit),
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
