const express = require("express");
const mongoose = require("mongoose");
const Developer = require("../models/developer");
const Property = require("../models/properties");
const {
  DUBAI,
  EMIRATES,
  parseEmirate,
  emirateOf,
} = require("../utils/emirate");
const {
  fetchStrapiDevelopers,
  strapiEmiratesOf,
  mergeDevelopers,
} = require("../utils/strapiDevelopers");
const { isLoggedIn } = require("../middleware/middleware");

const router = express.Router({ mergeParams: true });

// One developer slug per brand, shared by both emirates.
const developerSlugTaken = (slug, excludeId) =>
  slug
    ? Developer.exists({
        developer_slug: slug,
        ...(excludeId ? { _id: { $ne: excludeId } } : {}),
      })
    : null;

const DEVELOPER_SLUG_CLASH_MESSAGE =
  "A developer with this slug already exists. Choose a different slug.";

// Create a new developer
router.route("/developers").post(isLoggedIn, async (req, res) => {
  try {
    if (await developerSlugTaken(req.body.developer_slug)) {
      return res.status(200).json({
        success: false,
        isCreated: false,
        message: DEVELOPER_SLUG_CLASH_MESSAGE,
      });
    }
    const developer = new Developer(req.body);
    await developer.save();
    return res.status(200).json({
      success: true,
      isCreated: true,
      message: "DONE",
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      isCreated: false,
      message: error.message,
    });
  }
});

// Get all developers
// Optional ?emirate=dubai|abu-dhabi narrows the list to developers with live
// projects there (a developer with none counts as Dubai). Without it every
// developer is returned, as the admin panel expects. Each developer carries
// its `emirates` either way.
// Developers are added in Strapi now, so Strapi developers without a Mongo
// record are appended (see utils/strapiDevelopers.js). If Strapi is down the
// list falls back to the Mongo records.
router.route("/developers").get(async (req, res) => {
  const emirate = req.query.emirate ? parseEmirate(req.query.emirate) : null;
  if (req.query.emirate && !emirate) {
    return res.status(400).json({ success: false, message: "Invalid emirate" });
  }
  try {
    const [mongoDevelopers, strapiDevelopers] = await Promise.all([
      Developer.find({}).sort({ order: 1 }).exec(),
      fetchStrapiDevelopers().catch((err) => {
        console.warn(
          "[developers] Strapi fetch failed — serving Mongo-only list:",
          err.message
        );
        return [];
      }),
    ]);
    const developers = mergeDevelopers(
      mongoDevelopers.map((d) => d.toJSON()),
      strapiDevelopers
    );
    const strapiEmiratesBySlug = new Map(
      strapiDevelopers.map((d) => [d.developer_slug, strapiEmiratesOf(d)])
    );

    const liveBySlug = new Map();
    const live = await Property.find({ show_property: true })
      .select("developer_name_slug emirate")
      .lean();
    for (const p of live) {
      if (!liveBySlug.has(p.developer_name_slug)) {
        liveBySlug.set(p.developer_name_slug, new Set());
      }
      liveBySlug.get(p.developer_name_slug).add(emirateOf(p));
    }
    const emiratesOf = (developer) => {
      const tagged = strapiEmiratesBySlug.get(developer.developer_slug) ?? [];
      if (tagged.length) return tagged;
      const found = EMIRATES.filter((e) =>
        liveBySlug.get(developer.developer_slug)?.has(e)
      );
      return found.length ? found : [DUBAI];
    };

    let tempDevelopers = [];

    developers
      .map((developer) => ({
        ...developer,
        emirates: emiratesOf(developer),
      }))
      .filter((developer) => !emirate || developer.emirates.includes(emirate))
      .forEach((developer) => {
        if (
          developer.developer_slug === "emaar-properties" ||
          developer.developer_slug === "emaar"
        ) {
          tempDevelopers.unshift(developer);
        } else {
          tempDevelopers.push(developer);
        }
      });

    return res.status(200).json({
      success: true,
      isFetched: true,
      message: "DONE",
      data: tempDevelopers,
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      isFetched: false,
      message: error.message,
    });
  }
});

// Get a developer by ID
router.route("/developers/:id").get(isLoggedIn, async (req, res) => {
  try {
    const developer = await Developer.findById(req.params.id);
    if (!developer) {
      return res.status(200).json({
        success: false,
        isFetched: false,
        message: "Developer not found",
      });
    }
    return res.status(200).json({
      success: true,
      isFetched: true,
      message: "DONE",
      data: developer,
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      isFetched: false,
      message: error.message,
    });
  }
});

// Update a developer by ID
router.route("/developers/:id").put(isLoggedIn, async (req, res) => {
  try {
    if (
      mongoose.isValidObjectId(req.params.id) &&
      (await developerSlugTaken(req.body.developer_slug, req.params.id))
    ) {
      return res.status(200).json({
        success: false,
        isUpdated: false,
        message: DEVELOPER_SLUG_CLASH_MESSAGE,
      });
    }
    const developer = await Developer.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );
    if (!developer) {
      return res.status(200).json({
        success: false,
        isUpdated: false,
        message: "Developer not found",
      });
    }
    return res.status(200).json({
      success: true,
      isUpdated: true,
      message: "DONE",
      data: developer,
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      isUpdated: false,
      message: error.message,
    });
  }
});

// Delete a developer by ID
router.route("/developers/:id").delete(isLoggedIn, async (req, res) => {
  try {
    const developer = await Developer.findByIdAndDelete(req.params.id);
    if (!developer) {
      return res.status(200).json({
        success: false,
        isDeleted: false,
        message: "Developer not found",
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
      message: error.message,
    });
  }
});

module.exports = router;
