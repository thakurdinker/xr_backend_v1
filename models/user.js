const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const Schema = mongoose.Schema;

const newUserSchema = new Schema({
  username: {
    type: String,
    required: [true, "Username is required"],
  },
  first_name: {
    type: String,
    required: [true, "FirstName is required"],
  },
  last_name: {
    type: String,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
  },
  profile_image: {
    type: String,
  },
  position: {
    type: String,
  },
  role: {
    type: mongoose.Types.ObjectId,
    ref: "Role",
  },
});

newUserSchema.plugin(passportLocalMongoose, { usernameQueryFields: ["email"] });

const User = mongoose.model("User", newUserSchema);

module.exports = User;
