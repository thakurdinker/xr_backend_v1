const express = require("express");

const router = express.Router({ mergeParams: true });

const homePageController = require("../controller/homePageController");

router.route("/").get(homePageController.getHomePage);

module.exports = router;
