const express = require("express");
const router = express.Router({ mergeParams: true });
const agentController = require("../controller/agentController");

router
  .route("/agents")
  .get(agentController.getAll)
  .post(agentController.createAgent);

router
  .route("/agents/:id")
  .get(agentController.getById)
  .put(agentController.updateAgent)
  .delete(agentController.delete);

module.exports = router;
