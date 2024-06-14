const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const newRoleSchema = new Schema({
  role_name: {
    type: String,
  },
  permissions: [
    {
      type: Schema.Types.ObjectId,
      ref: "Permission",
    },
  ],
});

const Role = mongoose.model("Role", newRoleSchema);

module.exports = Role;
