const express = require("express");
const catchAsync = require("../utils/seedDB/catchAsync");
const Property = require("../models/properties");

const propertiesController = require("../controller/propertiesController");
const { ABU_DHABI } = require("../utils/emirate");

const router = express.Router({ mergeParams: true });

router.route("/").get(propertiesController.getAllPublicProperties);

router
  .route("/:saleType/:type")
  .get(propertiesController.getPropertiesBySaleTypeAndType);

router.route("/:slug").get(propertiesController.getAllPublicProperties);

// /abu-dhabi-properties/:saleType/:type — the Abu Dhabi landing pages (see
// utils/abuDhabiSeoUrlMap.js). Same handler, scoped to Abu Dhabi.
const abuDhabiRouter = express.Router({ mergeParams: true });

abuDhabiRouter.route("/:saleType/:type").get((req, res, next) => {
  req.emirate = ABU_DHABI;
  return propertiesController.getPropertiesBySaleTypeAndType(req, res, next);
});

module.exports = router;
module.exports.abuDhabiRouter = abuDhabiRouter;
