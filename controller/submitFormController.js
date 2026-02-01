const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../vars/.env") });

const Joi = require("joi");
const Contact = require("../models/submitForm");
const {
  submitFormValidation,
  submitContactFormValidation,
  submitBrochureDownloadFormValidation,
  submitMarketReportFormValidation,
  newsletterSubmissionValidation,
} = require("../schemaValidation/submitForm");
const catchAsync = require("../utils/seedDB/catchAsync");
const {
  sendLeadSubmitEmail,
  sendCareerSubmitEmail,
  sendNewsletterSubmitEmail,
} = require("../utils/postmark/sendLeadSubmitEmail");
const { sendFormSubmitDataN8N } = require("../utils/n8n/sendFormSubmitData");
const { default: axios } = require("axios");

const ZAPIER_URL = process.env.ZAPIER_URL;

// sends data to zapier which analyzes the data and sends it to the crm
const sendContactFormDataToZapier = async (data) => {
  try {
    const response = await axios.post(ZAPIER_URL, data);
    // console.log(response.data);
  } catch (err) {
    console.log(err);
  }
};

//  submit data to the crm

const submitDataToCrm = async (data) => {
  try {
    await axios.post(`${process.env.CRM_URL}`, {
      leadName: data?.firstname + " " + data?.lastname,
      email: data?.email || "",
      phoneNumber: data?.phone || "",
      // dateCreated: convertToDatabaseFormat(created_time),
      dateCreated: new Date().toISOString(),
      source: "Website",
      description: data?.message || "",
      campaignName: data?.campaignName || "XR - Website",
      pageName: data?.pageUrl || "",
      // location: data?.campaignName || "",
    });
  } catch (err) {
    console.log(err);
  }
};

module.exports.submitContactForm = catchAsync(async (req, res) => {
  const { error, value } = submitFormValidation.validate(req.body);

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    const contact = new Contact(value);
    await contact.save();
    sendLeadSubmitEmail(value);
    await sendFormSubmitDataN8N(value);
    res.status(201).json({ message: "Form submitted successfully" });
  } catch (err) {
    res.status(500).json({ error: "An error occurred while saving the form" });
  } finally {
    try {
      await sendContactFormDataToZapier(value);
    } catch (err) {
      console.log(err);
    }
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

// Landing page submission
module.exports.submitLandingPageForm = catchAsync(async (req, res) => {

  console.log(req.body);

  return res.status(200).json({ error: "An error occurred while saving the form" });
  try {
    submitDataToCrm(req.body);
    res.status(201).json({ message: "Form submitted successfully" });
  } catch (err) {
    res.status(500).json({ error: "An error occurred while saving the form" });
  }
});

// Borchure Download Submission
module.exports.brochureDownloadSubmission = catchAsync(async (req, res) => {
  const { error, value } = submitBrochureDownloadFormValidation.validate(
    req.body
  );

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }


  try {
    const contact = new Contact(value);
    await contact.save();
    sendLeadSubmitEmail({
      email: value?.email,
      firstname: value?.firstname,
      lastname: value?.lastname,
      phone: value?.phone,
      message: `Brochure Download -  ${value?.projectName}`,
      pageUrl: value?.pageUrl,
      ipAddress: value?.ipAddress,
    });

    // Get the brochure link
    const brochureLink = await axios.get(
      `https://admin-v1.xrealty.ae/api/brochures?filters[documentId]=${value.projectBrochure}&populate=*`
    );

    res.status(201).json({
      message: "Form submitted successfully",
      brochureLink: brochureLink?.data?.data[0]?.project_brochure?.url || "",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "An error occurred while saving the form" });
  } finally {
    try {
      await sendContactFormDataToZapier({
        email: value?.email,
        firstname: value?.firstname,
        lastname: value?.lastname,
        phone: value?.phone,
        message: `Brochure Download -  ${value?.projectName}`,
        pageUrl: value?.pageUrl,
        ipAddress: value?.ipAddress,
      });
    } catch (err) {
      console.log(err);
      res
        .status(500)
        .json({ error: "An error occurred while saving the form" });
    }
  }
});

// Market Report Submission
module.exports.marketReportSubmission = catchAsync(async (req, res) => {
  const { error, value } = submitMarketReportFormValidation.validate(req.body);

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    const contact = new Contact(value);
    await contact.save();
    sendLeadSubmitEmail({
      email: value?.email,
      firstname: value?.firstname,
      lastname: value?.lastname,
      phone: value?.phone,
      message: `Market Report -  ${value?.reportName}`,
      pageUrl: value?.pageUrl,
      ipAddress: value?.ipAddress,
    });

    // Get the brochure link
    const marketReportLink = await axios.get(
      `https://admin-v1.xrealty.ae/api/market-reports?filters[documentId]=${value.marketReport}&populate=*`
    );

    res.status(201).json({
      message: "Form submitted successfully",
      marketReportLink: marketReportLink?.data?.data[0]?.report_link?.url || "",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "An error occurred while saving the form" });
  } finally {
    try {
      await sendContactFormDataToZapier({
        email: value?.email,
        firstname: value?.firstname,
        lastname: value?.lastname,
        phone: value?.phone,
        message: `Market Report -  ${value?.reportName}`,
        pageUrl: value?.pageUrl,
        ipAddress: value?.ipAddress,
      });
    } catch (err) {
      console.log(err);
      res
        .status(500)
        .json({ error: "An error occurred while saving the form" });
    }
  }
});

module.exports.newsletterSubmission = catchAsync(async (req, res) => {
  const { error, value } = newsletterSubmissionValidation.validate(req.body);

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    const response = await fetch(
      "https://admin-v1.xrealty.ae/api/newsletter-subscribers",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: { email: value.email, pageName: value.pageName },
        }),
      }
    );

    if (response.ok) {
      sendNewsletterSubmitEmail(value.email);
      return res.status(201).json({ message: "Subscription successful" });
    } else {
      return res.status(400).json({ error: "Subscription failed. Try again." });
    }
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "An error occurred." });
  }
});
