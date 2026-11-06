const express = require("express");

const router = express.Router({ mergeParams: true });

const communityController = require("../controller/communityController");
const { isLoggedIn } = require("../middleware/middleware");
const { EMIRATES, parseEmirate } = require("../utils/emirate");
const { fetchStrapiEmirates } = require("../utils/strapiEmirates");

// Emirate options for the admin community form. The list is authored in
// Strapi, but only emirates this backend can actually store are returned:
// parseEmirate() rejects anything else, so offering it would produce areas
// that fail to save. Falls back to the built-in list when Strapi is down —
// an outage must not stop an editor creating an area.
router.route("/emirates").get(isLoggedIn, async (req, res) => {
  const fallback = EMIRATES.map((name) => ({
    name,
    slug: name.toLowerCase().replace(/\s+/g, "-"),
  }));
  try {
    const supported = (await fetchStrapiEmirates())
      .map((e) => ({ name: parseEmirate(e?.name), slug: e?.slug }))
      .filter((e) => e.name)
      .map((e) => ({
        name: e.name,
        slug: e.slug || e.name.toLowerCase().replace(/\s+/g, "-"),
      }));
    return res.status(200).json({
      success: true,
      isFetched: true,
      message: "DONE",
      data: supported.length ? supported : fallback,
    });
  } catch (error) {
    console.warn(
      "[emirates] Strapi fetch failed — serving the built-in list:",
      error.message
    );
    return res.status(200).json({
      success: true,
      isFetched: true,
      message: "DONE",
      data: fallback,
    });
  }
});

router
  .route("/communities")
  .get(isLoggedIn, communityController.getAll)
  .post(isLoggedIn, communityController.createCommunity);

router
  .route("/getAllForAdmin")
  .get(isLoggedIn, communityController.getAllForAdmin)
  .post(isLoggedIn, communityController.createCommunity);

router
  .route("/getAllForAdmin/:id")
  .get(isLoggedIn, communityController.getById)
  .put(isLoggedIn, communityController.updateCommunity)
  .delete(isLoggedIn, communityController.delete);

router
  .route("/getAllCommunities")
  .get(isLoggedIn, communityController.getAllCommunities);

router
  .route("/communities/:id")
  .get(isLoggedIn, communityController.getById)
  .put(isLoggedIn, communityController.updateCommunity)
  .delete(isLoggedIn, communityController.delete);

module.exports = router;
