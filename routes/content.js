const express = require("express");

const router = express.Router({ mergeParams: true });
const contentController = require("../controller/contentController.js");

router
  .route("/content")
  .get(contentController.getContent)
  .post(contentController.addContent);

router.route("/content/filter").get(contentController.getContentByFilter);

router
  .route("/content/:id")
  .get(contentController.getById)
  .put(contentController.updateContent)
  .delete(contentController.delete);

module.exports = router;
