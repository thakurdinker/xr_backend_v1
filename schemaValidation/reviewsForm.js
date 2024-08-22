const Joi = require("joi");

const reviewsFormValidation = Joi.object({
  name: Joi.string().min(2).max(30).optional(),
  message: Joi.string().max(500).optional(),
  imageUrl: Joi.string().optional(),
  numberOfStars: Joi.number().optional(),
});

module.exports = {
    reviewsFormValidation,
};
