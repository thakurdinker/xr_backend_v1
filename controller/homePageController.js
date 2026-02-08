const Property = require("../models/properties");
const catchAsync = require("../utils/seedDB/catchAsync");
const shuffle = require("../utils/shuffleArray");
const qs = require("qs");
const axios = require("axios");


const fetchHomeDatafromStrapi = async () => {
  let data = [];
  const queryStr = qs.stringify(
    {
      populate: [
        "homepage_video",
        "community_section_cards",
        "community_section_cards.area_image",
        "Faqs",
        "project_of_the_month_key_features",
        "google_review_cards",
        "featured_projects",
        "featured_projects.featured_project_image",
        "featured_agents",
        "featured_agents.agent_image",
        "featured_agents.agent_image_new",
        "project_of_the_month_video_thumbnail",
        "featured_dvelopers",
        "featured_dvelopers.developer_logo_image",
        "featured_villas",
        "featured_villas.featured_project_image",
        "featured_townhouses",
        "featured_townhouses.featured_project_image",
        "featured_apartments",
        "featured_apartments.featured_project_image",
        "insightful_blogs",
        "insightful_blogs.cover",
        "insightful_blogs.category",
      ],
    },
    {
      encodeValuesOnly: true,
    }
  );
  try {
    const response = await axios.get(`https://admin-v1.xrealty.ae/api/home?${queryStr}`);

    data = response?.data?.data || [];
  } catch (error) {
    console.error("Error fetching home data:", error);
    data = [];
  } finally {
    return data;
  }
};

const fetchGuidesDatafromStrapi = async () => {

  let guides = [];
  const queryStr2 = qs.stringify(
    {
      filters: {
        show_guide: true,
      },
      fields: ["guide_name", "hero_heading", "guide_slug"],
      populate: ["guide_featured_image"],
    },
    {
      encodeValuesOnly: true,
    }
  );
  try {
    const response = await axios.get(`https://admin-v1.xrealty.ae/api/guides?${queryStr2}`);

    guides = response?.data?.data || [];
  } catch (error) {
    console.error("Error fetching guides data:", error);
    guides = [];
  } finally {
    return guides;
  }
};

module.exports.getHomePage = catchAsync(async (req, res) => {

  let newData = [];
  let guides = [];


  newData = await fetchHomeDatafromStrapi();
  guides = await fetchGuidesDatafromStrapi();



  // Xperience New Projects
  const properties = await Property.find({
    featured: true,
    show_property: true,
  })
    .select(
      "_id property_name property_name_slug price location features images type community_name community_name_slug developer developer_name_slug order status"
    )
    .sort({ createdAt: -1 })
    .limit(10);


  return res.status(200).json({
    success: true,
    homepage: { newData, guides, properties },
    message: "DONE",
  });
});
