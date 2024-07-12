// Route to manage permissions
const express = require("express");

const router = express.Router({ mergeParams: true });
const permissionsController = require("../controller/permissionsController");
const { isLoggedIn } = require("../middleware/middleware");

router
  .route("/permissions")
  .get(isLoggedIn, permissionsController.listAll)
  .post(isLoggedIn, permissionsController.addPermission);

router
  .route("/permissions/:id")
  .get(isLoggedIn, permissionsController.getById)
  .put(isLoggedIn, permissionsController.updatePermission)
  .delete(isLoggedIn, permissionsController.delete);

module.exports = router;
