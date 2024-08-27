const Joi = require("joi");
const Contact = require("../models/submitForm");
const { submitFormValidation } = require("../schemaValidation/submitForm");
const catchAsync = require("../utils/seedDB/catchAsync");
const {
  sendLeadSubmitEmail,
} = require("../utils/postmark/sendLeadSubmitEmail");

module.exports.submitContactForm = catchAsync(async (req, res) => {
  const { error, value } = submitFormValidation.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  try {
    const contact = new Contact(value);
    await contact.save();
    sendLeadSubmitEmail(value);
    res.status(201).json({ message: "Form submitted successfully", contact });
  } catch (err) {
    res.status(500).json({ error: "An error occurred while saving the form" });
  }
});
