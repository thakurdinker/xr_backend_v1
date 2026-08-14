const { default: mongoose } = require("mongoose");
const Community = require("../models/community");
const {
  communityValidationSchema,
  communityUpdateValidationSchema,
} = require("../schemaValidation/schema");
const catchAsync = require("../utils/seedDB/catchAsync");
const cloudinary = require("../cloudinary/cloudinaryConfig");
const extractPublicIdfromUrl = require("../utils/extractPublicIdfromUrl");
const Property = require("../models/properties");
const axios = require("axios");
const qs = require("qs");

const STRAPI_BASE_URL =
  process.env.STRAPI_BASE_URL || "https://admin-v1.xrealty.ae";

/**
 * Canonical form of a community slug.
 *
 * Slugs are denormalised strings duplicated across three places (the Community
 * collection, Property.community_name_slug, and Strapi community_slug), so any
 * casing or whitespace drift silently breaks the relation — e.g. a property
 * saved under "Evermore" never matched the "evermore" area page. Everything
 * that reads or compares a slug goes through here.
 */
const normaliseSlug = (slug) => (slug || "").trim().toLowerCase();

module.exports.normaliseSlug = normaliseSlug;

// Create a new community
module.exports.createCommunity = catchAsync(async (req, res) => {
  // const { error } = communityValidationSchema.validate(req.body);
  // if (error) {
  //   return res.status(200).json({
  //     success: false,
  //     isCreated: false,
  //     message: error.details[0].message,
  //   });
  // }

  try {
    const community = new Community(req.body);
    await community.save();
    return res.status(200).json({
      success: true,
      isCreated: true,
      message: "DONE",
    });
  } catch (error) {
    console.log(error);
    return res.status(200).json({
      success: false,
      isCreated: false,
      message: "Error",
    });
  }
});

// Read all communities
module.exports.getAll = catchAsync(async (req, res) => {
  // const { page = 1, limit = 10 } = req.query;
  try {
    const communities = await Community.find({})
      // .limit(limit)
      // .skip((page - 1) * limit)
      .select("name slug description images");

    // Only LIVE properties are counted. The /area/:slug detail page filters on
    // show_property: true, so counting unfiltered here made the listing
    // advertise more projects than the detail page actually renders (Dubai
    // Islands showed "6" but rendered 5).
    const properties = await Property.find({ show_property: true }).select(
      "community_name community_name_slug"
    );

    // Tally live properties per normalised slug — one pass instead of the old
    // O(communities x properties) nested filter.
    const propertyCounts = new Map();
    for (const property of properties) {
      const key = normaliseSlug(property.community_name_slug);
      if (!key) continue;
      propertyCounts.set(key, (propertyCounts.get(key) || 0) + 1);
    }

    // get the communities from the strapi backend.
    // Isolated in its own try/catch: a Strapi outage should degrade to the
    // Mongo-only list, not collapse the endpoint to success:false and blank
    // the whole /area/ page.
    let strapiCommunitiesData = null;
    try {
      const strapiCommunities = await axios.get(
        `${STRAPI_BASE_URL}/api/communities-contents?populate=*`,
        { timeout: 8000 }
      );
      strapiCommunitiesData = strapiCommunities?.data;
    } catch (strapiError) {
      console.error(
        "[getAll] Strapi communities-contents fetch failed — serving Mongo-only list:",
        strapiError.message
      );
    }

    // Make a object containing the community and the properties total number in that community
    const communityWithProperties = communities.map((community) => ({
      community_name: (community.name || "").trim(),
      community_slug: normaliseSlug(community.slug),
      community_description: community.description,
      community_images: community.images,
      properties: propertyCounts.get(normaliseSlug(community.slug)) || 0,
    }));

    const communityWithPropertiesStrapiData = (
      strapiCommunitiesData?.data ?? []
    ).map((community) => ({
      community_name: (community?.community_name || "").trim(),
      community_slug: normaliseSlug(community?.community_slug),
      community_description: community?.seo?.metaDescription,
      community_images: [{ url: community?.hero_image?.url, description: community?.seo?.metaDescription }],
      properties: 0,
    }));

    // De-duplicate by slug. Both stores hold some of the same communities
    // (Dubai Islands, Downtown Dubai, DAMAC Hills 1/2, ... — 12 slugs in all),
    // and blindly concatenating them rendered duplicate cards on /area/.
    //
    // Strapi wins on content because it is the migration target, but the live
    // property count only exists on the Mongo side, so it is carried across.
    const bySlug = new Map();

    for (const community of communityWithProperties) {
      if (!community.community_slug) continue;
      bySlug.set(community.community_slug, community);
    }

    for (const community of communityWithPropertiesStrapiData) {
      if (!community.community_slug) continue;
      const existing = bySlug.get(community.community_slug);
      bySlug.set(community.community_slug, {
        ...community,
        // Prefer Strapi's hero image, but never regress to a blank card.
        community_images: community.community_images?.[0]?.url
          ? community.community_images
          : existing?.community_images,
        community_description:
          community.community_description || existing?.community_description,
        properties:
          propertyCounts.get(community.community_slug) ||
          existing?.properties ||
          0,
      });
    }

    // const count = await Community.countDocuments();
    return res.status(200).json({
      success: true,
      communities: [...bySlug.values()],
      // totalPages: Math.ceil(count / limit),
      // currentPage: Number(page),
      message: "DONE",
    });
  } catch (error) {
    console.log(error);
    return res.status(200).json({
      success: false,
      message: "Error",
    });
  }
});

// Read all communities for admin panel
module.exports.getAllForAdmin = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, search = "" } = req.query;
  try {
    const filter = search
      ? { name: { $regex: search, $options: "i" } }
      : {};

    const communities = await Community.find(filter)
      .limit(limit)
      .skip((page - 1) * limit)
      .exec();

    const count = await Community.countDocuments(filter);
    return res.status(200).json({
      success: true,
      communities,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      message: "DONE",
    });
  } catch (error) {
    console.log(error);
    return res.status(200).json({
      success: false,
      message: "Error",
    });
  }
});

module.exports.getAllCommunities = catchAsync(async (req, res) => {
  try {
    const communities = await Community.find({});

    return res.status(200).json({
      success: true,
      communities,
      message: "DONE",
    });
  } catch (error) {
    console.log(error);
    return res.status(200).json({
      success: false,
      message: "Error",
    });
  }
});

// Read a single community by ID
module.exports.getById = catchAsync(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(200).json({ success: false, message: "Invalid Id" });
  }
  try {
    const community = await Community.findById(req.params.id);
    if (!community) {
      return res
        .status(200)
        .json({ success: false, message: "No Community Found" });
    }
    return res.status(200).json({ success: true, community, message: "DONE" });
  } catch (error) {
    return res.status(200).json({ success: false, message: error });
  }
});

// Update a community by ID
module.exports.updateCommunity = catchAsync(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res
      .status(200)
      .json({ success: false, isUpdated: false, message: "Invalid Id" });
  }

  // const { error } = communityUpdateValidationSchema.validate(req.body, {
  //   allowUnknown: true,
  // });
  // if (error) {
  //   return res.status(200).json({
  //     success: false,
  //     isUpdated: false,
  //     message: error.details[0].message,
  //   });
  // }

  try {
    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(200).json({
        success: false,
        isUpdated: false,
        message: "Community Not Found",
      });
    }

    Object.keys(req.body).forEach((update) => {
      if (
        typeof req.body[update] === "object" &&
        !Array.isArray(req.body[update])
      ) {
        Object.keys(req.body[update]).forEach((nestedUpdate) => {
          community[update][nestedUpdate] = req.body[update][nestedUpdate];
        });
      } else {
        community[update] = req.body[update];
      }
    });

    await community.save();

    return res
      .status(200)
      .json({ success: true, isUpdated: true, community, message: "DONE" });
  } catch (error) {
    res.status(200).json({ success: false, isUpdated: false, message: error });
  }
});

// Delete a community by ID
module.exports.delete = catchAsync(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res
      .status(200)
      .json({ success: false, isDeleted: false, message: "Invalid Id" });
  }
  try {
    const community = await Community.findByIdAndDelete(req.params.id);
    if (!community) {
      return res.status(200).json({
        success: false,
        isDeleted: false,
        message: "Community Not available",
      });
    }

    let public_ids = [];

    for (let image of community.images) {
      public_ids.push(extractPublicIdfromUrl(image.url));
    }

    try {
      const result = await cloudinary.uploader.destroy(public_ids, {
        resource_type: "image",
        invalidate: true,
      });
    } catch (err) {
      console.log(err);
    }

    return res.status(200).json({
      success: true,
      isDeleted: true,
      message: "DONE",
    });
  } catch (error) {
    console.log(error);
    return res.status(200).json({
      success: false,
      isDeleted: false,
      message: error,
    });
  }
});
