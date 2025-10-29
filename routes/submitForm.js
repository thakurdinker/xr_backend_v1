const express = require("express");
const {
  submitContactForm,
  submitContactFormCareer,
  submitLandingPageForm,
} = require("../controller/submitFormController");

const router = express.Router();

router.post("/contact", submitContactForm);
router.post("/landing-page", submitLandingPageForm);
router.post("/career_contact", submitContactFormCareer);

module.exports = router;
