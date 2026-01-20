const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
  {
    firstname: {
      type: String,
      maxlength: 30,
    },
    lastname: {
      type: String,
      maxlength: 30,
    },
    email: {
      type: String,
      // match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/
    },
    phone: {
      type: String,
      // match: /^[0-9]{10,15}$/
    },
    message: {
      type: String,
      maxlength: 500,
    },
    pageUrl: {
      type: String,
      default: "https://www.xrealty.ae",
    },
    ipAddress: {
      type: String,
      default: "",
    },
    resumeUrl: {
      type: String,
      default: "",
    },
    original_fileName: {
      type: String,
      default: "",
    },
    resume_fileName: {
      type: String,
      default: "",
    },
    budget: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

const Contact = mongoose.model("Contact", contactSchema);

module.exports = Contact;
