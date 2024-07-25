const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const newDeveloperSchema = new Schema(
  {
    logo_img_url: {
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
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

const Developer = mongoose.model("Developer", newDeveloperSchema);

module.exports = Developer;
