const { default: mongoose } = require("mongoose");
const Content = require("../models/content");
const {
  contentValidationSchema,
  contentUpdateValidationSchema,
} = require("../schemaValidation/schema");
const catchAsync = require("../utils/seedDB/catchAsync");

// Add content
module.exports.addContent = catchAsync(async (req, res) => {
  const { error } = contentValidationSchema.validate(req.body);

  if (error) {
    return res.status(200).json({
      success: false,
      isCreated: false,
      message: error.details[0].message,
    });
  }
  try {
    const content = new Content(req.body);
    await content.save();
    return res
      .status(200)
      .json({ success: true, isCreated: true, content, message: DONE });
  } catch (error) {
    return res
      .status(200)
      .json({ success: true, isCreated: false, message: error });
  }
});

// Read all content
module.exports.getContent = catchAsync(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    const contentList = await Content.find({})
      .limit(limit)
      .skip((page - 1) * limit)
      .exec();

    const count = await Content.countDocuments();
    return res.status(200).json({
      success: true,
      contentList,
      message: "DONE",
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (error) {
    return res.status(200).json({ success: false, message: error });
  }
});

// Read a single content by ID
module.exports.getById = catchAsync(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res
      .status(200)
      .json({ success: false, message: "Not a valid content id" });
  }
  try {
    const content = await Content.findById(req.params.id);
    if (!content) {
      return res
        .status(200)
        .json({ success: false, message: "No Content Found" });
    }
    return res.status(200).json({ success: true, content, message: "DONE" });
  } catch (error) {
    return res.status(200).json({ success: false, message: error });
  }
});

// Update a content by ID
module.exports.updateContent = catchAsync(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(200).json({
      success: false,
      isUpdated: false,
      message: "Not a valid content id",
    });
  }
  const { error } = contentUpdateValidationSchema.validate(req.body, {
    allowUnknown: true,
  });
  if (error) {
    return res.status(200).json({
      success: false,
      isUpdated: false,
      message: error.details[0].message,
    });
  }

  try {
    const content = await Content.findById(req.params.id);
    if (!content) {
      return res.status(200).json({
        success: false,
        isUpdated: false,
        message: "No Content Found",
      });
    }

    Object.keys(req.body).forEach((update) => {
      if (
        typeof req.body[update] === "object" &&
        !Array.isArray(req.body[update])
      ) {
        Object.keys(req.body[update]).forEach((nestedUpdate) => {
          content[update][nestedUpdate] = req.body[update][nestedUpdate];
        });
      } else {
        content[update] = req.body[update];
      }
    });

    await content.save();
    res
      .status(200)
      .json({ success: true, isUpdated: true, content, message: "DONE" });
  } catch (error) {
    return res.status(200).json({
      success: false,
      isUpdated: false,
      message: error,
    });
  }
});

// Delete a content by ID
module.exports.delete = catchAsync(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(200).json({
      success: false,
      isDeleted: false,
      message: "Not a valid content id",
    });
  }
  try {
    const content = await Content.findByIdAndDelete(req.params.id);
    if (!content) {
      return res.status(200).json({
        success: false,
        isDeleted: false,
        message: "No content found",
      });
    }
    return res.status(200).json({
      success: true,
      isDeleted: true,
      message: "DONE",
    });
  } catch (error) {
    res.status(200).json({ success: false, isDeleted: false, message: error });
  }
});

// Get content based on category, publish_date, and status
module.exports.getContentByFilter = catchAsync(async (req, res) => {
  const { category, published_date, status } = req.query;
  const query = {};

  if (category) {
    query.category = category;
  }

  if (published_date) {
    query.publish_date = new Date(published_date);
  }

  if (status) {
    query.status = status;
  }

  try {
    const contentList = await Content.find(query);
    res.status(200).json({ success: true, contentList, message: "DONE" });
  } catch (error) {
    res.status(200).json({ success: false, message: error });
  }
});
