const express = require("express");
const {
  submitContactForm,
  submitContactFormCareer,
} = require("../controller/submitFormController");

const router = express.Router();

router.post("/contact", submitContactForm);
router.post("/career_contact", submitContactFormCareer);

module.exports = router;
