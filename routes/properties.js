const express = require("express");

const router = express.Router({ mergeParams: true });

const propertyController = require("../controller/propertiesController");

router
  .route("/properties")
  .get(propertyController.getAllProperties)
  .post(propertyController.createProperty);

router
  .route("/properties/:id")
  .get(propertyController.getById)
  .put(propertyController.updateProperty)
  .delete(propertyController.delete);

module.exports = router;
