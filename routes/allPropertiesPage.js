const express = require("express");
const catchAsync = require("../utils/seedDB/catchAsync");
const Property = require("../models/properties");

const propertiesController = require("../controller/propertiesController");

const router = express.Router({ mergeParams: true });

router.route("/").get(propertiesController.getAllProperties);

module.exports = router;
