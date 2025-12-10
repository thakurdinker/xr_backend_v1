const Joi = require("joi");

const submitFormValidation = Joi.object({
  firstname: Joi.string().optional(),
  lastname: Joi.string().optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().optional(),
  message: Joi.string().optional().empty(""),
  pageUrl: Joi.string().optional(),
  ipAddress: Joi.string().optional(),
});

const submitBrochureDownloadFormValidation = Joi.object({
  email: Joi.string().email().required(),
  firstname: Joi.string().required(),
  ipAddress: Joi.string().optional(),
  lastname: Joi.string().required(),
  pageUrl: Joi.string().optional(),
  phone: Joi.string().required(),
  projectBrochure: Joi.string().required(),
  projectName: Joi.string().required(),
});

const submitMarketReportFormValidation = Joi.object({
  email: Joi.string().email().required(),
  firstname: Joi.string().required(),
  ipAddress: Joi.string().optional(),
  lastname: Joi.string().required(),
  pageUrl: Joi.string().optional(),
  phone: Joi.string().required(),
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

module.exports = {
  submitFormValidation,
  submitContactFormValidation,
  submitBrochureDownloadFormValidation,
  submitMarketReportFormValidation,
};
