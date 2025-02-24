const express = require("express");
const router = express.Router({ mergeParams: true });
const aboutUsController = require("../controller/aboutUsController");

router.route("/").get(aboutUsController.getAboutUs);

module.exports = router;
