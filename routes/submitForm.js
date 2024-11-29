const express = require("express");
const { submitContactForm } = require("../controller/submitFormController");

const router = express.Router();

router.post("/contact", submitContactForm);

module.exports = router;
