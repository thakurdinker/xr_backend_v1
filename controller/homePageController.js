const Agent = require("../models/agent");
const Content = require("../models/content");
const HomePageVideos = require("../models/homepageVideo");
const Property = require("../models/properties");
const catchAsync = require("../utils/seedDB/catchAsync");
const shuffle = require("../utils/shuffleArray");

module.exports.getHomePage = catchAsync(async (req, res) => {
  // Fetch the HomePage Video
  const homePageVideos = await HomePageVideos.findOne()
    .populate("mainVideo.agent videos.agent")
    .exec();

  // Xperience New Projects
  const properties = await Property.find({
    featured: true,
    show_property: true,
  })
    .select(
      "_id property_name property_name_slug price location features images type community_name community_name_slug developer developer_name_slug order"
    )
    .sort({ order: 1 });

  //   Xperience Stars
  const agent = shuffle(
    await Agent.find({}).select(
      "_id name name_slug phone languages profile_picture"
    )
  );

  //News and Insights
  const content = await Content.find({ status: "published" })
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
