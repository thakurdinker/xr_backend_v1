const mongoose = require("mongoose");

const iconSchema = new mongoose.Schema(
  {
    icon_url: {
      type: String,
    },
    icon_text: {
      type: String,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

const Icon = mongoose.model("Icon", iconSchema);

module.exports = Icon;
