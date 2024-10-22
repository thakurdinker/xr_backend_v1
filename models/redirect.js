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
    type: {
      type: String,
      enum: ["301", "302"], // Limit to 301 (Permanent) and 302 (Temporary)
      required: true,
      default: "301", // Default to permanent redirect
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Redirect", redirectSchema);
