const express = require("express");

const router = express.Router({ mergeParams: true });

const roleController = require("../controller/roleController");
const { isLoggedIn, isAdmin } = require("../middleware/middleware");

router
  .route("/roles")
  .get(isLoggedIn, roleController.listAll)
  .post(isLoggedIn, isAdmin, roleController.addRole);

router
  .route("/roles/:id")
  .get(isLoggedIn, roleController.getbyId)
  .put(isLoggedIn, isAdmin, roleController.updateRole)
  .delete(isLoggedIn, isAdmin, roleController.delete);

module.exports = router;
