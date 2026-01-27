const express = require("express");
const {
  submitContactForm,
  submitContactFormCareer,
  submitLandingPageForm,
  brochureDownloadSubmission,
  marketReportSubmission,
  newsletterSubmission,
} = require("../controller/submitFormController");

const { rateLimit } = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // Limit each IP to 5 requests per `windowMs`
  message: "Too many requests, please try again in 10 minutes.",
});

const router = express.Router();

router.post("/contact", limiter, submitContactForm);
router.post("/landing-page", submitLandingPageForm);
router.post("/career_contact", limiter, submitContactFormCareer);
router.post("/brochure-download", brochureDownloadSubmission);
router.post("/market-report", marketReportSubmission);
router.post("/newsletter", limiter, newsletterSubmission);

module.exports = router;
