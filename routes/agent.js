const express = require("express");
const router = express.Router({ mergeParams: true });
const agentController = require("../controller/agentController");
const { isLoggedIn } = require("../middleware/middleware");

router
  .route("/agents")
  .get(isLoggedIn, agentController.getAll)
  .post(isLoggedIn, agentController.createAgent);
  
router
  .route("/starAgents")
  .get( agentController.getStarAgents)

router.route("/agents/listAll").get(isLoggedIn, agentController.listAll);

router
  .route("/agents/:id")
  .get(isLoggedIn, agentController.getById)
  .put(isLoggedIn, agentController.updateAgent)
  .delete(isLoggedIn, agentController.delete);

module.exports = router;
