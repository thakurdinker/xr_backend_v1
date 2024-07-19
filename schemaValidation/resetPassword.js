const Joi = require("joi");

const resetPasswordRequestValidation = Joi.object({
  email: Joi.string().required(),
});

const resetPasswordValidation = Joi.object({
  resetToken: Joi.string().required(),
  password: Joi.string().min(6).required(),
  confirmPassword: Joi.string().min(6).required(),
});

module.exports = {
  resetPasswordRequestValidation,
  resetPasswordValidation,
};
