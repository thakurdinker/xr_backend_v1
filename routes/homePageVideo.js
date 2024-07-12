const express = require("express");

const router = express.Router({ mergeParams: true });
const homePageVideoController = require("../controller/homePageVideoController");
const { isLoggedIn } = require("../middleware/middleware");

router
  .route("/homepageVideo")
  .get(isLoggedIn, homePageVideoController.getAllHomePageVideos)
  .post(isLoggedIn, homePageVideoController.createHomePageVideo);

router
  .route("/homepageVideo/:id")
  .put(isLoggedIn, homePageVideoController.updateHomePageVideo)
  .delete(isLoggedIn, homePageVideoController.deleteHomePageVideo);

module.exports = router;
