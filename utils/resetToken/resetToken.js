require("dotenv").config({ path: "../../vars/.env" });
const jwt = require("jsonwebtoken");
const ResetToken = require("../../models/resettoken");
const User = require("../../models/user");
const catchAsync = require("../seedDB/catchAsync");

const generateJWTToken = (user) => {
  let payload = {
    user: {
      id: user._id,
    },
  };
  let token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "30m" });
  return token;
};

const createResetToken = async ({ email, username }) => {
  //check if the user exists by email or username
  let user;
  if (email) {
    console.log("recieved email");
    user = await User.findOne({ email: email });
  } else if (username) {
    console.log("recieved username");
    user = await User.findOne({ username: username });
  }
  if (!user) {
    return {
      error: true,
    };
  }
  //check if an existing reset token exists for the user
  //   If it exists then delete it
  await ResetToken.findOneAndDelete({ user: user._id });
  //   if (resetToken) {
  //     //if the token exists we will delete it and create a new one
  //     await resetToken.remove();
  //   }
  //create a new reset token
  let newResetToken = new ResetToken({
    user: user._id,
    resetToken: generateJWTToken(user),
  });
  //save the new reset token
  console.log("saving new reset token");
  console.log(newResetToken);
  await newResetToken.save();

  return {
    resetToken: newResetToken.resetToken,
  };
};

const verifyJWTToken = (token) => {
  console.log("decoding token");
  try {
    let decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("decoded token");
    console.log(decoded);
    return {
      error: false,
      decoded: decoded,
    };
  } catch (err) {
    console.log("error decoding token");
    console.log(err);
    return {
      error: true,
      message: err.message,
    };
  }
};

const resetPassword = catchAsync(async ({ user, newPassword }) => {
  //reset the users password
  let userToReset = await User.findOne({ _id: user });
  if (!userToReset) {
    return {
      message: "user not found",
      error: true,
    };
  }
  userToReset.setPassword(newPassword, (err) => {
    if (err) {
      return {
        message: "error resetting password",
        error: true,
      };
    }
    userToReset.save();
  });
  console.log("password reset");
  return {
    message: "password successfully reset",
    error: false,
  };
});

module.exports = {
  generateJWTToken,
  createResetToken,
  verifyJWTToken,
  resetPassword,
};
