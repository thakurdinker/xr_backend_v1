const Joi = require("joi");

const reviewsFormValidation = Joi.object({
  name: Joi.string().optional(),
  message: Joi.string().optional(),
  imageUrl: Joi.string().allow('').optional(),
  numberOfStars: Joi.number().optional(),
  showReview: Joi.boolean().default(false), 
});

module.exports = {
    reviewsFormValidation,
};
