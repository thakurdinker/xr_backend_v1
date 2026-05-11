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
    // Auto-expire after 35 minutes (JWT expires in 30m, 5m grace)
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 35 * 60 * 1000),
      index: { expires: 0 },
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

const ResetToken = mongoose.model("ResetToken", newResetTokenSchema);

module.exports = ResetToken;
