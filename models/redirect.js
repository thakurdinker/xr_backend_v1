const mongoose = require("mongoose");

const redirectSchema = new mongoose.Schema(
  {
    from: {
      type: String,
      required: true,
      trim: true,
      unique: true, // Ensure no duplicate redirects
    },
    to: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Redirect", redirectSchema);
