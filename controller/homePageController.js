const ProjectOfTheMonthModel = require("../models/ProjectOfTheMonthModel");
const Agent = require("../models/agent");
const Community = require("../models/community");
const Content = require("../models/content");
const HomePageVideos = require("../models/homepageVideo");
const Property = require("../models/properties");
const Review = require("../models/reviewsForm");
const catchAsync = require("../utils/seedDB/catchAsync");
const shuffle = require("../utils/shuffleArray");

const featuredCommunities = [
  "66a3779b688ec57316721322",
  "66a37a67688ec57316721382",
  "66a397243840185880028c36",
  "66a396193840185880028c17",
];

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
      "_id property_name property_name_slug price location features images type community_name community_name_slug developer developer_name_slug order status"
    )
    .sort({ order: 1 });

  // Xplore Dubai With XR
  let propertyTypes = null;
  propertyTypes = await Property.find({
    show_property: true,
  })
    .select(
      "_id property_name property_name_slug price location features images type community_name community_name_slug developer developer_name_slug order"
    )
    .sort({ order: 1 })
    .limit(30);

  // Featured Communities
  const communities_featured = await Community.find({
    _id: { $in: featuredCommunities },
  })
    .select("_id name slug images")
    .sort("order");

  // Communities
  const communities = await Community.find({
    _id: { $nin: featuredCommunities },
  })
    .select("_id name slug images")
    .sort("-createdAt")
    .limit(10);

  // Merge both the featured and normal communities

  let mergedCommunities = [...communities_featured, ...communities];

  //   Xperience Stars
  // const agent = shuffle(
  //   await Agent.find({ hidden: false })
  //     .select("_id name name_slug phone languages profile_picture specialties")
  //     .limit(10)
  // );

  const count = await Agent.countDocuments({ hidden: false });
  const random = Math.max(0, Math.floor(Math.random() * (count - 10)));

  const agent = await Agent.find({ hidden: false })
    .select("_id name name_slug phone languages profile_picture specialties")
    .skip(random)
    .limit(10);

  //News and Insights
  const content = await Content.find({ status: "published" })
    .sort({ publish_date: -1 })
    .select("_id title slug publish_date category featured_image")
    .limit(6);

  // Project of the Month
  const projectOfTheMonth = await ProjectOfTheMonthModel.findOne().populate({
    path: "amenities.icons",
  });

  // Reviews
  const reviews = await Review.find({ showReview: true })
    .sort({
      createdAt: -1,
    })
    .limit(3);

  return res.status(200).json({
    success: true,
    homePageVideos,
    properties,
    propertyTypes,
    communities: mergedCommunities,
    content,
    agent,
    projectOfTheMonth,
    reviews,
    message: "DONE",
  });
});
