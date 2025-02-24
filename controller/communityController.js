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

    const properties = await Property.find({}).select(
      "community_name community_name_slug"
    );

    // Match the properties with the communities
    const matchedProperties = properties.filter((property) =>
      communities.some(
        (community) => community.slug === property.community_name_slug
      )
    );

    // Make a object containing the community and the properties total number in that community
    const communityWithProperties = communities.map((community) => ({
      community_name: community.name,
      community_slug: community.slug,
      community_description: community.description,
      community_images: community.images,
      properties: matchedProperties.filter(
        (property) => property.community_name_slug === community.slug
      ).length,
    }));

    // const count = await Community.countDocuments();
    return res.status(200).json({
      success: true,
      communities: communityWithProperties,
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
