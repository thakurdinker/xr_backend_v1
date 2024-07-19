const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const newResetTokenSchema = new Schema(
  {
    resetToken: {
      type: String,
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

const ResetToken = mongoose.model("ResetToken", newResetTokenSchema);

module.exports = ResetToken;
