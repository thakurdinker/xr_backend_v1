const express = require("express");

const router = express.Router({ mergeParams: true });

const communityController = require("../controller/communityController");
const { isLoggedIn } = require("../middleware/middleware");

router
  .route("/communities")
  .get(isLoggedIn, communityController.getAll)
  .post(isLoggedIn, communityController.createCommunity);

router
  .route("/communities/:id")
  .get(isLoggedIn, communityController.getById)
  .put(isLoggedIn, communityController.updateCommunity)
  .delete(isLoggedIn, communityController.delete);

module.exports = router;
