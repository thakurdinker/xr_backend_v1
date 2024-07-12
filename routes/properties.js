const express = require("express");

const router = express.Router({ mergeParams: true });

const propertyController = require("../controller/propertiesController");
const { isLoggedIn, isAdmin } = require("../middleware/middleware");

router
  .route("/properties")
  .get(isLoggedIn, propertyController.getAllProperties)
  .post(isLoggedIn, propertyController.createProperty);

router
  .route("/properties/:id")
  .get(isLoggedIn, propertyController.getById)
  .put(isLoggedIn, propertyController.updateProperty)
  .delete(isLoggedIn, propertyController.delete);

module.exports = router;
