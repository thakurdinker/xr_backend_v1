const express = require("express");
const catchAsync = require("../utils/seedDB/catchAsync");
const Property = require("../models/properties");

const fs = require("fs");
const path = require("path");
const Developer = require("../models/developer");
const Community = require("../models/community");

const router = express.Router({ mergeParams: true });

router.route("/").get(
  catchAsync(async (req, res) => {
    // const { page = 1, limit = 8 } = req.query;
    const { developerNameSlug } = req.params;
    try {
      // Find the developer details from the database
      const developer = await Developer.findOne({
        developer_slug: developerNameSlug,
      })
        .select(
          "logo_img_url developer_name developer_slug description heading meta_title meta_description predefinedCommunitiesOrder"
        )
        .exec();

      if (!developer) {
        return res.status(404).json({
          success: false,
          message: "Developer not found",
        });
      }

      // Find the properties associated with the developer
      // const developerProperties = await Property.find({
      //   developer_name_slug: developerNameSlug,
      //   show_property: true,
      // })
      //   .limit(limit)
      //   .skip((page - 1) * limit)
      //   .select(
      //     "_id property_name property_name_slug price location features images type community_name community_name_slug developer developer_name_slug"
      //   )
      //   .exec();

      // Find slide_show (Newly Launched) properties
      const newly_launched_properties = await Property.find({
        developer_name_slug: developerNameSlug,
        show_property: true,
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
          learnMore: property?.property_name_slug
            ? `/property/${property?.property_name_slug}`
            : `/label/${developerNameSlug}/`,
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
        developer_name_slug: developerNameSlug,
        // show_property: true,
      })
        .select("_id order name slug images")
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

      const count = await Community.countDocuments({
        developer_name_slug: developerNameSlug,
        // show_property: true,
      });
      return res.status(200).json({
        success: true,
        aboutDeveloper: developer, // Developer information
        // developerProperties,
        slideShowData,
        developerCommunities: sortedCommunities,
        message: "DONE",
        // totalPages: Math.ceil(count / limit),
        // currentPage: Number(page),
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
