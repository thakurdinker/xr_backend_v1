const express = require("express");

const router = express.Router({ mergeParams: true });
const contentController = require("../controller/contentController.js");
const { isLoggedIn } = require("../middleware/middleware.js");

router
  .route("/content")
  .get(isLoggedIn, contentController.getContent)
  .post(isLoggedIn, contentController.addContent);

router
  .route("/content/filter")
  .get(isLoggedIn, contentController.getContentByFilter);

router
  .route("/content/:id")
  .get(isLoggedIn, contentController.getById)
  .put(isLoggedIn, contentController.updateContent)
  .delete(isLoggedIn, contentController.delete);

module.exports = router;
