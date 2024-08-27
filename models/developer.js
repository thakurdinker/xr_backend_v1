const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const newDeveloperSchema = new Schema(
  {
    logo_img_url: {
      type: String,
    },
    logo_img_url_alt: {
      type: String,
    },
    developer_name: {
      type: String,
    },
    developer_slug: {
      type: String,
    },
    description: {
      type: String,
    },
    heading: { type: String },
    order: Number,
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

const Developer = mongoose.model("Developer", newDeveloperSchema);

module.exports = Developer;
