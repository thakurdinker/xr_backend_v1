require("dotenv").config({ path: "../../vars/.env" });
import jwt from "jsonwebtoken";
import User from "../../models/user";
import ResetToken from "../../models/resettoken";

export const generateJWTToken = (user) => {
  let payload = {
    user: {
      id: user._id,
    },
  };
  let token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "30m" });
  return token;
};

export const createResetToken = async ({ email, username }) => {
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

export const verifyJWTToken = (token) => {
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
