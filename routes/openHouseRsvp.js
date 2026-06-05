const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const Joi = require("joi");
const axios = require("axios");
const OpenHouseRsvp = require("../models/openHouseRsvp");
const catchAsync = require("../utils/seedDB/catchAsync");
const {
  sendOpenHouseRsvpEmail,
} = require("../utils/postmark/sendOpenHouseRsvpEmail");

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  message: "Too many RSVP requests. Please try again later.",
});

const rsvpValidation = Joi.object({
  name: Joi.string().max(100).required(),
  email: Joi.string().email().allow("").optional(),
  phone: Joi.string().max(20).allow("").optional(),
  preferredDate: Joi.string().required(),
  eventSlug: Joi.string().allow("").optional(),
  eventName: Joi.string().allow("").optional(),
  pageUrl: Joi.string().allow("").optional(),
}).custom((value, helpers) => {
  // At least email or phone must be provided
  if (!value.email && !value.phone) {
    return helpers.error("any.custom", {
      message: "Please provide at least an email address or phone number",
    });
  }
  return value;
});

/**
 * Push lead to the CRM (same pattern as submitFormController.submitDataToCrm)
 */
const submitToCrm = async (data) => {
  if (!process.env.CRM_URL) return;
  try {
    await axios.post(process.env.CRM_URL, {
      leadName: data.name,
      email: data.email || "",
      phoneNumber: data.phone || "",
      dateCreated: new Date().toISOString(),
      source: "Website",
      description: `Open House RSVP | Preferred Date: ${data.preferredDate?.replace(/\s*\(.*?\)/, "")}`,
      campaignName: `Farm Gardens Open House | ${data.preferredDate?.replace(/\s*\(.*?\)/, "")}`,
      pageName: data.pageUrl || "",
    });
    console.log("[OpenHouseRsvp] CRM submission successful");
  } catch (err) {
    console.error("[OpenHouseRsvp] CRM submission error:", err.message);
  }
};

// POST /api/openhouse/rsvp
router.post(
  "/rsvp",
  limiter,
  catchAsync(async (req, res) => {
    const { error, value } = rsvpValidation.validate(req.body);

    if (error) {
      const msg = error.details?.[0]?.context?.message || error.details?.[0]?.message || "Validation failed";
      return res.status(400).json({ error: msg });
    }

    // Attach IP address
    value.ipAddress =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || "";

    try {
      const rsvp = new OpenHouseRsvp(value);
      await rsvp.save();

      // Send email notification to team
      sendOpenHouseRsvpEmail(value);

      // Push to CRM (non-blocking)
      submitToCrm(value);

      res.status(201).json({ message: "RSVP submitted successfully" });
    } catch (err) {
      console.error("[OpenHouseRsvp] Save error:", err.message);
      res
        .status(500)
        .json({ error: "An error occurred while submitting your RSVP" });
    }
  })
);

module.exports = router;
