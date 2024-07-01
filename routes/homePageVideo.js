const express = require("express");

const router = express.Router({ mergeParams: true });
const homePageVideoController = require("../controller/homePageVideoController");

router
  .route("/homepageVideo")
  .get(homePageVideoController.getAllHomePageVideos)
  .post(homePageVideoController.createHomePageVideo);

router
  .route("/homepageVideo/:id")
  .put(homePageVideoController.updateHomePageVideo)
  .delete(homePageVideoController.deleteHomePageVideo);

module.exports = router;
