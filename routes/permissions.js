// Route to manage permissions
const express = require("express");

const router = express.Router({ mergeParams: true });
const permissionsController = require("../controller/permissionsController");
const { isLoggedIn, isAdmin } = require("../middleware/middleware");

router
  .route("/permissions")
  .get(isLoggedIn, permissionsController.listAll)
  .post(isLoggedIn, isAdmin, permissionsController.addPermission);

router
  .route("/permissions/:id")
  .get(isLoggedIn, isAdmin, permissionsController.getById)
  .put(isLoggedIn, isAdmin, permissionsController.updatePermission)
  .delete(isLoggedIn, isAdmin, permissionsController.delete);

module.exports = router;
