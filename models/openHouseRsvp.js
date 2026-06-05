const mongoose = require("mongoose");

const openHouseRsvpSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      maxlength: 100,
    },
    email: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      default: "",
    },
    preferredDate: {
      type: String,
      required: [true, "Preferred date is required"],
    },
    eventSlug: {
      type: String,
      default: "",
    },
    eventName: {
      type: String,
      default: "",
    },
    pageUrl: {
      type: String,
      default: "",
    },
    ipAddress: {
      type: String,
      default: "",
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

const OpenHouseRsvp = mongoose.model("OpenHouseRsvp", openHouseRsvpSchema);

module.exports = OpenHouseRsvp;
