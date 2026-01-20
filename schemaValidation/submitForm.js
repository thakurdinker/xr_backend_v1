const Joi = require("joi");

const submitFormValidation = Joi.object({
  firstname: Joi.string().optional().empty("").default(""),
  lastname: Joi.string().optional().empty("").default(""),
  email: Joi.string().email().optional().empty(""),
  phone: Joi.string().optional().empty("").default(""),
  message: Joi.string().optional().empty("").default(""),
  pageUrl: Joi.string().optional().empty("").default(""),
  ipAddress: Joi.string().optional().empty("").default(""),
  budget: Joi.string().optional().empty("").default(""),
});

const submitBrochureDownloadFormValidation = Joi.object({
  email: Joi.string().email().optional().empty(""),
  firstname: Joi.string().optional().empty("").default(""),
  ipAddress: Joi.string().optional().empty("").default(""),
  lastname: Joi.string().optional().empty("").default(""),
  pageUrl: Joi.string().optional().empty("").default(""),
  phone: Joi.string().optional().empty("").default(""),
  projectBrochure: Joi.string().required(),
  projectName: Joi.string().required(),
});

const submitMarketReportFormValidation = Joi.object({
  email: Joi.string().email().optional().empty(""),
  firstname: Joi.string().optional().empty("").default(""),
  ipAddress: Joi.string().optional().empty("").default(""),
  lastname: Joi.string().optional().empty("").default(""),
  pageUrl: Joi.string().optional().empty("").default(""),
  phone: Joi.string().optional().empty("").default(""),
  marketReport: Joi.string().required(),
  reportName: Joi.string().required(),
});

const submitContactFormValidation = Joi.object({
  firstname: Joi.string().optional(),
  lastname: Joi.string().optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().optional(),
  message: Joi.string().optional().empty(""),
  pageUrl: Joi.string().optional(),
  ipAddress: Joi.string().optional(),
  formId: Joi.string().optional(),
});

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
