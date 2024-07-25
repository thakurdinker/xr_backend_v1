const { default: mongoose } = require("mongoose");
const HomePageVideos = require("../models/homepageVideo");
const catchAsync = require("../utils/seedDB/catchAsync");

module.exports.getAllHomePageVideos = catchAsync(async (req, res) => {
  try {
    const homePageVideos = await HomePageVideos.findOne()
      .populate("mainVideo.agent videos.agent")
      .exec();
    return res
      .status(200)
      .json({ success: true, homePageVideos, message: "DONE" });
  } catch (error) {
    console.error("Error fetching homepage videos:", error);
    return res.status(200).json({
      success: false,
      message: error,
    });
  }
});

module.exports.createHomePageVideo = catchAsync(async (req, res) => {
  try {
    const { mainVideoUrl, mainVideoAgentId, additionalVideos, mainVideoTitle } =
      req.body;
    const newHomePageVideo = new HomePageVideos({
      mainVideo: {
        url: mainVideoUrl || "",
        title: mainVideoTitle || "",
        agent: mainVideoAgentId || "",
      },
      videos: additionalVideos.map((video) => ({
        url: video.url || "",
        title: video.title || "",
        agent: video.agentId || "",
      })),
    });
    const result = await newHomePageVideo.save();
    return res
      .status(200)
      .json({ success: true, isCreated: true, message: "DONE" });
  } catch (error) {
    console.error("Error creating homepage video:", error);
    res.status(200).json({ success: false, isCreated: false, message: error });
  }
});

module.exports.updateHomePageVideo = catchAsync(async (req, res) => {
  try {
    const { mainVideoUrl, mainVideoAgentId, additionalVideos, mainVideoTitle } =
      req.body;

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(200).json({ success: false, message: "Invalid ID" });
    }

    const updatedHomePageVideo = await HomePageVideos.findByIdAndUpdate(
      req.params.id,
      {
        mainVideo: {
          url: mainVideoUrl || "",
          title: mainVideoTitle || "",
          agent: mainVideoAgentId || "",
        },
        videos: additionalVideos.map((video) => ({
          url: video.url || "",
          title: video.title || "",
          agent: video.agentId || "",
        })),
      },
      { new: true }
    )
      .populate("mainVideo.agent videos.agent")
      .exec();

    if (!updatedHomePageVideo) {
      return res.status(200).json({
        success: false,
        isUpdated: false,
        error: "Homepage video not found",
      });
    }
    return res.status(200).json({
      success: true,
      isUpdated: true,
      message: "DONE",
    });
  } catch (error) {
    console.error(
      `Error updating homepage video with ID ${req.params.id}:`,
      error
    );
    return res.status(200).json({
      success: false,
      isUpdated: false,
      error: error,
    });
  }
});

module.exports.deleteHomePageVideo = catchAsync(async (req, res) => {
  try {
    const deletedHomePageVideo = await HomePageVideos.deleteOne({
      _id: req.params.id,
    }).exec();
    if (!deletedHomePageVideo) {
      return res.status(200).json({
        success: false,
        isDeleted: false,
        message: "Homepage video not found",
      });
    }
    return res
      .status(200)
      .json({ success: true, isDeleted: true, message: "DONE" });
  } catch (error) {
    console.error(
      `Error deleting homepage video with ID ${req.params.id}:`,
      error
    );
    return res.status(200).json({
      success: false,
      isDeleted: false,
      message: error,
    });
  }
});
