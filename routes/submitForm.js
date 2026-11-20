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

// Brochure downloads get their own bucket so a visitor grabbing a few brochures
// isn't locked out of the contact form (and vice versa). The message is JSON
// because the brochure popup reads `error` from the response body to show it.
const brochureLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // Limit each IP to 5 requests per `windowMs`
  message: { error: "Too many requests, please try again in 10 minutes." },
});

const router = express.Router();

router.post("/contact", limiter, submitContactForm);
router.post("/landing-page", limiter, submitLandingPageForm);
router.post("/career_contact", limiter, submitContactFormCareer);
router.post("/brochure-download", brochureLimiter, brochureDownloadSubmission);
router.post("/market-report", marketReportSubmission);
router.post("/newsletter", limiter, newsletterSubmission);

module.exports = router;
