const Joi = require("joi");

const submitFormValidation = Joi.object({
  firstname: Joi.string().min(2).max(30).optional(),
  lastname: Joi.string().min(2).max(30).optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().optional(),
  message: Joi.string().max(500).optional(),
  pageUrl: Joi.string().optional(),
});

module.exports = {
  submitFormValidation,
};
