const { default: mongoose } = require("mongoose");
const Property = require("../models/properties");
const {
  propertySchemaValidation,
  propertySchemaValidationUpdate,
} = require("../schemaValidation/schema");
const catchAsync = require("../utils/seedDB/catchAsync");

// Create a new property
module.exports.createProperty = catchAsync(async (req, res) => {
  const { error } = propertySchemaValidation.validate(req.body);

  if (error) {
    return res.status(200).json({
      success: false,
      isCreated: false,
      message: error.details[0].message,
    });
  }
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

// Read all properties
module.exports.getAllProperties = catchAsync(async (req, res) => {
  try {
    const properties = await Property.find({});
    return res.status(200).json({ success: true, properties, message: "DONE" });
  } catch (error) {
    return res.status(200).json({
      success: false,
      message: error,
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

  const { error } = propertySchemaValidationUpdate.validate(req.body);

  if (error) {
    return res.status(200).json({
      success: false,
      isUpdated: false,
      message: error.details[0].message,
    });
  }
  const updates = Object.keys(req.body);

  const allowedUpdates = [
    "property_name",
    "description",
    "price",
    "type",
    "location",
    "features",
    "images",
    "gallery",
    "status",
    "community_name",
    "community_name_slug",
    "property_name_slug",
    "community_features",
    "starting_price",
    "show_property",
    "featured",
  ];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res
      .status(200)
      .json({ success: false, isUpdated: false, message: "Invalid updates!" });
  }

  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(200).json({
        success: false,
        isUpdated: false,
        message: "Proeprty Not Found",
      });
    }

    updates.forEach((update) => (property[update] = req.body[update]));
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
