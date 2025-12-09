const express = require("express");
const {
  submitContactForm,
  submitContactFormCareer,
  submitLandingPageForm,
  brochureDownloadSubmission,
  marketReportSubmission,
} = require("../controller/submitFormController");

const router = express.Router();

router.post("/contact", submitContactForm);
router.post("/landing-page", submitLandingPageForm);
router.post("/career_contact", submitContactFormCareer);
router.post("/brochure-download", brochureDownloadSubmission);
router.post("/market-report", marketReportSubmission);

module.exports = router;
