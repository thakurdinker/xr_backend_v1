const express = require("express");
const searchFilterController = require("../controller/searchFilterController");
const router = express.Router();


router.get('/user/search-filters', searchFilterController)

module.exports = router;