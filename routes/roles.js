const express = require("express");

const router = express.Router({ mergeParams: true });

const roleController = require("../controller/roleController");

router.route("/roles").get(roleController.listAll).post(roleController.addRole);

router
  .route("/roles/:id")
  .get(roleController.getbyId)
  .put(roleController.updateRole)
  .delete(roleController.delete);

module.exports = router;
