const Joi = require("joi");

// The website sends the dial code followed by the national number, digits
// only (e.g. "971501234567"); a leading "+" is tolerated. E.164 allows at most
// 15 digits including the country code.
const PHONE_PATTERN = /^\+?\d{7,15}$/;
const phoneMessages = { "string.pattern.base": "phone must be a valid phone number" };

// The forms enforce this client-side, but a direct POST must not be able to
// save (and forward to the CRM) a lead with no way to contact the person.
// Used as `.custom()` rather than `.or()` because phone has `.default("")`,
// which counts as "present".
const requireEmailOrPhone = (value, helpers) =>
  value.email || value.phone
    ? value
    : helpers.message("Please provide an email or phone number");

const submitFormValidation = Joi.object({
  firstname: Joi.string().optional().empty("").default(""),
  lastname: Joi.string().optional().empty("").default(""),
  email: Joi.string().email().optional().empty(""),
  phone: Joi.string().trim().pattern(PHONE_PATTERN).messages(phoneMessages).optional().empty("").default(""),
  message: Joi.string().optional().empty("").default(""),
  pageUrl: Joi.string().optional().empty("").default(""),
  ipAddress: Joi.string().optional().empty("").default(""),
  budget: Joi.string().optional().empty("").default(""),
}).custom(requireEmailOrPhone);

const submitBrochureDownloadFormValidation = Joi.object({
  email: Joi.string().email().optional().empty(""),
  firstname: Joi.string().optional().empty("").default(""),
  ipAddress: Joi.string().optional().empty("").default(""),
  lastname: Joi.string().optional().empty("").default(""),
  pageUrl: Joi.string().optional().empty("").default(""),
  phone: Joi.string().trim().pattern(PHONE_PATTERN).messages(phoneMessages).optional().empty("").default(""),
  projectBrochure: Joi.string().required(),
  projectName: Joi.string().required(),
});

const submitMarketReportFormValidation = Joi.object({
  email: Joi.string().email().optional().empty(""),
  firstname: Joi.string().optional().empty("").default(""),
  ipAddress: Joi.string().optional().empty("").default(""),
  lastname: Joi.string().optional().empty("").default(""),
  pageUrl: Joi.string().optional().empty("").default(""),
  phone: Joi.string().trim().pattern(PHONE_PATTERN).messages(phoneMessages).optional().empty("").default(""),
  marketReport: Joi.string().required(),
  reportName: Joi.string().required(),
});

const submitContactFormValidation = Joi.object({
  firstname: Joi.string().optional(),
  lastname: Joi.string().optional(),
  // The careers form sends "" for whatever the applicant left blank (and for
  // ipAddress when geolocation fails); a bare Joi.string() rejects "".
  email: Joi.string().email().optional().empty("").default(""),
  phone: Joi.string().trim().pattern(PHONE_PATTERN).messages(phoneMessages).optional().empty("").default(""),
  message: Joi.string().optional().empty(""),
  pageUrl: Joi.string().optional().empty("").default(""),
  ipAddress: Joi.string().optional().empty("").default(""),
  formId: Joi.string().optional(),
}).custom(requireEmailOrPhone);

const newsletterSubmissionValidation = Joi.object({
  email: Joi.string().email().required(),
  pageName: Joi.string().optional().empty("").default(""),
});

module.exports = {
  submitFormValidation,
  submitContactFormValidation,
  submitBrochureDownloadFormValidation,
  submitMarketReportFormValidation,
  newsletterSubmissionValidation,
};
