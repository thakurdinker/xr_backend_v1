const Joi = require("joi");
const Contact = require("../models/submitForm");
const {
  submitFormValidation,
  submitContactFormValidation,
} = require("../schemaValidation/submitForm");
const catchAsync = require("../utils/seedDB/catchAsync");
const {
  sendLeadSubmitEmail,
  sendCareerSubmitEmail,
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
    res.status(201).json({ message: "Form submitted successfully" });
  } catch (err) {
    res.status(500).json({ error: "An error occurred while saving the form" });
  }
});

// Career Page Submission
module.exports.submitContactFormCareer = catchAsync(async (req, res) => {
  const { error, value } = submitContactFormValidation.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  try {
    const contact = await Contact.findOne({ _id: value.formId });
    if (!contact) {
      return res.status(404).json({ error: "Form not found" });
    }
    contact.firstname = value.firstname;
    contact.lastname = value.lastname;
    contact.email = value.email;
    contact.phone = value.phone;
    contact.message = value.message;
    contact.pageUrl = value.pageUrl;
    contact.ipAddress = value.ipAddress;
    await contact.save();
    // console.log(contact);
    sendCareerSubmitEmail(contact);
    res.status(201).json({ message: "Form submitted successfully" });
  } catch (err) {
    res.status(500).json({ error: "An error occurred while saving the form" });
  }
});
