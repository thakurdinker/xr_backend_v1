const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const newPermissionSchema = new Schema(
  {
    permission_name: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true }, timestamps: true }
);

const Permission = mongoose.model("Permission", newPermissionSchema);

module.exports = Permission;
