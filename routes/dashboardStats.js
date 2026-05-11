const express = require("express");
const router = express.Router();

const Property = require("../models/properties");
const Community = require("../models/community");
const User = require("../models/user");
const Icon = require("../models/icons");
const Redirect = require("../models/redirect");
const { isLoggedIn, isAdmin } = require("../middleware/middleware");

// GET /admin/dashboard-stats
router.get("/dashboard-stats", isLoggedIn, isAdmin, async (req, res) => {
  try {
    // Run all count queries in parallel
    const [
      totalProperties,
      totalCommunities,
      totalUsers,
      totalIcons,
      totalRedirects,
      recentProperties,
      recentCommunities,
    ] = await Promise.all([
      Property.countDocuments({}),
      Community.countDocuments({}),
      User.countDocuments({}),
      Icon.countDocuments({}),
      Redirect.countDocuments({}),
      Property.find({})
        .sort({ updatedAt: -1 })
        .limit(5)
        .select("property_name property_name_slug community_name updatedAt gallery1"),
      Community.find({})
        .sort({ updatedAt: -1 })
        .limit(5)
        .select("name slug updatedAt images"),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalProperties,
        totalCommunities,
        totalUsers,
        totalIcons,
        totalRedirects,
      },
      recent: {
        properties: recentProperties,
        communities: recentCommunities,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ success: false, message: "Failed to load dashboard stats" });
  }
});

module.exports = router;
