const BaseJoi = require("joi");
const sanitizeHtml = require("sanitize-html");

const extension = (joi) => ({
  type: "string",
  base: joi.string(),
  messages: {
    "string.escapeHTML": "{{#label}} must not include HTML!",
  },
  rules: {
    escapeHTML: {
      validate(value, helpers) {
        const clean = sanitizeHtml(value, {
          allowedTags: [],
          allowedAttributes: {},
        });
        if (clean !== value)
          return helpers.error("string.escapeHTML", { value });
        return clean;
      },
    },
  },
});

const Joi = BaseJoi.extend(extension);

const userSchema = Joi.object({
  first_name: Joi.string().required().escapeHTML(),
  last_name: Joi.string().required().escapeHTML(),
  email: Joi.string().required().escapeHTML(),
  password: Joi.string().required().min(8).max(20).escapeHTML(),
});

module.exports = {
  userSchema,
};
