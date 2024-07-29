const Agent = require("../models/agent");
const Content = require("../models/content");
const HomePageVideos = require("../models/homepageVideo");
const Property = require("../models/properties");
const catchAsync = require("../utils/seedDB/catchAsync");

module.exports.getHomePage = catchAsync(async (req, res) => {
  // Fetch the HomePage Video
  const homePageVideos = await HomePageVideos.findOne()
    .populate("mainVideo.agent videos.agent")
    .exec();

  // Xperience New Projects
  const properties = await Property.find({ featured: true }).select(
    "_id property_name property_name_slug price location features images type"
  );

  //   Xperience Stars
  const agent = await Agent.find({}).select(
    "_id name name_slug phone languages profile_picture"
  );

  //News and Insights
  const content = await Content.find({})
    .sort("-createdAt")
    .select("_id title slug images featured_image createdAt")
    .limit(3);

  return res.status(200).json({
    success: true,
    homePageVideos,
    properties,
    content,
    agent,
    message: "DONE",
  });
});
