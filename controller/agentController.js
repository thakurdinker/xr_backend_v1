const { default: mongoose } = require("mongoose");
const Agent = require("../models/agent");
const {
  agentValidationSchema,
  agentUpdateValidationSchema,
} = require("../schemaValidation/schema");
const catchAsync = require("../utils/seedDB/catchAsync");
const extractPublicIdfromUrl = require("../utils/extractPublicIdfromUrl");
const cloudinary = require("../cloudinary/cloudinaryConfig");

// Create a new agent
module.exports.createAgent = catchAsync(async (req, res) => {
  // const { error } = agentValidationSchema.validate(req.body);
  // if (error) {
  //   return res.status(200).json({
  //     success: false,
  //     isCreated: false,
  //     message: error.details[0].message,
  //   });
  // }
  try {
    const agent = new Agent(req.body);
    await agent.save();
    res
      .status(200)
      .json({ success: true, isCreated: true, agent, message: "DONE" });
  } catch (error) {
    res.status(200).json({ success: false, isCreated: false, message: error });
  }
});

// Read all agents with pagination
module.exports.getAll = catchAsync(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    const agents = await Agent.find({})
      .limit(limit)
      .skip((page - 1) * limit)
      .exec();

    const count = await Agent.countDocuments();
    res.status(200).json({
      success: true,
      agents,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      message: "DONE",
    });
  } catch (error) {
    res.status(200).json({ success: false, message: error });
  }
});

// Read all agents without pagination
module.exports.listAll = catchAsync(async (req, res) => {
  try {
    const agents = await Agent.find({}).exec();

    res.status(200).json({
      success: true,
      agents,
      message: "DONE",
    });
  } catch (error) {
    res.status(200).json({ success: false, message: error });
  }
});

// Read a single agent by ID
module.exports.getById = catchAsync(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res
      .status(200)
      .json({ success: false, message: "Not a valid agent id" });
  }

  try {
    const agent = await Agent.findById(req.params.id);
    if (!agent) {
      return res
        .status(200)
        .json({ success: false, message: "No agent Found" });
    }
    return res.status(200).json({ success: true, agent, message: "DONE" });
  } catch (error) {
    return res.status(200).json({ success: false, message: error });
  }
});

// Update an agent by ID
module.exports.updateAgent = catchAsync(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(200).json({
      success: false,
      isUpdated: false,
      message: "Not a valid agent id",
    });
  }
  // const { error } = agentUpdateValidationSchema.validate(req.body, {
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
    const agent = await Agent.findById(req.params.id);
    if (!agent) {
      return res.status(200).json({
        success: false,
        isUpdated: false,
        message: "No agent Found",
      });
    }
    Object.keys(req.body).forEach((update) => {
      if (
        typeof req.body[update] === "object" &&
        !Array.isArray(req.body[update])
      ) {
        Object.keys(req.body[update]).forEach((nestedUpdate) => {
          agent[update][nestedUpdate] = req.body[update][nestedUpdate];
        });
      } else {
        agent[update] = req.body[update];
      }
    });
    await agent.save();
    return res
      .status(200)
      .json({ success: true, isUpdated: true, agent, message: "DONE" });
  } catch (error) {
    return res.status(200).json({ success: false, message: error });
  }
});

// Delete an agent by ID

module.exports.delete = catchAsync(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(200).json({
      success: false,
      isDeleted: false,
      message: "Not a valid agent id",
    });
  }
  try {
    const agent = await Agent.findByIdAndDelete(req.params.id);
    if (!agent) {
      return res.status(200).json({
        success: false,
        isDeleted: false,
        message: "No agent Found",
      });
    }
    const public_id = extractPublicIdfromUrl(agent.profile_picture);

    try {
      const result = await cloudinary.uploader.destroy(public_id, {
        resource_type: "image",
        invalidate: true,
      });
    } catch (err) {
      console.log(err);
    }

    return res
      .status(200)
      .json({ success: true, isDeleted: true, agent, message: "DONE" });
  } catch (error) {
    console.log(error);
    return res.status(200).json({ success: false, message: error });
  }
});
