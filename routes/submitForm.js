const express = require("express");
const {
  submitContactForm,
  submitContactFormCareer,
  submitLandingPageForm,
  brochureDownloadSubmission,
} = require("../controller/submitFormController");

const router = express.Router();

router.post("/contact", submitContactForm);
router.post("/landing-page", submitLandingPageForm);
router.post("/career_contact", submitContactFormCareer);
router.post("/brochure-download", brochureDownloadSubmission);

module.exports = router;
