const express = require("express");

const router = express.Router();

const propertySearchController = require("../controller/propertySearchController");

router.post("/property-search", propertySearchController);


module.exports = router;
