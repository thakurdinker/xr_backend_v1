const Joi = require("joi");

const submitFormValidation = Joi.object({
  firstname: Joi.string().optional(),
  lastname: Joi.string().optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().optional(),
  message: Joi.string().optional(),
  pageUrl: Joi.string().optional(),
});

module.exports = {
  submitFormValidation,
};
