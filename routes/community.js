const express = require("express");

const router = express.Router({ mergeParams: true });

const communityController = require("../controller/communityController");

router
  .route("/communities")
  .get(communityController.getAll)
  .post(communityController.createCommunity);

router
  .route("/communities/:id")
  .get(communityController.getById)
  .put(communityController.updateCommunity)
  .delete(communityController.delete);

module.exports = router;
