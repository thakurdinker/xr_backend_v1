const { default: mongoose } = require("mongoose");
const Property = require("../models/properties");
const {
  propertySchemaValidation,
  propertySchemaValidationUpdate,
} = require("../schemaValidation/schema");
const catchAsync = require("../utils/seedDB/catchAsync");
const cloudinary = require("../cloudinary/cloudinaryConfig");
const extractPublicIdfromUrl = require("../utils/extractPublicIdfromUrl");

// Create a new property
module.exports.createProperty = catchAsync(async (req, res) => {
  // const { error } = propertySchemaValidation.validate(req.body);

  // if (error) {
  //   return res.status(200).json({
  //     success: false,
  //     isCreated: false,
  //     message: error.details[0].message,
  //   });
  // }
  try {
    const property = new Property(req.body);
    await property.save();
    return res
      .status(200)
      .json({ success: true, isCreated: true, message: "DONE" });
  } catch (error) {
    return res.status(200).json({
      success: false,
      isCreated: false,
      message: "Fail to Add Property",
    });
  }
});

// Read all properties with pagination
// module.exports.getAllProperties = catchAsync(async (req, res) => {
//   const { page = 1, limit = 10 } = req.query;
//   try {
//     const properties = await Property.find({})
//       .limit(limit * 1)
//       .skip((page - 1) * limit)
//       .exec();

//     const count = await Property.countDocuments();
//     return res.status(200).json({
//       success: true,
//       properties,
//       message: "DONE",
//       totalPages: Math.ceil(count / limit),
//       currentPage: page,
//     });
//   } catch (error) {
//     return res.status(200).json({
//       success: false,
//       message: error,
//     });
//   }
// });

module.exports.getAllProperties = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, sortOrder = 1 } = req.query; // Default sortOrder is 1 (ascending)
  try {
    const properties = await Property.find({})
      .sort({ order: sortOrder }) // Sort based on the 'order' field
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Property.countDocuments();

    return res.status(200).json({
      success: true,
      properties,
      message: "DONE",
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      message: error.message,
    });
  }
});


// Read all properties with pagination - For Public Route
module.exports.getAllPublicProperties = catchAsync(async (req, res) => {

  const { page = 1, limit = 10, sortOrder = 1 } = req.query;
  try {
    const properties = await Property.find({ show_property: true })
    .sort({ order: sortOrder }) 
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select(
        "_id property_name property_name_slug price location features images type community_name community_name_slug developer developer_name_slug order"
      )
      .sort("-createdAt")
      .exec();

    const count = await Property.countDocuments({ show_property: true });
    return res.status(200).json({
      success: true,
      properties,
      message: "DONE",
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Read a single property by ID
module.exports.getById = catchAsync(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(200).json({ success: false, message: "Invalid Id" });
  }

  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res
        .status(200)
        .json({ success: false, message: "No property Found" });
    }
    return res.status(200).json({ success: true, property, message: "DONE" });
  } catch (error) {
    return res.status(200).json({ success: false, message: error });
  }
});

// Update a property by ID
module.exports.updateProperty = catchAsync(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res
      .status(200)
      .json({ success: false, isUpdated: false, message: "Invalid Id" });
  }

  // const { error } = propertySchemaValidation.validate(req.body);

  // if (error) {
  //   return res.status(200).json({
  //     success: false,
  //     isUpdated: false,
  //     message: error.details[0].message,
  //   });
  // }
  const updates = Object.keys(req.body);

  // const allowedUpdates = [
  //   "property_name",
  //   "description",
  //   "price",
  //   "type",
  //   "location",
  //   "features",
  //   "images",
  //   "gallery",
  //   "status",
  //   "community_name",
  //   "community_name_slug",
  //   "property_name_slug",
  //   "community_features",
  //   "show_property",
  //   "featured",
  // ];
  // const isValidOperation = updates.every((update) =>
  //   allowedUpdates.includes(update)
  // );

  // if (!isValidOperation) {
  //   return res
  //     .status(200)
  //     .json({ success: false, isUpdated: false, message: "Invalid updates!" });
  // }

  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(200).json({
        success: false,
        isUpdated: false,
        message: "Proeprty Not Found",
      });
    }

    // Checking for nested objects in the request
    // If we find any, the update only that specific field in the object in the db instead of replacing the whole object
    updates.forEach((update) => {
      if (
        typeof req.body[update] === "object" &&
        !Array.isArray(req.body[update])
      ) {
        Object.keys(req.body[update]).forEach((nestedUpdate) => {
          property[update][nestedUpdate] = req.body[update][nestedUpdate];
        });
      } else {
        property[update] = req.body[update];
      }
    });

    await property.save();
    res
      .status(200)
      .json({ success: true, isUpdated: true, property, message: "DONE" });
  } catch (error) {
    res.status(200).json({ success: false, isUpdated: false, message: error });
  }
});

// Delete a property by ID
module.exports.delete = catchAsync(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res
      .status(200)
      .json({ success: false, isDeleted: false, message: "Invalid Id" });
  }

  try {
    const property = await Property.findByIdAndDelete(req.params.id);

    if (!property) {
      return res.status(200).json({
        success: false,
        isDeleted: false,
        message: "Property Not available",
      });
    }

    let public_ids = [];

    for (let image of property.images) {
      public_ids.push(extractPublicIdfromUrl(image.url));
    }

    for (let image of property.gallery) {
      public_ids.push(extractPublicIdfromUrl(image));
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
    return res.status(200).json({
      success: false,
      isDeleted: false,
      message: error,
    });
  }
});
