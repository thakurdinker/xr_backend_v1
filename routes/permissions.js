// Route to manage permissions
const express = require("express");

const router = express.Router({ mergeParams: true });
const permissionsController = require("../controller/permissionsController");

router
  .route("/permissions")
  .get(permissionsController.listAll)
  .post(permissionsController.addPermission);

router
  .route("/permissions/:id")
  .get(permissionsController.getById)
  .put(permissionsController.updatePermission)
  .delete(permissionsController.delete);

module.exports = router;
