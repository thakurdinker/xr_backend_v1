const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const newRoleSchema = new Schema(
  {
    role_name: {
      type: String,
    },
    permissions: [
      {
        type: Schema.Types.ObjectId,
        ref: "Permission",
      },
    ],
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

const Role = mongoose.model("Role", newRoleSchema);

module.exports = Role;
